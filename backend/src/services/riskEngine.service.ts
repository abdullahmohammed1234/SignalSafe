import { RiskSnapshot, IRiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { AIMetrics } from './aiProxy.service';
import { emitRiskUpdate, emitClustersUpdate } from '../sockets/socket';

export interface RiskResult {
  overallRiskScore: number;
  classification: 'Stable' | 'Emerging Concern' | 'Escalation Risk' | 'Panic Formation Likely';
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
}

const normalizeMetric = (value: number, min: number = 0, max: number = 100): number => {
  const normalized = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return normalized;
};

export const computeRiskScore = (metrics: AIMetrics): RiskResult => {
  const normalizedSentimentAcceleration = normalizeMetric(metrics.sentimentAcceleration);
  const normalizedClusterGrowthRate = normalizeMetric(metrics.clusterGrowthRate);
  const normalizedAnomalyScore = normalizeMetric(metrics.anomalyScore);
  const normalizedNarrativeSpreadSpeed = normalizeMetric(metrics.narrativeSpreadSpeed);

  const escalationRiskScore = 
    (normalizedSentimentAcceleration * 0.30) +
    (normalizedClusterGrowthRate * 0.25) +
    (normalizedAnomalyScore * 0.25) +
    (normalizedNarrativeSpreadSpeed * 0.20);

  let classification: RiskResult['classification'];
  if (escalationRiskScore < 30) {
    classification = 'Stable';
  } else if (escalationRiskScore < 60) {
    classification = 'Emerging Concern';
  } else if (escalationRiskScore < 80) {
    classification = 'Escalation Risk';
  } else {
    classification = 'Panic Formation Likely';
  }

  return {
    overallRiskScore: Math.round(escalationRiskScore * 100) / 100,
    classification,
    sentimentAcceleration: normalizedSentimentAcceleration,
    clusterGrowthRate: normalizedClusterGrowthRate,
    anomalyScore: normalizedAnomalyScore,
    narrativeSpreadSpeed: normalizedNarrativeSpreadSpeed,
  };
};

export const saveRiskSnapshot = async (riskResult: RiskResult): Promise<IRiskSnapshot> => {
  const snapshot = new RiskSnapshot({
    overallRiskScore: riskResult.overallRiskScore,
    sentimentAcceleration: riskResult.sentimentAcceleration,
    clusterGrowthRate: riskResult.clusterGrowthRate,
    anomalyScore: riskResult.anomalyScore,
    narrativeSpreadSpeed: riskResult.narrativeSpreadSpeed,
    classification: riskResult.classification,
    timestamp: new Date(),
  });

  const saved = await snapshot.save();
  
  // Emit WebSocket update
  emitRiskUpdate(saved);
  
  return saved;
};

export const updateClusters = async (clusters: any[]): Promise<void> => {
  for (const clusterData of clusters) {
    await Cluster.findOneAndUpdate(
      { clusterId: clusterData.clusterId },
      {
        keywords: clusterData.keywords,
        size: clusterData.size,
        avgSentiment: clusterData.avgSentiment,
        growthRate: clusterData.growthRate,
        volatilityIndex: clusterData.volatilityIndex,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  const allClusters = await Cluster.find().sort({ growthRate: -1 });
  emitClustersUpdate(allClusters);
};

export const getLatestRiskSnapshot = async (): Promise<IRiskSnapshot | null> => {
  return await RiskSnapshot.findOne().sort({ timestamp: -1 });
};

export const getActiveClusters = async (): Promise<any[]> => {
  return await Cluster.find().sort({ growthRate: -1 });
};
