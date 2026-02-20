'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SentimentDataPoint {
  timestamp: string;
  score: number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
}

export default function SentimentChart({ data }: SentimentChartProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-300">Live Sentiment</h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2630" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6B7280" 
              fontSize={10}
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={10}
              domain={[-1, 1]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#141A21', 
                border: '1px solid #1E2630',
                borderRadius: '8px',
                color: '#E5E7EB'
              }}
              labelFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
            <ReferenceLine y={-0.5} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#FFB020" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#FFB020' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
    </div>
  );
}
