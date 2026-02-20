import { Narrative } from '../models/Narrative';
import { Cluster } from '../models/Cluster';

export interface ImpactLayer {
  level: number;
  effect: string;
  probability: number;
  impactWeight: number;
  affectedDomains: string[];
  timeToManifest: number; // hours
}

export interface CascadeMap {
  originNarrative: string;
  impactLayers: ImpactLayer[];
  cascadeImpactScore: number;
  propagationPaths: string[];
  criticalNodes: string[];
}

export interface CascadeImpactResult {
  narrativeId: string;
  cascadeMap: CascadeMap;
  primaryEffects: ImpactLayer[];
  secondaryEffects: ImpactLayer[];
  tertiaryEffects: ImpactLayer[];
  totalImpactScore: number;
  containmentDifficulty: number;
  recommendedActions: string[];
}

/**
 * Second-Order & Third-Order Consequence Modeling Service
 * Models the propagation of effects from primary to secondary to tertiary impacts
 */
export class CascadeImpactService {

  // Define consequence chains for different intervention types
  private consequenceChains: Map<string, ImpactLayer[]> = new Map([
    ['suppression', [
      { level: 1, effect: 'Sentiment Polarization', probability: 0.85, impactWeight: 0.7, affectedDomains: ['social', 'political'], timeToManifest: 24 },
      { level: 2, effect: 'Regional Fragmentation', probability: 0.65, impactWeight: 0.8, affectedDomains: ['geopolitical', 'economic'], timeToManifest: 72 },
      { level: 3, effect: 'Cross-Narrative Conflict', probability: 0.45, impactWeight: 0.9, affectedDomains: ['social', 'security'], timeToManifest: 168 },
    ]],
    ['containment', [
      { level: 1, effect: 'Narrative Stagnation', probability: 0.75, impactWeight: 0.5, affectedDomains: ['social'], timeToManifest: 48 },
      { level: 2, effect: 'Audience Fatigue', probability: 0.60, impactWeight: 0.4, affectedDomains: ['media', 'social'], timeToManifest: 96 },
      { level: 3, effect: 'Alternative Narrative Emergence', probability: 0.55, impactWeight: 0.6, affectedDomains: ['information', 'political'], timeToManifest: 168 },
    ]],
    ['counter_messaging', [
      { level: 1, effect: 'Belief Reinforcement in Opponents', probability: 0.70, impactWeight: 0.6, affectedDomains: ['social', 'psychological'], timeToManifest: 24 },
      { level: 2, effect: 'Echo Chamber Intensification', probability: 0.80, impactWeight: 0.7, affectedDomains: ['social', 'media'], timeToManifest: 72 },
      { level: 3, effect: 'Ideological Entrenchment', probability: 0.50, impactWeight: 0.85, affectedDomains: ['political', 'social'], timeToManifest: 240 },
    ]],
    ['no_intervention', [
      { level: 1, effect: 'Natural Spread Acceleration', probability: 0.90, impactWeight: 0.8, affectedDomains: ['social', 'media'], timeToManifest: 48 },
      { level: 2, effect: 'Mainstream Adoption', probability: 0.75, impactWeight: 0.85, affectedDomains: ['political', 'economic'], timeToManifest: 120 },
      { level: 3, effect: 'Institutional Impact', probability: 0.60, impactWeight: 0.95, affectedDomains: ['political', 'economic', 'security'], timeToManifest: 336 },
    ]],
  ]);

  /**
   * Calculate cascade impact for a narrative
   */
  async calculateCascadeImpact(narrativeId: string, interventionType: string): Promise<CascadeImpactResult> {
    const narrative = await Narrative.findById(narrativeId);
    if (!narrative) {
      throw new Error(`Narrative not found: ${narrativeId}`);
    }

    const interventionKey = interventionType || 'no_intervention';
    const baseChain = this.consequenceChains.get(interventionKey) || this.consequenceChains.get('no_intervention')!;

    // Calculate impact modifiers based on narrative characteristics
    const riskModifier = (narrative.riskScore || 50) / 100;
    const spreadModifier = (narrative.spreadRadius || 1) / 100;
    const sentimentModifier = Math.abs(narrative.sentiment?.overall || 0);

    // Adjust probabilities based on narrative state
    const adjustedLayers = baseChain.map(layer => ({
      ...layer,
      probability: this.adjustProbability(layer.probability, riskModifier, spreadModifier),
      impactWeight: this.adjustImpactWeight(layer.impactWeight, sentimentModifier),
    }));

    // Separate into layers
    const primaryEffects = adjustedLayers.filter(l => l.level === 1);
    const secondaryEffects = adjustedLayers.filter(l => l.level === 2);
    const tertiaryEffects = adjustedLayers.filter(l => l.level === 3);

    // Calculate cascade impact score
    const cascadeImpactScore = this.calculateCascadeScore(adjustedLayers);

    // Determine propagation paths
    const propagationPaths = this.identifyPropagationPaths(narrative);

    // Identify critical nodes
    const criticalNodes = await this.identifyCriticalNodes(narrativeId);

    // Calculate containment difficulty
    const containmentDifficulty = this.calculateContainmentDifficulty(adjustedLayers, narrative);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(cascadeImpactScore, adjustedLayers);

    return {
      narrativeId,
      cascadeMap: {
        originNarrative: narrative.title || narrative._id.toString(),
        impactLayers: adjustedLayers,
        cascadeImpactScore,
        propagationPaths,
        criticalNodes,
      },
      primaryEffects,
      secondaryEffects,
      tertiaryEffects,
      totalImpactScore: cascadeImpactScore,
      containmentDifficulty,
      recommendedActions,
    };
  }

  /**
   * Adjust probability based on narrative state
   */
  private adjustProbability(baseProb: number, riskMod: number, spreadMod: number): number {
    const riskFactor = 0.5 + riskMod * 0.5;
    const spreadFactor = 0.7 + spreadMod * 0.3;
    return Math.min(1, baseProb * riskFactor * spreadFactor);
  }

  /**
   * Adjust impact weight based on sentiment
   */
  private adjustImpactWeight(baseWeight: number, sentimentMod: number): number {
    const sentimentFactor = 0.7 + sentimentMod * 0.3;
    return Math.min(1, baseWeight * sentimentFactor);
  }

  /**
   * Calculate cascade impact score
   */
  private calculateCascadeScore(layers: ImpactLayer[]): number {
    let score = 0;
    const weights = [0.35, 0.35, 0.30]; // Primary, Secondary, Tertiary

    layers.forEach((layer, index) => {
      const levelWeight = weights[layer.level - 1] || 0.3;
      score += layer.probability * layer.impactWeight * levelWeight * 100;
    });

    return Math.round(score * 10) / 10;
  }

  /**
   * Identify propagation paths
   */
  private identifyPropagationPaths(narrative: any): string[] {
    const paths: string[] = [];
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
    const domains = ['social_media', 'news', 'political', 'economic', 'cultural'];

    // Add regional propagation
    regions.forEach(region => {
      paths.push(`regional_spread_${region.toLowerCase().replace(' ', '_')}`);
    });

    // Add domain propagation
    domains.forEach(domain => {
      paths.push(`domain_jump_${domain}`);
    });

    // Add cross-narrative propagation
    paths.push('narrative_convergence');
    paths.push('sentiment_spillover');

    return paths;
  }

  /**
   * Identify critical nodes in the network
   */
  private async identifyCriticalNodes(narrativeId: string): Promise<string[]> {
    const clusters = await Cluster.find({ narratives: narrativeId }).limit(10);
    
    const criticalNodes: string[] = [];
    
    // Add high-risk clusters
    clusters.forEach(cluster => {
      if ((cluster.riskScore || 0) > 70) {
        criticalNodes.push(`cluster_${cluster._id}`);
      }
    });

    // Add regional amplifiers
    const regions = ['NA', 'EU', 'APAC', 'LATAM', 'MEA'];
    regions.forEach(region => {
      criticalNodes.push(`amplifier_${region}`);
    });

    return criticalNodes;
  }

  /**
   * Calculate containment difficulty
   */
  private calculateContainmentDifficulty(layers: ImpactLayer[], narrative: any): number {
    const riskLevel = (narrative.riskScore || 50) / 100;
    const spreadLevel = (narrative.spreadRadius || 1) / 100;
    const tertiaryWeight = layers.filter(l => l.level === 3).reduce((sum, l) => sum + l.probability * l.impactWeight, 0);

    const difficulty = (riskLevel * 0.4 + spreadLevel * 0.3 + tertiaryWeight * 0.3) * 100;
    return Math.round(difficulty * 10) / 10;
  }

  /**
   * Generate recommended actions based on cascade analysis
   */
  private generateRecommendations(impactScore: number, layers: ImpactLayer[]): string[] {
    const recommendations: string[] = [];

    if (impactScore > 70) {
      recommendations.push('URGENT: Implement multi-layered containment strategy');
      recommendations.push('Activate cross-regional coordination protocol');
      recommendations.push('Engage diplomatic channels for narrative de-escalation');
    } else if (impactScore > 50) {
      recommendations.push('Deploy targeted counter-messaging with local adaptation');
      recommendations.push('Increase monitoring frequency to 4-hour intervals');
      recommendations.push('Prepare escalation contingencies');
    } else if (impactScore > 30) {
      recommendations.push('Maintain current intervention intensity');
      recommendations.push('Monitor secondary effect indicators');
    } else {
      recommendations.push('Continue passive monitoring');
      recommendations.push('Document cascade patterns for future reference');
    }

    // Add layer-specific recommendations
    const tertiaryEffects = layers.filter(l => l.level === 3 && l.probability > 0.4);
    if (tertiaryEffects.length > 0) {
      recommendations.push('⚠️ Warning: High probability of tertiary effects detected');
      recommendations.push('Prepare crisis response protocols');
    }

    return recommendations;
  }

  /**
   * Run bulk cascade analysis for all active narratives
   */
  async runBulkCascadeAnalysis(): Promise<Map<string, CascadeImpactResult>> {
    const narratives = await Narrative.find({ 
      status: { $in: ['active', 'monitoring', 'escalating'] },
      isActive: true 
    });

    const results = new Map<string, CascadeImpactResult>();

    for (const narrative of narratives) {
      try {
        const interventionType = narrative.lastInterventionType || 'no_intervention';
        const result = await this.calculateCascadeImpact(narrative._id.toString(), interventionType);
        results.set(narrative._id.toString(), result);
      } catch (error) {
        console.error(`Failed to calculate cascade for narrative ${narrative._id}:`, error);
      }
    }

    return results;
  }

  /**
   * Analyze cross-narrative cascade potential
   */
  async analyzeCrossNarrativeCascades(): Promise<{
    highRiskPairs: Array<{ narrative1: string; narrative2: string; cascadeProbability: number }>;
    sharedAmplifiers: string[];
    convergenceZones: string[];
  }> {
    const narratives = await Narrative.find({ 
      status: { $in: ['active', 'monitoring', 'escalating'] },
      isActive: true 
    });

    const highRiskPairs: Array<{ narrative1: string; narrative2: string; cascadeProbability: number }> = [];
    const sharedAmplifiers: string[] = [];
    const convergenceZones: string[] = [];

    // Compare narratives for cross-cascade potential
    for (let i = 0; i < narratives.length; i++) {
      for (let j = i + 1; j < narratives.length; j++) {
        const n1 = narratives[i];
        const n2 = narratives[j];

        // Calculate sentiment similarity
        const sent1 = n1.sentiment?.overall || 0;
        const sent2 = n2.sentiment?.overall || 0;
        const sentimentSimilarity = 1 - Math.abs(sent1 - sent2) / 2;

        // Calculate risk combination
        const combinedRisk = ((n1.riskScore || 0) + (n2.riskScore || 0)) / 2;

        // Calculate cascade probability
        if (sentimentSimilarity > 0.7 && combinedRisk > 60) {
          const cascadeProb = sentimentSimilarity * (combinedRisk / 100);
          highRiskPairs.push({
            narrative1: n1._id.toString(),
            narrative2: n2._id.toString(),
            cascadeProbability: Math.round(cascadeProb * 100) / 100,
          });
        }
      }
    }

    // Identify shared amplifiers (regions/platforms)
    const regionCounts = new Map<string, number>();
    narratives.forEach(n => {
      if (n.regionalDistribution) {
        n.regionalDistribution.forEach((dist: any) => {
          const count = regionCounts.get(dist.region) || 0;
          regionCounts.set(dist.region, count + 1);
        });
      }
    });

    regionCounts.forEach((count, region) => {
      if (count > 2) {
        sharedAmplifiers.push(region);
        convergenceZones.push(`high_activity_${region}`);
      }
    });

    return { highRiskPairs, sharedAmplifiers, convergenceZones };
  }
}

export const cascadeImpactService = new CascadeImpactService();
