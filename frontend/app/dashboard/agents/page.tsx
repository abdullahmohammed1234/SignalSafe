'use client';

import React, { useState, useEffect } from 'react';

interface AgentStatus {
  agentName: string;
  lastRun: string;
  performanceScore: number;
  reliabilityScore: number;
  currentLoad: number;
  status: 'active' | 'idle' | 'error' | 'maintenance';
}

interface AgentMetrics {
  avgPerformance: number;
  avgReliability: number;
  activeAgents: number;
  agentsByStatus: Record<string, number>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const [agentsRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/api/system/agents`),
        fetch(`${API_URL}/api/system/agents/metrics`),
      ]);
      
      if (!agentsRes.ok || !metricsRes.ok) throw new Error('Failed to fetch agent data');
      
      const agentsData = await agentsRes.json();
      const metricsData = await metricsRes.json();
      
      setAgents(agentsData);
      setMetrics(metricsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAgent = async (agentName: string) => {
    try {
      setRunning(agentName);
      const res = await fetch(`${API_URL}/api/system/agents/${agentName}/run`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run agent');
      await fetchAgentData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(null);
    }
  };

  const runAllAgents = async () => {
    try {
      setRunning('all');
      const res = await fetch(`${API_URL}/api/system/agents/run-all`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run all agents');
      await fetchAgentData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Multi-Agent Orchestration</h1>
          <p className="text-gray-400 mt-1">Coordinate and monitor agent performance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAllAgents}
            disabled={running !== null}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {running === 'all' ? 'Running...' : 'Run All Agents'}
          </button>
          <button
            onClick={fetchAgentData}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Agents</p>
          <p className="text-3xl font-bold text-white mt-1">{agents.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Avg Performance</p>
          <p className="text-3xl font-bold text-white mt-1">
            {((metrics?.avgPerformance ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Avg Reliability</p>
          <p className="text-3xl font-bold text-white mt-1">
            {((metrics?.avgReliability ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Active Agents</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{metrics?.activeAgents ?? 0}</p>
        </div>
      </div>

      {/* Agent Status by Type */}
      {metrics?.agentsByStatus && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Agents by Status</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(metrics.agentsByStatus).map(([status, count]) => (
              <span
                key={status}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  status === 'active' ? 'bg-green-500/20 text-green-400' :
                  status === 'idle' ? 'bg-gray-500/20 text-gray-400' :
                  status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.agentName}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{agent.agentName}</h3>
                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                  agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  agent.status === 'idle' ? 'bg-gray-500/20 text-gray-400' :
                  agent.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {agent.status}
                </span>
              </div>
              <button
                onClick={() => runAgent(agent.agentName)}
                disabled={running !== null}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                {running === agent.agentName ? 'Running...' : 'Run'}
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Performance</span>
                  <span className="text-white">{(agent.performanceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${agent.performanceScore * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reliability</span>
                  <span className="text-white">{(agent.reliabilityScore * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${agent.reliabilityScore * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Load</span>
                  <span className="text-white">{(agent.currentLoad * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${agent.currentLoad * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Last run: {new Date(agent.lastRun).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
