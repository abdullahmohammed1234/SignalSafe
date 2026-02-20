import { Router } from 'express';
import { timelineSimulationService } from '../services/timelineSimulation.service';
import { cascadeImpactService } from '../services/cascadeImpact.service';
import { ecosystemGraphService } from '../services/ecosystemGraph.service';
import { cascadeDetectionService } from '../services/cascadeDetection.service';
import { stabilityIndexService } from '../services/stabilityIndex.service';
import { longHorizonForecastService } from '../services/longHorizonForecast.service';
import { stressTestEngineService } from '../services/stressTestEngine.service';
import { cooperativeIntelligenceService } from '../services/cooperativeIntelligence.service';
import { ethicalConstraintService } from '../services/ethicalConstraint.service';
import { metaEvaluationService } from '../services/metaEvaluation.service';

const router = Router();

// ============================================
// TIMELINE SIMULATION ENGINE
// ============================================

// POST /api/simulation/timelines - Generate timeline simulations for a narrative
router.post('/simulation/timelines', async (req, res) => {
  try {
    const { narrativeId } = req.body;
    if (!narrativeId) {
      return res.status(400).json({ error: 'narrativeId is required' });
    }
    const result = await timelineSimulationService.simulateTimelines(narrativeId);
    res.json(result);
  } catch (error) {
    console.error('Timeline simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate timelines' });
  }
});

// POST /api/simulation/bulk - Run bulk simulation for all narratives
router.post('/simulation/bulk', async (req, res) => {
  try {
    const results = await timelineSimulationService.runBulkSimulation();
    res.json({ simulations: Array.from(results.entries()) });
  } catch (error) {
    console.error('Bulk simulation error:', error);
    res.status(500).json({ error: 'Failed to run bulk simulation' });
  }
});

// ============================================
// CASCADE IMPACT MODELING
// ============================================

// POST /api/impact/cascade - Calculate cascade impact for a narrative
router.post('/impact/cascade', async (req, res) => {
  try {
    const { narrativeId, interventionType } = req.body;
    if (!narrativeId) {
      return res.status(400).json({ error: 'narrativeId is required' });
    }
    const result = await cascadeImpactService.calculateCascadeImpact(narrativeId, interventionType || 'no_intervention');
    res.json(result);
  } catch (error) {
    console.error('Cascade impact error:', error);
    res.status(500).json({ error: 'Failed to calculate cascade impact' });
  }
});

// GET /api/impact/cross-narrative - Analyze cross-narrative cascades
router.get('/impact/cross-narrative', async (req, res) => {
  try {
    const result = await cascadeImpactService.analyzeCrossNarrativeCascades();
    res.json(result);
  } catch (error) {
    console.error('Cross-narrative cascade error:', error);
    res.status(500).json({ error: 'Failed to analyze cross-narrative cascades' });
  }
});

// ============================================
// ECOSYSTEM GRAPH
// ============================================

// GET /api/ecosystem/graph - Get complete ecosystem graph
router.get('/ecosystem/graph', async (req, res) => {
  try {
    const result = await ecosystemGraphService.buildEcosystemGraph();
    res.json(result);
  } catch (error) {
    console.error('Ecosystem graph error:', error);
    res.status(500).json({ error: 'Failed to build ecosystem graph' });
  }
});

// GET /api/ecosystem/statistics - Get graph statistics
router.get('/ecosystem/statistics', async (req, res) => {
  try {
    const result = await ecosystemGraphService.getGraphStatistics();
    res.json(result);
  } catch (error) {
    console.error('Graph statistics error:', error);
    res.status(500).json({ error: 'Failed to get graph statistics' });
  }
});

// ============================================
// SYSTEMIC CASCADE DETECTION
// ============================================

// GET /api/systemic/alerts - Get active systemic alerts
router.get('/systemic/alerts', async (req, res) => {
  try {
    const result = await cascadeDetectionService.getActiveAlerts();
    res.json({ alerts: result });
  } catch (error) {
    console.error('Systemic alerts error:', error);
    res.status(500).json({ error: 'Failed to get systemic alerts' });
  }
});

// GET /api/systemic/detect - Run full cascade detection
router.get('/systemic/detect', async (req, res) => {
  try {
    const result = await cascadeDetectionService.detectCascades();
    res.json(result);
  } catch (error) {
    console.error('Cascade detection error:', error);
    res.status(500).json({ error: 'Failed to detect cascades' });
  }
});

// ============================================
// STRATEGIC STABILITY INDEX
// ============================================

// GET /api/stability/index - Get strategic stability index
router.get('/stability/index', async (req, res) => {
  try {
    const result = await stabilityIndexService.calculateStabilityIndex();
    res.json(result);
  } catch (error) {
    console.error('Stability index error:', error);
    res.status(500).json({ error: 'Failed to calculate stability index' });
  }
});

// GET /api/stability/snapshot - Get quick stability snapshot
router.get('/stability/snapshot', async (req, res) => {
  try {
    const result = await stabilityIndexService.getQuickSnapshot();
    res.json(result);
  } catch (error) {
    console.error('Stability snapshot error:', error);
    res.status(500).json({ error: 'Failed to get stability snapshot' });
  }
});

// ============================================
// LONG-HORIZON FORECAST
// ============================================

// GET /api/forecast/long-range - Get long-horizon forecast
router.get('/forecast/long-range', async (req, res) => {
  try {
    const { narrativeId, horizonDays } = req.query;
    const days = horizonDays ? parseInt(horizonDays as string) : 14;
    
    if (narrativeId) {
      const result = await longHorizonForecastService.forecastNarrative(narrativeId as string, days);
      if (!result) {
        return res.status(404).json({ error: 'Narrative not found' });
      }
      return res.json(result);
    }
    
    const results = await longHorizonForecastService.generateBulkForecasts(days);
    res.json({ forecasts: results });
  } catch (error) {
    console.error('Long-horizon forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// ============================================
// STRESS TEST ENGINE
// ============================================

// POST /api/system/stress-test - Run stress test
router.post('/system/stress-test', async (req, res) => {
  try {
    const { shockType } = req.body;
    if (!shockType) {
      return res.status(400).json({ error: 'shockType is required' });
    }
    const result = await stressTestEngineService.runStressTest(shockType);
    res.json(result);
  } catch (error) {
    console.error('Stress test error:', error);
    res.status(500).json({ error: 'Failed to run stress test' });
  }
});

// GET /api/system/stress-suite - Run full stress test suite
router.get('/system/stress-suite', async (req, res) => {
  try {
    const result = await stressTestEngineService.runFullStressTestSuite();
    res.json(result);
  } catch (error) {
    console.error('Stress suite error:', error);
    res.status(500).json({ error: 'Failed to run stress test suite' });
  }
});

// GET /api/system/resilience - Get resilience scorecard
router.get('/system/resilience', async (req, res) => {
  try {
    const result = await stressTestEngineService.getResilienceScorecard();
    res.json(result);
  } catch (error) {
    console.error('Resilience scorecard error:', error);
    res.status(500).json({ error: 'Failed to get resilience scorecard' });
  }
});

// ============================================
// COOPERATIVE INTELLIGENCE
// ============================================

// POST /api/intelligence/validate - Validate incoming intelligence
router.post('/intelligence/validate', async (req, res) => {
  try {
    const packet = req.body;
    const result = await cooperativeIntelligenceService.validateIntelligencePacket(packet);
    res.json(result);
  } catch (error) {
    console.error('Intelligence validation error:', error);
    res.status(500).json({ error: 'Failed to validate intelligence' });
  }
});

// POST /api/intelligence/exchange - Process intelligence exchange
router.post('/intelligence/exchange', async (req, res) => {
  try {
    const exchange = req.body;
    const result = await cooperativeIntelligenceService.processIntelligenceExchange(exchange);
    res.json(result);
  } catch (error) {
    console.error('Intelligence exchange error:', error);
    res.status(500).json({ error: 'Failed to process exchange' });
  }
});

// GET /api/intelligence/sources - Get registered intelligence sources
router.get('/intelligence/sources', (req, res) => {
  try {
    const sources = cooperativeIntelligenceService.getRegisteredSources();
    res.json({ sources });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

// POST /api/intelligence/register-source - Register a new source
router.post('/intelligence/register-source', (req, res) => {
  try {
    const { sourceId, name, protocols } = req.body;
    if (!sourceId || !name) {
      return res.status(400).json({ error: 'sourceId and name are required' });
    }
    cooperativeIntelligenceService.registerSource(sourceId, name, protocols);
    res.json({ success: true, message: `Source ${sourceId} registered` });
  } catch (error) {
    console.error('Register source error:', error);
    res.status(500).json({ error: 'Failed to register source' });
  }
});

// ============================================
// ETHICAL CONSTRAINT
// ============================================

// GET /api/ethical/assessment - Get ethical impact assessment
router.get('/ethical/assessment', async (req, res) => {
  try {
    const result = await ethicalConstraintService.assessEthicalImpact();
    res.json(result);
  } catch (error) {
    console.error('Ethical assessment error:', error);
    res.status(500).json({ error: 'Failed to assess ethical impact' });
  }
});

// POST /api/ethical/check - Quick ethical check for intervention
router.post('/ethical/check', async (req, res) => {
  try {
    const { narrativeId, interventionType } = req.body;
    if (!narrativeId || !interventionType) {
      return res.status(400).json({ error: 'narrativeId and interventionType are required' });
    }
    const result = await ethicalConstraintService.quickCheck(narrativeId, interventionType);
    res.json(result);
  } catch (error) {
    console.error('Ethical check error:', error);
    res.status(500).json({ error: 'Failed to perform ethical check' });
  }
});

// ============================================
// META-EVALUATION
// ============================================

// GET /api/meta/score - Get meta-intelligence score
router.get('/meta/score', async (req, res) => {
  try {
    const result = await metaEvaluationService.calculateMetaIntelligenceScore();
    res.json(result);
  } catch (error) {
    console.error('Meta score error:', error);
    res.status(500).json({ error: 'Failed to calculate meta score' });
  }
});

// GET /api/meta/performance - Get performance metrics
router.get('/meta/performance', async (req, res) => {
  try {
    const result = await metaEvaluationService.getPerformanceMetrics();
    res.json(result);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// GET /api/meta/summary - Get meta-evaluation summary
router.get('/meta/summary', async (req, res) => {
  try {
    const result = await metaEvaluationService.getMetaEvaluationSummary();
    res.json(result);
  } catch (error) {
    console.error('Meta summary error:', error);
    res.status(500).json({ error: 'Failed to get meta summary' });
  }
});

// POST /api/meta/log - Log evaluation
router.post('/meta/log', async (req, res) => {
  try {
    await metaEvaluationService.logEvaluation();
    res.json({ success: true, message: 'Evaluation logged' });
  } catch (error) {
    console.error('Log evaluation error:', error);
    res.status(500).json({ error: 'Failed to log evaluation' });
  }
});

export default router;
