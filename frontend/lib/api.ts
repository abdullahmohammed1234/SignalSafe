const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface RiskSnapshot {
  _id: string;
  overallRiskScore: number;
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
  classification: 'Stable' | 'Emerging Concern' | 'Escalation Risk' | 'Panic Formation Likely';
  timestamp: string;
}

export interface Cluster {
  _id: string;
  clusterId: string;
  keywords: string[];
  size: number;
  avgSentiment: number;
  growthRate: number;
  volatilityIndex: number;
  lastUpdated: string;
}

export interface Narrative {
  _id: string;
  clusterId: string;
  firstDetectedAt: string;
  lifecycleStage: 'Emerging' | 'Accelerating' | 'Peak' | 'Declining';
  peakRiskScore: number;
  growthVelocity: number;
  decayRate: number;
  timeToPeakPrediction: number | null;
  confidenceScore: number;
  history: {
    timestamp: string;
    riskScore: number;
    clusterSize: number;
    avgSentiment: number;
  }[];
  lastUpdated: string;
}

export interface Prediction {
  clusterId: string;
  timeToPeakPrediction: number | null;
  predictedPeakTime: string | null;
  growthVelocity: number;
  isReliable: boolean;
}

export interface Confidence {
  clusterId: string;
  confidenceScore: number;
  sentimentVariance: number;
  growthVariance: number;
  anomalyStability: number;
}

export interface Baseline {
  meanRisk: number;
  stdDev: number;
  currentRisk: number;
  deviationFromBaseline: number;
  timestamp: string;
}

export interface RiskHistory {
  _id: string;
  timestamp: string;
  overallRiskScore: number;
  clusterCount: number;
  anomalyScore: number;
}

export interface IngestPost {
  text: string;
  source: string;
  region: string;
}

// ======== PHASE 3 INTERFACES ========

export interface RegionalRisk {
  _id: string;
  region: string;
  country: string;
  state: string | null;
  city: string | null;
  riskScore: number;
  clusterCount: number;
  anomalyScore: number;
  dominantNarrativeId: string | null;
  deviationFromBaseline: number;
  sentimentTrend: number;
  growthRate: number;
  postVolume: number;
  timestamp: string;
}

export interface NarrativeInteraction {
  _id: string;
  narrativeA: string;
  narrativeB: string;
  interactionScore: number;
  amplificationEffect: number;
  similarityScore: number;
  lastDetected: string;
  isActive: boolean;
  detectionCount: number;
}

export interface InterventionRecommendation {
  clusterId: string;
  recommendedAction: 'Monitor' | 'Preemptive Communication' | 'Escalate to Authority' | 'Deploy Counter-Narrative';
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  timeToPeakPrediction: number | null;
  confidenceScore: number;
  interactionScore: number;
  riskEscalation: number;
  timestamp: string;
}

export interface ModelPerformanceRecord {
  _id: string;
  timestamp: string;
  MAE: number;
  RMSE: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  confidenceCalibrationError: number;
  testType: 'backtest' | 'adversarial' | 'live';
  samplesTested: number;
  modelVersion: string;
  averagePredictionTime: number;
}

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

export interface AdversarialScenario {
  name: string;
  type: string;
  description: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    latency: number;
    collections: {
      posts: number;
      clusters: number;
      narratives: number;
      riskSnapshots: number;
      regionalRisks: number;
    };
  };
  services: {
    queue: { status: string; queueLength: number };
    websocket: { status: string; connectedClients: number };
    ai: { status: string; latency: number };
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  data: {
    latestPostTimestamp: string | null;
    latestRiskTimestamp: string | null;
    activeNarratives: number;
    totalPosts24h: number;
  };
}

export const api = {
  async getCurrentRisk(): Promise<RiskSnapshot | null> {
    try {
      const response = await fetch(`${API_URL}/api/risk/current`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch risk');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching current risk:', error);
      return null;
    }
  },

  async getClusters(): Promise<Cluster[]> {
    try {
      const response = await fetch(`${API_URL}/api/clusters`);
      if (!response.ok) {
        throw new Error('Failed to fetch clusters');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching clusters:', error);
      return [];
    }
  },

  async ingestPosts(posts: IngestPost[]): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts }),
      });
      if (!response.ok) {
        throw new Error('Failed to ingest posts');
      }
      return await response.json();
    } catch (error) {
      console.error('Error ingesting posts:', error);
      throw error;
    }
  },

  async startSimulator(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start simulator');
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting simulator:', error);
      throw error;
    }
  },

  async stopSimulator(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to stop simulator');
      }
      return await response.json();
    } catch (error) {
      console.error('Error stopping simulator:', error);
      throw error;
    }
  },

  async getSimulatorStatus(): Promise<{ running: boolean; escalationLevel: number; phase: string }> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/status`);
      if (!response.ok) {
        throw new Error('Failed to get simulator status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting simulator status:', error);
      return { running: false, escalationLevel: 0, phase: 'stable' };
    }
  },

  async triggerPanicEvent(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/panic-event`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger panic event');
      }
      return await response.json();
    } catch (error) {
      console.error('Error triggering panic event:', error);
      throw error;
    }
  },

  // Narrative endpoints
  async getNarratives(): Promise<Narrative[]> {
    try {
      const response = await fetch(`${API_URL}/api/narratives`);
      if (!response.ok) {
        throw new Error('Failed to fetch narratives');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching narratives:', error);
      return [];
    }
  },

  async getNarrativeById(clusterId: string): Promise<{
    narrative: Narrative;
    prediction: Prediction | null;
    confidence: Confidence | null;
    trajectory: { currentRisk: number; predictions: { interval: number; predictedRisk: number }[] } | null;
  } | null> {
    try {
      const response = await fetch(`${API_URL}/api/narratives/${clusterId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch narrative');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching narrative:', error);
      return null;
    }
  },

  // Risk history and baseline
  async getRiskHistory(limit: number = 50): Promise<RiskHistory[]> {
    try {
      const response = await fetch(`${API_URL}/api/risk/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk history');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching risk history:', error);
      return [];
    }
  },

  async getBaseline(): Promise<Baseline | null> {
    try {
      const response = await fetch(`${API_URL}/api/risk/baseline`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch baseline');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching baseline:', error);
      return null;
    }
  },

  async getBaselineHistory(hoursBack: number = 24): Promise<{
    baseline: Baseline | null;
    history: RiskHistory[];
  }> {
    try {
      const response = await fetch(`${API_URL}/api/risk/baseline/history?hours=${hoursBack}`);
      if (!response.ok) {
        throw new Error('Failed to fetch baseline history');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching baseline history:', error);
      return { baseline: null, history: [] };
    }
  },

  // ======== PHASE 3 APIS ========

  // Regional Risk APIs
  async getRegionalRisks(): Promise<RegionalRisk[]> {
    try {
      const response = await fetch(`${API_URL}/api/risk/regions`);
      if (!response.ok) throw new Error('Failed to fetch regional risks');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching regional risks:', error);
      return [];
    }
  },

  async refreshRegionalRisks(): Promise<RegionalRisk[]> {
    try {
      const response = await fetch(`${API_URL}/api/risk/regions/refresh`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to refresh regional risks');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error refreshing regional risks:', error);
      return [];
    }
  },

  // Narrative Interaction APIs
  async getInteractions(): Promise<NarrativeInteraction[]> {
    try {
      const response = await fetch(`${API_URL}/api/interactions`);
      if (!response.ok) throw new Error('Failed to fetch interactions');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching interactions:', error);
      return [];
    }
  },

  async detectInteractions(): Promise<NarrativeInteraction[]> {
    try {
      const response = await fetch(`${API_URL}/api/interactions/detect`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to detect interactions');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error detecting interactions:', error);
      return [];
    }
  },

  // Intervention Recommendation APIs
  async getInterventions(): Promise<InterventionRecommendation[]> {
    try {
      const response = await fetch(`${API_URL}/api/interventions`);
      if (!response.ok) throw new Error('Failed to fetch interventions');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching interventions:', error);
      return [];
    }
  },

  async getHighPriorityInterventions(): Promise<InterventionRecommendation[]> {
    try {
      const response = await fetch(`${API_URL}/api/interventions/high-priority`);
      if (!response.ok) throw new Error('Failed to fetch high priority interventions');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching high priority interventions:', error);
      return [];
    }
  },

  async getInterventionByNarrative(clusterId: string): Promise<InterventionRecommendation | null> {
    try {
      const response = await fetch(`${API_URL}/api/interventions/narrative/${clusterId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching narrative intervention:', error);
      return null;
    }
  },

  // Model Performance APIs
  async runBacktest(hoursBack: number = 168): Promise<BacktestResult | null> {
    try {
      const response = await fetch(`${API_URL}/api/model/backtest?hours=${hoursBack}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to run backtest');
      return await response.json();
    } catch (error) {
      console.error('Error running backtest:', error);
      return null;
    }
  },

  async getModelPerformance(limit: number = 50): Promise<ModelPerformanceRecord[]> {
    try {
      const response = await fetch(`${API_URL}/api/model/performance?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch model performance');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching model performance:', error);
      return [];
    }
  },

  async getLatestModelPerformance(): Promise<ModelPerformanceRecord | null> {
    try {
      const response = await fetch(`${API_URL}/api/model/performance/latest`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest model performance:', error);
      return null;
    }
  },

  // Adversarial Simulation APIs
  async runAdversarialSimulation(scenarioType: string, intensity: number = 0.7): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/adversarial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType, intensity }),
      });
      if (!response.ok) throw new Error('Failed to run adversarial simulation');
      return await response.json();
    } catch (error) {
      console.error('Error running adversarial simulation:', error);
      throw error;
    }
  },

  async getAdversarialScenarios(): Promise<AdversarialScenario[]> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/adversarial/scenarios`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching adversarial scenarios:', error);
      return [];
    }
  },

  // System Health API
  async getSystemHealth(): Promise<SystemHealth | null> {
    try {
      const response = await fetch(`${API_URL}/api/system/health`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching system health:', error);
      return null;
    }
  },

  // ==================== PHASE 4: RESEARCH-GRADE AI APIs ====================

  // Ensemble Risk APIs
  async getEnsembleRisk(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/ensemble`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching ensemble risk:', error);
      return null;
    }
  },

  async getEnsembleSummary(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/ensemble/summary`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching ensemble summary:', error);
      return null;
    }
  },

  // Calibration APIs
  async getCalibrationMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/calibration`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching calibration metrics:', error);
      return null;
    }
  },

  async getReliabilityDiagram(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/calibration/reliability`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching reliability diagram:', error);
      return null;
    }
  },

  async getCalibrationStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/calibration/status`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching calibration status:', error);
      return null;
    }
  },

  // Causal Attribution APIs
  async getCausalAttribution(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/attribution`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching causal attribution:', error);
      return null;
    }
  },

  // Uncertainty APIs
  async getUncertaintyMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/uncertainty`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching uncertainty metrics:', error);
      return null;
    }
  },

  // Executive Summary APIs
  async getExecutiveSummary(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/executive`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching executive summary:', error);
      return null;
    }
  },

  async getExecutiveBrief(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/executive/brief`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching executive brief:', error);
      return null;
    }
  },

  // System Metrics APIs
  async getSystemMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/system/metrics`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return null;
    }
  },

  async getSystemHealthSummary(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/system/health`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system health summary:', error);
      return null;
    }
  },

  async getSystemAlerts(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/phase4/system/alerts`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return null;
    }
  },

  // Scenario Replay APIs
  async getReplayEvents(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/replay`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching replay events:', error);
      return [];
    }
  },

  async getReplayEvent(eventId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching replay event:', error);
      return null;
    }
  },

  async startReplay(eventId: string, speed: number = 1): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}/start?speed=${speed}`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error starting replay:', error);
      return null;
    }
  },

  async getReplayState(eventId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}/state`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching replay state:', error);
      return null;
    }
  },

  async stepReplayForward(eventId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}/step/forward`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error stepping replay forward:', error);
      return null;
    }
  },

  async toggleReplayPlay(eventId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}/play`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error toggling replay play:', error);
      return null;
    }
  },

  async stopReplay(eventId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/replay/${eventId}/stop`, { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error('Error stopping replay:', error);
      return false;
    }
  },

  // ======== PHASE 5: AUTONOMOUS INTELLIGENCE ========

  // Model Drift APIs
  async getDriftStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/drift`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching drift status:', error);
      return null;
    }
  },

  async detectDrift(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/drift/detect`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error detecting drift:', error);
      return null;
    }
  },

  async getDriftHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/model/drift/history?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching drift history:', error);
      return [];
    }
  },

  // Model Version & Retraining APIs
  async getModelVersion(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/version`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching model version:', error);
      return null;
    }
  },

  async retrainModel(reason?: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error retraining model:', error);
      return null;
    }
  },

  async getRetrainStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/retrain/status`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching retrain status:', error);
      return null;
    }
  },

  // Adaptive Weights APIs
  async getEnsembleWeights(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/weights`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching ensemble weights:', error);
      return null;
    }
  },

  async adaptWeights(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/model/weights/adapt`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error adapting weights:', error);
      return null;
    }
  },

  async getWeightsHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/model/weights/history?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching weights history:', error);
      return [];
    }
  },

  // Counterfactual Simulation APIs
  async runSimulation(params: {
    interventionType: string;
    timeShiftMinutes?: number;
    strength?: number;
    targetClusterId?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error running simulation:', error);
      return null;
    }
  },

  async compareInterventions(risk: number = 50, timeShift: number = -30): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/interventions/compare?risk=${risk}&timeShift=${timeShift}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error comparing interventions:', error);
      return null;
    }
  },

  async getOptimalIntervention(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/optimal`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching optimal intervention:', error);
      return null;
    }
  },

  async getTimingEffectiveness(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/timing`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching timing effectiveness:', error);
      return [];
    }
  },

  async getSimulationHistory(limit: number = 20): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/simulate/history?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching simulation history:', error);
      return [];
    }
  },

  // Strategy Optimizer APIs
  async getStrategicRecommendations(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/strategy/recommendations`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching strategic recommendations:', error);
      return null;
    }
  },

  async getStrategyExecutive(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/strategy/executive`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching strategy executive:', error);
      return null;
    }
  },

  async getActionTimeline(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/strategy/timeline`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching action timeline:', error);
      return null;
    }
  },

  // Intervention Impact APIs
  async getInterventionEffectiveness(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/intervention/effectiveness`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching intervention effectiveness:', error);
      return [];
    }
  },

  async getInterventionHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/intervention/history?limit=${limit}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching intervention history:', error);
      return [];
    }
  },

  async recordIntervention(params: {
    actionType: string;
    preRisk: number;
    postRisk: number;
    strength?: number;
    targetCluster?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/intervention/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.ok;
    } catch (error) {
      console.error('Error recording intervention:', error);
      return false;
    }
  },

  // Evolution Forecast APIs
  async getForecasts(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/forecast`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      return null;
    }
  },

  async getCriticalForecasts(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/forecast/critical`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching critical forecasts:', error);
      return [];
    }
  },

  async getForecastTimeline(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/forecast/timeline`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching forecast timeline:', error);
      return null;
    }
  },

  // Escalation State APIs
  async getEscalationState(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/system/escalation`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching escalation state:', error);
      return null;
    }
  },

  async updateEscalationState(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/system/escalation/update`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating escalation state:', error);
      return null;
    }
  },

  // Robustness APIs
  async getRobustnessStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/system/robustness`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching robustness status:', error);
      return null;
    }
  },

  async runRobustnessCheck(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/system/robustness/check`, { method: 'POST' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error running robustness check:', error);
      return null;
    }
  },

  async getAnomalies(type?: string, limit: number = 20): Promise<any[]> {
    try {
      const url = type 
        ? `${API_URL}/api/system/anomalies?type=${type}&limit=${limit}`
        : `${API_URL}/api/system/anomalies?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      return [];
    }
  },

  // System Status APIs
  async getSystemStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/system/status`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system status:', error);
      return null;
    }
  },

  async configureWorkers(count: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/system/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error configuring workers:', error);
      return false;
    }
  },

  async clearCache(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/system/cache/clear`, { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },
};
