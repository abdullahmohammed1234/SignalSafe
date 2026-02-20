'use client';

import React from 'react';
import { SystemHealth } from '@/lib/api';

interface SystemHealthPanelProps {
  health: SystemHealth | null;
}

export default function SystemHealthPanel({ health }: SystemHealthPanelProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500/20';
      case 'degraded': return 'bg-yellow-500/20';
      case 'unhealthy': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!health) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          🔧 System Health
        </h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          Loading system status...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🔧 System Health
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(health.status)} ${getStatusColor(health.status)}`}>
          {health.status.toUpperCase()}
        </div>
      </div>

      {/* Uptime */}
      <div className="mb-4">
        <div className="text-xs text-gray-400">Uptime</div>
        <div className="text-xl font-bold text-white">{formatUptime(health.uptime)}</div>
      </div>

      {/* Database Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Database</span>
          <span className={`text-sm font-medium ${health.database.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
            {health.database.status}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Latency</span>
          <span className="text-white">{health.database.latency}ms</span>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-white">{health.database.collections.posts}</div>
          <div className="text-xs text-gray-500">Posts</div>
        </div>
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-white">{health.database.collections.clusters}</div>
          <div className="text-xs text-gray-500">Clusters</div>
        </div>
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-white">{health.database.collections.narratives}</div>
          <div className="text-xs text-gray-500">Narratives</div>
        </div>
      </div>

      {/* Performance */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Response</span>
          <span className="text-white">{health.performance.avgResponseTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Error Rate</span>
          <span className={health.performance.errorRate > 5 ? 'text-red-400' : 'text-emerald-400'}>
            {health.performance.errorRate.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Posts (24h)</span>
          <span className="text-white">{health.data.totalPosts24h}</span>
        </div>
      </div>
    </div>
  );
}
