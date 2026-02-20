import mongoose, { Document, Schema } from 'mongoose';

export interface IRegionalRisk extends Document {
  region: string;
  riskScore: number;
  clusterCount: number;
  anomalyScore: number;
  dominantNarrativeId: string | null;
  deviationFromBaseline: number;
  timestamp: Date;
  
  // Detailed region breakdown
  country: string;
  state: string | null;
  city: string | null;
  
  // Metrics
  sentimentTrend: number;
  growthRate: number;
  postVolume: number;
}

const RegionalRiskSchema = new Schema<IRegionalRisk>(
  {
    region: { type: String, required: true },
    riskScore: { type: Number, required: true, default: 0 },
    clusterCount: { type: Number, default: 0 },
    anomalyScore: { type: Number, default: 0 },
    dominantNarrativeId: { type: String, default: null },
    deviationFromBaseline: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    
    // Detailed region breakdown
    country: { type: String, required: true },
    state: { type: String, default: null },
    city: { type: String, default: null },
    
    // Metrics
    sentimentTrend: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
    postVolume: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Indexes for efficient querying
RegionalRiskSchema.index({ region: 1, timestamp: -1 });
RegionalRiskSchema.index({ country: 1, timestamp: -1 });
RegionalRiskSchema.index({ riskScore: -1 });
RegionalRiskSchema.index({ timestamp: -1 });

export const RegionalRisk = mongoose.model<IRegionalRisk>('RegionalRisk', RegionalRiskSchema);
