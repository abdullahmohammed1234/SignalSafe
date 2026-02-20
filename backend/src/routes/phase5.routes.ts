/**
 * Phase 5 Routes
 * 
 * New routes for:
 * - Model drift detection
 * - Counterfactual simulation
 * - Strategy optimization
 * - Evolution forecast
 * - Robustness
 * - System intelligence
 */

import { Router, Request, Response } from 'express';

// Import services
import { 
  getCurrentWeights, 
  getWeightHistory, 
  adaptWeights, 
  resetWeights,
  getWeightOptimizationSummary 
} from '../services/adaptiveWeightEngine.service';

import { 
  detectDrift, 
  getDriftStatus, 
  getDriftHistory, 
  getModelStatus,
  getDriftMetricsSummary,
  shouldRetrain 
} from '../services/driftDetection.service';

import { 
  runModelRetraining, 
  getCurrentModelVersion, 
  getVersionHistory, 
  getRetrainingStatus,
  getModelHealthSummary,
  forceRetraining,
  initializeModel 
} from '../services/modelRetraining.service';

import { 
  runCounterfactualSimulation, 
  compareInterventions, 
  getSimulationHistory,
  getOptimalIntervention,
  getInterventionTimingEffectiveness,
  simulateEarlyIntervention 
} from '../services/counterfactualEngine.service';

import { 
  getAllEffectiveness, 
  getActionEffectiveness,
  getRankedRecommendations,
  getInterventionHistory,
  predictInterventionImpact,
  recordIntervention 
} from '../services/interventionImpact.service';

import { 
  generateStrategicRecommendations, 
  getExecutiveSummary,
  getActionTimeline 
} from '../services/strategyOptimizer.service';

import { 
  generateNarrativeForecast, 
  generateAllForecasts,
  getCriticalForecasts,
  getForecastTimeline 
} from '../services/evolutionForecast.service';

import { 
  updateEscalationState, 
  getCurrentState, 
  getStateHistory,
  getStateSummary,
  getValidTransitions,
  getStateConfig 
} from '../services/escalationStateMachine';

import { 
  runRobustnessCheck, 
  getRobustnessStatus, 
  getAnomalyHistory,
  getAnomalyStatistics,
  getProtectionRecommendations 
} from '../services/robustness.service';

import { 
  getQueueStatus, 
  configureWorkers,
  clearCache 
} from '../services/queue.service';

const router = Router();

// ==================== MODEL DRIFT ====================

// GET /api/model/drift - Get current drift status
router.get('/model/drift', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await getDriftStatus();
    const modelStatus = getModelStatus();
    
    res.json({
      success: true,
      data: {
        driftStatus: status,
        modelStatus,
      },
    });
  } catch (error) {
    console.error('Error getting drift status:', error);
    res.status(500).json({ error: 'Failed to get drift status' });
  }
});

// POST /api/model/drift/detect - Trigger drift detection
router.post('/model/drift/detect', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await detectDrift();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error detecting drift:', error);
    res.status(500).json({ error: 'Failed to detect drift' });
  }
});

// GET /api/model/drift/history - Get drift history
router.get('/model/drift/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getDriftHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting drift history:', error);
    res.status(500).json({ error: 'Failed to get drift history' });
  }
});

// ==================== MODEL RETRAINING ====================

// GET /api/model/version - Get current model version
router.get('/model/version', async (req: Request, res: Response): Promise<void> => {
  try {
    const version = getCurrentModelVersion();
    const health = await getModelHealthSummary();
    const retrainCheck = await shouldRetrain();
    
    res.json({
      success: true,
      data: {
        currentVersion: version,
        health,
        retrainRecommendation: retrainCheck,
      },
    });
  } catch (error) {
    console.error('Error getting model version:', error);
    res.status(500).json({ error: 'Failed to get model version' });
  }
});

// POST /api/model/retrain - Trigger model retraining
router.post('/model/retrain', async (req: Request, res: Response): Promise<void> => {
  try {
    const reason = req.body.reason || 'Manual trigger';
    const result = await runModelRetraining(reason);
    
    res.json({
      success: result.success,
      data: result.newVersion,
      error: result.error,
    });
  } catch (error) {
    console.error('Error retraining model:', error);
    res.status(500).json({ error: 'Failed to retrain model' });
  }
});

// GET /api/model/retrain/status - Get retraining status
router.get('/model/retrain/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = getRetrainingStatus();
    const versionHistory = getVersionHistory();
    
    res.json({
      success: true,
      data: {
        status,
        versionHistory,
      },
    });
  } catch (error) {
    console.error('Error getting retrain status:', error);
    res.status(500).json({ error: 'Failed to get retrain status' });
  }
});

// ==================== ADAPTIVE WEIGHTS ====================

// GET /api/model/weights - Get current ensemble weights
router.get('/model/weights', async (req: Request, res: Response): Promise<void> => {
  try {
    const weights = getCurrentWeights();
    const summary = getWeightOptimizationSummary();
    
    res.json({
      success: true,
      data: {
        currentWeights: weights,
        summary,
      },
    });
  } catch (error) {
    console.error('Error getting weights:', error);
    res.status(500).json({ error: 'Failed to get weights' });
  }
});

// POST /api/model/weights/adapt - Trigger weight adaptation
router.post('/model/weights/adapt', async (req: Request, res: Response): Promise<void> => {
  try {
    const newWeights = await adaptWeights();
    
    res.json({
      success: true,
      data: newWeights,
    });
  } catch (error) {
    console.error('Error adapting weights:', error);
    res.status(500).json({ error: 'Failed to adapt weights' });
  }
});

// POST /api/model/weights/reset - Reset weights to defaults
router.post('/model/weights/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const weights = resetWeights();
    
    res.json({
      success: true,
      data: weights,
    });
  } catch (error) {
    console.error('Error resetting weights:', error);
    res.status(500).json({ error: 'Failed to reset weights' });
  }
});

// GET /api/model/weights/history - Get weight history
router.get('/model/weights/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = getWeightHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting weight history:', error);
    res.status(500).json({ error: 'Failed to get weight history' });
  }
});

// ==================== COUNTERFACTUAL SIMULATION ====================

// POST /api/simulate/intervention - Run counterfactual simulation
router.post('/simulate/intervention', async (req: Request, res: Response): Promise<void> => {
  try {
    const { interventionType, timeShiftMinutes, strength, targetClusterId } = req.body;
    
    const result = await runCounterfactualSimulation({
      interventionType,
      timeShiftMinutes: timeShiftMinutes || -30,
      strength: strength || 0.8,
      targetClusterId,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

// GET /api/simulate/interventions/compare - Compare interventions
router.get('/simulate/interventions/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const baseRisk = parseInt(req.query.risk as string) || 50;
    const timeShift = parseInt(req.query.timeShift as string) || -30;
    
    const result = await compareInterventions(baseRisk, timeShift);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error comparing interventions:', error);
    res.status(500).json({ error: 'Failed to compare interventions' });
  }
});

// GET /api/simulate/optimal - Get optimal intervention
router.get('/simulate/optimal', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getOptimalIntervention();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting optimal intervention:', error);
    res.status(500).json({ error: 'Failed to get optimal intervention' });
  }
});

// GET /api/simulate/timing - Get intervention timing effectiveness
router.get('/simulate/timing', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getInterventionTimingEffectiveness();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting timing effectiveness:', error);
    res.status(500).json({ error: 'Failed to get timing effectiveness' });
  }
});

// GET /api/simulate/history - Get simulation history
router.get('/simulate/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = getSimulationHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting simulation history:', error);
    res.status(500).json({ error: 'Failed to get simulation history' });
  }
});

// ==================== STRATEGY OPTIMIZER ====================

// GET /api/strategy/recommendations - Get strategic recommendations
router.get('/strategy/recommendations', async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendations = await generateStrategicRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// GET /api/strategy/executive - Get executive summary
router.get('/strategy/executive', async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await getExecutiveSummary();
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting executive summary:', error);
    res.status(500).json({ error: 'Failed to get executive summary' });
  }
});

// GET /api/strategy/timeline - Get action timeline
router.get('/strategy/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const timeline = await getActionTimeline();
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('Error getting action timeline:', error);
    res.status(500).json({ error: 'Failed to get action timeline' });
  }
});

// ==================== INTERVENTION IMPACT ====================

// GET /api/intervention/effectiveness - Get intervention effectiveness
router.get('/intervention/effectiveness', async (req: Request, res: Response): Promise<void> => {
  try {
    const effectiveness = await getAllEffectiveness();
    
    res.json({
      success: true,
      data: effectiveness,
    });
  } catch (error) {
    console.error('Error getting effectiveness:', error);
    res.status(500).json({ error: 'Failed to get effectiveness' });
  }
});

// GET /intervention/history - Get intervention history
router.get('/intervention/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = getInterventionHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting intervention history:', error);
    res.status(500).json({ error: 'Failed to get intervention history' });
  }
});

// POST /intervention/record - Record an intervention
router.post('/intervention/record', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionType, preRisk, postRisk, strength, targetCluster } = req.body;
    
    await recordIntervention(actionType, preRisk, postRisk, strength, targetCluster);
    
    res.json({
      success: true,
      message: 'Intervention recorded',
    });
  } catch (error) {
    console.error('Error recording intervention:', error);
    res.status(500).json({ error: 'Failed to record intervention' });
  }
});

// GET /intervention/predict/:actionType - Predict intervention impact
router.get('/intervention/predict/:actionType', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionType } = req.params;
    const currentRisk = parseInt(req.query.risk as string) || 50;
    const strength = parseFloat(req.query.strength as string) || 1.0;
    
    const prediction = await predictInterventionImpact(
      actionType as any,
      currentRisk,
      strength
    );
    
    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Error predicting impact:', error);
    res.status(500).json({ error: 'Failed to predict impact' });
  }
});

// ==================== EVOLUTION FORECAST ====================

// GET /api/forecast - Get all narrative forecasts
router.get('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await generateAllForecasts();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting forecasts:', error);
    res.status(500).json({ error: 'Failed to get forecasts' });
  }
});

// GET /api/forecast/critical - Get critical forecasts
router.get('/forecast/critical', async (req: Request, res: Response): Promise<void> => {
  try {
    const forecasts = await getCriticalForecasts();
    
    res.json({
      success: true,
      count: forecasts.length,
      data: forecasts,
    });
  } catch (error) {
    console.error('Error getting critical forecasts:', error);
    res.status(500).json({ error: 'Failed to get critical forecasts' });
  }
});

// GET /api/forecast/timeline - Get forecast timeline
router.get('/forecast/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const timeline = await getForecastTimeline();
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('Error getting forecast timeline:', error);
    res.status(500).json({ error: 'Failed to get forecast timeline' });
  }
});

// ==================== ESCALATION STATE ====================

// GET /api/system/escalation - Get current escalation state
router.get('/system/escalation', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await getStateSummary();
    const history = getStateHistory();
    
    res.json({
      success: true,
      data: {
        currentState: state,
        history,
      },
    });
  } catch (error) {
    console.error('Error getting escalation state:', error);
    res.status(500).json({ error: 'Failed to get escalation state' });
  }
});

// POST /api/system/escalation/update - Trigger state update
router.post('/system/escalation/update', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await updateEscalationState();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating escalation state:', error);
    res.status(500).json({ error: 'Failed to update escalation state' });
  }
});

// ==================== ROBUSTNESS ====================

// GET /api/system/robustness - Get robustness status
router.get('/system/robustness', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await getRobustnessStatus();
    const stats = getAnomalyStatistics();
    const recommendations = await getProtectionRecommendations();
    
    res.json({
      success: true,
      data: {
        status,
        statistics: stats,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error getting robustness status:', error);
    res.status(500).json({ error: 'Failed to get robustness status' });
  }
});

// POST /api/system/robustness/check - Trigger robustness check
router.post('/system/robustness/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await runRobustnessCheck();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running robustness check:', error);
    res.status(500).json({ error: 'Failed to run robustness check' });
  }
});

// GET /api/system/anomalies - Get anomaly history
router.get('/system/anomalies', async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type as any;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = getAnomalyHistory(type, limit);
    
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting anomaly history:', error);
    res.status(500).json({ error: 'Failed to get anomaly history' });
  }
});

// ==================== SYSTEM STATUS ====================

// GET /api/system/status - Get overall system status
router.get('/system/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const queue = getQueueStatus();
    const modelStatus = getModelStatus();
    const driftStatus = await getDriftStatus();
    const robustnessStatus = await getRobustnessStatus();
    const escalationState = await getStateSummary();
    
    res.json({
      success: true,
      data: {
        queue,
        modelStatus,
        driftStatus,
        robustnessStatus,
        escalationState,
        horizontalScalingReady: true,
        autonomousMode: queue.queueSize > 0 || modelStatus !== 'Stable',
      },
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// POST /api/system/workers - Configure worker count
router.post('/system/workers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { count } = req.body;
    configureWorkers(count);
    
    res.json({
      success: true,
      message: `Configured for ${count} workers`,
    });
  } catch (error) {
    console.error('Error configuring workers:', error);
    res.status(500).json({ error: 'Failed to configure workers' });
  }
});

// POST /api/system/cache/clear - Clear cache
router.post('/system/cache/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ==================== INITIALIZATION ====================

// Initialize model on startup
initializeModel().catch(console.error);

export default router;
