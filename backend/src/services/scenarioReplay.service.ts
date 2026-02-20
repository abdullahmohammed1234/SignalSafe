import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { NarrativeInteraction } from '../models/NarrativeInteraction';
import mongoose from 'mongoose';

export interface ReplayEvent {
  eventId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  riskSnapshots: ReplaySnapshot[];
}

export interface ReplaySnapshot {
  timestamp: Date;
  riskScore: number;
  classification: string;
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
  activeClusters: number;
  activeInteractions: number;
}

export interface ReplayState {
  eventId: string;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  currentSnapshot: ReplaySnapshot | null;
}

// Store active replay sessions
const activeReplays: Map<string, ReplayState> = new Map();

// Store historical events
const historicalEvents: Map<string, ReplayEvent> = new Map();

/**
 * Initialize with sample historical events
 */
export const initializeReplayData = async (): Promise<void> => {
  // Create sample historical events from existing data
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(200);

  if (snapshots.length < 10) return;

  // Group snapshots into events based on gaps
  const events: ReplayEvent[] = [];
  let currentEvent: ReplayEvent | null = null;
  let lastTimestamp: Date | null = null;

  for (const snapshot of snapshots) {
    const gap = lastTimestamp 
      ? (snapshot.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60) 
      : 0;

    // If gap > 30 minutes, start new event
    if (gap > 30 && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    }

    if (!currentEvent) {
      currentEvent = {
        eventId: `event-${snapshot.timestamp.getTime()}`,
        name: `Risk Event ${events.length + 1}`,
        description: `Historical risk event starting at ${snapshot.timestamp.toISOString()}`,
        startTime: snapshot.timestamp,
        endTime: snapshot.timestamp,
        riskSnapshots: [],
      };
    }

    const replaySnapshot: ReplaySnapshot = {
      timestamp: snapshot.timestamp,
      riskScore: snapshot.overallRiskScore,
      classification: snapshot.classification,
      sentimentAcceleration: snapshot.sentimentAcceleration,
      clusterGrowthRate: snapshot.clusterGrowthRate,
      anomalyScore: snapshot.anomalyScore,
      narrativeSpreadSpeed: snapshot.narrativeSpreadSpeed,
      activeClusters: 0, // Would be populated from cluster data
      activeInteractions: 0,
    };

    currentEvent.riskSnapshots.push(replaySnapshot);
    currentEvent.endTime = snapshot.timestamp;
    lastTimestamp = snapshot.timestamp;
  }

  if (currentEvent) {
    events.push(currentEvent);
  }

  // Store events
  for (const event of events) {
    historicalEvents.set(event.eventId, event);
  }

  console.log(`📊 Initialized ${historicalEvents.size} historical replay events`);
};

/**
 * Get all available replay events
 */
export const getReplayEvents = async (): Promise<{
  eventId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  snapshotCount: number;
}[]> => {
  // Initialize if empty
  if (historicalEvents.size === 0) {
    await initializeReplayData();
  }

  return Array.from(historicalEvents.values()).map(event => ({
    eventId: event.eventId,
    name: event.name,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    duration: Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)),
    snapshotCount: event.riskSnapshots.length,
  }));
};

/**
 * Get a specific replay event
 */
export const getReplayEvent = async (eventId: string): Promise<ReplayEvent | null> => {
  // Initialize if empty
  if (historicalEvents.size === 0) {
    await initializeReplayData();
  }

  return historicalEvents.get(eventId) || null;
};

/**
 * Start a new replay session
 */
export const startReplay = async (
  eventId: string,
  speed: number = 1
): Promise<ReplayState | null> => {
  const event = await getReplayEvent(eventId);
  if (!event) return null;

  const state: ReplayState = {
    eventId,
    currentStep: 0,
    totalSteps: event.riskSnapshots.length,
    isPlaying: false,
    speed,
    currentSnapshot: event.riskSnapshots[0] || null,
  };

  activeReplays.set(eventId, state);
  return state;
};

/**
 * Get current replay state
 */
export const getReplayState = (eventId: string): ReplayState | null => {
  return activeReplays.get(eventId) || null;
};

/**
 * Step forward in replay
 */
export const stepForward = (eventId: string): ReplaySnapshot | null => {
  const state = activeReplays.get(eventId);
  if (!state) return null;

  const event = historicalEvents.get(eventId);
  if (!event || state.currentStep >= state.totalSteps - 1) {
    return null;
  }

  state.currentStep++;
  state.currentSnapshot = event.riskSnapshots[state.currentStep];
  return state.currentSnapshot;
};

/**
 * Step backward in replay
 */
export const stepBackward = (eventId: string): ReplaySnapshot | null => {
  const state = activeReplays.get(eventId);
  if (!state) return null;

  const event = historicalEvents.get(eventId);
  if (!event || state.currentStep <= 0) {
    return null;
  }

  state.currentStep--;
  state.currentSnapshot = event.riskSnapshots[state.currentStep];
  return state.currentSnapshot;
};

/**
 * Jump to specific step
 */
export const jumpToStep = (eventId: string, step: number): ReplaySnapshot | null => {
  const state = activeReplays.get(eventId);
  if (!state) return null;

  const event = historicalEvents.get(eventId);
  if (!event || step < 0 || step >= state.totalSteps) {
    return null;
  }

  state.currentStep = step;
  state.currentSnapshot = event.riskSnapshots[state.currentStep];
  return state.currentSnapshot;
};

/**
 * Play/pause replay
 */
export const togglePlayPause = (eventId: string): boolean | null => {
  const state = activeReplays.get(eventId);
  if (!state) return null;

  state.isPlaying = !state.isPlaying;
  return state.isPlaying;
};

/**
 * Set replay speed
 */
export const setReplaySpeed = (eventId: string, speed: number): boolean => {
  const state = activeReplays.get(eventId);
  if (!state) return false;

  state.speed = Math.max(0.25, Math.min(4, speed));
  return true;
};

/**
 * Stop and clear replay
 */
export const stopReplay = (eventId: string): boolean => {
  const state = activeReplays.get(eventId);
  if (!state) return false;

  activeReplays.delete(eventId);
  return true;
};

/**
 * Generate replay timeline with narrative evolution
 */
export const getReplayTimeline = async (eventId: string): Promise<{
  phases: {
    name: string;
    startTime: Date;
    endTime: Date;
    description: string;
    keyMetrics: { name: string; value: number }[];
  }[];
} | null> => {
  const event = await getReplayEvent(eventId);
  if (!event || event.riskSnapshots.length === 0) return null;

  const snapshots = event.riskSnapshots;
  
  // Identify phases based on risk level changes
  const phases: {
    name: string;
    startTime: Date;
    endTime: Date;
    description: string;
    keyMetrics: { name: string; value: number }[];
  }[] = [];

  let currentPhase: typeof phases[0] | null = null;

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const riskLevel = getRiskLevel(snapshot.riskScore);

    if (!currentPhase || currentPhase.name !== riskLevel) {
      if (currentPhase) {
        currentPhase.endTime = snapshots[i - 1].timestamp;
        phases.push(currentPhase);
      }

      currentPhase = {
        name: riskLevel,
        startTime: snapshot.timestamp,
        endTime: snapshot.timestamp,
        description: getPhaseDescription(riskLevel),
        keyMetrics: [],
      };
    }

    // Add key metrics at midpoint of phase
    if (Math.floor(snapshots.length / 2) === i) {
      currentPhase.keyMetrics = [
        { name: 'Risk Score', value: snapshot.riskScore },
        { name: 'Sentiment Accel', value: snapshot.sentimentAcceleration },
        { name: 'Cluster Growth', value: snapshot.clusterGrowthRate },
        { name: 'Anomaly Score', value: snapshot.anomalyScore },
      ];
    }
  }

  if (currentPhase) {
    currentPhase.endTime = snapshots[snapshots.length - 1].timestamp;
    phases.push(currentPhase);
  }

  return { phases };
};

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): string {
  if (score < 25) return 'Stable';
  if (score < 50) return 'Emerging Concern';
  if (score < 75) return 'Escalation Risk';
  return 'Panic Formation';
}

/**
 * Get phase description
 */
function getPhaseDescription(phase: string): string {
  switch (phase) {
    case 'Stable':
      return 'System operating within normal parameters. Minimal narrative activity detected.';
    case 'Emerging Concern':
      return 'Elevated narrative activity observed. Monitoring recommended.';
    case 'Escalation Risk':
      return 'Rapid risk accumulation. Intervention may be required.';
    case 'Panic Formation':
      return 'Critical risk levels. Immediate action recommended.';
    default:
      return '';
  }
}

/**
 * Get intervention impact analysis for replay
 */
export const getInterventionImpact = async (eventId: string): Promise<{
  beforeIntervention: ReplaySnapshot | null;
  afterIntervention: ReplaySnapshot | null;
  impactScore: number;
  recoveryTime: number | null;
} | null> => {
  const event = await getReplayEvent(eventId);
  if (!event || event.riskSnapshots.length < 5) return null;

  // Find peak risk point
  let peakIndex = 0;
  let peakScore = 0;

  for (let i = 0; i < event.riskSnapshots.length; i++) {
    if (event.riskSnapshots[i].riskScore > peakScore) {
      peakScore = event.riskSnapshots[i].riskScore;
      peakIndex = i;
    }
  }

  // Assume intervention happens at peak
  const beforeIntervention = peakIndex > 0 ? event.riskSnapshots[peakIndex - 1] : null;
  const afterIntervention = peakIndex < event.riskSnapshots.length - 1 
    ? event.riskSnapshots[peakIndex + 1] 
    : null;

  // Calculate impact
  const impactScore = beforeIntervention && afterIntervention
    ? (beforeIntervention.riskScore - afterIntervention.riskScore) * 10
    : 0;

  // Calculate recovery time (time to return to stable)
  let recoveryTime: number | null = null;
  for (let i = peakIndex + 1; i < event.riskSnapshots.length; i++) {
    if (event.riskSnapshots[i].riskScore < 30) {
      recoveryTime = Math.round(
        (event.riskSnapshots[i].timestamp.getTime() - event.riskSnapshots[peakIndex].timestamp.getTime()) / (1000 * 60)
      );
      break;
    }
  }

  return {
    beforeIntervention,
    afterIntervention,
    impactScore: Math.round(impactScore),
    recoveryTime,
  };
};

/**
 * Create a simulated replay event from current state
 */
export const createSimulatedReplay = async (name: string): Promise<ReplayEvent> => {
  // Generate synthetic event data based on current state
  const eventId = `sim-${Date.now()}`;
  const now = new Date();
  
  const snapshots: ReplaySnapshot[] = [];
  
  // Generate 20 snapshots over time
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - (20 - i) * 15 * 60 * 1000); // 15 min intervals
    
    // Simulate risk trajectory
    const baseRisk = 30 + (i * 2);
    const noise = Math.random() * 10 - 5;
    const riskScore = Math.min(100, Math.max(0, baseRisk + noise));
    
    snapshots.push({
      timestamp,
      riskScore,
      classification: getRiskLevel(riskScore),
      sentimentAcceleration: 30 + Math.random() * 40,
      clusterGrowthRate: 20 + Math.random() * 30,
      anomalyScore: Math.random() * 60,
      narrativeSpreadSpeed: 10 + Math.random() * 30,
      activeClusters: Math.floor(2 + Math.random() * 5),
      activeInteractions: Math.floor(Math.random() * 3),
    });
  }

  const event: ReplayEvent = {
    eventId,
    name,
    description: `Simulated replay event: ${name}`,
    startTime: snapshots[0].timestamp,
    endTime: snapshots[snapshots.length - 1].timestamp,
    riskSnapshots: snapshots,
  };

  historicalEvents.set(eventId, event);
  return event;
};
