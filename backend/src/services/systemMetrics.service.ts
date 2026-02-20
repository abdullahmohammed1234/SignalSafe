// System Metrics Service - Observability and Performance Monitoring

export interface SystemMetrics {
  timestamp: Date;
  aiService: ServiceMetrics;
  queue: QueueMetrics;
  websocket: WebSocketMetrics;
  database: DatabaseMetrics;
  overall: OverallMetrics;
}

export interface ServiceMetrics {
  responseTimeMs: number;
  successRate: number;
  requestsPerMinute: number;
  errorCount: number;
  lastError: string | null;
}

export interface QueueMetrics {
  processingTimeMs: number;
  queueDepth: number;
  messagesProcessed: number;
  failedMessages: number;
  avgWaitTimeMs: number;
}

export interface WebSocketMetrics {
  latencyMs: number;
  activeConnections: number;
  messagesBroadcast: number;
  broadcastsPerSecond: number;
}

export interface DatabaseMetrics {
  queryTimeMs: number;
  activeConnections: number;
  slowQueries: number;
  avgQueryTime: number;
}

export interface OverallMetrics {
  healthScore: number; // 0-100
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // seconds
  lastIncident: Date | null;
}

// In-memory metrics storage
let metricsHistory: SystemMetrics[] = [];
const MAX_HISTORY = 100;

// Current metrics (simulated for now)
let currentAIResponseTime = 0;
let currentQueueProcessingTime = 0;
let currentWebSocketLatency = 0;
let currentDbQueryTime = 0;
let currentActiveConnections = 0;

// Uptime tracking
const startTime = Date.now();

/**
 * Collect all system metrics
 */
export const collectSystemMetrics = async (): Promise<SystemMetrics> => {
  // Gather metrics from various sources
  const aiMetrics = await getAIServiceMetrics();
  const queueMetrics = await getQueueMetrics();
  const wsMetrics = await getWebSocketMetrics();
  const dbMetrics = await getDatabaseMetrics();
  
  // Calculate overall health
  const overall = calculateOverallHealth(aiMetrics, queueMetrics, wsMetrics, dbMetrics);
  
  const metrics: SystemMetrics = {
    timestamp: new Date(),
    aiService: aiMetrics,
    queue: queueMetrics,
    websocket: wsMetrics,
    database: dbMetrics,
    overall,
  };
  
  // Store in history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory = metricsHistory.slice(-MAX_HISTORY);
  }
  
  return metrics;
};

/**
 * Get AI service metrics
 */
async function getAIServiceMetrics(): Promise<ServiceMetrics> {
  // Simulate metrics collection
  // In production, this would query actual service endpoints
  
  // Simulate some variance
  const baseResponseTime = 150;
  const variance = Math.random() * 50 - 25;
  currentAIResponseTime = baseResponseTime + variance;
  
  return {
    responseTimeMs: Math.round(currentAIResponseTime),
    successRate: 98.5 + Math.random() * 1.5,
    requestsPerMinute: Math.floor(30 + Math.random() * 20),
    errorCount: Math.floor(Math.random() * 2),
    lastError: null,
  };
}

/**
 * Get queue metrics
 */
async function getQueueMetrics(): Promise<QueueMetrics> {
  const baseProcessingTime = 50;
  const variance = Math.random() * 30 - 15;
  currentQueueProcessingTime = baseProcessingTime + variance;
  
  return {
    processingTimeMs: Math.round(currentQueueProcessingTime),
    queueDepth: Math.floor(Math.random() * 10),
    messagesProcessed: Math.floor(100 + Math.random() * 50),
    failedMessages: Math.floor(Math.random() * 2),
    avgWaitTimeMs: Math.round(10 + Math.random() * 20),
  };
}

/**
 * Get WebSocket metrics
 */
async function getWebSocketMetrics(): Promise<WebSocketMetrics> {
  const baseLatency = 20;
  const variance = Math.random() * 10 - 5;
  currentWebSocketLatency = baseLatency + variance;
  
  return {
    latencyMs: Math.round(currentWebSocketLatency),
    activeConnections: Math.floor(5 + Math.random() * 10),
    messagesBroadcast: Math.floor(200 + Math.random() * 100),
    broadcastsPerSecond: Math.round((Math.random() * 3 + 1) * 10) / 10,
  };
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  const baseQueryTime = 15;
  const variance = Math.random() * 10 - 5;
  currentDbQueryTime = baseQueryTime + variance;
  
  return {
    queryTimeMs: Math.round(currentDbQueryTime),
    activeConnections: Math.floor(3 + Math.random() * 5),
    slowQueries: Math.floor(Math.random() * 2),
    avgQueryTime: Math.round(currentDbQueryTime),
  };
}

/**
 * Calculate overall system health
 */
function calculateOverallHealth(
  ai: ServiceMetrics,
  queue: QueueMetrics,
  ws: WebSocketMetrics,
  db: DatabaseMetrics
): OverallMetrics {
  // Calculate health score based on various factors
  let score = 100;
  
  // AI service health
  if (ai.responseTimeMs > 500) score -= 20;
  else if (ai.responseTimeMs > 300) score -= 10;
  
  if (ai.successRate < 95) score -= 15;
  else if (ai.successRate < 98) score -= 5;
  
  // Queue health
  if (queue.queueDepth > 20) score -= 15;
  else if (queue.queueDepth > 10) score -= 5;
  
  if (queue.failedMessages > 5) score -= 10;
  else if (queue.failedMessages > 2) score -= 3;
  
  // WebSocket health
  if (ws.latencyMs > 100) score -= 10;
  else if (ws.latencyMs > 50) score -= 3;
  
  // Database health
  if (db.queryTimeMs > 100) score -= 15;
  else if (db.queryTimeMs > 50) score -= 5;
  
  if (db.slowQueries > 5) score -= 10;
  else if (db.slowQueries > 2) score -= 3;
  
  score = Math.max(0, Math.min(100, score));
  
  let status: OverallMetrics['status'];
  if (score >= 80) status = 'healthy';
  else if (score >= 50) status = 'degraded';
  else status = 'unhealthy';
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  return {
    healthScore: score,
    status,
    uptime,
    lastIncident: null,
  };
}

/**
 * Get current system status
 */
export const getSystemStatus = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthScore: number;
  timestamp: Date;
}> => {
  const metrics = await collectSystemMetrics();
  
  return {
    status: metrics.overall.status,
    healthScore: metrics.overall.healthScore,
    timestamp: metrics.timestamp,
  };
};

/**
 * Get metrics history
 */
export const getMetricsHistory = async (limit: number = 20): Promise<SystemMetrics[]> => {
  // Ensure we have some data
  if (metricsHistory.length === 0) {
    await collectSystemMetrics();
  }
  
  return metricsHistory.slice(-limit);
};

/**
 * Get specific metric trend
 */
export const getMetricTrend = async (
  metricType: 'ai' | 'queue' | 'websocket' | 'database',
  metricName: string,
  limit: number = 20
): Promise<{
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'stable' | 'degrading';
} | null> => {
  const history = await getMetricsHistory(limit);
  
  if (history.length === 0) return null;
  
  let values: number[] = [];
  
  for (const m of history) {
    let value: number | undefined;
    
    switch (metricType) {
      case 'ai':
        value = (m.aiService as any)[metricName];
        break;
      case 'queue':
        value = (m.queue as any)[metricName];
        break;
      case 'websocket':
        value = (m.websocket as any)[metricName];
        break;
      case 'database':
        value = (m.database as any)[metricName];
        break;
    }
    
    if (value !== undefined) {
      values.push(value);
    }
  }
  
  if (values.length === 0) return null;
  
  const current = values[values.length - 1];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate trend
  let trend: 'improving' | 'stable' | 'degrading';
  if (values.length >= 5) {
    const recent = values.slice(-Math.floor(values.length / 2));
    const older = values.slice(0, Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    // For latency/query time, lower is better
    const isInverseMetric = ['responseTimeMs', 'latencyMs', 'queryTimeMs', 'processingTimeMs'].includes(metricName);
    
    if (isInverseMetric) {
      if (recentAvg < olderAvg * 0.9) trend = 'improving';
      else if (recentAvg > olderAvg * 1.1) trend = 'degrading';
      else trend = 'stable';
    } else {
      if (recentAvg > olderAvg * 1.1) trend = 'improving';
      else if (recentAvg < olderAvg * 0.9) trend = 'degrading';
      else trend = 'stable';
    }
  } else {
    trend = 'stable';
  }
  
  return {
    current: Math.round(current * 100) / 100,
    average: Math.round(average * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    trend,
  };
};

/**
 * Get system health summary for widget display
 */
export const getHealthSummary = async (): Promise<{
  overall: number;
  ai: number;
  queue: number;
  ws: number;
  db: number;
  status: string;
}> => {
  const metrics = await collectSystemMetrics();
  
  // Calculate individual component scores
  const aiScore = Math.max(0, 100 - (metrics.aiService.responseTimeMs / 5));
  const queueScore = Math.max(0, 100 - (metrics.queue.queueDepth * 2));
  const wsScore = Math.max(0, 100 - (metrics.websocket.latencyMs * 0.5));
  const dbScore = Math.max(0, 100 - (metrics.database.queryTimeMs * 0.5));
  
  return {
    overall: metrics.overall.healthScore,
    ai: Math.round(aiScore),
    queue: Math.round(queueScore),
    ws: Math.round(wsScore),
    db: Math.round(dbScore),
    status: metrics.overall.status,
  };
};

/**
 * Record a custom metric event
 */
export const recordMetric = (
  metricType: string,
  metricName: string,
  value: number
): void => {
  console.log(`📊 Metric recorded: ${metricType}.${metricName} = ${value}`);
  // In production, this would store to a metrics database
};

/**
 * Get alert status
 */
export const getAlertStatus = async (): Promise<{
  hasAlerts: boolean;
  alerts: {
    severity: 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }[];
}> => {
  const metrics = await collectSystemMetrics();
  
  const alerts: {
    severity: 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }[] = [];
  
  // Check AI service
  if (metrics.aiService.responseTimeMs > 500) {
    alerts.push({
      severity: 'critical',
      message: `AI service response time high: ${metrics.aiService.responseTimeMs}ms`,
      timestamp: new Date(),
    });
  } else if (metrics.aiService.responseTimeMs > 300) {
    alerts.push({
      severity: 'warning',
      message: `AI service response time elevated: ${metrics.aiService.responseTimeMs}ms`,
      timestamp: new Date(),
    });
  }
  
  // Check queue depth
  if (metrics.queue.queueDepth > 20) {
    alerts.push({
      severity: 'critical',
      message: `Queue depth critical: ${metrics.queue.queueDepth} messages`,
      timestamp: new Date(),
    });
  } else if (metrics.queue.queueDepth > 10) {
    alerts.push({
      severity: 'warning',
      message: `Queue depth elevated: ${metrics.queue.queueDepth} messages`,
      timestamp: new Date(),
    });
  }
  
  // Check WebSocket latency
  if (metrics.websocket.latencyMs > 100) {
    alerts.push({
      severity: 'warning',
      message: `WebSocket latency high: ${metrics.websocket.latencyMs}ms`,
      timestamp: new Date(),
    });
  }
  
  return {
    hasAlerts: alerts.length > 0,
    alerts,
  };
};
