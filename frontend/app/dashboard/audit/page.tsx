'use client';

import React, { useState, useEffect } from 'react';

interface AuditRecord {
  recordId: string;
  timestamp: string;
  modelVersion: string;
  actionTaken: string;
  predictedOutcome: string;
  riskScoreAtAction: number;
  complianceFlags: string[];
  executiveSummary: string;
}

interface AuditStats {
  totalDecisions: number;
  decisionsByAction: Record<string, number>;
  avgRiskScore: number;
  complianceIssues: number;
  driftEvents: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [historyRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/audit/history?limit=50`),
        fetch(`${API_URL}/api/audit/stats`),
      ]);
      
      if (!historyRes.ok || !statsRes.ok) throw new Error('Failed to fetch audit data');
      
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();
      
      setRecords(historyData.records || []);
      setStats(statsData);
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
          <h1 className="text-3xl font-bold text-white">Decision Audit & Compliance</h1>
          <p className="text-gray-400 mt-1">Immutable log of all system decisions and actions</p>
        </div>
        <button
          onClick={fetchAuditData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Decisions</p>
          <p className="text-3xl font-bold text-white mt-1">{stats?.totalDecisions ?? 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Avg Risk Score</p>
          <p className="text-3xl font-bold text-white mt-1">
            {((stats?.avgRiskScore ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Compliance Issues</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{stats?.complianceIssues ?? 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Drift Events</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{stats?.driftEvents ?? 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Action Types</p>
          <p className="text-3xl font-bold text-white mt-1">
            {Object.keys(stats?.decisionsByAction ?? {}).length}
          </p>
        </div>
      </div>

      {/* Decisions by Action */}
      {stats?.decisionsByAction && Object.keys(stats.decisionsByAction).length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Decisions by Type</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.decisionsByAction).map(([action, count]) => (
              <span
                key={action}
                className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm"
              >
                {action}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Audit History Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Audit History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Model Version</th>
                <th className="pb-3">Risk Score</th>
                <th className="pb-3">Compliance</th>
                <th className="pb-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.recordId} className="border-b border-gray-700/50">
                  <td className="py-3 text-gray-400 text-sm">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 text-white">{record.actionTaken}</td>
                  <td className="py-3 text-gray-400 text-sm">{record.modelVersion}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      record.riskScoreAtAction > 0.7 ? 'bg-red-500/20 text-red-400' :
                      record.riskScoreAtAction > 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {(record.riskScoreAtAction * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3">
                    {record.complianceFlags?.length > 0 ? (
                      <span className="px-2 py-1 rounded text-sm bg-yellow-500/20 text-yellow-400">
                        {record.complianceFlags.length} flags
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-sm bg-green-500/20 text-green-400">
                        Clean
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-gray-400 text-sm max-w-xs truncate">
                    {record.executiveSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <p className="text-center text-gray-500 py-8">No audit records found</p>
        )}
      </div>
    </div>
  );
}
