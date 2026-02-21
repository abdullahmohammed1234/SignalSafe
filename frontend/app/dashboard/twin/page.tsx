'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TwinPage() {
  const [state, setState] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [stateData, analyticsData, snapshotsData] = await Promise.all([
      api.getTwinState(),
      api.getTwinAnalytics(),
      api.getTwinSnapshots()
    ]);
    setState(stateData);
    setAnalytics(analyticsData);
    setSnapshots(snapshotsData || []);
    setLoading(false);
  };

  const handleTakeSnapshot = async () => {
    await api.takeTwinSnapshot('Manual snapshot');
    loadData();
  };

  const handleInjectScenario = async () => {
    await api.injectTwinScenario('amplification-burst');
    loadData();
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
          <h1 className="text-3xl font-bold text-white">Digital Twin</h1>
          <p className="text-gray-400 mt-1">Global information ecosystem digital twin</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleTakeSnapshot}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Snapshot
          </button>
          <button 
            onClick={handleInjectScenario}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Inject Scenario
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Narratives</p>
          <p className="text-2xl font-bold text-white">{analytics?.totalNarratives || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">High Risk</p>
          <p className="text-2xl font-bold text-red-400">{analytics?.highRiskNarratives || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Active Conflicts</p>
          <p className="text-2xl font-bold text-orange-400">{analytics?.activeConflicts || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Intervention Effectiveness</p>
          <p className="text-2xl font-bold text-green-400">{Math.round(analytics?.interventionEffectiveness || 0)}%</p>
        </div>
      </div>

      {/* Current State */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Twin State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Stability</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${state?.stabilityIndex || 0}%` }}
                />
              </div>
              <span className="text-white font-medium">{Math.round(state?.stabilityIndex || 0)}</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Overall Health</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${state?.overallHealth || 0}%` }}
                />
              </div>
              <span className="text-white font-medium">{Math.round(state?.overallHealth || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">State Snapshots</h2>
        <div className="space-y-2">
          {(snapshots || []).slice(0, 10).map((snapshot: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
              <span className="text-white font-medium">{snapshot.snapshotId}</span>
              <span className="text-gray-400 text-sm ml-auto">
                {new Date(snapshot.timestamp).toLocaleString()}
              </span>
              {snapshot.label && (
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                  {snapshot.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regional Risk Distribution */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Regional Risk</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics?.regionalRiskDistribution || {}).map(([region, risk]: [string, any], idx: number) => (
            <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-gray-400 text-sm">{region}</p>
              <p className={`text-xl font-bold ${risk > 70 ? 'text-red-400' : risk > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                {Math.round(risk)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
