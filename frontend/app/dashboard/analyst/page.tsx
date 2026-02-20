'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AnalystPage() {
  const [executive, setExecutive] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exec, b, health] = await Promise.all([
        api.getExecutiveSummary(),
        api.getExecutiveBrief(),
        api.getSystemHealthSummary(),
      ]);
      setExecutive(exec);
      setBrief(b);
      setSystemHealth(health);
    } catch (error) {
      console.error('Error loading analyst data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-indigo-400 text-xl">Loading analyst data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔬 Analyst View</h1>
          <p className="text-gray-400">Deep analytical insights and executive decision support</p>
        </div>

        {/* Executive Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Executive Brief */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">🎯 Executive Brief</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                brief?.urgency === 'immediate' ? 'bg-red-500/20 text-red-400' :
                brief?.urgency === 'urgent' ? 'bg-orange-500/20 text-orange-400' :
                brief?.urgency === 'elevated' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {brief?.urgency?.toUpperCase() || 'ROUTINE'}
              </span>
            </div>
            
            {brief ? (
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Risk Level</div>
                  <div className={`text-3xl font-bold ${
                    brief.level === 'Critical' ? 'text-red-500' :
                    brief.level === 'High' ? 'text-orange-500' :
                    brief.level === 'Moderate' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {brief.level}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-400 text-sm mb-1">Risk Score</div>
                  <div className="text-2xl font-bold text-white">{brief.riskScore}%</div>
                </div>
                
                <div>
                  <div className="text-gray-400 text-sm mb-1">Recommended Action</div>
                  <div className="text-white">{brief.action}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No brief data available</div>
            )}
          </div>

          {/* System Health */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">⚡ System Health</h2>
            
            {systemHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Overall Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          systemHealth.status === 'healthy' ? 'bg-green-500' :
                          systemHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${systemHealth.overall}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{systemHealth.overall}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-800/50 p-3 rounded-xl">
                    <div className="text-gray-400 text-xs">AI Service</div>
                    <div className="text-lg font-bold text-white">{systemHealth.ai}%</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl">
                    <div className="text-gray-400 text-xs">Queue</div>
                    <div className="text-lg font-bold text-white">{systemHealth.queue}%</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl">
                    <div className="text-gray-400 text-xs">WebSocket</div>
                    <div className="text-lg font-bold text-white">{systemHealth.ws}%</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-xl">
                    <div className="text-gray-400 text-xs">Database</div>
                    <div className="text-lg font-bold text-white">{systemHealth.db}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No system health data available</div>
            )}
          </div>
        </div>

        {/* Detailed Executive Summary */}
        {executive && (
          <>
            {/* Key Insights */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">💡 Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {executive.keyInsights?.map((insight: any, i: number) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border ${
                      insight.priority === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                      insight.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                      insight.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        insight.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        insight.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">{insight.category}</span>
                    </div>
                    <p className="text-white text-sm">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Outlook */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">📈 Risk Outlook</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-400 text-sm">Trend</span>
                  <div className={`text-lg font-bold ${
                    executive.riskOutlook?.trend === 'deteriorating' ? 'text-red-500' :
                    executive.riskOutlook?.trend === 'improving' ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {executive.riskOutlook?.trend?.toUpperCase() || 'STABLE'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Predicted Change</span>
                  <div className={`text-lg font-bold ${
                    executive.riskOutlook?.predictedChange > 0 ? 'text-red-500' :
                    executive.riskOutlook?.predictedChange < 0 ? 'text-green-500' : 'text-white'
                  }`}>
                    {executive.riskOutlook?.predictedChange > 0 ? '+' : ''}{executive.riskOutlook?.predictedChange || 0}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Expected Escalation</span>
                  <div className="text-white font-medium">{executive.expectedEscalationWindow}</div>
                </div>
              </div>

              {/* Timeline */}
              {executive.riskOutlook?.timeline && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Risk Projection Timeline</h3>
                  <div className="flex gap-4">
                    {executive.riskOutlook.timeline.map((item: any, i: number) => (
                      <div key={i} className="flex-1 bg-gray-800/50 p-3 rounded-xl text-center">
                        <div className="text-gray-400 text-xs">{item.timeframe}</div>
                        <div className="text-lg font-bold text-white">{item.expectedRisk?.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Support */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
              <h2 className="text-xl font-semibold text-white mb-4">🛡 Decision Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Primary Driver</div>
                  <div className="text-white font-medium">{executive.primaryDriver}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Decision Urgency</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    executive.decisionUrgency === 'immediate' ? 'bg-red-500/20 text-red-400' :
                    executive.decisionUrgency === 'urgent' ? 'bg-orange-500/20 text-orange-400' :
                    executive.decisionUrgency === 'elevated' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {executive.decisionUrgency?.toUpperCase()}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <div className="text-gray-400 text-sm mb-1">Recommended Action</div>
                  <div className="text-white bg-gray-800/50 p-4 rounded-xl">
                    {executive.recommendedAction}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Confidence Level</div>
                  <div className="text-white font-medium">{executive.confidenceLevel}%</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
