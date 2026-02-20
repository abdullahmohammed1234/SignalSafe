'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface GraphNode {
  id: string;
  label: string;
  type: 'narrative' | 'cluster' | 'amplifier';
  riskScore: number;
  centralityScore: number;
  influenceRadius: number;
  volatilityIndex: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

interface EcosystemData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highCentralityNodes: GraphNode[];
  influenceHubs: GraphNode[];
  volatileNodes: GraphNode[];
  statistics?: {
    totalNodes: number;
    totalEdges: number;
    avgCentrality: number;
    avgVolatility: number;
    networkDensity: number;
    dominantType: string;
  };
}

export default function EcosystemPage() {
  const [data, setData] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'centrality' | 'influence' | 'volatility'>('graph');

  useEffect(() => {
    loadEcosystemData();
  }, []);

  const loadEcosystemData = async () => {
    setLoading(true);
    try {
      const result = await api.getEcosystemGraph();
      const stats = await api.getEcosystemStatistics();
      if (result) {
        setData({ ...result, statistics: stats });
      } else {
        setError('Failed to load ecosystem data');
      }
    } catch (err) {
      setError('Error loading ecosystem data');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type: string, risk: number): string => {
    if (type === 'cluster') return '#8B5CF6';
    if (type === 'amplifier') return '#F59E0B';
    if (risk > 70) return '#EF4444';
    if (risk > 50) return '#F97316';
    if (risk > 30) return '#EAB308';
    return '#22C55E';
  };

  const getEdgeColor = (type: string): string => {
    switch (type) {
      case 'reinforcement': return '#22C55E';
      case 'opposition': return '#EF4444';
      case 'mutation_lineage': return '#8B5CF6';
      case 'shared_amplifier': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderGraph = () => {
    if (!data || !data.nodes || data.nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-500">
          No graph data available
        </div>
      );
    }

    // Simple grid representation of the ecosystem
    const gridCols = Math.ceil(Math.sqrt(data.nodes.length));
    
    return (
      <div className="relative">
        <svg className="w-full h-[600px]" viewBox="0 0 800 600">
          {/* Draw edges */}
          {data.edges.slice(0, 100).map((edge, i) => {
            const sourceNode = data.nodes.find(n => n.id === edge.source);
            const targetNode = data.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            const x1 = (data.nodes.indexOf(sourceNode) % gridCols) * (800 / gridCols) + 50;
            const y1 = Math.floor(data.nodes.indexOf(sourceNode) / gridCols) * (600 / Math.ceil(data.nodes.length / gridCols)) + 50;
            const x2 = (data.nodes.indexOf(targetNode) % gridCols) * (800 / gridCols) + 50;
            const y2 = Math.floor(data.nodes.indexOf(targetNode) / gridCols) * (600 / Math.ceil(data.nodes.length / gridCols)) + 50;
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={getEdgeColor(edge.type)}
                strokeWidth={edge.weight * 2}
                strokeOpacity={0.4}
              />
            );
          })}
          
          {/* Draw nodes */}
          {data.nodes.slice(0, 50).map((node, i) => {
            const x = (i % gridCols) * (800 / gridCols) + 50;
            const y = Math.floor(i / gridCols) * (600 / Math.ceil(data.nodes.length / gridCols)) + 50;
            const radius = 8 + (node.riskScore / 20);
            
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={getNodeColor(node.type, node.riskScore)}
                  stroke="#1F2937"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity"
                />
                <text
                  x={x}
                  y={y + radius + 12}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="9"
                >
                  {node.label.substring(0, 15)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderNodeList = (nodes: GraphNode[], title: string) => (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {nodes.slice(0, 10).map((node) => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            className="flex items-center justify-between p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm text-gray-300 truncate max-w-[200px]">{node.label}</span>
            <span
              className="px-2 py-0.5 text-xs rounded"
              style={{ backgroundColor: getNodeColor(node.type, node.riskScore) + '30', color: getNodeColor(node.type, node.riskScore) }}
            >
              {node.riskScore.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadEcosystemData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Narrative Ecosystem</h1>
          <p className="text-gray-400">Network graph of all narratives and their relationships</p>
        </div>
        <div className="flex gap-2">
          {(['graph', 'centrality', 'influence', 'volatility'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {data?.statistics && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Total Nodes</p>
            <p className="text-2xl font-bold text-white">{data.statistics.totalNodes}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Total Edges</p>
            <p className="text-2xl font-bold text-white">{data.statistics.totalEdges}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Avg Centrality</p>
            <p className="text-2xl font-bold text-white">{data.statistics.avgCentrality.toFixed(1)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Avg Volatility</p>
            <p className="text-2xl font-bold text-white">{data.statistics.avgVolatility.toFixed(1)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Network Density</p>
            <p className="text-2xl font-bold text-white">{data.statistics.networkDensity.toFixed(3)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-400">Dominant Type</p>
            <p className="text-xl font-bold text-white capitalize">{data.statistics.dominantType}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Graph Visualization */}
        <div className="col-span-3 bg-gray-800/50 rounded-lg p-4">
          {renderGraph()}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {viewMode === 'graph' && selectedNode && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Selected Node</h3>
              <div className="space-y-2">
                <p className="text-white font-medium">{selectedNode.label}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Type</p>
                    <p className="text-white capitalize">{selectedNode.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Risk Score</p>
                    <p className="text-white">{selectedNode.riskScore.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Centrality</p>
                    <p className="text-white">{selectedNode.centralityScore.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Influence</p>
                    <p className="text-white">{selectedNode.influenceRadius.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'centrality' && data && renderNodeList(data.highCentralityNodes, 'High Centrality Nodes')}
          {viewMode === 'influence' && data && renderNodeList(data.influenceHubs, 'Influence Hubs')}
          {viewMode === 'volatility' && data && renderNodeList(data.volatileNodes, 'Volatile Nodes')}

          {/* Legend */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-400">High Risk Narrative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-400">Medium Risk Narrative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400">Low Risk Narrative</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-400">Cluster</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-400">Amplifier</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-green-500"></div>
                <span className="text-gray-400">Reinforcement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500"></div>
                <span className="text-gray-400">Opposition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-purple-500"></div>
                <span className="text-gray-400">Mutation Lineage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
