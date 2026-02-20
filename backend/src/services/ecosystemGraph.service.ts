import { Narrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';

export interface GraphNode {
  id: string;
  label: string;
  type: 'narrative' | 'cluster' | 'amplifier';
  riskScore: number;
  spreadRadius: number;
  sentiment: number;
  centralityScore: number;
  influenceRadius: number;
  volatilityIndex: number;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'reinforcement' | 'opposition' | 'mutation_lineage' | 'shared_amplifier';
  strength: number;
}

export interface EcosystemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centralityScores: Map<string, number>;
  influenceRadii: Map<string, number>;
  volatilityIndices: Map<string, number>;
  clusters: string[];
}

export interface GraphAnalysisResult {
  graph: EcosystemGraph;
  highCentralityNodes: GraphNode[];
  influenceHubs: GraphNode[];
  volatileNodes: GraphNode[];
  reinforcementClusters: string[];
  oppositionPairs: string[];
  mutationLineages: string[][];
}

/**
 * Global Narrative Ecosystem Graph Service
 * Models all narratives as nodes in a weighted directed graph
 */
export class EcosystemGraphService {

  /**
   * Build the complete ecosystem graph
   */
  async buildEcosystemGraph(): Promise<GraphAnalysisResult> {
    const narratives = await Narrative.find({ isActive: true });
    const clusters = await Cluster.find({});

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const centralityScores = new Map<string, number>();
    const influenceRadii = new Map<string, number>();
    const volatilityIndices = new Map<string, number>();

    // Add narrative nodes
    for (const narrative of narratives) {
      const node = this.createNodeFromNarrative(narrative);
      nodes.push(node);
      centralityScores.set(node.id, node.centralityScore);
      influenceRadii.set(node.id, node.influenceRadius);
      volatilityIndices.set(node.id, node.volatilityIndex);
    }

    // Add cluster nodes
    for (const cluster of clusters) {
      const node = this.createNodeFromCluster(cluster);
      nodes.push(node);
      centralityScores.set(node.id, node.centralityScore);
      influenceRadii.set(node.id, node.influenceRadius);
      volatilityIndices.set(node.id, node.volatilityIndex);
    }

    // Create edges based on relationships
    for (let i = 0; i < narratives.length; i++) {
      for (let j = 0; j < narratives.length; j++) {
        if (i !== j) {
          const edge = this.createEdge(narratives[i], narratives[j]);
          if (edge) {
            edges.push(edge);
          }
        }
      }
    }

    // Add edges from narratives to clusters
    for (const narrative of narratives) {
      for (const cluster of clusters) {
        if (this.isNarrativeInCluster(narrative, cluster)) {
          edges.push({
            source: narrative._id.toString(),
            target: `cluster_${cluster._id}`,
            weight: 0.8,
            type: 'shared_amplifier',
            strength: 0.8,
          });
        }
      }
    }

    const graph: EcosystemGraph = {
      nodes,
      edges,
      centralityScores,
      influenceRadii,
      volatilityIndices,
      clusters: clusters.map(c => c._id.toString()),
    };

    return this.analyzeGraph(graph);
  }

  /**
   * Create a graph node from a narrative
   */
  private createNodeFromNarrative(narrative: any): GraphNode {
    const riskScore = (narrative as any).riskScore || 50;
    const sentiment = (narrative as any).sentiment?.overall || 0;
    const spreadRadius = (narrative as any).spreadRadius || 1;

    return {
      id: narrative._id.toString(),
      label: (narrative as any).title || 'Untitled Narrative',
      type: 'narrative',
      riskScore,
      spreadRadius,
      sentiment,
      centralityScore: this.calculateCentrality(riskScore, spreadRadius),
      influenceRadius: this.calculateInfluenceRadius(spreadRadius, riskScore),
      volatilityIndex: this.calculateVolatilityIndex(riskScore, sentiment),
      metadata: {
        status: (narrative as any).status,
        category: (narrative as any).category,
        velocity: (narrative as any).velocity || 0,
      },
    };
  }

  /**
   * Create a graph node from a cluster
   */
  private createNodeFromCluster(cluster: any): GraphNode {
    const narratives = cluster.narratives || [];
    const avgRisk = narratives.reduce((sum: number, n: any) => sum + (n.riskScore || 0), 0) / Math.max(1, narratives.length);

    return {
      id: `cluster_${cluster._id}`,
      label: `Cluster ${cluster._id.toString().slice(-4)}`,
      type: 'cluster',
      riskScore: avgRisk,
      spreadRadius: narratives.length,
      sentiment: 0,
      centralityScore: narratives.length * 0.1,
      influenceRadius: narratives.length * 0.5,
      volatilityIndex: avgRisk / 100,
      metadata: {
        size: narratives.length,
        primaryTheme: cluster.primaryTheme || 'mixed',
      },
    };
  }

  /**
   * Create an edge between two narratives
   */
  private createEdge(n1: any, n2: any): GraphEdge | null {
    const sent1 = (n1 as any).sentiment?.overall || 0;
    const sent2 = (n2 as any).sentiment?.overall || 0;
    const risk1 = (n1 as any).riskScore || 0;
    const risk2 = (n2 as any).riskScore || 0;

    // Check for reinforcement (same sentiment direction)
    if (sent1 * sent2 > 0.1) {
      const weight = Math.abs(sent1 * sent2);
      return {
        source: n1._id.toString(),
        target: n2._id.toString(),
        weight,
        type: 'reinforcement',
        strength: weight,
      };
    }

    // Check for opposition (opposite sentiment)
    if (sent1 * sent2 < -0.1) {
      const weight = Math.abs(sent1 * sent2);
      return {
        source: n1._id.toString(),
        target: n2._id.toString(),
        weight,
        type: 'opposition',
        strength: weight,
      };
    }

    // Check for mutation lineage (similar themes but different sentiment)
    if ((n1 as any).category === (n2 as any).category && Math.abs(sent1 - sent2) > 0.3) {
      return {
        source: n1._id.toString(),
        target: n2._id.toString(),
        weight: 0.5,
        type: 'mutation_lineage',
        strength: 0.5,
      };
    }

    return null;
  }

  /**
   * Check if a narrative is in a cluster
   */
  private isNarrativeInCluster(narrative: any, cluster: any): boolean {
    const narrativeId = narrative._id.toString();
    const clusterNarratives = cluster.narratives || [];
    return clusterNarratives.some((n: any) => n.toString() === narrativeId);
  }

  /**
   * Calculate centrality score
   */
  private calculateCentrality(riskScore: number, spreadRadius: number): number {
    return ((riskScore / 100) * 0.6 + (spreadRadius / 100) * 0.4) * 100;
  }

  /**
   * Calculate influence radius
   */
  private calculateInfluenceRadius(spreadRadius: number, riskScore: number): number {
    return spreadRadius * (0.5 + riskScore / 200);
  }

  /**
   * Calculate volatility index
   */
  private calculateVolatilityIndex(riskScore: number, sentiment: number): number {
    const sentimentVolatility = Math.abs(sentiment);
    return (riskScore / 100) * 0.7 + sentimentVolatility * 0.3;
  }

  /**
   * Analyze the graph and extract insights
   */
  private analyzeGraph(graph: EcosystemGraph): GraphAnalysisResult {
    // Sort nodes by centrality
    const sortedByCentrality = [...graph.nodes].sort((a, b) => b.centralityScore - a.centralityScore);
    const highCentralityNodes = sortedByCentrality.slice(0, 10);

    // Sort by influence radius
    const sortedByInfluence = [...graph.nodes].sort((a, b) => b.influenceRadius - a.influenceRadius);
    const influenceHubs = sortedByInfluence.slice(0, 10);

    // Sort by volatility
    const sortedByVolatility = [...graph.nodes].sort((a, b) => b.volatilityIndex - a.volatilityIndex);
    const volatileNodes = sortedByVolatility.slice(0, 10);

    // Identify reinforcement clusters
    const reinforcementClusters: string[] = [];
    const edgeMap = new Map<string, GraphEdge[]>();
    
    graph.edges.forEach(edge => {
      if (edge.type === 'reinforcement') {
        const key = [edge.source, edge.target].sort().join('-');
        if (!reinforcementClusters.includes(key)) {
          reinforcementClusters.push(key);
        }
      }
    });

    // Identify opposition pairs
    const oppositionPairs = graph.edges
      .filter(e => e.type === 'opposition')
      .map(e => `${e.source}-${e.target}`);

    // Identify mutation lineages
    const mutationLineages = graph.edges
      .filter(e => e.type === 'mutation_lineage')
      .map(e => [e.source, e.target]);

    return {
      graph,
      highCentralityNodes,
      influenceHubs,
      volatileNodes,
      reinforcementClusters,
      oppositionPairs,
      mutationLineages,
    };
  }

  /**
   * Get graph summary statistics
   */
  async getGraphStatistics(): Promise<{
    totalNodes: number;
    totalEdges: number;
    avgCentrality: number;
    avgVolatility: number;
    networkDensity: number;
    dominantType: string;
  }> {
    const result = await this.buildEcosystemGraph();
    
    const totalNodes = result.graph.nodes.length;
    const totalEdges = result.graph.edges.length;
    
    const centralityValues = Array.from(result.graph.centralityScores.values());
    const avgCentrality = centralityValues.reduce((a, b) => a + b, 0) / Math.max(1, centralityValues.length);
    
    const volatilityValues = Array.from(result.graph.volatilityIndices.values());
    const avgVolatility = volatilityValues.reduce((a, b) => a + b, 0) / Math.max(1, volatilityValues.length);
    
    // Calculate network density
    const maxEdges = totalNodes * (totalNodes - 1);
    const networkDensity = maxEdges > 0 ? totalEdges / maxEdges : 0;

    // Find dominant type
    const typeCounts = new Map<string, number>();
    result.graph.nodes.forEach(node => {
      const count = typeCounts.get(node.type) || 0;
      typeCounts.set(node.type, count + 1);
    });

    let dominantType = 'narrative';
    let maxCount = 0;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return {
      totalNodes,
      totalEdges,
      avgCentrality: Math.round(avgCentrality * 100) / 100,
      avgVolatility: Math.round(avgVolatility * 100) / 100,
      networkDensity: Math.round(networkDensity * 1000) / 1000,
      dominantType,
    };
  }

  /**
   * Update graph in real-time based on new data
   */
  async updateGraphNode(narrativeId: string): Promise<GraphNode | null> {
    const narrative = await Narrative.findById(narrativeId);
    if (!narrative) return null;

    return this.createNodeFromNarrative(narrative);
  }
}

export const ecosystemGraphService = new EcosystemGraphService();
