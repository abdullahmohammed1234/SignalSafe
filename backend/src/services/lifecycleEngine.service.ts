import { Narrative, INarrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { emitNarrativesUpdate } from '../sockets/socket';

export type LifecycleStage = 'Emerging' | 'Accelerating' | 'Peak' | 'Declining';

export interface LifecycleUpdate {
  clusterId: string;
  stage: LifecycleStage;
  growthVelocity: number;
  peakRiskScore: number;
  confidenceScore: number;
  timeToPeakPrediction: number | null;
}

const determineStage = (
  growthRate: number,
  previousGrowthRate: number,
  clusterSize: number,
  previousSize: number
): LifecycleStage => {
  // Calculate actual change
  const sizeChange = clusterSize - previousSize;
  
  // If size is shrinking, it's declining
  if (sizeChange < 0) {
    return 'Declining';
  }
  
  // If growth rate is very low or negative
  if (growthRate < 10) {
    return 'Emerging';
  }
  
  // If growth rate is in the accelerating range
  if (growthRate >= 10 && growthRate <= 40) {
    return 'Accelerating';
  }
  
  // If growth rate is declining but size is still high, it's at peak
  if (growthRate < 10 && clusterSize > 10 && previousSize > 10) {
    return 'Peak';
  }
  
  // Default to accelerating if new
  return 'Accelerating';
};

const calculateGrowthVelocity = (
  currentGrowthRate: number,
  previousGrowthRate: number
): number => {
  // Velocity is the change in growth rate
  return currentGrowthRate - previousGrowthRate;
};

const calculateDecayRate = (
  currentGrowthRate: number,
  previousGrowthRate: number
): number => {
  if (previousGrowthRate <= 0) return 0;
  return (previousGrowthRate - currentGrowthRate) / previousGrowthRate;
};

export const updateNarrativeLifecycle = async (clusterId: string): Promise<LifecycleUpdate | null> => {
  try {
    // Get current cluster data
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster) {
      console.log(`⚠️ No cluster found for lifecycle update: ${clusterId}`);
      return null;
    }

    // Get current risk snapshot for this cluster's risk score
    const currentSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    const currentRiskScore = currentSnapshot?.overallRiskScore || 0;

    // Get previous narrative if exists
    let narrative = await Narrative.findOne({ clusterId });
    const previousSize = narrative?.history.length ? narrative.history[narrative.history.length - 1].clusterSize : 0;
    const previousGrowthRate = narrative?.growthVelocity || 0;
    const previousPeakRiskScore = narrative?.peakRiskScore || 0;

    // Determine lifecycle stage
    const stage = determineStage(
      cluster.growthRate,
      previousGrowthRate,
      cluster.size,
      previousSize
    );

    // Calculate metrics
    const growthVelocity = calculateGrowthVelocity(cluster.growthRate, previousGrowthRate);
    const decayRate = calculateDecayRate(cluster.growthRate, previousGrowthRate);
    const newPeakRiskScore = Math.max(previousPeakRiskScore, currentRiskScore);

    // Build history entry
    const historyEntry = {
      timestamp: new Date(),
      riskScore: currentRiskScore,
      clusterSize: cluster.size,
      avgSentiment: cluster.avgSentiment,
    };

    if (narrative) {
      // Update existing narrative
      narrative.lifecycleStage = stage;
      narrative.growthVelocity = growthVelocity;
      narrative.decayRate = decayRate;
      narrative.peakRiskScore = newPeakRiskScore;
      narrative.lastUpdated = new Date();
      
      // Add to history (keep last 100 entries)
      narrative.history.push(historyEntry);
      if (narrative.history.length > 100) {
        narrative.history = narrative.history.slice(-100);
      }
    } else {
      // Create new narrative
      narrative = new Narrative({
        clusterId,
        firstDetectedAt: new Date(),
        lifecycleStage: stage,
        peakRiskScore: newPeakRiskScore,
        growthVelocity,
        decayRate,
        history: [historyEntry],
        lastUpdated: new Date(),
      });
    }

    await narrative.save();

    // Get confidence from prediction (will be computed by confidence engine)
    const confidenceScore = narrative.confidenceScore || 50;
    const timeToPeakPrediction = narrative.timeToPeakPrediction;

    // Emit update
    emitNarrativesUpdate(await getAllNarratives());

    return {
      clusterId,
      stage,
      growthVelocity,
      peakRiskScore: newPeakRiskScore,
      confidenceScore,
      timeToPeakPrediction,
    };
  } catch (error) {
    console.error('❌ Error updating narrative lifecycle:', error);
    return null;
  }
};

export const getAllNarratives = async (): Promise<INarrative[]> => {
  return await Narrative.find().sort({ growthVelocity: -1 });
};

export const getNarrativeById = async (clusterId: string): Promise<INarrative | null> => {
  return await Narrative.findOne({ clusterId });
};

export const processAllClustersLifecycle = async (): Promise<LifecycleUpdate[]> => {
  const clusters = await Cluster.find();
  const updates: LifecycleUpdate[] = [];

  for (const cluster of clusters) {
    const update = await updateNarrativeLifecycle(cluster.clusterId);
    if (update) {
      updates.push(update);
    }
  }

  return updates;
};
