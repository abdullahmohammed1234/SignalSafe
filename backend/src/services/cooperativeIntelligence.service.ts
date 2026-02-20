export interface ExternalIntelligencePacket {
  sourceId: string;
  narrativeId: string;
  anomalyScore: number;
  spreadVector: {
    direction: string;
    velocity: number;
    regions: string[];
  };
  timestamp: Date;
  trustScore: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  confidenceScore: number;
  discrepancies: string[];
  integratedNarratives: string[];
  rejectedReasons: string[];
}

export interface IntelligenceExchange {
  id: string;
  sourceId: string;
  direction: 'incoming' | 'outgoing';
  packets: ExternalIntelligencePacket[];
  validatedAt: Date;
  trustLevel: 'trusted' | 'partial' | 'untrusted';
}

/**
 * AI-to-AI Cooperative Intelligence Interface
 * Enables structured intelligence exchange with external AI systems
 */
export class CooperativeIntelligenceService {

  private readonly TRUST_THRESHOLDS = {
    TRUSTED: 0.8,
    PARTIAL: 0.5,
    UNTRUSTED: 0.3,
  };

  private readonly REGISTERED_SOURCES = new Map<string, {
    name: string;
    trustScore: number;
    lastSeen: Date;
    protocols: string[];
  }>();

  /**
   * Register an external AI source
   */
  registerSource(sourceId: string, name: string, protocols: string[] = ['standard']): void {
    this.REGISTERED_SOURCES.set(sourceId, {
      name,
      trustScore: 0.7, // Default trust score
      lastSeen: new Date(),
      protocols,
    });
  }

  /**
   * Validate incoming intelligence packet
   */
  async validateIntelligencePacket(packet: ExternalIntelligencePacket): Promise<ValidationResult> {
    const discrepancies: string[] = [];
    const integratedNarratives: string[] = [];
    const rejectedReasons: string[] = [];

    // Check source registration
    const sourceInfo = this.REGISTERED_SOURCES.get(packet.sourceId);
    if (!sourceInfo) {
      discrepancies.push('Unregistered source');
      rejectedReasons.push('Source not in trusted registry');
    }

    // Check timestamp validity (not too old)
    const hoursSince = (Date.now() - new Date(packet.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      discrepancies.push(`Packet timestamp is ${Math.round(hoursSince)} hours old`);
    }

    // Validate anomaly score range
    if (packet.anomalyScore < 0 || packet.anomalyScore > 1) {
      discrepancies.push('Invalid anomaly score range');
      rejectedReasons.push('Anomaly score out of valid range [0,1]');
    }

    // Validate spread vector
    if (!packet.spreadVector || !packet.spreadVector.regions || packet.spreadVector.regions.length === 0) {
      discrepancies.push('Missing or invalid spread vector');
    }

    // Cross-validate with existing narratives
    const validationResult = await this.crossValidateNarrative(packet.narrativeId, packet.anomalyScore);
    if (!validationResult.matches) {
      discrepancies.push(`Narrative validation mismatch: ${validationResult.reason}`);
    }

    // Calculate confidence score
    let confidenceScore = 1.0;
    
    if (sourceInfo) {
      confidenceScore *= sourceInfo.trustScore;
    } else {
      confidenceScore *= 0.3;
    }

    if (hoursSince > 12) {
      confidenceScore *= 0.7;
    }

    if (discrepancies.length > 0) {
      confidenceScore *= (1 - discrepancies.length * 0.1);
    }

    confidenceScore = Math.max(0, Math.min(1, confidenceScore));

    // Determine if packet should be integrated
    const isValid = confidenceScore >= this.TRUST_THRESHOLDS.PARTIAL && rejectedReasons.length === 0;

    if (isValid) {
      integratedNarratives.push(packet.narrativeId);
    }

    return {
      isValid,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      discrepancies,
      integratedNarratives,
      rejectedReasons,
    };
  }

  /**
   * Cross-validate with existing narratives
   */
  private async crossValidateNarrative(narrativeId: string, anomalyScore: number): Promise<{
    matches: boolean;
    reason?: string;
  }> {
    // Simulate validation against internal data
    // In production, this would query the Narrative collection
    
    // Simulated logic
    if (anomalyScore > 0.9) {
      return { matches: true }; // High anomaly may indicate new discovery
    }
    
    if (anomalyScore < 0.1) {
      return { 
        matches: false, 
        reason: 'Anomaly score too low - not worth integrating' 
      };
    }

    return { matches: true };
  }

  /**
   * Process incoming intelligence exchange
   */
  async processIntelligenceExchange(exchange: IntelligenceExchange): Promise<{
    processed: number;
    integrated: number;
    rejected: number;
    trustLevel: 'trusted' | 'partial' | 'untrusted';
  }> {
    let integrated = 0;
    let rejected = 0;

    for (const packet of exchange.packets) {
      const validation = await this.validateIntelligencePacket(packet);
      
      if (validation.isValid) {
        integrated++;
      } else {
        rejected++;
      }
    }

    // Determine overall trust level
    const total = exchange.packets.length;
    const integrationRate = total > 0 ? integrated / total : 0;
    
    let trustLevel: 'trusted' | 'partial' | 'untrusted';
    if (integrationRate >= this.TRUST_THRESHOLDS.TRUSTED) {
      trustLevel = 'trusted';
    } else if (integrationRate >= this.TRUST_THRESHOLDS.PARTIAL) {
      trustLevel = 'partial';
    } else {
      trustLevel = 'untrusted';
    }

    // Update source trust score
    const sourceInfo = this.REGISTERED_SOURCES.get(exchange.sourceId);
    if (sourceInfo) {
      const adjustment = integrationRate > 0.5 ? 0.05 : -0.1;
      sourceInfo.trustScore = Math.max(0.1, Math.min(1, sourceInfo.trustScore + adjustment));
      sourceInfo.lastSeen = new Date();
    }

    return {
      processed: total,
      integrated,
      rejected,
      trustLevel,
    };
  }

  /**
   * Create outgoing intelligence packet for external sharing
   */
  createOutgoingPacket(
    narrativeData: {
      id: string;
      title: string;
      riskScore: number;
      sentiment: number;
      spreadRegions: string[];
    },
    targetSource: string
  ): ExternalIntelligencePacket {
    const sourceInfo = this.REGISTERED_SOURCES.get(targetSource);

    return {
      sourceId: 'signalsafe_main',
      narrativeId: narrativeData.id,
      anomalyScore: narrativeData.riskScore / 100,
      spreadVector: {
        direction: 'outbound',
        velocity: narrativeData.riskScore,
        regions: narrativeData.spreadRegions,
      },
      timestamp: new Date(),
      trustScore: sourceInfo?.trustScore || 0.7,
      metadata: {
        narrativeTitle: narrativeData.title,
        sentiment: narrativeData.sentiment,
        classification: 'operational_intelligence',
      },
    };
  }

  /**
   * Compare external intelligence with internal anomalies
   */
  async compareWithInternalAnomalies(
    externalPackets: ExternalIntelligencePacket[]
  ): Promise<{
    matches: Array<{ external: string; internal: string; similarity: number }>;
    novelDiscoveries: string[];
    gaps: string[];
  }> {
    const matches: Array<{ external: string; internal: string; similarity: number }> = [];
    const novelDiscoveries: string[] = [];
    const gaps: string[] = [];

    // Simulated comparison logic
    for (const packet of externalPackets) {
      const validation = await this.validateIntelligencePacket(packet);
      
      if (validation.isValid) {
        // Simulate finding matching internal anomalies
        if (Math.random() > 0.5) {
          matches.push({
            external: packet.narrativeId,
            internal: `internal_${Math.random().toString(36).substr(2, 9)}`,
            similarity: 0.75 + Math.random() * 0.2,
          });
        } else {
          novelDiscoveries.push(packet.narrativeId);
        }
      } else {
        gaps.push(packet.narrativeId);
      }
    }

    return { matches, novelDiscoveries, gaps };
  }

  /**
   * Get source trust status
   */
  getSourceTrustStatus(sourceId: string): {
    isRegistered: boolean;
    trustScore: number;
    status: 'trusted' | 'partial' | 'untrusted';
    lastSeen: Date | null;
  } {
    const sourceInfo = this.REGISTERED_SOURCES.get(sourceId);
    
    if (!sourceInfo) {
      return {
        isRegistered: false,
        trustScore: 0,
        status: 'untrusted',
        lastSeen: null,
      };
    }

    let status: 'trusted' | 'partial' | 'untrusted';
    if (sourceInfo.trustScore >= this.TRUST_THRESHOLDS.TRUSTED) {
      status = 'trusted';
    } else if (sourceInfo.trustScore >= this.TRUST_THRESHOLDS.PARTIAL) {
      status = 'partial';
    } else {
      status = 'untrusted';
    }

    return {
      isRegistered: true,
      trustScore: sourceInfo.trustScore,
      status,
      lastSeen: sourceInfo.lastSeen,
    };
  }

  /**
   * Get all registered sources
   */
  getRegisteredSources(): Array<{ sourceId: string; name: string; trustScore: number }> {
    const sources: Array<{ sourceId: string; name: string; trustScore: number }> = [];
    
    this.REGISTERED_SOURCES.forEach((info, sourceId) => {
      sources.push({
        sourceId,
        name: info.name,
        trustScore: info.trustScore,
      });
    });

    return sources;
  }
}

export const cooperativeIntelligenceService = new CooperativeIntelligenceService();
