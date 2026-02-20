import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface PolicySimulationInput {
  policyChanges: {
    parameter: string;
    currentValue: number;
    proposedValue: number;
  }[];
  targetNarratives?: string[];
  simulationHorizon: number; // days
}

export interface PolicySimulationResult {
  simulationId: string;
  baselineRisk: number;
  simulatedRisk: number;
  spreadChange: number;
  escalationProbabilityChange: number;
  complianceScore: number;
  affectedNarratives: string[];
  projectedOutcomes: {
    day: number;
    risk: number;
    spread: number;
    sentiment: number;
  }[];
  warnings: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface PolicyConfiguration {
  policyId: string;
  name: string;
  description: string;
  parameters: {
    suppressionThreshold: number;
    moderationIntensity: number;
    containmentDelay: number;
    escalationSensitivity: number;
    autonomousActionEnabled: boolean;
    humanApprovalRequired: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyConfigurationDocument extends PolicyConfiguration, Document {}

// ============== SCHEMA ==============
const PolicyConfigurationSchema = new Schema<PolicyConfigurationDocument>(
  {
    policyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    parameters: {
      suppressionThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
      moderationIntensity: { type: Number, default: 0.5, min: 0, max: 1 },
      containmentDelay: { type: Number, default: 24, min: 0 }, // hours
      escalationSensitivity: { type: Number, default: 0.6, min: 0, max: 1 },
      autonomousActionEnabled: { type: Boolean, default: false },
      humanApprovalRequired: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ============== MODEL ==============
export const PolicyConfigurationModel = mongoose.model<PolicyConfigurationDocument>(
  'PolicyConfiguration',
  PolicyConfigurationSchema
);

// ============== SERVICE ==============
export class PolicySimulationService {
  private readonly SIMULATION_STEPS = 30;
  private readonly RISK_INERTIA = 0.85;
  private readonly SPREAD_MOMENTUM = 0.9;

  // ============== PRIVATE HELPER METHODS ==============

  private async getBaselineRisk(narrativeIds?: string[]): Promise<number> {
    return 0.45 + Math.random() * 0.2;
  }

  private calculateParameterImpacts(
    changes: { parameter: string; currentValue: number; proposedValue: number }[]
  ): Record<string, number> {
    const impacts: Record<string, number> = {};

    changes.forEach((change) => {
      const delta = change.proposedValue - change.currentValue;
      
      switch (change.parameter) {
        case 'suppressionThreshold':
          impacts.suppressionImpact = -delta * 0.5;
          break;
        case 'moderationIntensity':
          impacts.moderationImpact = -delta * 0.4;
          break;
        case 'containmentDelay':
          impacts.containmentImpact = delta * 0.01;
          break;
        case 'escalationSensitivity':
          impacts.escalationImpact = -delta * 0.3;
          break;
        case 'autonomousActionEnabled':
          impacts.autonomousImpact = change.proposedValue ? -0.15 : 0.15;
          break;
        default:
          impacts[change.parameter] = delta * 0.1;
      }
    });

    return impacts;
  }

  private projectOutcomes(
    baselineRisk: number,
    impacts: Record<string, number>,
    horizon: number
  ): { day: number; risk: number; spread: number; sentiment: number }[] {
    const outcomes: { day: number; risk: number; spread: number; sentiment: number }[] = [];
    const totalImpact = Object.values(impacts).reduce((sum, v) => sum + v, 0);
    const trendFactor = Math.min(1, Math.abs(totalImpact) * 2);
    
    let currentRisk = baselineRisk;
    let currentSpread = 0.5 + Math.random() * 0.2;
    let currentSentiment = 0.5 + Math.random() * 0.2;

    for (let day = 1; day <= horizon; day++) {
      const dailyImpact = totalImpact * (1 - Math.exp(-day * trendFactor / 10));
      currentRisk = currentRisk * this.RISK_INERTIA + (baselineRisk + dailyImpact) * (1 - this.RISK_INERTIA);
      currentRisk = Math.max(0, Math.min(1, currentRisk));

      currentSpread = currentSpread * this.SPREAD_MOMENTUM + (currentRisk * 0.5 + 0.3) * (1 - this.SPREAD_MOMENTUM);
      currentSpread = Math.max(0, Math.min(1, currentSpread));

      currentSentiment = 1 - currentRisk + (Math.random() - 0.5) * 0.1;
      currentSentiment = Math.max(0, Math.min(1, currentSentiment));

      outcomes.push({
        day,
        risk: Math.round(currentRisk * 100) / 100,
        spread: Math.round(currentSpread * 100) / 100,
        sentiment: Math.round(currentSentiment * 100) / 100,
      });
    }

    return outcomes;
  }

  private calculateEscalationChange(baselineRisk: number, simulatedRisk: number): number {
    const baselineEscalation = 1 / (1 + Math.exp(-10 * (baselineRisk - 0.5)));
    const simulatedEscalation = 1 / (1 + Math.exp(-10 * (simulatedRisk - 0.5)));
    return Math.round((simulatedEscalation - baselineEscalation) * 100) / 100;
  }

  private calculateComplianceScore(
    changes: { parameter: string; currentValue: number; proposedValue: number }[],
    impacts: Record<string, number>
  ): number {
    let score = 1.0;
    changes.forEach((change) => {
      const changeMagnitude = Math.abs(change.proposedValue - change.currentValue);
      if (changeMagnitude > 0.3) score -= 0.1;
    });
    const positiveImpacts = Object.values(impacts).filter((v) => v > 0).length;
    const negativeImpacts = Object.values(impacts).filter((v) => v < 0).length;
    if (positiveImpacts > 0 && negativeImpacts > 0) score -= 0.15;
    return Math.max(0, Math.round(score * 100) / 100);
  }

  private generateWarnings(impacts: Record<string, number>, simulatedRisk: number, baselineRisk: number): string[] {
    const warnings: string[] = [];
    if (simulatedRisk > 0.8) warnings.push('CRITICAL: Simulated risk exceeds critical threshold');
    if (simulatedRisk > baselineRisk * 1.2) warnings.push('WARNING: Policy changes may increase overall risk');
    if (impacts.containmentImpact && impacts.containmentImpact > 0) warnings.push('CAUTION: Increased containment delay may worsen outcomes');
    if (Object.values(impacts).some((v) => Math.abs(v) > 0.3)) warnings.push('WARNING: Large policy changes detected - consider phased rollout');
    return warnings;
  }

  private generateRecommendations(impacts: Record<string, number>, simulatedRisk: number, baselineRisk: number): string[] {
    const recommendations: string[] = [];
    if (simulatedRisk < baselineRisk) recommendations.push('Policy changes show positive impact - consider gradual implementation');
    if (impacts.suppressionImpact && impacts.suppressionImpact < -0.1) recommendations.push('Consider monitoring for suppression backlash effects');
    if (impacts.moderationImpact && impacts.moderationImpact < -0.1) recommendations.push('Ensure moderation policies align with community guidelines');
    if (simulatedRisk > 0.5) recommendations.push('Recommend human oversight during implementation');
    if (recommendations.length === 0) recommendations.push('Policy changes appear neutral - maintain monitoring');
    return recommendations;
  }

  // ============== PUBLIC METHODS ==============

  async simulate(input: PolicySimulationInput): Promise<PolicySimulationResult> {
    const simulationId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baselineRisk = await this.getBaselineRisk(input.targetNarratives);
    const impacts = this.calculateParameterImpacts(input.policyChanges);
    const projectedOutcomes = this.projectOutcomes(baselineRisk, impacts, input.simulationHorizon);
    const simulatedRisk = projectedOutcomes[projectedOutcomes.length - 1].risk;
    const spreadChange = simulatedRisk - baselineRisk;
    const escalationProbabilityChange = this.calculateEscalationChange(baselineRisk, simulatedRisk);
    const complianceScore = this.calculateComplianceScore(input.policyChanges, impacts);
    const warnings = this.generateWarnings(impacts, simulatedRisk, baselineRisk);
    const recommendations = this.generateRecommendations(impacts, simulatedRisk, baselineRisk);

    return {
      simulationId,
      baselineRisk,
      simulatedRisk,
      spreadChange,
      escalationProbabilityChange,
      complianceScore,
      affectedNarratives: input.targetNarratives || ['all'],
      projectedOutcomes,
      warnings,
      recommendations,
      createdAt: new Date(),
    };
  }

  async savePolicyConfiguration(config: Omit<PolicyConfiguration, 'policyId' | 'createdAt' | 'updatedAt'>): Promise<PolicyConfigurationDocument> {
    const policyId = `POL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const configDoc = new PolicyConfigurationModel({ ...config, policyId });
    return await configDoc.save();
  }

  async getPolicyConfiguration(policyId: string): Promise<PolicyConfigurationDocument | null> {
    return await PolicyConfigurationModel.findOne({ policyId });
  }

  async getActivePolicy(): Promise<PolicyConfigurationDocument | null> {
    return await PolicyConfigurationModel.findOne({ isActive: true });
  }

  async listPolicies(): Promise<PolicyConfigurationDocument[]> {
    return await PolicyConfigurationModel.find().sort({ createdAt: -1 });
  }

  async activatePolicy(policyId: string): Promise<PolicyConfigurationDocument | null> {
    await PolicyConfigurationModel.updateMany({ isActive: true }, { isActive: false });
    return await PolicyConfigurationModel.findOneAndUpdate({ policyId }, { isActive: true }, { new: true });
  }

  getSimulationTemplates(): { name: string; description: string; changes: { parameter: string; currentValue: number; proposedValue: number }[] }[] {
    return [
      {
        name: 'Aggressive Suppression',
        description: 'Lower suppression threshold and increase moderation intensity',
        changes: [
          { parameter: 'suppressionThreshold', currentValue: 0.7, proposedValue: 0.5 },
          { parameter: 'moderationIntensity', currentValue: 0.5, proposedValue: 0.8 },
        ],
      },
      {
        name: 'Balanced Response',
        description: 'Moderate changes to suppression and escalation sensitivity',
        changes: [
          { parameter: 'suppressionThreshold', currentValue: 0.7, proposedValue: 0.6 },
          { parameter: 'escalationSensitivity', currentValue: 0.6, proposedValue: 0.75 },
        ],
      },
      {
        name: 'Cautious Approach',
        description: 'Minimal changes with human oversight',
        changes: [
          { parameter: 'containmentDelay', currentValue: 24, proposedValue: 12 },
          { parameter: 'humanApprovalRequired', currentValue: 1, proposedValue: 1 },
        ],
      },
      {
        name: 'Enable Autonomy',
        description: 'Allow autonomous action with safeguards',
        changes: [
          { parameter: 'autonomousActionEnabled', currentValue: 0, proposedValue: 1 },
          { parameter: 'humanApprovalRequired', currentValue: 1, proposedValue: 0 },
        ],
      },
    ];
  }

  async compareScenarios(scenarios: PolicySimulationInput[]): Promise<{
    simulations: PolicySimulationResult[];
    comparison: { bestForRisk: string; bestForCompliance: string; recommended: string };
  }> {
    const simulations = await Promise.all(scenarios.map((s) => this.simulate(s)));
    const sortedByRisk = [...simulations].sort((a, b) => a.simulatedRisk - b.simulatedRisk);
    const sortedByCompliance = [...simulations].sort((a, b) => b.complianceScore - a.complianceScore);
    const scored = simulations.map((s, i) => ({ index: i, score: (1 - s.simulatedRisk) * 0.5 + s.complianceScore * 0.5 }));
    const best = scored.sort((a, b) => b.score - a.score)[0];

    return {
      simulations,
      comparison: {
        bestForRisk: sortedByRisk[0].simulationId,
        bestForCompliance: sortedByCompliance[0].simulationId,
        recommended: simulations[best.index].simulationId,
      },
    };
  }
}

export const policySimulation = new PolicySimulationService();
