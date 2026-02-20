'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SystemPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [escalationState, setEscalationState] = useState<any>(null);
  const [robustness, setRobustness] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const status = await api.getSystemStatus();
    setSystemStatus(status);

    const escalation = await api.getEscalationState();
    setEscalationState(escalation);

    const robust = await api.getRobustnessStatus();
    setRobustness(robust);
    setRecommendations(robust?.recommendations);
  };

  const runRobustnessCheck = async () => {
    await api.runRobustnessCheck();
    await loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🖥️ System Intelligence</h1>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            systemStatus?.autonomousMode 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {systemStatus?.autonomousMode ? '🟢 Autonomous Mode Active' : '⚪ Standby Mode'}
          </span>
        </div>
      </div>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Model Status</h3>
            <p className={`text-2xl font-bold mt-1 ${
              systemStatus.modelStatus === 'Stable' ? 'text-green-400' :
              systemStatus.modelStatus === 'DriftDetected' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {systemStatus.modelStatus}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Horizontal Scaling</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {systemStatus.horizontalScalingReady ? 'Ready' : 'Not Ready'}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Queue Size</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {systemStatus.queue?.queueSize || 0}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Workers</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {systemStatus.queue?.workerCount || 1}
            </p>
          </div>
        </div>
      )}

      {/* Escalation State */}
      {escalationState?.currentState && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Threat Escalation State</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`px-6 py-3 rounded-xl ${
              escalationState.currentState.currentState === 'Critical' ? 'bg-red-500/30' :
              escalationState.currentState.currentState === 'Escalating' ? 'bg-orange-500/30' :
              escalationState.currentState.currentState === 'Accelerating' ? 'bg-yellow-500/30' :
              escalationState.currentState.currentState === 'Emerging' ? 'bg-blue-500/30' :
              'bg-green-500/30'
            }`}>
              <span className="text-3xl font-bold text-white">
                {escalationState.currentState.currentState}
              </span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">State Duration</p>
                  <p className="text-xl font-bold text-white">{escalationState.currentState.stateDuration} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-xl font-bold text-white">{escalationState.currentState.confidence || 'N/A'}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* State Machine Visualization */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {['Dormant', 'Emerging', 'Accelerating', 'Escalating', 'Critical', 'Contained', 'Recovered'].map((state, i) => {
              const isCurrent = escalationState.currentState.currentState === state;
              return (
                <div key={state} className="flex items-center">
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    isCurrent 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {state}
                  </div>
                  {i < 6 && <span className="mx-2 text-gray-500">→</span>}
                </div>
              );
            })}
          </div>

          {/* Alerts and Recommendations */}
          {escalationState.currentState.alerts?.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-400 font-medium mb-2">Alerts</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {escalationState.currentState.alerts.map((alert: string, i: number) => (
                  <li key={i}>• {alert}</li>
                ))}
              </ul>
            </div>
          )}

          {escalationState.currentState.recommendedActions?.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <h4 className="text-indigo-400 font-medium mb-2">Recommended Actions</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {escalationState.currentState.recommendedActions.map((action: string, i: number) => (
                  <li key={i}>• {action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Robustness Status */}
      {robustness && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Adversarial Robustness</h2>
            <button
              onClick={runRobustnessCheck}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              Run Check
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-lg ${
              robustness.status.status === 'healthy' ? 'bg-green-500/20' :
              robustness.status.status === 'warning' ? 'bg-yellow-500/20' :
              'bg-red-500/20'
            }`}>
              <p className="text-sm text-gray-400">System Status</p>
              <p className={`text-xl font-bold ${
                robustness.status.status === 'healthy' ? 'text-green-400' :
                robustness.status.status === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {robustness.status.status.toUpperCase()}
              </p>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Consensus Score</p>
              <p className="text-xl font-bold text-white">
                {(robustness.status.consensusScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Recent Anomalies</p>
              <p className="text-xl font-bold text-white">
                {robustness.status.recentAnomalies}
              </p>
            </div>
          </div>

          {/* Statistics */}
          {robustness.statistics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Anomalies by Type</p>
                <div className="space-y-1">
                  {Object.entries(robustness.statistics.byType || {}).map(([type, count]: [string, any], i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{type}</span>
                      <span className="text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Anomalies by Severity</p>
                <div className="space-y-1">
                  {Object.entries(robustness.statistics.bySeverity || {}).map(([severity, count]: [string, any], i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={`${
                        severity === 'critical' ? 'text-red-400' :
                        severity === 'high' ? 'text-orange-400' :
                        severity === 'medium' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>{severity}</span>
                      <span className="text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations?.recommendations?.length > 0 && (
            <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-white font-medium mb-2">Protection Recommendations</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {recommendations.recommendations.map((rec: string, i: number) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
