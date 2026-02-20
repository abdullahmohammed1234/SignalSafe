import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface OverrideRecord {
  overrideId: string;
  type: 'weight_adjustment' | 'risk_override' | 'emergency_freeze' | 'action_rejection';
  targetId: string;
  previousValue: any;
  newValue: any;
  reason: string;
  actorId: string;
  timestamp: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface OverrideRecordDocument extends OverrideRecord, Document {}

export interface EmergencyFreezeState {
  frozen: boolean;
  frozenAt?: Date;
  frozenBy?: string;
  reason?: string;
  narrativesAffected?: string[];
}

// ============== SCHEMA ==============
const OverrideRecordSchema = new Schema<OverrideRecordDocument>({
  overrideId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['weight_adjustment', 'risk_override', 'emergency_freeze', 'action_rejection'], required: true },
  targetId: { type: String, required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed, required: true },
  reason: { type: String, required: true },
  actorId: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
});

OverrideRecordSchema.index({ type: 1, isActive: 1 });
OverrideRecordSchema.index({ timestamp: -1 });

export const OverrideRecordModel = mongoose.model<OverrideRecordDocument>('OverrideRecord', OverrideRecordSchema);

// ============== SERVICE ==============
export class OverrideEngineService {

  private emergencyFreezeState: EmergencyFreezeState = { frozen: false, narrativesAffected: [] };

  /**
   * Apply weight adjustment override
   */
  async adjustWeight(
    targetId: string,
    previousValue: Record<string, number>,
    newValue: Record<string, number>,
    actorId: string,
    reason: string
  ): Promise<OverrideRecordDocument> {
    const overrideId = `OVERRIDE_WA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record = new OverrideRecordModel({
      overrideId,
      type: 'weight_adjustment',
      targetId,
      previousValue,
      newValue,
      reason,
      actorId,
    });
    
    return await record.save();
  }

  /**
   * Override risk score
   */
  async overrideRisk(
    targetId: string,
    previousRiskScore: number,
    newRiskScore: number,
    actorId: string,
    reason: string,
    expiresInHours?: number
  ): Promise<OverrideRecordDocument> {
    const overrideId = `OVERRIDE_RO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) 
      : undefined;
    
    const record = new OverrideRecordModel({
      overrideId,
      type: 'risk_override',
      targetId,
      previousValue: previousRiskScore,
      newValue: newRiskScore,
      reason,
      actorId,
      expiresAt,
    });
    
    return await record.save();
  }

  /**
   * Activate emergency freeze
   */
  async activateEmergencyFreeze(
    actorId: string,
    reason: string,
    narrativesAffected: string[]
  ): Promise<EmergencyFreezeState> {
    this.emergencyFreezeState = {
      frozen: true,
      frozenAt: new Date(),
      frozenBy: actorId,
      reason,
      narrativesAffected,
    };

    // Log the freeze as an override
    const overrideId = `OVERRIDE_EF_${Date.now()}`;
    await new OverrideRecordModel({
      overrideId,
      type: 'emergency_freeze',
      targetId: 'system',
      previousValue: { frozen: false },
      newValue: { frozen: true, narrativesAffected },
      reason,
      actorId,
    }).save();

    return this.emergencyFreezeState;
  }

  /**
   * Deactivate emergency freeze
   */
  async deactivateEmergencyFreeze(actorId: string): Promise<EmergencyFreezeState> {
    this.emergencyFreezeState = { frozen: false, narrativesAffected: [] };
    return this.emergencyFreezeState;
  }

  /**
   * Get emergency freeze state
   */
  getFreezeState(): EmergencyFreezeState {
    return this.emergencyFreezeState;
  }

  /**
   * Log action rejection
   */
  async rejectAction(
    actionId: string,
    actorId: string,
    reason: string
  ): Promise<OverrideRecordDocument> {
    const overrideId = `OVERRIDE_AR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record = new OverrideRecordModel({
      overrideId,
      type: 'action_rejection',
      targetId: actionId,
      previousValue: null,
      newValue: 'rejected',
      reason,
      actorId,
    });
    
    return await record.save();
  }

  /**
   * Get override history
   */
  async getOverrideHistory(
    filters?: { type?: string; fromDate?: Date; toDate?: Date },
    limit = 50
  ): Promise<OverrideRecordDocument[]> {
    const query: Record<string, any> = {};
    
    if (filters?.type) query.type = filters.type;
    if (filters?.fromDate || filters?.toDate) {
      query.timestamp = {};
      if (filters?.fromDate) query.timestamp.$gte = filters.fromDate;
      if (filters?.toDate) query.timestamp.$lte = filters.toDate;
    }
    
    return await OverrideRecordModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Get active overrides
   */
  async getActiveOverrides(): Promise<OverrideRecordDocument[]> {
    return await OverrideRecordModel.find({ isActive: true })
      .sort({ timestamp: -1 });
  }

  /**
   * Deactivate an override
   */
  async deactivateOverride(overrideId: string): Promise<OverrideRecordDocument | null> {
    return await OverrideRecordModel.findOneAndUpdate(
      { overrideId },
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Check if system is frozen
   */
  isSystemFrozen(): boolean {
    return this.emergencyFreezeState.frozen;
  }

  /**
   * Get override statistics
   */
  async getOverrideStats(days = 30): Promise<{
    totalOverrides: number;
    byType: Record<string, number>;
    recentRejections: number;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    const result = await OverrideRecordModel.aggregate([
      { $match: { timestamp: { $gte: fromDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    
    const byType: Record<string, number> = {};
    let totalOverrides = 0;
    result.forEach(r => {
      byType[r._id] = r.count;
      totalOverrides += r.count;
    });

    return {
      totalOverrides,
      byType,
      recentRejections: byType['action_rejection'] || 0,
    };
  }
}

export const overrideEngine = new OverrideEngineService();
