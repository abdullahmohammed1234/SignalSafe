import { Narrative } from '../models/Narrative';

export interface LongHorizonForecast {
  narrativeId: string;
  narrativeTitle: string;
  forecastHorizonDays: number;
  projectedExposureTrend: 'increasing' | 'stable' | 'decreasing';
  exposureChangePercent: number;
  survivalProbability: number;
  mutationRisk: 'low' | 'medium' | 'high' | 'critical';
  crossRegionSaturation: number;
  portfolioExposureTrend: 'increasing' | 'stable' | 'decreasing';
  systemicStressProjection: 'low' | 'moderate' | 'elevated' | 'critical';
  confidenceScore: number;
  generatedAt: Date;
  keyFactors: Array<{ factor: string; impact: number; direction: 'positive' | 'negative' }>;
}

/**
 * Long-Horizon Forecast Engine Service
 * Forecasts narrative survivability, mutation, and cross-region saturation for 7-30 day window
 */
export class LongHorizonForecastService {

  /**
   * Generate long-horizon forecast for a single narrative
   */
  async forecastNarrative(narrativeId: string, horizonDays: number = 14): Promise<LongHorizonForecast | null> {
    const narrative = await Narrative.findById(narrativeId);
    if (!narrative) return null;

    const title = (narrative as any).title || 'Untitled';
    const riskScore = (narrative as any).riskScore || 50;
    const spreadRadius = (narrative as any).spreadRadius || 1;
    const sentiment = (narrative as any).sentiment?.overall || 0;
    const velocity = (narrative as any).velocity || 0;
    const status = (narrative as any).status || 'active';

    // Calculate projected exposure trend
    const { trend: exposureTrend, changePercent } = this.calculateExposureTrend(riskScore, velocity, status, horizonDays);

    // Calculate survival probability
    const survivalProbability = this.calculateSurvivalProbability(riskScore, spreadRadius, status, horizonDays);

    // Calculate mutation risk
    const mutationRisk = this.calculateMutationRisk(narrative, horizonDays);

    // Calculate cross-region saturation
    const crossRegionSaturation = this.calculateSaturation(narrative, horizonDays);

    // Identify key factors
    const keyFactors = this.identifyKeyFactors(narrative, horizonDays);

    // Calculate portfolio exposure trend (simplified - would aggregate multiple narratives)
    const portfolioTrend = this.calculatePortfolioTrend(riskScore, exposureTrend);

    // Calculate systemic stress projection
    const systemicStress = this.calculateSystemicStress(riskScore, mutationRisk, crossRegionSaturation);

    return {
      narrativeId,
      narrativeTitle: title,
      forecastHorizonDays: horizonDays,
      projectedExposureTrend: exposureTrend,
      exposureChangePercent: Math.round(changePercent * 10) / 10,
      survivalProbability: Math.round(survivalProbability * 100) / 100,
      mutationRisk,
      crossRegionSaturation: Math.round(crossRegionSaturation * 100) / 100,
      portfolioExposureTrend: portfolioTrend,
      systemicStressProjection: systemicStress,
      confidenceScore: 0.75,
      generatedAt: new Date(),
      keyFactors,
    };
  }

  /**
   * Calculate exposure trend
   */
  private calculateExposureTrend(riskScore: number, velocity: number, status: string, horizonDays: number): 
    { trend: 'increasing' | 'stable' | 'decreasing'; changePercent: number } {
    
    let baseGrowth = (velocity / 100) * horizonDays * 0.5;
    
    // Adjust for status
    if (status === 'contained') {
      baseGrowth -= horizonDays * 1.5;
    } else if (status === 'escalating') {
      baseGrowth += horizonDays * 2;
    } else if (status === 'monitoring') {
      baseGrowth += horizonDays * 0.5;
    }

    // Risk score affects growth potential
    if (riskScore > 70) {
      baseGrowth *= 1.2;
    } else if (riskScore < 30) {
      baseGrowth *= 0.8;
    }

    const changePercent = Math.max(-50, Math.min(100, baseGrowth));

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (changePercent > 10) {
      trend = 'increasing';
    } else if (changePercent < -10) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return { trend, changePercent };
  }

  /**
   * Calculate survival probability
   */
  private calculateSurvivalProbability(riskScore: number, spreadRadius: number, status: string, horizonDays: number): number {
    // Base survival decreases with higher risk
    let baseSurvival = 1 - (riskScore / 150);

    // Spread radius affects survival (wider spread = harder to contain)
    const spreadFactor = 1 - (spreadRadius / 200);
    baseSurvival *= spreadFactor;

    // Status affects survival
    if (status === 'contained') {
      baseSurvival *= 0.3;
    } else if (status === 'escalating') {
      baseSurvival *= 0.6;
    } else if (status === 'resolved') {
      baseSurvival *= 0.1;
    }

    // Longer horizon = lower survival
    const horizonFactor = Math.pow(0.95, horizonDays / 7);
    baseSurvival *= horizonFactor;

    return Math.max(0.05, Math.min(0.95, baseSurvival));
  }

  /**
   * Calculate mutation risk
   */
  private calculateMutationRisk(narrative: any, horizonDays: number): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = (narrative as any).riskScore || 50;
    const velocity = (narrative as any).velocity || 0;
    const sentiment = (narrative as any).sentiment?.overall || 0;
    const mutationHistory = (narrative as any).mutationHistory || [];

    let riskLevel = 0;

    // High risk narratives have higher mutation potential
    if (riskScore > 70) riskLevel += 30;
    else if (riskScore > 50) riskLevel += 15;

    // High velocity increases mutation
    if (velocity > 70) riskLevel += 25;
    else if (velocity > 40) riskLevel += 10;

    // Strong sentiment (positive or negative) can mutate
    if (Math.abs(sentiment) > 0.6) riskLevel += 20;
    else if (Math.abs(sentiment) > 0.3) riskLevel += 10;

    // Past mutations indicate future mutation risk
    if (mutationHistory.length > 3) riskLevel += 25;
    else if (mutationHistory.length > 1) riskLevel += 15;

    // Longer horizon increases risk
    riskLevel += (horizonDays / 30) * 15;

    if (riskLevel >= 70) return 'critical';
    if (riskLevel >= 50) return 'high';
    if (riskLevel >= 25) return 'medium';
    return 'low';
  }

  /**
   * Calculate cross-region saturation
   */
  private calculateSaturation(narrative: any, horizonDays: number): number {
    const regionalDistribution = (narrative as any).regionalDistribution || [];
    const spreadRadius = (narrative as any).spreadRadius || 1;
    const velocity = (narrative as any).velocity || 0;

    // Current regional coverage
    const currentRegions = regionalDistribution.length;
    const maxRegions = 5; // NA, EU, APAC, LATAM, MEA
    const coverage = currentRegions / maxRegions;

    // Project growth
    const growthRate = (velocity / 100) * (horizonDays / 14);
    const projectedGrowth = Math.min(1, coverage + growthRate);

    // Weight by spread radius
    const spreadWeight = Math.min(1, spreadRadius / 50);

    return projectedGrowth * (0.5 + spreadWeight * 0.5);
  }

  /**
   * Identify key factors
   */
  private identifyKeyFactors(narrative: any, horizonDays: number): Array<{ factor: string; impact: number; direction: 'positive' | 'negative' }> {
    const factors: Array<{ factor: string; impact: number; direction: 'positive' | 'negative' }> = [];
    const riskScore = (narrative as any).riskScore || 50;
    const velocity = (narrative as any).velocity || 0;
    const sentiment = (narrative as any).sentiment?.overall || 0;
    const status = (narrative as any).status || 'active';

    if (riskScore > 60) {
      factors.push({ factor: 'Elevated risk baseline', impact: 25, direction: 'negative' });
    }

    if (velocity > 50) {
      factors.push({ factor: 'High propagation velocity', impact: 20, direction: 'negative' });
    }

    if (Math.abs(sentiment) > 0.5) {
      factors.push({ factor: `Strong ${sentiment > 0 ? 'positive' : 'negative'} sentiment`, impact: 15, direction: sentiment > 0 ? 'positive' : 'negative' });
    }

    if (status === 'escalating') {
      factors.push({ factor: 'Currently escalating', impact: 30, direction: 'negative' });
    }

    if ((narrative as any).interventionHistory?.length > 0) {
      factors.push({ factor: 'Previous interventions', impact: 10, direction: 'positive' });
    }

    const regionalDist = (narrative as any).regionalDistribution || [];
    if (regionalDist.length > 2) {
      factors.push({ factor: 'Multi-region presence', impact: 15, direction: 'negative' });
    }

    return factors.slice(0, 5);
  }

  /**
   * Calculate portfolio trend (simplified)
   */
  private calculatePortfolioTrend(narrativeRisk: number, exposureTrend: string): 'increasing' | 'stable' | 'decreasing' {
    if (narrativeRisk > 60 && exposureTrend === 'increasing') {
      return 'increasing';
    } else if (narrativeRisk < 40 || exposureTrend === 'decreasing') {
      return 'decreasing';
    }
    return 'stable';
  }

  /**
   * Calculate systemic stress projection
   */
  private calculateSystemicStress(riskScore: number, mutationRisk: string, saturation: number): 'low' | 'moderate' | 'elevated' | 'critical' {
    let stressLevel = riskScore;

    // Add mutation risk weight
    if (mutationRisk === 'critical') stressLevel += 25;
    else if (mutationRisk === 'high') stressLevel += 15;
    else if (mutationRisk === 'medium') stressLevel += 5;

    // Add saturation weight
    stressLevel += saturation * 20;

    if (stressLevel >= 80) return 'critical';
    if (stressLevel >= 60) return 'elevated';
    if (stressLevel >= 40) return 'moderate';
    return 'low';
  }

  /**
   * Generate bulk forecasts for all active narratives
   */
  async generateBulkForecasts(horizonDays: number = 14): Promise<LongHorizonForecast[]> {
    const narratives = await Narrative.find({ 
      isActive: true,
      status: { $in: ['active', 'monitoring', 'escalating'] }
    });

    const forecasts: LongHorizonForecast[] = [];

    for (const narrative of narratives) {
      const forecast = await this.forecastNarrative(narrative._id.toString(), horizonDays);
      if (forecast) {
        forecasts.push(forecast);
      }
    }

    return forecasts;
  }
}

export const longHorizonForecastService = new LongHorizonForecastService();
