import mongoose, { Document, Schema } from 'mongoose';

export interface ICluster extends Document {
  clusterId: string;
  keywords: string[];
  size: number;
  avgSentiment: number;
  growthRate: number;
  volatilityIndex: number;
  lastUpdated: Date;
}

const ClusterSchema = new Schema<ICluster>(
  {
    clusterId: { type: String, required: true, unique: true },
    keywords: { type: [String], default: [] },
    size: { type: Number, default: 0 },
    avgSentiment: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
    volatilityIndex: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

ClusterSchema.index({ clusterId: 1 });
ClusterSchema.index({ growthRate: -1 });

export const Cluster = mongoose.model<ICluster>('Cluster', ClusterSchema);
