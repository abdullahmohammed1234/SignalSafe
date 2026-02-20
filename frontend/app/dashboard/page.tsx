'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { socketClient } from '@/lib/socket';
import { api, RiskSnapshot, Cluster, Narrative, Baseline, RiskHistory, RegionalRisk, NarrativeInteraction, InterventionRecommendation, ModelPerformanceRecord, SystemHealth } from '@/lib/api';
import RiskGauge from '@/components/RiskGauge';
import SentimentChart from '@/components/SentimentChart';
import ClusterGraph from '@/components/ClusterGraph';
import HeatMap from '@/components/HeatMap';
import ExplanationPanel from '@/components/ExplanationPanel';
import NarrativePanel from '@/components/NarrativePanel';
import ProjectionChart from '@/components/ProjectionChart';
import BaselineCard from '@/components/BaselineCard';

export default function Dashboard() {
  const [riskData, setRiskData] = useState<RiskSnapshot | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorPhase, setSimulatorPhase] = useState('stable');
  const [sentimentHistory, setSentimentHistory] = useState<{ timestamp: string; score: number }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Analyst Mode state
  const [analystMode, setAnalystMode] = useState(false);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);
  const [narrativeDetails, setNarrativeDetails] = useState<{
    prediction: any;
    confidence: any;
    trajectory: any;
  } | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskHistory[]>([]);
  
  // Phase 7 state
  const [stabilityIndex, setStabilityIndex] = useState<any>(null);
  const [systemicAlerts, setSystemicAlerts] = useState<any[]>([]);
  const [metaScore, setMetaScore] = useState<any>(null);

  // Initialize data and socket connection
  useEffect(() => {
    const initData = async () => {
      // Fetch initial risk data
      const risk = await api.getCurrentRisk();
      if (risk) {
        setRiskData(risk);
        setSentimentHistory(prev => [...prev, { 
          timestamp: risk.timestamp, 
          score: risk.sentimentAcceleration / 100 * -1 + 0.5 
        }]);
      }

      // Fetch initial clusters
      const clusterData = await api.getClusters();
      setClusters(clusterData);

      // Check simulator status
      const status = await api.getSimulatorStatus();
      setSimulatorRunning(status.running);
      setSimulatorPhase(status.phase);

      // Fetch narratives if in analyst mode
      if (analystMode) {
        const narrativeData = await api.getNarratives();
        setNarratives(narrativeData);
        
        const baselineData = await api.getBaseline();
        setBaseline(baselineData);
        
        const historyData = await api.getRiskHistory();
        setRiskHistory(historyData);
      }
    };

    initData();

    // Connect to WebSocket
    const socket = socketClient.connect();
    setIsConnected(true);

    // Set up socket listeners
    const handleRiskUpdate = (data: RiskSnapshot) => {
      setRiskData(data);
      setSentimentHistory(prev => {
        const newHistory = [...prev, { 
          timestamp: data.timestamp, 
          score: data.sentimentAcceleration / 100 * -1 + 0.5 
        }];
        // Keep last 20 data points
        return newHistory.slice(-20);
      });
    };

    const handleClustersUpdate = (data: Cluster[]) => {
      setClusters(data);
    };

    socketClient.onRiskUpdate(handleRiskUpdate);
    socketClient.onClustersUpdate(handleClustersUpdate);

    // Analyst mode listeners
    socketClient.onNarrativesUpdate((data: Narrative[]) => {
      setNarratives(data);
    });

    socketClient.onBaselineUpdate((data: Baseline) => {
      setBaseline(data);
    });

    // Cleanup
    return () => {
      socketClient.offRiskUpdate(handleRiskUpdate);
      socketClient.offClustersUpdate(handleClustersUpdate);
      socketClient.disconnect();
    };
  }, [analystMode]);

  // Fetch narrative details when selected narrative changes
  useEffect(() => {
    const fetchNarrativeDetails = async () => {
      if (selectedNarrative) {
        const details = await api.getNarrativeById(selectedNarrative.clusterId);
        setNarrativeDetails(details);
      }
    };
    fetchNarrativeDetails();
  }, [selectedNarrative]);

  // Fetch Phase 7 data
  useEffect(() => {
    const fetchPhase7Data = async () => {
      try {
        const stability = await api.getStabilityIndex();
        if (stability) setStabilityIndex(stability);
        
        const alerts = await api.getSystemicAlerts();
        if (alerts?.alerts) setSystemicAlerts(alerts.alerts);
        
        const meta = await api.getMetaIntelligenceScore();
        if (meta) setMetaScore(meta);
      } catch (error) {
        console.error('Error fetching Phase 7 data:', error);
      }
    };
    fetchPhase7Data();
    const interval = setInterval(fetchPhase7Data, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulatorToggle = async () => {
    try {
      if (simulatorRunning) {
        await api.stopSimulator();
        setSimulatorRunning(false);
      } else {
        await api.startSimulator();
        setSimulatorRunning(true);
      }
    } catch (error) {
      console.error('Failed to toggle simulator:', error);
    }
  };

  const handleTriggerPanic = async () => {
    try {
      // Auto-start simulator if not running
      if (!simulatorRunning) {
        await api.startSimulator();
        setSimulatorRunning(true);
      }
      await api.triggerPanicEvent();
    } catch (error) {
      console.error('Failed to trigger panic event:', error);
    }
  };

  const handleAnalystModeToggle = async () => {
    const newMode = !analystMode;
    setAnalystMode(newMode);
    
    if (newMode) {
      // Fetch analyst data
      const narrativeData = await api.getNarratives();
      setNarratives(narrativeData);
      
      const baselineData = await api.getBaseline();
      setBaseline(baselineData);
      
      const historyData = await api.getRiskHistory();
      setRiskHistory(historyData);
    }
  };

  const handleSelectNarrative = (narrative: Narrative) => {
    setSelectedNarrative(narrative);
  };

  // Default values when no data available
  const riskScore = riskData?.overallRiskScore ?? 0;
  const classification = riskData?.classification ?? 'Stable';
  const sentimentAcceleration = riskData?.sentimentAcceleration ?? 0;
  const clusterGrowthRate = riskData?.clusterGrowthRate ?? 0;
  const anomalyScore = riskData?.anomalyScore ?? 0;
  const narrativeSpreadSpeed = riskData?.narrativeSpreadSpeed ?? 0;

  // Transform clusters for display
  const displayClusters = clusters.map(c => ({
    id: c.clusterId,
    name: c.keywords?.slice(0, 3).join(', ') || c.clusterId,
    size: c.size,
    avgSentiment: c.avgSentiment,
    volatilityIndex: c.volatilityIndex,
  }));

  // Build projection chart data
  const projectionHistory = riskHistory.slice(0, 20).reverse().map(h => ({
    timestamp: h.timestamp,
    riskScore: h.overallRiskScore,
  }));
  const projectionPredictions = narrativeDetails?.trajectory?.predictions || [];

  return (
    <div className="min-h-screen bg-signal-black p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">SignalSafe</h1>
            <p className="text-gray-400 mt-1">AI-Powered Misinformation Detection</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Analyst Mode Toggle */}
            <button
              onClick={handleAnalystModeToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                analystMode 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {analystMode ? 'Analyst Mode: ON' : 'Analyst Mode: OFF'}
            </button>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleSimulatorToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                simulatorRunning 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                  : 'bg-signal-amber/20 text-signal-amber border border-signal-amber/50 hover:bg-signal-amber/30'
              }`}
            >
              {simulatorRunning ? 'Stop Simulator' : 'Start Simulator'}
            </button>
            {analystMode && (
              <button
                onClick={handleTriggerPanic}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30 animate-pulse"
              >
                Trigger Panic
              </button>
            )}
          </div>
        </div>
        
        {/* Phase indicator */}
        {simulatorRunning && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Phase:</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              simulatorPhase === 'spike' ? 'bg-red-500/20 text-red-400' :
              simulatorPhase === 'forming' ? 'bg-yellow-500/20 text-yellow-400' :
              simulatorPhase === 'decay' ? 'bg-gray-500/20 text-gray-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {simulatorPhase.charAt(0).toUpperCase() + simulatorPhase.slice(1)}
            </span>
          </div>
        )}
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Gauge - takes 1 column */}
        <div className="col-span-1">
          <RiskGauge score={riskScore} classification={classification} />
        </div>

        {/* Sentiment Chart - takes 1 column */}
        <div className="col-span-1">
          <SentimentChart data={sentimentHistory} />
        </div>

        {/* Heat Map - takes 1 column */}
        <div className="col-span-1">
          <HeatMap data={[]} />
        </div>

        {/* Explanation Panel - takes 1 column */}
        <div className="col-span-1">
          <ExplanationPanel
            riskScore={riskScore}
            sentimentAcceleration={sentimentAcceleration}
            clusterGrowthRate={clusterGrowthRate}
            anomalyScore={anomalyScore}
            narrativeSpreadSpeed={narrativeSpreadSpeed}
            clusters={clusters}
          />
        </div>

        {/* Phase 7: Strategic Stability Index Widget */}
        <div className="col-span-1 bg-gray-800/50 rounded-lg p-4 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Strategic Stability</h3>
            <Link href="/dashboard/strategic" className="text-xs text-indigo-400 hover:text-indigo-300">
              View Details →
            </Link>
          </div>
          {stabilityIndex ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-3xl font-bold ${
                  stabilityIndex.overallIndex >= 80 ? 'text-green-400' :
                  stabilityIndex.overallIndex >= 60 ? 'text-yellow-400' :
                  stabilityIndex.overallIndex >= 40 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {stabilityIndex.overallIndex}
                </span>
                <span className="text-xs text-gray-400">{stabilityIndex.interpretation}</span>
              </div>
              <div className="text-xs text-gray-400">
                Trend: <span className={stabilityIndex.stabilityTrend === 'improving' ? 'text-green-400' : stabilityIndex.stabilityTrend === 'declining' ? 'text-red-400' : 'text-gray-300'}>{stabilityIndex.stabilityTrend}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </div>

        {/* Phase 7: Systemic Alerts Widget */}
        <div className="col-span-1 bg-gray-800/50 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Systemic Alerts</h3>
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
              {systemicAlerts?.length || 0}
            </span>
          </div>
          {systemicAlerts && systemicAlerts.length > 0 ? (
            <div className="space-y-2">
              {systemicAlerts.slice(0, 3).map((alert: any, idx: number) => (
                <div key={idx} className={`text-xs p-2 rounded ${
                  alert.alertLevel === 'Critical' ? 'bg-red-900/30 text-red-300' :
                  alert.alertLevel === 'High' ? 'bg-orange-900/30 text-orange-300' :
                  'bg-yellow-900/30 text-yellow-300'
                }`}>
                  <div className="font-medium">{alert.type.replace(/_/g, ' ')}</div>
                  <div className="opacity-70">{alert.affectedNarratives?.length || 0} narratives</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No active alerts</div>
          )}
        </div>

        {/* Cluster Graph - full width */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <ClusterGraph clusters={displayClusters} />
        </div>

        {/* Analyst Mode Panels */}
        {analystMode && (
          <>
            {/* Narrative Lifecycle Panel */}
            <div className="col-span-1">
              <NarrativePanel
                narratives={narratives}
                selectedNarrative={selectedNarrative}
                prediction={narrativeDetails?.prediction}
                confidence={narrativeDetails?.confidence}
                onSelectNarrative={handleSelectNarrative}
              />
            </div>

            {/* Projection Chart */}
            <div className="col-span-1 md:col-span-2">
              <ProjectionChart
                history={projectionHistory}
                predictions={projectionPredictions}
                baseline={baseline?.meanRisk ?? null}
              />
            </div>

            {/* Baseline Card */}
            <div className="col-span-1">
              <BaselineCard baseline={baseline} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
