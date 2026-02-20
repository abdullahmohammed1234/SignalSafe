'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, RegionalRisk, NarrativeInteraction, InterventionRecommendation, ModelPerformanceRecord, SystemHealth } from '@/lib/api';
import RegionalRiskMap from '@/components/RegionalRiskMap';
import InteractionGraph from '@/components/InteractionGraph';
import InterventionPanel from '@/components/InterventionPanel';
import ModelPerformancePanel from '@/components/ModelPerformancePanel';
import MutationAlertPanel from '@/components/MutationAlertPanel';
import SystemHealthPanel from '@/components/SystemHealthPanel';

export default function StrategicDashboard() {
  const [regionalRisks, setRegionalRisks] = useState<RegionalRisk[]>([]);
  const [interactions, setInteractions] = useState<NarrativeInteraction[]>([]);
  const [interventions, setInterventions] = useState<InterventionRecommendation[]>([]);
  const [performance, setPerformance] = useState<ModelPerformanceRecord[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [regionalData, interactionData, interventionData, performanceData, healthData] = await Promise.all([
        api.getRegionalRisks(),
        api.getInteractions(),
        api.getInterventions(),
        api.getModelPerformance(),
        api.getSystemHealth(),
      ]);
      setRegionalRisks(regionalData);
      setInteractions(interactionData);
      setInterventions(interventionData);
      setPerformance(performanceData);
      setSystemHealth(healthData);
      setLoading(false);
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-signal-black p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading Strategic Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-signal-black p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">🛡 Strategic Intelligence</h1>
            <p className="text-gray-400 mt-1">Multi-Region Risk & Intervention Management</p>
          </div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-lg font-medium transition-all bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/30"
          >
            🎯 Back to Overview
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regional Risk Map */}
        <div className="col-span-1 md:col-span-2">
          <RegionalRiskMap regionalRisks={regionalRisks} />
        </div>

        {/* Interaction Graph */}
        <div className="col-span-1 md:col-span-2">
          <InteractionGraph interactions={interactions} />
        </div>

        {/* Intervention Panel */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <InterventionPanel recommendations={interventions} />
        </div>

        {/* Model Performance */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <ModelPerformancePanel performance={performance} />
        </div>

        {/* Mutation Alerts */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <MutationAlertPanel mutations={[]} />
        </div>

        {/* System Health */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <SystemHealthPanel health={systemHealth} />
        </div>
      </div>
    </div>
  );
}
