/**
 * Intervention Impact Modeling Service
 * 
 * Learns from historical actions and measures intervention effectiveness.
 * 
 * Metrics:
 * - impactScore = (preRisk - postRiskAdjusted) / interventionStrength
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Narrative } from '../models/Narrative';

// Intervention effectiveness record
export interface InterventionEffectiveness {
  actionType: string;
  avgImpact: number;
  confidenceScore: number;
  sampleSize: number;
  recommendedUsageContext: string;
  historicalResults: {
    timestamp: Date;
    preRisk: number;
    postRisk: number;
    impact: number;
  }[];
}

// Intervention record for tracking
interface InterventionRecord {
  actionType: string;
  timestamp: Date;
  preRisk: number;
  postRisk: number;
  targetCluster?: string;
  strength: number;
}

// In-memory storage
let interventionHistory: InterventionRecord[] = [];
let effectivenessCache: Map<string, InterventionEffectiveness> = new Map();

// Action types
export type ActionType = 
  | 'containment_messaging'
  | 'regional_moderator'
  | 'amplifier_suppression'
  | 'counter_narrative_deployment'
  | 'sentiment_dampening'
  | 'early_warning';

/**
 * Record an intervention action
 */
export const recordIntervention = async (
  actionType: ActionType,
  preRisk: number,
  postRisk: number,
  strength: number = 1.0,
  targetCluster?: string
): Promise<void> => {
  const record: InterventionRecord = {
    actionType,
    timestamp: new Date(),
    preRisk,
    postRisk,
    targetCluster,
    strength,
  };

  interventionHistory.push(record);

  // Keep only last 500 records
  if (interventionHistory.length > 500) {
    interventionHistory = interventionHistory.slice(-500);
  }

  // Recalculate effectiveness for this action type
  await calculateEffectiveness(actionType);
};

/**
 * Calculate effectiveness metrics for an action type
 */
const calculateEffectiveness = async (actionType: string): Promise<InterventionEffectiveness> => {
  const relevantRecords = interventionHistory.filter(r => r.actionType === actionType);

  if (relevantRecords.length === 0) {
    const empty: InterventionEffectiveness = {
      actionType,
      avgImpact: 0,
      confidenceScore: 0,
      sampleSize: 0,
      recommendedUsageContext: 'No historical data available',
      historicalResults: [],
    };
    effectivenessCache.set(actionType, empty);
    return empty;
  }

  // Calculate impacts
  const results = relevantRecords.map(r => ({
    timestamp: r.timestamp,
    preRisk: r.preRisk,
    postRisk: r.postRisk,
    impact: r.strength > 0 ? (r.preRisk - r.postRisk) / r.strength : 0,
  }));

  const avgImpact = results.reduce((sum, r) => sum + r.impact, 0) / results.length;
  
  // Calculate confidence based on sample size and variance
  const variance = results.reduce((sum, r) => sum + Math.pow(r.impact - avgImpact, 2), 0) / results.length;
  const stdDev = Math.sqrt(variance);
  const sampleSizeFactor = Math.min(1, results.length / 20);  // 20 samples = full confidence
  const stabilityFactor = Math.max(0, 1 - stdDev / 50);  // Low variance = high confidence
  const confidenceScore = sampleSizeFactor * stabilityFactor * 100;

  // Determine recommended usage context
  let recommendedUsageContext = '';
  if (avgImpact > 20) {
    recommendedUsageContext = 'Highly effective - deploy at earliest sign of escalation';
  } else if (avgImpact > 10) {
    recommendedUsageContext = 'Moderately effective - deploy during acceleration phase';
  } else if (avgImpact > 5) {
    recommendedUsageContext = 'Low effectiveness - use as supplementary measure';
  } else {
    recommendedUsageContext = 'Limited impact - consider alternative interventions';
  }

  const effectiveness: InterventionEffectiveness = {
    actionType,
    avgImpact: Math.round(avgImpact * 100) / 100,
    confidenceScore: Math.round(confidenceScore),
    sampleSize: results.length,
    recommendedUsageContext,
    historicalResults: results.slice(-20),  // Keep last 20 for display
  };

  effectivenessCache.set(actionType, effectiveness);
  return effectiveness;
};

/**
 * Get effectiveness for all action types
 */
export const getAllEffectiveness = async (): Promise<InterventionEffectiveness[]> => {
  const actionTypes: ActionType[] = [
    'containment_messaging',
    'regional_moderator',
    'amplifier_suppression',
    'counter_narrative_deployment',
    'sentiment_dampening',
    'early_warning',
  ];

  const results: InterventionEffectiveness[] = [];

  for (const actionType of actionTypes) {
    const effectiveness = effectivenessCache.get(actionType);
    if (effectiveness) {
      results.push(effectiveness);
    } else {
      results.push(await calculateEffectiveness(actionType));
    }
  }

  // Sort by average impact descending
  return results.sort((a, b) => b.avgImpact - a.avgImpact);
};

/**
 * Get effectiveness for specific action type
 */
export const getActionEffectiveness = async (
  actionType: ActionType
): Promise<InterventionEffectiveness | null> => {
  const cached = effectivenessCache.get(actionType);
  if (cached) {
    return cached;
  }

  return await calculateEffectiveness(actionType);
};

/**
 * Get ranked recommendations based on effectiveness
 */
export const getRankedRecommendations = async (
  currentRisk: number,
  riskLevel: 'emerging' | 'accelerating' | 'peak'
): Promise<{
  action: ActionType;
  effectiveness: number;
  confidence: number;
  reasoning: string;
}[]> => {
  const allEffectiveness = await getAllEffectiveness();

  // Filter and rank based on current context
  const recommendations = allEffectiveness.map(e => {
    let reasoning = e.recommendedUsageContext;
    
    // Adjust reasoning based on current risk level
    if (riskLevel === 'emerging' && e.avgImpact > 15) {
      reasoning = `Highly recommended for early intervention: ${e.recommendedUsageContext}`;
    } else if (riskLevel === 'peak' && e.actionType === 'early_warning') {
      reasoning = 'Late stage - early warning may have reduced effectiveness';
    }

    return {
      action: e.actionType as ActionType,
      effectiveness: e.avgImpact,
      confidence: e.confidenceScore,
      reasoning,
    };
  });

  // Sort by effectiveness
  return recommendations.sort((a, b) => b.effectiveness - a.effectiveness);
};

/**
 * Get intervention impact over time
 */
export const getImpactTrend = async (
  actionType?: ActionType
): Promise<{
  actionType: string;
  trend: 'improving' | 'degrading' | 'stable';
  recentAvgImpact: number;
  olderAvgImpact: number;
  change: number;
}[]> => {
  const filtered = actionType
    ? interventionHistory.filter(r => r.actionType === actionType)
    : interventionHistory;

  if (filtered.length < 10) {
    return [];
  }

  // Split into recent and older
  const sorted = [...filtered].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const recent = sorted.slice(0, midpoint);
  const older = sorted.slice(midpoint);

  const recentAvg = recent.reduce((sum, r) => sum + (r.preRisk - r.postRisk), 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + (r.preRisk - r.postRisk), 0) / older.length;

  const change = recentAvg - olderAvg;
  let trend: 'improving' | 'degrading' | 'stable' = 'stable';
  if (change > 5) trend = 'improving';
  else if (change < -5) trend = 'degrading';

  return [{
    actionType: actionType || 'all',
    trend,
    recentAvgImpact: Math.round(recentAvg * 100) / 100,
    olderAvgImpact: Math.round(olderAvg * 100) / 100,
    change: Math.round(change * 100) / 100,
  }];
};

/**
 * Simulate expected impact of intervention
 */
export const predictInterventionImpact = async (
  actionType: ActionType,
  currentRisk: number,
  strength: number = 1.0
): Promise<{
  expectedRiskReduction: number;
  confidenceRange: { min: number; max: number };
  timeToEffect: number;  // minutes
}> => {
  const effectiveness = await getActionEffectiveness(actionType);

  if (!effectiveness || effectiveness.sampleSize < 3) {
    // Low confidence prediction
    return {
      expectedRiskReduction: currentRisk * 0.1,
      confidenceRange: { min: 0, max: currentRisk * 0.2 },
      timeToEffect: 30,
    };
  }

  const expectedReduction = effectiveness.avgImpact * strength;
  
  // Calculate confidence range based on variance
  const varianceFactor = effectiveness.confidenceScore < 50 ? 0.3 : 0.15;
  const confidenceRange = {
    min: Math.max(0, expectedReduction * (1 - varianceFactor)),
    max: expectedReduction * (1 + varianceFactor),
  };

  // Estimate time to effect based on action type
  let timeToEffect = 30;
  switch (actionType) {
    case 'sentiment_dampening':
      timeToEffect = 45;
      break;
    case 'counter_narrative_deployment':
      timeToEffect = 60;
      break;
    case 'amplifier_suppression':
      timeToEffect = 20;
      break;
    case 'early_warning':
      timeToEffect = 10;
      break;
  }

  return {
    expectedRiskReduction: Math.round(expectedReduction * 100) / 100,
    confidenceRange: {
      min: Math.round(confidenceRange.min * 100) / 100,
      max: Math.round(confidenceRange.max * 100) / 100,
    },
    timeToEffect,
  };
};

/**
 * Get historical interventions
 */
export const getInterventionHistory = (limit: number = 50): InterventionRecord[] => {
  return interventionHistory.slice(-limit);
};

/**
 * Get optimal intervention for current situation
 */
export const getOptimalIntervention = async (
  currentRisk: number,
  riskVelocity: number,  // risk change per hour
  hasAmplifiers: boolean
): Promise<{
  recommendedAction: ActionType;
  expectedImpact: number;
  confidence: number;
  alternativeActions: ActionType[];
}> => {
  const recommendations = await getRankedRecommendations(
    currentRisk,
    riskVelocity > 10 ? 'peak' : riskVelocity > 5 ? 'accelerating' : 'emerging'
  );

  if (recommendations.length === 0) {
    return {
      recommendedAction: 'early_warning',
      expectedImpact: 5,
      confidence: 30,
      alternativeActions: [],
    };
  }

  // Filter based on current situation
  let filtered = [...recommendations];
  
  // If there are amplifiers, prioritize suppression
  if (hasAmplifiers) {
    const suppressor = filtered.find(r => r.action === 'amplifier_suppression');
    if (suppressor) {
      filtered = [suppressor, ...filtered.filter(r => r.action !== 'amplifier_suppression')];
    }
  }

  const best = filtered[0];

  return {
    recommendedAction: best.action,
    expectedImpact: best.effectiveness,
    confidence: best.confidence,
    alternativeActions: filtered.slice(1, 4).map(r => r.action),
  };
};
