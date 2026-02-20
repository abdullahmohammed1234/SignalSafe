import mongoose, { Schema, Document } from 'mongoose';

// ============== TYPES ==============
export interface NarrativeConflict {
  narrativeA: string;
  narrativeB: string;
  conflictScore: number;
  escalationProbability: number;
  overlap: number;
  sentimentOpposition: number;
  interactionCrossLinkDensity: number;
  reinforcementLoops: string[];
  suppressionBacklashRisk: number;
  polarizationAmplification: number;
  detectedAt: Date;
  updatedAt: Date;
}

export interface NarrativeConflictDocument extends NarrativeConflict, Document {}

export interface ConflictAnalysisResult {
  conflictMatrix: NarrativeConflict[];
  totalConflicts: number;
  highRiskConflicts: number;
  averageConflictIntensity: number;
  emergingTensions: NarrativeConflict[];
  reinforcementPatterns: string[];
  recommendations: string[];
  generatedAt: Date;
}

// ============== SCHEMA ==============
const NarrativeConflictSchema = new Schema<NarrativeConflictDocument>(
  {
    narrativeA: { type: String, required: true },
    narrativeB: { type: String, required: true },
    conflictScore: { type: Number, required: true, min: 0, max: 1 },
    escalationProbability: { type: Number, required: true, min: 0, max: 1 },
    overlap: { type: Number, required: true, min: 0, max: 1 },
    sentimentOpposition: { type: Number, required: true, min: -1, max: 1 },
    interactionCrossLinkDensity: { type: Number, required: true, min: 0, max: 1 },
    reinforcementLoops: [{ type: String }],
    suppressionBacklashRisk: { type: Number, required: true, min: 0, max: 1 },
    polarizationAmplification: { type: Number, required: true, min: 0, max: 1 },
  },
  { timestamps: true }
);

NarrativeConflictSchema.index({ narrativeA: 1, narrativeB: 1 }, { unique: true });
NarrativeConflictSchema.index({ conflictScore: -1 });
NarrativeConflictSchema.index({ escalationProbability: -1 });

export const NarrativeConflictModel = mongoose.model<NarrativeConflictDocument>(
  'NarrativeConflict',
  NarrativeConflictSchema
);

// ============== SERVICE ==============
export class ConflictModelService {

  // ============== PRIVATE HELPER METHODS ==============

  private async getAllNarrativeIds(): Promise<string[]> {
    return ['narrative_1', 'narrative_2', 'narrative_3', 'narrative_4', 'narrative_5'];
  }

  private async getNarrativeData(narrativeId: string): Promise<any> {
    return {
      id: narrativeId,
      topics: ['politics', 'health', 'economy'].slice(0, Math.floor(Math.random() * 3) + 1),
      sentiment: (Math.random() * 2) - 1,
      supports: [],
      amplifies: [],
      opposes: [],
      triggers: [],
    };
  }

  private async saveConflict(conflict: NarrativeConflict): Promise<void> {
    await NarrativeConflictModel.findOneAndUpdate(
      { narrativeA: conflict.narrativeA, narrativeB: conflict.narrativeB },
      { ...conflict, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }

  private calculateNarrativeOverlap(dataA: any, dataB: any): number {
    const topicsA = dataA.topics || [];
    const topicsB = dataB.topics || [];
    if (topicsA.length === 0 || topicsB.length === 0) return 0;
    const intersection = topicsA.filter((t: string) => topicsB.includes(t)).length;
    const union = new Set([...topicsA, ...topicsB]).size;
    return intersection / union;
  }

  private calculateSentimentOpposition(dataA: any, dataB: any): number {
    const sentimentA = dataA.sentiment || 0;
    const sentimentB = dataB.sentiment || 0;
    return sentimentA - sentimentB;
  }

  private async calculateCrossLinkDensity(narrativeA: string, narrativeB: string): Promise<number> {
    return Math.random() * 0.5;
  }

  private computeConflictIntensity(narrativeOverlap: number, sentimentOpposition: number, interactionCrossLinkDensity: number): number {
    const normalizedSentiment = Math.abs(sentimentOpposition);
    const intensity = narrativeOverlap * normalizedSentiment * (1 + interactionCrossLinkDensity);
    return Math.min(1, intensity);
  }

  private calculateEscalationProbability(conflictIntensity: number, sentimentOpposition: number, crossLinkDensity: number): number {
    const baseProbability = conflictIntensity * 0.4;
    const sentimentFactor = Math.abs(sentimentOpposition) * 0.3;
    const crossLinkFactor = crossLinkDensity * 0.3;
    return Math.min(1, baseProbability + sentimentFactor + crossLinkFactor);
  }

  private identifyReinforcementLoops(dataA: any, dataB: any): string[] {
    const loops: string[] = [];
    if (dataA.supports && dataA.supports.includes(dataB)) loops.push('mutual_support');
    if (dataA.amplifies && dataA.amplifies.includes(dataB)) loops.push('amplification_cascade');
    if (dataA.opposes && dataA.opposes.includes(dataB)) loops.push('opposition_cycle');
    if (dataA.triggers && dataA.triggers.includes(dataB)) loops.push('trigger_chain');
    return loops;
  }

  private calculateBacklashRisk(conflictIntensity: number, sentimentOpposition: number, reinforcementLoops: string[]): number {
    let risk = conflictIntensity * 0.4;
    if (Math.abs(sentimentOpposition) > 0.5) risk += 0.2;
    if (reinforcementLoops.length > 0) risk += reinforcementLoops.length * 0.1;
    return Math.min(1, risk);
  }

  private calculatePolarizationAmplification(sentimentOpposition: number, crossLinkDensity: number, overlap: number): number {
    const oppositionFactor = Math.abs(sentimentOpposition);
    const densityFactor = crossLinkDensity * 0.5;
    const overlapFactor = overlap * 0.3;
    return Math.min(1, oppositionFactor * (1 + densityFactor + overlapFactor));
  }

  private async buildConflictMatrix(narratives: string[]): Promise<NarrativeConflict[]> {
    const conflicts: NarrativeConflict[] = [];
    for (let i = 0; i < narratives.length; i++) {
      for (let j = i + 1; j < narratives.length; j++) {
        const narrativeA = narratives[i];
        const narrativeB = narratives[j];
        const narrativeDataA = await this.getNarrativeData(narrativeA);
        const narrativeDataB = await this.getNarrativeData(narrativeB);
        
        const overlap = this.calculateNarrativeOverlap(narrativeDataA, narrativeDataB);
        const sentimentOpposition = this.calculateSentimentOpposition(narrativeDataA, narrativeDataB);
        const interactionCrossLinkDensity = await this.calculateCrossLinkDensity(narrativeA, narrativeB);
        const conflictIntensityScore = this.computeConflictIntensity(overlap, sentimentOpposition, interactionCrossLinkDensity);
        const escalationProbability = this.calculateEscalationProbability(conflictIntensityScore, sentimentOpposition, interactionCrossLinkDensity);
        const reinforcementLoops = this.identifyReinforcementLoops(narrativeDataA, narrativeDataB);
        const suppressionBacklashRisk = this.calculateBacklashRisk(conflictIntensityScore, sentimentOpposition, reinforcementLoops);
        const polarizationAmplification = this.calculatePolarizationAmplification(sentimentOpposition, interactionCrossLinkDensity, overlap);

        const conflict: NarrativeConflict = {
          narrativeA, narrativeB,
          conflictScore: Math.round(conflictIntensityScore * 100) / 100,
          escalationProbability: Math.round(escalationProbability * 100) / 100,
          overlap: Math.round(overlap * 100) / 100,
          sentimentOpposition: Math.round(sentimentOpposition * 100) / 100,
          interactionCrossLinkDensity: Math.round(interactionCrossLinkDensity * 100) / 100,
          reinforcementLoops,
          suppressionBacklashRisk: Math.round(suppressionBacklashRisk * 100) / 100,
          polarizationAmplification: Math.round(polarizationAmplification * 100) / 100,
          detectedAt: new Date(),
          updatedAt: new Date(),
        };
        conflicts.push(conflict);
        await this.saveConflict(conflict);
      }
    }
    return conflicts;
  }

  private identifyReinforcementPatterns(conflicts: NarrativeConflict[]): string[] {
    const patterns: string[] = [];
    const loopCounts: Record<string, number> = {};
    conflicts.forEach(c => {
      c.reinforcementLoops.forEach(loop => {
        loopCounts[loop] = (loopCounts[loop] || 0) + 1;
      });
    });
    Object.entries(loopCounts)
      .filter(([_, count]) => count > 2)
      .forEach(([loop, count]) => {
        patterns.push(`${loop}: ${count} instances detected`);
      });
    return patterns;
  }

  private generateRecommendations(conflicts: NarrativeConflict[], emergingTensions: NarrativeConflict[]): string[] {
    const recommendations: string[] = [];
    const highConflictCount = conflicts.filter(c => c.conflictScore > 0.6).length;
    if (highConflictCount > 3) {
      recommendations.push(`CRITICAL: ${highConflictCount} high-conflict narrative pairs detected - immediate attention required`);
    }
    const highBacklashRisks = conflicts.filter(c => c.suppressionBacklashRisk > 0.5);
    if (highBacklashRisks.length > 0) {
      recommendations.push(`WARNING: ${highBacklashRisks.length} narratives have high suppression backlash risk - consider graduated response`);
    }
    const highPolarization = conflicts.filter(c => c.polarizationAmplification > 0.5);
    if (highPolarization.length > 2) {
      recommendations.push(`CAUTION: ${highPolarization.length} narrative pairs showing polarization amplification - monitor sentiment trends`);
    }
    if (emergingTensions.length > 0) {
      recommendations.push(`ALERT: ${emergingTensions.length} emerging tensions detected - prioritize de-escalation strategies`);
    }
    if (recommendations.length === 0) {
      recommendations.push('System operating normally - continue monitoring');
    }
    return recommendations;
  }

  // ============== PUBLIC METHODS ==============

  async analyzeConflicts(narrativeIds?: string[]): Promise<ConflictAnalysisResult> {
    const narratives = narrativeIds || await this.getAllNarrativeIds();
    const conflicts = await this.buildConflictMatrix(narratives);
    const totalConflicts = conflicts.length;
    const highRiskConflicts = conflicts.filter(c => c.conflictScore > 0.6).length;
    const averageConflictIntensity = totalConflicts > 0 ? conflicts.reduce((sum, c) => sum + c.conflictScore, 0) / totalConflicts : 0;
    const emergingTensions = conflicts.filter(c => c.escalationProbability > 0.5 && c.conflictScore > 0.4).sort((a, b) => b.escalationProbability - a.escalationProbability).slice(0, 5);
    const reinforcementPatterns = this.identifyReinforcementPatterns(conflicts);
    const recommendations = this.generateRecommendations(conflicts, emergingTensions);

    return {
      conflictMatrix: conflicts,
      totalConflicts,
      highRiskConflicts,
      averageConflictIntensity,
      emergingTensions,
      reinforcementPatterns,
      recommendations,
      generatedAt: new Date(),
    };
  }

  async getConflict(narrativeA: string, narrativeB: string): Promise<NarrativeConflictDocument | null> {
    return await NarrativeConflictModel.findOne({
      $or: [{ narrativeA, narrativeB }, { narrativeA: narrativeB, narrativeB: narrativeA }],
    });
  }

  async getHighRiskConflicts(threshold = 0.6): Promise<NarrativeConflict[]> {
    return await NarrativeConflictModel.find({
      $or: [{ conflictScore: { $gte: threshold } }, { escalationProbability: { $gte: threshold } }],
    }).sort({ conflictScore: -1 });
  }

  async getConflictNetwork(): Promise<{
    nodes: { id: string; label: string; risk: number }[];
    edges: { source: string; target: string; weight: number; type: string }[];
  }> {
    const conflicts = await NarrativeConflictModel.find({ conflictScore: { $gt: 0.2 } });
    const nodes: { id: string; label: string; risk: number }[] = [];
    const edges: { source: string; target: string; weight: number; type: string }[] = [];
    const narrativeIds = new Set<string>();
    conflicts.forEach(c => { narrativeIds.add(c.narrativeA); narrativeIds.add(c.narrativeB); });
    narrativeIds.forEach(id => nodes.push({ id, label: id, risk: Math.random() * 0.8 }));
    conflicts.forEach(c => edges.push({ source: c.narrativeA, target: c.narrativeB, weight: c.conflictScore, type: c.sentimentOpposition > 0 ? 'opposition' : 'competition' }));
    return { nodes, edges };
  }

  async getConflictStats(): Promise<{
    totalConflicts: number;
    avgConflictScore: number;
    highRiskCount: number;
    avgEscalationProbability: number;
    avgBacklashRisk: number;
  }> {
    const result = await NarrativeConflictModel.aggregate([{
      $group: {
        _id: null,
        totalConflicts: { $sum: 1 },
        avgConflictScore: { $avg: '$conflictScore' },
        highRiskCount: { $sum: { $cond: [{ $gte: ['$conflictScore', 0.6] }, 1, 0] } },
        avgEscalationProbability: { $avg: '$escalationProbability' },
        avgBacklashRisk: { $avg: '$suppressionBacklashRisk' },
      },
    }]);
    if (result.length === 0) return { totalConflicts: 0, avgConflictScore: 0, highRiskCount: 0, avgEscalationProbability: 0, avgBacklashRisk: 0 };
    return {
      totalConflicts: result[0].totalConflicts,
      avgConflictScore: Math.round(result[0].avgConflictScore * 100) / 100,
      highRiskCount: result[0].highRiskCount,
      avgEscalationProbability: Math.round(result[0].avgEscalationProbability * 100) / 100,
      avgBacklashRisk: Math.round(result[0].avgBacklashRisk * 100) / 100,
    };
  }
}

export const conflictModel = new ConflictModelService();
