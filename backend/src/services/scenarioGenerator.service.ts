/**
 * STRATEGIC SCENARIO AUTOGENERATION ENGINE
 * Phase 8 - System autonomously generates plausible future stress scenarios
 * 
 * Scenarios include:
 * - Coordinated amplification burst
 * - Cross-narrative mutation fusion
 * - Region-wide policy vacuum
 * - Sudden trust collapse event
 * - Information blackout cluster
 */

export interface GeneratedScenario {
  scenarioId: string;
  description: string;
  scenarioType: string;
  estimatedProbability: number;
  projectedImpact: number;
  recommendedPreemptiveAction: string;
  affectedRegions: string[];
  affectedNarratives: string[];
  timeline: {
    onset: number; // hours from now
    peak: number;
    duration: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  confidence: number;
  generatedAt: Date;
  addedToStressLab: boolean;
}

export interface StressTestScenario {
  scenarioId: string;
  name: string;
  description: string;
  type: string;
  parameters: Record<string, unknown>;
  targetNarratives: string[];
  affectedRegions: string[];
  expectedOutcome: string;
}

// In-memory store
const scenarioStore: {
  generatedScenarios: GeneratedScenario[];
  stressLabScenarios: StressTestScenario[];
  scenarioTemplates: StressTestScenario[];
} = {
  generatedScenarios: [],
  stressLabScenarios: [],
  scenarioTemplates: []
};

// Initialize scenario templates
function initializeTemplates(): void {
  scenarioStore.scenarioTemplates = [
    {
      scenarioId: 'template-amplification',
      name: 'Coordinated Amplification Burst',
      description: 'Multiple narratives rapidly amplify through coordinated social media campaigns',
      type: 'amplification-burst',
      parameters: {
        intensity: 0.8,
        velocity: 'high',
        coordination: true,
        platforms: ['twitter', 'reddit', 'telegram']
      },
      targetNarratives: [],
      affectedRegions: ['global'],
      expectedOutcome: 'Rapid risk escalation within 2-4 hours'
    },
    {
      scenarioId: 'template-mutation',
      name: 'Cross-Narrative Mutation',
      description: 'Two or more distinct narratives merge creating hybrid misinformation',
      type: 'cross-narrative-mutation',
      parameters: {
        mutationRate: 0.7,
        crossoverPoints: 3,
        recombinationEffect: 'high'
      },
      targetNarratives: [],
      affectedRegions: ['north-america', 'europe'],
      expectedOutcome: 'Novel narrative with combined risk factors'
    },
    {
      scenarioId: 'template-policy-vacuum',
      name: 'Region-Wide Policy Vacuum',
      description: 'Regulatory void leads to uncontained information spread',
      type: 'policy-vacuum',
      parameters: {
        voidDuration: 'extended',
        affectedSectors: ['finance', 'health', 'technology'],
        enforcementGap: 0.9
      },
      targetNarratives: [],
      affectedRegions: ['asia-pacific', 'latin-america'],
      expectedOutcome: 'Sustained high-risk environment for 48+ hours'
    },
    {
      scenarioId: 'template-trust-collapse',
      name: 'Sudden Trust Collapse',
      description: 'Key institution loses credibility causing cascade of doubt',
      type: 'trust-collapse',
      parameters: {
        triggerEvent: 'leak',
        institutionalTrustLoss: 0.8,
        cascadeMultiplier: 2.5
      },
      targetNarratives: [],
      affectedRegions: ['europe', 'north-america'],
      expectedOutcome: 'Multi-domain sentiment crash within hours'
    },
    {
      scenarioId: 'template-blackout',
      name: 'Information Blackout Cluster',
      description: 'Coordinated platform restrictions create information voids',
      type: 'information-blackout',
      parameters: {
        platforms: 3,
        geographicScope: 'regional',
        duration: '24-72 hours',
        alternativeChannels: 0
      },
      targetNarratives: [],
      affectedRegions: ['middle-east', 'asia-pacific'],
      expectedOutcome: 'Narrative fragmentation and uncertainty spike'
    }
  ];
}

// Initialize templates
initializeTemplates();

// Generate scenario
export async function generateScenario(scenarioType?: string): Promise<GeneratedScenario> {
  // Select template
  const templates = scenarioStore.scenarioTemplates;
  const template = scenarioType 
    ? templates.find(t => t.type === scenarioType) || templates[Math.floor(Math.random() * templates.length)]
    : templates[Math.floor(Math.random() * templates.length)];
  
  // Generate unique scenario
  const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate probability and impact based on current state (simulated)
  const estimatedProbability = 0.05 + Math.random() * 0.25;
  const projectedImpact = 0.4 + Math.random() * 0.5;
  
  // Determine severity
  let severity: GeneratedScenario['severity'] = 'low';
  if (projectedImpact > 0.8) severity = 'critical';
  else if (projectedImpact > 0.6) severity = 'high';
  else if (projectedImpact > 0.4) severity = 'medium';
  
  // Generate indicators
  const indicators = generateIndicators(template.type);
  
  // Generate affected narratives (simulated)
  const affectedNarratives = [
    `narrative-${Math.floor(Math.random() * 1000)}`,
    `narrative-${Math.floor(Math.random() * 1000)}`
  ];
  
  const scenario: GeneratedScenario = {
    scenarioId,
    description: template.description,
    scenarioType: template.type,
    estimatedProbability,
    projectedImpact,
    recommendedPreemptiveAction: generatePreemptiveAction(template.type),
    affectedRegions: template.affectedRegions,
    affectedNarratives,
    timeline: {
      onset: Math.floor(Math.random() * 12) + 1,
      peak: Math.floor(Math.random() * 24) + 12,
      duration: Math.floor(Math.random() * 48) + 24
    },
    severity,
    indicators,
    confidence: 0.6 + Math.random() * 0.3,
    generatedAt: new Date(),
    addedToStressLab: false
  };
  
  scenarioStore.generatedScenarios.push(scenario);
  
  // Keep only last 100 scenarios
  if (scenarioStore.generatedScenarios.length > 100) {
    scenarioStore.generatedScenarios = scenarioStore.generatedScenarios.slice(-100);
  }
  
  return scenario;
}

// Generate indicators based on scenario type
function generateIndicators(scenarioType: string): string[] {
  const indicatorMap: Record<string, string[]> = {
    'amplification-burst': [
      'Unusual posting velocity increase',
      'Cross-platform coordination detected',
      'Influencer amplification cascade',
      'Hashtag trending acceleration'
    ],
    'cross-narrative-mutation': [
      'Narrative similarity spike',
      'Keyword overlap increase',
      'Source convergence detected',
      'Theme recombination patterns'
    ],
    'policy-vacuum': [
      'Regulatory enforcement gap',
      'Unchecked content proliferation',
      'Platform moderation reduction',
      'Legal uncertainty signals'
    ],
    'trust-collapse': [
      'Institutional credibility drop',
      'Sentiment divergence acceleration',
      'Expert authority rejection',
      'Source reliability质疑'
    ],
    'information-blackout': [
      'Platform access disruption',
      'Alternative channel emergence',
      'Communication vacuum detection',
      'Information void formation'
    ]
  };
  
  return indicatorMap[scenarioType] || ['Generic indicator 1', 'Generic indicator 2'];
}

// Generate preemptive action
function generatePreemptiveAction(scenarioType: string): string {
  const actionMap: Record<string, string> = {
    'amplification-burst': 'Deploy rapid response agent with amplification detection; pre-position counter-narratives',
    'cross-narrative-mutation': 'Increase monitoring of narrative convergence points; prepare hybrid analysis',
    'policy-vacuum': 'Coordinate with policy teams; activate alternative information channels',
    'trust-collapse': 'Engage institutional credibility monitoring; prepare trust restoration protocols',
    'information-blackout': 'Activate alternative communication channels; pre-position emergency information'
  };
  
  return actionMap[scenarioType] || 'Increase monitoring and prepare response protocols';
}

// Add scenario to stress lab
export async function addToStressLab(scenarioId: string): Promise<StressTestScenario | null> {
  const scenario = scenarioStore.generatedScenarios.find(s => s.scenarioId === scenarioId);
  
  if (!scenario) {
    return null;
  }
  
  const template = scenarioStore.scenarioTemplates.find(t => t.type === scenario.scenarioType);
  
  const stressScenario: StressTestScenario = {
    scenarioId: `stress-${scenario.scenarioId}`,
    name: `${template?.name || 'Unknown'} - Generated`,
    description: scenario.description,
    type: scenario.scenarioType,
    parameters: template?.parameters || {},
    targetNarratives: scenario.affectedNarratives,
    affectedRegions: scenario.affectedRegions,
    expectedOutcome: `Projected impact: ${(scenario.projectedImpact * 100).toFixed(0)}%`
  };
  
  scenarioStore.stressLabScenarios.push(stressScenario);
  scenario.addedToStressLab = true;
  
  return stressScenario;
}

// Get all generated scenarios
export async function getGeneratedScenarios(limit = 20): Promise<GeneratedScenario[]> {
  return [...scenarioStore.generatedScenarios]
    .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
    .slice(0, limit);
}

// Get stress lab scenarios
export async function getStressLabScenarios(): Promise<StressTestScenario[]> {
  return [...scenarioStore.stressLabScenarios];
}

// Get scenarios by severity
export async function getScenariosBySeverity(severity: GeneratedScenario['severity']): Promise<GeneratedScenario[]> {
  return scenarioStore.generatedScenarios.filter(s => s.severity === severity);
}

// Get high priority scenarios
export async function getHighPriorityScenarios(): Promise<GeneratedScenario[]> {
  return scenarioStore.generatedScenarios
    .filter(s => s.projectedImpact * (1 - s.estimatedProbability) > 0.3)
    .sort((a, b) => (b.projectedImpact * (1 - b.estimatedProbability)) - (a.projectedImpact * (1 - a.estimatedProbability)));
}

// Generate multiple scenarios
export async function generateMultipleScenarios(count: number): Promise<GeneratedScenario[]> {
  const scenarios: GeneratedScenario[] = [];
  
  for (let i = 0; i < count; i++) {
    const scenario = await generateScenario();
    scenarios.push(scenario);
  }
  
  return scenarios;
}

// Get scenario templates
export async function getScenarioTemplates(): Promise<StressTestScenario[]> {
  return [...scenarioStore.scenarioTemplates];
}

// Generate scenario from template
export async function generateFromTemplate(templateId: string): Promise<GeneratedScenario | null> {
  const template = scenarioStore.scenarioTemplates.find(t => t.scenarioId === templateId);
  
  if (!template) {
    return null;
  }
  
  return generateScenario(template.type);
}

// Get scenario statistics
export async function getScenarioStatistics(): Promise<{
  totalGenerated: number;
  addedToStressLab: number;
  bySeverity: Record<string, number>;
  averageProbability: number;
  averageImpact: number;
  highestRisk: GeneratedScenario | null;
}> {
  const scenarios = scenarioStore.generatedScenarios;
  
  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  
  let totalProb = 0;
  let totalImpact = 0;
  
  for (const s of scenarios) {
    bySeverity[s.severity]++;
    totalProb += s.estimatedProbability;
    totalImpact += s.projectedImpact;
  }
  
  const highestRisk = scenarios.length > 0 
    ? scenarios.reduce((max, s) => (s.projectedImpact * (1 - s.estimatedProbability)) > (max.projectedImpact * (1 - max.estimatedProbability)) ? s : max)
    : null;
  
  return {
    totalGenerated: scenarios.length,
    addedToStressLab: scenarios.filter(s => s.addedToStressLab).length,
    bySeverity,
    averageProbability: scenarios.length > 0 ? totalProb / scenarios.length : 0,
    averageImpact: scenarios.length > 0 ? totalImpact / scenarios.length : 0,
    highestRisk
  };
}

export default {
  generateScenario,
  addToStressLab,
  getGeneratedScenarios,
  getStressLabScenarios,
  getScenariosBySeverity,
  getHighPriorityScenarios,
  generateMultipleScenarios,
  getScenarioTemplates,
  generateFromTemplate,
  getScenarioStatistics
};
