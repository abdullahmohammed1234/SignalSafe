import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';

export interface UncertaintyInterval {
  predictedPeakTime: number | null;  // minutes
  lowerBound: number;
  upperBound: number;
  confidence: number;  // 0-100
}

export interface UncertaintyResult {
  timestamp: Date;
  riskScore: number;
  predictionInterval: UncertaintyInterval;
  varianceBreakdown: {
    growthVelocity: number;
    sentimentAcceleration: number;
    interactionEffect: number;
    total: number;
  };
  monteCarloRuns: number;
  reliability: 'high' | 'medium' | 'low';
}

// Monte Carlo simulation parameters
const MONTE_CARLO_RUNS = 100;
const VARIANCE_MULTIPLIER = 1.96; // 95% confidence interval

/**
 * Calculate uncertainty propagation for predictions
 */
export const calculateUncertainty = async (): Promise<UncertaintyResult> => {
  // Gather variance components
  const varianceComponents = await calculateVarianceComponents();
  
  // Run Monte Carlo simulation
  const simulationResults = runMonteCarloSimulation(varianceComponents);
  
  // Calculate prediction interval
  const predictionInterval = computePredictionInterval(simulationResults);
  
  // Determine reliability
  const reliability = computeReliability(varianceComponents.total, simulationResults.length);

  // Get current risk score
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const riskScore = latestSnapshot?.overallRiskScore || 0;

  return {
    timestamp: new Date(),
    riskScore,
    predictionInterval,
    varianceBreakdown: varianceComponents,
    monteCarloRuns: MONTE_CARLO_RUNS,
    reliability,
  };
};

/**
 * Calculate prediction interval from simulation results
 */
function computePredictionInterval(simulationResults: number[]): UncertaintyInterval {
  if (simulationResults.length === 0) {
    return {
      predictedPeakTime: null,
      lowerBound: 0,
      upperBound: 0,
      confidence: 0,
    };
  }

  // Sort results for percentile calculation
  const sorted = [...simulationResults].sort((a, b) => a - b);
  
  // Calculate percentiles
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p2_5 = sorted[Math.floor(sorted.length * 0.025)];
  const p97_5 = sorted[Math.floor(sorted.length * 0.975)];
  
  // Calculate confidence based on spread
  const range = p97_5 - p2_5;
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const cv = range / mean; // Coefficient of variation
  
  let confidence = Math.max(0, Math.min(95, 95 - (cv * 100)));

  return {
    predictedPeakTime: Math.round(p50),
    lowerBound: Math.round(p2_5),
    upperBound: Math.round(p97_5),
    confidence: Math.round(confidence),
  };
}

/**
 * Determine reliability based on variance and sample size
 */
function computeReliability(totalVariance: number, sampleSize: number): 'high' | 'medium' | 'low' {
  // High variance = low reliability
  if (totalVariance > 30) return 'low';
  if (totalVariance > 15) return 'medium';
  
  // Low sample size = low reliability
  if (sampleSize < 50) return 'low';
  if (sampleSize < 80) return 'medium';
  
  return 'high';
}

/**
 * Calculate variance components from different sources
 */
async function calculateVarianceComponents(): Promise<{
  growthVelocity: number;
  sentimentAcceleration: number;
  interactionEffect: number;
  total: number;
}> {
  // Get historical data for variance calculation
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(20);

  // Get clusters for additional variance
  const clusters = await Cluster.find();
  
  // Get narratives for growth velocity variance
  const narratives = await Narrative.find({ 
    lifecycleStage: { $in: ['Emerging', 'Accelerating'] } 
  });

  // Calculate variance in growth velocity
  let growthVelocityVariance = 0;
  if (narratives.length > 0) {
    const growthVelocities = narratives.map(n => n.growthVelocity);
    const mean = growthVelocities.reduce((a, b) => a + b, 0) / growthVelocities.length;
    growthVelocityVariance = growthVelocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / growthVelocities.length;
    growthVelocityVariance = Math.sqrt(growthVelocityVariance); // Convert to standard deviation
  }

  // Calculate variance in sentiment acceleration
  let sentimentVariance = 0;
  if (recentSnapshots.length >= 2) {
    const sentiments = recentSnapshots.map(s => s.sentimentAcceleration);
    const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    sentimentVariance = sentiments.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sentiments.length;
    sentimentVariance = Math.sqrt(sentimentVariance);
  }

  // Calculate variance from cluster volatility
  let interactionVariance = 0;
  if (clusters.length > 0) {
    const volatilities = clusters.map(c => c.volatilityIndex);
    const mean = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    interactionVariance = volatilities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volatilities.length;
    interactionVariance = Math.sqrt(interactionVariance) * 100;
  }

  // Calculate total variance (combined)
  const total = Math.sqrt(
    Math.pow(growthVelocityVariance * 10, 2) +
    Math.pow(sentimentVariance, 2) +
    Math.pow(interactionVariance, 2)
  );

  return {
    growthVelocity: Math.round(growthVelocityVariance * 1000) / 1000,
    sentimentAcceleration: Math.round(sentimentVariance * 100) / 100,
    interactionEffect: Math.round(interactionVariance * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Run Monte Carlo simulation for uncertainty estimation
 */
function runMonteCarloSimulation(varianceComponents: {
  growthVelocity: number;
  sentimentAcceleration: number;
  interactionEffect: number;
}): number[] {
  const results: number[] = [];
  
  // Base prediction (from narratives)
  const basePrediction = 45; // Default 45 minutes to peak (would be calculated from actual data)
  
  for (let i = 0; i < MONTE_CARLO_RUNS; i++) {
    // Generate random variations based on variance components
    // Using Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const z3 = Math.random() - 0.5; // Simple uniform for interaction
    
    // Apply variance to base prediction
    const variation = 
      (z1 * varianceComponents.growthVelocity * 5) +
      (z2 * varianceComponents.sentimentAcceleration * 0.5) +
      (z3 * varianceComponents.interactionEffect * 0.3);
    
    const result = Math.max(5, basePrediction + variation); // Minimum 5 minutes
    results.push(result);
  }

  return results;
}

/**
 * Get uncertainty history
 */
export const getUncertaintyHistory = async (limit: number = 20): Promise<UncertaintyResult[]> => {
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(limit);

  // Generate historical uncertainty based on snapshots
  // In production, this would be stored with each snapshot
  const results: UncertaintyResult[] = [];
  
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const variance = 10 + (i * 2); // Simulate increasing variance over time
    
    results.push({
      timestamp: snapshot.timestamp,
      riskScore: snapshot.overallRiskScore,
      predictionInterval: {
        predictedPeakTime: 45 - i * 2,
        lowerBound: 35 - i * 2,
        upperBound: 55 - i * 2,
        confidence: Math.max(50, 85 - i * 3),
      },
      varianceBreakdown: {
        growthVelocity: variance * 0.4,
        sentimentAcceleration: variance * 0.3,
        interactionEffect: variance * 0.3,
        total: variance,
      },
      monteCarloRuns: MONTE_CARLO_RUNS,
      reliability: variance < 15 ? 'high' : variance < 25 ? 'medium' : 'low',
    });
  }

  return results;
};

/**
 * Get prediction with uncertainty for a specific cluster
 */
export const getClusterUncertainty = async (clusterId: string): Promise<UncertaintyInterval | null> => {
  const cluster = await Cluster.findOne({ clusterId });
  if (!cluster) return null;

  const narrative = await Narrative.findOne({ clusterId });
  
  // Base prediction from cluster size and growth rate
  const basePrediction = narrative?.timeToPeakPrediction || 
    (cluster.size > 0 ? 100 / Math.max(0.1, cluster.growthRate) : 60);

  // Calculate variance based on cluster properties
  const growthVariance = cluster.growthRate * 0.2;
  const sizeVariance = (cluster.size / 100) * 5;
  const totalVariance = Math.sqrt(growthVariance * growthVariance + sizeVariance * sizeVariance);

  const lowerBound = Math.max(5, basePrediction - VARIANCE_MULTIPLIER * totalVariance);
  const upperBound = Math.min(180, basePrediction + VARIANCE_MULTIPLIER * totalVariance);

  return {
    predictedPeakTime: Math.round(basePrediction),
    lowerBound: Math.round(lowerBound),
    upperBound: Math.round(upperBound),
    confidence: Math.max(50, 90 - totalVariance),
  };
};
