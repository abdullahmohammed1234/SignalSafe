'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AutonomyPage() {
  const [modelStatus, setModelStatus] = useState<string>('Loading...');
  const [driftStatus, setDriftStatus] = useState<any>(null);
  const [weights, setWeights] = useState<any>(null);
  const [modelVersion, setModelVersion] = useState<any>(null);
  const [retrainStatus, setRetrainStatus] = useState<any>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const drift = await api.getDriftStatus();
    setDriftStatus(drift?.driftStatus || null);
    setModelStatus(drift?.modelStatus || 'Unknown');

    const weightData = await api.getEnsembleWeights();
    setWeights(weightData?.currentWeights || null);

    const version = await api.getModelVersion();
    setModelVersion(version?.currentVersion || null);

    const retrain = await api.getRetrainStatus();
    setRetrainStatus(retrain?.status || null);
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    await api.retrainModel('Manual trigger');
    setTimeout(async () => {
      await loadData();
      setIsRetraining(false);
    }, 5000);
  };

  const handleAdaptWeights = async () => {
    await api.adaptWeights();
    await loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🧠 Autonomy Intelligence</h1>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            modelStatus === 'Stable' ? 'bg-green-500/20 text-green-400' :
            modelStatus === 'DriftDetected' ? 'bg-yellow-500/20 text-yellow-400' :
            modelStatus === 'Retraining' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            Model Status: {modelStatus}
          </span>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 text-sm">Model Version</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {modelVersion?.versionId || 'N/A'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 text-sm">Drift Score</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {driftStatus?.overallDriftScore 
              ? `${(driftStatus.overallDriftScore * 100).toFixed(1)}%` 
              : 'N/A'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 text-sm">Calibration Score</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {modelVersion?.calibrationScore 
              ? `${(modelVersion.calibrationScore * 100).toFixed(1)}%` 
              : 'N/A'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-gray-400 text-sm">Training Window</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {modelVersion?.trainingWindow || 'N/A'}h
          </p>
        </div>
      </div>

      {/* Drift Detection */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Drift Detection</h2>
        {driftStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${driftStatus.featureDriftDetected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <p className="text-sm text-gray-400">Feature Drift</p>
                <p className="text-lg font-bold text-white">
                  {driftStatus.featureDriftDetected ? 'DETECTED' : 'None'}
                </p>
                <p className="text-xs text-gray-500">PSI: {driftStatus.featurePSI?.toFixed(3)}</p>
              </div>
              <div className={`p-4 rounded-lg ${driftStatus.predictionDriftDetected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <p className="text-sm text-gray-400">Prediction Drift</p>
                <p className="text-lg font-bold text-white">
                  {driftStatus.predictionDriftDetected ? 'DETECTED' : 'None'}
                </p>
                <p className="text-xs text-gray-500">PSI: {driftStatus.predictionPSI?.toFixed(3)}</p>
              </div>
              <div className={`p-4 rounded-lg ${driftStatus.conceptDriftDetected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <p className="text-sm text-gray-400">Concept Drift</p>
                <p className="text-lg font-bold text-white">
                  {driftStatus.conceptDriftDetected ? 'DETECTED' : 'None'}
                </p>
                <p className="text-xs text-gray-500">Δ: {driftStatus.accuracyDelta?.toFixed(2)}</p>
              </div>
            </div>
            {driftStatus.recommendations?.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">Recommendations</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {driftStatus.recommendations.map((rec: string, i: number) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Loading drift status...</p>
        )}
      </div>

      {/* Adaptive Weights */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Adaptive Ensemble Weights</h2>
          <button
            onClick={handleAdaptWeights}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            Optimize Weights
          </button>
        </div>
        {weights ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Rule-Based</p>
              <p className="text-2xl font-bold text-white">{(weights.ruleBased * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Anomaly Model</p>
              <p className="text-2xl font-bold text-white">{(weights.anomalyModel * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Projection</p>
              <p className="text-2xl font-bold text-white">{(weights.projection * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Interaction</p>
              <p className="text-2xl font-bold text-white">{(weights.interaction * 100).toFixed(1)}%</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Loading weights...</p>
        )}
      </div>

      {/* Model Retraining */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Model Retraining</h2>
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isRetraining 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isRetraining ? 'Retraining...' : 'Trigger Retraining'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-lg font-bold text-white">{retrainStatus?.currentPhase || 'Idle'}</p>
          </div>
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400">Progress</p>
            <p className="text-lg font-bold text-white">{retrainStatus?.progress || 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
