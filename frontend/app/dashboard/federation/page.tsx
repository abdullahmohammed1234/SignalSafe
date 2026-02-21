'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function FederationPage() {
  const [status, setStatus] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statusData, nodesData] = await Promise.all([
      api.getFederationStatus(),
      api.getFederationNodes()
    ]);
    setStatus(statusData);
    setNodes(nodesData || []);
    setLoading(false);
  };

  const getStatusColor = (nodeStatus: string) => {
    switch (nodeStatus) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'compromised': return 'bg-red-500';
      case 'syncing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Federated Intelligence Grid</h1>
        <p className="text-gray-400 mt-1">Distributed multi-node intelligence network</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Nodes</p>
          <p className="text-2xl font-bold text-white">{status?.totalNodes || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Active Nodes</p>
          <p className="text-2xl font-bold text-green-400">{status?.activeNodes || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Avg Trust Score</p>
          <p className="text-2xl font-bold text-blue-400">{Math.round((status?.averageTrust || 0) * 100)}%</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Network Health</p>
          <p className="text-2xl font-bold text-indigo-400">{Math.round((status?.networkHealth || 0) * 100)}%</p>
        </div>
      </div>

      {/* Network Health */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Network Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Average Divergence</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ width: `${(status?.averageDivergence || 0) * 100}%` }}
                />
              </div>
              <span className="text-white font-medium">{Math.round((status?.averageDivergence || 0) * 100)}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Total Consensus Votes</h3>
            <p className="text-2xl font-bold text-white">{status?.totalConsensusVotes || 0}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Nodes by Region</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(status?.nodesByRegion || {}).map(([region, count]: [string, any], idx: number) => (
                <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                  {region}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nodes */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Federated Nodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(nodes || []).map((node: any, idx: number) => (
            <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{node.nodeName}</h3>
                  <p className="text-sm text-gray-400">{node.institution}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Region</p>
                  <p className="text-white">{node.region}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trust</p>
                  <p className="text-white">{Math.round(node.trustScore * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Divergence</p>
                  <p className="text-white">{Math.round(node.divergenceScore * 100)}%</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
                <span>Anomalies: {node.anomaliesDetected}</span>
                <span>Votes: {node.consensusVotes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
