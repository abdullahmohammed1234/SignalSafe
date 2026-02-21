/**
 * INTELLIGENCE GENOME REGISTRY
 * Phase 8 - Track structural DNA of SignalSafe across versions
 * 
 * Maintains genome lineage tree and enables rollback + branch experimentation
 */

export interface IntelligenceGenome {
  genomeId: string;
  architectureVersion: string;
  ensembleWeights: {
    isolationForest: number;
    autoencoder: number;
    oneClassSVM: number;
    localOutlierFactor: number;
    ensemble: number;
  };
  calibrationProfile: {
    riskThreshold: number;
    confidenceThreshold: number;
    sensitivityLevel: string;
    calibrationDate: Date;
  };
  agentTopology: {
    totalAgents: number;
    coordinatorCount: number;
    specialistCount: number;
    agentDistribution: Record<string, number>;
  };
  simulationDepth: number;
  optimizationStrategy: string;
  ethicalConstraintProfile: {
    biasDetectionEnabled: boolean;
    fairnessMetrics: string[];
    humanOverrideEnabled: boolean;
    auditLevel: string;
  };
  createdAt: Date;
  parentGenomeId?: string;
  branchName?: string;
  performanceSnapshot: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    stabilityScore: number;
  };
  status: 'active' | 'candidate' | 'archived';
}

// Genome lineage node for tree visualization
export interface GenomeLineageNode {
  genomeId: string;
  branchName: string;
  parentGenomeId?: string;
  createdAt: Date;
  architectureVersion: string;
  performanceSnapshot: { f1Score: number };
  status: 'active' | 'candidate' | 'archived';
  children: GenomeLineageNode[];
}

// In-memory genome store
const genomeStore: {
  genomes: IntelligenceGenome[];
  currentGenomeId: string;
  branchCounter: number;
} = {
  genomes: [],
  currentGenomeId: 'genome-v1.0',
  branchCounter: 1
};

// Initialize default genome
function initializeDefaultGenome(): IntelligenceGenome {
  return {
    genomeId: 'genome-v1.0',
    architectureVersion: 'arch-v1.0',
    ensembleWeights: {
      isolationForest: 0.25,
      autoencoder: 0.30,
      oneClassSVM: 0.15,
      localOutlierFactor: 0.10,
      ensemble: 0.20
    },
    calibrationProfile: {
      riskThreshold: 70,
      confidenceThreshold: 0.75,
      sensitivityLevel: 'balanced',
      calibrationDate: new Date()
    },
    agentTopology: {
      totalAgents: 12,
      coordinatorCount: 2,
      specialistCount: 10,
      agentDistribution: {
        sentiment: 3,
        clustering: 2,
        anomaly: 2,
        escalation: 2,
        intervention: 2,
        forecasting: 1
      }
    },
    simulationDepth: 5,
    optimizationStrategy: 'adaptive-weighted',
    ethicalConstraintProfile: {
      biasDetectionEnabled: true,
      fairnessMetrics: ['demographic-parity', 'equalized-odds'],
      humanOverrideEnabled: true,
      auditLevel: 'comprehensive'
    },
    createdAt: new Date(),
    branchName: 'main',
    performanceSnapshot: {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.82,
      f1Score: 0.83,
      stabilityScore: 0.88
    },
    status: 'active'
  };
}

// Get current genome
export async function getCurrentGenome(): Promise<IntelligenceGenome> {
  if (genomeStore.genomes.length === 0) {
    const defaultGenome = initializeDefaultGenome();
    genomeStore.genomes.push(defaultGenome);
  }
  
  return genomeStore.genomes.find(g => g.genomeId === genomeStore.currentGenomeId) || genomeStore.genomes[0];
}

// Get all genomes
export async function getAllGenomes(): Promise<IntelligenceGenome[]> {
  return [...genomeStore.genomes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get genome by ID
export async function getGenomeById(genomeId: string): Promise<IntelligenceGenome | null> {
  return genomeStore.genomes.find(g => g.genomeId === genomeId) || null;
}

// Create new genome variant
export async function createGenomeVariant(
  parentGenomeId: string,
  modifications: {
    ensembleWeights?: Partial<IntelligenceGenome['ensembleWeights']>;
    calibrationProfile?: Partial<IntelligenceGenome['calibrationProfile']>;
    agentTopology?: Partial<IntelligenceGenome['agentTopology']>;
    simulationDepth?: number;
    optimizationStrategy?: string;
    ethicalConstraintProfile?: Partial<IntelligenceGenome['ethicalConstraintProfile']>;
  },
  branchName?: string
): Promise<IntelligenceGenome> {
  const parent = await getGenomeById(parentGenomeId);
  if (!parent) {
    throw new Error(`Parent genome ${parentGenomeId} not found`);
  }
  
  const versionNum = parseFloat(parent.genomeId.replace('genome-v', '')) + 0.1;
  const newBranchName = branchName || `branch-${genomeStore.branchCounter++}`;
  
  const newGenome: IntelligenceGenome = {
    genomeId: `genome-v${versionNum.toFixed(1)}`,
    architectureVersion: parent.architectureVersion,
    ensembleWeights: { ...parent.ensembleWeights, ...modifications.ensembleWeights },
    calibrationProfile: { ...parent.calibrationProfile, ...modifications.calibrationProfile },
    agentTopology: { ...parent.agentTopology, ...modifications.agentTopology },
    simulationDepth: modifications.simulationDepth ?? parent.simulationDepth,
    optimizationStrategy: modifications.optimizationStrategy ?? parent.optimizationStrategy,
    ethicalConstraintProfile: { ...parent.ethicalConstraintProfile, ...modifications.ethicalConstraintProfile },
    createdAt: new Date(),
    parentGenomeId: parent.genomeId,
    branchName: newBranchName,
    performanceSnapshot: { ...parent.performanceSnapshot },
    status: 'candidate'
  };
  
  genomeStore.genomes.push(newGenome);
  return newGenome;
}

// Update genome performance
export async function updateGenomePerformance(
  genomeId: string,
  performance: IntelligenceGenome['performanceSnapshot']
): Promise<IntelligenceGenome | null> {
  const genome = genomeStore.genomes.find(g => g.genomeId === genomeId);
  if (!genome) {
    return null;
  }
  
  genome.performanceSnapshot = performance;
  return genome;
}

// Activate genome (make it current)
export async function activateGenome(genomeId: string): Promise<IntelligenceGenome | null> {
  const genome = genomeStore.genomes.find(g => g.genomeId === genomeId);
  if (!genome) {
    return null;
  }
  
  // Archive current
  const current = await getCurrentGenome();
  if (current) {
    current.status = 'archived';
  }
  
  // Activate new
  genome.status = 'active';
  genomeStore.currentGenomeId = genome.genomeId;
  
  return genome;
}

// Get genome lineage tree
export async function getGenomeLineageTree(): Promise<GenomeLineageNode[]> {
  const genomes = await getAllGenomes();
  
  // Build tree structure
  const nodeMap = new Map<string, GenomeLineageNode>();
  const rootNodes: GenomeLineageNode[] = [];
  
  // Create nodes
  for (const genome of genomes) {
    const node: GenomeLineageNode = {
      genomeId: genome.genomeId,
      branchName: genome.branchName || 'main',
      parentGenomeId: genome.parentGenomeId,
      createdAt: genome.createdAt,
      architectureVersion: genome.architectureVersion,
      performanceSnapshot: { f1Score: genome.performanceSnapshot.f1Score },
      status: genome.status,
      children: []
    };
    nodeMap.set(genome.genomeId, node);
  }
  
  // Build tree
  for (const [, node] of nodeMap) {
    if (node.parentGenomeId && nodeMap.has(node.parentGenomeId)) {
      const parent = nodeMap.get(node.parentGenomeId)!;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }
  
  // Sort children by creation date
  const sortChildren = (nodes: GenomeLineageNode[]): void => {
    nodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  
  sortChildren(rootNodes);
  return rootNodes;
}

// Compare two genomes
export async function compareGenomes(
  genomeId1: string,
  genomeId2: string
): Promise<{
  differences: string[];
  performanceDelta: { metric: string; delta: number }[];
  recommendation: string;
} | null> {
  const g1 = await getGenomeById(genomeId1);
  const g2 = await getGenomeById(genomeId2);
  
  if (!g1 || !g2) {
    return null;
  }
  
  const differences: string[] = [];
  const performanceDelta: { metric: string; delta: number }[] = [];
  
  // Compare ensemble weights
  for (const key of Object.keys(g1.ensembleWeights) as (keyof typeof g1.ensembleWeights)[]) {
    const diff = (g2.ensembleWeights[key] || 0) - (g1.ensembleWeights[key] || 0);
    if (Math.abs(diff) > 0.01) {
      differences.push(`${key}: ${g1.ensembleWeights[key].toFixed(2)} -> ${g2.ensembleWeights[key].toFixed(2)}`);
    }
  }
  
  // Compare simulation depth
  if (g1.simulationDepth !== g2.simulationDepth) {
    differences.push(`simulationDepth: ${g1.simulationDepth} -> ${g2.simulationDepth}`);
  }
  
  // Compare optimization strategy
  if (g1.optimizationStrategy !== g2.optimizationStrategy) {
    differences.push(`optimizationStrategy: ${g1.optimizationStrategy} -> ${g2.optimizationStrategy}`);
  }
  
  // Compare performance
  const metrics = ['accuracy', 'precision', 'recall', 'f1Score', 'stabilityScore'] as const;
  for (const metric of metrics) {
    const delta = (g2.performanceSnapshot[metric] || 0) - (g1.performanceSnapshot[metric] || 0);
    performanceDelta.push({ metric, delta });
  }
  
  // Generate recommendation
  const avgDelta = performanceDelta.reduce((sum, p) => sum + p.delta, 0) / performanceDelta.length;
  let recommendation = '';
  if (avgDelta > 0.05) {
    recommendation = 'Strongly recommend switching to genome 2';
  } else if (avgDelta > 0) {
    recommendation = 'Marginally better - consider switching if stability is priority';
  } else if (avgDelta > -0.05) {
    recommendation = 'Genome 1 slightly better - maintain current';
  } else {
    recommendation = 'Keep current genome';
  }
  
  return { differences, performanceDelta, recommendation };
}

// Get genome statistics
export async function getGenomeStatistics(): Promise<{
  totalGenomes: number;
  activeBranches: number;
  averagePerformance: number;
  latestPerformance: number;
  evolutionRate: string;
}> {
  const genomes = await getAllGenomes();
  const activeGenomes = genomes.filter(g => g.status === 'active' || g.status === 'candidate');
  const branches = new Set(genomes.map(g => g.branchName));
  
  const performances = genomes.map(g => g.performanceSnapshot.f1Score);
  const averagePerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
  const latestPerformance = genomes[0]?.performanceSnapshot.f1Score || 0;
  
  // Calculate evolution rate (genomes per month)
  const firstGenome = genomes[genomes.length - 1];
  const daysSinceFirst = firstGenome ? 
    (Date.now() - new Date(firstGenome.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 30;
  const evolutionRate = (genomes.length / Math.max(1, daysSinceFirst / 30)).toFixed(2);
  
  return {
    totalGenomes: genomes.length,
    activeBranches: branches.size,
    averagePerformance,
    latestPerformance,
    evolutionRate: `${evolutionRate} genomes/month`
  };
}

export default {
  getCurrentGenome,
  getAllGenomes,
  getGenomeById,
  createGenomeVariant,
  updateGenomePerformance,
  activateGenome,
  getGenomeLineageTree,
  compareGenomes,
  getGenomeStatistics
};
