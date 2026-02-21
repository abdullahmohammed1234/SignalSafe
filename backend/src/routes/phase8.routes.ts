/**
 * PHASE 8 ROUTES
 * Self-Evolving Intelligence Architecture + Global Digital Twin Framework
 */

import { Router } from 'express';
const router = Router();

// Import all Phase 8 services
import * as architectureEvolution from '../services/architectureEvolution.service';
import * as intelligenceGenome from '../services/intelligenceGenome.service';
import * as digitalTwinEngine from '../services/digitalTwinEngine.service';
import * as recursiveOptimization from '../services/recursiveOptimization.service';
import * as institutionalMemory from '../services/institutionalMemory.service';
import * as federatedGrid from '../services/federatedGrid.service';
import * as cognitiveLayer from '../services/cognitiveLayer.service';
import * as scenarioGenerator from '../services/scenarioGenerator.service';
import * as integrityLayer from '../services/integrityLayer.service';
import * as strategicConsciousness from '../services/strategicConsciousness.service';

// ============================================
// ARCHITECTURE EVOLUTION ROUTES
// ============================================

// GET /api/system/architecture - Get current architecture
router.get('/system/architecture', async (req, res) => {
  try {
    const architecture = await architectureEvolution.getArchitecture();
    res.json(architecture);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get architecture' });
  }
});

// GET /api/system/architecture/history - Get architecture history
router.get('/system/architecture/history', async (req, res) => {
  try {
    const history = await architectureEvolution.getArchitectureHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get architecture history' });
  }
});

// POST /api/system/architecture/evolve - Evolve architecture
router.post('/system/architecture/evolve', async (req, res) => {
  try {
    const { triggerReason, targetAnomalyModel, targetEnsembleWeighting, targetSimulationDepth, featureModifications } = req.body;
    const result = await architectureEvolution.evolveArchitecture({
      triggerReason,
      targetAnomalyModel,
      targetEnsembleWeighting,
      targetSimulationDepth,
      featureModifications
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evolve architecture' });
  }
});

// POST /api/system/architecture/simulate - Simulate architecture change
router.post('/system/architecture/simulate', async (req, res) => {
  try {
    const { triggerReason, targetAnomalyModel, targetSimulationDepth } = req.body;
    const result = await architectureEvolution.simulateArchitectureChange({
      triggerReason,
      targetAnomalyModel,
      targetSimulationDepth
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate architecture change' });
  }
});

// GET /api/system/architecture/models - Get available model types
router.get('/system/architecture/models', async (req, res) => {
  try {
    const models = architectureEvolution.getAvailableModelTypes();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get model types' });
  }
});

// POST /api/system/architecture/check-evolution - Check if evolution is needed
router.post('/system/architecture/check-evolution', async (req, res) => {
  try {
    const { metaIntelligenceScore, driftCycles, stressResilienceScore } = req.body;
    const result = await architectureEvolution.checkEvolutionNeeded(
      metaIntelligenceScore || 0.7,
      driftCycles || 0,
      stressResilienceScore || 0.75
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check evolution' });
  }
});

// ============================================
// INTELLIGENCE GENOME ROUTES
// ============================================

// GET /api/genome/current - Get current genome
router.get('/genome/current', async (req, res) => {
  try {
    const genome = await intelligenceGenome.getCurrentGenome();
    res.json(genome);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get current genome' });
  }
});

// GET /api/genome/all - Get all genomes
router.get('/genome/all', async (req, res) => {
  try {
    const genomes = await intelligenceGenome.getAllGenomes();
    res.json(genomes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get genomes' });
  }
});

// GET /api/genome/lineage - Get genome lineage tree
router.get('/genome/lineage', async (req, res) => {
  try {
    const lineage = await intelligenceGenome.getGenomeLineageTree();
    res.json(lineage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get genome lineage' });
  }
});

// GET /api/genome/statistics - Get genome statistics
router.get('/genome/statistics', async (req, res) => {
  try {
    const stats = await intelligenceGenome.getGenomeStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get genome statistics' });
  }
});

// POST /api/genome/variant - Create genome variant
router.post('/genome/variant', async (req, res) => {
  try {
    const { parentGenomeId, modifications, branchName } = req.body;
    const variant = await intelligenceGenome.createGenomeVariant(
      parentGenomeId || 'genome-v1.0',
      modifications || {},
      branchName
    );
    res.json(variant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create genome variant' });
  }
});

// ============================================
// DIGITAL TWIN ROUTES
// ============================================

// GET /api/twin/state - Get twin state
router.get('/twin/state', async (req, res) => {
  try {
    const state = await digitalTwinEngine.getTwinState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get twin state' });
  }
});

// GET /api/twin/analytics - Get twin analytics
router.get('/twin/analytics', async (req, res) => {
  try {
    const analytics = await digitalTwinEngine.getTwinAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get twin analytics' });
  }
});

// POST /api/twin/snapshot - Take snapshot
router.post('/twin/snapshot', async (req, res) => {
  try {
    const { label } = req.body;
    const snapshot = await digitalTwinEngine.takeSnapshot(label);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to take snapshot' });
  }
});

// GET /api/twin/snapshots - Get snapshots
router.get('/twin/snapshots', async (req, res) => {
  try {
    const snapshots = await digitalTwinEngine.getSnapshots(20);
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get snapshots' });
  }
});

// POST /api/twin/rewind - Rewind to snapshot
router.post('/twin/rewind', async (req, res) => {
  try {
    const { snapshotId } = req.body;
    const state = await digitalTwinEngine.rewindToSnapshot(snapshotId);
    if (state) {
      res.json(state);
    } else {
      res.status(404).json({ error: 'Snapshot not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to rewind' });
  }
});

// POST /api/twin/project - Project forward
router.post('/twin/project', async (req, res) => {
  try {
    const { hours } = req.body;
    const projected = await digitalTwinEngine.projectForward(hours || 24);
    res.json(projected);
  } catch (error) {
    res.status(500).json({ error: 'Failed to project' });
  }
});

// POST /api/twin/inject-scenario - Inject scenario
router.post('/twin/inject-scenario', async (req, res) => {
  try {
    const { scenarioType, parameters } = req.body;
    const result = await digitalTwinEngine.injectScenario({
      scenarioId: `inj-${Date.now()}`,
      scenarioType,
      parameters: parameters || {},
      injectionPoint: 'current',
      expectedOutcome: 'Test scenario injection'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to inject scenario' });
  }
});

// ============================================
// RECURSIVE OPTIMIZATION ROUTES
// ============================================

// GET /api/optimization/history - Get optimization history
router.get('/optimization/history', async (req, res) => {
  try {
    const history = await recursiveOptimization.getOptimizationHistory(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get optimization history' });
  }
});

// GET /api/optimization/stats - Get optimization statistics
router.get('/optimization/stats', async (req, res) => {
  try {
    const stats = await recursiveOptimization.getOptimizationStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get optimization stats' });
  }
});

// GET /api/optimization/pending - Get pending approvals
router.get('/optimization/pending', async (req, res) => {
  try {
    const pending = await recursiveOptimization.getPendingApprovals();
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending approvals' });
  }
});

// POST /api/optimization/run - Run full optimization cycle
router.post('/optimization/run', async (req, res) => {
  try {
    const result = await recursiveOptimization.runFullOptimizationCycle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run optimization cycle' });
  }
});

// ============================================
// INSTITUTIONAL MEMORY ROUTES
// ============================================

// GET /api/memory/lessons - Get all lessons
router.get('/memory/lessons', async (req, res) => {
  try {
    const lessons = await institutionalMemory.getAllLessons(50);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get lessons' });
  }
});

// GET /api/memory/statistics - Get memory statistics
router.get('/memory/statistics', async (req, res) => {
  try {
    const stats = await institutionalMemory.getMemoryStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memory statistics' });
  }
});

// GET /api/memory/patterns - Get learned patterns
router.get('/memory/patterns', async (req, res) => {
  try {
    const patterns = await institutionalMemory.getLearnedPatterns();
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get patterns' });
  }
});

// ============================================
// FEDERATED GRID ROUTES
// ============================================

// GET /api/federation/status - Get federation status
router.get('/federation/status', async (req, res) => {
  try {
    const status = await federatedGrid.getFederationStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get federation status' });
  }
});

// GET /api/federation/nodes - Get all nodes
router.get('/federation/nodes', async (req, res) => {
  try {
    const nodes = await federatedGrid.getAllNodes();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get nodes' });
  }
});

// GET /api/federation/consensus - Get consensus history
router.get('/federation/consensus', async (req, res) => {
  try {
    const consensus = await federatedGrid.getConsensusHistory(20);
    res.json(consensus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consensus history' });
  }
});

// ============================================
// COGNITIVE LAYER ROUTES
// ============================================

// GET /api/cognitive/layers - Get all layer statuses
router.get('/cognitive/layers', async (req, res) => {
  try {
    const layers = await cognitiveLayer.getAllLayerStatuses();
    res.json(layers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get layer statuses' });
  }
});

// GET /api/cognitive/health - Get overall cognitive health
router.get('/cognitive/health', async (req, res) => {
  try {
    const health = await cognitiveLayer.getOverallCognitiveHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cognitive health' });
  }
});

// GET /api/cognitive/pipeline - Get layer pipeline flow
router.get('/cognitive/pipeline', async (req, res) => {
  try {
    const pipeline = await cognitiveLayer.getLayerPipelineFlow();
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pipeline flow' });
  }
});

// ============================================
// SCENARIO GENERATOR ROUTES
// ============================================

// GET /api/scenarios - Get generated scenarios
router.get('/scenarios', async (req, res) => {
  try {
    const scenarios = await scenarioGenerator.getGeneratedScenarios(20);
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scenarios' });
  }
});

// GET /api/scenarios/templates - Get scenario templates
router.get('/scenarios/templates', async (req, res) => {
  try {
    const templates = await scenarioGenerator.getScenarioTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// GET /api/scenarios/statistics - Get scenario statistics
router.get('/scenarios/statistics', async (req, res) => {
  try {
    const stats = await scenarioGenerator.getScenarioStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scenario statistics' });
  }
});

// POST /api/scenarios/generate - Generate new scenario
router.post('/scenarios/generate', async (req, res) => {
  try {
    const { scenarioType } = req.body;
    const scenario = await scenarioGenerator.generateScenario(scenarioType);
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate scenario' });
  }
});

// POST /api/scenarios/add-to-lab - Add scenario to stress lab
router.post('/scenarios/add-to-lab', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const result = await scenarioGenerator.addToStressLab(scenarioId);
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Scenario not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to stress lab' });
  }
});

// ============================================
// INTEGRITY LAYER ROUTES
// ============================================

// GET /api/system/integrity - Get integrity report
router.get('/system/integrity', async (req, res) => {
  try {
    const report = await integrityLayer.getIntegrityReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integrity report' });
  }
});

// GET /api/system/integrity/summary - Get integrity summary
router.get('/system/integrity/summary', async (req, res) => {
  try {
    const summary = await integrityLayer.getIntegritySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integrity summary' });
  }
});

// GET /api/system/integrity/checks - Get integrity checks
router.get('/system/integrity/checks', async (req, res) => {
  try {
    const checks = await integrityLayer.getIntegrityChecks(20);
    res.json(checks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integrity checks' });
  }
});

// GET /api/system/governance - Get governance status
router.get('/system/governance', async (req, res) => {
  try {
    const status = await integrityLayer.getGovernanceStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get governance status' });
  }
});

// ============================================
// STRATEGIC CONSCIOUSNESS ROUTES
// ============================================

// GET /api/consciousness - Get consciousness report
router.get('/consciousness', async (req, res) => {
  try {
    const report = await strategicConsciousness.generateConsciousnessReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consciousness report' });
  }
});

// GET /api/consciousness/snapshot - Get real-time snapshot
router.get('/consciousness/snapshot', async (req, res) => {
  try {
    const snapshot = await strategicConsciousness.getConsciousnessSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consciousness snapshot' });
  }
});

// GET /api/consciousness/components - Get component breakdown
router.get('/consciousness/components', async (req, res) => {
  try {
    const components = await strategicConsciousness.getComponentBreakdown();
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get components' });
  }
});

// GET /api/consciousness/history - Get consciousness history
router.get('/consciousness/history', async (req, res) => {
  try {
    const history = await strategicConsciousness.getConsciousnessHistory(24);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consciousness history' });
  }
});

// GET /api/consciousness/alerts - Get consciousness alerts
router.get('/consciousness/alerts', async (req, res) => {
  try {
    const alerts = await strategicConsciousness.getConsciousnessAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consciousness alerts' });
  }
});

// ============================================
// MASTER PHASE 8 CYCLE ROUTE
// ============================================

// POST /api/phase8/cycle - Run full Phase 8 system loop
router.post('/phase8/cycle', async (req, res) => {
  try {
    const results = {
      timestamp: new Date(),
      digitalTwin: await digitalTwinEngine.getTwinState(),
      consciousness: await strategicConsciousness.generateConsciousnessReport(),
      cognitiveHealth: await cognitiveLayer.getOverallCognitiveHealth(),
      federationStatus: await federatedGrid.getFederationStatus(),
      integrity: await integrityLayer.getIntegrityReport(),
      optimization: await recursiveOptimization.runFullOptimizationCycle()
    };
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run Phase 8 cycle' });
  }
});

export default router;
