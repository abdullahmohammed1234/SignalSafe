import { Narrative } from '../models/Narrative';

export interface StabilityMetrics {
  totalExposure: number;
  conflictIntensity: number;
  spreadVelocity: number;
  mutationRate: number;
  driftLevel: number;
  confidenceIndex: number;
}

export interface StrategicStabilityIndex {
  overallIndex: number;
  interpretation: 'Stable' | 'Tension' | 'Volatile' | 'Unstable' | 'Systemic Crisis';
  metrics: StabilityMetrics;
  riskContributors: Array<{ factor: string; impact: number }>;
  stabilityTrend: 'improving' | 'stable' | 'declining';
  calculatedAt: Date;
  confidence: number;
}

/**
 * Strategic Stability Index Service
 * Aggregates multiple metrics to compute overall system stability (0-100)
 */
export class StabilityIndexService {

  // Helper methods defined first

  private calculateTotalExposure(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    let totalExposure = 0;
    narratives.forEach(n => {
      const riskScore = (n as any).riskScore || 0;
      const spreadRadius = (n as any).spreadRadius || 1;
      const reach = Math.min(100, spreadRadius * 10);
      totalExposure += riskScore * (reach / 100);
    });

    const normalizedExposure = (totalExposure / narratives.length) * (1 + narratives.length / 50);
    return Math.min(100, normalizedExposure);
  }

  private calculateConflictIntensity(narratives: any[]): number {
    if (narratives.length < 2) return 0;

    let conflictCount = 0;
    let totalPairs = 0;

    for (let i = 0; i < narratives.length; i++) {
      for (let j = i + 1; j < narratives.length; j++) {
        const sent1 = (narratives[i] as any).sentiment?.overall || 0;
        const sent2 = (narratives[j] as any).sentiment?.overall || 0;
        
        if (sent1 * sent2 < -0.1) {
          const risk1 = (narratives[i] as any).riskScore || 0;
          const risk2 = (narratives[j] as any).riskScore || 0;
          
          if (risk1 > 40 || risk2 > 40) {
            conflictCount++;
          }
        }
        totalPairs++;
      }
    }

    const baseIntensity = totalPairs > 0 ? (conflictCount / totalPairs) * 100 : 0;
    const avgRisk = narratives.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / narratives.length;
    
    return Math.min(100, baseIntensity * (0.5 + avgRisk / 200));
  }

  private calculateSpreadVelocity(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    let totalVelocity = 0;
    narratives.forEach(n => {
      const velocity = (n as any).velocity || (n as any).spreadVelocity || 0;
      const riskScore = (n as any).riskScore || 0;
      totalVelocity += velocity * (1 + riskScore / 100);
    });

    const avgVelocity = totalVelocity / narratives.length;
    return Math.min(100, avgVelocity * 2);
  }

  private calculateMutationRate(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    let mutationCount = 0;
    narratives.forEach(n => {
      const mutationHistory = (n as any).mutationHistory || [];
      const recentMutations = mutationHistory.filter((m: any) => {
        const mutDate = new Date(m.timestamp);
        const daysSince = (Date.now() - mutDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      mutationCount += recentMutations.length;
    });

    const avgMutations = mutationCount / narratives.length;
    return Math.min(100, avgMutations * 25);
  }

  private calculateDriftLevel(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    let totalDrift = 0;
    narratives.forEach(n => {
      const riskScore = (n as any).riskScore || 0;
      const spreadRadius = (n as any).spreadRadius || 1;
      const sentiment = (n as any).sentiment?.overall || 0;
      
      const riskDrift = Math.abs(riskScore - 50) / 50;
      const spreadDrift = Math.min(1, spreadRadius / 50);
      const sentimentDrift = Math.abs(sentiment);
      
      totalDrift += (riskDrift * 0.5 + spreadDrift * 0.3 + sentimentDrift * 0.2);
    });

    const avgDrift = (totalDrift / narratives.length) * 100;
    return Math.min(100, avgDrift);
  }

  private calculateConfidenceIndex(narratives: any[]): number {
    if (narratives.length === 0) return 50;

    let totalConfidence = 0;
    narratives.forEach(n => {
      const dataPoints = (n as any).dataPoints || (n as any).engagementCount || 0;
      const lastUpdated = n.updatedAt ? new Date(n.updatedAt).getTime() : Date.now();
      const hoursSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60);
      
      const dataConfidence = Math.min(1, dataPoints / 1000);
      const recencyConfidence = Math.max(0, 1 - hoursSinceUpdate / 72);
      
      totalConfidence += (dataConfidence * 0.6 + recencyConfidence * 0.4);
    });

    const avgConfidence = (totalConfidence / narratives.length) * 100;
    return Math.min(100, avgConfidence);
  }

  private interpretIndex(index: number): 'Stable' | 'Tension' | 'Volatile' | 'Unstable' | 'Systemic Crisis' {
    if (index >= 80) return 'Stable';
    if (index >= 60) return 'Tension';
    if (index >= 40) return 'Volatile';
    if (index >= 20) return 'Unstable';
    return 'Systemic Crisis';
  }

  private identifyRiskContributors(narratives: any[]): Array<{ factor: string; impact: number }> {
    const contributors: Array<{ factor: string; impact: number }> = [];

    const highRisk = narratives.filter(n => (n as any).riskScore > 70);
    if (highRisk.length > 0) {
      contributors.push({
        factor: `${highRisk.length} high-risk narratives`,
        impact: highRisk.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / highRisk.length,
      });
    }

    const escalating = narratives.filter(n => (n as any).status === 'escalating');
    if (escalating.length > 0) {
      contributors.push({
        factor: `${escalating.length} escalating narratives`,
        impact: 75,
      });
    }

    const fastSpreading = narratives.filter(n => (n as any).spreadVelocity > 50);
    if (fastSpreading.length > 0) {
      contributors.push({
        factor: `${fastSpreading.length} fast-spreading narratives`,
        impact: 60,
      });
    }

    const regions = new Set<string>();
    narratives.forEach(n => {
      const dist = (n as any).regionalDistribution || [];
      dist.forEach((d: any) => regions.add(d.region));
    });
    if (regions.size > 3) {
      contributors.push({
        factor: `Multi-region spread (${regions.size} regions)`,
        impact: 55,
      });
    }

    return contributors.sort((a, b) => b.impact - a.impact).slice(0, 5);
  }

  private determineTrend(narratives: any[]): 'improving' | 'stable' | 'declining' {
    let totalChange = 0;
    let count = 0;

    narratives.forEach(n => {
      const riskHistory = (n as any).riskHistory || [];
      if (riskHistory.length >= 2) {
        const recent = riskHistory.slice(-3);
        for (let i = 1; i < recent.length; i++) {
          totalChange += recent[i].riskScore - recent[i - 1].riskScore;
          count++;
        }
      }
    });

    if (count === 0) return 'stable';

    const avgChange = totalChange / count;

    if (avgChange < -2) return 'improving';
    if (avgChange > 2) return 'declining';
    return 'stable';
  }

  /**
   * Main method: Calculate the strategic stability index
   */
  async calculateStabilityIndex(): Promise<StrategicStabilityIndex> {
    const narratives = await Narrative.find({ isActive: true });

    const totalExposure = this.calculateTotalExposure(narratives);
    const conflictIntensity = this.calculateConflictIntensity(narratives);
    const spreadVelocity = this.calculateSpreadVelocity(narratives);
    const mutationRate = this.calculateMutationRate(narratives);
    const driftLevel = this.calculateDriftLevel(narratives);
    const confidenceIndex = this.calculateConfidenceIndex(narratives);

    const weights = {
      totalExposure: 0.20,
      conflictIntensity: 0.25,
      spreadVelocity: 0.20,
      mutationRate: 0.15,
      driftLevel: 0.10,
      confidenceIndex: 0.10,
    };

    const stabilityScores = {
      totalExposure: (100 - totalExposure),
      conflictIntensity: (100 - conflictIntensity),
      spreadVelocity: (100 - spreadVelocity),
      mutationRate: (100 - mutationRate),
      driftLevel: (100 - driftLevel),
      confidenceIndex: confidenceIndex,
    };

    const overallIndex = 
      stabilityScores.totalExposure * weights.totalExposure +
      stabilityScores.conflictIntensity * weights.conflictIntensity +
      stabilityScores.spreadVelocity * weights.spreadVelocity +
      stabilityScores.mutationRate * weights.mutationRate +
      stabilityScores.driftLevel * weights.driftLevel +
      stabilityScores.confidenceIndex * weights.confidenceIndex;

    const roundedIndex = Math.round(overallIndex * 10) / 10;
    const interpretation = this.interpretIndex(roundedIndex);
    const riskContributors = this.identifyRiskContributors(narratives);
    const stabilityTrend = this.determineTrend(narratives);

    return {
      overallIndex: roundedIndex,
      interpretation,
      metrics: {
        totalExposure: Math.round(totalExposure * 10) / 10,
        conflictIntensity: Math.round(conflictIntensity * 10) / 10,
        spreadVelocity: Math.round(spreadVelocity * 10) / 10,
        mutationRate: Math.round(mutationRate * 10) / 10,
        driftLevel: Math.round(driftLevel * 10) / 10,
        confidenceIndex: Math.round(confidenceIndex * 10) / 10,
      },
      riskContributors,
      stabilityTrend,
      calculatedAt: new Date(),
      confidence: 0.82,
    };
  }

  async getQuickSnapshot(): Promise<{ index: number; status: string }> {
    const result = await this.calculateStabilityIndex();
    return {
      index: result.overallIndex,
      status: result.interpretation,
    };
  }
}

export const stabilityIndexService = new StabilityIndexService();
