import { RiskHistory, IRiskHistory } from '../models/RiskHistory';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { emitBaselineUpdate } from '../sockets/socket';

export interface BaselineResult {
  meanRisk: number;
  stdDev: number;
  currentRisk: number;
  deviationFromBaseline: number; // Standard deviations from baseline
  timestamp: Date;
}

const ROLLING_WINDOW_SIZE = 24; // Last 24 snapshots

/**
 * Calculate mean and standard deviation for an array of numbers
 */
const calculateStats = (values: number[]): { mean: number; stdDev: number } => {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  if (values.length === 1) {
    return { mean, stdDev: 0 };
  }

  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
};

/**
 * Compute rolling baseline and deviation
 */
export const computeBaseline = async (): Promise<BaselineResult | null> => {
  try {
    // Get last N risk snapshots
    const snapshots = await RiskSnapshot.find()
      .sort({ timestamp: -1 })
      .limit(ROLLING_WINDOW_SIZE);

    if (snapshots.length < 3) {
      console.log('⚠️ Not enough snapshots for baseline calculation');
      return null;
    }

    // Extract risk scores (reverse to get chronological order)
    const riskScores = snapshots.reverse().map(s => s.overallRiskScore);

    // Calculate mean and standard deviation
    const { mean, stdDev } = calculateStats(riskScores);

    // Get current risk
    const currentSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    const currentRisk = currentSnapshot?.overallRiskScore || 0;

    // Calculate deviation from baseline (in standard deviations)
    let deviationFromBaseline = 0;
    if (stdDev > 0) {
      deviationFromBaseline = (currentRisk - mean) / stdDev;
    }

    // Get cluster count
    const clusterCount = await Cluster.countDocuments();

    // Save to RiskHistory
    const riskHistory = new RiskHistory({
      timestamp: new Date(),
      overallRiskScore: currentRisk,
      clusterCount,
      anomalyScore: currentSnapshot?.anomalyScore || 0,
    });
    await riskHistory.save();

    const result: BaselineResult = {
      meanRisk: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      currentRisk,
      deviationFromBaseline: Math.round(deviationFromBaseline * 100) / 100,
      timestamp: new Date(),
    };

    // Emit baseline update
    emitBaselineUpdate(result);

    return result;
  } catch (error) {
    console.error('❌ Error computing baseline:', error);
    return null;
  }
};

/**
 * Get risk history entries
 */
export const getRiskHistory = async (limit: number = 50): Promise<IRiskHistory[]> => {
  return await RiskHistory.find()
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Get historical baseline for a specific time range
 */
export const getHistoricalBaseline = async (
  hoursBack: number = 24
): Promise<{
  baseline: BaselineResult | null;
  history: IRiskHistory[];
}> => {
  const history = await getRiskHistory(100);
  
  // Filter to the requested time range
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const filteredHistory = history.filter(h => h.timestamp >= cutoffTime);

  if (filteredHistory.length < 3) {
    return {
      baseline: null,
      history: filteredHistory,
    };
  }

  const riskScores = filteredHistory.map(h => h.overallRiskScore);
  const { mean, stdDev } = calculateStats(riskScores);

  const currentSnapshot = filteredHistory[0];
  let deviationFromBaseline = 0;
  if (stdDev > 0) {
    deviationFromBaseline = (currentSnapshot.overallRiskScore - mean) / stdDev;
  }

  return {
    baseline: {
      meanRisk: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      currentRisk: currentSnapshot.overallRiskScore,
      deviationFromBaseline: Math.round(deviationFromBaseline * 100) / 100,
      timestamp: currentSnapshot.timestamp,
    },
    history: filteredHistory,
  };
};

/**
 * Get baseline status description
 */
export const getBaselineStatus = (deviation: number): {
  status: 'Normal' | 'Elevated' | 'High' | 'Critical';
  color: string;
  description: string;
} => {
  if (deviation < 0.5) {
    return {
      status: 'Normal',
      color: '#22c55e',
      description: 'Risk levels within normal range',
    };
  }
  if (deviation < 1.5) {
    return {
      status: 'Elevated',
      color: '#eab308',
      description: 'Risk slightly above baseline',
    };
  }
  if (deviation < 2.5) {
    return {
      status: 'High',
      color: '#f97316',
      description: 'Significantly elevated risk',
    };
  }
  return {
    status: 'Critical',
    color: '#ef4444',
    description: 'Major deviation from baseline',
  };
};
