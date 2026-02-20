import { RegionalRisk, IRegionalRisk } from '../models/RegionalRisk';
import { Post } from '../models/Post';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { emitRegionalRiskUpdate } from '../sockets/socket';

export interface RegionalRiskData {
  region: string;
  country: string;
  state: string | null;
  city: string | null;
  riskScore: number;
  clusterCount: number;
  anomalyScore: number;
  dominantNarrativeId: string | null;
  deviationFromBaseline: number;
  sentimentTrend: number;
  growthRate: number;
  postVolume: number;
}

// Parse region string into components
const parseRegion = (regionStr: string): { country: string; state: string | null; city: string | null } => {
  const parts = regionStr.split('/').map(p => p.trim());
  
  if (parts.length === 1) {
    return { country: parts[0], state: null, city: null };
  } else if (parts.length === 2) {
    return { country: parts[0], state: parts[1], city: null };
  } else if (parts.length >= 3) {
    return { country: parts[0], state: parts[1], city: parts[2] };
  }
  
  return { country: regionStr, state: null, city: null };
};

// Calculate regional risk score based on posts and clusters in that region
const calculateRegionalRisk = async (region: string): Promise<RegionalRiskData | null> => {
  try {
    // Get posts for this region
    const posts = await Post.find({ region }).sort({ createdAt: -1 });
    
    if (posts.length === 0) {
      return null;
    }
    
    // Get clusters for this region (via clusterId)
    const clusterIds = [...new Set(posts.filter(p => p.clusterId).map(p => p.clusterId))];
    const clusters = await Cluster.find({ clusterId: { $in: clusterIds } });
    
    // Get latest global snapshot for baseline comparison
    const globalSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    const globalBaseline = globalSnapshot?.overallRiskScore || 30;
    
    // Calculate metrics
    const postVolume = posts.length;
    
    // Calculate sentiment trend (average sentiment over recent posts)
    const recentPosts = posts.slice(0, Math.min(50, posts.length));
    const avgSentiment = recentPosts.reduce((sum, p) => sum + (p.sentimentScore || 0), 0) / recentPosts.length;
    
    // Calculate growth rate based on posts over time windows
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const recentPostsCount = posts.filter(p => p.createdAt >= oneHourAgo).length;
    const olderPostsCount = posts.filter(p => p.createdAt >= twoHoursAgo && p.createdAt < oneHourAgo).length;
    
    const growthRate = olderPostsCount > 0 
      ? ((recentPostsCount - olderPostsCount) / olderPostsCount) * 100 
      : 0;
    
    // Calculate cluster metrics
    const clusterCount = clusters.length;
    const avgClusterGrowth = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.growthRate, 0) / clusters.length
      : 0;
    const avgVolatility = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.volatilityIndex, 0) / clusters.length
      : 0;
    
    // Find dominant narrative (cluster with highest growth rate)
    const dominantCluster = clusters.length > 0
      ? clusters.reduce((max, c) => c.growthRate > max.growthRate ? c : max, clusters[0])
      : null;
    
    // Calculate risk score components
    const sentimentRisk = Math.max(0, (1 - avgSentiment) * 25); // Negative sentiment increases risk
    const volumeRisk = Math.min(25, (postVolume / 100) * 25); // More posts = higher risk
    const growthRisk = Math.min(25, Math.max(0, growthRate * 0.5)); // Growth rate contribution
    const volatilityRisk = avgVolatility * 25; // Volatility contribution
    
    const riskScore = Math.round(sentimentRisk + volumeRisk + growthRisk + volatilityRisk);
    const deviationFromBaseline = Math.round(riskScore - globalBaseline);
    
    // Anomaly score based on deviation from normal patterns
    const anomalyScore = Math.min(100, Math.max(0, Math.abs(deviationFromBaseline) + (avgVolatility * 50)));
    
    const parsedRegion = parseRegion(region);
    
    return {
      region,
      country: parsedRegion.country,
      state: parsedRegion.state,
      city: parsedRegion.city,
      riskScore,
      clusterCount,
      anomalyScore,
      dominantNarrativeId: dominantCluster?.clusterId || null,
      deviationFromBaseline,
      sentimentTrend: avgSentiment,
      growthRate,
      postVolume,
    };
  } catch (error) {
    console.error(`Error calculating regional risk for ${region}:`, error);
    return null;
  }
};

// Compute and save regional risks for all regions
export const computeAllRegionalRisks = async (): Promise<IRegionalRisk[]> => {
  try {
    // Get all unique regions
    const regions = await Post.distinct('region');
    
    const regionalRisks: IRegionalRisk[] = [];
    
    for (const region of regions) {
      const riskData = await calculateRegionalRisk(region);
      
      if (riskData) {
        const regionalRisk = new RegionalRisk({
          region: riskData.region,
          country: riskData.country,
          state: riskData.state,
          city: riskData.city,
          riskScore: riskData.riskScore,
          clusterCount: riskData.clusterCount,
          anomalyScore: riskData.anomalyScore,
          dominantNarrativeId: riskData.dominantNarrativeId,
          deviationFromBaseline: riskData.deviationFromBaseline,
          sentimentTrend: riskData.sentimentTrend,
          growthRate: riskData.growthRate,
          postVolume: riskData.postVolume,
          timestamp: new Date(),
        });
        
        await regionalRisk.save();
        regionalRisks.push(regionalRisk);
      }
    }
    
    // Emit WebSocket update
    if (regionalRisks.length > 0) {
      const sortedRisks = regionalRisks.sort((a, b) => b.riskScore - a.riskScore);
      emitRegionalRiskUpdate(sortedRisks);
    }
    
    return regionalRisks;
  } catch (error) {
    console.error('Error computing all regional risks:', error);
    return [];
  }
};

// Get latest regional risks sorted by risk score
export const getLatestRegionalRisks = async (): Promise<IRegionalRisk[]> => {
  try {
    // Get the most recent entry for each region
    const regions = await RegionalRisk.distinct('region');
    const latestRisks: IRegionalRisk[] = [];
    
    for (const region of regions) {
      const latest = await RegionalRisk.findOne({ region }).sort({ timestamp: -1 });
      if (latest) {
        latestRisks.push(latest);
      }
    }
    
    return latestRisks.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    console.error('Error getting latest regional risks:', error);
    return [];
  }
};

// Get regional risk for a specific region
export const getRegionalRiskByRegion = async (region: string): Promise<IRegionalRisk | null> => {
  return await RegionalRisk.findOne({ region }).sort({ timestamp: -1 });
};

// Get risk by country
export const getRisksByCountry = async (country: string): Promise<IRegionalRisk[]> => {
  return await RegionalRisk.find({ country }).sort({ timestamp: -1, riskScore: -1 });
};

// Get historical regional risk data
export const getRegionalRiskHistory = async (region: string, hoursBack: number = 24): Promise<IRegionalRisk[]> => {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return await RegionalRisk.find({ 
    region, 
    timestamp: { $gte: cutoff } 
  }).sort({ timestamp: 1 });
};
