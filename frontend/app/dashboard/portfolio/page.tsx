'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';

interface PortfolioData {
  totalExposure: number;
  highRiskNarratives: string[];
  emergingClusters: string[];
  systemicRiskLevel: number;
  diversificationIndex: number;
  riskByCategory: Record<string, number>;
  riskByRegion: Record<string, number>;
  riskByLifecycle: Record<string, number>;
  topContributors: { narrativeId: string; exposure: number; riskScore: number }[];
  recommendations: string[];
  generatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/overview`);
      if (!res.ok) throw new Error('Failed to fetch portfolio data');
      const data = await res.json();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Institutional Risk Portfolio</h1>
          <p className="text-gray-400 mt-1">Cross-narrative risk aggregation and portfolio view</p>
        </div>
        <button
          onClick={fetchPortfolio}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Exposure</p>
          <p className="text-3xl font-bold text-white mt-1">{portfolio?.totalExposure.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Systemic Risk Level</p>
          <p className={`text-3xl font-bold mt-1 ${
            (portfolio?.systemicRiskLevel ?? 0) > 0.7 ? 'text-red-400' :
            (portfolio?.systemicRiskLevel ?? 0) > 0.5 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {((portfolio?.systemicRiskLevel ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Diversification Index</p>
          <p className="text-3xl font-bold text-white mt-1">
            {((portfolio?.diversificationIndex ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">High Risk Narratives</p>
          <p className="text-3xl font-bold text-red-400 mt-1">
            {portfolio?.highRiskNarratives.length ?? 0}
          </p>
        </div>
      </div>

      {/* Risk by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Risk by Category</h3>
          <div className="space-y-3">
            {portfolio?.riskByCategory && Object.entries(portfolio.riskByCategory).map(([category, risk]) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-gray-400 w-32 capitalize">{category}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      risk > 0.7 ? 'bg-red-500' : risk > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(risk as number) * 100}%` }}
                  />
                </div>
                <span className="text-white w-12 text-right">{(risk as number).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Risk by Region</h3>
          <div className="space-y-3">
            {portfolio?.riskByRegion && Object.entries(portfolio.riskByRegion).map(([region, risk]) => (
              <div key={region} className="flex items-center gap-3">
                <span className="text-gray-400 w-20">{region}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      risk > 0.7 ? 'bg-red-500' : risk > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((risk as number) * 200, 100)}%` }}
                  />
                </div>
                <span className="text-white w-12 text-right">{(risk as number).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Risk Contributors */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Top Risk Contributors</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3">Narrative ID</th>
              <th className="pb-3">Exposure</th>
              <th className="pb-3">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {portfolio?.topContributors?.map((item, i) => (
              <tr key={i} className="border-b border-gray-700/50">
                <td className="py-3 text-white">{item.narrativeId}</td>
                <td className="py-3 text-gray-300">{item.exposure.toFixed(3)}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    item.riskScore > 0.7 ? 'bg-red-500/20 text-red-400' :
                    item.riskScore > 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {item.riskScore.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Recommendations</h3>
        <ul className="space-y-2">
          {portfolio?.recommendations?.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-300">
              <span className="text-indigo-400 mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
