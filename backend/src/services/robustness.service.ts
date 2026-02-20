/**
 * Adversarial Robustness Layer
 * 
 * Protects against:
 * - Synthetic anomaly injection
 * - Coordinated amplification spikes
 * - Data poisoning attempts
 * 
 * Implements:
 * - Outlier consensus filtering
 * - Cross-signal validation
 * - Rate anomaly thresholding
 */

import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';

// Robustness metrics
export interface RobustnessMetrics {
  outlierCount: number;
  suspiciousPatterns: number;
  consensusScore: number;
  validationStatus: 'pass' | 'warning' | 'fail';
  anomaliesDetected: AnomalyRecord[];
  timestamp: Date;
}

// Anomaly record
export interface AnomalyRecord {
  type: 'outlier' | 'coordination' | 'rate_spike' | 'data_poisoning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponents: string[];
  confidence: number;
  timestamp: Date;
}

// System health record
interface HealthRecord {
  timestamp: Date;
  metrics: {
    processingRate: number;
    errorRate: number;
    latency: number;
  };
}

// Configuration
const RATE_THRESHOLD = 50; // Changes per minute
const OUTLIER_STD_THRESHOLD = 3; // Standard deviations
const CONSENSUS_MIN = 0.6; // 60% agreement required

// State
let robustnessHistory: RobustnessMetrics[] = [];
let anomalyHistory: AnomalyRecord[] = [];

/**
 * Detect outliers using statistical methods
 */
const detectOutliers = async (): Promise<AnomalyRecord[]> => {
  const anomalies: AnomalyRecord[] = [];

  // Get recent clusters
  const clusters = await Cluster.find()
    .sort({ lastUpdated: -1 })
    .limit(50);

  if (clusters.length < 5) {
    return anomalies;
  }

  // Calculate statistics for volatility index
  const volatilities = clusters.map(c => c.volatilityIndex);
  const mean = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  const variance = volatilities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volatilities.length;
  const std = Math.sqrt(variance);

  // Find outliers
  for (const cluster of clusters) {
    const zScore = Math.abs((cluster.volatilityIndex - mean) / std);
    
    if (zScore > OUTLIER_STD_THRESHOLD) {
      anomalies.push({
        type: 'outlier',
        severity: zScore > 4 ? 'critical' : zScore > 3.5 ? 'high' : 'medium',
        description: `Statistical outlier detected: volatility index ${cluster.volatilityIndex.toFixed(2)} (z-score: ${zScore.toFixed(2)})`,
        affectedComponents: [`cluster:${cluster.clusterId}`],
        confidence: Math.min(95, 60 + zScore * 10),
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
};

/**
 * Detect coordinated amplification patterns
 */
const detectCoordination = async (): Promise<AnomalyRecord[]> => {
  const anomalies: AnomalyRecord[] = [];

  // Get narratives
  const narratives = await Narrative.find({
    lifecycleStage: { $ne: 'Recovered' }
  });

  // Check for synchronized activity
  if (narratives.length > 3) {
    // Check growth velocity similarity (potential coordination)
    const velocities = narratives.map(n => n.growthVelocity || 0);
    const velocitySet = new Set(velocities.map(v => v.toFixed(2)));
    
    // If many similar velocities, might be coordinated
    if (velocitySet.size < narratives.length * 0.3 && narratives.length > 5) {
      anomalies.push({
        type: 'coordination',
        severity: 'medium',
        description: `Potential coordinated activity: ${narratives.length} narratives with similar growth patterns`,
        affectedComponents: narratives.slice(0, 5).map(n => `narrative:${n.clusterId}`),
        confidence: 65,
        timestamp: new Date(),
      });
    }
  }

  // Check for rapid sequential activations
  const sortedNarratives = narratives.sort((a, b) => 
    new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()
  );

  if (sortedNarratives.length >= 3) {
    const timeDiffs = [];
    for (let i = 0; i < sortedNarratives.length - 1; i++) {
      const timeDiff = Math.abs(
        new Date(sortedNarratives[i].lastActive || 0).getTime() - 
        new Date(sortedNarratives[i + 1].lastActive || 0).getTime()
      ) / 60000; // minutes
      timeDiffs.push(timeDiff);
    }

    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    
    // If all activations within 5 minutes of each other
    if (avgTimeDiff < 5 && timeDiffs.every(t => t < 10)) {
      anomalies.push({
        type: 'coordination',
        severity: 'high',
        description: `Coordinated narrative activation detected: ${narratives.length} narratives activated within ${avgTimeDiff.toFixed(1)} minutes`,
        affectedComponents: narratives.slice(0, 5).map(n => `narrative:${n.clusterId}`),
        confidence: 80,
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
};

/**
 * Detect rate anomalies
 */
const detectRateAnomalies = async (): Promise<AnomalyRecord[]> => {
  const anomalies: AnomalyRecord[] = [];

  // Get recent risk snapshots
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(20);

  if (snapshots.length < 10) {
    return anomalies;
  }

  // Calculate rate of change
  const changes = [];
  for (let i = 0; i < snapshots.length - 1; i++) {
    const timeDiff = (
      new Date(snapshots[i].timestamp).getTime() - 
      new Date(snapshots[i + 1].timestamp).getTime()
    ) / 60000; // minutes

    if (timeDiff > 0) {
      const score1 = snapshots[i].overallRiskScore;
      const score2 = snapshots[i + 1].overallRiskScore;
      const change = Math.abs(score1 - score2);
      changes.push(change / timeDiff); // Change per minute
    }
  }

  if (changes.length > 0) {
    const avgRate = changes.reduce((a, b) => a + b, 0) / changes.length;
    const maxRate = Math.max(...changes);

    if (maxRate > RATE_THRESHOLD) {
      anomalies.push({
        type: 'rate_spike',
        severity: maxRate > RATE_THRESHOLD * 3 ? 'critical' : 'high',
        description: `Rate anomaly detected: risk changes at ${maxRate.toFixed(1)}/min (threshold: ${RATE_THRESHOLD}/min)`,
        affectedComponents: ['risk_score'],
        confidence: 85,
        timestamp: new Date(),
      });
    } else if (avgRate > RATE_THRESHOLD * 0.5) {
      anomalies.push({
        type: 'rate_spike',
        severity: 'medium',
        description: `Elevated change rate: average ${avgRate.toFixed(1)}/min`,
        affectedComponents: ['risk_score'],
        confidence: 60,
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
};

/**
 * Detect potential data poisoning
 */
const detectDataPoisoning = async (): Promise<AnomalyRecord[]> => {
  const anomalies: AnomalyRecord[] = [];

  // Get recent data
  const recentNarratives = await Narrative.find()
    .sort({ lastActive: -1 })
    .limit(100);

  // Check for suspicious data patterns
  // 1. Unusual sentiment distributions
  const sentiments = recentNarratives.map(n => n.avgSentiment || 0.5);
  const extremeSentiments = sentiments.filter(s => s < 0.1 || s > 0.9);
  
  if (extremeSentiments.length > sentiments.length * 0.4) {
    anomalies.push({
      type: 'data_poisoning',
      severity: 'medium',
      description: `Suspicious sentiment distribution: ${extremeSentiments.length} extreme values out of ${sentiments.length}`,
      affectedComponents: ['narrative_data'],
      confidence: 55,
      timestamp: new Date(),
    });
  }

  // 2. Unusual growth patterns
  const growthRates = recentNarratives.map(n => n.growthVelocity || 0);
  const unusualGrowth = growthRates.filter(g => g > 0.9 || g < 0.1);
  
  if (unusualGrowth.length > growthRates.length * 0.3) {
    anomalies.push({
      type: 'data_poisoning',
      severity: 'medium',
      description: `Suspicious growth patterns detected: ${unusualGrowth.length} unusual values`,
      affectedComponents: ['narrative_data'],
      confidence: 50,
      timestamp: new Date(),
    });
  }

  return anomalies;
};

/**
 * Calculate consensus score
 */
const calculateConsensusScore = async (anomalies: AnomalyRecord[]): Promise<number> => {
  if (anomalies.length === 0) {
    return 1.0;
  }

  // Weight by severity
  const severityWeights = {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
  };

  // Calculate weighted anomaly score
  const anomalyScore = anomalies.reduce((sum, a) => 
    sum + severityWeights[a.severity], 0
  ) / anomalies.length;

  // Convert to consensus (1 - anomaly_score)
  return Math.max(0, 1 - anomalyScore);
};

/**
 * Main robustness check
 */
export const runRobustnessCheck = async (): Promise<RobustnessMetrics> => {
  // Run all detection methods
  const [outliers, coordination, rateAnomalies, poisoning] = await Promise.all([
    detectOutliers(),
    detectCoordination(),
    detectRateAnomalies(),
    detectDataPoisoning(),
  ]);

  // Combine all anomalies
  const allAnomalies = [...outliers, ...coordination, ...rateAnomalies, ...poisoning];

  // Calculate consensus
  const consensusScore = await calculateConsensusScore(allAnomalies);

  // Determine validation status
  let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';
  const criticalCount = allAnomalies.filter(a => a.severity === 'critical').length;
  const highCount = allAnomalies.filter(a => a.severity === 'high').length;

  if (criticalCount > 0 || consensusScore < 0.4) {
    validationStatus = 'fail';
  } else if (highCount > 0 || consensusScore < 0.7) {
    validationStatus = 'warning';
  }

  const metrics: RobustnessMetrics = {
    outlierCount: outliers.length,
    suspiciousPatterns: coordination.length + poisoning.length,
    consensusScore: Math.round(consensusScore * 100) / 100,
    validationStatus,
    anomaliesDetected: allAnomalies,
    timestamp: new Date(),
  };

  // Store in history
  robustnessHistory.push(metrics);
  anomalyHistory.push(...allAnomalies);

  // Keep only recent history
  if (robustnessHistory.length > 100) {
    robustnessHistory = robustnessHistory.slice(-100);
  }
  if (anomalyHistory.length > 200) {
    anomalyHistory = anomalyHistory.slice(-200);
  }

  return metrics;
};

/**
 * Get current robustness status
 */
export const getRobustnessStatus = async (): Promise<{
  status: 'healthy' | 'warning' | 'compromised';
  consensusScore: number;
  recentAnomalies: number;
  criticalAlerts: number;
}> => {
  const latestMetrics = robustnessHistory.length > 0 
    ? robustnessHistory[robustnessHistory.length - 1] 
    : await runRobustnessCheck();

  return {
    status: latestMetrics.validationStatus === 'fail' ? 'compromised' :
            latestMetrics.validationStatus === 'warning' ? 'warning' : 'healthy',
    consensusScore: latestMetrics.consensusScore,
    recentAnomalies: latestMetrics.anomaliesDetected.length,
    criticalAlerts: latestMetrics.anomaliesDetected.filter(a => a.severity === 'critical').length,
  };
};

/**
 * Get anomaly history
 */
export const getAnomalyHistory = (
  type?: AnomalyRecord['type'],
  limit: number = 20
): AnomalyRecord[] => {
  let filtered = anomalyHistory;
  
  if (type) {
    filtered = filtered.filter(a => a.type === type);
  }

  return filtered.slice(-limit);
};

/**
 * Get robustness history
 */
export const getRobustnessHistory = (limit: number = 50): RobustnessMetrics[] => {
  return robustnessHistory.slice(-limit);
};

/**
 * Get anomaly statistics
 */
export const getAnomalyStatistics = (): {
  totalAnomalies: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  trend: 'increasing' | 'stable' | 'decreasing';
} => {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const anomaly of anomalyHistory) {
    byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
    bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
  }

  // Calculate trend
  const recent = anomalyHistory.slice(-20);
  const older = anomalyHistory.slice(-40, -20);
  
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (older.length > 0 && recent.length > older.length * 1.5) {
    trend = 'increasing';
  } else if (older.length > 0 && recent.length < older.length * 0.5) {
    trend = 'decreasing';
  }

  return {
    totalAnomalies: anomalyHistory.length,
    byType,
    bySeverity,
    trend,
  };
};

/**
 * Validate input data
 */
export const validateInputData = async (data: any): Promise<{
  isValid: boolean;
  warnings: string[];
  shouldBlock: boolean;
}> => {
  const warnings: string[] = [];
  let shouldBlock = false;

  // Check for obviously invalid values
  if (typeof data.overallRiskScore === 'number' && (data.overallRiskScore < 0 || data.overallRiskScore > 100)) {
    warnings.push('Risk score out of valid range [0, 100]');
    shouldBlock = true;
  }

  // Check for null/undefined critical fields
  if (!data.overallRiskScore && data.overallRiskScore !== 0) {
    warnings.push('Missing risk score');
    shouldBlock = true;
  }

  // Run quick robustness check
  const status = await getRobustnessStatus();
  if (status.status === 'compromised') {
    warnings.push('System robustness compromised - validation may be unreliable');
  }

  return {
    isValid: !shouldBlock,
    warnings,
    shouldBlock,
  };
};

/**
 * Get protection recommendations
 */
export const getProtectionRecommendations = async (): Promise<{
  recommendations: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}> => {
  const status = await getRobustnessStatus();
  const stats = getAnomalyStatistics();
  
  const recommendations: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (status.status === 'compromised') {
    priority = 'critical';
    recommendations.push('CRITICAL: System may be under adversarial attack');
    recommendations.push('Enable enhanced monitoring and logging');
    recommendations.push('Consider data source validation');
  } else if (status.status === 'warning') {
    priority = 'high';
    recommendations.push('Review recent anomalies for patterns');
    recommendations.push('Increase data validation strictness');
  }

  if (stats.trend === 'increasing') {
    recommendations.push('Anomaly rate increasing - investigate data sources');
  }

  if (stats.byType.coordination > 5) {
    recommendations.push('Multiple coordination patterns detected - review narrative interactions');
  }

  return { recommendations, priority };
};
