import mongoose, { Document, Schema } from 'mongoose';

export interface INarrativeInteraction extends Document {
  narrativeA: string;
  narrativeB: string;
  interactionScore: number;
  amplificationEffect: number;
  similarityScore: number;
  lastDetected: Date;
  isActive: boolean;
  
  // Metadata
  detectionCount: number;
  firstDetected: Date;
  lastUpdated: Date;
}

const NarrativeInteractionSchema = new Schema<INarrativeInteraction>(
  {
    narrativeA: { type: String, required: true },
    narrativeB: { type: String, required: true },
    interactionScore: { type: Number, default: 0 },
    amplificationEffect: { type: Number, default: 0 },
    similarityScore: { type: Number, default: 0 },
    lastDetected: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    
    // Metadata
    detectionCount: { type: Number, default: 1 },
    firstDetected: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for efficient querying
NarrativeInteractionSchema.index({ narrativeA: 1, narrativeB: 1 }, { unique: true });
NarrativeInteractionSchema.index({ isActive: 1, interactionScore: -1 });
NarrativeInteractionSchema.index({ lastDetected: -1 });

export const NarrativeInteraction = mongoose.model<INarrativeInteraction>('NarrativeInteraction', NarrativeInteractionSchema);
