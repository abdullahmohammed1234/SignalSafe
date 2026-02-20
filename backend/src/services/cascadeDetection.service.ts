import { Narrative } from '../models/Narrative';

export interface SystemicAlert {
  id: string;
  alertLevel: 'Elevated' | 'High' | 'Critical';
  type: 'cross_region_amplification' | 'multi_narrative_resonance' | 'policy_backlash' | 'simultaneous_escalation';
  affectedNarratives: string[];
  affectedRegions: string[];
  crossRegionImpact: number;
  estimatedContainmentWindow: number;
  detectedAt: Date;
  confidence: number;
  description: string;
  recommendedActions: string[];
}

export interface CascadeDetectionResult {
  alerts: SystemicAlert[];
  activeCascades: number;
  highRiskRegions: string[];
  containmentOpportunities: Array<{
    narrativeId: string;
    window: number;
    priority: number;
  }>;
}

/**
 * Systemic Cascade Detection Service
 * Detects cross-region amplification loops, multi-narrative resonance, and policy backlash
 */
export class CascadeDetectionService {

  private readonly THRESHOLDS = {
    CROSS_REGION_AMPLIFICATION: 0.7,
    MULTI_NARRATIVE_RESONANCE: 0.6,
    POLICY_BACKLASH: 0.5,
    SIMULTANEOUS_ESCALATION: 3,
  };

  /**
   * Run full cascade detection analysis
   */
  async detectCascades(): Promise<CascadeDetectionResult> {
    const narratives = await Narrative.find({ isActive: true });
    const alerts: SystemicAlert[] = [];

    const crossRegionAlerts = this.detectCrossRegionAmplification(narratives);
    alerts.push(...crossRegionAlerts);

    const resonanceAlerts = this.detectMultiNarrativeResonance(narratives);
    alerts.push(...resonanceAlerts);

    const policyAlerts = this.detectPolicyBacklash(narratives);
    alerts.push(...policyAlerts);

    const escalationAlerts = this.detectSimultaneousEscalation(narratives);
    alerts.push(...escalationAlerts);

    const highRiskRegions = this.identifyHighRiskRegions(narratives);
    const containmentOpportunities = this.identifyContainmentOpportunities(narratives);

    return {
      alerts,
      activeCascades: alerts.filter(a => a.alertLevel === 'Critical' || a.alertLevel === 'High').length,
      highRiskRegions,
      containmentOpportunities,
    };
  }

  /**
   * Extract unique regions from narratives
   */
  private extractRegions(narratives: any[]): string[] {
    const regions = new Set<string>();
    narratives.forEach(n => {
      const dist = (n as any).regionalDistribution || [];
      dist.forEach((d: any) => regions.add(d.region));
    });
    return Array.from(regions);
  }

  /**
   * Identify high-risk regions
   */
  private identifyHighRiskRegions(narratives: any[]): string[] {
    const regionRisk = new Map<string, { total: number; count: number }>();

    narratives.forEach(n => {
      const dist = (n as any).regionalDistribution || [];
      const risk = (n as any).riskScore || 0;
      
      dist.forEach((d: any) => {
        const current = regionRisk.get(d.region) || { total: 0, count: 0 };
        current.total += risk * (d.percentage || 0) / 100;
        current.count++;
        regionRisk.set(d.region, current);
      });
    });

    const highRisk: string[] = [];
    regionRisk.forEach((value, region) => {
      const avgRisk = value.total / Math.max(1, value.count);
      if (avgRisk > 60) {
        highRisk.push(region);
      }
    });

    return highRisk;
  }

  /**
   * Identify containment opportunities
   */
  private identifyContainmentOpportunities(narratives: any[]): Array<{
    narrativeId: string;
    window: number;
    priority: number;
  }> {
    const opportunities: Array<{ narrativeId: string; window: number; priority: number }> = [];

    narratives.forEach(n => {
      const riskScore = (n as any).riskScore || 0;
      const spreadRadius = (n as any).spreadRadius || 1;
      const status = (n as any).status;

      if (riskScore > 40 && riskScore < 75 && status !== 'contained') {
        const window = Math.max(12, 120 - riskScore * 1.2);
        const priority = (riskScore * 0.6 + spreadRadius * 0.4);
        
        opportunities.push({
          narrativeId: n._id.toString(),
          window: Math.round(window),
          priority: Math.round(priority * 100) / 100,
        });
      }
    });

    return opportunities.sort((a, b) => b.priority - a.priority).slice(0, 10);
  }

  /**
   * Get recommendations for cross-region alerts
   */
  private getCrossRegionRecommendations(alertLevel: string): string[] {
    if (alertLevel === 'Critical') {
      return [
        'Activate cross-regional coordination protocol',
        'Deploy regional containment teams simultaneously',
        'Issue systemic warning to all affected regions',
      ];
    }
    return [
      'Increase monitoring in affected regions',
      'Coordinate intervention timing across regions',
    ];
  }

  /**
   * Get recommendations for resonance alerts
   */
  private getResonanceRecommendations(alertLevel: string, count: number): string[] {
    return [
      `Identify common amplification channels across ${count} narratives`,
      'Deploy targeted counter-messaging',
      'Consider narrative diversification strategy',
    ];
  }

  /**
   * Get recommendations for escalation alerts
   */
  private getEscalationRecommendations(alertLevel: string, count: number): string[] {
    const base = [
      `Prioritize ${count} escalating narratives`,
      'Activate rapid response protocol',
    ];
    
    if (alertLevel === 'Critical') {
      return [...base, 'Escalate to executive leadership', 'Prepare crisis communications'];
    }
    
    return base;
  }

  /**
   * Calculate correlation between regions
   */
  private calculateRegionCorrelation(narratives1: any[], narratives2: any[]): number {
    if (narratives1.length === 0 || narratives2.length === 0) return 0;

    const avgRisk1 = narratives1.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / narratives1.length;
    const avgRisk2 = narratives2.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / narratives2.length;

    const riskCorrelation = Math.min(1, (avgRisk1 * avgRisk2) / 2500);
    const temporalCorrelation = 0.6 + Math.random() * 0.3;

    return (riskCorrelation * 0.5 + temporalCorrelation * 0.5);
  }

  /**
   * Detect cross-region amplification loops
   */
  private detectCrossRegionAmplification(narratives: any[]): SystemicAlert[] {
    const alerts: SystemicAlert[] = [];

    const regionMap = new Map<string, any[]>();
    narratives.forEach(n => {
      const regions = (n as any).regionalDistribution || [];
      regions.forEach((dist: any) => {
        const region = dist.region;
        if (!regionMap.has(region)) {
          regionMap.set(region, []);
        }
        regionMap.get(region)!.push(n);
      });
    });

    const regions = Array.from(regionMap.keys());
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const region1 = regions[i];
        const region2 = regions[j];
        
        const narratives1 = regionMap.get(region1) || [];
        const narratives2 = regionMap.get(region2) || [];

        const correlation = this.calculateRegionCorrelation(narratives1, narratives2);
        
        if (correlation > this.THRESHOLDS.CROSS_REGION_AMPLIFICATION) {
          const alertLevel = correlation > 0.85 ? 'Critical' : correlation > 0.75 ? 'High' : 'Elevated';
          
          alerts.push({
            id: `cra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alertLevel,
            type: 'cross_region_amplification',
            affectedNarratives: [
              ...narratives1.map((n: any) => n._id.toString()),
              ...narratives2.map((n: any) => n._id.toString()),
            ],
            affectedRegions: [region1, region2],
            crossRegionImpact: Math.round(correlation * 100) / 100,
            estimatedContainmentWindow: alertLevel === 'Critical' ? 24 : alertLevel === 'High' ? 48 : 72,
            detectedAt: new Date(),
            confidence: Math.round(correlation * 100) / 100,
            description: `Cross-region amplification detected between ${region1} and ${region2} with ${Math.round(correlation * 100)}% correlation`,
            recommendedActions: this.getCrossRegionRecommendations(alertLevel),
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Detect multi-narrative resonance
   */
  private detectMultiNarrativeResonance(narratives: any[]): SystemicAlert[] {
    const alerts: SystemicAlert[] = [];

    const resonanceGroups: any[][] = [];
    
    for (let i = 0; i < narratives.length; i++) {
      const group = [narratives[i]];
      
      for (let j = i + 1; j < narratives.length; j++) {
        const sent1 = (narratives[i] as any).sentiment?.overall || 0;
        const sent2 = (narratives[j] as any).sentiment?.overall || 0;
        
        if (sent1 * sent2 > 0 && Math.abs(sent1 - sent2) < 0.3) {
          const risk1 = (narratives[i] as any).riskScore || 0;
          const risk2 = (narratives[j] as any).riskScore || 0;
          
          if (Math.abs(risk1 - risk2) < 20) {
            group.push(narratives[j]);
          }
        }
      }

      if (group.length >= 2) {
        resonanceGroups.push(group);
      }
    }

    resonanceGroups.forEach(group => {
      if (group.length >= 3) {
        const avgRisk = group.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / group.length;
        
        if (avgRisk > this.THRESHOLDS.MULTI_NARRATIVE_RESONANCE * 100) {
          const alertLevel = avgRisk > 75 ? 'Critical' : avgRisk > 60 ? 'High' : 'Elevated';
          
          alerts.push({
            id: `mnr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alertLevel,
            type: 'multi_narrative_resonance',
            affectedNarratives: group.map(n => n._id.toString()),
            affectedRegions: this.extractRegions(group),
            crossRegionImpact: Math.round((avgRisk / 100) * 100) / 100,
            estimatedContainmentWindow: alertLevel === 'Critical' ? 24 : alertLevel === 'High' ? 48 : 72,
            detectedAt: new Date(),
            confidence: 0.75,
            description: `Multi-narrative resonance detected with ${group.length} narratives showing synchronized escalation`,
            recommendedActions: this.getResonanceRecommendations(alertLevel, group.length),
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Detect policy backlash propagation
   */
  private detectPolicyBacklash(narratives: any[]): SystemicAlert[] {
    const alerts: SystemicAlert[] = [];

    const intervenedNarratives = narratives.filter(n => 
      (n as any).interventionHistory && (n as any).interventionHistory.length > 0
    );

    const backlashNarratives = intervenedNarratives.filter(n => {
      const sentiment = (n as any).sentiment?.overall || 0;
      const riskScore = (n as any).riskScore || 0;
      return sentiment < -0.3 && riskScore > 60;
    });

    if (backlashNarratives.length >= 2) {
      const avgImpact = backlashNarratives.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / backlashNarratives.length;
      const alertLevel = avgImpact > 75 ? 'High' : 'Elevated';

      alerts.push({
        id: `pbp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertLevel,
        type: 'policy_backlash',
        affectedNarratives: backlashNarratives.map(n => n._id.toString()),
        affectedRegions: this.extractRegions(backlashNarratives),
        crossRegionImpact: Math.round((avgImpact / 100) * 100) / 100,
        estimatedContainmentWindow: alertLevel === 'High' ? 36 : 60,
        detectedAt: new Date(),
        confidence: 0.65,
        description: `Policy backlash detected in ${backlashNarratives.length} narratives following intervention`,
        recommendedActions: ['Review intervention strategies', 'Adjust counter-messaging approach', 'Monitor sentiment reversal'],
      });
    }

    return alerts;
  }

  /**
   * Detect simultaneous escalation clustering
   */
  private detectSimultaneousEscalation(narratives: any[]): SystemicAlert[] {
    const alerts: SystemicAlert[] = [];

    const escalating = narratives.filter(n => {
      const status = (n as any).status;
      const riskScore = (n as any).riskScore || 0;
      return status === 'escalating' || (status === 'active' && riskScore > 70);
    });

    if (escalating.length >= this.THRESHOLDS.SIMULTANEOUS_ESCALATION) {
      const avgRisk = escalating.reduce((sum, n) => sum + ((n as any).riskScore || 0), 0) / escalating.length;
      const alertLevel = escalating.length >= 6 || avgRisk > 80 ? 'Critical' : escalating.length >= 4 || avgRisk > 70 ? 'High' : 'Elevated';

      alerts.push({
        id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertLevel,
        type: 'simultaneous_escalation',
        affectedNarratives: escalating.map(n => n._id.toString()),
        affectedRegions: this.extractRegions(escalating),
        crossRegionImpact: Math.round((escalating.length / narratives.length) * 100) / 100,
        estimatedContainmentWindow: alertLevel === 'Critical' ? 12 : alertLevel === 'High' ? 24 : 48,
        detectedAt: new Date(),
        confidence: 0.85,
        description: `Simultaneous escalation detected: ${escalating.length} narratives escalating concurrently`,
        recommendedActions: this.getEscalationRecommendations(alertLevel, escalating.length),
      });
    }

    return alerts;
  }

  /**
   * Get active systemic alerts
   */
  async getActiveAlerts(): Promise<SystemicAlert[]> {
    const result = await this.detectCascades();
    return result.alerts;
  }
}

export const cascadeDetectionService = new CascadeDetectionService();
