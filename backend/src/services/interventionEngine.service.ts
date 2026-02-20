import { Narrative, INarrative } from '../models/Narrative';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { Cluster } from '../models/Cluster';
import { getActiveInteractions } from './interactionEngine.service';
import { emitInterventionRecommendation } from '../sockets/socket';

export type InterventionAction = 
  | 'Monitor'
  | 'Preemptive Communication'
  | 'Escalate to Authority'
  | 'Deploy Counter-Narrative';

export interface InterventionRecommendation {
  clusterId: string;
  recommendedAction: InterventionAction;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  timeToPeakPrediction: number | null;
  confidenceScore: number;
  interactionScore: number;
  riskEscalation: number;
  timestamp: Date;
}

// Determine urgency level based on multiple factors
const calculateUrgencyLevel = (
  lifecycleStage: string,
  riskScore: number,
  interactionScore: number,
  confidenceScore: number
): 1 | 2 | 3 | 4 | 5 => {
  let urgencyScore = 0;
  
  // Stage-based urgency
  switch (lifecycleStage) {
    case 'Emerging':
      urgencyScore += 1;
      break;
    case 'Accelerating':
      urgencyScore += 3;
      break;
    case 'Peak':
      urgencyScore += 4;
      break;
    case 'Declining':
      urgencyScore += 1;
      break;
  }
  
  // Risk score contribution
  if (riskScore >= 80) urgencyScore += 5;
  else if (riskScore >= 60) urgencyScore += 4;
  else if (riskScore >= 40) urgencyScore += 3;
  else if (riskScore >= 20) urgencyScore += 2;
  else urgencyScore += 1;
  
  // Interaction score contribution (linked narratives are more dangerous)
  urgencyScore += Math.min(3, interactionScore * 3);
  
  // Confidence contribution (lower confidence = more uncertainty = higher urgency for investigation)
  if (confidenceScore < 30) urgencyScore += 2;
  else if (confidenceScore < 50) urgencyScore += 1;
  
  // Map to 1-5 scale
  if (urgencyScore >= 12) return 5;
  if (urgencyScore >= 9) return 4;
  if (urgencyScore >= 6) return 3;
  if (urgencyScore >= 3) return 2;
  return 1;
};

// Determine recommended action based on narrative characteristics
const determineRecommendedAction = (
  lifecycleStage: string,
  riskScore: number,
  urgencyLevel: number,
  interactionScore: number
): InterventionAction => {
  // High urgency, high risk = Escalate
  if (urgencyLevel >= 5 || (riskScore >= 80 && urgencyLevel >= 4)) {
    return 'Escalate to Authority';
  }
  
  // Accelerating with high interaction = Counter-narrative
  if (lifecycleStage === 'Accelerating' && interactionScore > 0.5) {
    return 'Deploy Counter-Narrative';
  }
  
  // Emerging but with signs of acceleration = Preemptive
  if (lifecycleStage === 'Emerging' && urgencyLevel >= 3) {
    return 'Preemptive Communication';
  }
  
  // At peak risk = Deploy counter-narrative
  if (lifecycleStage === 'Peak' && riskScore >= 60) {
    return 'Deploy Counter-Narrative';
  }
  
  // Default to monitor
  return 'Monitor';
};

// Generate reasoning string
const generateReasoning = (
  lifecycleStage: string,
  riskScore: number,
  urgencyLevel: number,
  interactionScore: number,
  action: InterventionAction
): string => {
  const reasons: string[] = [];
  
  reasons.push(`Narrative is in ${lifecycleStage} stage.`);
  
  if (riskScore >= 60) {
    reasons.push(`Risk score of ${riskScore} indicates significant escalation potential.`);
  }
  
  if (interactionScore > 0.5) {
    reasons.push(`Strong narrative interaction detected (${(interactionScore * 100).toFixed(0)}%).`);
  }
  
  if (urgencyLevel >= 4) {
    reasons.push(`Urgency level ${urgencyLevel} warrants ${action}.`);
  }
  
  return reasons.join(' ');
};

// Generate recommendation for a single narrative
const generateNarrativeRecommendation = async (
  narrative: INarrative,
  cluster: any,
  currentRisk: number,
  interactions: any[]
): Promise<InterventionRecommendation> => {
  // Calculate interaction score for this narrative
  const narrativeInteractions = interactions.filter(
    i => i.narrativeA === narrative.clusterId || i.narrativeB === narrative.clusterId
  );
  const maxInteractionScore = narrativeInteractions.length > 0
    ? Math.max(...narrativeInteractions.map(i => i.interactionScore))
    : 0;
  
  const urgencyLevel = calculateUrgencyLevel(
    narrative.lifecycleStage,
    currentRisk,
    maxInteractionScore,
    narrative.confidenceScore
  );
  
  const recommendedAction = determineRecommendedAction(
    narrative.lifecycleStage,
    currentRisk,
    urgencyLevel,
    maxInteractionScore
  );
  
  const reasoning = generateReasoning(
    narrative.lifecycleStage,
    currentRisk,
    urgencyLevel,
    maxInteractionScore,
    recommendedAction
  );
  
  return {
    clusterId: narrative.clusterId,
    recommendedAction,
    urgencyLevel,
    reasoning,
    timeToPeakPrediction: narrative.timeToPeakPrediction,
    confidenceScore: narrative.confidenceScore,
    interactionScore: maxInteractionScore,
    riskEscalation: currentRisk,
    timestamp: new Date(),
  };
};

// Generate recommendations for all active narratives
export const generateAllRecommendations = async (): Promise<InterventionRecommendation[]> => {
  try {
    const narratives = await Narrative.find().sort({ growthVelocity: -1 });
    const currentRisk = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    const interactions = await getActiveInteractions();
    
    const recommendations: InterventionRecommendation[] = [];
    
    for (const narrative of narratives) {
      const cluster = await Cluster.findOne({ clusterId: narrative.clusterId });
      const riskScore = cluster ? (cluster.growthRate * 0.5 + (1 - cluster.avgSentiment) * 50) : 50;
      
      const recommendation = await generateNarrativeRecommendation(
        narrative,
        cluster,
        riskScore,
        interactions
      );
      
      recommendations.push(recommendation);
    }
    
    // Sort by urgency level
    recommendations.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
    
    // Emit update via WebSocket
    emitInterventionRecommendation(recommendations);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};

// Get recommendation for a specific narrative
export const getNarrativeRecommendation = async (clusterId: string): Promise<InterventionRecommendation | null> => {
  try {
    const narrative = await Narrative.findOne({ clusterId });
    if (!narrative) return null;
    
    const cluster = await Cluster.findOne({ clusterId });
    const currentRisk = await RiskSnapshot.findOne().sort({ timestamp: -1 });
    const interactions = await getActiveInteractions();
    
    const riskScore = cluster ? (cluster.growthRate * 0.5 + (1 - cluster.avgSentiment) * 50) : 50;
    
    return await generateNarrativeRecommendation(
      narrative,
      cluster,
      riskScore,
      interactions
    );
  } catch (error) {
    console.error('Error getting narrative recommendation:', error);
    return null;
  }
};

// Get high-priority recommendations (urgency >= 4)
export const getHighPriorityRecommendations = async (): Promise<InterventionRecommendation[]> => {
  const all = await generateAllRecommendations();
  return all.filter(r => r.urgencyLevel >= 4);
};
