import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskHistory extends Document {
  timestamp: Date;
  overallRiskScore: number;
  clusterCount: number;
  anomalyScore: number;
}

const RiskHistorySchema = new Schema<IRiskHistory>(
  {
    timestamp: { type: Date, default: Date.now },
    overallRiskScore: { type: Number, required: true },
    clusterCount: { type: Number, required: true },
    anomalyScore: { type: Number, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

RiskHistorySchema.index({ timestamp: -1 });

export const RiskHistory = mongoose.model<IRiskHistory>('RiskHistory', RiskHistorySchema);
