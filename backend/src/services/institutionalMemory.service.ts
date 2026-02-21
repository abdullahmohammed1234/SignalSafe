/**
 * STRATEGIC MEMORY & INSTITUTIONAL LEARNING CORE
 * Phase 8 - Turn historical outcomes into structured strategic lessons
 * 
 * For each crisis cycle, extract early warning indicators, failed predictions,
 * successful interventions, cascade miscalculations, and ethical impact deviations
 */

export interface StrategicLesson {
  lessonId: string;
  eventId: string;
  timestamp: Date;
  earlySignals: {
    indicator: string;
    detectedAt: Date;
    significance: number;
    wasActionable: boolean;
  }[];
  failurePatterns: {
    pattern: string;
    frequency: number;
    impact: number;
    rootCause: string;
  }[];
  successPatterns: {
    intervention: string;
    effectiveness: number;
    conditions: string[];
    transferable: boolean;
  }[];
  cascadeMiscalculations: {
    expectedCascade: string;
    actualCascade: string;
    deviationMagnitude: number;
    lesson: string;
  }[];
  ethicalImpactDeviations: {
    dimension: string;
    predictedImpact: number;
    actualImpact: number;
    deviation: number;
  }[];
  recommendedModelAdjustment: {
    component: string;
    adjustment: string;
    expectedImprovement: number;
    priority: 'low' | 'medium' | 'high';
  }[];
  tags: string[];
  verified: boolean;
  lastReviewed?: Date;
}

export interface CrisisEvent {
  eventId: string;
  type: 'narrative-escalation' | 'sentiment-crash' | 'information-warfare' | 'policy-disruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTimestamp: Date;
  endTimestamp?: Date;
  narratives: string[];
  regions: string[];
  interventions: string[];
  outcome: 'resolved' | 'mitigated' | 'escalated' | 'unresolved';
  lessons: StrategicLesson[];
}

// In-memory storage
const memoryStore: {
  lessons: StrategicLesson[];
  events: CrisisEvent[];
  learnedPatterns: Map<string, { frequency: number; effectiveness: number }>;
} = {
  lessons: [],
  events: [],
  learnedPatterns: new Map()
};

// Generate unique ID
function generateId(): string {
  return `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract lesson from crisis event
export async function extractLessonFromEvent(event: CrisisEvent): Promise<StrategicLesson> {
  const lesson: StrategicLesson = {
    lessonId: generateId(),
    eventId: event.eventId,
    timestamp: new Date(),
    earlySignals: [],
    failurePatterns: [],
    successPatterns: [],
    cascadeMiscalculations: [],
    ethicalImpactDeviations: [],
    recommendedModelAdjustment: [],
    tags: [],
    verified: false
  };
  
  // Extract early signals (simulated - in production would analyze actual data)
  lesson.earlySignals = [
    {
      indicator: 'velocity_spike',
      detectedAt: new Date(event.startTimestamp.getTime() - 24 * 60 * 60 * 1000),
      significance: 0.75,
      wasActionable: true
    },
    {
      indicator: 'sentiment_divergence',
      detectedAt: new Date(event.startTimestamp.getTime() - 12 * 60 * 60 * 1000),
      significance: 0.65,
      wasActionable: false
    }
  ];
  
  // Extract failure patterns
  lesson.failurePatterns = [
    {
      pattern: 'underestimated_viral_potential',
      frequency: 3,
      impact: 0.8,
      rootCause: 'Insufficient temporal feature depth'
    },
    {
      pattern: 'delayed_detection',
      frequency: 2,
      impact: 0.6,
      rootCause: 'Threshold too conservative'
    }
  ];
  
  // Extract success patterns
  if (event.interventions.length > 0) {
    lesson.successPatterns = event.interventions.map(intervention => ({
      intervention,
      effectiveness: 0.7 + Math.random() * 0.25,
      conditions: ['early_detection', 'adequate_resources'],
      transferable: true
    }));
  }
  
  // Extract cascade miscalculations
  lesson.cascadeMiscalculations = [
    {
      expectedCascade: 'regional_only',
      actualCascade: 'global_spread',
      deviationMagnitude: 0.75,
      lesson: 'Network effects stronger than modeled'
    }
  ];
  
  // Extract ethical deviations
  lesson.ethicalImpactDeviations = [
    {
      dimension: 'fairness',
      predictedImpact: 0.2,
      actualImpact: 0.35,
      deviation: 0.15
    }
  ];
  
  // Generate recommendations
  lesson.recommendedModelAdjustment = [
    {
      component: 'ensemble_weighting',
      adjustment: 'increase_autoencoder_weight',
      expectedImprovement: 0.08,
      priority: 'high'
    },
    {
      component: 'simulation_depth',
      adjustment: 'increase_temporal_horizon',
      expectedImprovement: 0.05,
      priority: 'medium'
    }
  ];
  
  // Add tags based on event type
  lesson.tags = [event.type, event.severity, ...event.regions];
  
  memoryStore.lessons.push(lesson);
  
  // Update learned patterns
  updateLearnedPatterns(lesson);
  
  return lesson;
}

// Update learned patterns map
function updateLearnedPatterns(lesson: StrategicLesson): void {
  for (const pattern of lesson.failurePatterns) {
    const key = pattern.pattern;
    const existing = memoryStore.learnedPatterns.get(key);
    
    if (existing) {
      existing.frequency += 1;
      existing.effectiveness = (existing.effectiveness * existing.frequency + (1 - pattern.impact)) / (existing.frequency + 1);
    } else {
      memoryStore.learnedPatterns.set(key, {
        frequency: 1,
        effectiveness: 1 - pattern.impact
      });
    }
  }
}

// Get all lessons
export async function getAllLessons(limit = 50): Promise<StrategicLesson[]> {
  return [...memoryStore.lessons].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, limit);
}

// Get lessons by tag
export async function getLessonsByTag(tag: string): Promise<StrategicLesson[]> {
  return memoryStore.lessons.filter(l => l.tags.includes(tag));
}

// Get verified lessons
export async function getVerifiedLessons(): Promise<StrategicLesson[]> {
  return memoryStore.lessons.filter(l => l.verified);
}

// Verify lesson
export async function verifyLesson(lessonId: string): Promise<StrategicLesson | null> {
  const lesson = memoryStore.lessons.find(l => l.lessonId === lessonId);
  
  if (!lesson) {
    return null;
  }
  
  lesson.verified = true;
  lesson.lastReviewed = new Date();
  
  return lesson;
}

// Get high priority recommendations
export async function getHighPriorityRecommendations(): Promise<StrategicLesson['recommendedModelAdjustment'][]> {
  const highPriority = memoryStore.lessons
    .filter(l => l.verified && l.recommendedModelAdjustment.some(r => r.priority === 'high'))
    .slice(0, 10);
  
  return highPriority.map(l => l.recommendedModelAdjustment);
}

// Get learned patterns
export async function getLearnedPatterns(): Promise<{
  pattern: string;
  frequency: number;
  effectiveness: number;
}[]> {
  const patterns: { pattern: string; frequency: number; effectiveness: number }[] = [];
  
  memoryStore.learnedPatterns.forEach((value, key) => {
    patterns.push({
      pattern: key,
      frequency: value.frequency,
      effectiveness: value.effectiveness
    });
  });
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

// Record crisis event
export async function recordCrisisEvent(event: Omit<CrisisEvent, 'eventId' | 'lessons'>): Promise<CrisisEvent> {
  const fullEvent: CrisisEvent = {
    ...event,
    eventId: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lessons: []
  };
  
  memoryStore.events.push(fullEvent);
  
  // Extract lesson if event is complete
  if (fullEvent.endTimestamp) {
    const lesson = await extractLessonFromEvent(fullEvent);
    fullEvent.lessons.push(lesson);
  }
  
  return fullEvent;
}

// Get events
export async function getEvents(limit = 20): Promise<CrisisEvent[]> {
  return [...memoryStore.events].sort((a, b) => 
    new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
  ).slice(0, limit);
}

// Get memory statistics
export async function getMemoryStatistics(): Promise<{
  totalLessons: number;
  verifiedLessons: number;
  totalEvents: number;
  resolvedEvents: number;
  commonPatterns: { pattern: string; count: number }[];
  averageImprovement: number;
  knowledgeGaps: string[];
}> {
  const verified = memoryStore.lessons.filter(l => l.verified);
  const resolved = memoryStore.events.filter(e => e.outcome === 'resolved');
  
  const commonPatterns: { pattern: string; count: number }[] = [];
  const patternCounts = new Map<string, number>();
  
  for (const lesson of memoryStore.lessons) {
    for (const pattern of lesson.failurePatterns) {
      patternCounts.set(pattern.pattern, (patternCounts.get(pattern.pattern) || 0) + 1);
    }
  }
  
  patternCounts.forEach((count, pattern) => {
    commonPatterns.push({ pattern, count });
  });
  
  const improvements = memoryStore.lessons.flatMap(l => 
    l.recommendedModelAdjustment.map(r => r.expectedImprovement)
  );
  const avgImprovement = improvements.length > 0 
    ? improvements.reduce((a, b) => a + b, 0) / improvements.length 
    : 0;
  
  // Identify knowledge gaps
  const knowledgeGaps = [
    'Cross-regional cascade prediction',
    'Real-time ethical impact assessment',
    'Long-term intervention effects'
  ];
  
  return {
    totalLessons: memoryStore.lessons.length,
    verifiedLessons: verified.length,
    totalEvents: memoryStore.events.length,
    resolvedEvents: resolved.length,
    commonPatterns: commonPatterns.sort((a, b) => b.count - a.count).slice(0, 10),
    averageImprovement: avgImprovement,
    knowledgeGaps
  };
}

// Apply lessons to ensemble weighting
export async function applyLessonsToEnsemble(): Promise<{
  appliedAdjustments: string[];
  expectedImprovement: number;
}> {
  const verifiedLessons = memoryStore.lessons.filter(l => l.verified);
  const appliedAdjustments: string[] = [];
  let totalExpectedImprovement = 0;
  
  for (const lesson of verifiedLessons.slice(-5)) {
    for (const adjustment of lesson.recommendedModelAdjustment) {
      if (adjustment.priority === 'high') {
        appliedAdjustments.push(`${adjustment.component}: ${adjustment.adjustment}`);
        totalExpectedImprovement += adjustment.expectedImprovement;
      }
    }
  }
  
  return {
    appliedAdjustments,
    expectedImprovement: totalExpectedImprovement
  };
}

export default {
  extractLessonFromEvent,
  getAllLessons,
  getLessonsByTag,
  getVerifiedLessons,
  verifyLesson,
  getHighPriorityRecommendations,
  getLearnedPatterns,
  recordCrisisEvent,
  getEvents,
  getMemoryStatistics,
  applyLessonsToEnsemble
};
