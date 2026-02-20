'use client';

import React from 'react';
import { InterventionRecommendation } from '@/lib/api';

interface InterventionPanelProps {
  recommendations: InterventionRecommendation[];
  onActionClick?: (recommendation: InterventionRecommendation) => void;
}

export default function InterventionPanel({ recommendations, onActionClick }: InterventionPanelProps) {
  const getUrgencyColor = (level: number): string => {
    if (level >= 5) return 'bg-red-500 text-white';
    if (level >= 4) return 'bg-orange-500 text-white';
    if (level >= 3) return 'bg-yellow-500 text-black';
    if (level >= 2) return 'bg-emerald-400 text-black';
    return 'bg-gray-500 text-white';
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Escalate to Authority': return 'bg-red-600/20 text-red-400 border-red-600';
      case 'Deploy Counter-Narrative': return 'bg-orange-600/20 text-orange-400 border-orange-600';
      case 'Preemptive Communication': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600';
    }
  };

  const highPriorityCount = recommendations.filter(r => r.urgencyLevel >= 4).length;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🛡 Intervention Panel
        </h3>
        {highPriorityCount > 0 && (
          <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
            {highPriorityCount} Critical
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-500">
          No active recommendations
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recommendations.map((rec, idx) => (
            <div
              key={rec.clusterId}
              className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-white">
                    {rec.clusterId}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {rec.reasoning.slice(0, 60)}...
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(rec.urgencyLevel)}`}>
                  L{rec.urgencyLevel}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-1 text-xs border rounded ${getActionColor(rec.recommendedAction)}`}>
                  {rec.recommendedAction}
                </span>
                
                <div className="text-xs text-gray-500">
                  {rec.timeToPeakPrediction && (
                    <span>Peak in: {rec.timeToPeakPrediction.toFixed(1)}h</span>
                  )}
                </div>
              </div>

              {rec.urgencyLevel >= 4 && (
                <button
                  onClick={() => onActionClick?.(rec)}
                  className="mt-2 w-full py-1 text-xs bg-red-600/20 text-red-400 border border-red-600/50 rounded hover:bg-red-600/30 transition-colors"
                >
                  Take Action
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
