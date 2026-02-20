// ============== TYPES ==============
export interface ConfidenceComponents {
  calibrationScore: number;
  driftLevel: number;
  ensembleVariance: number;
  agentReliability: number;
  dataCompleteness: number;
}

export interface ConfidenceIndexResult {
  strategicConfidence: number;
  components: ConfidenceComponents;
  breakdown: {
    calibration: number;
    stability: number;
    variance: number;
    reliability: number;
  };
  recommendations: string[];
  calculatedAt: Date;
}

// ============== SERVICE ==============
export class ConfidenceIndexService {

  private readonly WEIGHTS = {
    calibration: 0.30,
    stability: 0.25,
    variance: 0.20,
    reliability: 0.25,
  };

  /**
   * Calculate strategic confidence index (0-100)
   */
  async calculateConfidenceIndex(): Promise<ConfidenceIndexResult> {
    // Get component scores (simulated - would query actual services in production)
    const components = await this.gatherComponents();
    
    // Calculate weighted composite
    const breakdown = {
      calibration: components.calibrationScore,
      stability: 1 - components.driftLevel, // Lower drift = higher stability
      variance: 1 - components.ensembleVariance, // Lower variance = higher confidence
      reliability: components.agentReliability,
    };
    
    const strategicConfidence = Math.round(
      (breakdown.calibration * this.WEIGHTS.calibration +
       breakdown.stability * this.WEIGHTS.stability +
       breakdown.variance * this.WEIGHTS.variance +
       breakdown.reliability * this.WEIGHTS.reliability) * 100
    );
    
    const recommendations = this.generateRecommendations(components, strategicConfidence);
    
    return {
      strategicConfidence,
      components,
      breakdown,
      recommendations,
      calculatedAt: new Date(),
    };
  }

  /**
   * Gather all confidence components
   */
  private async gatherComponents(): Promise<ConfidenceComponents> {
    // In production, these would query actual services
    // For now, simulate realistic values
    
    const calibrationScore = 0.75 + Math.random() * 0.2;
    const driftLevel = Math.random() * 0.4;
    const ensembleVariance = Math.random() * 0.3;
    const agentReliability = 0.8 + Math.random() * 0.15;
    const dataCompleteness = 0.7 + Math.random() * 0.25;
    
    return {
      calibrationScore: Math.round(calibrationScore * 100) / 100,
      driftLevel: Math.round(driftLevel * 100) / 100,
      ensembleVariance: Math.round(ensembleVariance * 100) / 100,
      agentReliability: Math.round(agentReliability * 100) / 100,
      dataCompleteness: Math.round(dataCompleteness * 100) / 100,
    };
  }

  /**
   * Generate recommendations based on confidence components
   */
  private generateRecommendations(components: ConfidenceComponents, confidence: number): string[] {
    const recommendations: string[] = [];
    
    if (components.calibrationScore < 0.7) {
      recommendations.push('Model calibration needs attention - consider recalibration');
    }
    
    if (components.driftLevel > 0.3) {
      recommendations.push('Significant drift detected - trigger model retraining');
    }
    
    if (components.ensembleVariance > 0.25) {
      recommendations.push('High ensemble variance - review model diversity');
    }
    
    if (components.agentReliability < 0.8) {
      recommendations.push('Agent reliability below threshold - investigate agent performance');
    }
    
    if (components.dataCompleteness < 0.75) {
      recommendations.push('Data completeness issues - ensure adequate data coverage');
    }
    
    if (confidence >= 80) {
      recommendations.push('System operating at high confidence - maintain current configuration');
    } else if (confidence >= 60) {
      recommendations.push('Moderate confidence - continue monitoring and optimization');
    } else {
      recommendations.push('Low confidence - immediate attention required');
    }
    
    return recommendations;
  }

  /**
   * Get confidence trend
   */
  async getConfidenceTrend(days = 7): Promise<{
    dates: string[];
    values: number[];
  }> {
    // Simulate historical data
    const dates: string[] = [];
    const values: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Simulate confidence with some variance
      const baseValue = 65 + Math.random() * 20;
      values.push(Math.round(baseValue));
    }
    
    return { dates, values };
  }

  /**
   * Get confidence by category
   */
  async getConfidenceByCategory(): Promise<Record<string, number>> {
    return {
      riskAssessment: 70 + Math.random() * 25,
      driftDetection: 75 + Math.random() * 20,
      forecasting: 60 + Math.random() * 25,
      recommendation: 65 + Math.random() * 25,
      overall: 70 + Math.random() * 20,
    };
  }

  /**
   * Get confidence thresholds
   */
  getThresholds(): { critical: number; warning: number; healthy: number } {
    return {
      critical: 40,
      warning: 60,
      healthy: 80,
    };
  }

  /**
   * Get confidence status description
   */
  getStatusDescription(confidence: number): string {
    if (confidence >= 80) return 'Excellent - System operating at peak capability';
    if (confidence >= 65) return 'Good - System performing within parameters';
    if (confidence >= 50) return 'Moderate - Some degradation detected';
    if (confidence >= 35) return 'Warning - Significant confidence loss';
    return 'Critical - Immediate intervention required';
  }
}

export const confidenceIndex = new ConfidenceIndexService();
