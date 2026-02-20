import { NarrativeInteraction, INarrativeInteraction } from '../models/NarrativeInteraction';
import { Cluster } from '../models/Cluster';
import { Narrative } from '../models/Narrative';
import { emitNarrativeInteractionUpdate } from '../sockets/socket';

export interface ClusterEmbeddings {
  clusterId: string;
  keywords: string[];
  centroid?: number[];
}

// Similarity threshold for linking narratives
const SIMILARITY_THRESHOLD = 0.65;
const INTERACTION_WEIGHT = 0.15;

// Compute cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Generate pseudo-embeddings from keywords for similarity comparison
// In production, this would use actual embeddings from the AI service
const generateKeywordEmbedding = (keywords: string[]): number[] => {
  // Create a simple hash-based embedding from keywords
  const embedding = new Array(384).fill(0);
  
  for (const keyword of keywords) {
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
      const char = keyword.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Distribute hash across embedding dimensions
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += Math.sin((hash + i) * 0.1) * 0.1;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  
  return embedding;
};

// Check if both narratives are accelerating
const areBothAccelerating = async (clusterIdA: string, clusterIdB: string): Promise<boolean> => {
  try {
    const narrativeA = await Narrative.findOne({ clusterId: clusterIdA });
    const narrativeB = await Narrative.findOne({ clusterId: clusterIdB });
    
    if (!narrativeA || !narrativeB) return false;
    
    return narrativeA.lifecycleStage === 'Accelerating' && narrativeB.lifecycleStage === 'Accelerating';
  } catch (error) {
    console.error('Error checking narrative acceleration:', error);
    return false;
  }
};

// Calculate amplification effect based on combined growth rates
const calculateAmplificationEffect = (growthRateA: number, growthRateB: number): number => {
  // When both narratives are growing, they amplify each other
  const combinedGrowth = Math.max(0, growthRateA) + Math.max(0, growthRateB);
  return Math.min(100, combinedGrowth * 0.5);
};

// Detect interactions between all active clusters
export const detectNarrativeInteractions = async (): Promise<INarrativeInteraction[]> => {
  try {
    // Get all active clusters
    const clusters = await Cluster.find().sort({ growthRate: -1 });
    
    if (clusters.length < 2) {
      return [];
    }
    
    const interactions: INarrativeInteraction[] = [];
    
    // Compare each pair of clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterA = clusters[i];
        const clusterB = clusters[j];
        
        // Generate pseudo-embeddings from keywords
        const embeddingA = generateKeywordEmbedding(clusterA.keywords);
        const embeddingB = generateKeywordEmbedding(clusterB.keywords);
        
        // Calculate similarity
        const similarity = cosineSimilarity(embeddingA, embeddingB);
        
        // Check if both narratives are accelerating
        const isAccelerating = await areBothAccelerating(clusterA.clusterId, clusterB.clusterId);
        
        // Only link if similarity exceeds threshold AND both are accelerating
        if (similarity > SIMILARITY_THRESHOLD && isAccelerating) {
          const amplificationEffect = calculateAmplificationEffect(
            clusterA.growthRate, 
            clusterB.growthRate
          );
          
          // Interaction score combines similarity and amplification
          const interactionScore = (similarity * 0.6) + (amplificationEffect * 0.4);
          
          // Check if interaction already exists
          let existingInteraction = await NarrativeInteraction.findOne({
            $or: [
              { narrativeA: clusterA.clusterId, narrativeB: clusterB.clusterId },
              { narrativeA: clusterB.clusterId, narrativeB: clusterA.clusterId },
            ],
          });
          
          if (existingInteraction) {
            // Update existing interaction
            existingInteraction.interactionScore = Math.max(existingInteraction.interactionScore, interactionScore);
            existingInteraction.similarityScore = similarity;
            existingInteraction.amplificationEffect = Math.max(existingInteraction.amplificationEffect, amplificationEffect);
            existingInteraction.lastDetected = new Date();
            existingInteraction.detectionCount += 1;
            existingInteraction.lastUpdated = new Date();
            await existingInteraction.save();
            interactions.push(existingInteraction);
          } else {
            // Create new interaction
            const newInteraction = new NarrativeInteraction({
              narrativeA: clusterA.clusterId,
              narrativeB: clusterB.clusterId,
              interactionScore,
              similarityScore: similarity,
              amplificationEffect,
              lastDetected: new Date(),
              isActive: true,
              detectionCount: 1,
              firstDetected: new Date(),
              lastUpdated: new Date(),
            });
            await newInteraction.save();
            interactions.push(newInteraction);
          }
        }
      }
    }
    
    // Deactivate stale interactions (not detected in last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await NarrativeInteraction.updateMany(
      { lastDetected: { $lt: thirtyMinutesAgo } },
      { isActive: false }
    );
    
    // Emit WebSocket update
    if (interactions.length > 0) {
      const activeInteractions = await getActiveInteractions();
      emitNarrativeInteractionUpdate(activeInteractions);
    }
    
    return interactions;
  } catch (error) {
    console.error('Error detecting narrative interactions:', error);
    return [];
  }
};

// Get all active interactions
export const getActiveInteractions = async (): Promise<INarrativeInteraction[]> => {
  return await NarrativeInteraction.find({ isActive: true }).sort({ interactionScore: -1 });
};

// Get interaction by ID
export const getInteractionById = async (id: string): Promise<INarrativeInteraction | null> => {
  return await NarrativeInteraction.findById(id);
};

// Get interactions for a specific narrative
export const getInteractionsForNarrative = async (clusterId: string): Promise<INarrativeInteraction[]> => {
  return await NarrativeInteraction.find({
    $or: [{ narrativeA: clusterId }, { narrativeB: clusterId }],
    isActive: true,
  }).sort({ interactionScore: -1 });
};

// Calculate escalation risk score with interaction boost
export const calculateEscalationRiskWithInteraction = (
  baseRiskScore: number,
  interactionScore: number
): number => {
  if (interactionScore <= 0) return baseRiskScore;
  
  // Add interaction boost to base risk
  const interactionBoost = interactionScore * INTERACTION_WEIGHT;
  const escalatedRisk = baseRiskScore + interactionBoost;
  
  return Math.min(100, Math.round(escalatedRisk * 100) / 100);
};
