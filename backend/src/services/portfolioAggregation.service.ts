import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface RiskPortfolioSummary {
  totalExposure: number;
  highRiskNarratives: string[];
  emergingClusters: string[];
  systemicRiskLevel: number;
  diversificationIndex: number;
  riskByCategory: Record<string, number>;
  riskByRegion: Record<string, number>;
  riskByLifecycle: Record<string, number>;
  topContributors: { narrativeId: string; exposure: number; riskScore: number }[];
  recommendations: string[];
  generatedAt: Date;
}

export interface PortfolioSnapshot {
  snapshotId: string;
  totalExposure: number;
  riskByCategory: Record<string, number>;
  riskByRegion: Record<string, number>;
  riskByLifecycle: Record<string, number>;
  narrativeCount: number;
  clusterCount: number;
  systemicRiskLevel: number;
  createdAt: Date;
}

export interface PortfolioSnapshotDocument extends PortfolioSnapshot, Document {}

// ============== SCHEMA ==============
const PortfolioSnapshotSchema = new Schema<PortfolioSnapshotDocument>(
  {
    snapshotId: { type: String, required: true, unique: true },
    totalExposure: { type: Number, required: true },
    riskByCategory: { type: Schema.Types.Mixed, default: {} },
    riskByRegion: { type: Schema.Types.Mixed, default: {} },
    riskByLifecycle: { type: Schema.Types.Mixed, default: {} },
    narrativeCount: { type: Number, required: true },
    clusterCount: { type: Number, required: true },
    systemicRiskLevel: { type: Number, required: true },
  },
  { timestamps: true }
);

PortfolioSnapshotSchema.index({ createdAt: -1 });

export const PortfolioSnapshotModel = mongoose.model<PortfolioSnapshotDocument>(
  'PortfolioSnapshot',
  PortfolioSnapshotSchema
);

// ============== SERVICE ==============
export class PortfolioAggregationService {

  /**
   * Calculate total exposure across all narratives, regions, and lifecycle states
   * Formula: TotalExposure = Σ (riskScore * spreadProbability * velocity)
   */
  async calculateTotalExposure(): Promise<{
    totalExposure: number;
    byNarrative: { narrativeId: string; exposure: number }[];
    byRegion: Record<string, number>;
    byLifecycle: Record<string, number>;
  }> {
    // Get all narratives with risk data (simulated)
    const narratives = await this.getAllNarratives();
    
    let totalExposure = 0;
    const byNarrative: { narrativeId: string; exposure: number }[] = [];
    const byRegion: Record<string, number> = {};
    const byLifecycle: Record<string, number> = {};

    for (const narrative of narratives) {
      const exposure = narrative.riskScore * narrative.spreadProbability * (narrative.velocity || 0.5);
      totalExposure += exposure;
      
      byNarrative.push({ narrativeId: narrative.id, exposure: Math.round(exposure * 1000) / 1000 });
      
      // Aggregate by region
      const region = narrative.region || 'unknown';
      byRegion[region] = (byRegion[region] || 0) + exposure;
      
      // Aggregate by lifecycle
      const lifecycle = narrative.lifecycle || 'unknown';
      byLifecycle[lifecycle] = (byLifecycle[lifecycle] || 0) + exposure;
    }

    return {
      totalExposure: Math.round(totalExposure * 1000) / 1000,
      byNarrative: byNarrative.sort((a, b) => b.exposure - a.exposure),
      byRegion,
      byLifecycle,
    };
  }

  /**
   * Get comprehensive portfolio summary
   */
  async getPortfolioOverview(): Promise<RiskPortfolioSummary> {
    // Get exposure data
    const exposureData = await this.calculateTotalExposure();
    
    // Get all narratives
    const narratives = await this.getAllNarratives();
    
    // Identify high risk narratives
    const highRiskNarratives = narratives
      .filter(n => n.riskScore >= 0.7)
      .map(n => n.id);
    
    // Identify emerging clusters
    const emergingClusters = narratives
      .filter(n => n.lifecycle === 'emerging' && n.riskScore >= 0.5)
      .map(n => n.clusterId)
      .filter((v, i, a) => a.indexOf(v) === i);
    
    // Calculate systemic risk level
    const systemicRiskLevel = this.calculateSystemicRiskLevel(narratives, exposureData);
    
    // Calculate diversification index (0-1, higher = more diversified)
    const diversificationIndex = this.calculateDiversificationIndex(narratives, exposureData);
    
    // Aggregate risk by category
    const riskByCategory = this.aggregateByCategory(narratives);
    
    // Get top risk contributors
    const topContributors = exposureData.byNarrative.slice(0, 10).map(item => {
      const narrative = narratives.find(n => n.id === item.narrativeId);
      return {
        narrativeId: item.narrativeId,
        exposure: item.exposure,
        riskScore: narrative?.riskScore || 0,
      };
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      highRiskNarratives,
      emergingClusters,
      systemicRiskLevel,
      diversificationIndex
    );
    
    return {
      totalExposure: exposureData.totalExposure,
      highRiskNarratives,
      emergingClusters,
      systemicRiskLevel,
      diversificationIndex,
      riskByCategory,
      riskByRegion: exposureData.byRegion,
      riskByLifecycle: exposureData.byLifecycle,
      topContributors,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate systemic risk level
   */
  private calculateSystemicRiskLevel(narratives: any[], exposureData: any): number {
    // Factors that contribute to systemic risk:
    // 1. Total exposure
    // 2. Concentration of risk
    // 3. Number of high-risk narratives
    // 4. Interconnectedness (simulated)
    
    const highRiskCount = narratives.filter(n => n.riskScore >= 0.7).length;
    const totalNarratives = narratives.length;
    const highRiskRatio = highRiskCount / totalNarratives;
    
    // Calculate concentration (how much exposure is in top 10%)
    const top10Threshold = exposureData.byNarrative.length * 0.1;
    const topExposure = exposureData.byNarrative.slice(0, Math.ceil(top10Threshold))
      .reduce((sum: number, n: { exposure: number }) => sum + n.exposure, 0);
    const concentration = totalNarratives > 0 ? topExposure / exposureData.totalExposure : 0;
    
    // Calculate systemic risk (0-1)
    const systemicRisk = (
      highRiskRatio * 0.4 +
      concentration * 0.3 +
      (exposureData.totalExposure / 100) * 0.3
    );
    
    return Math.min(1, Math.round(systemicRisk * 100) / 100);
  }

  /**
   * Calculate diversification index
   */
  private calculateDiversificationIndex(narratives: any[], exposureData: any): number {
    const regions = Object.keys(exposureData.byRegion).length;
    const lifecycles = Object.keys(exposureData.byLifecycle).length;
    const narrativesCount = narratives.length;
    
    // More regions and lifecycles = better diversification
    // Normalize to 0-1 scale
    const regionScore = Math.min(1, regions / 10);
    const lifecycleScore = Math.min(1, lifecycles / 5);
    const sizeScore = Math.min(1, narrativesCount / 50);
    
    return Math.round((regionScore * 0.4 + lifecycleScore * 0.3 + sizeScore * 0.3) * 100) / 100;
  }

  /**
   * Aggregate risk by category
   */
  private aggregateByCategory(narratives: any[]): Record<string, number> {
    const byCategory: Record<string, number> = {};
    
    narratives.forEach(narrative => {
      const category = narrative.category || 'uncategorized';
      byCategory[category] = (byCategory[category] || 0) + narrative.riskScore;
    });
    
    // Average by category
    const categoryCounts: Record<string, number> = {};
    Object.keys(byCategory).forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat] = Math.round((byCategory[cat] / categoryCounts[cat]) * 100) / 100;
    });
    
    return byCategory;
  }

  /**
   * Generate recommendations based on portfolio analysis
   */
  private generateRecommendations(
    highRiskNarratives: string[],
    emergingClusters: string[],
    systemicRiskLevel: number,
    diversificationIndex: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (highRiskNarratives.length > 5) {
      recommendations.push(`CRITICAL: ${highRiskNarratives.length} high-risk narratives require immediate attention`);
    }
    
    if (emergingClusters.length > 0) {
      recommendations.push(`ALERT: ${emergingClusters.length} emerging clusters detected - monitor closely`);
    }
    
    if (systemicRiskLevel > 0.7) {
      recommendations.push('WARNING: Systemic risk elevated - consider portfolio-level intervention');
    }
    
    if (systemicRiskLevel > 0.5) {
      recommendations.push('MODERATE: Systemic risk elevated - maintain heightened monitoring');
    }
    
    if (diversificationIndex < 0.4) {
      recommendations.push('CAUTION: Low diversification - risk concentrated in few areas');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Portfolio operating within normal parameters');
    }
    
    return recommendations;
  }

  /**
   * Get mock narratives data
   */
  private async getAllNarratives(): Promise<any[]> {
    // Simulated data - in real implementation, query database
    return [
      { id: 'narrative_1', riskScore: 0.8, spreadProbability: 0.7, velocity: 0.6, region: 'US', lifecycle: 'active', category: 'politics', clusterId: 'cluster_1' },
      { id: 'narrative_2', riskScore: 0.65, spreadProbability: 0.5, velocity: 0.4, region: 'EU', lifecycle: 'growing', category: 'health', clusterId: 'cluster_2' },
      { id: 'narrative_3', riskScore: 0.45, spreadProbability: 0.6, velocity: 0.5, region: 'US', lifecycle: 'active', category: 'economy', clusterId: 'cluster_1' },
      { id: 'narrative_4', riskScore: 0.75, spreadProbability: 0.8, velocity: 0.7, region: 'APAC', lifecycle: 'emerging', category: 'technology', clusterId: 'cluster_3' },
      { id: 'narrative_5', riskScore: 0.35, spreadProbability: 0.3, velocity: 0.2, region: 'EU', lifecycle: 'stable', category: 'science', clusterId: 'cluster_4' },
      { id: 'narrative_6', riskScore: 0.85, spreadProbability: 0.9, velocity: 0.8, region: 'US', lifecycle: 'active', category: 'politics', clusterId: 'cluster_1' },
      { id: 'narrative_7', riskScore: 0.55, spreadProbability: 0.4, velocity: 0.3, region: 'LATAM', lifecycle: 'growing', category: 'health', clusterId: 'cluster_5' },
      { id: 'narrative_8', riskScore: 0.25, spreadProbability: 0.2, velocity: 0.1, region: 'EU', lifecycle: 'stable', category: 'economy', clusterId: 'cluster_4' },
    ];
  }

  /**
   * Save portfolio snapshot
   */
  async saveSnapshot(portfolio: RiskPortfolioSummary): Promise<PortfolioSnapshotDocument> {
    const snapshotId = `SNAP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const snapshot = new PortfolioSnapshotModel({
      snapshotId,
      totalExposure: portfolio.totalExposure,
      riskByCategory: portfolio.riskByCategory,
      riskByRegion: portfolio.riskByRegion,
      riskByLifecycle: portfolio.riskByLifecycle,
      narrativeCount: portfolio.highRiskNarratives.length + 10, // Approximate
      clusterCount: portfolio.emergingClusters.length + 5, // Approximate
      systemicRiskLevel: portfolio.systemicRiskLevel,
    });
    
    return await snapshot.save();
  }

  /**
   * Get historical snapshots
   */
  async getHistoricalSnapshots(limit = 30): Promise<PortfolioSnapshot[]> {
    return await PortfolioSnapshotModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Compare current portfolio to historical average
   */
  async compareToHistorical(): Promise<{
    current: RiskPortfolioSummary;
    historicalAvg: {
      totalExposure: number;
      systemicRiskLevel: number;
    };
    changes: {
      exposureChange: number;
      riskLevelChange: number;
    };
  }> {
    const current = await this.getPortfolioOverview();
    const historical = await this.getHistoricalSnapshots(30);
    
    if (historical.length === 0) {
      return {
        current,
        historicalAvg: { totalExposure: current.totalExposure, systemicRiskLevel: current.systemicRiskLevel },
        changes: { exposureChange: 0, riskLevelChange: 0 },
      };
    }
    
    const avgExposure = historical.reduce((sum, s) => sum + s.totalExposure, 0) / historical.length;
    const avgRisk = historical.reduce((sum, s) => sum + s.systemicRiskLevel, 0) / historical.length;
    
    return {
      current,
      historicalAvg: {
        totalExposure: Math.round(avgExposure * 1000) / 1000,
        systemicRiskLevel: Math.round(avgRisk * 100) / 100,
      },
      changes: {
        exposureChange: Math.round(((current.totalExposure - avgExposure) / avgExposure) * 100),
        riskLevelChange: Math.round((current.systemicRiskLevel - avgRisk) * 100),
      },
    };
  }

  /**
   * Get risk trends
   */
  async getRiskTrends(days = 7): Promise<{
    dates: string[];
    exposure: number[];
    systemicRisk: number[];
  }> {
    const snapshots = await this.getHistoricalSnapshots(days);
    
    return {
      dates: snapshots.map(s => s.createdAt.toISOString().split('T')[0]),
      exposure: snapshots.map(s => s.totalExposure),
      systemicRisk: snapshots.map(s => s.systemicRiskLevel),
    };
  }
}

export const portfolioAggregation = new PortfolioAggregationService();
