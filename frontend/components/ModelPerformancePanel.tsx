'use client';

import React from 'react';
import { ModelPerformanceRecord } from '@/lib/api';

interface ModelPerformancePanelProps {
  performance: ModelPerformanceRecord[];
}

export default function ModelPerformancePanel({ performance }: ModelPerformancePanelProps) {
  const latest = performance[0];

  const getMetricColor = (value: number, type: 'accuracy' | 'mae' | 'fpr' | 'fnr'): string => {
    if (type === 'accuracy') {
      if (value >= 80) return 'text-emerald-400';
      if (value >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (type === 'mae') {
      if (value <= 10) return 'text-emerald-400';
      if (value <= 20) return 'text-yellow-400';
      return 'text-red-400';
    }
    // For error rates, lower is better
    if (value <= 10) return 'text-emerald-400';
    if (value <= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!latest) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          📊 Model Performance
        </h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          No performance data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📊 Model Performance
        </h3>
        <span className="text-xs text-gray-400">
          v{latest.modelVersion}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Accuracy</div>
          <div className={`text-2xl font-bold ${getMetricColor(latest.accuracy, 'accuracy')}`}>
            {latest.accuracy.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">MAE</div>
          <div className={`text-2xl font-bold ${getMetricColor(latest.MAE, 'mae')}`}>
            {latest.MAE.toFixed(1)}h
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">False Positive</div>
          <div className={`text-2xl font-bold ${getMetricColor(latest.falsePositiveRate, 'fpr')}`}>
            {latest.falsePositiveRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">False Negative</div>
          <div className={`text-2xl font-bold ${getMetricColor(latest.falseNegativeRate, 'fnr')}`}>
            {latest.falseNegativeRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Precision</span>
          <span className="text-white">{(latest.precision * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Recall</span>
          <span className="text-white">{(latest.recall * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">F1 Score</span>
          <span className="text-white">{(latest.f1Score * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Samples Tested</span>
          <span className="text-white">{latest.samplesTested}</span>
        </div>
      </div>

      {/* Test Type Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`px-2 py-1 text-xs rounded ${
          latest.testType === 'backtest' ? 'bg-blue-500/20 text-blue-400' :
          latest.testType === 'adversarial' ? 'bg-red-500/20 text-red-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {latest.testType.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(latest.timestamp).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
