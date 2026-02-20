/**
 * Counterfactual Simulation Engine Service
 * 
 * Simulates "What if intervention X occurred at time Y?"
 * 
 * Capabilities:
 * - Sentiment dampening simulation
 * - Interaction suppression simulation
 * - Regional containment simulation
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Narrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';

// Counterfactual result
export interface CounterfactualResult {
  baselinePeakRisk: number;
  simulatedPeakRisk: number;
  riskReduction: number;
  timeShiftMinutes: number;
  interventionType: string;
  confidence: number;
  simulationHorizon: number;  // hours
  details: {
    sentimentImpact: number;
    spreadImpact: number;
    interactionImpact: number;
    peakDelay: number;
  };
  timestamp: Date;
}

// Intervention types
export type InterventionType = 
  | 'sentiment_dampening'
  | 'interaction_suppression'
  | 'regional_containment'
  | 'counter_narrative'
  | 'early_warning';

// Simulation parameters
interface SimulationParams {
  interventionType: InterventionType;
  timeShiftMinutes: number;
  strength: number;  // 0-1
  targetClusterId?: string;
  targetRegion?: string;
}

// Simulation history
let simulationHistory: CounterfactualResult[] = [];

/**
 * Calculate sentiment dampening effect
 */
const simulateSentimentDampening = (
  baselineRisk: number,
  timeShift: number,
  strength: number
): { newRisk: number; sentimentImpact: number } => {
  // Earlier intervention = more impact
  const timeFactor = Math.max(0, Math.min(1, -timeShift / 120)); // Max 2 hours early
  const impact = timeFactor * strength * 0.4;
  
  const newRisk = baselineRisk * (1 - impact);
  
  return {
    newRisk,
    sentimentImpact: impact * 100,
  };
};

/**
 * Calculate interaction suppression effect
 */
const simulateInteractionSuppression = (
  baselineRisk: number,
  timeShift: number,
  strength: number
): { newRisk: number; interactionImpact: number } => {
  // Earlier intervention = more impact
  const timeFactor = Math.max(0, Math.min(1, -timeShift / 90)); // Max 1.5 hours early
  const impact = timeFactor * strength * 0.35;
  
  const newRisk = baselineRisk * (1 - impact);
  
  return {
    newRisk,
    interactionImpact: impact * 100,
  };
};

/**
 * Calculate regional containment effect
 */
const simulateRegionalContainment = (
  baselineRisk: number,
  timeShift: number,
  strength: number
): { newRisk: number; spreadImpact: number } => {
  // Earlier intervention = more impact
  const timeFactor = Math.max(0, Math.min(1, -timeShift / 60)); // Max 1 hour early
  const impact = timeFactor * strength * 0.3;
  
  const newRisk = baselineRisk * (1 - impact);
  
  return {
    newRisk,
    spreadImpact: impact * 100,
  };
};

/**
 * Calculate counter-narrative effect
 */
const simulateCounterNarrative = (
  baselineRisk: number,
  timeShift: number,
  strength: number
): { newRisk: number; combinedImpact: number } => {
  // Counter-narrative is most effective when deployed early
  const timeFactor = Math.max(0, Math.min(1, -timeShift / 100));
  const impact = timeFactor * strength * 0.45;
  
  const newRisk = baselineRisk * (1 - impact);
  
  return {
    newRisk,
    combinedImpact: impact * 100,
  };
};

/**
 * Run counterfactual simulation
 */
export const runCounterfactualSimulation = async (
  params: SimulationParams
): Promise<CounterfactualResult> => {
  // Get current risk baseline
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const baselineRisk = latestSnapshot?.overallRiskScore || 50;

  // Get active narratives
  const activeNarratives = await Narrative.find({
    lifecycleStage: { $in: ['Emerging', 'Accelerating', 'Peak'] }
  });

  // Get clusters
  const clusters = await Cluster.find().sort({ volatilityIndex: -1 });

  // Calculate base risk based on narratives and clusters
  let adjustedBaseline = baselineRisk;
  
  if (activeNarratives.length > 0) {
    const avgVelocity = activeNarratives.reduce((sum, n) => sum + (n.growthVelocity || 0), 0) / activeNarratives.length;
    adjustedBaseline += avgVelocity * 10;
  }

  if (clusters.length > 0) {
    const maxVolatility = clusters[0].volatilityIndex;
    adjustedBaseline += maxVolatility * 20;
  }

  adjustedBaseline = Math.min(100, adjustedBaseline);

  // Apply intervention effect based on type
  let result: { newRisk: number; sentimentImpact?: number; spreadImpact?: number; interactionImpact?: number };
  const strength = params.strength || 0.8;

  switch (params.interventionType) {
    case 'sentiment_dampening':
      result = simulateSentimentDampening(adjustedBaseline, params.timeShiftMinutes, strength);
      break;
    case 'interaction_suppression':
      result = simulateInteractionSuppression(adjustedBaseline, params.timeShiftMinutes, strength);
      break;
    case 'regional_containment':
      result = simulateRegionalContainment(adjustedBaseline, params.timeShiftMinutes, strength);
      break;
    case 'counter_narrative':
      result = simulateCounterNarrative(adjustedBaseline, params.timeShiftMinutes, strength);
      break;
    default:
      result = { newRisk: adjustedBaseline };
  }

  // Calculate confidence based on data availability
  const dataPoints = activeNarratives.length + clusters.length;
  const confidence = Math.min(95, 50 + dataPoints * 5);

  // Calculate peak delay
  const peakDelay = Math.max(0, -params.timeShiftMinutes * 0.8);

  // Build result
  const simulationResult: CounterfactualResult = {
    baselinePeakRisk: Math.round(adjustedBaseline),
    simulatedPeakRisk: Math.round(result.newRisk),
    riskReduction: Math.round(adjustedBaseline - result.newRisk),
    timeShiftMinutes: params.timeShiftMinutes,
    interventionType: params.interventionType,
    confidence: Math.round(confidence),
    simulationHorizon: 24, // 24 hour simulation
    details: {
      sentimentImpact: Math.round((result as any).sentimentImpact || 0),
      spreadImpact: Math.round((result as any).spreadImpact || 0),
      interactionImpact: Math.round((result as any).interactionImpact || 0),
      peakDelay: Math.round(peakDelay),
    },
    timestamp: new Date(),
  };

  // Store in history
  simulationHistory.push(simulationResult);
  if (simulationHistory.length > 100) {
    simulationHistory = simulationHistory.slice(-100);
  }

  return simulationResult;
};

/**
 * Compare multiple intervention scenarios
 */
export const compareInterventions = async (
  baseRisk: number,
  timeShiftMinutes: number = -30  // 30 minutes earlier
): Promise<{
  scenarios: CounterfactualResult[];
  bestOption: string;
  recommendedTimeShift: number;
}> => {
  const interventionTypes: InterventionType[] = [
    'sentiment_dampening',
    'interaction_suppression',
    'regional_containment',
    'counter_narrative',
  ];

  const scenarios: CounterfactualResult[] = [];

  for (const type of interventionTypes) {
    const result = await runCounterfactualSimulation({
      interventionType: type,
      timeShiftMinutes,
      strength: 0.8,
    });
    scenarios.push(result);
  }

  // Find best option (highest risk reduction)
  const bestOption = scenarios.reduce((best, current) =>
    current.riskReduction > best.riskReduction ? current : best
  ).interventionType;

  // Calculate recommended time shift based on effectiveness
  let recommendedTimeShift = -30;
  const bestReduction = Math.max(...scenarios.map(s => s.riskReduction));
  if (bestReduction > 30) {
    recommendedTimeShift = -45;
  } else if (bestReduction < 10) {
    recommendedTimeShift = -15;
  }

  return {
    scenarios,
    bestOption,
    recommendedTimeShift,
  };
};

/**
 * Get simulation history
 */
export const getSimulationHistory = (limit: number = 20): CounterfactualResult[] => {
  return simulationHistory.slice(-limit);
};

/**
 * Get optimal intervention recommendation
 */
export const getOptimalIntervention = async (): Promise<{
  recommendedType: InterventionType;
  optimalTimeShift: number;
  expectedReduction: number;
  confidence: number;
  reasoning: string;
}> => {
  const comparison = await compareInterventions(50);
  
  const best = comparison.scenarios.reduce((best, current) =>
    current.riskReduction > best.riskReduction ? current : best
  );

  let reasoning = '';
  switch (best.interventionType) {
    case 'sentiment_dampening':
      reasoning = 'Sentiment dampening provides the highest risk reduction by directly reducing emotional escalation.';
      break;
    case 'interaction_suppression':
      reasoning = 'Interaction suppression is effective for breaking amplification loops between narratives.';
      break;
    case 'regional_containment':
      reasoning = 'Regional containment limits geographic spread and reduces overall impact.';
      break;
    case 'counter_narrative':
      reasoning = 'Counter-narrative deployment provides balanced impact across multiple risk vectors.';
      break;
  }

  return {
    recommendedType: best.interventionType as InterventionType,
    optimalTimeShift: comparison.recommendedTimeShift,
    expectedReduction: best.riskReduction,
    confidence: best.confidence,
    reasoning,
  };
};

/**
 * Simulate early intervention impact
 */
export const simulateEarlyIntervention = async (
  minutesEarlier: number = 30
): Promise<{
  baseline: number;
  withEarlyIntervention: number;
  savedRiskPoints: number;
  recommendedActions: string[];
}> => {
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const baseline = latestSnapshot?.overallRiskScore || 50;

  // Run simulation with different intervention types
  const results = await Promise.all([
    runCounterfactualSimulation({
      interventionType: 'sentiment_dampening',
      timeShiftMinutes: -minutesEarlier,
      strength: 0.8,
    }),
    runCounterfactualSimulation({
      interventionType: 'counter_narrative',
      timeShiftMinutes: -minutesEarlier,
      strength: 0.8,
    }),
  ]);

  const bestResult = results.reduce((best, current) =>
    current.riskReduction > best.riskReduction ? current : best
  );

  const recommendedActions = [
    `Deploy ${bestResult.interventionType.replace('_', ' ')} ${minutesEarlier} minutes earlier`,
    `Expected risk reduction: ${bestResult.riskReduction}%`,
    `Peak delay: ${bestResult.details.peakDelay} minutes`,
  ];

  return {
    baseline,
    withEarlyIntervention: bestResult.simulatedPeakRisk,
    savedRiskPoints: bestResult.riskReduction,
    recommendedActions,
  };
};

/**
 * Get intervention effectiveness over time
 */
export const getInterventionTimingEffectiveness = async (): Promise<{
  interventionType: string;
  effectivenessByTiming: { minutesEarlier: number; expectedReduction: number }[];
}[]> => {
  const interventionTypes: InterventionType[] = [
    'sentiment_dampening',
    'interaction_suppression',
    'regional_containment',
    'counter_narrative',
  ];

  const results = [];

  for (const type of interventionTypes) {
    const effectivenessByTiming = [];
    
    for (const minutes of [15, 30, 45, 60, 90, 120]) {
      const result = await runCounterfactualSimulation({
        interventionType: type,
        timeShiftMinutes: -minutes,
        strength: 0.8,
      });
      
      effectivenessByTiming.push({
        minutesEarlier: minutes,
        expectedReduction: result.riskReduction,
      });
    }

    results.push({
      interventionType: type,
      effectivenessByTiming,
    });
  }

  return results;
};
