'use client';

import React from 'react';

interface ExplanationPanelProps {
  riskScore: number;
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
  clusters: any[];
}

export default function ExplanationPanel({
  riskScore,
  sentimentAcceleration,
  clusterGrowthRate,
  anomalyScore,
  narrativeSpreadSpeed,
  clusters,
}: ExplanationPanelProps) {
  const generateExplanation = () => {
    const parts: string[] = [];

    // Sentiment analysis
    if (sentimentAcceleration > 50) {
      parts.push(`Detected ${sentimentAcceleration.toFixed(0)}% increase in emotionally negative language`);
    } else if (sentimentAcceleration > 20) {
      parts.push(`Moderate sentiment shift toward negative detected (${sentimentAcceleration.toFixed(0)}%)`);
    } else {
      parts.push('Sentiment remains relatively stable');
    }

    // Cluster analysis
    if (clusters.length > 0) {
      const topCluster = clusters[0];
      if (topCluster && topCluster.keywords && topCluster.keywords.length > 0) {
        parts.push(`Cluster '${topCluster.keywords.slice(0, 3).join(', ')}' showing ${topCluster.growthRate.toFixed(0)}% growth`);
      }
    }

    // Growth rate
    if (clusterGrowthRate > 80) {
      parts.push('Rapid cluster formation indicates potential viral spread');
    }

    // Anomaly detection
    if (anomalyScore > 60) {
      parts.push(`Volume anomaly detected - posting rate ${anomalyScore.toFixed(0)}% above baseline`);
    }

    // Spread speed
    if (narrativeSpreadSpeed > 70) {
      parts.push('Narrative spreading faster than historical patterns');
    }

    // Risk level explanation
    if (riskScore >= 80) {
      parts.push(`ALERT: Escalation probability currently at ${riskScore.toFixed(0)}% - Panic formation likely`);
    } else if (riskScore >= 60) {
      parts.push(`Risk level elevated at ${riskScore.toFixed(0)}% - Close monitoring recommended`);
    }

    return parts;
  };

  const explanations = generateExplanation();

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-300">AI Analysis</h3>
      
      <div className="space-y-3">
        {explanations.map((explanation, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-signal-amber">•</span>
            <p className="text-sm text-gray-300">{explanation}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-signal-gray">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Risk Factors</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Sentiment Accel.</span>
            <span className={sentimentAcceleration > 50 ? 'text-red-400' : 'text-gray-400'}>
              {sentimentAcceleration.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cluster Growth</span>
            <span className={clusterGrowthRate > 50 ? 'text-red-400' : 'text-gray-400'}>
              {clusterGrowthRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Anomaly Score</span>
            <span className={anomalyScore > 60 ? 'text-red-400' : 'text-gray-400'}>
              {anomalyScore.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Spread Speed</span>
            <span className={narrativeSpreadSpeed > 70 ? 'text-red-400' : 'text-gray-400'}>
              {narrativeSpreadSpeed.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
