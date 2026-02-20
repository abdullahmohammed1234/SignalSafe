'use client';

import React from 'react';

interface RegionData {
  region: string;
  risk: number;
}

interface HeatMapProps {
  data: RegionData[];
}

export default function HeatMap({ data }: HeatMapProps) {
  const getRiskColor = (risk: number) => {
    if (risk < 30) {
      return 'bg-emerald-500';
    } else if (risk < 60) {
      return 'bg-amber-500';
    } else if (risk < 80) {
      return 'bg-orange-500';
    } else {
      return 'bg-red-500';
    }
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 30) return 'Low';
    if (risk < 60) return 'Medium';
    if (risk < 80) return 'High';
    return 'Critical';
  };

  // Static default regional data (avoiding hydration issues)
  const defaultData = [
    { region: 'North America', risk: 35 },
    { region: 'Europe', risk: 45 },
    { region: 'Asia Pacific', risk: 25 },
    { region: 'Latin America', risk: 55 },
    { region: 'Middle East', risk: 40 },
  ];

  const displayData = data.length > 0 ? data : defaultData;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-300">Regional Risk Heat Map</h3>
      
      <div className="space-y-3">
        {displayData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-32 text-sm text-gray-400">{item.region}</span>
            <div className="flex-1 h-6 bg-signal-gray rounded overflow-hidden">
              <div
                className={`h-full ${getRiskColor(item.risk)} transition-all duration-500`}
                style={{ width: `${Math.min(100, item.risk)}%` }}
              />
            </div>
            <span className="w-16 text-right text-sm font-medium" style={{ 
              color: item.risk < 30 ? '#10B981' : item.risk < 60 ? '#F59E0B' : item.risk < 80 ? '#F97316' : '#FF4444'
            }}>
              {getRiskLabel(item.risk)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>Stable</span>
        <div className="w-32 h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        <span>Critical</span>
      </div>
    </div>
  );
}
