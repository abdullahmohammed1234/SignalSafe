import mongoose from 'mongoose';
import { Post } from '../models/Post';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { RegionalRisk } from '../models/RegionalRisk';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  
  // Database health
  database: {
    status: 'connected' | 'disconnected' | 'error';
    latency: number;
    collections: {
      posts: number;
      clusters: number;
      narratives: number;
      riskSnapshots: number;
      regionalRisks: number;
    };
  };
  
  // Service health
  services: {
    queue: { status: string; queueLength: number };
    websocket: { status: string; connectedClients: number };
    ai: { status: string; latency: number };
  };
  
  // Performance metrics
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  
  // Data freshness
  data: {
    latestPostTimestamp: string | null;
    latestRiskTimestamp: string | null;
    activeNarratives: number;
    totalPosts24h: number;
  };
}

// Simple in-memory metrics (in production, use proper metrics library)
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
let startTime = Date.now();

export const recordRequest = (responseTime: number, isError: boolean = false): void => {
  requestCount++;
  totalResponseTime += responseTime;
  if (isError) errorCount++;
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    const start = Date.now();
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    // Get collection counts
    const [
      postsCount,
      clustersCount,
      narrativesCount,
      riskSnapshotsCount,
      regionalRisksCount,
    ] = await Promise.all([
      Post.countDocuments(),
      Cluster.countDocuments(),
      Narrative.countDocuments(),
      RiskSnapshot.countDocuments(),
      RegionalRisk.countDocuments(),
    ]);
    
    // Get latest timestamps
    const latestPost = await Post.findOne().sort({ createdAt: -1 });
    const latestRisk = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    
    // Get posts in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts24h = await Post.countDocuments({ createdAt: { $gte: oneDayAgo } });
    
    // Calculate metrics
    const uptime = Date.now() - startTime;
    const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
    const dbLatency = Date.now() - start;
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (dbState !== 1 || errorRate > 10 || dbLatency > 1000) {
      status = 'unhealthy';
    } else if (errorRate > 5 || dbLatency > 500) {
      status = 'degraded';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      version: '1.0.0',
      
      database: {
        status: dbStatus as 'connected' | 'disconnected' | 'error',
        latency: dbLatency,
        collections: {
          posts: postsCount,
          clusters: clustersCount,
          narratives: narrativesCount,
          riskSnapshots: riskSnapshotsCount,
          regionalRisks: regionalRisksCount,
        },
      },
      
      services: {
        queue: { status: 'running', queueLength: 0 },
        websocket: { status: 'active', connectedClients: 0 },
        ai: { status: 'available', latency: 0 },
      },
      
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerMinute: Math.round(requestCount / (uptime / 60000)),
        errorRate: Math.round(errorRate * 100) / 100,
      },
      
      data: {
        latestPostTimestamp: latestPost?.createdAt?.toISOString() || null,
        latestRiskTimestamp: latestRisk?.timestamp?.toISOString() || null,
        activeNarratives: narrativesCount,
        totalPosts24h: posts24h,
      },
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: '1.0.0',
      database: {
        status: 'error',
        latency: 0,
        collections: { posts: 0, clusters: 0, narratives: 0, riskSnapshots: 0, regionalRisks: 0 },
      },
      services: {
        queue: { status: 'error', queueLength: 0 },
        websocket: { status: 'unknown', connectedClients: 0 },
        ai: { status: 'unavailable', latency: 0 },
      },
      performance: { avgResponseTime: 0, requestsPerMinute: 0, errorRate: 100 },
      data: {
        latestPostTimestamp: null,
        latestRiskTimestamp: null,
        activeNarratives: 0,
        totalPosts24h: 0,
      },
    };
  }
};
