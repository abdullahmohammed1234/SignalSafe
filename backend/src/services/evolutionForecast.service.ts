/**
 * Narrative Evolution Forecast Service
 * 
 * Forecasts:
 * - Sentiment trajectory
 * - Mutation likelihood
 * - Cluster branching probability
 * - Time-to-saturation
 */

import { Narrative, INarrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { NarrativeInteraction } from '../models/NarrativeInteraction';

// Forecast result interface
export interface NarrativeForecast {
  narrativeId: string;
  currentStage: string;
  nextStageProbability: number;
  mutationRisk: number;
  spreadVelocity: number;
  projectedPeakWindow: {
    earliest: Date;
    latest: Date;
    peakProbability: number;
  };
  branchingProbability: number;
  saturationTime: Date | null;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
  }[];
}

// Stage progression
const stageProgression = [
  'Dormant',
  'Emerging',
  'Accelerating',
  'Peak',
  'Declining',
  'Recovered'
];

/**
 * Calculate sentiment trajectory
 */
const calculateSentimentTrajectory = async (
  narrative: INarrative
): Promise<{
  trend: 'improving' | 'stable' | 'degrading';
  projectedChange: number;
  confidence: number;
}> => {
  // Get historical sentiment data
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(20);

  if (snapshots.length < 5) {
    return { trend: 'stable', projectedChange: 0, confidence: 30 };
  }

  // Calculate trend
  const recent = snapshots.slice(0, Math.floor(snapshots.length / 2));
  const older = snapshots.slice(Math.floor(snapshots.length / 2));

  const recentAvg = recent.reduce((sum, s) => sum + s.overallRiskScore, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.overallRiskScore, 0) / older.length;

  const change = recentAvg - olderAvg;
  
  let trend: 'improving' | 'stable' | 'degrading';
  if (change > 5) {
    trend = 'degrading';
  } else if (change < -5) {
    trend = 'improving';
  } else {
    trend = 'stable';
  }

  // Project change
  const velocity = change / (recent.length * 0.5); // Per hour estimate
  const projectedChange = velocity * 6; // 6 hour projection

  const confidence = Math.min(90, 50 + snapshots.length * 2);

  return { trend, projectedChange, confidence };
};

/**
 * Calculate mutation likelihood
 */
const calculateMutationLikelihood = async (
  narrative: INarrative,
  clusters: any[]
): Promise<{
  likelihood: number;
  potentialMutations: string[];
}> => {
  // Factors that contribute to mutation
  let mutationScore = 0;
  const potentialMutations: string[] = [];

  // High volatility increases mutation likelihood
  const cluster = clusters.find(c => c.clusterId === narrative.clusterId);
  if (cluster && cluster.volatilityIndex > 0.6) {
    mutationScore += 30;
    potentialMutations.push('Sentiment Polarity Shift');
  }

  // Multiple interactions increase mutation likelihood
  const interactions = await NarrativeInteraction.find({
    $or: [{ narrativeA: narrative.clusterId }, { narrativeB: narrative.clusterId }]
  });

  if (interactions.length > 3) {
    mutationScore += 25;
    potentialMutations.push('Narrative Fusion');
  }

  // High growth velocity increases mutation
  if (narrative.growthVelocity && narrative.growthVelocity > 0.5) {
    mutationScore += 20;
    potentialMutations.push('Topic Drift');
  }

  // Regional spread increases mutation
  if (clusters.length > 5) {
    mutationScore += 15;
    potentialMutations.push('Regional Variation');
  }

  return {
    likelihood: Math.min(100, mutationScore),
    potentialMutations,
  };
};

/**
 * Calculate cluster branching probability
 */
const calculateBranchingProbability = async (
  narrative: INarrative
): Promise<{
  probability: number;
  likelyBranches: string[];
}> => {
  // Get interactions to find connected narratives
  const interactions = await NarrativeInteraction.find({
    $or: [{ narrativeA: narrative.clusterId }, { narrativeB: narrative.clusterId }]
  });

  if (interactions.length === 0) {
    return { probability: 10, likelyBranches: [] };
  }

  // Calculate branching probability based on interaction patterns
  let probability = interactions.length * 10;
  
  // High growth velocity increases branching
  if (narrative.growthVelocity && narrative.growthVelocity > 0.4) {
    probability += 20;
  }

  // Early stage narratives branch more
  const stageIndex = stageProgression.indexOf(narrative.lifecycleStage);
  if (stageIndex < 2) {
    probability += 15;
  }

  // Identify likely branches from interactions
  const likelyBranches: string[] = [];
  for (const interaction of interactions) {
    const branchId = interaction.narrativeA === narrative.clusterId 
      ? interaction.narrativeB 
      : interaction.narrativeA;
    likelyBranches.push(branchId);
  }

  return {
    probability: Math.min(100, probability),
    likelyBranches: likelyBranches.slice(0, 5),
  };
};

/**
 * Calculate time-to-saturation
 */
const calculateTimeToSaturation = async (
  narrative: INarrative,
  currentRisk: number
): Promise<{
  saturationTime: Date | null;
  confidence: number;
}> => {
  // If already at peak or declining, no saturation time
  if (narrative.lifecycleStage === 'Peak' || narrative.lifecycleStage === 'Declining') {
    return { saturationTime: null, confidence: 90 };
  }

  // Estimate based on growth velocity
  const velocity = narrative.growthVelocity || 0.3;
  
  // Calculate time to reach 80% risk (saturation)
  const remainingRisk = 80 - currentRisk;
  if (remainingRisk <= 0) {
    return { saturationTime: new Date(), confidence: 80 };
  }

  // Time in hours based on velocity
  const hoursToSaturation = remainingRisk / (velocity * 10);
  
  const saturationTime = new Date(Date.now() + hoursToSaturation * 3600000);
  
  const confidence = Math.min(85, 40 + velocity * 50);

  return { saturationTime, confidence };
};

/**
 * Generate forecast for a single narrative
 */
export const generateNarrativeForecast = async (
  narrativeId: string
): Promise<NarrativeForecast | null> => {
  const narrative = await Narrative.findOne({ clusterId: narrativeId });
  if (!narrative) {
    return null;
  }

  const clusters = await Cluster.find();
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const currentRisk = latestSnapshot?.overallRiskScore || 0;

  // Calculate all forecast components
  const sentiment = await calculateSentimentTrajectory(narrative);
  const mutation = await calculateMutationLikelihood(narrative, clusters);
  const branching = await calculateBranchingProbability(narrative);
  const saturation = await calculateTimeToSaturation(narrative, currentRisk);

  // Calculate next stage probability
  const stageIndex = stageProgression.indexOf(narrative.lifecycleStage);
  let nextStageProbability = 30; // Default
  
  if (narrative.growthVelocity) {
    nextStageProbability = Math.min(95, narrative.growthVelocity * 60 + 20);
  }

  // Calculate projected peak window
  let projectedPeakWindow;
  if (saturation.saturationTime) {
    const variance = (100 - saturation.confidence) * 0.5; // hours
    projectedPeakWindow = {
      earliest: new Date(saturation.saturationTime.getTime() - variance * 3600000),
      latest: new Date(saturation.saturationTime.getTime() + variance * 3600000),
      peakProbability: saturation.confidence,
    };
  } else {
    projectedPeakWindow = {
      earliest: new Date(),
      latest: new Date(),
      peakProbability: 100,
    };
  }

  // Build factors
  const factors = [];
  if (narrative.growthVelocity) {
    factors.push({
      factor: 'Growth Velocity',
      impact: narrative.growthVelocity * 30,
      direction: narrative.growthVelocity > 0.4 ? 'positive' : 'negative',
    });
  }
  if (sentiment.trend === 'degrading') {
    factors.push({
      factor: 'Sentiment Trend',
      impact: 25,
      direction: 'positive',
    });
  }
  if (mutation.likelihood > 50) {
    factors.push({
      factor: 'Mutation Risk',
      impact: mutation.likelihood * 0.3,
      direction: 'positive',
    });
  }

  return {
    narrativeId,
    currentStage: narrative.lifecycleStage,
    nextStageProbability: Math.round(nextStageProbability),
    mutationRisk: mutation.likelihood,
    spreadVelocity: Math.round((narrative.growthVelocity || 0) * 100),
    projectedPeakWindow,
    branchingProbability: branching.probability,
    saturationTime: saturation.saturationTime,
    confidence: Math.round((sentiment.confidence + saturation.confidence) / 2),
    factors,
  };
};

/**
 * Generate forecasts for all active narratives
 */
export const generateAllForecasts = async (): Promise<{
  forecasts: NarrativeForecast[];
  summary: {
    avgMutationRisk: number;
    avgBranchingProbability: number;
    narrativesAtRisk: number;
    projectedPeakWindows: Date[];
  };
}> => {
  const narratives = await Narrative.find({
    lifecycleStage: { $ne: 'Recovered' }
  });

  const forecasts: NarrativeForecast[] = [];

  for (const narrative of narratives) {
    const forecast = await generateNarrativeForecast(narrative.clusterId);
    if (forecast) {
      forecasts.push(forecast);
    }
  }

  // Calculate summary
  const summary = {
    avgMutationRisk: forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.mutationRisk, 0) / forecasts.length
      : 0,
    avgBranchingProbability: forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.branchingProbability, 0) / forecasts.length
      : 0,
    narrativesAtRisk: forecasts.filter(f => f.mutationRisk > 40 || f.branchingProbability > 50).length,
    projectedPeakWindows: forecasts
      .filter(f => f.projectedPeakWindow.earliest > new Date())
      .sort((a, b) => a.projectedPeakWindow.earliest.getTime() - b.projectedPeakWindow.earliest.getTime())
      .slice(0, 5)
      .map(f => f.projectedPeakWindow.earliest),
  };

  return { forecasts, summary };
};

/**
 * Get critical forecasts (high risk narratives)
 */
export const getCriticalForecasts = async (): Promise<NarrativeForecast[]> => {
  const { forecasts } = await generateAllForecasts();

  return forecasts.filter(f => 
    f.mutationRisk > 60 || 
    f.branchingProbability > 70 ||
    f.nextStageProbability > 80
  ).sort((a, b) => b.nextStageProbability - a.nextStageProbability);
};

/**
 * Get forecast timeline
 */
export const getForecastTimeline = async (): Promise<{
  timelines: {
    narrativeId: string;
    stages: { stage: string; probability: number; time: Date | null }[];
  }[];
}> => {
  const { forecasts } = await generateAllForecasts();

  const timelines = forecasts.map(forecast => {
    const currentIndex = stageProgression.indexOf(forecast.currentStage);
    const stages = [];

    // Add current stage
    stages.push({
      stage: forecast.currentStage,
      probability: 100 - forecast.nextStageProbability,
      time: null,
    });

    // Add projected next stages
    if (currentIndex < stageProgression.length - 1) {
      stages.push({
        stage: stageProgression[currentIndex + 1],
        probability: forecast.nextStageProbability,
        time: forecast.projectedPeakWindow.earliest,
      });
    }

    return {
      narrativeId: forecast.narrativeId,
      stages,
    };
  });

  return { timelines };
};
