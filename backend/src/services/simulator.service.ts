import { Post } from '../models/Post';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { addToQueue } from './queue.service';

let simulatorInterval: NodeJS.Timeout | null = null;
let escalationLevel = 0;
let currentPhase: 'stable' | 'forming' | 'spike' | 'decay' = 'stable';

// Phase configurations
const PHASE_CONFIG = {
  stable: {
    postMultiplier: 1,
    escalationChance: 0.05,
    clusterGrowthRate: 0.1,
  },
  forming: {
    postMultiplier: 2,
    escalationChance: 0.15,
    clusterGrowthRate: 0.3,
  },
  spike: {
    postMultiplier: 4,
    escalationChance: 0.4,
    clusterGrowthRate: 0.8,
  },
  decay: {
    postMultiplier: 1.5,
    escalationChance: 0.2,
    clusterGrowthRate: -0.2,
  },
};

const NEUTRAL_TEMPLATES = [
  "Just checking the news this morning",
  "Interesting article about economics",
  "The weather is nice today",
  "Anyone watching the game tonight?",
  "Great coffee at the new cafe",
  "Traffic is light today",
  "Good day for a walk in the park",
  "Reading a book about history",
  "Cooking dinner for the family",
  "Just finished a workout",
];

const CONCERN_TEMPLATES = [
  "I'm worried about the economy",
  "Should I withdraw my savings?",
  "Banks seem shaky lately",
  "This inflation is getting bad",
  "Unemployment numbers are concerning",
  "The market is too volatile",
  "We might be heading for trouble",
  "This doesn't look good",
  "Experts are warning about recession",
  "Debt levels are too high",
];

const ESCALATION_TEMPLATES = [
  "PANIC! Everyone withdraw now!",
  "Bank run starting - get your money out!",
  "This is the beginning of the collapse",
  "They are lying to us about the crisis",
  "Financial system about to crash",
  "Emergency! Banks are failing!",
  "Everyone needs to act NOW",
  "The economy is going to collapse",
  "Prepare for the worst - it's happening",
  "This is a financial emergency",
];

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const SOURCES = ['Twitter', 'Reddit', 'Facebook', 'News Comment', 'Forum'];

const generatePost = (): { text: string; source: string; region: string } => {
  const config = PHASE_CONFIG[currentPhase];
  const rand = Math.random();
  let text: string;

  if (currentPhase === 'spike' && rand < config.escalationChance) {
    text = ESCALATION_TEMPLATES[Math.floor(Math.random() * ESCALATION_TEMPLATES.length)];
  } else if (escalationLevel > 0.3 && rand < config.escalationChance * 0.5) {
    text = CONCERN_TEMPLATES[Math.floor(Math.random() * CONCERN_TEMPLATES.length)];
  } else {
    text = NEUTRAL_TEMPLATES[Math.floor(Math.random() * NEUTRAL_TEMPLATES.length)];
  }

  return {
    text,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
  };
};

const updatePhase = () => {
  // Auto-transition phases based on escalation level
  if (escalationLevel < 0.3) {
    currentPhase = 'stable';
  } else if (escalationLevel >= 0.3 && escalationLevel < 0.6) {
    currentPhase = 'forming';
  } else if (escalationLevel >= 0.6 && escalationLevel < 0.85) {
    currentPhase = 'spike';
  } else {
    currentPhase = 'decay';
  }
};

const updateClusters = async () => {
  const config = PHASE_CONFIG[currentPhase];
  const existingClusters = await Cluster.find();
  
  for (const cluster of existingClusters) {
    // Apply phase-based growth rate
    const newGrowthRate = cluster.growthRate + config.clusterGrowthRate;
    const newSize = Math.max(1, Math.round(cluster.size * (1 + config.clusterGrowthRate * 0.1)));
    
    await Cluster.updateOne(
      { clusterId: cluster.clusterId },
      {
        growthRate: Math.max(0, Math.min(100, newGrowthRate)),
        size: newSize,
        lastUpdated: new Date(),
      }
    );
  }
};

export const startSimulator = async (): Promise<void> => {
  if (simulatorInterval) {
    console.log('⚠️ Simulator already running');
    return;
  }

  console.log('🚀 Starting data simulator...');
  escalationLevel = 0;
  currentPhase = 'stable';

  simulatorInterval = setInterval(async () => {
    const config = PHASE_CONFIG[currentPhase];
    
    // Gradually increase escalation level
    if (escalationLevel < 1 && currentPhase !== 'decay') {
      escalationLevel += 0.002 * config.clusterGrowthRate;
    } else if (currentPhase === 'decay') {
      escalationLevel -= 0.005;
    }

    // Update phase based on escalation
    updatePhase();

    // Generate batch of posts
    const baseBatchSize = Math.floor(Math.random() * 5) + 3;
    const batchSize = Math.floor(baseBatchSize * config.postMultiplier);
    const posts = [];

    for (let i = 0; i < batchSize; i++) {
      const postData = generatePost();
      const post = new Post({
        ...postData,
        createdAt: new Date(),
      });
      await post.save();
      posts.push(post);
    }

    // Update clusters based on phase
    await updateClusters();

    // Add to processing queue
    addToQueue(posts as any);

    // Log periodically
    if (Math.random() < 0.1) {
      console.log(`📊 Simulator: Phase=${currentPhase}, Generated ${batchSize} posts, escalation: ${(escalationLevel * 100).toFixed(1)}%`);
    }
  }, 5000);

  console.log('✅ Data simulator started - generating posts every 5 seconds');
};

export const stopSimulator = async (): Promise<void> => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('⏹️ Data simulator stopped');
  }
};

export const getSimulatorStatus = (): { running: boolean; escalationLevel: number; phase: string } => {
  return {
    running: simulatorInterval !== null,
    escalationLevel,
    phase: currentPhase,
  };
};

// Trigger a panic event - high-intensity spike
export const triggerPanicEvent = async (): Promise<{
  postsGenerated: number;
  clustersAffected: number;
  expectedRiskIncrease: number;
}> => {
  console.log('🚨 TRIGGERING PANIC EVENT!');
  
  // Generate burst of panic posts
  const panicPosts = [];
  const panicCount = 20;
  
  for (let i = 0; i < panicCount; i++) {
    const text = ESCALATION_TEMPLATES[Math.floor(Math.random() * ESCALATION_TEMPLATES.length)];
    const post = new Post({
      text,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      createdAt: new Date(),
    });
    await post.save();
    panicPosts.push(post);
  }

  // Create/update high-risk clusters
  const clusters = await Cluster.find().limit(5);
  let clustersAffected = 0;
  
  for (const cluster of clusters) {
    await Cluster.updateOne(
      { clusterId: cluster.clusterId },
      {
        growthRate: Math.min(100, cluster.growthRate + 30),
        size: Math.round(cluster.size * 1.5),
        avgSentiment: -0.8, // Strong negative sentiment
        volatilityIndex: Math.min(100, cluster.volatilityIndex + 20),
        lastUpdated: new Date(),
      }
    );
    clustersAffected++;
  }

  // Queue the panic posts
  addToQueue(panicPosts as any);

  // Set escalation to spike level
  escalationLevel = 0.9;
  currentPhase = 'spike';

  // Create a risk snapshot to record the spike
  const snapshot = new RiskSnapshot({
    overallRiskScore: 85,
    sentimentAcceleration: 90,
    clusterGrowthRate: 80,
    anomalyScore: 95,
    narrativeSpreadSpeed: 85,
    classification: 'Panic Formation Likely',
    timestamp: new Date(),
  });
  await snapshot.save();

  return {
    postsGenerated: panicCount,
    clustersAffected,
    expectedRiskIncrease: 30,
  };
};

// Set simulator phase manually
export const setPhase = (phase: 'stable' | 'forming' | 'spike' | 'decay'): void => {
  currentPhase = phase;
  console.log(`📊 Simulator phase set to: ${phase}`);
};

// Get current phase
export const getPhase = (): string => {
  return currentPhase;
};
