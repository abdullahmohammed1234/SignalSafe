import { Router } from 'express';
import { autonomousOrchestrator } from '../services/autonomousOrchestrator.service';
import { policySimulation } from '../services/policySimulation.service';
import { conflictModel } from '../services/conflictModel.service';
import { portfolioAggregation } from '../services/portfolioAggregation.service';
import { auditLedger } from '../services/auditLedger.service';
import { agentCoordinator } from '../services/agentCoordinator.service';
import { overrideEngine } from '../services/overrideEngine.service';
import { confidenceIndex } from '../services/confidenceIndex.service';
import { integrationHub } from '../services/integrationHub.service';

const router = Router();

// ==================== AUTONOMY ROUTES ====================

// GET /api/autonomy/actions - Get all queued/recommended actions
router.get('/autonomy/actions', async (req, res) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;
    const result = await autonomousOrchestrator.getActions(
      status ? { status: status as string } : undefined,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/autonomy/approve/:actionId - Approve an autonomous action
router.post('/autonomy/approve/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { approvedBy, notes } = req.body;
    const result = await autonomousOrchestrator.approveAction(actionId, approvedBy, notes);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/autonomy/reject/:actionId - Reject an autonomous action
router.post('/autonomy/reject/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { rejectedBy, reason } = req.body;
    const result = await autonomousOrchestrator.rejectAction(actionId, rejectedBy, reason);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/autonomy/stats - Get action statistics
router.get('/autonomy/stats', async (req, res) => {
  try {
    const stats = await autonomousOrchestrator.getActionStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/autonomy/run-cycle - Run orchestration cycle
router.post('/autonomy/run-cycle', async (req, res) => {
  try {
    const { riskData, policyConfig } = req.body;
    const result = await autonomousOrchestrator.runOrchestrationCycle(riskData, policyConfig);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POLICY SIMULATION ROUTES ====================

// POST /api/policy/simulate - Run policy simulation
router.post('/policy/simulate', async (req, res) => {
  try {
    const { policyChanges, targetNarratives, simulationHorizon } = req.body;
    const result = await policySimulation.simulate({
      policyChanges,
      targetNarratives,
      simulationHorizon: simulationHorizon || 30,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/policy/templates - Get simulation templates
router.get('/policy/templates', async (req, res) => {
  try {
    const templates = policySimulation.getSimulationTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/policy/configurations - Get all policy configurations
router.get('/policy/configurations', async (req, res) => {
  try {
    const policies = await policySimulation.listPolicies();
    res.json(policies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/policy/configurations - Save policy configuration
router.post('/policy/configurations', async (req, res) => {
  try {
    const config = req.body;
    const result = await policySimulation.savePolicyConfiguration(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/policy/activate/:policyId - Activate a policy
router.post('/policy/activate/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const result = await policySimulation.activatePolicy(policyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONFLICT MODELING ROUTES ====================

// GET /api/conflicts - Get conflict analysis
router.get('/conflicts', async (req, res) => {
  try {
    const { narrativeIds } = req.query;
    const result = await conflictModel.analyzeConflicts(
      narrativeIds ? (narrativeIds as string).split(',') : undefined
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conflicts/high-risk - Get high risk conflicts
router.get('/conflicts/high-risk', async (req, res) => {
  try {
    const { threshold = '0.6' } = req.query;
    const conflicts = await conflictModel.getHighRiskConflicts(parseFloat(threshold as string));
    res.json(conflicts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conflicts/network - Get conflict network data
router.get('/conflicts/network', async (req, res) => {
  try {
    const network = await conflictModel.getConflictNetwork();
    res.json(network);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conflicts/stats - Get conflict statistics
router.get('/conflicts/stats', async (req, res) => {
  try {
    const stats = await conflictModel.getConflictStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PORTFOLIO ROUTES ====================

// GET /api/portfolio/overview - Get portfolio overview
router.get('/portfolio/overview', async (req, res) => {
  try {
    const overview = await portfolioAggregation.getPortfolioOverview();
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/portfolio/history - Get historical snapshots
router.get('/portfolio/history', async (req, res) => {
  try {
    const { limit = '30' } = req.query;
    const history = await portfolioAggregation.getHistoricalSnapshots(parseInt(limit as string));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/portfolio/compare - Compare to historical average
router.get('/portfolio/compare', async (req, res) => {
  try {
    const comparison = await portfolioAggregation.compareToHistorical();
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/portfolio/trends - Get risk trends
router.get('/portfolio/trends', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const trends = await portfolioAggregation.getRiskTrends(parseInt(days as string));
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUDIT ROUTES ====================

// GET /api/audit/history - Get audit history
router.get('/audit/history', async (req, res) => {
  try {
    const { fromDate, toDate, actionTaken, limit = '100', offset = '0' } = req.query;
    const result = await auditLedger.getAuditHistory(
      {
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        actionTaken: actionTaken as string,
      },
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/stats - Get audit statistics
router.get('/audit/stats', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const stats = await auditLedger.getAuditStats(parseInt(days as string));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/critical - Get critical decisions
router.get('/audit/critical', async (req, res) => {
  try {
    const { limit = '20' } = req.query;
    const decisions = await auditLedger.getCriticalDecisions(parseInt(limit as string));
    res.json(decisions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/verify - Verify audit integrity
router.get('/audit/verify', async (req, res) => {
  try {
    const result = await auditLedger.verifyIntegrity();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/audit/log - Log a decision
router.post('/audit/log', async (req, res) => {
  try {
    const record = req.body;
    const result = await auditLedger.logDecision(record);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AGENT ROUTES ====================

// GET /api/system/agents - Get all agent statuses
router.get('/system/agents', async (req, res) => {
  try {
    const agents = await agentCoordinator.getAllAgentStatus();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/system/agents/:agentName - Get specific agent status
router.get('/system/agents/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const agent = await agentCoordinator.getAgentStatus(agentName);
    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/system/agents/:agentName/run - Run specific agent
router.post('/system/agents/:agentName/run', async (req, res) => {
  try {
    const { agentName } = req.params;
    const output = await agentCoordinator.runAgent(agentName);
    res.json(output);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/system/agents/run-all - Run all agents
router.post('/system/agents/run-all', async (req, res) => {
  try {
    const result = await agentCoordinator.runAllAgents();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/system/agents/metrics - Get agent metrics
router.get('/system/agents/metrics', async (req, res) => {
  try {
    const metrics = await agentCoordinator.getAgentMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/system/agents/initialize - Initialize agents
router.post('/system/agents/initialize', async (req, res) => {
  try {
    await agentCoordinator.initializeAgents();
    res.json({ message: 'Agents initialized successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== OVERRIDE ROUTES ====================

// GET /api/overrides - Get override history
router.get('/overrides', async (req, res) => {
  try {
    const { type, fromDate, toDate, limit = '50' } = req.query;
    const overrides = await overrideEngine.getOverrideHistory(
      {
        type: type as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      },
      parseInt(limit as string)
    );
    res.json(overrides);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/overrides/active - Get active overrides
router.get('/overrides/active', async (req, res) => {
  try {
    const overrides = await overrideEngine.getActiveOverrides();
    res.json(overrides);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/overrides/weight - Apply weight adjustment
router.post('/overrides/weight', async (req, res) => {
  try {
    const { targetId, previousValue, newValue, actorId, reason } = req.body;
    const result = await overrideEngine.adjustWeight(targetId, previousValue, newValue, actorId, reason);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/overrides/risk - Override risk score
router.post('/overrides/risk', async (req, res) => {
  try {
    const { targetId, previousRiskScore, newRiskScore, actorId, reason, expiresInHours } = req.body;
    const result = await overrideEngine.overrideRisk(
      targetId, previousRiskScore, newRiskScore, actorId, reason, expiresInHours
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/overrides/freeze - Activate emergency freeze
router.post('/overrides/freeze', async (req, res) => {
  try {
    const { actorId, reason, narrativesAffected } = req.body;
    const result = await overrideEngine.activateEmergencyFreeze(actorId, reason, narrativesAffected);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/overrides/freeze - Deactivate emergency freeze
router.delete('/overrides/freeze', async (req, res) => {
  try {
    const { actorId } = req.body;
    const result = await overrideEngine.deactivateEmergencyFreeze(actorId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/overrides/freeze-state - Get freeze state
router.get('/overrides/freeze-state', async (req, res) => {
  try {
    const state = overrideEngine.getFreezeState();
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/overrides/stats - Get override statistics
router.get('/overrides/stats', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const stats = await overrideEngine.getOverrideStats(parseInt(days as string));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONFIDENCE ROUTES ====================

// GET /api/confidence - Get strategic confidence index
router.get('/confidence', async (req, res) => {
  try {
    const confidence = await confidenceIndex.calculateConfidenceIndex();
    res.json(confidence);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/confidence/trend - Get confidence trend
router.get('/confidence/trend', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const trend = await confidenceIndex.getConfidenceTrend(parseInt(days as string));
    res.json(trend);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/confidence/by-category - Get confidence by category
router.get('/confidence/by-category', async (req, res) => {
  try {
    const byCategory = await confidenceIndex.getConfidenceByCategory();
    res.json(byCategory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/confidence/thresholds - Get confidence thresholds
router.get('/confidence/thresholds', async (req, res) => {
  try {
    const thresholds = confidenceIndex.getThresholds();
    res.json(thresholds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INTEGRATION ROUTES ====================

// GET /api/integrations - Get all integrations
router.get('/integrations', async (req, res) => {
  try {
    const integrations = await integrationHub.getIntegrations();
    res.json(integrations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations - Register integration
router.post('/integrations', async (req, res) => {
  try {
    const config = req.body;
    const result = await integrationHub.registerIntegration(config);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations/:integrationId/toggle - Toggle integration
router.post('/integrations/:integrationId/toggle', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { enabled } = req.body;
    const result = await integrationHub.toggleIntegration(integrationId, enabled);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/integrations/:integrationId - Delete integration
router.delete('/integrations/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const result = await integrationHub.deleteIntegration(integrationId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations/webhook - Send webhook
router.post('/integrations/webhook/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { event, data } = req.body;
    const result = await integrationHub.sendWebhook(integrationId, event, data);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations/test/:integrationId - Test integration
router.post('/integrations/test/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const result = await integrationHub.testIntegration(integrationId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/integrations/stats - Get integration statistics
router.get('/integrations/stats', async (req, res) => {
  try {
    const stats = integrationHub.getIntegrationStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/integrations/types - Get available integration types
router.get('/integrations/types', async (req, res) => {
  try {
    const types = integrationHub.getAvailableTypes();
    res.json(types);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/integrations/webhook-history - Get webhook history
router.get('/integrations/webhook-history', async (req, res) => {
  try {
    const { limit = '50' } = req.query;
    const history = integrationHub.getWebhookHistory(parseInt(limit as string));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
