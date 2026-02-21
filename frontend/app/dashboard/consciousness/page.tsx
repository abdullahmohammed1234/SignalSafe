'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ConsciousnessPage() {
  const [report, setReport] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [reportData, snapshotData, componentsData, alertsData] = await Promise.all([
      api.getConsciousnessReport(),
      api.getConsciousnessSnapshot(),
      api.getConsciousnessComponents(),
      api.getConsciousnessAlerts()
    ]);
    setReport(reportData);
    setSnapshot(snapshotData);
    setComponents(componentsData || []);
    setAlerts(alertsData || []);
    setLoading(false);
  };

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'self-evolving': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'highly-adaptive': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'stable-reactive': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'rigidity-risk': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'adequate': return 'text-yellow-400';
      case 'concerning': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
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
          <h1 className="text-3xl font-bold text-white">Strategic Consciousness</h1>
          <p className="text-gray-400 mt-1">Self-evolving intelligence architecture health</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${getInterpretationColor(snapshot?.interpretation || 'stable-reactive')}`}>
          <span className="text-lg font-semibold">{snapshot?.interpretation?.toUpperCase() || 'Loading...'}</span>
        </div>
      </div>

      {/* Main Index Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Consciousness Index</h2>
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="none" className="text-gray-700" />
                <circle 
                  cx="96" cy="96" r="80" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray={`${(snapshot?.index || 0) * 5.024} 502.4`}
                  className="text-indigo-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{Math.round(snapshot?.index || 0)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {snapshot?.keyMetrics?.map((metric: any) => (
                  <div key={metric.name} className="bg-gray-900/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400">{metric.name}</p>
                    <p className="text-2xl font-bold text-white">{Math.round(metric.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">System Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border ${
                  alert.level === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  alert.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <p className={`font-semibold ${
                  alert.level === 'critical' ? 'text-red-400' :
                  alert.level === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>{alert.level.toUpperCase()}</p>
                <p className="text-white mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Component Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component, idx) => (
            <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{component.name}</h3>
                <span className={`text-sm font-medium ${getStatusColor(component.status)}`}>
                  {component.status?.toUpperCase()}
                </span>
              </div>
              <div className="mb-2">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${component.score}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-400">{component.details}</p>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Score: {Math.round(component.score)}</span>
                <span>Weight: {Math.round(component.weight * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-2">
            {report.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 text-gray-300">
                <span className="text-indigo-400">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
