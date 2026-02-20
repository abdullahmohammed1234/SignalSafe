import { Narrative } from '../models/Narrative';

export interface EthicalImpactAssessment {
  suppressionRisk: number;
  biasRisk: number;
  fairnessScore: number;
  interventionBalanceScore: number;
  overallEthicalScore: number;
  flaggedConcerns: string[];
  recommendations: string[];
  assessedAt: Date;
}

/**
 * Ethical Constraint Modeling Layer
 * Evaluates over-suppression, polarization, bias, and narrative diversity
 */
export class EthicalConstraintService {

  /**
   * Assess ethical impact of interventions
   */
  async assessEthicalImpact(): Promise<EthicalImpactAssessment> {
    const narratives = await Narrative.find({ isActive: true });

    // Calculate individual metrics
    const suppressionRisk = this.calculateSuppressionRisk(narratives);
    const biasRisk = this.calculateBiasRisk(narratives);
    const fairnessScore = this.calculateFairnessScore(narratives);
    const interventionBalanceScore = this.calculateInterventionBalance(narratives);

    // Overall ethical score (weighted average)
    const overallScore = 
      (suppressionRisk * 0.25) +
      ((100 - biasRisk) * 0.25) +
      (fairnessScore * 0.25) +
      (interventionBalanceScore * 0.25);

    // Generate flagged concerns
    const flaggedConcerns = this.identifyConcerns(narratives, suppressionRisk, biasRisk, fairnessScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      suppressionRisk, 
      biasRisk, 
      fairnessScore, 
      interventionBalanceScore
    );

    return {
      suppressionRisk: Math.round(suppressionRisk * 10) / 10,
      biasRisk: Math.round(biasRisk * 10) / 10,
      fairnessScore: Math.round(fairnessScore * 10) / 10,
      interventionBalanceScore: Math.round(interventionBalanceScore * 10) / 10,
      overallEthicalScore: Math.round(overallScore * 10) / 10,
      flaggedConcerns,
      recommendations,
      assessedAt: new Date(),
    };
  }

  /**
   * Calculate over-suppression risk
   */
  private calculateSuppressionRisk(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    let suppressionRisk = 0;
    let count = 0;

    narratives.forEach(n => {
      const interventionHistory = (n as any).interventionHistory || [];
      const status = (n as any).status;
      const sentiment = (n as any).sentiment?.overall || 0;

      // Narratives that were aggressively suppressed
      if (interventionHistory.length > 3 && status === 'contained') {
        suppressionRisk += 30;
        count++;
      }

      // Narratives with strong negative sentiment that are contained
      if (sentiment < -0.5 && status === 'contained') {
        suppressionRisk += 20;
        count++;
      }

      // High intervention frequency
      if (interventionHistory.length > 5) {
        suppressionRisk += 15;
        count++;
      }
    });

    // Average and normalize
    return count > 0 ? Math.min(100, suppressionRisk / Math.sqrt(count)) : 0;
  }

  /**
   * Calculate regional bias risk
   */
  private calculateBiasRisk(narratives: any[]): number {
    if (narratives.length === 0) return 0;

    const regionInterventions = new Map<string, number>();
    const regionNarratives = new Map<string, number>();

    narratives.forEach(n => {
      const regionalDist = (n as any).regionalDistribution || [];
      const interventionHistory = (n as any).interventionHistory || [];

      regionalDist.forEach((dist: any) => {
        const region = dist.region;
        const count = regionNarratives.get(region) || 0;
        regionNarratives.set(region, count + 1);

        if (interventionHistory.length > 0) {
          const intCount = regionInterventions.get(region) || 0;
          regionInterventions.set(region, intCount + interventionHistory.length);
        }
      });
    });

    // Calculate bias based on intervention distribution
    let biasScore = 0;
    let comparisons = 0;

    const regions = Array.from(regionNarratives.keys());
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const region1 = regions[i];
        const region2 = regions[j];

        const int1 = regionInterventions.get(region1) || 0;
        const int2 = regionInterventions.get(region2) || 0;
        const narr1 = regionNarratives.get(region1) || 1;
        const narr2 = regionNarratives.get(region2) || 1;

        const rate1 = int1 / narr1;
        const rate2 = int2 / narr2;

        const diff = Math.abs(rate1 - rate2);
        if (diff > 0.3) {
          biasScore += diff * 50;
        }
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.min(100, biasScore / comparisons) : 0;
  }

  /**
   * Calculate fairness score
   */
  private calculateFairnessScore(narratives: any[]): number {
    if (narratives.length === 0) return 50;

    let fairnessScore = 70; // Start with decent baseline

    // Check risk score distribution
    const riskScores = narratives.map(n => (n as any).riskScore || 50);
    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    
    // Check for disproportionate focus on low-risk narratives
    const lowRiskFocus = riskScores.filter(r => r < 30).length / riskScores.length;
    if (lowRiskFocus > 0.5) {
      fairnessScore -= 15;
    }

    // Check for high-risk neglect
    const highRisk = riskScores.filter(r => r > 70).length / riskScores.length;
    if (highRisk > 0.3 && lowRiskFocus < 0.1) {
      fairnessScore += 10; // Good focus on high-risk
    }

    // Check sentiment balance
    const sentiments = narratives.map(n => (n as any).sentiment?.overall || 0);
    const positive = sentiments.filter(s => s > 0.1).length;
    const negative = sentiments.filter(s => s < -0.1).length;
    const balance = Math.abs(positive - negative) / sentiments.length;
    
    if (balance > 0.6) {
      fairnessScore -= 10; // Unequal attention to sentiment
    }

    return Math.max(0, Math.min(100, fairnessScore));
  }

  /**
   * Calculate intervention balance
   */
  private calculateInterventionBalance(narratives: any[]): number {
    if (narratives.length === 0) return 50;

    const interventionTypes = {
      suppression: 0,
      counterMessaging: 0,
      containment: 0,
      monitoring: 0,
    };

    narratives.forEach(n => {
      const interventionHistory = (n as any).interventionHistory || [];
      interventionHistory.forEach((int: any) => {
        const type = int.type || 'monitoring';
        if (type in interventionTypes) {
          interventionTypes[type as keyof typeof interventionTypes]++;
        }
      });
    });

    // Calculate diversity of interventions
    const typesUsed = Object.values(interventionTypes).filter(v => v > 0).length;
    const balanceScore = (typesUsed / 4) * 100;

    // Check for over-reliance on suppression
    const total = Object.values(interventionTypes).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const suppressionRatio = interventionTypes.suppression / total;
      if (suppressionRatio > 0.5) {
        return balanceScore * 0.7;
      }
    }

    return balanceScore;
  }

  /**
   * Identify ethical concerns
   */
  private identifyConcerns(
    narratives: any[], 
    suppressionRisk: number, 
    biasRisk: number, 
    fairnessScore: number
  ): string[] {
    const concerns: string[] = [];

    if (suppressionRisk > 60) {
      concerns.push('HIGH: Significant over-suppression risk detected');
    } else if (suppressionRisk > 40) {
      concerns.push('MODERATE: Elevated suppression risk');
    }

    if (biasRisk > 50) {
      concerns.push('HIGH: Regional bias imbalance detected');
    } else if (biasRisk > 30) {
      concerns.push('MODERATE: Some regional bias detected');
    }

    if (fairnessScore < 40) {
      concerns.push('LOW: Fairness score below acceptable threshold');
    }

    // Check for specific narrative issues
    const silencedNarratives = narratives.filter(n => 
      (n as any).status === 'contained' && (n as any).sentiment?.overall < -0.3
    );
    if (silencedNarratives.length > 2) {
      concerns.push(`POTENTIAL: ${silencedNarratives.length} negatively-sentiment narratives may be over-suppressed`);
    }

    return concerns;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    suppressionRisk: number,
    biasRisk: number,
    fairnessScore: number,
    interventionBalance: number
  ): string[] {
    const recommendations: string[] = [];

    if (suppressionRisk > 50) {
      recommendations.push('Review suppression-heavy intervention strategies');
      recommendations.push('Consider alternative approaches (counter-messaging vs suppression)');
    }

    if (biasRisk > 40) {
      recommendations.push('Audit intervention distribution across regions');
      recommendations.push('Ensure equitable attention to all regions');
    }

    if (fairnessScore < 60) {
      recommendations.push('Review narrative prioritization criteria');
      recommendations.push('Ensure high-risk narratives receive adequate attention');
    }

    if (interventionBalance < 50) {
      recommendations.push('Diversify intervention approaches');
      recommendations.push('Balance suppression with counter-messaging and containment');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current ethical monitoring practices');
      recommendations.push('Maintain regular ethical audits');
    }

    return recommendations;
  }

  /**
   * Quick ethical check for intervention approval
   */
  async quickCheck(narrativeId: string, interventionType: string): Promise<{
    approved: boolean;
    concerns: string[];
    confidence: number;
  }> {
    const narrative = await Narrative.findById(narrativeId);
    if (!narrative) {
      return { approved: false, concerns: ['Narrative not found'], confidence: 0 };
    }

    const concerns: string[] = [];
    let confidence = 0.9;

    // Check suppression risk
    if (interventionType === 'suppression') {
      const interventionHistory = (narrative as any).interventionHistory || [];
      if (interventionHistory.length > 3) {
        concerns.push('Narrative has high intervention history - suppression may be excessive');
        confidence -= 0.3;
      }

      const sentiment = (narrative as any).sentiment?.overall || 0;
      if (sentiment < -0.4) {
        concerns.push('Negative sentiment may indicate over-suppression risk');
        confidence -= 0.2;
      }
    }

    // Check bias
    const regionalDist = (narrative as any).regionalDistribution || [];
    if (regionalDist.length === 1) {
      concerns.push('Single-region narrative - consider broader perspective');
      confidence -= 0.1;
    }

    return {
      approved: confidence >= 0.5,
      concerns,
      confidence: Math.max(0, confidence),
    };
  }
}

export const ethicalConstraintService = new EthicalConstraintService();
