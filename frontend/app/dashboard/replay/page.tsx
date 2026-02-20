'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ReplayPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [replayState, setReplayState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (playing && selectedEvent) {
      const interval = setInterval(() => {
        stepForward();
      }, 2000 / (replayState?.speed || 1));
      return () => clearInterval(interval);
    }
  }, [playing, replayState?.speed]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getReplayEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (eventId: string) => {
    const event = await api.getReplayEvent(eventId);
    setSelectedEvent(event);
    const state = await api.startReplay(eventId, 1);
    setReplayState(state);
    setPlaying(false);
  };

  const stepForward = async () => {
    if (!selectedEvent) return;
    const snapshot = await api.stepReplayForward(selectedEvent.eventId);
    if (snapshot) {
      const state = await api.getReplayState(selectedEvent.eventId);
      setReplayState(state);
    } else {
      setPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (!selectedEvent) return;
    const result = await api.toggleReplayPlay(selectedEvent.eventId);
    setPlaying(result.isPlaying);
  };

  const stopReplay = async () => {
    if (!selectedEvent) return;
    await api.stopReplay(selectedEvent.eventId);
    setPlaying(false);
    setReplayState(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-indigo-400 text-xl">Loading replay events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">▶ Scenario Replay Engine</h1>
          <p className="text-gray-400">Replay historical events with timeline visualization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event List */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
            <h2 className="text-xl font-semibold text-white mb-4">📋 Historical Events</h2>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <button
                    key={event.eventId}
                    onClick={() => selectEvent(event.eventId)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedEvent?.eventId === event.eventId
                        ? 'bg-indigo-500/20 border border-indigo-500/50'
                        : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <div className="text-white font-medium">{event.name}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      {event.snapshotCount} snapshots • {event.duration} min
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(event.startTime).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No replay events available</div>
            )}
          </div>

          {/* Replay Player */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEvent ? (
              <>
                {/* Player Controls */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">{selectedEvent.name}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          playing
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                        }`}
                      >
                        {playing ? '⏸ Pause' : '▶ Play'}
                      </button>
                      <button
                        onClick={() => stepForward()}
                        disabled={playing}
                        className="px-4 py-2 rounded-lg font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                      >
                        ⏭ Step
                      </button>
                      <button
                        onClick={stopReplay}
                        className="px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                      >
                        ⏹ Stop
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${replayState ? (replayState.currentStep / replayState.totalSteps) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Step {replayState?.currentStep || 0} of {replayState?.totalSteps || 0}</span>
                      <span>Speed: {replayState?.speed || 1}x</span>
                    </div>
                  </div>
                </div>

                {/* Current Snapshot */}
                {replayState?.currentSnapshot && (
                  <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
                    <h3 className="text-lg font-semibold text-white mb-4">📊 Current State</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Risk Score</div>
                        <div className={`text-2xl font-bold ${
                          replayState.currentSnapshot.riskScore > 75 ? 'text-red-500' :
                          replayState.currentSnapshot.riskScore > 50 ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {replayState.currentSnapshot.riskScore.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Classification</div>
                        <div className="text-white font-medium">{replayState.currentSnapshot.classification}</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Timestamp</div>
                        <div className="text-white text-sm">
                          {new Date(replayState.currentSnapshot.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Sentiment Accel</div>
                        <div className="text-white">{replayState.currentSnapshot.sentimentAcceleration.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Cluster Growth</div>
                        <div className="text-white">{replayState.currentSnapshot.clusterGrowthRate.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-xl">
                        <div className="text-gray-400 text-sm">Anomaly Score</div>
                        <div className="text-white">{replayState.currentSnapshot.anomalyScore.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select an Event</h3>
                  <p className="text-gray-400">Choose a historical event from the list to start replay</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
