import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface IAutonomousAction {
  actionId: string;
  triggerCondition: {
    type: string;
    threshold: number;
    narrativeId?: string;
    clusterId?: string;
  };
  predictedImpact: {
    riskReduction: number;
    spreadReduction: number;
    sentimentShift: number;
  };
  confidenceScore: number;
  policyApproved: boolean;
  humanOverrideRequired: boolean;
  executionStatus: 'queued' | 'approved' | 'rejected' | 'executed' | 'failed';
  recommendedActions: string[];
  riskAssessment: {
    currentRisk: number;
    projectedRisk: number;
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface AutonomousActionDocument extends IAutonomousAction, Document {}

export interface EscalationTrigger {
  type: 'risk_threshold' | 'drift_detected' | 'sentiment_spike' | 'spread_acceleration' | 'conflict_emergence';
  threshold: number;
  currentValue: number;
  triggered: boolean;
}

export interface ActionRecommendation {
  action: string;
  priority: number;
  rationale: string;
  estimatedImpact: number;
  risks: string[];
}

// ============== SCHEMA ==============
const AutonomousActionSchema = new Schema<AutonomousActionDocument>(
  {
    actionId: { type: String, required: true, unique: true },
    triggerCondition: {
      type: { type: String, required: true },
      threshold: { type: Number, required: true },
      narrativeId: String,
      clusterId: String,
    },
    predictedImpact: {
      riskReduction: { type: Number, required: true },
      spreadReduction: { type: Number, required: true },
      sentimentShift: { type: Number, required: true },
    },
    confidenceScore: { type: Number, required: true },
    policyApproved: { type: Boolean, default: false },
    humanOverrideRequired: { type: Boolean, default: true },
    executionStatus: {
      type: String,
      enum: ['queued', 'approved', 'rejected', 'executed', 'failed'],
      default: 'queued',
    },
    recommendedActions: [{ type: String }],
    riskAssessment: {
      currentRisk: { type: Number, required: true },
      projectedRisk: { type: Number, required: true },
      confidence: { type: Number, required: true },
    },
    executedAt: Date,
    approvedBy: String,
    rejectionReason: String,
  },
  { timestamps: true }
);

AutonomousActionSchema.index({ executionStatus: 1, createdAt: -1 });
AutonomousActionSchema.index({ triggerCondition: 1 });

// ============== MODEL ==============
export const AutonomousAction = mongoose.model<AutonomousActionDocument>(
  'AutonomousAction',
  AutonomousActionSchema
);

// ============== SERVICE ==============
export class AutonomousOrchestratorService {
  private readonly ESCALATION_THRESHOLDS = {
    risk_threshold: 0.75,
    drift_detected: 0.3,
    sentiment_spike: 0.8,
    spread_acceleration: 0.7,
    conflict_emergence: 0.65,
  };

  private readonly ACTION_TEMPLATES = [
    {
      action: 'INCREASE_MODERATION',
      priority: 1,
      rationale: 'Reduce harmful content spread through enhanced moderation',
      estimatedImpact: 0.4,
      risks: ['Over-suppression', 'False positives'],
    },
    {
      action: 'DEPLOY_COUNTER_NARRATIVE',
      priority: 2,
      rationale: 'Introduce balanced perspective to counter misinformation',
      estimatedImpact: 0.35,
      risks: ['Backfire effect', 'Limited reach'],
    },
    {
      action: 'ESCALATE_TO_HUMAN_REVIEW',
      priority: 3,
      rationale: 'Flag for expert human assessment',
      estimatedImpact: 0.5,
      risks: ['Delayed response'],
    },
    {
      action: 'ACTIVATE_CONTAINMENT_PROTOCOL',
      priority: 1,
      rationale: 'Isolate high-risk cluster from main narrative flow',
      estimatedImpact: 0.6,
      risks: ['Free speech concerns', 'Transparency issues'],
    },
    {
      action: 'INJECT_CONTEXTUAL_INFORMATION',
      priority: 2,
      rationale: 'Provide factual context to neutralize misinformation',
      estimatedImpact: 0.3,
      risks: ['Perceived bias'],
    },
    {
      action: 'REDUCE_ALGORITHMIC_VISIBILITY',
      priority: 2,
      rationale: 'Lower algorithmic amplification of risky content',
      estimatedImpact: 0.45,
      risks: ['Filter bubble concerns'],
    },
    {
      action: 'ENGAGE_STAKEHOLDERS',
      priority: 3,
      rationale: 'Notify relevant stakeholders for coordinated response',
      estimatedImpact: 0.4,
      risks: ['Coordination overhead'],
    },
  ];

  /**
   * Detect if escalation threshold has been crossed
   */
  async detectEscalation(
    riskData: {
      currentRisk: number;
      driftLevel: number;
      sentimentIntensity: number;
      spreadVelocity: number;
      conflictScore?: number;
    },
    narrativeId?: string,
    clusterId?: string
  ): Promise<EscalationTrigger | null> {
    const triggers: EscalationTrigger[] = [];

    if (riskData.currentRisk >= this.ESCALATION_THRESHOLDS.risk_threshold) {
      triggers.push({
        type: 'risk_threshold',
        threshold: this.ESCALATION_THRESHOLDS.risk_threshold,
        currentValue: riskData.currentRisk,
        triggered: true,
      });
    }

    if (riskData.driftLevel >= this.ESCALATION_THRESHOLDS.drift_detected) {
      triggers.push({
        type: 'drift_detected',
        threshold: this.ESCALATION_THRESHOLDS.drift_detected,
        currentValue: riskData.driftLevel,
        triggered: true,
      });
    }

    if (riskData.sentimentIntensity >= this.ESCALATION_THRESHOLDS.sentiment_spike) {
      triggers.push({
        type: 'sentiment_spike',
        threshold: this.ESCALATION_THRESHOLDS.sentiment_spike,
        currentValue: riskData.sentimentIntensity,
        triggered: true,
      });
    }

    if (riskData.spreadVelocity >= this.ESCALATION_THRESHOLDS.spread_acceleration) {
      triggers.push({
        type: 'spread_acceleration',
        threshold: this.ESCALATION_THRESHOLDS.spread_acceleration,
        currentValue: riskData.spreadVelocity,
        triggered: true,
      });
    }

    if (riskData.conflictScore && riskData.conflictScore >= this.ESCALATION_THRESHOLDS.conflict_emergence) {
      triggers.push({
        type: 'conflict_emergence',
        threshold: this.ESCALATION_THRESHOLDS.conflict_emergence,
        currentValue: riskData.conflictScore,
        triggered: true,
      });
    }

    // Return the highest priority triggered
    if (triggers.length > 0) {
      return triggers.sort((a, b) => b.currentValue - a.currentValue)[0];
    }

    return null;
  }

  /**
   * Generate ranked action recommendations based on current state
   */
  generateRankedActions(
    riskData: {
      currentRisk: number;
      driftLevel: number;
      sentimentIntensity: number;
      spreadVelocity: number;
      conflictScore?: number;
      narrativeType?: string;
    },
    policyConstraints: string[] = []
  ): ActionRecommendation[] {
    const scoredActions = this.ACTION_TEMPLATES.map((action) => {
      let adjustedPriority = action.priority;
      let rationale = action.rationale;
      const risks = [...action.risks];

      // Adjust based on risk level
      if (riskData.currentRisk > 0.8) {
        adjustedPriority -= 1; // Higher priority
        rationale += ' (High-risk situation requires immediate action)';
      }

      // Adjust based on narrative type
      if (riskData.narrativeType === 'misinformation') {
        if (action.action === 'INCREASE_MODERATION' || action.action === 'DEPLOY_COUNTER_NARRATIVE') {
          adjustedPriority -= 1;
        }
      }

      // Filter by policy constraints
      if (policyConstraints.includes('no_moderation') && action.action === 'INCREASE_MODERATION') {
        adjustedPriority += 10;
        risks.push('Policy violation: Moderation restricted');
      }

      if (policyConstraints.includes('no_containment') && action.action === 'ACTIVATE_CONTAINMENT_PROTOCOL') {
        adjustedPriority += 10;
        risks.push('Policy violation: Containment not authorized');
      }

      return {
        ...action,
        priority: adjustedPriority,
        rationale,
        risks,
        estimatedImpact: action.estimatedImpact * (1 - riskData.driftLevel * 0.2),
      };
    });

    return scoredActions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate risk reduction impact of proposed action
   */
  evaluateRiskReduction(
    action: string,
    currentRisk: number,
    confidenceScore: number
  ): { projectedRisk: number; confidence: number } {
    const impactFactors: Record<string, number> = {
      INCREASE_MODERATION: 0.4,
      DEPLOY_COUNTER_NARRATIVE: 0.35,
      ESCALATE_TO_HUMAN_REVIEW: 0.2,
      ACTIVATE_CONTAINMENT_PROTOCOL: 0.5,
      INJECT_CONTEXTUAL_INFORMATION: 0.3,
      REDUCE_ALGORITHMIC_VISIBILITY: 0.45,
      ENGAGE_STAKEHOLDERS: 0.25,
    };

    const impact = impactFactors[action] || 0.3;
    const projectedRisk = Math.max(0, currentRisk - (impact * confidenceScore));

    return {
      projectedRisk,
      confidence: confidenceScore * (0.8 + Math.random() * 0.2),
    };
  }

  /**
   * Check policy constraints for an action
   */
  checkPolicyConstraints(
    action: string,
    policyConfig: {
      allowAutonomousActions: boolean;
      requireHumanApproval: boolean;
      allowedActions: string[];
      restrictedActions: string[];
    }
  ): { approved: boolean; requiresOverride: boolean; reason?: string } {
    if (!policyConfig.allowAutonomousActions) {
      return {
        approved: false,
        requiresOverride: true,
        reason: 'Autonomous actions disabled by policy',
      };
    }

    if (policyConfig.restrictedActions.includes(action)) {
      return {
        approved: false,
        requiresOverride: true,
        reason: `Action ${action} is restricted by policy`,
      };
    }

    if (policyConfig.allowedActions.length > 0 && !policyConfig.allowedActions.includes(action)) {
      return {
        approved: false,
        requiresOverride: true,
        reason: `Action ${action} not in allowed actions list`,
      };
    }

    if (policyConfig.requireHumanApproval) {
      return {
        approved: false,
        requiresOverride: true,
        reason: 'Human approval required by policy',
      };
    }

    return { approved: true, requiresOverride: false };
  }

  /**
   * Queue a recommended intervention action
   */
  async queueRecommendedIntervention(
    trigger: EscalationTrigger,
    actions: ActionRecommendation[],
    riskData: {
      currentRisk: number;
      driftLevel: number;
      sentimentIntensity: number;
      spreadVelocity: number;
    },
    policyConfig: {
      allowAutonomousActions: boolean;
      requireHumanApproval: boolean;
      allowedActions: string[];
      restrictedActions: string[];
    }
  ): Promise<AutonomousActionDocument> {
    const primaryAction = actions[0];
    const { projectedRisk, confidence } = this.evaluateRiskReduction(
      primaryAction.action,
      riskData.currentRisk,
      0.85
    );

    const policyCheck = this.checkPolicyConstraints(primaryAction.action, policyConfig);

    const actionId = `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const autonomousAction = new AutonomousAction({
      actionId,
      triggerCondition: {
        type: trigger.type,
        threshold: trigger.threshold,
      },
      predictedImpact: {
        riskReduction: riskData.currentRisk - projectedRisk,
        spreadReduction: primaryAction.estimatedImpact * 0.5,
        sentimentShift: riskData.sentimentIntensity * 0.3,
      },
      confidenceScore: confidence,
      policyApproved: policyCheck.approved,
      humanOverrideRequired: policyCheck.requiresOverride,
      executionStatus: policyCheck.approved && !policyCheck.requiresOverride ? 'approved' : 'queued',
      recommendedActions: actions.slice(0, 3).map((a) => a.action),
      riskAssessment: {
        currentRisk: riskData.currentRisk,
        projectedRisk,
        confidence,
      },
    });

    return await autonomousAction.save();
  }

  /**
   * Get all queued/recommended actions
   */
  async getActions(
    filters?: {
      status?: string;
      fromDate?: Date;
      toDate?: Date;
      narrativeId?: string;
    },
    limit = 50,
    offset = 0
  ): Promise<{ actions: AutonomousActionDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.executionStatus = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.createdAt = {};
      if (filters?.fromDate) (query.createdAt as Record<string, Date>).$gte = filters.fromDate;
      if (filters?.toDate) (query.createdAt as Record<string, Date>).$lte = filters.toDate;
    }

    if (filters?.narrativeId) {
      query['triggerCondition.narrativeId'] = filters.narrativeId;
    }

    const [actions, total] = await Promise.all([
      AutonomousAction.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      AutonomousAction.countDocuments(query),
    ]);

    return { actions, total };
  }

  /**
   * Approve an autonomous action
   */
  async approveAction(
    actionId: string,
    approvedBy: string,
    notes?: string
  ): Promise<AutonomousAction | null> {
    return await AutonomousAction.findOneAndUpdate(
      { actionId },
      {
        $set: {
          executionStatus: 'approved',
          approvedBy,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Reject an autonomous action
   */
  async rejectAction(
    actionId: string,
    rejectedBy: string,
    reason: string
  ): Promise<AutonomousAction | null> {
    return await AutonomousAction.findOneAndUpdate(
      { actionId },
      {
        $set: {
          executionStatus: 'rejected',
          approvedBy: rejectedBy,
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Mark action as executed
   */
  async markExecuted(actionId: string): Promise<AutonomousAction | null> {
    return await AutonomousAction.findOneAndUpdate(
      { actionId },
      {
        $set: {
          executionStatus: 'executed',
          executedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Get action statistics
   */
  async getActionStats(): Promise<{
    total: number;
    queued: number;
    approved: number;
    rejected: number;
    executed: number;
    avgRiskReduction: number;
  }> {
    const stats = await AutonomousAction.aggregate([
      {
        $group: {
          _id: '$executionStatus',
          count: { $sum: 1 },
          avgRiskReduction: { $avg: '$predictedImpact.riskReduction' },
        },
      },
    ]);

    const result = {
      total: 0,
      queued: 0,
      approved: 0,
      rejected: 0,
      executed: 0,
      avgRiskReduction: 0,
    };

    stats.forEach((s) => {
      result[s._id as keyof typeof result] = s.count;
      if (s.avgRiskReduction) result.avgRiskReduction = s.avgRiskReduction;
      result.total += s.count;
    });

    return result;
  }

  /**
   * Run full autonomous orchestration cycle
   */
  async runOrchestrationCycle(
    riskData: {
      currentRisk: number;
      driftLevel: number;
      sentimentIntensity: number;
      spreadVelocity: number;
      conflictScore?: number;
      narrativeId?: string;
      clusterId?: string;
      narrativeType?: string;
    },
    policyConfig: {
      allowAutonomousActions: boolean;
      requireHumanApproval: boolean;
      allowedActions: string[];
      restrictedActions: string[];
    }
  ): Promise<{
    escalationDetected: boolean;
    trigger?: EscalationTrigger;
    actions?: AutonomousActionDocument[];
    message: string;
  }> {
    // Step 1: Detect escalation
    const trigger = await this.detectEscalation(riskData, riskData.narrativeId, riskData.clusterId);

    if (!trigger) {
      return {
        escalationDetected: false,
        message: 'No escalation threshold detected. System operating normally.',
      };
    }

    // Step 2: Generate ranked actions
    const actions = this.generateRankedActions(riskData);

    // Step 3: Queue the intervention
    const autonomousAction = await this.queueRecommendedIntervention(
      trigger,
      actions,
      riskData,
      policyConfig
    );

    return {
      escalationDetected: true,
      trigger,
      actions: [autonomousAction],
      message: `Escalation detected: ${trigger.type}. Action queued: ${autonomousAction.actionId}`,
    };
  }
}

export const autonomousOrchestrator = new AutonomousOrchestratorService();
