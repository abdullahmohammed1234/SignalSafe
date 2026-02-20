'use client';

import React from 'react';

interface MutationAlert {
  clusterId: string;
  driftPercentage: number;
  previousCentroid: number[];
  currentCentroid: number[];
  detectedAt: string;
}

interface MutationAlertPanelProps {
  mutations: MutationAlert[];
  onMutationClick?: (mutation: MutationAlert) => void;
}

export default function MutationAlertPanel({ mutations, onMutationClick }: MutationAlertPanelProps) {
  const getDriftColor = (drift: number): string => {
    if (drift >= 50) return 'text-red-400';
    if (drift >= 30) return 'text-orange-400';
    if (drift >= 15) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getDriftBg = (drift: number): string => {
    if (drift >= 50) return 'bg-red-500/20';
    if (drift >= 30) return 'bg-orange-500/20';
    if (drift >= 15) return 'bg-yellow-500/20';
    return 'bg-emerald-500/20';
  };

  if (mutations.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          🧬 Mutation Alert Panel
        </h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          No narrative mutations detected
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🧬 Mutation Alert Panel
        </h3>
        <span className="px-2 py-1 text-xs font-bold bg-purple-500/20 text-purple-400 rounded-full">
          {mutations.length} detected
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {mutations.map((mutation, idx) => (
          <div
            key={mutation.clusterId}
            onClick={() => onMutationClick?.(mutation)}
            className={`p-3 rounded-lg border border-gray-700 ${getDriftBg(mutation.driftPercentage)} hover:border-gray-600 transition-colors cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-white">
                  {mutation.clusterId}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Detected: {new Date(mutation.detectedAt).toLocaleString()}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${getDriftColor(mutation.driftPercentage)}`}>
                  {mutation.driftPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">drift</div>
              </div>
            </div>

            {/* Visual drift indicator */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.min(100, mutation.driftPercentage)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Original</span>
                <span>Current</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <div className="text-xs text-purple-400">
          ℹ️ Narratives may mutate to avoid detection. High drift percentages indicate the narrative has significantly evolved from its original form.
        </div>
      </div>
    </div>
  );
}
