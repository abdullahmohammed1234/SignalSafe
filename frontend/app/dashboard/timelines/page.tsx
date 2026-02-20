'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface TimelinePoint {
  timestamp: string;
  riskLevel: number;
  spreadRadius: number;
  sentiment: number;
  engagement: number;
}

interface TimelineScenario {
  scenarioId: string;
  scenarioName: string;
  interventionType: string;
  timeline: TimelinePoint[];
  projectedPeakRisk: number;
  timeToPeak: number;
  escalationProbability: number;
  systemicImpactScore: number;
}

interface TimelineSimulation {
  narrativeId: string;
  scenarios: TimelineScenario[];
  baselineScenario: TimelineScenario;
  recommendedIntervention: string;
  confidenceLevel: number;
}

interface Narrative {
  _id: string;
  title?: string;
  riskScore?: number;
}

export default function TimelinesPage() {
  const [simulation, setSimulation] = useState<TimelineSimulation | null>(null);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNarratives();
  }, []);

  const loadNarratives = async () => {
    try {
      // In production, would fetch from API
      setNarratives([
        { _id: '1', title: 'Sample Narrative 1', riskScore: 65 },
        { _id: '2', title: 'Sample Narrative 2', riskScore: 45 },
        { _id: '3', title: 'Sample Narrative 3', riskScore: 78 },
      ]);
    } catch (err) {
      console.error('Error loading narratives:', err);
    }
  };

  const runSimulation = async () => {
    if (!selectedNarrative) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await api.getTimelineSimulation(selectedNarrative);
      if (result) {
        setSimulation(result);
        if (result.scenarios?.length > 0) {
          setSelectedScenario(result.scenarios[0].scenarioId);
        }
      } else {
        // Use demo data if no real data
        setSimulation({
          narrativeId: selectedNarrative,
          scenarios: generateDemoScenarios(),
          baselineScenario: generateDemoScenarios()[0],
          recommendedIntervention: 'early_containment',
          confidenceLevel: 0.78,
        });
        setSelectedScenario(generateDemoScenarios()[0].scenarioId);
      }
    } catch (err) {
      setError('Failed to run simulation');
      // Use demo data
      setSimulation({
        narrativeId: selectedNarrative,
        scenarios: generateDemoScenarios(),
        baselineScenario: generateDemoScenarios()[0],
        recommendedIntervention: 'early_containment',
        confidenceLevel: 0.78,
      });
      setSelectedScenario(generateDemoScenarios()[0].scenarioId);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoScenarios = (): TimelineScenario[] => {
    const scenarios = ['No Intervention', 'Early Containment', 'Delayed Containment', 'Aggressive Suppression', 'Targeted Counter-Messaging'];
    return scenarios.map((name, idx) => {
      const baseRisk = 50 + Math.random() * 30;
      const growth = [0.15, -0.08, 0.05, -0.12, -0.05][idx];
      const timeline: TimelinePoint[] = [];
      
      for (let i = 0; i <= 168; i += 12) {
        const risk = Math.max(10, Math.min(100, baseRisk + (growth * i) + (Math.random() * 10 - 5)));
        timeline.push({
          timestamp: new Date(Date.now() + i * 3600000).toISOString(),
          riskLevel: Math.round(risk * 10) / 10,
          spreadRadius: Math.round((50 + Math.random() * 30) * 10) / 10,
          sentiment: Math.round((Math.random() * 2 - 1) * 100) / 100,
          engagement: Math.round((50 + Math.random() * 40) * 10) / 10,
        });
      }

      return {
        scenarioId: `scenario_${idx}`,
        scenarioName: name,
        interventionType: ['none', 'early_containment', 'delayed_containment', 'aggressive_suppression', 'targeted_counter_messaging'][idx],
        timeline,
        projectedPeakRisk: Math.round((baseRisk + 20) * 10) / 10,
        timeToPeak: [120, 24, 72, 12, 48][idx],
        escalationProbability: [0.85, 0.15, 0.45, 0.25, 0.20][idx],
        systemicImpactScore: Math.round((60 + Math.random() * 30) * 10) / 10,
      };
    });
  };

  const currentScenario = simulation?.scenarios.find(s => s.scenarioId === selectedScenario);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline Explorer</h1>
          <p className="text-gray-400">Multi-timeline simulation engine</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Narrative</label>
          <select
            value={selectedNarrative}
            onChange={(e) => setSelectedNarrative(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a narrative...</option>
            {narratives.map(n => (
              <option key={n._id} value={n._id}>{n.title} (Risk: {n.riskScore})</option>
            ))}
          </select>
        </div>
        <button
          onClick={runSimulation}
          disabled={!selectedNarrative || loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {simulation && (
        <>
          {/* Scenario Selection */}
          <div className="flex gap-2 flex-wrap">
            {simulation.scenarios.map((scenario) => (
              <button
                key={scenario.scenarioId}
                onClick={() => setSelectedScenario(scenario.scenarioId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedScenario === scenario.scenarioId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {scenario.scenarioName}
              </button>
            ))}
          </div>

          {/* Current Scenario Details */}
          {currentScenario && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400">Projected Peak Risk</p>
                <p className="text-2xl font-bold text-white">{currentScenario.projectedPeakRisk}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400">Time to Peak</p>
                <p className="text-2xl font-bold text-white">{currentScenario.timeToPeak}h</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400">Escalation Probability</p>
                <p className="text-2xl font-bold text-white">{(currentScenario.escalationProbability * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400">Systemic Impact</p>
                <p className="text-2xl font-bold text-white">{currentScenario.systemicImpactScore}</p>
              </div>
            </div>
          )}

          {/* Timeline Chart */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Projection Over Time</h3>
            <div className="h-80">
              <div className="relative h-full">
                {/* Simple line chart representation */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 px-4">
                  {currentScenario?.timeline.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t"
                        style={{ height: `${point.riskLevel}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-500">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500">
              Time (hours) →
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Scenario Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Scenario</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Peak Risk</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Time to Peak</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Escalation Prob.</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Systemic Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.scenarios.map((scenario) => (
                    <tr
                      key={scenario.scenarioId}
                      onClick={() => setSelectedScenario(scenario.scenarioId)}
                      className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
                        selectedScenario === scenario.scenarioId ? 'bg-indigo-900/20' : 'hover:bg-gray-700/30'
                      }`}
                    >
                      <td className="py-3 px-4 text-white font-medium">{scenario.scenarioName}</td>
                      <td className="py-3 px-4 text-right text-white">{scenario.projectedPeakRisk}%</td>
                      <td className="py-3 px-4 text-right text-white">{scenario.timeToPeak}h</td>
                      <td className="py-3 px-4 text-right text-white">{(scenario.escalationProbability * 100).toFixed(0)}%</td>
                      <td className="py-3 px-4 text-right text-white">{scenario.systemicImpactScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Recommended Intervention</h3>
            <p className="text-gray-300">
              Based on the simulation analysis, the recommended approach is{' '}
              <span className="text-indigo-400 font-medium">
                {simulation.recommendedIntervention.replace('_', ' ')}
              </span>
              {' '}(confidence: {(simulation.confidenceLevel * 100).toFixed(0)}%)
            </p>
          </div>
        </>
      )}

      {!simulation && (
        <div className="text-center py-12 text-gray-500">
          <p>Select a narrative and run the simulation to view timeline projections</p>
        </div>
      )}
    </div>
  );
}
