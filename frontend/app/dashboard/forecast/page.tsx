'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<any>(null);
  const [criticalForecasts, setCriticalForecasts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const forecastData = await api.getForecasts();
    setForecasts(forecastData);

    const critical = await api.getCriticalForecasts();
    setCriticalForecasts(critical);

    const timelineData = await api.getForecastTimeline();
    setTimeline(timelineData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📈 Narrative Evolution Forecast</h1>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
            {forecasts?.forecasts?.length || 0} Active Narratives
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      {forecasts?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Average Mutation Risk</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {(forecasts.summary.avgMutationRisk || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Branching Probability</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {(forecasts.summary.avgBranchingProbability || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Narratives at Risk</h3>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {forecasts.summary.narrativesAtRisk || 0}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm">Projected Peaks</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {forecasts.summary.projectedPeakWindows?.length || 0}
            </p>
          </div>
        </div>
      )}

      {/* Critical Forecasts */}
      {criticalForecasts.length > 0 && (
        <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
          <h2 className="text-lg font-semibold text-red-400 mb-4">🚨 Critical Forecasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalForecasts.slice(0, 4).map((forecast: any, i: number) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{forecast.narrativeId}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    forecast.nextStageProbability > 80 ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {forecast.nextStageProbability}% next stage
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Mutation Risk</p>
                    <p className="text-white">{forecast.mutationRisk}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Spread Velocity</p>
                    <p className="text-white">{forecast.spreadVelocity}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Branching</p>
                    <p className="text-white">{forecast.branchingProbability}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Confidence</p>
                    <p className="text-white">{forecast.confidence}%</p>
                  </div>
                </div>
                {forecast.projectedPeakWindow && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      Peak window: {new Date(forecast.projectedPeakWindow.earliest).toLocaleString()} - {new Date(forecast.projectedPeakWindow.latest).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Forecasts */}
      {forecasts?.forecasts && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">All Narrative Forecasts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3">Narrative</th>
                  <th className="pb-3">Current Stage</th>
                  <th className="pb-3">Next Stage Prob</th>
                  <th className="pb-3">Mutation Risk</th>
                  <th className="pb-3">Spread Velocity</th>
                  <th className="pb-3">Branching</th>
                  <th className="pb-3">Saturation</th>
                  <th className="pb-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.forecasts.map((forecast: any, i: number) => (
                  <tr key={i} className="border-b border-gray-700/50">
                    <td className="py-3 text-white font-medium">{forecast.narrativeId}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        forecast.currentStage === 'Peak' ? 'bg-red-500/20 text-red-400' :
                        forecast.currentStage === 'Accelerating' ? 'bg-yellow-500/20 text-yellow-400' :
                        forecast.currentStage === 'Emerging' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {forecast.currentStage}
                      </span>
                    </td>
                    <td className="py-3 text-white">{forecast.nextStageProbability}%</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        forecast.mutationRisk > 60 ? 'bg-red-500/20 text-red-400' :
                        forecast.mutationRisk > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {forecast.mutationRisk}%
                      </span>
                    </td>
                    <td className="py-3 text-white">{forecast.spreadVelocity}</td>
                    <td className="py-3 text-white">{forecast.branchingProbability}%</td>
                    <td className="py-3 text-gray-400">
                      {forecast.saturationTime 
                        ? new Date(forecast.saturationTime).toLocaleString() 
                        : 'N/A'}
                    </td>
                    <td className="py-3 text-white">{forecast.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factors */}
      {forecasts?.forecasts?.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Key Risk Factors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecasts.forecasts.slice(0, 3).map((forecast: any, i: number) => (
              <div key={i} className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">{forecast.narrativeId}</h3>
                {forecast.factors?.map((factor: any, j: number) => (
                  <div key={j} className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">{factor.factor}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      factor.direction === 'positive' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {factor.impact.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
