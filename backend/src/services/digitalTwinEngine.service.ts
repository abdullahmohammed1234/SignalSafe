/**
 * GLOBAL INFORMATION ECOSYSTEM DIGITAL TWIN
 * Phase 8 - Create a live, continuously updating digital twin of the entire monitored ecosystem
 * 
 * Twin includes: Narrative graph, Regional propagation grid, Conflict matrix,
 * Policy state overlays, Intervention history, Stability index, Portfolio exposure
 */

export interface TwinState {
  twinId: string;
  timestamp: Date;
  narrativeGraph: {
    nodes: TwinNarrativeNode[];
    edges: TwinEdge[];
  };
  regionalPropagation: RegionalPropagation[];
  conflictMatrix: ConflictPair[];
  policyOverlays: PolicyState[];
  interventionHistory: TwinIntervention[];
  stabilityIndex: number;
  portfolioExposure: PortfolioExposure[];
  overallHealth: number;
}

export interface TwinNarrativeNode {
  narrativeId: string;
  title: string;
  riskScore: number;
  sentiment: number;
  velocity: number;
  spread: number;
  region: string;
  lifecycleStage: string;
  connectedNarratives: string[];
}

export interface TwinEdge {
  source: string;
  target: string;
  weight: number;
  type: 'amplification' | 'conflict' | 'neutral';
}

export interface RegionalPropagation {
  region: string;
  propagationSpeed: number;
  activeNarratives: number;
  riskLevel: number;
  sentimentTrend: number;
  neighboringRegions: { region: string; influence: number }[];
}

export interface ConflictPair {
  narrative1: string;
  narrative2: string;
  conflictScore: number;
  type: 'ideological' | 'geopolitical' | 'economic' | 'social';
  escalationPotential: number;
}

export interface PolicyState {
  region: string;
  policyType: string;
  status: 'active' | 'proposed' | 'expired';
  effectiveness: number;
  narrativeAlignment: number;
  implementationDate: Date;
}

export interface TwinIntervention {
  interventionId: string;
  type: string;
  targetNarrative: string;
  region: string;
  timestamp: Date;
  effectiveness: number;
  sideEffects: string[];
}

export interface PortfolioExposure {
  asset: string;
  exposure: number;
  riskContribution: number;
  sentimentImpact: number;
}

export interface ScenarioInjection {
  scenarioId: string;
  scenarioType: string;
  parameters: Record<string, unknown>;
  injectionPoint: string;
  expectedOutcome: string;
}

// Twin snapshot for time travel
interface TwinSnapshot {
  snapshotId: string;
  timestamp: Date;
  state: TwinState;
  label?: string;
}

// In-memory twin store
const twinStore: {
  currentState: TwinState | null;
  snapshots: TwinSnapshot[];
  projections: { timestamp: Date; projectedState: TwinState }[];
} = {
  currentState: null,
  snapshots: [],
  projections: []
};

// Generate unique ID
function generateId(): string {
  return `twin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize default twin state
function initializeDefaultState(): TwinState {
  return {
    twinId: generateId(),
    timestamp: new Date(),
    narrativeGraph: {
      nodes: [],
      edges: []
    },
    regionalPropagation: [],
    conflictMatrix: [],
    policyOverlays: [],
    interventionHistory: [],
    stabilityIndex: 75,
    portfolioExposure: [],
    overallHealth: 82
  };
}

// Get current twin state
export async function getTwinState(): Promise<TwinState> {
  if (!twinStore.currentState) {
    twinStore.currentState = initializeDefaultState();
  }
  
  // Update timestamp
  twinStore.currentState.timestamp = new Date();
  
  return twinStore.currentState;
}

// Update twin state with new data
export async function updateTwinState(data: Partial<TwinState>): Promise<TwinState> {
  const current = await getTwinState();
  
  twinStore.currentState = {
    ...current,
    ...data,
    twinId: current.twinId,
    timestamp: new Date()
  };
  
  return twinStore.currentState;
}

// Add narrative to twin graph
export async function addNarrativeToTwin(narrative: {
  narrativeId: string;
  title: string;
  riskScore: number;
  sentiment: number;
  velocity: number;
  spread: number;
  region: string;
  lifecycleStage: string;
}): Promise<TwinState> {
  const current = await getTwinState();
  
  const node: TwinNarrativeNode = {
    ...narrative,
    connectedNarratives: []
  };
  
  twinStore.currentState!.narrativeGraph.nodes.push(node);
  
  // Update stability index based on new narrative
  const avgRisk = twinStore.currentState!.narrativeGraph.nodes.reduce((sum, n) => sum + n.riskScore, 0) / 
    twinStore.currentState!.narrativeGraph.nodes.length;
  twinStore.currentState!.stabilityIndex = Math.max(0, Math.min(100, 100 - avgRisk));
  
  // Update overall health
  twinStore.currentState!.overallHealth = calculateHealthScore(twinStore.currentState!);
  
  return twinStore.currentState!;
}

// Add edge between narratives
export async function addNarrativeEdge(
  sourceId: string,
  targetId: string,
  weight: number,
  type: TwinEdge['type']
): Promise<TwinState> {
  const current = await getTwinState();
  
  const edge: TwinEdge = { source: sourceId, target: targetId, weight, type };
  twinStore.currentState!.narrativeGraph.edges.push(edge);
  
  // Update connected narratives
  const sourceNode = twinStore.currentState!.narrativeGraph.nodes.find(n => n.narrativeId === sourceId);
  const targetNode = twinStore.currentState!.narrativeGraph.nodes.find(n => n.narrativeId === targetId);
  
  if (sourceNode && !sourceNode.connectedNarratives.includes(targetId)) {
    sourceNode.connectedNarratives.push(targetId);
  }
  if (targetNode && !targetNode.connectedNarratives.includes(sourceId)) {
    targetNode.connectedNarratives.push(sourceId);
  }
  
  return twinStore.currentState!;
}

// Update regional propagation
export async function updateRegionalPropagation(region: string, data: Partial<RegionalPropagation>): Promise<TwinState> {
  const current = await getTwinState();
  
  const existingIdx = twinStore.currentState!.regionalPropagation.findIndex(r => r.region === region);
  
  if (existingIdx >= 0) {
    twinStore.currentState!.regionalPropagation[existingIdx] = {
      ...twinStore.currentState!.regionalPropagation[existingIdx],
      ...data
    };
  } else {
    twinStore.currentState!.regionalPropagation.push({
      region,
      propagationSpeed: 0,
      activeNarratives: 0,
      riskLevel: 50,
      sentimentTrend: 0,
      neighboringRegions: [],
      ...data
    });
  }
  
  return twinStore.currentState!;
}

// Add conflict pair
export async function addConflictPair(conflict: Omit<ConflictPair, 'narrative1' | 'narrative2'> & { narrative1: string; narrative2: string }): Promise<TwinState> {
  const current = await getTwinState();
  
  twinStore.currentState!.conflictMatrix.push(conflict as ConflictPair);
  
  return twinStore.currentState!;
}

// Add intervention to history
export async function recordIntervention(intervention: Omit<TwinIntervention, 'timestamp'>): Promise<TwinState> {
  const current = await getTwinState();
  
  twinStore.currentState!.interventionHistory.push({
    ...intervention,
    timestamp: new Date()
  } as TwinIntervention);
  
  // Keep only last 100 interventions
  if (twinStore.currentState!.interventionHistory.length > 100) {
    twinStore.currentState!.interventionHistory = twinStore.currentState!.interventionHistory.slice(-100);
  }
  
  return twinStore.currentState!;
}

// Take snapshot of current state
export async function takeSnapshot(label?: string): Promise<TwinSnapshot> {
  const current = await getTwinState();
  
  const snapshot: TwinSnapshot = {
    snapshotId: generateId(),
    timestamp: new Date(),
    state: JSON.parse(JSON.stringify(current)),
    label
  };
  
  twinStore.snapshots.push(snapshot);
  
  // Keep only last 50 snapshots
  if (twinStore.snapshots.length > 50) {
    twinStore.snapshots = twinStore.snapshots.slice(-50);
  }
  
  return snapshot;
}

// Get snapshots
export async function getSnapshots(limit = 20): Promise<TwinSnapshot[]> {
  return twinStore.snapshots.slice(-limit);
}

// Rewind to snapshot
export async function rewindToSnapshot(snapshotId: string): Promise<TwinState | null> {
  const snapshot = twinStore.snapshots.find(s => s.snapshotId === snapshotId);
  
  if (!snapshot) {
    return null;
  }
  
  twinStore.currentState = JSON.parse(JSON.stringify(snapshot.state));
  twinStore.currentState!.timestamp = new Date();
  
  return twinStore.currentState;
}

// Project forward
export async function projectForward(hours: number): Promise<TwinState> {
  const current = await getTwinState();
  
  // Simple projection - in production would use ML models
  const projectedState: TwinState = JSON.parse(JSON.stringify(current));
  projectedState.twinId = generateId();
  projectedState.timestamp = new Date(Date.now() + hours * 60 * 60 * 1000);
  
  // Project risk changes based on current trends
  projectedState.stabilityIndex = Math.max(0, Math.min(100, 
    current.stabilityIndex + (Math.random() - 0.5) * 10
  ));
  
  // Project health changes
  projectedState.overallHealth = calculateHealthScore(projectedState);
  
  twinStore.projections.push({
    timestamp: projectedState.timestamp,
    projectedState
  });
  
  return projectedState;
}

// Inject scenario into twin
export async function injectScenario(scenario: ScenarioInjection): Promise<{
  originalState: TwinState;
  modifiedState: TwinState;
  projectedImpact: number;
}> {
  const original = await getTwinState();
  const modified = JSON.parse(JSON.stringify(original)) as TwinState;
  
  let impact = 0;
  
  switch (scenario.scenarioType) {
    case 'amplification-burst':
      // Simulate rapid narrative amplification
      modified.narrativeGraph.nodes.forEach(node => {
        node.velocity = Math.min(100, node.velocity * 1.5);
        node.riskScore = Math.min(100, node.riskScore + 10);
      });
      modified.stabilityIndex = Math.max(0, modified.stabilityIndex - 15);
      impact = 0.7;
      break;
      
    case 'cross-narrative-mutation':
      // Simulate narrative mutation across clusters
      modified.conflictMatrix.push({
        narrative1: 'narrative-A',
        narrative2: 'narrative-B',
        conflictScore: 75,
        type: 'ideological',
        escalationPotential: 80
      });
      modified.stabilityIndex = Math.max(0, modified.stabilityIndex - 10);
      impact = 0.5;
      break;
      
    case 'policy-vacuum':
      // Simulate policy void
      modified.policyOverlays = modified.policyOverlays.filter(p => p.status !== 'active');
      modified.stabilityIndex = Math.max(0, modified.stabilityIndex - 20);
      impact = 0.8;
      break;
      
    case 'trust-collapse':
      // Simulate sudden trust collapse
      modified.narrativeGraph.nodes.forEach(node => {
        node.sentiment = Math.max(-1, node.sentiment - 0.5);
        node.riskScore = Math.min(100, node.riskScore + 20);
      });
      modified.stabilityIndex = Math.max(0, modified.stabilityIndex - 25);
      impact = 0.9;
      break;
      
    case 'information-blackout':
      // Simulate information blackout
      modified.narrativeGraph.nodes = modified.narrativeGraph.nodes.slice(0, Math.floor(modified.narrativeGraph.nodes.length * 0.3));
      modified.stabilityIndex = Math.max(0, modified.stabilityIndex - 15);
      impact = 0.6;
      break;
  }
  
  modified.overallHealth = calculateHealthScore(modified);
  twinStore.currentState = modified;
  
  return {
    originalState: original,
    modifiedState: modified,
    projectedImpact: impact
  };
}

// Calculate overall health score
function calculateHealthScore(state: TwinState): number {
  const stabilityWeight = 0.4;
  const narrativeWeight = 0.3;
  const interventionWeight = 0.3;
  
  const narrativeHealth = state.narrativeGraph.nodes.length > 0 
    ? 100 - (state.narrativeGraph.nodes.reduce((sum, n) => sum + n.riskScore, 0) / state.narrativeGraph.nodes.length)
    : 100;
  
  const interventionSuccess = state.interventionHistory.length > 0
    ? state.interventionHistory.slice(-10).reduce((sum, i) => sum + i.effectiveness, 0) / Math.min(10, state.interventionHistory.length)
    : 75;
  
  return Math.round(
    state.stabilityIndex * stabilityWeight +
    narrativeHealth * narrativeWeight +
    interventionSuccess * interventionWeight
  );
}

// Get twin analytics
export async function getTwinAnalytics(): Promise<{
  totalNarratives: number;
  highRiskNarratives: number;
  activeConflicts: number;
  regionalRiskDistribution: Record<string, number>;
  interventionEffectiveness: number;
  twinUptime: number;
}> {
  const state = await getTwinState();
  
  const highRiskNarratives = state.narrativeGraph.nodes.filter(n => n.riskScore > 70).length;
  
  const regionalRisk: Record<string, number> = {};
  for (const region of state.regionalPropagation) {
    regionalRisk[region.region] = region.riskLevel;
  }
  
  const interventionEffectiveness = state.interventionHistory.length > 0
    ? state.interventionHistory.slice(-20).reduce((sum, i) => sum + i.effectiveness, 0) / Math.min(20, state.interventionHistory.length)
    : 0;
  
  return {
    totalNarratives: state.narrativeGraph.nodes.length,
    highRiskNarratives,
    activeConflicts: state.conflictMatrix.length,
    regionalRiskDistribution: regionalRisk,
    interventionEffectiveness,
    twinUptime: Date.now() - new Date(state.timestamp).getTime()
  };
}

export default {
  getTwinState,
  updateTwinState,
  addNarrativeToTwin,
  addNarrativeEdge,
  updateRegionalPropagation,
  addConflictPair,
  recordIntervention,
  takeSnapshot,
  getSnapshots,
  rewindToSnapshot,
  projectForward,
  injectScenario,
  getTwinAnalytics
};
