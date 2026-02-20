import mongoose, { Document, Schema } from 'mongoose';

export interface INarrativeHistory {
  timestamp: Date;
  riskScore: number;
  clusterSize: number;
  avgSentiment: number;
}

export interface INarrative extends Document {
  clusterId: string;
  firstDetectedAt: Date;
  lifecycleStage: 'Emerging' | 'Accelerating' | 'Peak' | 'Declining';
  peakRiskScore: number;
  growthVelocity: number;
  decayRate: number;
  timeToPeakPrediction: number | null;
  confidenceScore: number;
  history: INarrativeHistory[];
  lastUpdated: Date;
}

const NarrativeHistorySchema = new Schema<INarrativeHistory>(
  {
    timestamp: { type: Date, required: true },
    riskScore: { type: Number, required: true },
    clusterSize: { type: Number, required: true },
    avgSentiment: { type: Number, required: true },
  },
  { _id: false }
);

const NarrativeSchema = new Schema<INarrative>(
  {
    clusterId: { type: String, required: true, unique: true },
    firstDetectedAt: { type: Date, default: Date.now },
    lifecycleStage: {
      type: String,
      enum: ['Emerging', 'Accelerating', 'Peak', 'Declining'],
      default: 'Emerging',
    },
    peakRiskScore: { type: Number, default: 0 },
    growthVelocity: { type: Number, default: 0 },
    decayRate: { type: Number, default: 0 },
    timeToPeakPrediction: { type: Number, default: null },
    confidenceScore: { type: Number, default: 50 },
    history: { type: [NarrativeHistorySchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

NarrativeSchema.index({ clusterId: 1 });
NarrativeSchema.index({ growthVelocity: -1 });
NarrativeSchema.index({ lifecycleStage: 1 });

export const Narrative = mongoose.model<INarrative>('Narrative', NarrativeSchema);
