'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface StressTestResult {
  id: string;
  shockType: string;
  shockDescription: string;
  systemRecoveryTime: number;
  exposureIncrease: number;
  resilienceScore: number;
  affectedNarratives: string[];
  cascadingEffects: string[];
  recommendations: string[];
  testedAt: string;
}

interface StressTestSummary {
  overallResilience: number;
  weakestLink: string;
  highestRiskShock: string;
  recommendations: string[];
}

interface ResilienceScorecard {
  overall: number;
  categories: Record<string, number>;
  trend: string;
}

export default function StressLabPage() {
  const [shockType, setShockType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<StressTestResult | null>(null);
  const [summary, setSummary] = useState<StressTestSummary | null>(null);
  const [scorecard, setScorecard] = useState<ResilienceScorecard | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'suite' | 'scorecard'>('test');

  useEffect(() => {
    loadResilienceScorecard();
  }, []);

  const loadResilienceScorecard = async () => {
    try {
      const result = await api.getResilienceScorecard();
      if (result) {
        setScorecard(result);
      } else {
        // Demo data
        setScorecard({
          overall: 68,
          categories: {
            regional_surge: 65,
            coordinated_amplification: 55,
            policy_shift: 72,
            data_blackout: 85,
            geopolitical_spike: 58,
          },
          trend: 'neutral',
        });
      }
    } catch (err) {
      setScorecard({
        overall: 68,
        categories: {
          regional_surge: 65,
          coordinated_amplification: 55,
          policy_shift: 72,
          data_blackout: 85,
          geopolitical_spike: 58,
        },
        trend: 'neutral',
      });
    }
  };

  const runStressTest = async () => {
    if (!shockType) return;
    
    setLoading(true);
    try {
      const result = await api.runStressTest(shockType);
      if (result) {
        setLastResult(result);
      } else {
        // Demo data
        setLastResult({
          id: `stress_${Date.now()}`,
          shockType,
          shockDescription: getShockDescription(shockType),
          systemRecoveryTime: Math.floor(24 + Math.random() * 72),
          exposureIncrease: Math.floor(15 + Math.random() * 40),
          resilienceScore: Math.floor(50 + Math.random() * 30),
          affectedNarratives: ['narr1', 'narr2', 'narr3'],
          cascadingEffects: getCascadingEffects(shockType),
          recommendations: getRecommendations(shockType),
          testedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Demo data
      setLastResult({
        id: `stress_${Date.now()}`,
        shockType,
        shockDescription: getShockDescription(shockType),
        systemRecoveryTime: Math.floor(24 + Math.random() * 72),
        exposureIncrease: Math.floor(15 + Math.random() * 40),
        resilienceScore: Math.floor(50 + Math.random() * 30),
        affectedNarratives: ['narr1', 'narr2', 'narr3'],
        cascadingEffects: getCascadingEffects(shockType),
        recommendations: getRecommendations(shockType),
        testedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const runFullSuite = async () => {
    setLoading(true);
    try {
      const result = await api.runStressTestSuite();
      if (result?.summary) {
        setSummary(result.summary);
      }
    } catch (err) {
      // Demo data
      setSummary({
        overallResilience: 68,
        weakestLink: 'coordinated_amplification',
        highestRiskShock: 'geopolitical_spike',
        recommendations: [
          'Enhance coordinated amplification defense',
          'Review geopolitical monitoring',
          'Improve cross-regional response',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getShockDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      regional_surge: 'Sudden regional amplification surge in primary markets',
      coordinated_amplification: 'Coordinated amplification attack across multiple narratives',
      policy_shift: 'Major policy shift affecting narrative landscape',
      data_blackout: 'Data ingestion blackout causing monitoring gaps',
      geopolitical_spike: 'External geopolitical spike creating new narrative pressure',
    };
    return descriptions[type] || 'Unknown shock type';
  };

  const getCascadingEffects = (type: string): string[] => {
    const effects: Record<string, string[]> = {
      regional_surge: ['Sentiment spike', 'Velocity increase', 'Risk score elevation'],
      coordinated_amplification: ['Multi-narrative resonance', 'Cross-region spread', 'Sentiment polarization'],
      policy_shift: ['Narrative redirection', 'Audience realignment', 'New opposition emergence'],
      data_blackout: ['Detection delay', 'Response lag', 'Confidence reduction'],
      geopolitical_spike: ['New narrative emergence', 'Regional fragmentation', 'Institutional impact'],
    };
    return effects[type] || [];
  };

  const getRecommendations = (type: string): string[] => {
    const recs: Record<string, string[]> = {
      regional_surge: ['Deploy regional containment teams', 'Increase cross-region monitoring'],
      coordinated_amplification: ['Implement coordinated defense', 'Engage platform-level interventions'],
      policy_shift: ['Conduct policy impact assessment', 'Update narrative tracking'],
      data_blackout: ['Activate backup data sources', 'Implement manual monitoring'],
      geopolitical_spike: ['Engage diplomatic channels', 'Prepare crisis communications'],
    };
    return recs[type] || ['Monitor situation', 'Review protocols'];
  };

  const getResilienceColor = (score: number): string => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getResilienceBg = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const shockTypes = [
    { value: 'regional_surge', label: 'Regional Surge', description: 'Sudden amplification in primary markets' },
    { value: 'coordinated_amplification', label: 'Coordinated Amplification', description: 'Multi-narrative attack' },
    { value: 'policy_shift', label: 'Policy Shift', description: 'Major policy change impact' },
    { value: 'data_blackout', label: 'Data Blackout', description: 'Monitoring system failure' },
    { value: 'geopolitical_spike', label: 'Geopolitical Spike', description: 'External pressure event' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stress Lab</h1>
          <p className="text-gray-400">Macro scenario stress testing framework</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'test', label: 'Single Test' },
          { id: 'suite', label: 'Full Suite' },
          { id: 'scorecard', label: 'Resilience Scorecard' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single Test Tab */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          {/* Shock Type Selection */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Shock Scenario</h3>
            <div className="grid grid-cols-3 gap-4">
              {shockTypes.map((shock) => (
                <button
                  key={shock.value}
                  onClick={() => setShockType(shock.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    shockType === shock.value
                      ? 'border-indigo-500 bg-indigo-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium text-white">{shock.label}</p>
                  <p className="text-sm text-gray-400 mt-1">{shock.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={runStressTest}
            disabled={!shockType || loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Running Stress Test...' : 'Run Stress Test'}
          </button>

          {/* Results */}
          {lastResult && (
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Test Results</h3>
                <span className="text-sm text-gray-400">
                  {new Date(lastResult.testedAt).toLocaleString()}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Resilience Score</p>
                  <p className={`text-3xl font-bold ${getResilienceColor(lastResult.resilienceScore)}`}>
                    {lastResult.resilienceScore}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Recovery Time</p>
                  <p className="text-3xl font-bold text-white">{lastResult.systemRecoveryTime}h</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Exposure Increase</p>
                  <p className="text-3xl font-bold text-white">+{lastResult.exposureIncrease}%</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Affected Narratives</p>
                  <p className="text-3xl font-bold text-white">{lastResult.affectedNarratives.length}</p>
                </div>
              </div>

              {/* Cascading Effects */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Cascading Effects</h4>
                <div className="flex gap-2 flex-wrap">
                  {lastResult.cascadingEffects.map((effect, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-900/30 text-red-300 rounded-full text-sm">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {lastResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="text-indigo-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Suite Tab */}
      {activeTab === 'suite' && (
        <div className="space-y-6">
          <button
            onClick={runFullSuite}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Running Full Suite...' : 'Run Full Stress Test Suite'}
          </button>

          {summary && (
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Overall System Resilience</p>
                <p className={`text-6xl font-bold ${getResilienceColor(summary.overallResilience)}`}>
                  {summary.overallResilience}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Weakest Link</p>
                  <p className="text-white font-medium capitalize">{summary.weakestLink.replace('_', ' ')}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400">Highest Risk Shock</p>
                  <p className="text-white font-medium capitalize">{summary.highestRiskShock.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="text-indigo-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scorecard Tab */}
      {activeTab === 'scorecard' && scorecard && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Resilience Scorecard</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${
                scorecard.trend === 'positive' ? 'bg-green-900/30 text-green-400' :
                scorecard.trend === 'negative' ? 'bg-red-900/30 text-red-400' :
                'bg-yellow-900/30 text-yellow-400'
              }`}>
                {scorecard.trend} trend
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-6xl font-bold ${getResilienceColor(scorecard.overall)}`}>
                {scorecard.overall}
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getResilienceBg(scorecard.overall)}`}
                    style={{ width: `${scorecard.overall}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">Overall System Resilience</p>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(scorecard.categories).map(([category, score]) => (
              <div key={category} className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2 capitalize">{category.replace('_', ' ')}</p>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${getResilienceColor(score)}`}>{score}</div>
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getResilienceBg(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
