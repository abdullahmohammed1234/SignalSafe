import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  text: string;
  source: string;
  region: string;
  sentimentScore?: number;
  embedding?: number[];
  clusterId?: string;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    text: { type: String, required: true },
    source: { type: String, required: true },
    region: { type: String, required: true },
    sentimentScore: { type: Number },
    embedding: { type: [Number] },
    clusterId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

PostSchema.index({ text: 'text' });
PostSchema.index({ clusterId: 1 });
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
