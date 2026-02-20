'use client';

import React from 'react';
import { Narrative, Prediction, Confidence } from '@/lib/api';

interface NarrativePanelProps {
  narratives: Narrative[];
  selectedNarrative: Narrative | null;
  prediction: Prediction | null;
  confidence: Confidence | null;
  onSelectNarrative: (narrative: Narrative) => void;
}

const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'Emerging':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'Accelerating':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'Peak':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'Declining':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

const getConfidenceColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

const formatTimeToPeak = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function NarrativePanel({
  narratives,
  selectedNarrative,
  prediction,
  confidence,
  onSelectNarrative,
}: NarrativePanelProps) {
  return (
    <div className="bg-signal-dark border border-signal-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Narrative Lifecycle</h3>
      
      {/* Narrative List */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {narratives.length === 0 ? (
          <p className="text-gray-400 text-sm">No narratives detected yet</p>
        ) : (
          narratives.slice(0, 5).map((narrative) => (
            <button
              key={narrative.clusterId}
              onClick={() => onSelectNarrative(narrative)}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                selectedNarrative?.clusterId === narrative.clusterId
                  ? 'bg-signal-amber/20 border-signal-amber/50'
                  : 'bg-signal-black border-signal-border hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 truncate">
                  {narrative.clusterId.slice(0, 12)}...
                </span>
                <span className={`px-2 py-0.5 text-xs rounded border ${getStageColor(narrative.lifecycleStage)}`}>
                  {narrative.lifecycleStage}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Growth: {narrative.growthVelocity.toFixed(1)}%
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected Narrative Details */}
      {selectedNarrative && (
        <div className="border-t border-signal-border pt-4 mt-4">
          <div className="space-y-3">
            {/* Lifecycle Stage */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Stage</span>
              <span className={`px-3 py-1 text-sm rounded-full border ${getStageColor(selectedNarrative.lifecycleStage)}`}>
                {selectedNarrative.lifecycleStage}
              </span>
            </div>

            {/* Growth Velocity */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Growth Velocity</span>
              <span className="text-sm text-white font-medium">
                {selectedNarrative.growthVelocity.toFixed(1)}%
              </span>
            </div>

            {/* Time to Peak */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Time to Peak</span>
              <span className="text-sm text-white font-medium">
                {prediction?.timeToPeakPrediction 
                  ? formatTimeToPeak(prediction.timeToPeakPrediction)
                  : 'Calculating...'}
              </span>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${confidence?.confidenceScore || 50}%`,
                      backgroundColor: getConfidenceColor(confidence?.confidenceScore || 50),
                    }}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {confidence?.confidenceScore || 50}%
                </span>
              </div>
            </div>

            {/* Peak Risk Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Peak Risk</span>
              <span className="text-sm text-white font-medium">
                {selectedNarrative.peakRiskScore.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Confidence Gauge */}
          <div className="mt-4 flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={getConfidenceColor(confidence?.confidenceScore || 50)}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidence?.confidenceScore || 50) * 2.51} 251`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {confidence?.confidenceScore || 50}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
