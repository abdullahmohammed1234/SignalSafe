import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { NarrativeInteraction } from '../models/NarrativeInteraction';

export interface ExecutiveSummary {
  timestamp: Date;
  summaryLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskScore: number;
  primaryDriver: string;
  recommendedAction: string;
  confidenceLevel: number;
  expectedEscalationWindow: string;
  keyInsights: ExecutiveInsight[];
  riskOutlook: RiskOutlook;
  decisionUrgency: 'routine' | 'elevated' | 'urgent' | 'immediate';
}

export interface ExecutiveInsight {
  category: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskOutlook {
  trend: 'improving' | 'stable' | 'deteriorating';
  predictedChange: number;
  timeline: {
    timeframe: string;
    expectedRisk: number;
  }[];
}

/**
 * Generate executive summary
 */
export const generateExecutiveSummary = async (): Promise<ExecutiveSummary> => {
  // Gather all relevant data
  const latestSnapshot = await RiskSnapshot.findOne().sort({ timestamp: -1 });
  const recentSnapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(10);
  
  const clusters = await Cluster.find().sort({ growthRate: -1 });
  const narratives = await Narrative.find({ 
    lifecycleStage: { $in: ['Emerging', 'Accelerating'] } 
  });
  const interactions = await NarrativeInteraction.find({ isActive: true });

  const riskScore = latestSnapshot?.overallRiskScore || 0;
  
  // Determine summary level
  const summaryLevel = getSummaryLevel(riskScore);
  
  // Identify primary driver
  const primaryDriver = identifyPrimaryDriver(latestSnapshot, clusters, narratives, interactions);
  
  // Generate recommended action
  const recommendedAction = generateRecommendation(summaryLevel, primaryDriver, riskScore);
  
  // Calculate confidence level
  const confidenceLevel = calculateConfidence(recentSnapshots.length, clusters.length);
  
  // Determine escalation window
  const expectedEscalationWindow = determineEscalationWindow(riskScore, narratives, recentSnapshots);
  
  // Generate key insights
  const keyInsights = generateKeyInsights(latestSnapshot, clusters, narratives, interactions, summaryLevel);
  
  // Generate risk outlook
  const riskOutlook = generateRiskOutlook(recentSnapshots, riskScore);
  
  // Determine decision urgency
  const decisionUrgency = determineUrgency(summaryLevel, riskScore, keyInsights);

  return {
    timestamp: new Date(),
    summaryLevel,
    riskScore,
    primaryDriver,
    recommendedAction,
    confidenceLevel,
    expectedEscalationWindow,
    keyInsights,
    riskOutlook,
    decisionUrgency,
  };
};

/**
 * Determine summary level from risk score
 */
function getSummaryLevel(score: number): ExecutiveSummary['summaryLevel'] {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Critical';
}

/**
 * Identify the primary risk driver
 */
function identifyPrimaryDriver(
  snapshot: any,
  clusters: any[],
  narratives: any[],
  interactions: any[]
): string {
  if (!snapshot) return 'Insufficient Data';

  // Compare risk components
  const components: Record<string, number> = {
    'Sentiment Acceleration': snapshot ? (snapshot.sentimentAcceleration || 0) : 0,
    'Cluster Growth': snapshot ? (snapshot.clusterGrowthRate || 0) : 0,
    'Anomaly Detection': snapshot ? (snapshot.anomalyScore || 0) : 0,
    'Narrative Spread': snapshot ? (snapshot.narrativeSpreadSpeed || 0) : 0,
  };

  // Add interaction factor
  if (interactions.length > 0) {
    components['Narrative Interaction'] = interactions.length * 15;
  }

  // Add cluster factor
  if (clusters.length > 0) {
    const topCluster = clusters[0];
    if (topCluster.growthRate > 50) {
      components['Cluster Escalation'] = topCluster.growthRate * 0.5;
    }
  }

  // Find max
  let maxKey = 'Unknown';
  let maxValue = 0;
  
  for (const [key, value] of Object.entries(components)) {
    if (value > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  }

  return maxValue > 0 ? maxKey : 'Normal Operations';
}

/**
 * Generate recommended action based on level and driver
 */
function generateRecommendation(
  level: ExecutiveSummary['summaryLevel'],
  driver: string,
  score: number
): string {
  switch (level) {
    case 'Low':
      return 'Continue standard monitoring. No immediate action required.';
    
    case 'Moderate':
      if (driver.includes('Sentiment')) {
        return 'Monitor sentiment trends closely. Prepare communication strategy if escalation occurs.';
      }
      if (driver.includes('Cluster')) {
        return 'Track cluster development. Consider early intervention if growth accelerates.';
      }
      return 'Enhanced monitoring recommended. Review response protocols.';
    
    case 'High':
      if (driver.includes('Interaction')) {
        return 'Activate cross-narrative monitoring. Prepare containment strategies.';
      }
      return 'Immediate attention required. Deploy monitoring resources. Consider preliminary intervention.';
    
    case 'Critical':
      return 'URGENT: Activate crisis response protocol. Coordinate with stakeholders. Implement containment measures immediately.';
    
    default:
      return 'Continue monitoring.';
  }
}

/**
 * Calculate confidence level
 */
function calculateConfidence(snapshotCount: number, clusterCount: number): number {
  let confidence = 50; // Base

  // More snapshots = higher confidence
  if (snapshotCount >= 10) confidence += 25;
  else if (snapshotCount >= 5) confidence += 15;
  else if (snapshotCount >= 2) confidence += 5;

  // More clusters = more context
  if (clusterCount >= 5) confidence += 15;
  else if (clusterCount >= 2) confidence += 10;
  else if (clusterCount >= 1) confidence += 5;

  return Math.min(95, confidence);
}

/**
 * Determine expected escalation window
 */
function determineEscalationWindow(
  score: number,
  narratives: any[],
  snapshots: any[]
): string {
  if (score < 25) return 'Not applicable';
  if (score < 50) return '2–4 hours';
  
  // Check for acceleration
  if (snapshots.length >= 3) {
    const recent = snapshots.slice(0, 2).map(s => s.overallRiskScore);
    const older = snapshots.slice(2, 4).map(s => s.overallRiskScore);
    
    if (older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg > olderAvg + 10) {
        return '15–30 minutes';
      }
    }
  }

  // Check narratives
  if (narratives.some(n => n.lifecycleStage === 'Accelerating')) {
    return '30–60 minutes';
  }

  return '30–90 minutes';
}

/**
 * Generate key insights
 */
function generateKeyInsights(
  snapshot: any,
  clusters: any[],
  narratives: any[],
  interactions: any[],
  level: ExecutiveSummary['summaryLevel']
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // Risk level insight
  insights.push({
    category: 'Overall Status',
    text: `Current risk level is ${level.toLowerCase()} with ${snapshot?.overallRiskScore || 0}% risk score.`,
    priority: level === 'Critical' ? 'critical' : level === 'High' ? 'high' : 'medium',
  });

  // Cluster insights
  if (clusters.length > 0) {
    const topCluster = clusters[0];
    insights.push({
      category: 'Cluster Analysis',
      text: `Primary cluster showing ${topCluster.growthRate > 50 ? 'rapid' : 'moderate'} growth with ${topCluster.keywords?.slice(0, 3).join(', ')} as key themes.`,
      priority: topCluster.growthRate > 50 ? 'high' : 'medium',
    });
  }

  // Interaction insights
  if (interactions.length > 0) {
    insights.push({
      category: 'Narrative Interaction',
      text: `${interactions.length} active narrative interaction${interactions.length > 1 ? 's' : ''} detected, increasing cross-contamination risk.`,
      priority: 'high',
    });
  }

  // Narrative lifecycle insights
  const acceleratingNarratives = narratives.filter(n => n.lifecycleStage === 'Accelerating');
  if (acceleratingNarratives.length > 0) {
    insights.push({
      category: 'Lifecycle Status',
      text: `${acceleratingNarratives.length} narrative${acceleratingNarratives.length > 1 ? 's' : ''} in acceleration phase.`,
      priority: 'high',
    });
  }

  // Sentiment insight
  if (snapshot?.sentimentAcceleration > 50) {
    insights.push({
      category: 'Sentiment',
      text: 'Sentiment acceleration detected. Negative narrative momentum building.',
      priority: 'medium',
    });
  }

  // Anomaly insight
  if (snapshot?.anomalyScore > 60) {
    insights.push({
      category: 'Anomalies',
      text: 'Unusual patterns detected in narrative formation. Potential coordinated activity.',
      priority: 'critical',
    });
  }

  return insights.slice(0, 6); // Max 6 insights
}

/**
 * Generate risk outlook
 */
function generateRiskOutlook(
  snapshots: any[],
  currentScore: number
): RiskOutlook {
  // Determine trend
  let trend: RiskOutlook['trend'] = 'stable';
  let predictedChange = 0;

  if (snapshots.length >= 4) {
    const recent = snapshots.slice(0, 2).map(s => s.overallRiskScore);
    const older = snapshots.slice(2, 4).map(s => s.overallRiskScore);
    
    if (older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      predictedChange = Math.round(recentAvg - olderAvg);
      
      if (predictedChange > 10) trend = 'deteriorating';
      else if (predictedChange < -10) trend = 'improving';
    }
  }

  // Generate timeline
  const timeline = [
    { timeframe: '1 hour', expectedRisk: currentScore + predictedChange },
    { timeframe: '2 hours', expectedRisk: currentScore + (predictedChange * 1.5) },
    { timeframe: '4 hours', expectedRisk: Math.max(0, Math.min(100, currentScore + (predictedChange * 2))) },
  ];

  return {
    trend,
    predictedChange,
    timeline,
  };
}

/**
 * Determine decision urgency
 */
function determineUrgency(
  level: ExecutiveSummary['summaryLevel'],
  score: number,
  insights: ExecutiveInsight[]
): ExecutiveSummary['decisionUrgency'] {
  // Check for critical insights
  const hasCriticalInsight = insights.some(i => i.priority === 'critical');
  
  if (level === 'Critical' || hasCriticalInsight) {
    return 'immediate';
  }
  
  if (level === 'High') {
    return 'urgent';
  }
  
  if (level === 'Moderate') {
    return 'elevated';
  }
  
  return 'routine';
}

/**
 * Get historical executive summaries
 */
export const getExecutiveSummaryHistory = async (limit: number = 10): Promise<{
  date: Date;
  summaryLevel: string;
  riskScore: number;
  primaryDriver: string;
}[]> => {
  const snapshots = await RiskSnapshot.find()
    .sort({ timestamp: -1 })
    .limit(limit);

  // Generate summaries from historical data
  return snapshots.map(s => ({
    date: s.timestamp,
    summaryLevel: getSummaryLevel(s.overallRiskScore),
    riskScore: s.overallRiskScore,
    primaryDriver: 'Historical Analysis',
  }));
};

/**
 * Quick briefing for API response
 */
export const getQuickBrief = async (): Promise<{
  level: string;
  riskScore: number;
  urgency: string;
  action: string;
}> => {
  const summary = await generateExecutiveSummary();
  
  return {
    level: summary.summaryLevel,
    riskScore: summary.riskScore,
    urgency: summary.decisionUrgency,
    action: summary.recommendedAction,
  };
};
