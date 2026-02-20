'use client';

import React, { useEffect, useState } from 'react';
import { RegionalRisk } from '@/lib/api';

interface RegionalRiskMapProps {
  regionalRisks: RegionalRisk[];
  onRegionSelect?: (region: string) => void;
}

export default function RegionalRiskMap({ regionalRisks, onRegionSelect }: RegionalRiskMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Group by country
  const countryRisks = regionalRisks.reduce((acc, risk) => {
    const country = risk.country || 'Unknown';
    if (!acc[country]) {
      acc[country] = {
        riskScore: 0,
        count: 0,
        anomalyScore: 0,
        postVolume: 0,
      };
    }
    acc[country].riskScore = Math.max(acc[country].riskScore, risk.riskScore);
    acc[country].count += 1;
    acc[country].anomalyScore = Math.max(acc[country].anomalyScore, risk.anomalyScore);
    acc[country].postVolume += risk.postVolume;
    return acc;
  }, {} as Record<string, { riskScore: number; count: number; anomalyScore: number; postVolume: number }>);

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-emerald-400';
    return 'bg-emerald-600';
  };

  const getRiskBorder = (score: number): string => {
    if (score >= 80) return 'border-red-400';
    if (score >= 60) return 'border-orange-400';
    if (score >= 40) return 'border-yellow-400';
    if (score >= 20) return 'border-emerald-400';
    return 'border-emerald-600';
  };

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    onRegionSelect?.(region);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🌍 Regional Risk Map
        </h3>
        <span className="text-xs text-gray-400">
          {regionalRisks.length} regions tracked
        </span>
      </div>

      {/* Risk Map Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(countryRisks).map(([country, data]) => (
          <button
            key={country}
            onClick={() => handleRegionClick(country)}
            className={`
              relative p-3 rounded-lg border-2 transition-all hover:scale-105
              ${getRiskBorder(data.riskScore)}
              ${selectedRegion === country ? 'ring-2 ring-white/50' : ''}
            `}
          >
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getRiskColor(data.riskScore)}`} />
            
            <div className="text-left">
              <div className="font-medium text-white text-sm truncate">{country}</div>
              <div className="text-xs text-gray-400 mt-1">
                Risk: <span className="text-white font-semibold">{data.riskScore.toFixed(0)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {data.postVolume} posts
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="text-gray-500">Risk:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Elevated
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
        </span>
      </div>

      {/* Selected Region Details */}
      {selectedRegion && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Selected: {selectedRegion}</div>
          {regionalRisks
            .filter(r => r.country === selectedRegion)
            .slice(0, 3)
            .map(risk => (
              <div key={risk._id} className="flex justify-between text-xs py-1">
                <span className="text-gray-300">{risk.region}</span>
                <span className="text-white">{risk.riskScore.toFixed(0)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
