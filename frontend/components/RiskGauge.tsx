'use client';

import React from 'react';

interface RiskGaugeProps {
  score: number;
  classification: string;
}

export default function RiskGauge({ score, classification }: RiskGaugeProps) {
  // Calculate rotation based on score (0-100)
  const rotation = (score / 100) * 180 - 90;

  const getRiskColor = () => {
    switch (classification) {
      case 'Stable':
        return '#10B981';
      case 'Emerging Concern':
        return '#F59E0B';
      case 'Escalation Risk':
        return '#F97316';
      case 'Panic Formation Likely':
        return '#FF4444';
      default:
        return '#6B7280';
    }
  };

  const getRiskClass = () => {
    switch (classification) {
      case 'Stable':
        return 'risk-stable';
      case 'Emerging Concern':
        return 'risk-emerging';
      case 'Escalation Risk':
        return 'risk-escalation';
      case 'Panic Formation Likely':
        return 'risk-panic';
      default:
        return '';
    }
  };

  const color = getRiskColor();
  const isHighRisk = score > 70;

  return (
    <div className={`glass-card p-6 flex flex-col items-center ${isHighRisk ? 'animate-pulse' : ''}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-300">Risk Score</h3>
      
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Gauge background arc */}
        <div className="absolute w-48 h-48 rounded-full border-[12px] border-signal-gray"
             style={{ borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
        
        {/* Gradient arc */}
        <div 
          className="absolute w-48 h-48 rounded-full"
          style={{ 
            border: '12px solid',
            borderColor: `${color}40 transparent transparent transparent`,
            transform: 'rotate(0deg)',
            borderRadius: '50%'
          }}
        />
        
        {/* Needle */}
        <div 
          className={`absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transition-all duration-500 ${isHighRisk ? 'animate-pulse' : ''}`}
          style={{ 
            backgroundColor: color,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            boxShadow: `0 0 10px ${color}`
          }}
        />
        
        {/* Center dot */}
        <div 
          className={`absolute bottom-0 left-1/2 w-4 h-4 rounded-full -translate-x-1/2 translate-y-1/2 ${isHighRisk ? 'animate-pulse' : ''}`}
          style={{ 
            backgroundColor: color,
            boxShadow: isHighRisk ? `0 0 15px ${color}` : 'none'
          }}
        />
      </div>

      {/* Score display */}
      <div className={`text-4xl font-bold mt-4 ${getRiskClass()} ${isHighRisk ? 'animate-pulse' : ''}`}>
        {score.toFixed(1)}
      </div>
      
      {/* Classification */}
      <div 
        className={`mt-2 px-4 py-1 rounded-full text-sm font-medium ${getRiskClass()} ${isHighRisk ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: `${color}20` }}
      >
        {classification}
      </div>

      {/* High risk warning indicator */}
      {isHighRisk && (
        <div className="mt-3 flex items-center gap-2 text-red-400 animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">Elevated Risk Detected</span>
        </div>
      )}
    </div>
  );
}
