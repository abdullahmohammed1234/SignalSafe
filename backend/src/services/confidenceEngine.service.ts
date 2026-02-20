import { Narrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';

export interface ConfidenceResult {
  clusterId: string;
  confidenceScore: number;
  sentimentVariance: number;
  growthVariance: number;
  anomalyStability: number;
}

const normalizeValue = (value: number, min: number, max: number): number => {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

const calculateVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
};

/**
 * Calculate confidence score based on variance metrics
 * Formula: confidenceScore = 100 - normalized(sentimentVariance + growthVariance)
 */
export const calculateConfidence = async (clusterId: string): Promise<ConfidenceResult | null> => {
  try {
    const narrative = await Narrative.findOne({ clusterId });
    const cluster = await Cluster.findOne({ clusterId });

    if (!narrative || !cluster) {
      console.log(`⚠️ No narrative or cluster found for confidence: ${clusterId}`);
      return null;
    }

    // Get history for variance calculation
    const history = narrative.history;
    
    if (history.length < 3) {
      // Low confidence for new narratives
      return {
        clusterId,
        confidenceScore: 30,
        sentimentVariance: 100,
        growthVariance: 100,
        anomalyStability: 0,
      };
    }

    // Calculate sentiment variance from history
    const sentimentValues = history.map(h => h.avgSentiment);
    const sentimentVariance = calculateVariance(sentimentValues);

    // Calculate growth variance from history
    const riskScoreValues = history.map(h => h.riskScore);
    const growthVariance = calculateVariance(riskScoreValues);

    // Calculate anomaly stability based on recent snapshots
    const recentSnapshots = await RiskSnapshot.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    let anomalyStability = 0;
    if (recentSnapshots.length >= 3) {
      const anomalyValues = recentSnapshots.map(s => s.anomalyScore);
      const anomalyMean = anomalyValues.reduce((sum, val) => sum + val, 0) / anomalyValues.length;
      const anomalyDiff = Math.abs(anomalyValues[0] - anomalyMean);
      // Higher stability = lower variance in anomaly scores
      anomalyStability = Math.max(0, 100 - (anomalyDiff * 2));
    }

    // Normalize variances to 0-100 scale
    const normalizedSentimentVariance = normalizeValue(sentimentVariance, 0, 1);
    const normalizedGrowthVariance = normalizeValue(growthVariance, 0, 100);

    // Calculate variance score (weighted combination)
    const varianceScore = (normalizedSentimentVariance * 0.4) + (normalizedGrowthVariance * 0.6);

    // Confidence = 100 - varianceScore, adjusted by anomaly stability
    let confidenceScore = 100 - varianceScore;
    confidenceScore = (confidenceScore * 0.7) + (anomalyStability * 0.3);

    // Clamp to 0-100
    confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

    // Update narrative with confidence score
    narrative.confidenceScore = confidenceScore;
    narrative.lastUpdated = new Date();
    await narrative.save();

    return {
      clusterId,
      confidenceScore,
      sentimentVariance: normalizedSentimentVariance,
      growthVariance: normalizedGrowthVariance,
      anomalyStability,
    };
  } catch (error) {
    console.error('❌ Error calculating confidence:', error);
    return null;
  }
};

/**
 * Process confidence for all clusters
 */
export const processAllConfidence = async (): Promise<ConfidenceResult[]> => {
  const narratives = await Narrative.find();
  const results: ConfidenceResult[] = [];

  for (const narrative of narratives) {
    const result = await calculateConfidence(narrative.clusterId);
    if (result) {
      results.push(result);
    }
  }

  return results;
};

/**
 * Get confidence color based on score
 */
export const getConfidenceColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 50) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

/**
 * Get confidence label based on score
 */
export const getConfidenceLabel = (score: number): string => {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
};
