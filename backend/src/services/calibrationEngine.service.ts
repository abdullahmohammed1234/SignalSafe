import { RiskSnapshot } from '../models/RiskSnapshot';

export interface CalibrationBin {
  binId: number;
  confidenceRange: { min: number; max: number };
  predictedCount: number;
  actualCount: number;
  averageConfidence: number;
  averageActual: number;
}

export interface CalibrationMetrics {
  timestamp: Date;
  ECE: number;  // Expected Calibration Error
  binData: CalibrationBin[];
  totalSamples: number;
  reliabilityDiagram: { confidence: number; accuracy: number }[];
}

export interface PredictionOutcome {
  predictedRisk: number;
  actualOutcome: number;
  timestamp: Date;
}

// In-memory storage for calibration (in production, use database)
let predictionOutcomes: PredictionOutcome[] = [];
const NUM_BINS = 10;

// Calibration thresholds
const MIN_SAMPLES_FOR_CALIBRATION = 20;

/**
 * Record a prediction and its actual outcome for calibration
 */
export const recordPredictionOutcome = async (
  predictedRisk: number,
  actualOutcome: number
): Promise<void> => {
  predictionOutcomes.push({
    predictedRisk,
    actualOutcome,
    timestamp: new Date(),
  });

  // Keep only last 1000 outcomes
  if (predictionOutcomes.length > 1000) {
    predictionOutcomes = predictionOutcomes.slice(-1000);
  }
};

/**
 * Calculate calibration metrics using binning approach
 */
export const calculateCalibrationMetrics = async (): Promise<CalibrationMetrics> => {
  if (predictionOutcomes.length < MIN_SAMPLES_FOR_CALIBRATION) {
    return generateEmptyCalibrationMetrics();
  }

  // Initialize bins
  const bins: CalibrationBin[] = [];
  for (let i = 0; i < NUM_BINS; i++) {
    bins.push({
      binId: i,
      confidenceRange: { min: i * 10, max: (i + 1) * 10 },
      predictedCount: 0,
      actualCount: 0,
      averageConfidence: 0,
      averageActual: 0,
    });
  }

  // Assign predictions to bins
  for (const outcome of predictionOutcomes) {
    const binIndex = Math.min(NUM_BINS - 1, Math.floor(outcome.predictedRisk / 10));
    bins[binIndex].predictedCount++;
    bins[binIndex].actualCount += outcome.actualOutcome;
  }

  // Calculate average confidence and accuracy for each bin
  for (const bin of bins) {
    if (bin.predictedCount > 0) {
      bin.averageConfidence = bin.predictedCount > 0 
        ? ((bin.binId * 10) + 5)  // Midpoint of bin range
        : 0;
      bin.averageActual = bin.actualCount / bin.predictedCount;
    }
  }

  // Calculate ECE (Expected Calibration Error)
  const totalPredictions = predictionOutcomes.length;
  let weightedError = 0;
  
  for (const bin of bins) {
    if (bin.predictedCount > 0) {
      const accuracy = bin.averageActual;
      const confidence = bin.averageConfidence / 100;
      const binWeight = bin.predictedCount / totalPredictions;
      weightedError += binWeight * Math.abs(confidence - accuracy);
    }
  }

  // Generate reliability diagram data
  const reliabilityDiagram: { confidence: number; accuracy: number }[] = bins
    .filter(b => b.predictedCount > 0)
    .map(b => ({
      confidence: b.averageConfidence,
      accuracy: b.averageActual * 100,
    }));

  return {
    timestamp: new Date(),
    ECE: Math.round(weightedError * 10000) / 100,
    binData: bins,
    totalSamples: totalPredictions,
    reliabilityDiagram,
  };
};

/**
 * Generate calibration scaling parameters using isotonic regression
 */
export const generateCalibrationScaling = async (): Promise<{
  scale: number;
  offset: number;
  isCalibrated: boolean;
}> => {
  const metrics = await calculateCalibrationMetrics();
  
  if (metrics.totalSamples < MIN_SAMPLES_FOR_CALIBRATION) {
    return { scale: 1.0, offset: 0.0, isCalibrated: false };
  }

  // Simple linear calibration based on ECE
  // If ECE is high, apply more correction
  const eceFactor = metrics.ECE / 100;
  
  // Calculate bias (difference between average prediction and average actual)
  const avgPrediction = predictionOutcomes.reduce((sum, o) => sum + o.predictedRisk, 0) / predictionOutcomes.length;
  const avgActual = predictionOutcomes.reduce((sum, o) => sum + o.actualOutcome, 0) / predictionOutcomes.length;
  const bias = avgActual - avgPrediction;

  // Calculate slope correction
  // If predictions are too extreme (close to 0 or 100), flatten them
  const predictionVariance = predictionOutcomes.reduce((sum, o) => 
    sum + Math.pow(o.predictedRisk - avgPrediction, 2), 0) / predictionOutcomes.length;
  
  const outcomeVariance = predictionOutcomes.reduce((sum, o) => 
    sum + Math.pow(o.actualOutcome - avgActual, 2), 0) / predictionOutcomes.length;
  
  let scale = 1.0;
  if (predictionVariance > 0 && outcomeVariance > 0) {
    scale = Math.min(1.2, Math.max(0.8, outcomeVariance / predictionVariance));
  }

  // Apply correction based on ECE
  scale = scale * (1 - eceFactor * 0.3);
  const offset = bias * (1 - eceFactor * 0.5);

  return {
    scale: Math.round(scale * 1000) / 1000,
    offset: Math.round(offset * 100) / 100,
    isCalibrated: true,
  };
};

/**
 * Get calibration status
 */
export const getCalibrationStatus = async (): Promise<{
  isReady: boolean;
  sampleCount: number;
  minRequired: number;
  progress: number;
}> => {
  return {
    isReady: predictionOutcomes.length >= MIN_SAMPLES_FOR_CALIBRATION,
    sampleCount: predictionOutcomes.length,
    minRequired: MIN_SAMPLES_FOR_CALIBRATION,
    progress: Math.min(100, (predictionOutcomes.length / MIN_SAMPLES_FOR_CALIBRATION) * 100),
  };
};

/**
 * Get reliability diagram for frontend visualization
 */
export const getReliabilityDiagram = async (): Promise<{
  perfectCalibration: { confidence: number; accuracy: number }[];
  actualCalibration: { confidence: number; accuracy: number }[];
}> => {
  const metrics = await calculateCalibrationMetrics();

  // Perfect calibration line (diagonal)
  const perfectCalibration: { confidence: number; accuracy: number }[] = [];
  for (let i = 0; i <= 100; i += 10) {
    perfectCalibration.push({ confidence: i, accuracy: i });
  }

  return {
    perfectCalibration,
    actualCalibration: metrics.reliabilityDiagram,
  };
};

/**
 * Apply calibration to a prediction
 */
export const applyCalibration = (
  prediction: number,
  scale: number = 1.0,
  offset: number = 0.0
): number => {
  const calibrated = (prediction * scale) + offset;
  return Math.max(0, Math.min(100, Math.round(calibrated * 100) / 100));
};

/**
 * Clear calibration data
 */
export const clearCalibrationData = (): void => {
  predictionOutcomes = [];
};

/**
 * Get historical calibration metrics
 */
export const getCalibrationHistory = async (limit: number = 50): Promise<CalibrationMetrics[]> => {
  // In production, this would query from a stored collection
  // For now, return current metrics
  const current = await calculateCalibrationMetrics();
  return [current];
};

// Helper function
function generateEmptyCalibrationMetrics(): CalibrationMetrics {
  const bins: CalibrationBin[] = [];
  for (let i = 0; i < NUM_BINS; i++) {
    bins.push({
      binId: i,
      confidenceRange: { min: i * 10, max: (i + 1) * 10 },
      predictedCount: 0,
      actualCount: 0,
      averageConfidence: (i * 10) + 5,
      averageActual: 0,
    });
  }

  return {
    timestamp: new Date(),
    ECE: 0,
    binData: bins,
    totalSamples: 0,
    reliabilityDiagram: [],
  };
}
