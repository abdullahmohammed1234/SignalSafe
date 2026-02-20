import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskSnapshot extends Document {
  overallRiskScore: number;
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
  classification: 'Stable' | 'Emerging Concern' | 'Escalation Risk' | 'Panic Formation Likely';
  timestamp: Date;
}

const RiskSnapshotSchema = new Schema<IRiskSnapshot>(
  {
    overallRiskScore: { type: Number, required: true },
    sentimentAcceleration: { type: Number, required: true },
    clusterGrowthRate: { type: Number, required: true },
    anomalyScore: { type: Number, required: true },
    narrativeSpreadSpeed: { type: Number, required: true },
    classification: { 
      type: String, 
      enum: ['Stable', 'Emerging Concern', 'Escalation Risk', 'Panic Formation Likely'],
      required: true 
    },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

RiskSnapshotSchema.index({ timestamp: -1 });

export const RiskSnapshot = mongoose.model<IRiskSnapshot>('RiskSnapshot', RiskSnapshotSchema);
