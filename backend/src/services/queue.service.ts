import { Post } from '../models/Post';
import { callAIService, EnrichedPost, ClusterData } from './aiProxy.service';
import { computeRiskScore, saveRiskSnapshot, updateClusters } from './riskEngine.service';
import { processAllClustersLifecycle } from './lifecycleEngine.service';
import { processAllPredictions } from './predictionEngine.service';
import { processAllConfidence } from './confidenceEngine.service';
import { computeBaseline } from './historicalBaseline.service';

interface QueuedPost {
  _id: string;
  text: string;
  source: string;
  region: string;
  createdAt: Date;
}

let processingQueue: QueuedPost[] = [];
let isProcessing = false;
const BATCH_SIZE = 10;
const PROCESS_INTERVAL = 5000;

export const addToQueue = (posts: QueuedPost[]): void => {
  processingQueue.push(...posts);
  console.log(`📥 Added ${posts.length} posts to queue. Queue size: ${processingQueue.length}`);
};

export const processQueue = async (): Promise<void> => {
  if (isProcessing || processingQueue.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    const batch = processingQueue.slice(0, BATCH_SIZE);
    processingQueue = processingQueue.slice(BATCH_SIZE);

    console.log(`⚙️ Processing batch of ${batch.length} posts...`);

    const postsForAI = batch.map((post) => ({
      id: post._id.toString(),
      text: post.text,
      timestamp: post.createdAt,
    }));

    const analysisResult = await callAIService(postsForAI);

    // Update posts with enriched data
    for (const enrichedPost of analysisResult.enrichedPosts) {
      const originalPost = batch.find((p) => p._id.toString() === enrichedPost.id);
      if (originalPost) {
        await Post.findByIdAndUpdate(originalPost._id, {
          sentimentScore: enrichedPost.sentimentScore,
          embedding: enrichedPost.embedding,
          clusterId: analysisResult.clusters.length > 0 ? analysisResult.clusters[0].clusterId : undefined,
        });
      }
    }

    // Update clusters
    await updateClusters(analysisResult.clusters);

    // Compute and save risk score
    const riskResult = computeRiskScore(analysisResult.metrics);
    await saveRiskSnapshot(riskResult);

    console.log(`✅ Risk score computed: ${riskResult.overallRiskScore} - ${riskResult.classification}`);

    // === PHASE 2: Predictive Intelligence Processing ===
    
    // 1. Update narrative lifecycles
    console.log('🔄 Processing narrative lifecycles...');
    await processAllClustersLifecycle();

    // 2. Run predictions
    console.log('🔮 Computing predictions...');
    await processAllPredictions();

    // 3. Calculate confidence scores
    console.log('📊 Calculating confidence scores...');
    await processAllConfidence();

    // 4. Compute baseline
    console.log('📈 Computing baseline...');
    await computeBaseline();

    console.log('✅ Phase 2 intelligence processing complete');
  } catch (error) {
    console.error('❌ Error processing queue:', error);
  } finally {
    isProcessing = false;
  }
};

export const startQueueProcessor = (): void => {
  setInterval(processQueue, PROCESS_INTERVAL);
  console.log('✅ Queue processor started');
};

export const getQueueStatus = (): { queueSize: number; isProcessing: boolean } => {
  return {
    queueSize: processingQueue.length,
    isProcessing,
  };
};
