'use client';

import React from 'react';
import { Baseline } from '@/lib/api';

interface BaselineCardProps {
  baseline: Baseline | null;
}

const getStatusColor = (deviation: number): { bg: string; text: string; border: string } => {
  if (deviation < 0.5) {
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' };
  }
  if (deviation < 1.5) {
    return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' };
  }
  if (deviation < 2.5) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' };
  }
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' };
};

const getStatusLabel = (deviation: number): string => {
  if (deviation < 0.5) return 'Normal';
  if (deviation < 1.5) return 'Elevated';
  if (deviation < 2.5) return 'High';
  return 'Critical';
};

export default function BaselineCard({ baseline }: BaselineCardProps) {
  if (!baseline) {
    return (
      <div className="bg-signal-dark border border-signal-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Baseline Comparison</h3>
        <p className="text-gray-400 text-sm">Calculating baseline...</p>
      </div>
    );
  }

  const statusColors = getStatusColor(baseline.deviationFromBaseline);
  const statusLabel = getStatusLabel(baseline.deviationFromBaseline);
  const deviationSign = baseline.deviationFromBaseline >= 0 ? '+' : '';

  return (
    <div className="bg-signal-dark border border-signal-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Baseline Comparison</h3>
      
      <div className="space-y-4">
        {/* Current Risk */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Current Risk</span>
          <span className="text-lg font-bold text-white">{baseline.currentRisk.toFixed(1)}</span>
        </div>

        {/* 24h Baseline */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">24h Baseline</span>
          <span className="text-lg font-medium text-gray-300">{baseline.meanRisk.toFixed(1)}</span>
        </div>

        {/* Standard Deviation */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Std Deviation</span>
          <span className="text-sm text-gray-300">±{baseline.stdDev.toFixed(1)}</span>
        </div>

        {/* Deviation */}
        <div className="pt-4 border-t border-signal-border">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Deviation from Baseline</div>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
              <span className={`text-2xl font-bold ${statusColors.text}`}>
                {deviationSign}{baseline.deviationFromBaseline.toFixed(1)}σ
              </span>
            </div>
            <div className={`mt-2 text-sm font-medium ${statusColors.text}`}>
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Risk gauge visualization */}
        <div className="mt-4">
          <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
            {/* Baseline marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gray-400 z-10"
              style={{ left: `${baseline.meanRisk}%` }}
            />
            {/* Current risk indicator */}
            <div
              className="absolute top-0 bottom-0 bg-blue-500 transition-all duration-500"
              style={{ width: `${baseline.currentRisk}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
