import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface EnrichedPost {
  id: string;
  text: string;
  sentimentScore: number;
  embedding: number[];
}

export interface ClusterData {
  clusterId: string;
  keywords: string[];
  size: number;
  avgSentiment: number;
  growthRate: number;
  volatilityIndex: number;
}

export interface AIMetrics {
  sentimentAcceleration: number;
  clusterGrowthRate: number;
  anomalyScore: number;
  narrativeSpreadSpeed: number;
}

export interface AnalysisResponse {
  enrichedPosts: EnrichedPost[];
  clusters: ClusterData[];
  metrics: AIMetrics;
}

export const callAIService = async (posts: { id: string; text: string; timestamp: Date }[]): Promise<AnalysisResponse> => {
  try {
    const response = await axios.post<AnalysisResponse>(`${AI_SERVICE_URL}/analyze`, {
      posts,
    }, {
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ AI Service call failed:', error);
    // Return mock data if AI service is unavailable
    return generateMockAnalysis(posts);
  }
};

const generateMockAnalysis = (posts: { id: string; text: string }[]): AnalysisResponse => {
  const enrichedPosts: EnrichedPost[] = posts.map((post) => ({
    id: post.id,
    text: post.text,
    sentimentScore: Math.random() * 2 - 1,
    embedding: Array(384).fill(0).map(() => Math.random() * 2 - 1),
  }));

  const clusters: ClusterData[] = [
    {
      clusterId: 'cluster-1',
      keywords: ['bank', 'liquidity', 'crisis'],
      size: Math.floor(Math.random() * 100) + 10,
      avgSentiment: Math.random() * 2 - 1,
      growthRate: Math.random() * 100,
      volatilityIndex: Math.random(),
    },
    {
      clusterId: 'cluster-2',
      keywords: ['panic', 'withdraw', 'run'],
      size: Math.floor(Math.random() * 50) + 5,
      avgSentiment: Math.random() * -0.5 - 0.5,
      growthRate: Math.random() * 200,
      volatilityIndex: Math.random() * 0.5 + 0.5,
    },
  ];

  const metrics: AIMetrics = {
    sentimentAcceleration: Math.random() * 100,
    clusterGrowthRate: Math.random() * 100,
    anomalyScore: Math.random() * 100,
    narrativeSpreadSpeed: Math.random() * 100,
  };

  return { enrichedPosts, clusters, metrics };
};
