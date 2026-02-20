'use client';

import React from 'react';

interface ProjectionChartProps {
  history: { timestamp: string; riskScore: number }[];
  predictions: { interval: number; predictedRisk: number }[];
  baseline: number | null;
}

export default function ProjectionChart({ history, predictions, baseline }: ProjectionChartProps) {
  // Combine history and predictions for display
  const allData = [
    ...history.map((h, i) => ({ ...h, type: 'history' as const, index: i })),
    ...predictions.map((p) => ({ 
      timestamp: new Date(Date.now() + p.interval * 60000).toISOString(), 
      riskScore: p.predictedRisk, 
      type: 'prediction' as const,
      index: history.length + p.interval
    })),
  ];

  const maxRisk = Math.max(100, ...allData.map(d => d.riskScore));
  const minRisk = Math.min(0, ...allData.map(d => d.riskScore));
  const range = maxRisk - minRisk || 1;

  // Only show last 20 points
  const displayData = allData.slice(-20);

  return (
    <div className="bg-signal-dark border border-signal-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Risk Projection</h3>
      
      <div className="relative h-48">
        {/* Baseline reference line */}
        {baseline !== null && (
          <div
            className="absolute left-0 right-0 border-dashed border border-gray-600 z-10"
            style={{ bottom: `${((baseline - minRisk) / range) * 100}%` }}
          >
            <span className="absolute right-0 -top-3 text-xs text-gray-500 bg-signal-dark px-1">
              Baseline: {baseline.toFixed(1)}
            </span>
          </div>
        )}

        {/* Chart area */}
        <svg className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={`${100 - tick}%`}
              x2="100%"
              y2={`${100 - tick}%`}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* Historical line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={displayData
              .filter(d => d.type === 'history')
              .map((d, i) => {
                const x = (i / Math.max(displayData.length - 1, 1)) * 100;
                const y = 100 - ((d.riskScore - minRisk) / range) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Prediction line */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="8,4"
            points={displayData
              .filter(d => d.type === 'prediction')
              .map((d, i) => {
                const historyCount = displayData.filter(x => x.type === 'history').length;
                const x = ((historyCount + i) / Math.max(displayData.length - 1, 1)) * 100;
                const y = 100 - ((d.riskScore - minRisk) / range) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Data points */}
          {displayData.map((d, i) => (
            <circle
              key={i}
              cx={`${(i / Math.max(displayData.length - 1, 1)) * 100}%`}
              cy={`${100 - ((d.riskScore - minRisk) / range) * 100}%`}
              r="4"
              fill={d.type === 'history' ? '#3b82f6' : '#f97316'}
              className="transition-all duration-300"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-xs text-gray-400">Historical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-orange-500 border-dashed" style={{ borderTopWidth: 2, borderStyle: 'dashed' }} />
          <span className="text-xs text-gray-400">Predicted</span>
        </div>
        {baseline !== null && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border border-gray-600 border-dashed" />
            <span className="text-xs text-gray-400">Baseline</span>
          </div>
        )}
      </div>

      {/* Prediction summary */}
      {predictions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-signal-border">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Next Predictions</h4>
          <div className="flex gap-4">
            {predictions.slice(0, 3).map((p, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-500">+{p.interval} interval</div>
                <div className="text-sm font-medium text-orange-400">{p.predictedRisk.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
