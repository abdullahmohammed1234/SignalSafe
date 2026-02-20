import { Router, Request, Response } from 'express';
import { 
  computeEnsembleRisk, 
  getEnsembleMetricsSummary,
  getEnsembleHistory 
} from '../services/ensembleEngine.service';
import { 
  calculateCalibrationMetrics, 
  getReliabilityDiagram, 
  getCalibrationStatus,
  generateCalibrationScaling,
  recordPredictionOutcome 
} from '../services/calibrationEngine.service';
import { 
  calculateCausalAttribution, 
  getAttributionHistory 
} from '../services/causalAttribution.service';
import { 
  calculateUncertainty, 
  getUncertaintyHistory,
  getClusterUncertainty 
} from '../services/uncertaintyPropagation.service';
import { 
  generateExecutiveSummary, 
  getQuickBrief,
  getExecutiveSummaryHistory 
} from '../services/executiveSummary.service';
import { 
  getSystemStatus, 
  getMetricsHistory, 
  getHealthSummary,
  getAlertStatus,
  getMetricTrend 
} from '../services/systemMetrics.service';

const router = Router();

// ==================== ENSEMBLE RISK ====================

// GET /api/phase4/ensemble - Get current ensemble risk
router.get('/ensemble', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await computeEnsembleRisk();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error computing ensemble risk:', error);
    res.status(500).json({ error: 'Failed to compute ensemble risk' });
  }
});

// GET /api/phase4/ensemble/summary - Get ensemble metrics summary
router.get('/ensemble/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await getEnsembleMetricsSummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting ensemble summary:', error);
    res.status(500).json({ error: 'Failed to get ensemble summary' });
  }
});

// GET /api/phase4/ensemble/history - Get ensemble risk history
router.get('/ensemble/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getEnsembleHistory(limit);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting ensemble history:', error);
    res.status(500).json({ error: 'Failed to get ensemble history' });
  }
});

// ==================== CALIBRATION ====================

// GET /api/phase4/calibration - Get calibration metrics
router.get('/calibration', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await calculateCalibrationMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting calibration metrics:', error);
    res.status(500).json({ error: 'Failed to get calibration metrics' });
  }
});

// GET /api/phase4/calibration/reliability - Get reliability diagram
router.get('/calibration/reliability', async (req: Request, res: Response): Promise<void> => {
  try {
    const diagram = await getReliabilityDiagram();
    res.json({
      success: true,
      data: diagram,
    });
  } catch (error) {
    console.error('Error getting reliability diagram:', error);
    res.status(500).json({ error: 'Failed to get reliability diagram' });
  }
});

// GET /api/phase4/calibration/status - Get calibration status
router.get('/calibration/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await getCalibrationStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting calibration status:', error);
    res.status(500).json({ error: 'Failed to get calibration status' });
  }
});

// GET /api/phase4/calibration/scaling - Get calibration scaling parameters
router.get('/calibration/scaling', async (req: Request, res: Response): Promise<void> => {
  try {
    const scaling = await generateCalibrationScaling();
    res.json({
      success: true,
      data: scaling,
    });
  } catch (error) {
    console.error('Error getting calibration scaling:', error);
    res.status(500).json({ error: 'Failed to get calibration scaling' });
  }
});

// POST /api/phase4/calibration/record - Record prediction outcome
router.post('/calibration/record', async (req: Request, res: Response): Promise<void> => {
  try {
    const { predictedRisk, actualOutcome } = req.body;
    
    if (predictedRisk === undefined || actualOutcome === undefined) {
      res.status(400).json({ error: 'predictedRisk and actualOutcome are required' });
      return;
    }
    
    await recordPredictionOutcome(predictedRisk, actualOutcome);
    res.json({
      success: true,
      message: 'Prediction outcome recorded',
    });
  } catch (error) {
    console.error('Error recording prediction outcome:', error);
    res.status(500).json({ error: 'Failed to record prediction outcome' });
  }
});

// ==================== CAUSAL ATTRIBUTION ====================

// GET /api/phase4/attribution - Get causal attribution
router.get('/attribution', async (req: Request, res: Response): Promise<void> => {
  try {
    const attribution = await calculateCausalAttribution();
    res.json({
      success: true,
      data: attribution,
    });
  } catch (error) {
    console.error('Error calculating attribution:', error);
    res.status(500).json({ error: 'Failed to calculate attribution' });
  }
});

// GET /api/phase4/attribution/history - Get attribution history
router.get('/attribution/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const endTime = new Date();
    
    const history = await getAttributionHistory(startTime, endTime);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting attribution history:', error);
    res.status(500).json({ error: 'Failed to get attribution history' });
  }
});

// ==================== UNCERTAINTY ====================

// GET /api/phase4/uncertainty - Get uncertainty metrics
router.get('/uncertainty', async (req: Request, res: Response): Promise<void> => {
  try {
    const uncertainty = await calculateUncertainty();
    res.json({
      success: true,
      data: uncertainty,
    });
  } catch (error) {
    console.error('Error calculating uncertainty:', error);
    res.status(500).json({ error: 'Failed to calculate uncertainty' });
  }
});

// GET /api/phase4/uncertainty/history - Get uncertainty history
router.get('/uncertainty/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await getUncertaintyHistory(limit);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting uncertainty history:', error);
    res.status(500).json({ error: 'Failed to get uncertainty history' });
  }
});

// GET /api/phase4/uncertainty/cluster/:clusterId - Get uncertainty for specific cluster
router.get('/uncertainty/cluster/:clusterId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clusterId } = req.params;
    const uncertainty = await getClusterUncertainty(clusterId);
    
    if (!uncertainty) {
      res.status(404).json({ error: 'Cluster not found' });
      return;
    }
    
    res.json({
      success: true,
      data: uncertainty,
    });
  } catch (error) {
    console.error('Error getting cluster uncertainty:', error);
    res.status(500).json({ error: 'Failed to get cluster uncertainty' });
  }
});

// ==================== EXECUTIVE ====================

// GET /api/phase4/executive - Get executive summary
router.get('/executive', async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await generateExecutiveSummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({ error: 'Failed to generate executive summary' });
  }
});

// GET /api/phase4/executive/brief - Get quick executive brief
router.get('/executive/brief', async (req: Request, res: Response): Promise<void> => {
  try {
    const brief = await getQuickBrief();
    res.json({
      success: true,
      data: brief,
    });
  } catch (error) {
    console.error('Error getting executive brief:', error);
    res.status(500).json({ error: 'Failed to get executive brief' });
  }
});

// GET /api/phase4/executive/history - Get executive summary history
router.get('/executive/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await getExecutiveSummaryHistory(limit);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error getting executive history:', error);
    res.status(500).json({ error: 'Failed to get executive history' });
  }
});

// ==================== SYSTEM METRICS ====================

// GET /api/phase4/system/metrics - Get all system metrics
router.get('/system/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { getSystemStatus } = await import('../services/systemMetrics.service');
    const metrics = await getSystemStatus();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// GET /api/phase4/system/health - Get system health summary
router.get('/system/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await getHealthSummary();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

// GET /api/phase4/system/alerts - Get system alerts
router.get('/system/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await getAlertStatus();
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error getting system alerts:', error);
    res.status(500).json({ error: 'Failed to get system alerts' });
  }
});

// GET /api/phase4/system/trend/:type/:metric - Get metric trend
router.get('/system/trend/:type/:metric', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, metric } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const validTypes = ['ai', 'queue', 'websocket', 'database'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid metric type' });
      return;
    }
    
    const trend = await getMetricTrend(type as any, metric, limit);
    
    if (!trend) {
      res.status(404).json({ error: 'Metric not found' });
      return;
    }
    
    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error('Error getting metric trend:', error);
    res.status(500).json({ error: 'Failed to get metric trend' });
  }
});

export default router;
