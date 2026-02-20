'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SimulationPage() {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [optimalIntervention, setOptimalIntervention] = useState<any>(null);
  const [timingEffectiveness, setTimingEffectiveness] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [counterfactualMode, setCounterfactualMode] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    interventionType: 'counter_narrative',
    timeShiftMinutes: -30,
    strength: 0.8,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const optimal = await api.getOptimalIntervention();
    setOptimalIntervention(optimal);

    const timing = await api.getTimingEffectiveness();
    setTimingEffectiveness(timing);
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const result = await api.runSimulation(simulationParams);
      setSimulationResult(result);
    } finally {
      setIsSimulating(false);
    }
  };

  const compareInterventions = async () => {
    setIsSimulating(true);
    try {
      const result = await api.compareInterventions(50, simulationParams.timeShiftMinutes);
      setSimulationResult(result);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🔮 Counterfactual Simulation</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={counterfactualMode}
              onChange={(e) => setCounterfactualMode(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            Counterfactual Mode
          </label>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Simulation Parameters</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Intervention Type</label>
            <select
              value={simulationParams.interventionType}
              onChange={(e) => setSimulationParams({ ...simulationParams, interventionType: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="sentiment_dampening">Sentiment Dampening</option>
              <option value="interaction_suppression">Interaction Suppression</option>
              <option value="regional_containment">Regional Containment</option>
              <option value="counter_narrative">Counter Narrative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Time Shift (minutes)</label>
            <input
              type="number"
              value={simulationParams.timeShiftMinutes}
              onChange={(e) => setSimulationParams({ ...simulationParams, timeShiftMinutes: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Strength (0-1)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={simulationParams.strength}
              onChange={(e) => setSimulationParams({ ...simulationParams, strength: parseFloat(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`px-6 py-2 rounded-lg font-medium ${
              isSimulating 
                ? 'bg-gray-600 text-gray-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button
            onClick={compareInterventions}
            disabled={isSimulating}
            className={`px-6 py-2 rounded-lg font-medium ${
              isSimulating 
                ? 'bg-gray-600 text-gray-300'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Compare Interventions
          </button>
        </div>
      </div>

      {/* Results */}
      {simulationResult && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Simulation Results</h2>
          
          {simulationResult.scenarios ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Best Option</p>
                  <p className="text-xl font-bold text-white">{simulationResult.bestOption}</p>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Recommended Time Shift</p>
                  <p className="text-xl font-bold text-white">{simulationResult.recommendedTimeShift} min</p>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">All Scenarios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {simulationResult.scenarios.map((scenario: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-xs text-gray-400">{scenario.interventionType}</p>
                      <p className="text-lg font-bold text-white">{scenario.riskReduction}%</p>
                      <p className="text-xs text-gray-500">risk reduction</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Baseline Peak Risk</p>
                <p className="text-2xl font-bold text-white">{simulationResult.baselinePeakRisk}%</p>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Simulated Peak Risk</p>
                <p className="text-2xl font-bold text-green-400">{simulationResult.simulatedPeakRisk}%</p>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Risk Reduction</p>
                <p className="text-2xl font-bold text-indigo-400">{simulationResult.riskReduction}%</p>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400">Confidence</p>
                <p className="text-2xl font-bold text-white">{simulationResult.confidence}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimal Intervention */}
      {optimalIntervention && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Optimal Intervention</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{optimalIntervention.recommendedType}</p>
              <p className="text-gray-400 mt-1">{optimalIntervention.reasoning}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Expected Reduction</p>
              <p className="text-3xl font-bold text-green-400">{optimalIntervention.expectedReduction}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Timing Effectiveness */}
      {timingEffectiveness.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Intervention Timing Effectiveness</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Intervention</th>
                  <th className="pb-3">15 min</th>
                  <th className="pb-3">30 min</th>
                  <th className="pb-3">45 min</th>
                  <th className="pb-3">60 min</th>
                  <th className="pb-3">90 min</th>
                  <th className="pb-3">120 min</th>
                </tr>
              </thead>
              <tbody>
                {timingEffectiveness.map((timing, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="py-3 text-white">{timing.interventionType}</td>
                    {timing.effectivenessByTiming.map((e: any, j: number) => (
                      <td key={j} className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          e.expectedReduction > 20 ? 'bg-green-500/20 text-green-400' :
                          e.expectedReduction > 10 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {e.expectedReduction}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
