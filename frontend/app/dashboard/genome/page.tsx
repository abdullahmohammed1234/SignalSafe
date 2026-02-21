'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function GenomePage() {
  const [genome, setGenome] = useState<any>(null);
  const [lineage, setLineage] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [genomeData, lineageData, statsData] = await Promise.all([
      api.getCurrentGenome(),
      api.getGenomeLineage(),
      api.getGenomeStatistics()
    ]);
    setGenome(genomeData);
    setLineage(lineageData || []);
    setStats(statsData);
    setLoading(false);
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
        <h1 className="text-3xl font-bold text-white">Intelligence Genome</h1>
        <p className="text-gray-400 mt-1">Structural DNA and lineage tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Genomes</p>
          <p className="text-2xl font-bold text-white">{stats?.totalGenomes || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Active Branches</p>
          <p className="text-2xl font-bold text-white">{stats?.activeBranches || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Avg Performance</p>
          <p className="text-2xl font-bold text-white">{Math.round((stats?.averagePerformance || 0) * 100)}%</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Evolution Rate</p>
          <p className="text-2xl font-bold text-white">{stats?.evolutionRate || '0'}</p>
        </div>
      </div>

      {/* Current Genome */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Current Genome</h2>
        {genome && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Ensemble Weights</h3>
              <div className="space-y-2">
                {Object.entries(genome.ensembleWeights || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-300">{key}</span>
                    <span className="text-white font-medium">{Math.round(value * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Agent Topology</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Agents</span>
                  <span className="text-white font-medium">{genome.agentTopology?.totalAgents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Coordinators</span>
                  <span className="text-white font-medium">{genome.agentTopology?.coordinatorCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Simulation Depth</span>
                  <span className="text-white font-medium">{genome.simulationDepth || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lineage Tree */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Genome Lineage</h2>
        <div className="space-y-2">
          {lineage.map((node: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-white font-medium">{node.genomeId}</span>
              <span className="text-gray-400">- {node.branchName}</span>
              <span className="text-gray-500 text-sm ml-auto">F1: {Math.round(node.performanceSnapshot?.f1Score * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
