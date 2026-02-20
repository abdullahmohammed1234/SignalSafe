/**
 * Threat Escalation State Machine
 * 
 * Defines formal lifecycle states and transitions:
 * - Dormant
 * - Emerging
 * - Accelerating
 * - Escalating
 * - Critical
 * - Contained
 * - Recovered
 * 
 * Transitions based on:
 * - Risk score thresholds
 * - Acceleration rate
 * - Regional propagation
 * - Interaction intensity
 */

import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { NarrativeInteraction } from '../models/NarrativeInteraction';

// State definitions
export type EscalationState = 
  | 'Dormant'
  | 'Emerging'
  | 'Accelerating'
  | 'Escalating'
  | 'Critical'
  | 'Contained'
  | 'Recovered';

// State transition thresholds
interface StateThresholds {
  minRiskScore: number;
  maxRiskScore: number;
  minAcceleration: number;
  maxAcceleration: number;
}

// Configuration for each state
const STATE_CONFIG: Record<EscalationState, StateThresholds> = {
  Dormant: { minRiskScore: 0, maxRiskScore: 20, minAcceleration: 0, maxAcceleration: 2 },
  Emerging: { minRiskScore: 20, maxRiskScore: 40, minAcceleration: 2, maxAcceleration: 8 },
  Accelerating: { minRiskScore: 40, maxRiskScore: 60, minAcceleration: 8, maxAcceleration: 15 },
  Escalating: { minRiskScore: 60, maxRiskScore: 75, minAcceleration: 15, maxAcceleration: 25 },
  Critical: { minRiskScore: 75, maxRiskScore: 100, minAcceleration: 25, maxAcceleration: 100 },
  Contained: { minRiskScore: 30, maxRiskScore: 60, minAcceleration: -10, maxAcceleration: 5 },
  Recovered: { minRiskScore: 0, maxRiskScore: 30, minAcceleration: -20, maxAcceleration: 2 },
};

// State history entry
export interface StateHistoryEntry {
  state: EscalationState;
  timestamp: Date;
  riskScore: number;
  acceleration: number;
  trigger: string;
  metadata: {
    clusterCount?: number;
    interactionCount?: number;
    regionalSpread?: number;
  };
}

// Current state
let currentState: EscalationState = 'Dormant';
let stateHistory: StateHistoryEntry[] = [];
let stateStartTime: Date = new Date();

/**
 * Calculate current acceleration rate
 */
const calculateAcceleration = async (): Promise<number> => {
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(10);

  if (recentSnapshots.length < 2) {
    return 0;
  }

  const newest = recentSnapshots[0];
  const oldest = recentSnapshots[recentSnapshots.length - 1];
  
  const timeDiff = (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 3600000;
  
  if (timeDiff === 0) {
    return 0;
  }

  return (newest.overallRiskScore - oldest.overallRiskScore) / timeDiff;
};

/**
 * Get cluster count for current state
 */
const getClusterMetrics = async (): Promise<{
  clusterCount: number;
  interactionCount: number;
  regionalSpread: number;
}> => {
  const clusters = await Cluster.find();
  const narratives = await Narrative.find({
    lifecycleStage: { $ne: 'Recovered' }
  });
  
  const interactions = await NarrativeInteraction.find({ isActive: true });

  // Calculate regional spread (unique regions)
  const regions = new Set(clusters.map(c => c.clusterId.split('-')[0] || 'global'));

  return {
    clusterCount: clusters.length,
    interactionCount: interactions.length,
    regionalSpread: regions.size,
  };
};

/**
 * Determine next state based on current conditions
 */
export const determineState = async (
  currentRisk: number,
  acceleration: number,
  metrics: { clusterCount: number; interactionCount: number; regionalSpread: number }
): Promise<{
  state: EscalationState;
  trigger: string;
  confidence: number;
}> => {
  let newState: EscalationState = currentState;
  let trigger = '';
  let confidence = 70;

  // Check if transitioning from Critical to Contained (intervention applied)
  if (currentState === 'Critical' && currentRisk < 70 && acceleration < 10) {
    newState = 'Contained';
    trigger = 'Intervention effectiveness detected - risk decreasing';
    confidence = 85;
  }
  // Check if transitioning from Contained to Recovered
  else if (currentState === 'Contained' && currentRisk < 25 && acceleration < 2) {
    newState = 'Recovered';
    trigger = 'Risk normalized - threat contained';
    confidence = 90;
  }
  // Check for normal escalation chain
  else if (currentRisk < 20) {
    if (currentState !== 'Dormant' && currentState !== 'Recovered') {
      newState = 'Dormant';
      trigger = 'Risk normalized';
      confidence = 80;
    } else {
      newState = 'Dormant';
      trigger = 'Baseline state';
    }
  }
  else if (currentRisk < 40) {
    if (currentState === 'Dormant' || currentState === 'Recovered') {
      newState = 'Emerging';
      trigger = 'Risk elevated above dormant threshold';
      confidence = 75;
    } else if (currentState === 'Contained') {
      newState = 'Emerging';
      trigger = 'Risk rebounding after containment';
      confidence = 70;
    } else {
      newState = 'Emerging';
    }
  }
  else if (currentRisk < 60) {
    if (acceleration > 8) {
      newState = 'Accelerating';
      trigger = 'Rapid risk increase detected';
      confidence = 80;
    } else {
      newState = 'Emerging';
    }
  }
  else if (currentRisk < 75) {
    if (acceleration > 15) {
      newState = 'Escalating';
      trigger = 'High acceleration with elevated risk';
      confidence = 75;
    } else if (currentState === 'Accelerating') {
      newState = 'Escalating';
      trigger = 'Sustained elevated risk';
      confidence = 80;
    } else {
      newState = 'Accelerating';
    }
  }
  else {
    if (acceleration > 20 || metrics.interactionCount > 5 || metrics.regionalSpread > 3) {
      newState = 'Critical';
      trigger = 'Critical thresholds exceeded - multiple risk factors active';
      confidence = 85;
    } else if (currentState === 'Escalating' || currentState === 'Accelerating') {
      newState = 'Critical';
      trigger = 'Risk exceeded critical threshold';
      confidence = 80;
    } else {
      newState = 'Escalating';
    }
  }

  // Adjust confidence based on data quality
  if (metrics.clusterCount < 3) {
    confidence -= 10;
  }
  if (metrics.interactionCount < 2) {
    confidence -= 5;
  }

  return { state: newState, trigger, confidence: Math.max(50, confidence) };
};

/**
 * Main state machine update function
 */
export const updateEscalationState = async (): Promise<{
  currentState: EscalationState;
  previousState: EscalationState;
  trigger: string;
  confidence: number;
  metrics: {
    riskScore: number;
    acceleration: number;
    clusterCount: number;
    interactionCount: number;
    regionalSpread: number;
  };
  stateDuration: number; // minutes in current state
}> => {
  // Get current risk
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const currentRisk = latestSnapshot?.overallRiskScore || 0;

  // Calculate acceleration
  const acceleration = await calculateAcceleration();

  // Get metrics
  const metrics = await getClusterMetrics();

  // Determine new state
  const { state: newState, trigger, confidence } = await determineState(
    currentRisk,
    acceleration,
    metrics
  );

  // Record state change if different
  if (newState !== currentState) {
    const previousState = currentState;
    currentState = newState;
    
    // Calculate duration in previous state
    const stateDuration = Math.round(
      (new Date().getTime() - stateStartTime.getTime()) / 60000
    );

    // Add to history
    stateHistory.push({
      state: previousState,
      timestamp: stateStartTime,
      riskScore: currentRisk,
      acceleration,
      trigger,
      metadata: {
        clusterCount: metrics.clusterCount,
        interactionCount: metrics.interactionCount,
        regionalSpread: metrics.regionalSpread,
      },
    });

    // Keep only last 100 entries
    if (stateHistory.length > 100) {
      stateHistory = stateHistory.slice(-100);
    }

    // Reset state start time
    stateStartTime = new Date();

    return {
      currentState: newState,
      previousState,
      trigger,
      confidence,
      metrics: {
        riskScore: currentRisk,
        acceleration,
        ...metrics,
      },
      stateDuration,
    };
  }

  // No state change
  return {
    currentState: newState,
    previousState: newState,
    trigger: 'No state change',
    confidence,
    metrics: {
      riskScore: currentRisk,
      acceleration,
      ...metrics,
    },
    stateDuration: Math.round(
      (new Date().getTime() - stateStartTime.getTime()) / 60000
    ),
  };
};

/**
 * Get current state
 */
export const getCurrentState = (): EscalationState => {
  return currentState;
};

/**
 * Get state history
 */
export const getStateHistory = (limit: number = 20): StateHistoryEntry[] => {
  return stateHistory.slice(-limit);
};

/**
 * Get state configuration
 */
export const getStateConfig = (state: EscalationState): StateThresholds => {
  return STATE_CONFIG[state];
};

/**
 * Get all valid transitions
 */
export const getValidTransitions = (state: EscalationState): EscalationState[] => {
  switch (state) {
    case 'Dormant':
      return ['Emerging'];
    case 'Emerging':
      return ['Dormant', 'Accelerating'];
    case 'Accelerating':
      return ['Emerging', 'Escalating', 'Dormant'];
    case 'Escalating':
      return ['Accelerating', 'Critical', 'Contained'];
    case 'Critical':
      return ['Escalating', 'Contained'];
    case 'Contained':
      return ['Emerging', 'Recovered', 'Critical'];
    case 'Recovered':
      return ['Dormant', 'Emerging'];
    default:
      return [];
  }
};

/**
 * Get state summary
 */
export const getStateSummary = async (): Promise<{
  currentState: EscalationState;
  stateDuration: number;
  riskScore: number;
  acceleration: number;
  alerts: string[];
  recommendedActions: string[];
}> => {
  const stateUpdate = await updateEscalationState();

  const alerts: string[] = [];
  const recommendedActions: string[] = [];

  // Generate alerts based on state
  if (stateUpdate.currentState === 'Critical') {
    alerts.push('CRITICAL: Immediate action required');
    recommendedActions.push('Deploy all available interventions');
    recommendedActions.push('Escalate to senior leadership');
  } else if (stateUpdate.currentState === 'Escalating') {
    alerts.push('WARNING: Rapid escalation detected');
    recommendedActions.push('Activate containment protocols');
  } else if (stateUpdate.currentState === 'Accelerating') {
    alerts.push('CAUTION: Risk acceleration detected');
    recommendedActions.push('Prepare intervention resources');
  }

  if (stateUpdate.metrics.acceleration > 15) {
    alerts.push('High acceleration rate detected');
  }

  if (stateUpdate.metrics.interactionCount > 5) {
    alerts.push('Multiple active narrative interactions');
  }

  if (stateUpdate.metrics.regionalSpread > 3) {
    alerts.push('Multi-regional spread detected');
  }

  return {
    currentState: stateUpdate.currentState,
    stateDuration: stateUpdate.stateDuration,
    riskScore: Math.round(stateUpdate.metrics.riskScore),
    acceleration: Math.round(stateUpdate.metrics.acceleration * 10) / 10,
    alerts,
    recommendedActions,
  };
};

/**
 * Force state transition (for testing/manual override)
 */
export const forceState = (state: EscalationState): void => {
  const previousState = currentState;
  currentState = state;
  
  stateHistory.push({
    state: previousState,
    timestamp: stateStartTime,
    riskScore: 0,
    acceleration: 0,
    trigger: `Manual override: ${previousState} -> ${state}`,
    metadata: {},
  });

  stateStartTime = new Date();
};
