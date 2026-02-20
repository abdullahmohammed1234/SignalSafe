import { Narrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';

export interface TimelinePoint {
  timestamp: Date;
  riskLevel: number;
  spreadRadius: number;
  sentiment: number;
  engagement: number;
}

export interface TimelineScenario {
  scenarioId: string;
  scenarioName: string;
  interventionType: 'none' | 'early_containment' | 'delayed_containment' | 'aggressive_suppression' | 'targeted_counter_messaging';
  timeline: TimelinePoint[];
  projectedPeakRisk: number;
  timeToPeak: number; // hours
  spreadMap: Map<string, number>;
  escalationProbability: number;
  systemicImpactScore: number;
}

export interface TimelineSimulationResult {
  narrativeId: string;
  scenarios: TimelineScenario[];
  baselineScenario: TimelineScenario;
  recommendedIntervention: string;
  confidenceLevel: number;
}

/**
 * Multi-Timeline Simulation Engine
 * Generates parallel future timelines based on different intervention paths
 */
export class TimelineSimulationService {
  
  /**
   * Simulate different intervention timelines for a narrative
   */
  async simulateTimelines(narrativeId: string): Promise<TimelineSimulationResult> {
    const narrative = await Narrative.findById(narrativeId);
    if (!narrative) {
      throw new Error(`Narrative not found: ${narrativeId}`);
    }

    const currentRisk = narrative.riskScore || 50;
    const currentSpread = narrative.spreadRadius || 1;
    const currentSentiment = narrative.sentiment?.overall || 0;

    // Define intervention scenarios
    const scenarios: TimelineScenario[] = [
      this.generateScenario(narrativeId, 'No Intervention', 'none', currentRisk, currentSpread, currentSentiment, 168), // 7 days
      this.generateScenario(narrativeId, 'Early Containment', 'early_containment', currentRisk, currentSpread, currentSentiment, 72),
      this.generateScenario(narrativeId, 'Delayed Containment', 'delayed_containment', currentRisk, currentSpread, currentSentiment, 168),
      this.generateScenario(narrativeId, 'Aggressive Suppression', 'aggressive_suppression', currentRisk, currentSpread, currentSentiment, 48),
      this.generateScenario(narrativeId, 'Targeted Counter-Messaging', 'targeted_counter_messaging', currentRisk, currentSpread, currentSentiment, 96),
    ];

    // Calculate baseline (no intervention)
    const baselineScenario = scenarios[0];

    // Determine recommended intervention based on outcomes
    const recommendedIntervention = this.determineRecommendedIntervention(scenarios);

    return {
      narrativeId,
      scenarios,
      baselineScenario,
      recommendedIntervention,
      confidenceLevel: 0.78,
    };
  }

  /**
   * Generate a single scenario timeline
   */
  private generateScenario(
    narrativeId: string,
    scenarioName: string,
    interventionType: TimelineScenario['interventionType'],
    initialRisk: number,
    initialSpread: number,
    initialSentiment: number,
    durationHours: number
  ): TimelineScenario {
    const timeline: TimelinePoint[] = [];
    const spreadMap = new Map<string, number>();
    
    // Simulation parameters based on intervention type
    const params = this.getInterventionParams(interventionType);
    
    let currentRisk = initialRisk;
    let currentSpread = initialSpread;
    let currentSentiment = initialSentiment;
    let currentEngagement = Math.random() * 50 + 50;
    
    const peakRisk = initialRisk;
    let timeToPeak = 0;
    let maxRisk = 0;

    // Generate timeline points (hourly for first 24h, then 6-hourly)
    for (let hour = 0; hour <= durationHours; hour++) {
      // Apply intervention effects
      const interventionDelay = params.interventionDelay;
      const interventionActive = hour >= interventionDelay;
      
      if (interventionType === 'none') {
        // Natural growth
        currentRisk = Math.min(100, currentRisk + this.calculateRiskGrowth(currentRisk, 0.15));
        currentSpread = Math.min(100, currentSpread + this.calculateSpreadGrowth(currentSpread, 0.08));
        currentSentiment = this.applySentimentDrift(currentSentiment, 0.02);
        currentEngagement = Math.min(100, currentEngagement + (Math.random() * 2 - 0.5));
      } else if (interventionActive) {
        // Apply intervention effects
        const effectiveness = params.effectiveness;
        const suppression = params.suppression;
        
        currentRisk = Math.max(0, currentRisk - suppression);
        currentSpread = Math.max(1, currentSpread * (1 - effectiveness * 0.1));
        currentSentiment = currentSentiment + (params.sentimentShift * 0.1);
        currentEngagement = Math.max(10, currentEngagement * (1 - effectiveness * 0.05));
      } else {
        // Pre-intervention growth
        currentRisk = Math.min(100, currentRisk + this.calculateRiskGrowth(currentRisk, 0.2));
        currentSpread = Math.min(100, currentSpread + this.calculateSpreadGrowth(currentSpread, 0.12));
      }

      // Track peak
      if (currentRisk > maxRisk) {
        maxRisk = currentRisk;
        timeToPeak = hour;
      }

      // Sample timeline points
      if (hour % (hour < 24 ? 1 : 6) === 0 || hour === durationHours) {
        timeline.push({
          timestamp: new Date(Date.now() + hour * 3600000),
          riskLevel: Math.round(currentRisk * 10) / 10,
          spreadRadius: Math.round(currentSpread * 10) / 10,
          sentiment: Math.round(currentSentiment * 100) / 100,
          engagement: Math.round(currentEngagement * 10) / 10,
        });
      }

      // Update spread map for regions
      if (hour % 12 === 0) {
        const regions = ['NA', 'EU', 'APAC', 'LATAM', 'MEA'];
        regions.forEach(region => {
          const regionSpread = currentSpread * (0.8 + Math.random() * 0.4);
          spreadMap.set(`${region}_${hour}`, Math.min(100, regionSpread));
        });
      }
    }

    // Calculate escalation probability
    const escalationProbability = this.calculateEscalationProbability(interventionType, maxRisk, timeToPeak);
    
    // Calculate systemic impact score
    const systemicImpactScore = this.calculateSystemicImpact(currentRisk, currentSpread, escalationProbability);

    return {
      scenarioId: `${narrativeId}_${interventionType}`,
      scenarioName,
      interventionType,
      timeline,
      projectedPeakRisk: Math.round(maxRisk * 10) / 10,
      timeToPeak,
      spreadMap,
      escalationProbability: Math.round(escalationProbability * 100) / 100,
      systemicImpactScore: Math.round(systemicImpactScore * 10) / 10,
    };
  }

  /**
   * Get intervention parameters
   */
  private getInterventionParams(interventionType: string): {
    interventionDelay: number;
    effectiveness: number;
    suppression: number;
    sentimentShift: number;
  } {
    const params: Record<string, any> = {
      none: { interventionDelay: Infinity, effectiveness: 0, suppression: 0, sentimentShift: 0 },
      early_containment: { interventionDelay: 6, effectiveness: 0.85, suppression: 2.5, sentimentShift: 0.3 },
      delayed_containment: { interventionDelay: 48, effectiveness: 0.6, suppression: 1.5, sentimentShift: 0.15 },
      aggressive_suppression: { interventionDelay: 0, effectiveness: 0.95, suppression: 4.0, sentimentShift: -0.5 },
      targeted_counter_messaging: { interventionDelay: 12, effectiveness: 0.7, suppression: 1.0, sentimentShift: 0.8 },
    };
    return params[interventionType] || params.none;
  }

  /**
   * Calculate risk growth rate
   */
  private calculateRiskGrowth(currentRisk: number, baseRate: number): number {
    const momentum = currentRisk < 30 ? 1.5 : currentRisk < 60 ? 1.0 : 0.7;
    const saturation = 1 - (currentRisk / 150);
    return baseRate * momentum * saturation + (Math.random() * 0.5);
  }

  /**
   * Calculate spread growth
   */
  private calculateSpreadGrowth(currentSpread: number, baseRate: number): number {
    const regionalPenetration = currentSpread < 20 ? 1.8 : 1.0;
    return baseRate * regionalPenetration + (Math.random() * 0.3);
  }

  /**
   * Apply sentiment drift
   */
  private applySentimentDrift(currentSentiment: number, drift: number): number {
    const polarity = currentSentiment > 0 ? 1 : currentSentiment < 0 ? -1 : (Math.random() - 0.5);
    return Math.max(-1, Math.min(1, currentSentiment + polarity * drift * (0.5 + Math.random())));
  }

  /**
   * Calculate escalation probability
   */
  private calculateEscalationProbability(interventionType: string, peakRisk: number, timeToPeak: number): number {
    let baseProbability = 0;
    
    switch (interventionType) {
      case 'none':
        baseProbability = 0.85;
        break;
      case 'early_containment':
        baseProbability = 0.15;
        break;
      case 'delayed_containment':
        baseProbability = 0.45;
        break;
      case 'aggressive_suppression':
        baseProbability = 0.25;
        break;
      case 'targeted_counter_messaging':
        baseProbability = 0.20;
        break;
    }

    // Adjust for risk level and timing
    const riskFactor = peakRisk / 100;
    const timeFactor = Math.min(1, timeToPeak / 120);
    
    return baseProbability * riskFactor * (0.5 + timeFactor * 0.5);
  }

  /**
   * Calculate systemic impact score
   */
  private calculateSystemicImpact(risk: number, spread: number, escalationProb: number): number {
    const riskWeight = 0.4;
    const spreadWeight = 0.35;
    const escalationWeight = 0.25;
    
    return (risk * riskWeight + spread * spreadWeight + escalationProb * 100 * escalationWeight) / 3;
  }

  /**
   * Determine recommended intervention
   */
  private determineRecommendedIntervention(scenarios: TimelineScenario[]): string {
    // Score each scenario: lower systemic impact and lower escalation = better
    let bestScenario = scenarios[0];
    let bestScore = Infinity;

    scenarios.forEach(scenario => {
      const score = scenario.systemicImpactScore * 0.6 + scenario.escalationProbability * 100 * 0.4;
      if (score < bestScore) {
        bestScore = score;
        bestScenario = scenario;
      }
    });

    return bestScenario.interventionType;
  }

  /**
   * Run bulk simulation for all active narratives
   */
  async runBulkSimulation(): Promise<Map<string, TimelineSimulationResult>> {
    const narratives = await Narrative.find({ 
      status: { $in: ['active', 'monitoring', 'escalating'] },
      isActive: true 
    });

    const results = new Map<string, TimelineSimulationResult>();

    for (const narrative of narratives) {
      try {
        const result = await this.simulateTimelines(narrative._id.toString());
        results.set(narrative._id.toString(), result);
      } catch (error) {
        console.error(`Failed to simulate narrative ${narrative._id}:`, error);
      }
    }

    return results;
  }
}

export const timelineSimulationService = new TimelineSimulationService();
