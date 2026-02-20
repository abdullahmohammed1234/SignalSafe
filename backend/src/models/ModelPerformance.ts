import mongoose, { Document, Schema } from 'mongoose';

export interface IModelPerformance extends Document {
  timestamp: Date;
  
  // Error metrics
  MAE: number; // Mean Absolute Error
  RMSE: number; // Root Mean Square Error
  
  // Accuracy metrics
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Error rates
  falsePositiveRate: number;
  falseNegativeRate: number;
  
  // Calibration
  confidenceCalibrationError: number;
  
  // Test details
  testType: 'backtest' | 'adversarial' | 'live';
  samplesTested: number;
  
  // Additional metadata
  modelVersion: string;
  averagePredictionTime: number;
}

const ModelPerformanceSchema = new Schema<IModelPerformance>(
  {
    timestamp: { type: Date, default: Date.now },
    
    // Error metrics
    MAE: { type: Number, default: 0 },
    RMSE: { type: Number, default: 0 },
    
    // Accuracy metrics
    accuracy: { type: Number, default: 0 },
    precision: { type: Number, default: 0 },
    recall: { type: Number, default: 0 },
    f1Score: { type: Number, default: 0 },
    
    // Error rates
    falsePositiveRate: { type: Number, default: 0 },
    falseNegativeRate: { type: Number, default: 0 },
    
    // Calibration
    confidenceCalibrationError: { type: Number, default: 0 },
    
    // Test details
    testType: { 
      type: String, 
      enum: ['backtest', 'adversarial', 'live'],
      default: 'backtest' 
    },
    samplesTested: { type: Number, default: 0 },
    
    // Additional metadata
    modelVersion: { type: String, default: '1.0.0' },
    averagePredictionTime: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Indexes
ModelPerformanceSchema.index({ timestamp: -1 });
ModelPerformanceSchema.index({ testType: 1, timestamp: -1 });

export const ModelPerformance = mongoose.model<IModelPerformance>('ModelPerformance', ModelPerformanceSchema);
