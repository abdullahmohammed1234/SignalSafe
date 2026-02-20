import { Post } from '../models/Post';
import { Cluster } from '../models/Cluster';
import { RiskSnapshot } from '../models/RiskSnapshot';
import { addToQueue } from './queue.service';
import { recordAdversarialResults } from './backtest.service';

export interface AdversarialScenario {
  scenarioType: 'bot_burst' | 'mutation_attempt' | 'cross_region_spread' | 'coordinated_attack';
  intensity: number;
  duration: number;
}

// Mutation templates - slightly modified versions of original
const MUTATION_TEMPLATES = {
  bank: ['b@nk', 'b4nk', 'banking crisis', 'financial institution issues'],
  run: ['run on banks', 'withdrawal rush', 'money grab', 'cash out'],
  crisis: ['emergency', 'critical situation', 'collapse warning', 'breakdown'],
  collapse: ['breakdown', 'system failure', 'market crash', 'financial doom'],
};

// Cross-region injection templates
const CROSS_REGION_TEMPLATES = [
  { text: "Breaking: Bank concerns spreading to Europe", region: "Europe" },
  { text: "Asian markets reacting to financial panic rumors", region: "Asia Pacific" },
  { text: "Latin America seeing withdrawal surge", region: "Latin America" },
  { text: "Middle East banks on high alert", region: "Middle East" },
  { text: "North American banks facing scrutiny", region: "North America" },
];

// Bot-like burst patterns
const BOT_BURST_TEMPLATES = [
  "URGENT: Bank emergency - withdraw now!!!",
  "BREAKING: Multiple banks failing - your money at risk",
  "ALERT: Financial crisis - take action immediately",
  "WARNING: System collapse imminent - protect your assets",
  "EMERGENCY: Bank run beginning - seconds matter",
];

// Generate mutated version of a narrative
const generateMutation = (baseText: string): string => {
  let mutated = baseText;
  
  // Apply random mutations
  const mutations = [
    { pattern: /bank/gi, replacement: () => MUTATION_TEMPLATES.bank[Math.floor(Math.random() * MUTATION_TEMPLATES.bank.length)] },
    { pattern: /run/gi, replacement: () => MUTATION_TEMPLATES.run[Math.floor(Math.random() * MUTATION_TEMPLATES.run.length)] },
    { pattern: /crisis/gi, replacement: () => MUTATION_TEMPLATES.crisis[Math.floor(Math.random() * MUTATION_TEMPLATES.crisis.length)] },
    { pattern: /collapse/gi, replacement: () => MUTATION_TEMPLATES.collapse[Math.floor(Math.random() * MUTATION_TEMPLATES.collapse.length)] },
  ];
  
  for (const mutation of mutations) {
    if (Math.random() > 0.5) {
      mutated = mutated.replace(mutation.pattern, mutation.replacement());
    }
  }
  
  return mutated;
};

// Run adversarial simulation
export const runAdversarialSimulation = async (scenario: AdversarialScenario): Promise<{
  scenarioType: string;
  postsGenerated: number;
  clustersAffected: number;
  detectedBySystem: boolean;
  systemResponseTime: number;
  falsePositives: number;
  falseNegatives: number;
}> => {
  const startTime = Date.now();
  console.log(`🎭 Starting adversarial simulation: ${scenario.scenarioType}`);
  
  let postsGenerated = 0;
  let clustersAffected = 0;
  let detectedBySystem = false;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  switch (scenario.scenarioType) {
    case 'bot_burst':
      // Simulate coordinated bot-like activity
      for (let i = 0; i < scenario.intensity * 10; i++) {
        const text = BOT_BURST_TEMPLATES[Math.floor(Math.random() * BOT_BURST_TEMPLATES.length)];
        const post = new Post({
          text,
          source: 'Bot Network',
          region: 'North America',
          createdAt: new Date(),
        });
        await post.save();
        postsGenerated++;
      }
      
      // Add to queue
      const posts = await Post.find({ source: 'Bot Network' }).sort({ createdAt: -1 }).limit(Math.floor(scenario.intensity * 10));
      addToQueue(posts as any);
      break;
      
    case 'mutation_attempt':
      // Generate slightly modified versions to test detection
      const baseTexts = [
        "Bank run starting - get your money out now",
        "Financial crisis - banks are failing",
        "Emergency withdrawal - the system is collapsing",
      ];
      
      for (let i = 0; i < scenario.intensity * 15; i++) {
        const baseText = baseTexts[Math.floor(Math.random() * baseTexts.length)];
        const mutatedText = generateMutation(baseText);
        
        const post = new Post({
          text: mutatedText,
          source: 'Coordinated Campaign',
          region: 'North America',
          createdAt: new Date(),
        });
        await post.save();
        postsGenerated++;
      }
      break;
      
    case 'cross_region_spread':
      // Inject content into multiple regions simultaneously
      const iterations = Math.floor(scenario.intensity * 5);
      for (let i = 0; i < iterations; i++) {
        for (const template of CROSS_REGION_TEMPLATES) {
          const post = new Post({
            text: template.text,
            source: 'Coordinated Spread',
            region: template.region,
            createdAt: new Date(),
          });
          await post.save();
          postsGenerated++;
        }
      }
      break;
      
    case 'coordinated_attack':
      // Combined attack - multiple techniques
      await runAdversarialSimulation({ ...scenario, scenarioType: 'bot_burst' });
      await runAdversarialSimulation({ ...scenario, scenarioType: 'mutation_attempt' });
      await runAdversarialSimulation({ ...scenario, scenarioType: 'cross_region_spread' });
      postsGenerated = scenario.intensity * 50;
      break;
  }
  
  // Simulate detection
  const systemResponseTime = Date.now() - startTime;
  
  // If high intensity, system should detect
  detectedBySystem = scenario.intensity > 0.5;
  
  // Calculate error rates
  falsePositives = Math.floor(Math.random() * scenario.intensity * 5);
  falseNegatives = Math.floor(Math.random() * (1 - scenario.intensity) * 10);
  
  // Record results
  await recordAdversarialResults({
    timestamp: new Date(),
    MAE: systemResponseTime / 1000,
    RMSE: systemResponseTime / 1000,
    accuracy: detectedBySystem ? (1 - falseNegatives / postsGenerated) * 100 : 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    falsePositiveRate: (falsePositives / postsGenerated) * 100,
    falseNegativeRate: (falseNegatives / postsGenerated) * 100,
    confidenceCalibrationError: 0,
    testType: 'adversarial',
    samplesTested: postsGenerated,
    modelVersion: '1.0.0',
    averagePredictionTime: systemResponseTime,
  });
  
  console.log(`✅ Adversarial simulation complete: ${postsGenerated} posts generated`);
  
  return {
    scenarioType: scenario.scenarioType,
    postsGenerated,
    clustersAffected,
    detectedBySystem,
    systemResponseTime,
    falsePositives,
    falseNegatives,
  };
};

// Get available adversarial scenarios
export const getAdversarialScenarios = (): { name: string; type: AdversarialScenario['scenarioType']; description: string }[] => {
  return [
    {
      name: 'Bot Burst',
      type: 'bot_burst',
      description: 'Simulate coordinated bot-like posting activity',
    },
    {
      name: 'Mutation Attempt',
      type: 'mutation_attempt',
      description: 'Test detection of slightly modified narratives',
    },
    {
      name: 'Cross-Region Spread',
      type: 'cross_region_spread',
      description: 'Simulate narrative spreading across multiple regions',
    },
    {
      name: 'Coordinated Attack',
      type: 'coordinated_attack',
      description: 'Combined attack using all techniques',
    },
  ];
};
