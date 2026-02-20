import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface AgentStatus {
  agentName: string;
  lastRun: Date;
  performanceScore: number; // 0-1
  reliabilityScore: number; // 0-1
  currentLoad: number; // 0-1
  status: 'active' | 'idle' | 'error' | 'maintenance';
  outputs: AgentOutput[];
}

export interface AgentOutput {
  timestamp: Date;
  outputType: string;
  data: any;
  confidence: number;
}

export interface AgentDocument extends AgentStatus, Document {}

// ============== SCHEMA ==============
const AgentOutputSchema = new Schema({
  timestamp: { type: Date, required: true },
  outputType: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  confidence: { type: Number, required: true },
});

const AgentSchema = new Schema<AgentDocument>({
  agentName: { type: String, required: true, unique: true },
  lastRun: { type: Date, required: true },
  performanceScore: { type: Number, required: true, min: 0, max: 1 },
  reliabilityScore: { type: Number, required: true, min: 0, max: 1 },
  currentLoad: { type: Number, required: true, min: 0, max: 1 },
  status: { type: String, enum: ['active', 'idle', 'error', 'maintenance'], default: 'idle' },
  outputs: [AgentOutputSchema],
});

AgentSchema.index({ status: 1 });
AgentSchema.index({ performanceScore: -1 });

export const AgentModel = mongoose.model<AgentDocument>('Agent', AgentSchema);

// ============== SERVICE ==============
export class AgentCoordinatorService {

  /**
   * Initialize all agents
   */
  async initializeAgents(): Promise<void> {
    const agents = [
      'RiskAgent',
      'DriftAgent',
      'ForecastAgent',
      'StrategyAgent',
      'PolicyAgent',
      'PortfolioAgent',
    ];

    for (const agentName of agents) {
      const existing = await AgentModel.findOne({ agentName });
      if (!existing) {
        await AgentModel.create({
          agentName,
          lastRun: new Date(),
          performanceScore: 0.85,
          reliabilityScore: 0.9,
          currentLoad: 0,
          status: 'idle',
          outputs: [],
        });
      }
    }
  }

  /**
   * Get status of all agents
   */
  async getAllAgentStatus(): Promise<AgentStatus[]> {
    return await AgentModel.find().sort({ agentName: 1 });
  }

  /**
   * Get specific agent status
   */
  async getAgentStatus(agentName: string): Promise<AgentStatus | null> {
    return await AgentModel.findOne({ agentName });
  }

  /**
   * Run specific agent
   */
  async runAgent(agentName: string): Promise<AgentOutput> {
    const agent = await AgentModel.findOne({ agentName });
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    // Simulate agent execution
    const output = await this.executeAgentLogic(agentName);
    
    // Update agent status
    agent.lastRun = new Date();
    agent.currentLoad = Math.max(0, agent.currentLoad - 0.3);
    agent.status = 'active';
    agent.outputs.push(output);
    
    // Keep only last 50 outputs
    if (agent.outputs.length > 50) {
      agent.outputs = agent.outputs.slice(-50);
    }
    
    await agent.save();
    
    return output;
  }

  /**
   * Execute agent-specific logic
   */
  private async executeAgentLogic(agentName: string): Promise<AgentOutput> {
    let outputType = '';
    let data: any = {};
    let confidence = 0.85;

    switch (agentName) {
      case 'RiskAgent':
        outputType = 'risk_assessment';
        data = {
          overallRisk: 0.45 + Math.random() * 0.2,
          highRiskNarratives: Math.floor(Math.random() * 5),
          recommendations: ['Monitor closely', 'Consider intervention'],
        };
        confidence = 0.88;
        break;

      case 'DriftAgent':
        outputType = 'drift_analysis';
        data = {
          driftDetected: Math.random() > 0.7,
          driftMagnitude: Math.random() * 0.3,
          affectedFeatures: ['sentiment', 'topic_distribution'],
        };
        confidence = 0.82;
        break;

      case 'ForecastAgent':
        outputType = 'forecast';
        data = {
          predictedRisk: 0.4 + Math.random() * 0.3,
          confidenceInterval: [0.3, 0.6],
          horizon: '7d',
        };
        confidence = 0.75;
        break;

      case 'StrategyAgent':
        outputType = 'strategy_recommendation';
        data = {
          recommendedActions: ['increase_moderation', 'deploy_counter_narrative'],
          priority: 'high',
          estimatedImpact: 0.35,
        };
        confidence = 0.8;
        break;

      case 'PolicyAgent':
        outputType = 'policy_compliance';
        data = {
          complianceScore: 0.9 + Math.random() * 0.1,
          violations: [],
          recommendations: ['Maintain current policy'],
        };
        confidence = 0.95;
        break;

      case 'PortfolioAgent':
        outputType = 'portfolio_analysis';
        data = {
          totalExposure: 50 + Math.random() * 30,
          systemicRisk: 0.3 + Math.random() * 0.3,
          diversificationIndex: 0.6 + Math.random() * 0.3,
        };
        confidence = 0.85;
        break;

      default:
        outputType = 'unknown';
        data = { message: 'Unknown agent' };
        confidence = 0;
        break;
    }

    return {
      timestamp: new Date(),
      outputType,
      data,
      confidence,
    };
  }

  /**
   * Run all agents
   */
  async runAllAgents(): Promise<{ results: Record<string, AgentOutput>; timestamp: Date }> {
    const results: Record<string, AgentOutput> = {};
    const agents = await AgentModel.find();
    
    for (const agent of agents) {
      try {
        const output = await this.runAgent(agent.agentName);
        results[agent.agentName] = output;
        
        // Update performance score based on successful execution
        agent.performanceScore = Math.min(1, agent.performanceScore + 0.01);
        await agent.save();
      } catch (error) {
        // Update reliability score on failure
        agent.reliabilityScore = Math.max(0, agent.reliabilityScore - 0.1);
        agent.status = 'error';
        await agent.save();
      }
    }

    return { results, timestamp: new Date() };
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentName: string,
    updates: Partial<Pick<AgentStatus, 'status' | 'currentLoad' | 'performanceScore' | 'reliabilityScore'>>
  ): Promise<AgentStatus | null> {
    return await AgentModel.findOneAndUpdate(
      { agentName },
      { $set: updates },
      { new: true }
    );
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(): Promise<{
    avgPerformance: number;
    avgReliability: number;
    activeAgents: number;
    agentsByStatus: Record<string, number>;
  }> {
    const agents = await AgentModel.find();
    
    const avgPerformance = agents.reduce((sum, a) => sum + a.performanceScore, 0) / agents.length;
    const avgReliability = agents.reduce((sum, a) => sum + a.reliabilityScore, 0) / agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    
    const agentsByStatus: Record<string, number> = {};
    agents.forEach(a => {
      agentsByStatus[a.status] = (agentsByStatus[a.status] || 0) + 1;
    });

    return {
      avgPerformance: Math.round(avgPerformance * 100) / 100,
      avgReliability: Math.round(avgReliability * 100) / 100,
      activeAgents,
      agentsByStatus,
    };
  }

  /**
   * Get agent recent outputs
   */
  async getAgentOutputs(agentName: string, limit = 10): Promise<AgentOutput[]> {
    const agent = await AgentModel.findOne({ agentName });
    if (!agent) return [];
    return agent.outputs.slice(-limit);
  }

  /**
   * Set agent to maintenance mode
   */
  async setMaintenanceMode(agentName: string): Promise<AgentStatus | null> {
    return await AgentModel.findOneAndUpdate(
      { agentName },
      { $set: { status: 'maintenance' } },
      { new: true }
    );
  }

  /**
   * Bring agent out of maintenance
   */
  async resumeAgent(agentName: string): Promise<AgentStatus | null> {
    return await AgentModel.findOneAndUpdate(
      { agentName },
      { $set: { status: 'idle' } },
      { new: true }
    );
  }
}

export const agentCoordinator = new AgentCoordinatorService();
