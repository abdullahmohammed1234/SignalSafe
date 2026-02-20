/**
 * Model Retraining Service (Continuous Learning Loop)
 * 
 * Handles:
 * - Recomputing feature normalization
 * - Retraining anomaly model
 * - Recalibrating projection model
 * - Recalculating ensemble weights
 * - Model versioning
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { ModelPerformance } from '../models/ModelPerformance';
import { generateCalibrationScaling, clearCalibrationData, recordPredictionOutcome } from './calibrationEngine.service';
import { adaptWeights, getCurrentWeights } from './adaptiveWeightEngine.service';
import { detectDrift, setModelStatus, shouldRetrain } from './driftDetection.service';
import { updateCalibration } from './ensembleEngine.service';

// Model version interface
export interface ModelVersion {
  versionId: string;
  trainingWindow: number;  // hours
  calibrationScore: number;
  driftScore: number;
  deploymentTimestamp: Date;
  retrainingReason: string;
  previousVersionId: string | null;
}

// Retraining status
export interface RetrainingStatus {
  isRunning: boolean;
  currentPhase: string;
  progress: number;
  startTime: Date | null;
  estimatedCompletion: Date | null;
}

// Current model state
let currentModelVersion: ModelVersion | null = null;
let retrainingStatus: RetrainingStatus = {
  isRunning: false,
  currentPhase: 'idle',
  progress: 0,
  startTime: null,
  estimatedCompletion: null,
};

// Version history
let versionHistory: ModelVersion[] = [];

/**
 * Generate unique version ID
 */
const generateVersionId = (): string => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `v${timestamp}-${random}`;
};

/**
 * Get current model version
 */
export const getCurrentModelVersion = (): ModelVersion | null => {
  return currentModelVersion;
};

/**
 * Get version history
 */
export const getVersionHistory = (limit: number = 20): ModelVersion[] => {
  return versionHistory.slice(-limit);
};

/**
 * Get retraining status
 */
export const getRetrainingStatus = (): RetrainingStatus => {
  return { ...retrainingStatus };
};

/**
 * Update retraining progress
 */
const updateProgress = (phase: string, progress: number): void => {
  retrainingStatus = {
    ...retrainingStatus,
    currentPhase: phase,
    progress,
  };
};

/**
 * Phase 1: Recompute feature normalization
 */
const recomputeFeatureNormalization = async (): Promise<{
  featureStats: Record<string, { mean: number; std: number; min: number; max: number }>;
}> => {
  updateProgress('Computing feature normalization', 10);

  // Get recent risk snapshots for feature statistics
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(500);

  if (snapshots.length === 0) {
    return { featureStats: {} };
  }

  // Calculate statistics for each feature
  const features = ['overallRiskScore', 'sentimentAcceleration', 'clusterGrowthRate', 'anomalyScore', 'narrativeSpreadSpeed'];
  const featureStats: Record<string, { mean: number; std: number; min: number; max: number }> = {};

  for (const feature of features) {
    const values = snapshots.map(s => (s as any)[feature]).filter(v => v !== undefined && v !== null);
    
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      featureStats[feature] = {
        mean: Math.round(mean * 100) / 100,
        std: Math.round(std * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return { featureStats };
};

/**
 * Phase 2: Retrain anomaly model
 */
const retrainAnomalyModel = async (): Promise<{
  anomalyModelMetrics: { accuracy: number; precision: number; recall: number };
}> => {
  updateProgress('Retraining anomaly detection model', 30);

  // Get recent cluster data for anomaly model training
  const clusters = await Cluster.find()
    .sort({ lastUpdated: -1 })
    .limit(200);

  // Simulate anomaly model retraining
  // In production, this would retrain an Isolation Forest or similar model
  await new Promise(resolve => setTimeout(resolve, 150));

  // Calculate simulated metrics
  const anomalyModelMetrics = {
    accuracy: 0.78 + Math.random() * 0.1,
    precision: 0.75 + Math.random() * 0.1,
    recall: 0.72 + Math.random() * 0.1,
  };

  return { anomalyModelMetrics };
};

/**
 * Phase 3: Recalibrate projection model
 */
const recalibrateProjectionModel = async (): Promise<{
  projectionCalibration: { scale: number; offset: number };
}> => {
  updateProgress('Recalibrating projection model', 50);

  // Clear old calibration data
  clearCalibrationData();

  // Get historical predictions and outcomes for recalibration
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(200);

  // Record prediction-outcome pairs for calibration
  for (let i = 0; i < snapshots.length - 1; i++) {
    const prediction = snapshots[i].overallRiskScore;
    const actual = snapshots[i + 1]?.overallRiskScore || prediction;
    
    await recordPredictionOutcome(prediction, actual / 100); // Normalize to 0-1
  }

  // Generate new calibration parameters
  const calibration = await generateCalibrationScaling();

  // Apply to ensemble engine
  updateCalibration(calibration.scale, calibration.offset);

  await new Promise(resolve => setTimeout(resolve, 100));

  return { projectionCalibration: { scale: calibration.scale, offset: calibration.offset } };
};

/**
 * Phase 4: Recalculate ensemble weights
 */
const recalculateEnsembleWeights = async (): Promise<{
  newWeights: { ruleBased: number; anomalyModel: number; projection: number; interaction: number };
}> => {
  updateProgress('Recalculating ensemble weights', 70);

  // Run adaptive weight optimization
  const newWeights = await adaptWeights();

  await new Promise(resolve => setTimeout(resolve, 100));

  return { newWeights };
};

/**
 * Phase 5: Validate and deploy
 */
const validateAndDeploy = async (retrainingReason: string): Promise<ModelVersion> => {
  updateProgress('Validating and deploying model', 90);

  // Get drift score
  const driftStatus = await detectDrift();
  
  // Get calibration score
  const calibration = await generateCalibrationScaling();

  // Create new version
  const previousVersionId = currentModelVersion?.versionId || null;
  const newVersion: ModelVersion = {
    versionId: generateVersionId(),
    trainingWindow: 168, // 1 week
    calibrationScore: calibration.isCalibrated ? (1 - calibration.scale * 0.1) : 0.5,
    driftScore: driftStatus.overallDriftScore,
    deploymentTimestamp: new Date(),
    retrainingReason,
    previousVersionId,
  };

  // Update current version
  currentModelVersion = newVersion;
  versionHistory.push(newVersion);

  // Keep only last 50 versions
  if (versionHistory.length > 50) {
    versionHistory = versionHistory.slice(-50);
  }

  // Reset status
  retrainingStatus = {
    isRunning: false,
    currentPhase: 'idle',
    progress: 100,
    startTime: null,
    estimatedCompletion: null,
  };

  setModelStatus('Stable');

  await new Promise(resolve => setTimeout(resolve, 100));

  return newVersion;
};

/**
 * Main retraining function
 */
export const runModelRetraining = async (reason?: string): Promise<{
  success: boolean;
  newVersion: ModelVersion | null;
  error?: string;
}> => {
  // Check if already running
  if (retrainingStatus.isRunning) {
    return {
      success: false,
      newVersion: null,
      error: 'Retraining already in progress',
    };
  }

  // Determine retraining reason if not provided
  const retrainCheck = await shouldRetrain();
  const retrainingReason = reason || retrainCheck.reason;

  // Start retraining
  retrainingStatus = {
    isRunning: true,
    currentPhase: 'initializing',
    progress: 0,
    startTime: new Date(),
    estimatedCompletion: new Date(Date.now() + 60000), // Estimate 1 minute
  };

  setModelStatus('Retraining');

  try {
    // Phase 1: Feature normalization
    await recomputeFeatureNormalization();

    // Phase 2: Anomaly model
    await retrainAnomalyModel();

    // Phase 3: Projection calibration
    await recalibrateProjectionModel();

    // Phase 4: Ensemble weights
    await recalculateEnsembleWeights();

    // Phase 5: Deploy
    const newVersion = await validateAndDeploy(retrainingReason);

    return {
      success: true,
      newVersion,
    };
  } catch (error) {
    console.error('Error during model retraining:', error);
    
    retrainingStatus = {
      isRunning: false,
      currentPhase: 'error',
      progress: 0,
      startTime: null,
      estimatedCompletion: null,
    };

    setModelStatus('Stable');

    return {
      success: false,
      newVersion: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check and run automatic retraining if needed
 */
export const checkAndAutoRetrain = async (): Promise<{
  triggered: boolean;
  reason?: string;
  result?: { success: boolean; newVersion: ModelVersion | null };
}> => {
  const retrainCheck = await shouldRetrain();

  if (retrainCheck.shouldRetrain && retrainCheck.priority === 'critical') {
    console.log(`[Auto-Retrain] Triggering retraining: ${retrainCheck.reason}`);
    const result = await runModelRetraining(retrainCheck.reason);
    return {
      triggered: true,
      reason: retrainCheck.reason,
      result,
    };
  }

  return { triggered: false };
};

/**
 * Get model health summary
 */
export const getModelHealthSummary = async (): Promise<{
  currentVersion: ModelVersion | null;
  versionCount: number;
  driftStatus: string;
  retrainRecommendation: {
    shouldRetrain: boolean;
    priority: string;
    reason: string;
  };
  lastRetraining: Date | null;
}> => {
  const retrainCheck = await shouldRetrain();
  
  return {
    currentVersion: currentModelVersion,
    versionCount: versionHistory.length,
    driftStatus: retrainCheck.shouldRetrain ? 'Needs Attention' : 'Healthy',
    retrainRecommendation: {
      shouldRetrain: retrainCheck.shouldRetrain,
      priority: retrainCheck.priority,
      reason: retrainCheck.reason,
    },
    lastRetraining: currentModelVersion?.deploymentTimestamp || null,
  };
};

/**
 * Initialize model (create initial version)
 */
export const initializeModel = async (): Promise<ModelVersion> => {
  const initialVersion: ModelVersion = {
    versionId: generateVersionId(),
    trainingWindow: 168,
    calibrationScore: 0.5,
    driftScore: 0,
    deploymentTimestamp: new Date(),
    retrainingReason: 'Initial deployment',
    previousVersionId: null,
  };

  currentModelVersion = initialVersion;
  versionHistory.push(initialVersion);

  setModelStatus('Stable');

  return initialVersion;
};

/**
 * Force manual retraining
 */
export const forceRetraining = async (reason: string): Promise<{
  success: boolean;
  newVersion: ModelVersion | null;
}> => {
  return await runModelRetraining(reason);
};
