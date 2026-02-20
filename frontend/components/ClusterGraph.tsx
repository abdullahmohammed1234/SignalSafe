'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ClusterNode {
  id: string;
  name: string;
  size: number;
  avgSentiment: number;
  volatilityIndex: number;
}

interface ClusterGraphProps {
  clusters: ClusterNode[];
}

export default function ClusterGraph({ clusters }: ClusterGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({
          width: width,
          height: Math.min(300, width * 0.5)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = document.getElementById('cluster-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#141A21';
    ctx.fillRect(0, 0, width, height);

    // If no clusters, show placeholder
    if (clusters.length === 0) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No clusters detected yet', width / 2, height / 2);
      return;
    }

    // Draw clusters as nodes
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Draw connections first
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    clusters.forEach((cluster, index) => {
      const angle = (index / clusters.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    clusters.forEach((cluster, index) => {
      const angle = (index / clusters.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Node size based on cluster size (normalized)
      const nodeSize = Math.max(15, Math.min(40, Math.sqrt(cluster.size) * 4));
      
      // Color based on sentiment
      const sentiment = cluster.avgSentiment;
      let color: string;
      if (sentiment < -0.3) {
        color = '#FF4444'; // Negative - red
      } else if (sentiment < 0.3) {
        color = '#F59E0B'; // Neutral - amber
      } else {
        color = '#10B981'; // Positive - emerald
      }
      
      // Draw glow for high volatility
      if (cluster.volatilityIndex > 0.5) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }
      
      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF30';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const labelY = y + nodeSize + 14;
      ctx.fillText(cluster.name.substring(0, 12), x, labelY);
      
      // Draw size
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${cluster.size}`, x, labelY + 12);
    });

    // Draw center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#1E2630';
    ctx.fill();
    ctx.strokeStyle = '#FFB020';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFB020';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI', centerX, centerY + 4);

  }, [clusters, dimensions]);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-300">Cluster Graph</h3>
      <div ref={containerRef} className="w-full">
        <canvas
          id="cluster-canvas"
          className="w-full"
          style={{ height: dimensions.height, display: 'block' }}
        />
      </div>
      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Positive</span>
        </div>
      </div>
    </div>
  );
}
