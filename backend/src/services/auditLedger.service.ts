import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface DecisionAuditRecord {
  recordId: string;
  timestamp: Date;
  modelVersion: string;
  riskSnapshotId: string;
  actionTaken: string;
  predictedOutcome: string;
  actualOutcome?: string;
  complianceFlags: string[];
  riskScoreAtAction: number;
  driftState: {
    driftDetected: boolean;
    driftMagnitude: number;
  };
  executiveSummary: string;
  actorId?: string;
  metadata?: Record<string, any>;
}

export interface DecisionAuditDocument extends DecisionAuditRecord, Document {}

// ============== SCHEMA ==============
const DecisionAuditSchema = new Schema<DecisionAuditDocument>(
  {
    recordId: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: Date.now },
    modelVersion: { type: String, required: true },
    riskSnapshotId: { type: String, required: true },
    actionTaken: { type: String, required: true },
    predictedOutcome: { type: String, required: true },
    actualOutcome: String,
    complianceFlags: [{ type: String }],
    riskScoreAtAction: { type: Number, required: true },
    driftState: {
      driftDetected: { type: Boolean, required: true },
      driftMagnitude: { type: Number, required: true },
    },
    executiveSummary: { type: String, required: true },
    actorId: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

DecisionAuditSchema.index({ timestamp: -1 });
DecisionAuditSchema.index({ actionTaken: 1 });
DecisionAuditSchema.index({ riskSnapshotId: 1 });

export const DecisionAuditModel = mongoose.model<DecisionAuditDocument>(
  'DecisionAudit',
  DecisionAuditSchema
);

// ============== SERVICE ==============
export class AuditLedgerService {

  /**
   * Log a decision to the audit ledger
   */
  async logDecision(record: Omit<DecisionAuditRecord, 'recordId' | 'timestamp'>): Promise<DecisionAuditDocument> {
    const recordId = `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const auditRecord = new DecisionAuditModel({
      ...record,
      recordId,
      timestamp: new Date(),
    });
    
    return await auditRecord.save();
  }

  /**
   * Get audit history with filters
   */
  async getAuditHistory(filters?: {
    fromDate?: Date;
    toDate?: Date;
    actionTaken?: string;
    modelVersion?: string;
    complianceFlags?: string[];
  }, limit = 100, offset = 0): Promise<{ records: DecisionAuditDocument[]; total: number }> {
    const query: Record<string, any> = {};
    
    if (filters?.fromDate || filters?.toDate) {
      query.timestamp = {};
      if (filters?.fromDate) query.timestamp.$gte = filters.fromDate;
      if (filters?.toDate) query.timestamp.$lte = filters.toDate;
    }
    
    if (filters?.actionTaken) {
      query.actionTaken = filters.actionTaken;
    }
    
    if (filters?.modelVersion) {
      query.modelVersion = filters.modelVersion;
    }
    
    if (filters?.complianceFlags && filters.complianceFlags.length > 0) {
      query.complianceFlags = { $in: filters.complianceFlags };
    }
    
    const [records, total] = await Promise.all([
      DecisionAuditModel.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit),
      DecisionAuditModel.countDocuments(query),
    ]);
    
    return { records, total };
  }

  /**
   * Get a specific audit record
   */
  async getAuditRecord(recordId: string): Promise<DecisionAuditDocument | null> {
    return await DecisionAuditModel.findOne({ recordId });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(days = 30): Promise<{
    totalDecisions: number;
    decisionsByAction: Record<string, number>;
    avgRiskScore: number;
    complianceIssues: number;
    driftEvents: number;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    const result = await DecisionAuditModel.aggregate([
      { $match: { timestamp: { $gte: fromDate } } },
      {
        $group: {
          _id: '$actionTaken',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScoreAtAction' },
        },
      },
    ]);
    
    const complianceResult = await DecisionAuditModel.aggregate([
      { $match: { timestamp: { $gte: fromDate } } },
      { $unwind: '$complianceFlags' },
      { $group: { _id: '$complianceFlags', count: { $sum: 1 } } },
    ]);
    
    const driftResult = await DecisionAuditModel.aggregate([
      { $match: { timestamp: { $gte: fromDate }, 'driftState.driftDetected': true } },
      { $count: 'driftEvents' },
    ]);
    
    const decisionsByAction: Record<string, number> = {};
    let totalDecisions = 0;
    let avgRiskScore = 0;
    
    result.forEach(r => {
      decisionsByAction[r._id] = r.count;
      totalDecisions += r.count;
      avgRiskScore = r.avgRiskScore || 0;
    });
    
    const complianceIssues = complianceResult.reduce((sum, r) => sum + r.count, 0);
    const driftEvents = driftResult.length > 0 ? driftResult[0].driftEvents : 0;
    
    return {
      totalDecisions,
      decisionsByAction,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      complianceIssues,
      driftEvents,
    };
  }

  /**
   * Get recent critical decisions
   */
  async getCriticalDecisions(limit = 20): Promise<DecisionAuditDocument[]> {
    return await DecisionAuditModel.find({
      $or: [
        { riskScoreAtAction: { $gte: 0.8 } },
        { complianceFlags: { $exists: true, $ne: [] } },
        { 'driftState.driftDetected': true },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Verify audit integrity
   */
  async verifyIntegrity(): Promise<{
    isValid: boolean;
    totalRecords: number;
    gaps: number[];
  }> {
    const records = await DecisionAuditModel.find().sort({ timestamp: 1 }).limit(1000);
    const gaps: number[] = [];
    
    for (let i = 1; i < records.length; i++) {
      const timeDiff = records[i].timestamp.getTime() - records[i - 1].timestamp.getTime();
      // If gap is more than 1 hour, note it
      if (timeDiff > 3600000) {
        gaps.push(Math.round(timeDiff / 60000)); // minutes
      }
    }
    
    return {
      isValid: gaps.length === 0,
      totalRecords: records.length,
      gaps,
    };
  }

  /**
   * Get decision timeline for a specific narrative
   */
  async getDecisionTimeline(riskSnapshotId: string): Promise<DecisionAuditDocument[]> {
    return await DecisionAuditModel.find({ riskSnapshotId })
      .sort({ timestamp: 1 });
  }

  /**
   * Export audit records for compliance
   */
  async exportForCompliance(fromDate: Date, toDate: Date): Promise<DecisionAuditDocument[]> {
    return await DecisionAuditModel.find({
      timestamp: { $gte: fromDate, $lte: toDate },
    }).sort({ timestamp: 1 });
  }

  /**
   * Log a system event (non-decision)
   */
  async logSystemEvent(eventType: string, details: Record<string, any>): Promise<void> {
    await this.logDecision({
      modelVersion: details.modelVersion || 'system',
      riskSnapshotId: details.riskSnapshotId || 'system_event',
      actionTaken: `SYSTEM_EVENT_${eventType}`,
      predictedOutcome: details.message || 'System event logged',
      complianceFlags: [],
      riskScoreAtAction: details.riskScore || 0,
      driftState: {
        driftDetected: details.driftDetected || false,
        driftMagnitude: details.driftMagnitude || 0,
      },
      executiveSummary: details.summary || `System event: ${eventType}`,
      metadata: details,
    });
  }
}

export const auditLedger = new AuditLedgerService();
