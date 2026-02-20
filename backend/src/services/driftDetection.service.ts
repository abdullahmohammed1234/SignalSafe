/**
 * Drift Detection Engine Service
 * 
 * Detects:
 * - Feature distribution drift
 * - Prediction distribution drift
 * - Concept drift (performance degradation)
 * 
 * Implements:
 * - Population Stability Index (PSI)
 * - KL Divergence
 * - Rolling accuracy delta
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { ModelPerformance } from '../models/ModelPerformance';

// Drift thresholds
const PSI_THRESHOLD = 0.25;
const KL_THRESHOLD = 0.1;
const ACCURACY_DELTA_THRESHOLD = 0.15;
const RECENT_WINDOW_SIZE = 50;
const BASELINE_WINDOW_SIZE = 200;

// Drift status
export interface DriftStatus {
  featureDriftDetected: boolean;
  predictionDriftDetected: boolean;
  conceptDriftDetected: boolean;
  overallDriftScore: number;
  featurePSI: number;
  predictionPSI: number;
  klDivergence: number;
  accuracyDelta: number;
  timestamp: Date;
  recommendations: string[];
}

// Drift history
let driftHistory: DriftStatus[] = [];

// Current model status
let modelStatus: 'Stable' | 'DriftDetected' | 'Retraining' | 'Optimizing' = 'Stable';

/**
 * Calculate Population Stability Index (PSI)
 * Measures how much a distribution has changed between two time periods
 */
const calculatePSI = (actual: number[], expected: number[], bins: number = 10): number => {
  if (actual.length === 0 || expected.length === 0) {
    return 0;
  }

  // Find range
  const min = Math.min(...expected, ...actual);
  const max = Math.max(...expected, ...actual);
  const binWidth = (max - min) / bins;

  // Calculate expected percentages
  const expectedBins = new Array(bins).fill(0);
  for (const val of expected) {
    const binIndex = Math.min(bins - 1, Math.floor((val - min) / binWidth));
    expectedBins[binIndex]++;
  }

  // Calculate actual percentages
  const actualBins = new Array(bins).fill(0);
  for (const val of actual) {
    const binIndex = Math.min(bins - 1, Math.floor((val - min) / binWidth));
    actualBins[binIndex]++;
  }

  // Calculate PSI
  let psi = 0;
  for (let i = 0; i < bins; i++) {
    const expectedPct = expectedBins[i] / expected.length;
    const actualPct = actualBins[i] / actual.length;

    // Handle edge cases
    if (expectedPct === 0 || actualPct === 0) {
      continue;
    }

    psi += (actualPct - expectedPct) * Math.log(actualPct / expectedPct);
  }

  return Math.abs(psi);
};

/**
 * Calculate KL Divergence
 */
const calculateKL = (actual: number[], expected: number[], bins: number = 10): number => {
  if (actual.length === 0 || expected.length === 0) {
    return 0;
  }

  // Find range
  const min = Math.min(...expected, ...actual);
  const max = Math.max(...expected, ...actual);
  const binWidth = (max - min) / bins;

  // Calculate probability distributions
  const expectedDist = new Array(bins).fill(0);
  const actualDist = new Array(bins).fill(0);

  for (const val of expected) {
    const binIndex = Math.min(bins - 1, Math.floor((val - min) / binWidth));
    expectedDist[binIndex]++;
  }

  for (const val of actual) {
    const binIndex = Math.min(bins - 1, Math.floor((val - min) / binWidth));
    actualDist[binIndex]++;
  }

  // Normalize
  const expectedSum = expectedDist.reduce((a, b) => a + b, 0);
  const actualSum = actualDist.reduce((a, b) => a + b, 0);

  if (expectedSum === 0 || actualSum === 0) {
    return 0;
  }

  // Calculate KL divergence
  let kl = 0;
  for (let i = 0; i < bins; i++) {
    const p = expectedDist[i] / expectedSum;
    const q = actualDist[i] / actualSum;

    if (p > 0 && q > 0) {
      kl += p * Math.log(p / q);
    }
  }

  return kl;
};

/**
 * Calculate rolling accuracy delta
 */
const calculateAccuracyDelta = async (): Promise<number> => {
  const recentPerformance = await ModelPerformance.find()
    .sort({ timestamp: -1 })
    .limit(RECENT_WINDOW_SIZE);

  if (recentPerformance.length < 10) {
    return 0;
  }

  // Split into recent and baseline
  const recentCount = Math.floor(recentPerformance.length / 2);
  const recent = recentPerformance.slice(0, recentCount);
  const baseline = recentPerformance.slice(recentCount);

  const recentAccuracy = recent.reduce((sum, p) => sum + p.accuracy, 0) / recent.length;
  const baselineAccuracy = baseline.reduce((sum, p) => sum + p.accuracy, 0) / baseline.length;

  return recentAccuracy - baselineAccuracy;
};

/**
 * Detect feature distribution drift
 */
const detectFeatureDrift = async (): Promise<{ detected: boolean; psi: number }> => {
  // Get recent clusters vs historical clusters
  const recentClusters = await Cluster.find()
    .sort({ lastUpdated: -1 })
    .limit(RECENT_WINDOW_SIZE);

  const historicalClusters = await Cluster.find()
    .sort({ lastUpdated: 1 })
    .limit(BASELINE_WINDOW_SIZE);

  if (recentClusters.length < 5 || historicalClusters.length < 5) {
    return { detected: false, psi: 0 };
  }

  // Extract feature distributions (using volatility index as proxy)
  const recentVolatility = recentClusters.map(c => c.volatilityIndex);
  const historicalVolatility = historicalClusters.map(c => c.volatilityIndex);

  const psi = calculatePSI(recentVolatility, historicalVolatility);

  return {
    detected: psi > PSI_THRESHOLD,
    psi,
  };
};

/**
 * Detect prediction distribution drift
 */
const detectPredictionDrift = async (): Promise<{ detected: boolean; psi: number }> => {
  // Get recent risk scores vs historical
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(RECENT_WINDOW_SIZE);

  const historicalSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: 1 })
    .limit(BASELINE_WINDOW_SIZE);

  if (recentSnapshots.length < 10 || historicalSnapshots.length < 10) {
    return { detected: false, psi: 0 };
  }

  // Extract risk score distributions
  const recentScores = recentSnapshots.map(s => s.overallRiskScore);
  const historicalScores = historicalSnapshots.map(s => s.overallRiskScore);

  const psi = calculatePSI(recentScores, historicalScores);

  return {
    detected: psi > PSI_THRESHOLD,
    psi,
  };
};

/**
 * Detect concept drift (performance degradation)
 */
const detectConceptDrift = async (): Promise<{ detected: boolean; accuracyDelta: number }> => {
  const accuracyDelta = await calculateAccuracyDelta();

  return {
    detected: Math.abs(accuracyDelta) > ACCURACY_DELTA_THRESHOLD,
    accuracyDelta,
  };
};

/**
 * Main drift detection function
 */
export const detectDrift = async (): Promise<DriftStatus> => {
  // Detect all drift types
  const featureDrift = await detectFeatureDrift();
  const predictionDrift = await detectPredictionDrift();
  const conceptDrift = await detectConceptDrift();

  // Calculate overall drift score (0-1, higher = more drift)
  const overallScore = (
    (featureDrift.detected ? 0.4 : featureDrift.psi / PSI_THRESHOLD * 0.2) +
    (predictionDrift.detected ? 0.4 : predictionDrift.psi / PSI_THRESHOLD * 0.2) +
    (conceptDrift.detected ? 0.3 : Math.abs(conceptDrift.accuracyDelta) / ACCURACY_DELTA_THRESHOLD * 0.15)
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (featureDrift.detected) {
    recommendations.push('Consider retraining anomaly detection model - significant feature drift detected');
  }
  if (predictionDrift.detected) {
    recommendations.push('Review ensemble weights - prediction distribution has shifted significantly');
  }
  if (conceptDrift.detected) {
    recommendations.push('Model performance degradation detected - consider recalibration');
  }
  if (overallScore > 0.7) {
    recommendations.push('HIGH DRIFT: Immediate model retraining recommended');
  }

  const driftStatus: DriftStatus = {
    featureDriftDetected: featureDrift.detected,
    predictionDriftDetected: predictionDrift.detected,
    conceptDriftDetected: conceptDrift.detected,
    overallDriftScore: Math.min(1, overallScore),
    featurePSI: featureDrift.psi,
    predictionPSI: predictionDrift.psi,
    klDivergence: 0, // Could calculate if needed
    accuracyDelta: conceptDrift.accuracyDelta,
    timestamp: new Date(),
    recommendations,
  };

  // Update model status
  if (driftStatus.overallDriftScore > 0.7) {
    modelStatus = 'DriftDetected';
  } else if (driftStatus.overallDriftScore > 0.4) {
    modelStatus = 'Optimizing';
  } else {
    modelStatus = 'Stable';
  }

  // Store in history
  driftHistory.push(driftStatus);
  if (driftHistory.length > 500) {
    driftHistory = driftHistory.slice(-500);
  }

  return driftStatus;
};

/**
 * Get current drift status (cached)
 */
export const getDriftStatus = async (): Promise<DriftStatus | null> => {
  if (driftHistory.length === 0) {
    return null;
  }
  return driftHistory[driftHistory.length - 1];
};

/**
 * Get drift history
 */
export const getDriftHistory = (limit: number = 50): DriftStatus[] => {
  return driftHistory.slice(-limit);
};

/**
 * Get current model status
 */
export const getModelStatus = (): string => {
  return modelStatus;
};

/**
 * Set model status (for external control)
 */
export const setModelStatus = (status: 'Stable' | 'DriftDetected' | 'Retraining' | 'Optimizing'): void => {
  modelStatus = status;
};

/**
 * Get drift metrics summary
 */
export const getDriftMetricsSummary = async (): Promise<{
  currentStatus: string;
  driftTrend: 'increasing' | 'decreasing' | 'stable';
  avgDriftScore: number;
  retrainRecommended: boolean;
}> => {
  const recentHistory = driftHistory.slice(-20);
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (recentHistory.length >= 10) {
    const recentAvg = recentHistory.slice(-5).reduce((sum, d) => sum + d.overallDriftScore, 0) / 5;
    const olderAvg = recentHistory.slice(0, 5).reduce((sum, d) => sum + d.overallDriftScore, 0) / 5;
    
    if (recentAvg > olderAvg + 0.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg - 0.1) {
      trend = 'decreasing';
    }
  }

  const avgDriftScore = recentHistory.length > 0
    ? recentHistory.reduce((sum, d) => sum + d.overallDriftScore, 0) / recentHistory.length
    : 0;

  return {
    currentStatus: modelStatus,
    driftTrend: trend,
    avgDriftScore,
    retrainRecommended: avgDriftScore > 0.5,
  };
};

/**
 * Check if retraining is needed
 */
export const shouldRetrain = async (): Promise<{
  shouldRetrain: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}> => {
  const status = await detectDrift();

  if (status.overallDriftScore > 0.8) {
    return {
      shouldRetrain: true,
      reason: 'Critical drift level detected',
      priority: 'critical',
    };
  }

  if (status.overallDriftScore > 0.6) {
    return {
      shouldRetrain: true,
      reason: 'Significant drift detected - retraining recommended',
      priority: 'high',
    };
  }

  if (status.conceptDriftDetected && Math.abs(status.accuracyDelta) > 0.2) {
    return {
      shouldRetrain: true,
      reason: 'Concept drift with significant accuracy degradation',
      priority: 'high',
    };
  }

  if (status.featureDriftDetected || status.predictionDriftDetected) {
    return {
      shouldRetrain: false,
      reason: 'Moderate drift detected - monitoring recommended',
      priority: 'medium',
    };
  }

  return {
    shouldRetrain: false,
    reason: 'Model is stable - no retraining needed',
    priority: 'low',
  };
};
