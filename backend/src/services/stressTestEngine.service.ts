import { Narrative } from '../models/Narrative';

export interface StressTestResult {
  id: string;
  shockType: 'regional_surge' | 'coordinated_amplification' | 'policy_shift' | 'data_blackout' | 'geopolitical_spike';
  shockDescription: string;
  systemRecoveryTime: number; // hours
  exposureIncrease: number; // percent
  resilienceScore: number; // 0-100
  affectedNarratives: string[];
  cascadingEffects: string[];
  recommendations: string[];
  testedAt: Date;
}

export interface StressTestSummary {
  overallResilience: number;
  weakestLink: string;
  highestRiskShock: string;
  recommendations: string[];
}

/**
 * Macro Scenario Stress Testing Engine
 * Runs systemic shocks to evaluate system resilience
 */
export class StressTestEngineService {

  /**
   * Run a specific stress test
   */
  async runStressTest(shockType: StressTestResult['shockType']): Promise<StressTestResult> {
    const narratives = await Narrative.find({ isActive: true });
    
    let shockDescription = '';
    let impactMultiplier = 1;
    let affectedCount = 0;
    let recoveryTime = 0;
    let exposureIncrease = 0;
    const cascadingEffects: string[] = [];

    switch (shockType) {
      case 'regional_surge':
        shockDescription = 'Sudden regional amplification surge in primary markets';
        impactMultiplier = 1.8;
        affectedCount = Math.ceil(narratives.length * 0.4);
        recoveryTime = 48;
        exposureIncrease = 35;
        cascadingEffects.push('Sentiment spike', 'Velocity increase', 'Risk score elevation');
        break;

      case 'coordinated_amplification':
        shockDescription = 'Coordinated amplification attack across multiple narratives';
        impactMultiplier = 2.2;
        affectedCount = Math.ceil(narratives.length * 0.6);
        recoveryTime = 72;
        exposureIncrease = 55;
        cascadingEffects.push('Multi-narrative resonance', 'Cross-region spread', 'Sentiment polarization');
        break;

      case 'policy_shift':
        shockDescription = 'Major policy shift affecting narrative landscape';
        impactMultiplier = 1.5;
        affectedCount = Math.ceil(narratives.length * 0.5);
        recoveryTime = 120;
        exposureIncrease = 25;
        cascadingEffects.push('Narrative redirection', 'Audience realignment', 'New opposition emergence');
        break;

      case 'data_blackout':
        shockDescription = 'Data ingestion blackout causing monitoring gaps';
        impactMultiplier = 1.3;
        affectedCount = narratives.length;
        recoveryTime = 24;
        exposureIncrease = 15;
        cascadingEffects.push('Detection delay', 'Response lag', 'Confidence reduction');
        break;

      case 'geopolitical_spike':
        shockDescription = 'External geopolitical spike creating new narrative pressure';
        impactMultiplier = 1.9;
        affectedCount = Math.ceil(narratives.length * 0.35);
        recoveryTime = 96;
        exposureIncrease = 45;
        cascadingEffects.push('New narrative emergence', 'Regional fragmentation', 'Institutional impact');
        break;
    }

    // Calculate resilience score
    const resilienceScore = this.calculateResilienceScore(impactMultiplier, affectedCount, narratives.length, shockType);

    // Get affected narrative IDs
    const affectedNarratives = narratives
      .slice(0, affectedCount)
      .map(n => n._id.toString());

    // Generate recommendations
    const recommendations = this.generateRecommendations(shockType, resilienceScore, affectedCount);

    return {
      id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shockType,
      shockDescription,
      systemRecoveryTime: recoveryTime,
      exposureIncrease,
      resilienceScore,
      affectedNarratives,
      cascadingEffects,
      recommendations,
      testedAt: new Date(),
    };
  }

  /**
   * Calculate resilience score based on shock parameters
   */
  private calculateResilienceScore(
    impactMultiplier: number, 
    affectedCount: number, 
    totalCount: number,
    shockType: string
  ): number {
    const affectedRatio = affectedCount / Math.max(1, totalCount);
    
    // Base resilience varies by shock type
    let baseResilience = 70;
    switch (shockType) {
      case 'data_blackout':
        baseResilience = 85; // System can handle monitoring gaps
        break;
      case 'regional_surge':
        baseResilience = 65;
        break;
      case 'coordinated_amplification':
        baseResilience = 50; // Most challenging
        break;
      case 'policy_shift':
        baseResilience = 60;
        break;
      case 'geopolitical_spike':
        baseResilience = 55;
        break;
    }

    // Adjust for impact
    const impactPenalty = (impactMultiplier - 1) * 30;
    const affectedPenalty = affectedRatio * 20;

    const resilience = Math.max(10, Math.min(100, baseResilience - impactPenalty - affectedPenalty));
    return Math.round(resilience * 10) / 10;
  }

  /**
   * Generate recommendations based on stress test results
   */
  private generateRecommendations(
    shockType: string, 
    resilienceScore: number, 
    affectedCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (resilienceScore < 40) {
      recommendations.push('CRITICAL: Immediate resilience enhancement required');
    }

    switch (shockType) {
      case 'regional_surge':
        recommendations.push('Deploy regional containment teams');
        recommendations.push('Increase cross-region monitoring');
        if (resilienceScore < 60) {
          recommendations.push('Activate emergency response protocol');
        }
        break;

      case 'coordinated_amplification':
        recommendations.push('Implement coordinated defense strategy');
        recommendations.push('Engage platform-level interventions');
        recommendations.push('Prepare legal and policy responses');
        if (resilienceScore < 50) {
          recommendations.push('Escalate to executive leadership');
        }
        break;

      case 'policy_shift':
        recommendations.push('Conduct policy impact assessment');
        recommendations.push('Update narrative tracking parameters');
        recommendations.push('Adapt intervention strategies');
        break;

      case 'data_blackout':
        recommendations.push('Activate backup data sources');
        recommendations.push('Implement manual monitoring protocols');
        recommendations.push('Prepare for delayed response scenarios');
        break;

      case 'geopolitical_spike':
        recommendations.push('Engage diplomatic channels');
        recommendations.push('Prepare crisis communications');
        recommendations.push('Monitor for secondary effects');
        break;
    }

    // Add general recommendations
    if (affectedCount > 3) {
      recommendations.push(`Prioritize ${Math.ceil(affectedCount / 2)} highest-risk narratives`);
    }

    return recommendations;
  }

  /**
   * Run comprehensive stress test suite
   */
  async runFullStressTestSuite(): Promise<{
    results: StressTestResult[];
    summary: StressTestSummary;
  }> {
    const shockTypes: StressTestResult['shockType'][] = [
      'regional_surge',
      'coordinated_amplification',
      'policy_shift',
      'data_blackout',
      'geopolitical_spike',
    ];

    const results: StressTestResult[] = [];

    for (const shockType of shockTypes) {
      const result = await this.runStressTest(shockType);
      results.push(result);
    }

    // Calculate summary
    const avgResilience = results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length;
    
    const weakestResult = results.reduce((min, r) => 
      r.resilienceScore < min.resilienceScore ? r : min, results[0]);
    
    const highestRiskResult = results.reduce((max, r) => 
      r.exposureIncrease > max.exposureIncrease ? r : max, results[0]);

    const summary: StressTestSummary = {
      overallResilience: Math.round(avgResilience * 10) / 10,
      weakestLink: weakestResult.shockType,
      highestRiskShock: highestRiskResult.shockType,
      recommendations: [
        'Address weakest resilience area',
        'Review intervention protocols',
        'Enhance monitoring capabilities',
      ],
    };

    return { results, summary };
  }

  /**
   * Get resilience scorecard
   */
  async getResilienceScorecard(): Promise<{
    overall: number;
    categories: Record<string, number>;
    trend: string;
  }> {
    const { results } = await this.runFullStressTestSuite();

    const categories: Record<string, number> = {};
    results.forEach(r => {
      categories[r.shockType] = r.resilienceScore;
    });

    const overall = results.reduce((sum, r) => sum + r.resilienceScore, 0) / results.length;

    return {
      overall: Math.round(overall * 10) / 10,
      categories,
      trend: overall > 60 ? 'positive' : overall > 40 ? 'neutral' : 'negative',
    };
  }
}

export const stressTestEngineService = new StressTestEngineService();
