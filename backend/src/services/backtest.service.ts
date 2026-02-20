import { ModelPerformance, IModelPerformance } from '../models/ModelPerformance';
import { Narrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';

export interface BacktestResult {
  predictions: {
    clusterId: string;
    predictedTimeToPeak: number;
    actualTimeToPeak: number | null;
    error: number;
  }[];
  summary: {
    MAE: number;
    RMSE: number;
    accuracy: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    samplesTested: number;
  };
}

// Run backtest by comparing predicted vs actual time to peak
export const runBacktest = async (hoursBack: number = 168): Promise<BacktestResult> => {
  try {
    // Get narratives that have reached peak or declining
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    const narratives = await Narrative.find({
      $or: [
        { lifecycleStage: 'Peak' },
        { lifecycleStage: 'Declining' }
      ],
      lastUpdated: { $gte: cutoff }
    });
    
    const predictions: BacktestResult['predictions'] = [];
    let totalAbsoluteError = 0;
    let totalSquaredError = 0;
    let correctPredictions = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    
    for (const narrative of narratives) {
      // Get historical data to determine actual time to peak
      if (narrative.history.length > 0) {
        const firstEntry = narrative.history[0];
        const peakEntry = narrative.history.reduce((max, entry) => 
          entry.riskScore > max.riskScore ? entry : max, narrative.history[0]);
        
        const actualTimeToPeakHours = (peakEntry.timestamp.getTime() - firstEntry.timestamp.getTime()) 
          / (1000 * 60 * 60);
        
        const predictedTimeToPeak = narrative.timeToPeakPrediction || 0;
        
        const error = predictedTimeToPeak > 0 
          ? Math.abs(predictedTimeToPeak - actualTimeToPeakHours) 
          : 0;
        
        // Consider prediction accurate if within 20% of actual
        const isAccurate = predictedTimeToPeak > 0 && 
          error / (actualTimeToPeakHours || 1) <= 0.2;
        
        if (isAccurate) correctPredictions++;
        
        // False positive: predicted high risk but stayed low
        // False negative: predicted low risk but escalated
        const predictedEscalation = predictedTimeToPeak > 0 && predictedTimeToPeak < 48;
        const actualEscalation = peakEntry.riskScore > 50;
        
        if (predictedEscalation && !actualEscalation) falsePositives++;
        if (!predictedEscalation && actualEscalation) falseNegatives++;
        
        predictions.push({
          clusterId: narrative.clusterId,
          predictedTimeToPeak,
          actualTimeToPeak: actualTimeToPeakHours,
          error,
        });
        
        totalAbsoluteError += error;
        totalSquaredError += error * error;
      }
    }
    
    const samplesTested = predictions.length;
    
    const MAE = samplesTested > 0 ? totalAbsoluteError / samplesTested : 0;
    const RMSE = samplesTested > 0 ? Math.sqrt(totalSquaredError / samplesTested) : 0;
    const accuracy = samplesTested > 0 ? (correctPredictions / samplesTested) * 100 : 0;
    const falsePositiveRate = samplesTested > 0 ? (falsePositives / samplesTested) * 100 : 0;
    const falseNegativeRate = samplesTested > 0 ? (falseNegatives / samplesTested) * 100 : 0;
    
    // Save to model performance
    const performance = new ModelPerformance({
      timestamp: new Date(),
      MAE: Math.round(MAE * 100) / 100,
      RMSE: Math.round(RMSE * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      precision: 0,
      recall: 0,
      f1Score: 0,
      falsePositiveRate: Math.round(falsePositiveRate * 100) / 100,
      falseNegativeRate: Math.round(falseNegativeRate * 100) / 100,
      confidenceCalibrationError: 0,
      testType: 'backtest',
      samplesTested,
      modelVersion: '1.0.0',
      averagePredictionTime: 0,
    });
    
    await performance.save();
    
    return {
      predictions,
      summary: {
        MAE: Math.round(MAE * 100) / 100,
        RMSE: Math.round(RMSE * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        falsePositiveRate: Math.round(falsePositiveRate * 100) / 100,
        falseNegativeRate: Math.round(falseNegativeRate * 100) / 100,
        samplesTested,
      },
    };
  } catch (error) {
    console.error('Error running backtest:', error);
    return {
      predictions: [],
      summary: {
        MAE: 0,
        RMSE: 0,
        accuracy: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        samplesTested: 0,
      },
    };
  }
};

// Get model performance history
export const getPerformanceHistory = async (
  testType: 'backtest' | 'adversarial' | 'live' | 'all' = 'all',
  limit: number = 50
): Promise<IModelPerformance[]> => {
  try {
    const query = testType === 'all' ? {} : { testType };
    return await ModelPerformance.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error getting performance history:', error);
    return [];
  }
};

// Get latest performance metrics
export const getLatestPerformance = async (): Promise<IModelPerformance | null> => {
  return await ModelPerformance.findOne().sort({ timestamp: -1 });
};

// Record adversarial test results
export const recordAdversarialResults = async (
  metrics: Partial<IModelPerformance>
): Promise<IModelPerformance> => {
  const performance = new ModelPerformance({
    ...metrics,
    timestamp: new Date(),
    testType: 'adversarial',
    modelVersion: '1.0.0',
  });
  
  return await performance.save();
};

// Calculate confidence calibration
export const calculateConfidenceCalibration = async (): Promise<number> => {
  try {
    const narratives = await Narrative.find({ confidenceScore: { $gt: 0 } });
    
    if (narratives.length === 0) return 0;
    
    let totalCalibrationError = 0;
    
    for (const narrative of narratives) {
      // Compare confidence score with actual prediction accuracy
      // This is simplified - in production, you'd compare with known outcomes
      const confidenceAsProbability = narrative.confidenceScore / 100;
      const expectedAccuracy = confidenceAsProbability;
      const actualAccuracy = narrative.history.length > 5 ? 0.7 : 0.5; // Simplified
      
      totalCalibrationError += Math.abs(expectedAccuracy - actualAccuracy);
    }
    
    return Math.round((totalCalibrationError / narratives.length) * 100) / 100;
  } catch (error) {
    console.error('Error calculating calibration:', error);
    return 0;
  }
};
