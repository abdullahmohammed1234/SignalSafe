/**
 * Strategic Recommendation Optimizer Service
 * 
 * Uses:
 * - Current risk profile
 * - Spread probability
 * - Escalation velocity
 * - Intervention effectiveness history
 * 
 * Outputs ranked strategic actions with effectiveness scores
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Narrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';
import { getActionEffectiveness, getRankedRecommendations, predictInterventionImpact } from './interventionImpact.service';
import { getDriftStatus } from './driftDetection.service';
import { getCurrentWeights } from './adaptiveWeightEngine.service';

// Strategic action interface
export interface StrategicAction {
  action: string;
  effectiveness: number;
  confidence: number;
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: number;
  timeToEffect: number;
  alternativeActions: string[];
}

// Risk profile
interface RiskProfile {
  currentRisk: number;
  riskVelocity: number;
  spreadProbability: number;
  escalationStage: 'dormant' | 'emerging' | 'accelerating' | 'peak' | 'declining';
  hasAmplifiers: boolean;
  regionalSpread: number;
}

/**
 * Calculate current risk profile
 */
const calculateRiskProfile = async (): Promise<RiskProfile> => {
  // Get current risk
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const currentRisk = latestSnapshot?.overallRiskScore || 0;

  // Calculate risk velocity (change over recent snapshots)
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(10);

  let riskVelocity = 0;
  if (recentSnapshots.length >= 2) {
    const oldest = recentSnapshots[recentSnapshots.length - 1];
    const newest = recentSnapshots[0];
    const timeDiff = (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 3600000; // hours
    if (timeDiff > 0) {
      riskVelocity = (newest.overallRiskScore - oldest.overallRiskScore) / timeDiff;
    }
  }

  // Get active narratives for spread probability
  const activeNarratives = await Narrative.find({
    lifecycleStage: { $in: ['Emerging', 'Accelerating', 'Peak'] }
  });

  // Calculate spread probability based on narrative interactions
  const spreadProbability = Math.min(100, activeNarratives.length * 15 + 20);

  // Determine escalation stage
  let escalationStage: RiskProfile['escalationStage'] = 'dormant';
  if (currentRisk > 75 || riskVelocity > 15) {
    escalationStage = 'peak';
  } else if (currentRisk > 50 || riskVelocity > 8) {
    escalationStage = 'accelerating';
  } else if (currentRisk > 25 || riskVelocity > 3) {
    escalationStage = 'emerging';
  }

  // Check for amplifiers
  const clusters = await Cluster.find().sort({ volatilityIndex: -1 });
  const hasAmplifiers = clusters.some(c => c.volatilityIndex > 0.7);

  // Calculate regional spread
  const regionalSpread = clusters.length > 0 
    ? Math.min(100, clusters.reduce((sum, c) => sum + (c.growthRate || 0) * 30, 0))
    : 0;

  return {
    currentRisk,
    riskVelocity,
    spreadProbability,
    escalationStage,
    hasAmplifiers,
    regionalSpread,
  };
};

/**
 * Calculate priority based on risk profile
 */
const calculatePriority = (
  riskProfile: RiskProfile
): 'critical' | 'high' | 'medium' | 'low' => {
  if (riskProfile.currentRisk >= 80 || riskProfile.riskVelocity >= 20) {
    return 'critical';
  }
  if (riskProfile.currentRisk >= 60 || riskProfile.riskVelocity >= 10) {
    return 'high';
  }
  if (riskProfile.currentRisk >= 30 || riskProfile.riskVelocity >= 5) {
    return 'medium';
  }
  return 'low';
};

/**
 * Generate strategic recommendations
 */
export const generateStrategicRecommendations = async (): Promise<{
  summary: string;
  riskProfile: RiskProfile;
  recommendedActions: StrategicAction[];
  autonomousMode: boolean;
  timestamp: Date;
}> => {
  // Calculate risk profile
  const riskProfile = await calculateRiskProfile();

  // Get intervention recommendations
  const interventionRecs = await getRankedRecommendations(
    riskProfile.currentRisk,
    riskProfile.escalationStage === 'peak' ? 'peak' : 
    riskProfile.escalationStage === 'accelerating' ? 'accelerating' : 'emerging'
  );

  // Get drift status
  const driftStatus = await getDriftStatus();

  // Get current ensemble weights
  const ensembleWeights = getCurrentWeights();

  // Build strategic actions
  const recommendedActions: StrategicAction[] = [];

  // Add intervention recommendations
  for (const rec of interventionRecs.slice(0, 5)) {
    const impact = await predictInterventionImpact(
      rec.action as any,
      riskProfile.currentRisk,
      0.8
    );

    let priority = calculatePriority(riskProfile);
    if (rec.effectiveness > 20) {
      priority = priority === 'critical' ? 'critical' : 
                  priority === 'high' ? 'high' : 'medium';
    }

    recommendedActions.push({
      action: formatActionName(rec.action),
      effectiveness: Math.round(rec.effectiveness),
      confidence: rec.confidence,
      reasoning: rec.reasoning,
      priority,
      estimatedImpact: Math.round(impact.expectedRiskReduction),
      timeToEffect: impact.timeToEffect,
      alternativeActions: interventionRecs
        .filter(r => r.action !== rec.action)
        .slice(0, 2)
        .map(r => formatActionName(r.action)),
    });
  }

  // Add model health recommendations if drift detected
  if (driftStatus && driftStatus.overallDriftScore > 0.5) {
    recommendedActions.push({
      action: 'Model Retraining',
      effectiveness: Math.round((1 - driftStatus.overallDriftScore) * 50),
      confidence: 80,
      reasoning: `Drift detected (score: ${Math.round(driftStatus.overallDriftScore * 100)}%) - model retraining recommended`,
      priority: driftStatus.overallDriftScore > 0.7 ? 'critical' : 'high',
      estimatedImpact: 15,
      timeToEffect: 60,
      alternativeActions: ['Weight Reoptimization', 'Calibration Update'],
    });
  }

  // Add regional containment if spread is high
  if (riskProfile.regionalSpread > 60) {
    recommendedActions.push({
      action: 'Regional Containment',
      effectiveness: Math.round(riskProfile.regionalSpread * 0.5),
      confidence: 70,
      reasoning: `High regional spread detected (${Math.round(riskProfile.regionalSpread)}%) - targeted containment recommended`,
      priority: riskProfile.regionalSpread > 80 ? 'high' : 'medium',
      estimatedImpact: Math.round(riskProfile.regionalSpread * 0.3),
      timeToEffect: 45,
      alternativeActions: ['Amplifier Suppression', 'Sentiment Dampening'],
    });
  }

  // Sort by effectiveness
  recommendedActions.sort((a, b) => b.effectiveness - a.effectiveness);

  // Generate summary
  let summary = '';
  if (riskProfile.currentRisk >= 75) {
    summary = `CRITICAL: Immediate action required. Risk at ${Math.round(riskProfile.currentRisk)}% with ${riskProfile.escalationStage} escalation.`;
  } else if (riskProfile.currentRisk >= 50) {
    summary = `HIGH: Active intervention recommended. Risk at ${Math.round(riskProfile.currentRisk)}% - ${riskProfile.escalationStage} stage.`;
  } else if (riskProfile.currentRisk >= 25) {
    summary = `MODERATE: Monitoring and preparation advised. Risk at ${Math.round(riskProfile.currentRisk)}%.`;
  } else {
    summary = `LOW: System stable. Risk at ${Math.round(riskProfile.currentRisk)}% - maintain vigilance.`;
  }

  // Determine if autonomous mode should be enabled
  const autonomousMode = riskProfile.currentRisk >= 50 || riskProfile.riskVelocity >= 10;

  return {
    summary,
    riskProfile,
    recommendedActions,
    autonomousMode,
    timestamp: new Date(),
  };
};

/**
 * Get executive summary for strategic layer
 */
export const getExecutiveSummary = async (): Promise<{
  overallThreatLevel: 'green' | 'yellow' | 'orange' | 'red';
  primaryThreat: string;
  recommendedResponse: string;
  keyMetrics: {
    riskScore: number;
    riskVelocity: number;
    spreadProbability: number;
    confidenceLevel: number;
  };
  topActions: string[];
}> => {
  const strategy = await generateStrategicRecommendations();

  // Determine overall threat level
  let overallThreatLevel: 'green' | 'yellow' | 'orange' | 'red';
  if (strategy.riskProfile.currentRisk < 25) {
    overallThreatLevel = 'green';
  } else if (strategy.riskProfile.currentRisk < 50) {
    overallThreatLevel = 'yellow';
  } else if (strategy.riskProfile.currentRisk < 75) {
    overallThreatLevel = 'orange';
  } else {
    overallThreatLevel = 'red';
  }

  // Determine primary threat
  let primaryThreat = 'None';
  if (strategy.riskProfile.hasAmplifiers) {
    primaryThreat = 'Amplification Network Detected';
  } else if (strategy.riskProfile.escalationStage === 'peak') {
    primaryThreat = 'Peak Escalation';
  } else if (strategy.riskProfile.spreadProbability > 60) {
    primaryThreat = 'Rapid Spread Probability';
  }

  // Recommended response
  const topAction = strategy.recommendedActions[0];
  const recommendedResponse = topAction 
    ? `Deploy ${topAction.action} (${topAction.effectiveness}% effective)`
    : 'Continue monitoring';

  // Get confidence level from ensemble
  const weights = getCurrentWeights();
  const confidenceLevel = Math.round(
    100 - (
      Math.abs(weights.ruleBased - 0.35) * 20 +
      Math.abs(weights.anomalyModel - 0.25) * 20 +
      Math.abs(weights.projection - 0.20) * 20 +
      Math.abs(weights.interaction - 0.20) * 20
    )
  );

  return {
    overallThreatLevel,
    primaryThreat,
    recommendedResponse,
    keyMetrics: {
      riskScore: Math.round(strategy.riskProfile.currentRisk),
      riskVelocity: Math.round(strategy.riskProfile.riskVelocity * 10) / 10,
      spreadProbability: Math.round(strategy.riskProfile.spreadProbability),
      confidenceLevel,
    },
    topActions: strategy.recommendedActions.slice(0, 3).map(a => a.action),
  };
};

/**
 * Get real-time recommendation for specific scenario
 */
export const getRecommendationForScenario = async (
  scenario: 'containment' | 'escalation' | 'suppression' | 'early_intervention'
): Promise<StrategicAction | null> => {
  const strategy = await generateStrategicRecommendations();

  let targetAction: string;
  switch (scenario) {
    case 'containment':
      targetAction = 'containment_messaging';
      break;
    case 'escalation':
      targetAction = 'counter_narrative_deployment';
      break;
    case 'suppression':
      targetAction = 'amplifier_suppression';
      break;
    case 'early_intervention':
      targetAction = 'early_warning';
      break;
    default:
      return null;
  }

  return strategy.recommendedActions.find(a => 
    a.action.toLowerCase().includes(targetAction.replace('_', ' '))
  ) || null;
};

/**
 * Format action name for display
 */
const formatActionName = (action: string): string => {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get action timeline
 */
export const getActionTimeline = async (): Promise<{
  immediate: StrategicAction[];
  shortTerm: StrategicAction[];
  longTerm: StrategicAction[];
}> => {
  const strategy = await generateStrategicRecommendations();

  const immediate = strategy.recommendedActions.filter(a => 
    a.priority === 'critical' || a.timeToEffect <= 30
  );

  const shortTerm = strategy.recommendedActions.filter(a => 
    a.priority === 'high' && a.timeToEffect > 30 && a.timeToEffect <= 120
  );

  const longTerm = strategy.recommendedActions.filter(a => 
    a.priority === 'medium' || a.priority === 'low' || a.timeToEffect > 120
  );

  return {
    immediate,
    shortTerm,
    longTerm,
  };
};
