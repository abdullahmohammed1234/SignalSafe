import { Post } from '../models/Post';
import { callAIService, EnrichedPost, ClusterData } from './aiProxy.service';
import { computeRiskScore, saveRiskSnapshot, updateClusters } from './riskEngine.service';
import { processAllClustersLifecycle } from './lifecycleEngine.service';
import { processAllPredictions } from './predictionEngine.service';
import { processAllConfidence } from './confidenceEngine.service';
import { computeBaseline } from './historicalBaseline.service';
// Phase 5 imports
import { adaptWeights, getCurrentWeights } from './adaptiveWeightEngine.service';
import { detectDrift, getDriftStatus } from './driftDetection.service';
import { checkAndAutoRetrain } from './modelRetraining.service';
import { updateEscalationState, getStateSummary } from './escalationStateMachine';
import { runRobustnessCheck, getRobustnessStatus } from './robustness.service';

interface QueuedPost {
  _id: string;
  text: string;
  source: string;
  region: string;
  createdAt: Date;
}

// Queue state
let processingQueue: QueuedPost[] = [];
let isProcessing = false;
const BATCH_SIZE = 10;
const PROCESS_INTERVAL = 5000;

// Distributed processing config
const horizontalScalingReady = true;
let workerCount = 1;
let currentWorker = 0;

// Caching layer
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Add posts to processing queue
 */
export const addToQueue = (posts: QueuedPost[]): void => {
  processingQueue.push(...posts);
  console.log(`📥 Added ${posts.length} posts to queue. Queue size: ${processingQueue.length}`);
};

/**
 * Get worker-specific queue slice for distributed processing
 */
const getWorkerQueueSlice = (workerId: number): QueuedPost[] => {
  if (workerCount === 1) {
    return processingQueue.slice(0, BATCH_SIZE);
  }
  
  // Distribute work across workers
  const slice: QueuedPost[] = [];
  let count = 0;
  
  for (let i = 0; i < processingQueue.length && count < BATCH_SIZE; i++) {
    if (i % workerCount === workerId) {
      slice.push(processingQueue[i]);
      count++;
    }
  }
  
  return slice;
};

/**
 * Remove processed items from queue (distributed-aware)
 */
const removeFromQueue = (processed: QueuedPost[]): void => {
  if (workerCount === 1) {
    processingQueue = processingQueue.slice(BATCH_SIZE);
  } else {
    // Remove processed items
    const processedIds = new Set(processed.map(p => p._id));
    processingQueue = processingQueue.filter(p => !processedIds.has(p._id));
  }
};

/**
 * Cache management
 */
export const setCache = <T>(key: string, data: T, ttl: number = CACHE_TTL): void => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
};

export const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
};

export const clearCache = (): void => {
  cache.clear();
};

export const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
};

/**
 * Main queue processing function
 */
export const processQueue = async (): Promise<void> => {
  if (isProcessing || processingQueue.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    // Get worker-specific batch
    const batch = getWorkerQueueSlice(currentWorker);
    
    if (batch.length === 0) {
      isProcessing = false;
      return;
    }

    // Remove processed items
    removeFromQueue(batch);

    console.log(`⚙️ [Worker ${currentWorker}] Processing batch of ${batch.length} posts...`);

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

    // === PHASE 5: Autonomous Processing ===
    
    // Run autonomous processing in background
    runAutonomousCycle().catch(err => {
      console.error('Autonomous cycle error:', err);
    });

  } catch (error) {
    console.error('❌ Error processing queue:', error);
  } finally {
    isProcessing = false;
    
    // Rotate to next worker
    if (horizontalScalingReady) {
      currentWorker = (currentWorker + 1) % workerCount;
    }
  }
};

/**
 * Phase 5: Full Autonomous Cycle
 * Runs all adaptive intelligence processes
 */
export const runAutonomousCycle = async (): Promise<void> => {
  console.log('🧠 Starting autonomous intelligence cycle...');
  
  try {
    // 1. Detect drift
    console.log('📡 Checking for model drift...');
    const driftStatus = await detectDrift();
    
    // 2. Adapt ensemble weights
    console.log('⚖️ Optimizing ensemble weights...');
    await adaptWeights();
    
    // 3. Update escalation state
    console.log('🔄 Updating escalation state...');
    await updateEscalationState();
    
    // 4. Check robustness
    console.log('🛡️ Running robustness checks...');
    await runRobustnessCheck();
    
    // 5. Check for auto-retraining
    console.log('🔧 Checking retraining needs...');
    await checkAndAutoRetrain();
    
    // Clear expired cache
    clearExpiredCache();
    
    console.log('✅ Autonomous cycle complete');
  } catch (error) {
    console.error('Error in autonomous cycle:', error);
  }
};

/**
 * Start queue processor with autonomous cycles
 */
export const startQueueProcessor = (): void => {
  // Start main queue processor
  setInterval(processQueue, PROCESS_INTERVAL);
  console.log('✅ Queue processor started');
  
  // Start autonomous cycle (every 5 minutes)
  setInterval(runAutonomousCycle, 300000);
  console.log('✅ Autonomous cycle scheduler started');
};

/**
 * Get queue and system status
 */
export const getQueueStatus = (): { 
  queueSize: number; 
  isProcessing: boolean;
  horizontalScalingReady: boolean;
  workerCount: number;
  currentWorker: number;
  cacheSize: number;
} => {
  return {
    queueSize: processingQueue.length,
    isProcessing,
    horizontalScalingReady,
    workerCount,
    currentWorker,
    cacheSize: cache.size,
  };
};

/**
 * Configure distributed processing
 */
export const configureWorkers = (count: number): void => {
  workerCount = Math.max(1, count);
  console.log(`⚙️ Configured for ${workerCount} workers`);
};

/**
 * Get cached ensemble weights
 */
export const getCachedWeights = () => {
  const cached = getCache('ensembleWeights');
  if (cached) return cached;
  
  const weights = getCurrentWeights();
  setCache('ensembleWeights', weights, 30000); // 30 second cache
  return weights;
};

/**
 * Get cached drift status
 */
export const getCachedDriftStatus = async () => {
  const cached = getCache('driftStatus');
  if (cached) return cached;
  
  const status = await getDriftStatus();
  setCache('driftStatus', status, 60000); // 1 minute cache
  return status;
};

/**
 * Get cached state summary
 */
export const getCachedStateSummary = async () => {
  const cached = getCache('stateSummary');
  if (cached) return cached;
  
  const summary = await getStateSummary();
  setCache('stateSummary', summary, 60000);
  return summary;
};

/**
 * Get cached robustness status
 */
export const getCachedRobustnessStatus = async () => {
  const cached = getCache('robustnessStatus');
  if (cached) return cached;
  
  const status = await getRobustnessStatus();
  setCache('robustnessStatus', status, 60000);
  return status;
};
