'use client';

import React from 'react';
import { NarrativeInteraction } from '@/lib/api';

interface InteractionGraphProps {
  interactions: NarrativeInteraction[];
  onInteractionSelect?: (interaction: NarrativeInteraction) => void;
}

export default function InteractionGraph({ interactions, onInteractionSelect }: InteractionGraphProps) {
  // Get unique narratives from interactions
  const narratives = new Set<string>();
  interactions.forEach(i => {
    narratives.add(i.narrativeA);
    narratives.add(i.narrativeB);
  });

  // Calculate node positions in a circle
  const nodes = Array.from(narratives).map((id, index, arr) => ({
    id,
    angle: (2 * Math.PI * index) / arr.length,
    x: 50 + 35 * Math.cos(2 * Math.PI * index / arr.length),
    y: 50 + 35 * Math.sin(2 * Math.PI * index / arr.length),
  }));

  // Get edge lines
  const edges = interactions.map(interaction => {
    const nodeA = nodes.find(n => n.id === interaction.narrativeA);
    const nodeB = nodes.find(n => n.id === interaction.narrativeB);
    if (!nodeA || !nodeB) return null;
    return {
      x1: nodeA.x,
      y1: nodeA.y,
      x2: nodeB.x,
      y2: nodeB.y,
      width: Math.max(1, interaction.amplificationEffect / 20),
      opacity: Math.max(0.3, interaction.interactionScore),
    };
  }).filter(Boolean) as {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    opacity: number;
  }[];

  const getNodeColor = (nodeId: string): string => {
    // Find interactions involving this node
    const relatedInteractions = interactions.filter(
      i => i.narrativeA === nodeId || i.narrativeB === nodeId
    );
    const maxScore = Math.max(0, ...relatedInteractions.map(i => i.interactionScore));
    
    if (maxScore >= 0.8) return '#ef4444'; // red-500
    if (maxScore >= 0.6) return '#f97316'; // orange-500
    if (maxScore >= 0.4) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  const getInteractionInfo = (nodeId: string) => {
    return interactions.filter(
      i => i.narrativeA === nodeId || i.narrativeB === nodeId
    );
  };

  if (interactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          🔗 Narrative Interaction Graph
        </h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No active narrative interactions detected
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🔗 Narrative Interaction Graph
        </h3>
        <span className="text-xs text-gray-400">
          {interactions.length} interactions
        </span>
      </div>

      {/* Interactive Graph */}
      <div className="relative h-64">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Edges */}
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="#6366f1"
              strokeWidth={edge.width}
              strokeOpacity={edge.opacity}
            />
          ))}

          {/* Nodes */}
          {nodes.map(node => (
            <g
              key={node.id}
              onClick={() => onInteractionSelect?.(interactions.find(
                i => i.narrativeA === node.id || i.narrativeB === node.id
              )!)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={8}
                fill={getNodeColor(node.id)}
                stroke="#fff"
                strokeWidth={1}
              />
              <text
                x={node.x}
                y={node.y + 12}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={4}
              >
                {node.id.slice(-8)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Interaction List */}
      <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
        {interactions.slice(0, 5).map(interaction => (
          <div
            key={interaction._id}
            className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-gray-300">
                {interaction.narrativeA.slice(-6)} ↔ {interaction.narrativeB.slice(-6)}
              </span>
            </div>
            <span className="text-white font-medium">
              {(interaction.interactionScore * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
