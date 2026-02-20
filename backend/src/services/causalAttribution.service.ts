import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { NarrativeInteraction } from '../models/NarrativeInteraction';
import { RiskSnapshot } from '../models/RiskSnapshot';

export interface SignalContribution {
  signalName: string;
  signalKey: string;
  contribution: number;      // Percentage (0-100)
  rawValue: number;
  normalizedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CausalAttributionResult {
  timestamp: Date;
  totalRiskScore: number;
  signalContributions: SignalContribution[];
  topDriver: string;
  confidenceLevel: number;
  narrative: string;
}

// Feature weights (these would be learned from historical data)
const FEATURE_WEIGHTS = {
  sentimentAcceleration: 0.28,
  clusterGrowth: 0.24,
  interactionEffect: 0.18,
  anomalyScore: 0.17,
  mutationDrift: 0.13,
};

/**
 * Calculate causal attribution for current risk state
 */
export const calculateCausalAttribution = async (): Promise<CausalAttributionResult> => {
  // Gather all feature values
  const features = await gatherRiskFeatures();

  // Normalize features to 0-1 scale
  const normalizedFeatures = normalizeFeatures(features);

  // Calculate contribution weights
  const contributions = await calculateContributions(features, normalizedFeatures);

  // Sort by contribution
  const sortedContributions = [...contributions].sort((a, b) => b.contribution - a.contribution);

  // Generate narrative
  const topDriver = sortedContributions[0];
  const narrative = generateAttributionNarrative(sortedContributions);

  // Calculate confidence based on data quality
  const confidenceLevel = calculateConfidence(features);

  return {
    timestamp: new Date(),
    totalRiskScore: features.totalRiskScore,
    signalContributions: sortedContributions,
    topDriver: topDriver?.signalName || 'Unknown',
    confidenceLevel,
    narrative,
  };
}

// Define type for features
interface RiskFeatures {
  sentimentAcceleration: number;
  clusterGrowth: number;
  interactionEffect: number;
  anomalyScore: number;
  mutationDrift: number;
  totalRiskScore: number;
  historicalSnapshots: number;
}

/**
 * Gather all risk-related features
 */
async function gatherRiskFeatures(): Promise<RiskFeatures> {
  // Get latest snapshot
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  
  // Get recent snapshots for trend analysis
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(10);

  // Get active clusters
  const clusters = await Cluster.find().sort({ growthRate: -1 });

  // Get active interactions
  const activeInteractions = await NarrativeInteraction.find({ isActive: true });

  // Get narratives for mutation drift
  const narratives = await Narrative.find({ 
    lifecycleStage: { $in: ['Emerging', 'Accelerating'] } 
  });

  // Calculate sentiment acceleration (trend)
  let sentimentAcceleration = latestSnapshot?.sentimentAcceleration || 0;
  if (recentSnapshots.length >= 3) {
    const recent = recentSnapshots.slice(0, 3).map(s => s.sentimentAcceleration);
    const older = recentSnapshots.slice(3, 6).map(s => s.sentimentAcceleration);
    if (older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      sentimentAcceleration = (recentAvg + olderAvg) / 2; // Combined for stability
    }
  }

  // Calculate cluster growth
  let clusterGrowth = latestSnapshot?.clusterGrowthRate || 0;
  if (clusters.length > 0) {
    const topGrowthRates = clusters.slice(0, 3).map(c => c.growthRate);
    clusterGrowth = topGrowthRates.reduce((a, b) => a + b, 0) / topGrowthRates.length;
  }

  // Calculate interaction effect
  let interactionEffect = 0;
  if (activeInteractions.length > 0) {
    const avgInteraction = activeInteractions.reduce((sum, i) => sum + i.interactionScore, 0) / activeInteractions.length;
    interactionEffect = avgInteraction * 100;
  }

  // Anomaly score
  let anomalyScore = latestSnapshot?.anomalyScore || 0;
  if (clusters.length > 0) {
    const maxVolatility = Math.max(...clusters.map(c => c.volatilityIndex));
    anomalyScore = (anomalyScore + maxVolatility * 100) / 2;
  }

  // Mutation drift (change in narrative characteristics)
  let mutationDrift = 0;
  if (narratives.length > 0) {
    // Calculate how much narratives have changed
    const growthVelocities = narratives.map(n => n.growthVelocity);
    const avgVelocity = growthVelocities.reduce((a, b) => a + b, 0) / growthVelocities.length;
    mutationDrift = Math.min(100, avgVelocity);
  }

  return {
    sentimentAcceleration,
    clusterGrowth,
    interactionEffect,
    anomalyScore,
    mutationDrift,
    totalRiskScore: latestSnapshot?.overallRiskScore || 0,
    historicalSnapshots: recentSnapshots.length,
  };
}

/**
 * Normalize features to 0-1 scale
 */
function normalizeFeatures(features: RiskFeatures): RiskFeatures {
  return {
    sentimentAcceleration: features.sentimentAcceleration / 100,
    clusterGrowth: features.clusterGrowth / 100,
    interactionEffect: features.interactionEffect / 100,
    anomalyScore: features.anomalyScore / 100,
    mutationDrift: features.mutationDrift / 100,
    totalRiskScore: features.totalRiskScore,
    historicalSnapshots: features.historicalSnapshots,
  };
}

/**
 * Calculate contribution weights for each signal
 */
async function calculateContributions(
  rawFeatures: RiskFeatures,
  normalizedFeatures: RiskFeatures
): Promise<SignalContribution[]> {
  const contributions: SignalContribution[] = [];

  // Calculate trend for each feature
  const trends = await calculateTrends(rawFeatures);

  // Sentiment Acceleration
  const sentimentContribution = normalizedFeatures.sentimentAcceleration * FEATURE_WEIGHTS.sentimentAcceleration * 100;
  contributions.push({
    signalName: 'Sentiment Acceleration',
    signalKey: 'sentimentAcceleration',
    contribution: sentimentContribution,
    rawValue: rawFeatures.sentimentAcceleration,
    normalizedValue: normalizedFeatures.sentimentAcceleration,
    trend: trends.sentimentAcceleration,
    impactLevel: getImpactLevel(sentimentContribution),
  });

  // Cluster Growth
  const clusterContribution = normalizedFeatures.clusterGrowth * FEATURE_WEIGHTS.clusterGrowth * 100;
  contributions.push({
    signalName: 'Cluster Growth',
    signalKey: 'clusterGrowth',
    contribution: clusterContribution,
    rawValue: rawFeatures.clusterGrowth,
    normalizedValue: normalizedFeatures.clusterGrowth,
    trend: trends.clusterGrowth,
    impactLevel: getImpactLevel(clusterContribution),
  });

  // Interaction Effect
  const interactionContribution = normalizedFeatures.interactionEffect * FEATURE_WEIGHTS.interactionEffect * 100;
  contributions.push({
    signalName: 'Interaction Effect',
    signalKey: 'interactionEffect',
    contribution: interactionContribution,
    rawValue: rawFeatures.interactionEffect,
    normalizedValue: normalizedFeatures.interactionEffect,
    trend: trends.interactionEffect,
    impactLevel: getImpactLevel(interactionContribution),
  });

  // Anomaly Score
  const anomalyContribution = normalizedFeatures.anomalyScore * FEATURE_WEIGHTS.anomalyScore * 100;
  contributions.push({
    signalName: 'Anomaly Score',
    signalKey: 'anomalyScore',
    contribution: anomalyContribution,
    rawValue: rawFeatures.anomalyScore,
    normalizedValue: normalizedFeatures.anomalyScore,
    trend: trends.anomalyScore,
    impactLevel: getImpactLevel(anomalyContribution),
  });

  // Mutation Drift
  const mutationContribution = normalizedFeatures.mutationDrift * FEATURE_WEIGHTS.mutationDrift * 100;
  contributions.push({
    signalName: 'Mutation Drift',
    signalKey: 'mutationDrift',
    contribution: mutationContribution,
    rawValue: rawFeatures.mutationDrift,
    normalizedValue: normalizedFeatures.mutationDrift,
    trend: trends.mutationDrift,
    impactLevel: getImpactLevel(mutationContribution),
  });

  // Normalize contributions to sum to 100%
  const total = contributions.reduce((sum, c) => sum + c.contribution, 0);
  if (total > 0) {
    for (const c of contributions) {
      c.contribution = Math.round((c.contribution / total) * 10000) / 100;
    }
  }

  return contributions;
}

/**
 * Calculate trends for each feature
 */
async function calculateTrends(features: Awaited<ReturnType<typeof gatherRiskFeatures>>): Promise<{
  sentimentAcceleration: 'increasing' | 'decreasing' | 'stable';
  clusterGrowth: 'increasing' | 'decreasing' | 'stable';
  interactionEffect: 'increasing' | 'decreasing' | 'stable';
  anomalyScore: 'increasing' | 'decreasing' | 'stable';
  mutationDrift: 'increasing' | 'decreasing' | 'stable';
}> {
  // Get historical data for trend analysis
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(6);

  if (snapshots.length < 3) {
    return {
      sentimentAcceleration: 'stable',
      clusterGrowth: 'stable',
      interactionEffect: 'stable',
      anomalyScore: 'stable',
      mutationDrift: 'stable',
    };
  }

  const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
    if (values.length < 2) return 'stable';
    const recentAvg = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);
    const olderAvg = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);
    const diff = recentAvg - olderAvg;
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  };

  return {
    sentimentAcceleration: calculateTrend(snapshots.map(s => s.sentimentAcceleration)),
    clusterGrowth: calculateTrend(snapshots.map(s => s.clusterGrowthRate)),
    interactionEffect: 'stable', // Would need interaction history
    anomalyScore: calculateTrend(snapshots.map(s => s.anomalyScore)),
    mutationDrift: 'stable', // Would need narrative history
  };
}

/**
 * Get impact level based on contribution percentage
 */
function getImpactLevel(contribution: number): 'low' | 'medium' | 'high' | 'critical' {
  if (contribution >= 30) return 'critical';
  if (contribution >= 20) return 'high';
  if (contribution >= 10) return 'medium';
  return 'low';
}

/**
 * Generate human-readable attribution narrative
 */
function generateAttributionNarrative(contributions: SignalContribution[]): string {
  const top = contributions[0];
  const second = contributions[1];
  
  if (!top) return 'Insufficient data for attribution analysis.';

  let narrative = `Risk is primarily driven by ${top.signalName.toLowerCase()}`;
  
  if (top.contribution > 40) {
    narrative += `, which accounts for ${top.contribution}% of the current risk level.`;
  } else if (second) {
    narrative += ` (${top.contribution}%), with ${second.signalName.toLowerCase()} also contributing significantly (${second.contribution}%).`;
  } else {
    narrative += `.`;
  }

  if (top.trend === 'increasing') {
    narrative += ` This driver is trending upward and requires monitoring.`;
  }

  return narrative;
}

/**
 * Calculate confidence in attribution
 */
function calculateConfidence(features: RiskFeatures): number {
  let confidence = 50; // Base confidence

  // More historical data = higher confidence
  if (features.historicalSnapshots >= 10) {
    confidence += 20;
  } else if (features.historicalSnapshots >= 5) {
    confidence += 10;
  }

  // Complete features = higher confidence
  let featureCount = 0;
  if (features.sentimentAcceleration > 0) featureCount++;
  if (features.clusterGrowth > 0) featureCount++;
  if (features.interactionEffect > 0) featureCount++;
  if (features.anomalyScore > 0) featureCount++;
  if (features.mutationDrift > 0) featureCount++;

  confidence += featureCount * 6;

  return Math.min(95, Math.max(20, confidence));
}

/**
 * Get attribution for a specific time range
 */
export const getAttributionHistory = async (
  startTime: Date,
  endTime: Date
): Promise<CausalAttributionResult[]> => {
  const snapshots = await RiskSnapshot.find({
    timestamp: { $gte: startTime, $lte: endTime },
  }).sort({ timestamp: -1 });

  // For each snapshot, calculate what the attribution would have been
  // This is a simplified version - in production you'd store attribution with each snapshot
  const results: CausalAttributionResult[] = [];
  
  for (const snapshot of snapshots) {
    results.push({
      timestamp: snapshot.timestamp,
      totalRiskScore: snapshot.overallRiskScore,
      signalContributions: [
        {
          signalName: 'Sentiment Acceleration',
          signalKey: 'sentimentAcceleration',
          contribution: 28,
          rawValue: snapshot.sentimentAcceleration,
          normalizedValue: snapshot.sentimentAcceleration / 100,
          trend: 'stable',
          impactLevel: 'high',
        },
        {
          signalName: 'Cluster Growth',
          signalKey: 'clusterGrowth',
          contribution: 24,
          rawValue: snapshot.clusterGrowthRate,
          normalizedValue: snapshot.clusterGrowthRate / 100,
          trend: 'stable',
          impactLevel: 'high',
        },
        {
          signalName: 'Interaction Effect',
          signalKey: 'interactionEffect',
          contribution: 18,
          rawValue: 0,
          normalizedValue: 0,
          trend: 'stable',
          impactLevel: 'medium',
        },
        {
          signalName: 'Anomaly Score',
          signalKey: 'anomalyScore',
          contribution: 17,
          rawValue: snapshot.anomalyScore,
          normalizedValue: snapshot.anomalyScore / 100,
          trend: 'stable',
          impactLevel: 'medium',
        },
        {
          signalName: 'Mutation Drift',
          signalKey: 'mutationDrift',
          contribution: 13,
          rawValue: 0,
          normalizedValue: 0,
          trend: 'stable',
          impactLevel: 'low',
        },
      ],
      topDriver: 'Sentiment Acceleration',
      confidenceLevel: 75,
      narrative: 'Historical attribution analysis.',
    });
  }

  return results;
};
