/**
 * Adaptive Weight Engine Service
 * 
 * Dynamically adjusts ensemble model weights based on:
 * - Recent prediction accuracy
 * - Calibration performance
 * - Drift metrics
 * 
 * Maintains constraint: w1 + w2 + w3 + w4 = 1
 */

import { EnsembleRiskInput, EnsembleRiskResult, calculateEnsembleRisk, getEnsembleHistory } from './ensembleEngine.service';
import { ModelPerformance } from '../models/ModelPerformance';
import { getDriftStatus } from './driftDetection.service';

// Weight types
export interface EnsembleWeights {
  ruleBased: number;      // w1
  anomalyModel: number;   // w2
  projection: number;     // w3
  interaction: number;    // w4
}

// Weight history entry
export interface WeightHistoryEntry {
  timestamp: Date;
  weights: EnsembleWeights;
  accuracy: number;
  calibrationScore: number;
  driftScore: number;
  reason: string;
}

// Weight adjustment configuration
interface WeightAdjustmentConfig {
  minWeight: number;
  maxWeight: number;
  learningRate: number;
  momentum: number;
}

// Default weights (must sum to 1)
const DEFAULT_WEIGHTS: EnsembleWeights = {
  ruleBased: 0.35,
  anomalyModel: 0.25,
  projection: 0.20,
  interaction: 0.20,
};

// Configuration
const config: WeightAdjustmentConfig = {
  minWeight: 0.10,
  maxWeight: 0.60,
  learningRate: 0.05,
  momentum: 0.3,
};

// Current weights (mutable)
let currentWeights: EnsembleWeights = { ...DEFAULT_WEIGHTS };

// Weight history
let weightHistory: WeightHistoryEntry[] = [];

// Previous weight adjustments for momentum
let previousAdjustments: EnsembleWeights = {
  ruleBased: 0,
  anomalyModel: 0,
  projection: 0,
  interaction: 0,
};

/**
 * Get current ensemble weights
 */
export const getCurrentWeights = (): EnsembleWeights => {
  return { ...currentWeights };
};

/**
 * Get weight history
 */
export const getWeightHistory = (limit: number = 50): WeightHistoryEntry[] => {
  return weightHistory.slice(-limit);
};

/**
 * Calculate component accuracy based on recent performance
 */
export const calculateComponentAccuracy = async (): Promise<{
  ruleBasedAccuracy: number;
  anomalyAccuracy: number;
  projectionAccuracy: number;
  interactionAccuracy: number;
}> => {
  // Get recent performance data
  const recentPerformance = await ModelPerformance.find()
    .sort({ timestamp: -1 })
    .limit(20);

  if (recentPerformance.length === 0) {
    return {
      ruleBasedAccuracy: 0.7,
      anomalyAccuracy: 0.7,
      projectionAccuracy: 0.7,
      interactionAccuracy: 0.7,
    };
  }

  // Calculate average accuracy
  const avgAccuracy = recentPerformance.reduce((sum, p) => sum + p.accuracy, 0) / recentPerformance.length;
  
  // Calculate average calibration error
  const avgCalibration = recentPerformance.reduce((sum, p) => sum + p.confidenceCalibrationError, 0) / recentPerformance.length;
  
  // Calculate average F1 score
  const avgF1 = recentPerformance.reduce((sum, p) => sum + p.f1Score, 0) / recentPerformance.length;

  // Assign accuracies based on component types
  // In a real system, these would be tracked separately per component
  return {
    ruleBasedAccuracy: avgAccuracy, // Rule-based is usually more stable
    anomalyAccuracy: avgAccuracy * (1 - avgCalibration), // Anomaly detection accuracy
    projectionAccuracy: avgF1, // Projection accuracy
    interactionAccuracy: avgAccuracy * 0.9, // Interaction model
  };
};

/**
 * Calculate performance delta (how well each component predicts)
 */
const calculatePerformanceDelta = async (): Promise<EnsembleWeights> => {
  const accuracies = await calculateComponentAccuracy();
  const total = accuracies.ruleBasedAccuracy + 
                accuracies.anomalyAccuracy + 
                accuracies.projectionAccuracy + 
                accuracies.interactionAccuracy;

  // Calculate normalized deltas
  const delta: EnsembleWeights = {
    ruleBased: (accuracies.ruleBasedAccuracy / total) - currentWeights.ruleBased,
    anomalyModel: (accuracies.anomalyAccuracy / total) - currentWeights.anomalyModel,
    projection: (accuracies.projectionAccuracy / total) - currentWeights.projection,
    interaction: (accuracies.interactionAccuracy / total) - currentWeights.interaction,
  };

  return delta;
};

/**
 * Calculate drift-based adjustments
 */
const calculateDriftAdjustment = async (): Promise<EnsembleWeights> => {
  try {
    const driftStatus = await getDriftStatus();
    
    if (!driftStatus) {
      return { ruleBased: 0, anomalyModel: 0, projection: 0, interaction: 0 };
    }

    const adjustments: EnsembleWeights = {
      ruleBased: 0,
      anomalyModel: 0,
      projection: 0,
      interaction: 0,
    };

    // If concept drift detected, reduce weights of drifting components
    if (driftStatus.conceptDriftDetected) {
      // Increase rule-based weight (more stable)
      adjustments.ruleBased = config.learningRate * 0.5;
      
      // Reduce anomaly model weight if it's drifting
      adjustments.anomalyModel = -config.learningRate * 0.3;
      
      // Reduce projection weight if drifting
      adjustments.projection = -config.learningRate * 0.2;
    }

    // Feature drift adjustments
    if (driftStatus.featureDriftDetected) {
      adjustments.anomalyModel -= config.learningRate * 0.2;
      adjustments.ruleBased += config.learningRate * 0.2;
    }

    // Prediction drift adjustments
    if (driftStatus.predictionDriftDetected) {
      adjustments.interaction -= config.learningRate * 0.2;
      adjustments.ruleBased += config.learningRate * 0.2;
    }

    return adjustments;
  } catch (error) {
    console.error('Error calculating drift adjustment:', error);
    return { ruleBased: 0, anomalyModel: 0, projection: 0, interaction: 0 };
  }
};

/**
 * Apply momentum to weight adjustments
 */
const applyMomentum = (delta: EnsembleWeights): EnsembleWeights => {
  return {
    ruleBased: delta.ruleBased + (previousAdjustments.ruleBased * config.momentum),
    anomalyModel: delta.anomalyModel + (previousAdjustments.anomalyModel * config.momentum),
    projection: delta.projection + (previousAdjustments.projection * config.momentum),
    interaction: delta.interaction + (previousAdjustments.interaction * config.momentum),
  };
};

/**
 * Normalize weights to sum to 1
 */
const normalizeWeights = (weights: EnsembleWeights): EnsembleWeights => {
  let total = weights.ruleBased + weights.anomalyModel + weights.projection + weights.interaction;
  
  if (total === 0) {
    return DEFAULT_WEIGHTS;
  }

  // Scale to sum to 1
  const scale = 1 / total;
  
  return {
    ruleBased: weights.ruleBased * scale,
    anomalyModel: weights.anomalyModel * scale,
    projection: weights.projection * scale,
    interaction: weights.interaction * scale,
  };
};

/**
 * Clamp weights to min/max bounds
 */
const clampWeights = (weights: EnsembleWeights): EnsembleWeights => {
  return {
    ruleBased: Math.max(config.minWeight, Math.min(config.maxWeight, weights.ruleBased)),
    anomalyModel: Math.max(config.minWeight, Math.min(config.maxWeight, weights.anomalyModel)),
    projection: Math.max(config.minWeight, Math.min(config.maxWeight, weights.projection)),
    interaction: Math.max(config.minWeight, Math.min(config.maxWeight, weights.interaction)),
  };
};

/**
 * Main function to adjust weights based on all factors
 */
export const adaptWeights = async (): Promise<EnsembleWeights> => {
  // 1. Get performance-based delta
  const performanceDelta = await calculatePerformanceDelta();
  
  // 2. Get drift-based adjustments
  const driftAdjustment = await calculateDriftAdjustment();
  
  // 3. Combine adjustments
  const combinedDelta: EnsembleWeights = {
    ruleBased: performanceDelta.ruleBased * 0.6 + driftAdjustment.ruleBased * 0.4,
    anomalyModel: performanceDelta.anomalyModel * 0.6 + driftAdjustment.anomalyModel * 0.4,
    projection: performanceDelta.projection * 0.6 + driftAdjustment.projection * 0.4,
    interaction: performanceDelta.interaction * 0.6 + driftAdjustment.interaction * 0.4,
  };

  // 4. Apply momentum
  const momentumDelta = applyMomentum(combinedDelta);

  // 5. Apply learning rate
  const scaledDelta: EnsembleWeights = {
    ruleBased: momentumDelta.ruleBased * config.learningRate,
    anomalyModel: momentumDelta.anomalyModel * config.learningRate,
    projection: momentumDelta.projection * config.learningRate,
    interaction: momentumDelta.interaction * config.learningRate,
  };

  // 6. Calculate new weights
  let newWeights: EnsembleWeights = {
    ruleBased: currentWeights.ruleBased + scaledDelta.ruleBased,
    anomalyModel: currentWeights.anomalyModel + scaledDelta.anomalyModel,
    projection: currentWeights.projection + scaledDelta.projection,
    interaction: currentWeights.interaction + scaledDelta.interaction,
  };

  // 7. Clamp to bounds
  newWeights = clampWeights(newWeights);

  // 8. Normalize to sum to 1
  newWeights = normalizeWeights(newWeights);

  // 9. Store previous adjustments
  previousAdjustments = { ...scaledDelta };

  // 10. Calculate accuracy and drift for history
  const accuracies = await calculateComponentAccuracy();
  const avgAccuracy = (accuracies.ruleBasedAccuracy + accuracies.anomalyAccuracy + 
                       accuracies.projectionAccuracy + accuracies.interactionAccuracy) / 4;
  
  let driftScore = 0;
  try {
    const driftStatus = await getDriftStatus();
    if (driftStatus) {
      driftScore = driftStatus.overallDriftScore;
    }
  } catch (e) {
    // Drift service may not be available
  }

  // 11. Record to history
  const historyEntry: WeightHistoryEntry = {
    timestamp: new Date(),
    weights: { ...newWeights },
    accuracy: avgAccuracy,
    calibrationScore: 1 - avgAccuracy, // Inverse of accuracy as calibration proxy
    driftScore,
    reason: generateWeightReason(newWeights, currentWeights),
  };
  
  weightHistory.push(historyEntry);
  
  // Keep only last 200 entries
  if (weightHistory.length > 200) {
    weightHistory = weightHistory.slice(-200);
  }

  // 12. Update current weights
  currentWeights = { ...newWeights };

  return currentWeights;
};

/**
 * Generate explanation for weight changes
 */
const generateWeightReason = (newWeights: EnsembleWeights, oldWeights: EnsembleWeights): string => {
  const changes: string[] = [];
  
  const diff = {
    ruleBased: newWeights.ruleBased - oldWeights.ruleBased,
    anomalyModel: newWeights.anomalyModel - oldWeights.anomalyModel,
    projection: newWeights.projection - oldWeights.projection,
    interaction: newWeights.interaction - oldWeights.interaction,
  };

  if (Math.abs(diff.ruleBased) > 0.02) {
    changes.push(`rule-based ${diff.ruleBased > 0 ? '↑' : '↓'} ${Math.abs(diff.ruleBased * 100).toFixed(1)}%`);
  }
  if (Math.abs(diff.anomalyModel) > 0.02) {
    changes.push(`anomaly ${diff.anomalyModel > 0 ? '↑' : '↓'} ${Math.abs(diff.anomalyModel * 100).toFixed(1)}%`);
  }
  if (Math.abs(diff.projection) > 0.02) {
    changes.push(`projection ${diff.projection > 0 ? '↑' : '↓'} ${Math.abs(diff.projection * 100).toFixed(1)}%`);
  }
  if (Math.abs(diff.interaction) > 0.02) {
    changes.push(`interaction ${diff.interaction > 0 ? '↑' : '↓'} ${Math.abs(diff.interaction * 100).toFixed(1)}%`);
  }

  if (changes.length === 0) {
    return 'Weights stable - no significant changes detected';
  }

  return `Adjusted: ${changes.join(', ')}`;
};

/**
 * Reset weights to defaults
 */
export const resetWeights = (): EnsembleWeights => {
  currentWeights = { ...DEFAULT_WEIGHTS };
  previousAdjustments = { ruleBased: 0, anomalyModel: 0, projection: 0, interaction: 0 };
  
  weightHistory.push({
    timestamp: new Date(),
    weights: { ...currentWeights },
    accuracy: 0,
    calibrationScore: 0,
    driftScore: 0,
    reason: 'Weights reset to defaults',
  });

  return currentWeights;
};

/**
 * Set custom weights (for manual override)
 */
export const setCustomWeights = (weights: EnsembleWeights): EnsembleWeights => {
  const normalized = normalizeWeights(clampWeights(weights));
  currentWeights = { ...normalized };
  
  weightHistory.push({
    timestamp: new Date(),
    weights: { ...currentWeights },
    accuracy: 0,
    calibrationScore: 0,
    driftScore: 0,
    reason: 'Manual weight override applied',
  });

  return currentWeights;
};

/**
 * Get ensemble weights for use in risk calculation
 * Returns the weights in format compatible with ensemble engine
 */
export const getEnsembleWeights = (): {
  ruleBased: number;
  anomalyModel: number;
  projection: number;
  interaction: number;
} => {
  return { ...currentWeights };
};

/**
 * Get weight optimization summary
 */
export const getWeightOptimizationSummary = (): {
  currentWeights: EnsembleWeights;
  recentTrend: 'improving' | 'degrading' | 'stable';
  avgAccuracy: number;
  lastAdjustment: string;
} => {
  const recentHistory = weightHistory.slice(-10);
  
  let trend: 'improving' | 'degrading' | 'stable' = 'stable';
  if (recentHistory.length >= 5) {
    const recentAvg = recentHistory.slice(-3).reduce((sum, e) => sum + e.accuracy, 0) / 3;
    const olderAvg = recentHistory.slice(0, 3).reduce((sum, e) => sum + e.accuracy, 0) / 3;
    
    if (recentAvg > olderAvg + 0.05) {
      trend = 'improving';
    } else if (recentAvg < olderAvg - 0.05) {
      trend = 'degrading';
    }
  }

  const avgAccuracy = recentHistory.length > 0
    ? recentHistory.reduce((sum, e) => sum + e.accuracy, 0) / recentHistory.length
    : 0;

  const lastAdjustment = recentHistory.length > 0
    ? recentHistory[recentHistory.length - 1].reason
    : 'No adjustments made';

  return {
    currentWeights: { ...currentWeights },
    recentTrend: trend,
    avgAccuracy,
    lastAdjustment,
  };
};
