'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function EvolutionPage() {
  const [architecture, setArchitecture] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [archData, historyData, modelsData] = await Promise.all([
      api.getArchitecture(),
      api.getArchitectureHistory(),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/system/architecture/models`).then(r => r.json()).catch(() => [])
    ]);
    setArchitecture(archData);
    setHistory(historyData || []);
    setModels(modelsData || []);
    setLoading(false);
  };

  const handleEvolve = async () => {
    await api.evolveArchitecture({
      triggerReason: 'Manual evolution trigger',
      targetAnomalyModel: 'autoencoder',
      targetSimulationDepth: 6
    });
    loadData();
  };

  const handleSimulate = async () => {
    const result = await api.simulateArchitectureChange({
      triggerReason: 'Simulation test',
      targetAnomalyModel: 'autoencoder',
      targetSimulationDepth: 7
    });
    if (result) {
      alert(`Simulated gain: ${(result.simulatedPerformanceGain * 100).toFixed(1)}%`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Architecture Evolution</h1>
          <p className="text-gray-400 mt-1">Self-evolving model architecture engine</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSimulate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Simulate
          </button>
          <button 
            onClick={handleEvolve}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Evolve
          </button>
        </div>
      </div>

      {/* Current Architecture */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Current Architecture: {architecture?.versionId}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Ensemble Composition</h3>
            <div className="space-y-1">
              {(architecture?.ensembleComposition?.anomalyModels || []).map((model: string, idx: number) => (
                <span key={idx} className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm mr-2">
                  {model}
                </span>
              ))}
            </div>
            <p className="text-gray-500 mt-2">Weighting: {architecture?.ensembleComposition?.weightingStrategy}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Feature Set</h3>
            <p className="text-white">Dimensionality: {architecture?.featureSet?.dimensionality}</p>
            <p className="text-gray-500">Active Features: {architecture?.featureSet?.activeFeatures?.length}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Performance</h3>
            <p className="text-white">Score: {Math.round((architecture?.performanceScore || 0) * 100)}%</p>
            <p className="text-gray-500">Simulation Depth: {architecture?.simulationDepth}</p>
          </div>
        </div>
      </div>

      {/* Available Models */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Available Model Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(models || []).map((model: any, idx: number) => (
            <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white">{model.type}</h3>
              <p className="text-sm text-gray-400 mt-1">{model.description}</p>
              <p className="text-xs text-gray-500 mt-2">Best for: {model.bestFor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Evolution History</h2>
        <div className="space-y-2">
          {(history || []).map((version: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${version.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-white font-medium">{version.versionId}</span>
              <span className="text-gray-400">- {version.evolutionTrigger || 'Initial'}</span>
              <span className="text-gray-500 text-sm ml-auto">
                {new Date(version.deploymentTimestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
