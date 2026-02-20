import { Narrative, INarrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';
import { emitPredictionUpdate } from '../sockets/socket';

export interface PredictionResult {
  clusterId: string;
  timeToPeakPrediction: number | null; // minutes
  predictedPeakTime: Date | null;
  growthVelocity: number;
  isReliable: boolean;
}

const CLUSTER_MAX_SIZE = 1000; // Estimated max cluster size
const MIN_GROWTH_VELOCITY_THRESHOLD = 0.1; // Minimum growth velocity for prediction

/**
 * Calculate time-to-peak prediction using logistic growth estimation
 * Formula: predictedPeakTime = currentTime + (1 / growthVelocity) * log(clusterMaxSize / currentSize)
 */
export const calculateTimeToPeak = (
  currentSize: number,
  growthVelocity: number,
  currentTime: Date = new Date()
): { timeToPeak: number | null; predictedPeakTime: Date | null } => {
  // If growth velocity is too low, prediction is unreliable
  if (growthVelocity < MIN_GROWTH_VELOCITY_THRESHOLD || growthVelocity <= 0) {
    return { timeToPeak: null, predictedPeakTime: null };
  }

  // If cluster is already at max size
  if (currentSize >= CLUSTER_MAX_SIZE) {
    return { timeToPeak: 0, predictedPeakTime: currentTime };
  }

  try {
    // Logistic growth estimation
    // timeToPeak = (1 / growthVelocity) * ln(clusterMaxSize / currentSize)
    const ratio = CLUSTER_MAX_SIZE / currentSize;
    const logRatio = Math.log(ratio);
    
    // Convert to minutes
    const timeToPeakMinutes = (1 / growthVelocity) * logRatio;

    // Cap at reasonable maximum (24 hours = 1440 minutes)
    if (timeToPeakMinutes > 1440 || !isFinite(timeToPeakMinutes)) {
      return { timeToPeak: null, predictedPeakTime: null };
    }

    const predictedPeakTime = new Date(currentTime.getTime() + timeToPeakMinutes * 60 * 1000);

    return {
      timeToPeak: Math.round(timeToPeakMinutes),
      predictedPeakTime,
    };
  } catch (error) {
    console.error('❌ Error calculating time to peak:', error);
    return { timeToPeak: null, predictedPeakTime: null };
  }
};

export const predictClusterPeak = async (clusterId: string): Promise<PredictionResult | null> => {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster) {
      console.log(`⚠️ No cluster found for prediction: ${clusterId}`);
      return null;
    }

    const narrative = await Narrative.findOne({ clusterId });
    const growthVelocity = narrative?.growthVelocity || cluster.growthRate;

    const { timeToPeak, predictedPeakTime } = calculateTimeToPeak(
      cluster.size,
      growthVelocity
    );

    // Determine if prediction is reliable
    const isReliable = timeToPeak !== null && growthVelocity >= MIN_GROWTH_VELOCITY_THRESHOLD;

    // Update narrative with prediction
    if (narrative) {
      narrative.timeToPeakPrediction = timeToPeak;
      narrative.lastUpdated = new Date();
      await narrative.save();
    }

    return {
      clusterId,
      timeToPeakPrediction: timeToPeak,
      predictedPeakTime,
      growthVelocity,
      isReliable,
    };
  } catch (error) {
    console.error('❌ Error predicting cluster peak:', error);
    return null;
  }
};

/**
 * Predict risk score for next N intervals
 */
export const predictRiskTrajectory = async (
  intervals: number = 3
): Promise<{
  currentRisk: number;
  predictions: { interval: number; predictedRisk: number }[];
} | null> => {
  try {
    const { RiskSnapshot } = await import('../models/RiskSnapshot');
    
    // Get last 10 snapshots for trend analysis
    const snapshots = await RiskSnapshot.find()
      .sort({ timestamp: -1 })
      .limit(10);

    if (snapshots.length < 3) {
      return null;
    }

    // Calculate average growth rate
    let totalChange = 0;
    for (let i = 0; i < snapshots.length - 1; i++) {
      totalChange += snapshots[i].overallRiskScore - snapshots[i + 1].overallRiskScore;
    }
    const avgChange = totalChange / (snapshots.length - 1);

    const currentRisk = snapshots[0].overallRiskScore;
    const predictions: { interval: number; predictedRisk: number }[] = [];

    // Project forward
    for (let i = 1; i <= intervals; i++) {
      // Apply decay factor to the change (risk tends to normalize over time)
      const decayFactor = Math.pow(0.7, i);
      const predictedRisk = Math.max(0, Math.min(100, currentRisk + (avgChange * i * decayFactor)));
      
      predictions.push({
        interval: i,
        predictedRisk: Math.round(predictedRisk * 100) / 100,
      });
    }

    return {
      currentRisk,
      predictions,
    };
  } catch (error) {
    console.error('❌ Error predicting risk trajectory:', error);
    return null;
  }
};

/**
 * Process all clusters for predictions
 */
export const processAllPredictions = async (): Promise<PredictionResult[]> => {
  const clusters = await Cluster.find();
  const predictions: PredictionResult[] = [];

  for (const cluster of clusters) {
    const prediction = await predictClusterPeak(cluster.clusterId);
    if (prediction) {
      predictions.push(prediction);
    }
  }

  // Emit prediction updates
  const trajectory = await predictRiskTrajectory();
  emitPredictionUpdate({
    clusterPredictions: predictions,
    riskTrajectory: trajectory,
  });

  return predictions;
};
