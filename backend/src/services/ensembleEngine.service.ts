import { Cluster } from '../models/Cluster';
import { Narrative, INarrative } from '../models/Narrative';
import { NarrativeInteraction } from '../models/NarrativeInteraction';
import { RiskSnapshot, IRiskSnapshot } from '../models/RiskSnapshot';

export interface EnsembleRiskInput {
  ruleBasedScore: number;        // From riskEngine
  anomalyScore: number;          // From anomaly detection
  projectionScore: number;       // Time-to-peak risk projection
  interactionScore: number;      // Interaction amplification
}

export interface EnsembleRiskResult {
  ensembleRiskScore: number;
  calibratedScore: number;
  componentScores: {
    ruleBasedScore: number;
    anomalyModelScore: number;
    projectionScore: number;
    interactionScore: number;
  };
  confidenceLevel: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  timestamp: Date;
}

// Weights for ensemble model
const WEIGHTS = {
  ruleBased: 0.35,
  anomalyModel: 0.25,
  projection: 0.20,
  interaction: 0.20,
};

// Calibration parameters (updated based on calibration metrics)
let calibrationScale = 1.0;
let calibrationOffset = 0.0;

/**
 * Calculate the ensemble risk score combining multiple models
 */
export const calculateEnsembleRisk = async (input: EnsembleRiskInput): Promise<EnsembleRiskResult> => {
  // Normalize all inputs to 0-100 scale
  const normalizedRuleScore = normalizeTo100(input.ruleBasedScore);
  const normalizedAnomalyScore = normalizeTo100(input.anomalyScore);
  const normalizedProjectionScore = normalizeTo100(input.projectionScore);
  const normalizedInteractionScore = normalizeTo100(input.interactionScore);

  // Calculate weighted ensemble
  const ensembleScore = 
    (normalizedRuleScore * WEIGHTS.ruleBased) +
    (normalizedAnomalyScore * WEIGHTS.anomalyModel) +
    (normalizedProjectionScore * WEIGHTS.projection) +
    (normalizedInteractionScore * WEIGHTS.interaction);

  // Apply calibration
  const calibratedScore = Math.min(100, Math.max(0, 
    (ensembleScore * calibrationScale) + calibrationOffset
  ));

  // Calculate confidence based on model agreement
  const scores = [normalizedRuleScore, normalizedAnomalyScore, normalizedProjectionScore, normalizedInteractionScore];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = higher confidence
  const confidenceLevel = Math.max(0, Math.min(100, 100 - (stdDev * 2)));

  // Determine risk level
  let riskLevel: EnsembleRiskResult['riskLevel'];
  if (calibratedScore < 25) {
    riskLevel = 'Low';
  } else if (calibratedScore < 50) {
    riskLevel = 'Moderate';
  } else if (calibratedScore < 75) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Critical';
  }

  return {
    ensembleRiskScore: Math.round(ensembleScore * 100) / 100,
    calibratedScore: Math.round(calibratedScore * 100) / 100,
    componentScores: {
      ruleBasedScore: Math.round(normalizedRuleScore * 100) / 100,
      anomalyModelScore: Math.round(normalizedAnomalyScore * 100) / 100,
      projectionScore: Math.round(normalizedProjectionScore * 100) / 100,
      interactionScore: Math.round(normalizedInteractionScore * 100) / 100,
    },
    confidenceLevel: Math.round(confidenceLevel),
    riskLevel,
    timestamp: new Date(),
  };
};

/**
 * Gather all components needed for ensemble risk calculation
 */
export const gatherEnsembleComponents = async (): Promise<EnsembleRiskInput> => {
  // 1. Get rule-based score from latest risk snapshot
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const ruleBasedScore = latestSnapshot?.overallRiskScore || 0;

  // 2. Get anomaly score (simulated - in production would use Isolation Forest)
  const clusters = await Cluster.find().sort({ volatilityIndex: -1 });
  const anomalyScore = clusters.length > 0 
    ? clusters[0].volatilityIndex * 100 
    : 0;

  // 3. Get projection score from narratives (time-to-peak)
  const narratives = await Narrative.find({ 
    lifecycleStage: { $in: ['Emerging', 'Accelerating'] } 
  }).sort({ timeToPeakPrediction: 1 }).limit(5);
  
  let projectionScore = 0;
  if (narratives.length > 0) {
    // Lower time-to-peak = higher risk projection
    const avgTimeToPeak = narratives.reduce((sum, n) => sum + (n.timeToPeakPrediction || 999), 0) / narratives.length;
    projectionScore = Math.max(0, 100 - (avgTimeToPeak / 2)); // Scale to 0-100
  }

  // 4. Get interaction score from active interactions
  const activeInteractions = await NarrativeInteraction.find({ isActive: true });
  let interactionScore = 0;
  if (activeInteractions.length > 0) {
    const avgInteraction = activeInteractions.reduce((sum, i) => sum + i.interactionScore, 0) / activeInteractions.length;
    interactionScore = avgInteraction * 100;
  }

  return {
    ruleBasedScore,
    anomalyScore,
    projectionScore,
    interactionScore,
  };
};

/**
 * Compute full ensemble risk with all components
 */
export const computeEnsembleRisk = async (): Promise<EnsembleRiskResult> => {
  const components = await gatherEnsembleComponents();
  return calculateEnsembleRisk(components);
};

/**
 * Update calibration parameters
 */
export const updateCalibration = (scale: number, offset: number): void => {
  calibrationScale = scale;
  calibrationOffset = offset;
};

/**
 * Get current calibration parameters
 */
export const getCalibrationParams = (): { scale: number; offset: number } => {
  return { scale: calibrationScale, offset: calibrationOffset };
};

/**
 * Save ensemble risk snapshot
 */
export const saveEnsembleSnapshot = async (result: EnsembleRiskResult): Promise<IRiskSnapshot> => {
  // Map ensemble result to risk snapshot format for backward compatibility
  const snapshot = new RiskSnapshot({
    overallRiskScore: result.calibratedScore,
    sentimentAcceleration: result.componentScores.ruleBasedScore * 0.3,
    clusterGrowthRate: result.componentScores.projectionScore * 0.25,
    anomalyScore: result.componentScores.anomalyModelScore,
    narrativeSpreadSpeed: result.componentScores.interactionScore * 0.2,
    classification: mapRiskLevelToClassification(result.riskLevel),
    timestamp: result.timestamp,
  });

  return await snapshot.save();
};

/**
 * Get historical ensemble risk scores
 */
export const getEnsembleHistory = async (limit: number = 50): Promise<IRiskSnapshot[]> => {
  return await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Get ensemble metrics summary
 */
export const getEnsembleMetricsSummary = async (): Promise<{
  currentScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  avgScore: number;
  maxScore: number;
  minScore: number;
}> => {
  const history = await getEnsembleHistory(20);
  
  if (history.length === 0) {
    return {
      currentScore: 0,
      trend: 'stable',
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
    };
  }

  const scores = history.map(h => h.overallRiskScore);
  const currentScore = scores[0];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (scores.length >= 5) {
    const recentAvg = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / (scores.length / 2);
    const olderAvg = scores.slice(Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / (scores.length / 2);
    
    if (recentAvg > olderAvg + 5) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg - 5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }
  } else {
    trend = 'stable';
  }

  return {
    currentScore: Math.round(currentScore),
    trend,
    avgScore: Math.round(avgScore),
    maxScore: Math.round(maxScore),
    minScore: Math.round(minScore),
  };
};

// Helper functions
function normalizeTo100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function mapRiskLevelToClassification(level: EnsembleRiskResult['riskLevel']): 
  'Stable' | 'Emerging Concern' | 'Escalation Risk' | 'Panic Formation Likely' {
  switch (level) {
    case 'Low':
      return 'Stable';
    case 'Moderate':
      return 'Emerging Concern';
    case 'High':
      return 'Escalation Risk';
    case 'Critical':
      return 'Panic Formation Likely';
    default:
      return 'Stable';
  }
}
