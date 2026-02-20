'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function InsightsPage() {
  const [ensembleRisk, setEnsembleRisk] = useState<any>(null);
  const [calibration, setCalibration] = useState<any>(null);
  const [attribution, setAttribution] = useState<any>(null);
  const [uncertainty, setUncertainty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ensemble, calib, attr, unc] = await Promise.all([
        api.getEnsembleRisk(),
        api.getCalibrationMetrics(),
        api.getCausalAttribution(),
        api.getUncertaintyMetrics(),
      ]);
      setEnsembleRisk(ensemble);
      setCalibration(calib);
      setAttribution(attr);
      setUncertainty(unc);
    } catch (error) {
      console.error('Error loading insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-indigo-400 text-xl">Loading model insights...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💡 Model Insights</h1>
          <p className="text-gray-400">Research-grade AI analysis and calibration metrics</p>
        </div>

        {/* Ensemble Risk Score */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ensemble Risk Component */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">🎯 Ensemble Risk Model</h2>
            {ensembleRisk ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ensemble Score</span>
                  <span className={`text-3xl font-bold ${
                    ensembleRisk.riskLevel === 'Critical' ? 'text-red-500' :
                    ensembleRisk.riskLevel === 'High' ? 'text-orange-500' :
                    ensembleRisk.riskLevel === 'Moderate' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {ensembleRisk.ensembleRiskScore?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Calibrated Score</span>
                  <span className="text-2xl font-bold text-white">{ensembleRisk.calibratedScore?.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Risk Level</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ensembleRisk.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    ensembleRisk.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    ensembleRisk.riskLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {ensembleRisk.riskLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Confidence Level</span>
                  <span className="text-white">{ensembleRisk.confidenceLevel}%</span>
                </div>

                {/* Component Scores */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Component Scores</h3>
                  {ensembleRisk.componentScores && (
                    <div className="space-y-2">
                      {Object.entries(ensembleRisk.componentScores).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm w-40">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-white text-sm w-12 text-right">{value?.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No ensemble data available</div>
            )}
          </div>

          {/* Calibration Metrics */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">📊 Calibration Metrics</h2>
            {calibration ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Expected Calibration Error (ECE)</span>
                  <span className={`text-2xl font-bold ${
                    calibration.ECE < 5 ? 'text-green-500' :
                    calibration.ECE < 10 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {calibration.ECE?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Samples</span>
                  <span className="text-white">{calibration.totalSamples}</span>
                </div>
                
                {/* Reliability Diagram Preview */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Reliability Diagram</h3>
                  <div className="relative h-32 w-full">
                    {/* Diagonal reference line */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="0" y1="100" x2="100" y2="0" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
                      {calibration.reliabilityDiagram?.map((point: any, i: number) => (
                        <circle 
                          key={i}
                          cx={point.confidence} 
                          cy={100 - point.accuracy} 
                          r="3" 
                          fill="#6366F1"
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>Confidence</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No calibration data available</div>
            )}
          </div>
        </div>

        {/* Causal Attribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">🔍 Causal Signal Attribution</h2>
            {attribution ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Top Driver</span>
                  <span className="text-white font-medium">{attribution.topDriver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-white">{attribution.confidenceLevel}%</span>
                </div>
                
                {/* Signal Contributions */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Signal Contributions</h3>
                  <div className="space-y-3">
                    {attribution.signalContributions?.map((signal: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{signal.signalName}</span>
                          <span className="text-indigo-400 text-sm font-medium">{signal.contribution?.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              signal.impactLevel === 'critical' ? 'bg-red-500' :
                              signal.impactLevel === 'high' ? 'bg-orange-500' :
                              signal.impactLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${signal.contribution}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No attribution data available</div>
            )}
          </div>

          {/* Uncertainty */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">📈 Uncertainty Propagation</h2>
            {uncertainty ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Prediction Interval</span>
                  <span className="text-white font-medium">
                    {uncertainty.predictionInterval?.lowerBound} - {uncertainty.predictionInterval?.upperBound} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Predicted Peak Time</span>
                  <span className="text-white">{uncertainty.predictionInterval?.predictedPeakTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-white">{uncertainty.predictionInterval?.confidence}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Reliability</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    uncertainty.reliability === 'high' ? 'bg-green-500/20 text-green-400' :
                    uncertainty.reliability === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {uncertainty.reliability}
                  </span>
                </div>

                {/* Variance Breakdown */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Variance Breakdown</h3>
                  <div className="space-y-2">
                    {uncertainty.varianceBreakdown && Object.entries(uncertainty.varianceBreakdown).map(([key, value]: [string, any]) => (
                      key !== 'total' && (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white">{value?.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No uncertainty data available</div>
            )}
          </div>
        </div>

        {/* Narrative Explanation */}
        {attribution && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">📝 AI Analysis Narrative</h2>
            <p className="text-gray-300 leading-relaxed">{attribution.narrative}</p>
          </div>
        )}
      </div>
    </div>
  );
}
