import crypto from 'crypto';

// ============== TYPES ==============
export interface IntegrationConfig {
  integrationId: string;
  name: string;
  type: 'moderation_api' | 'alert_system' | 'policy_dashboard' | 'reporting_pipeline' | 'webhook';
  endpoint: string;
  enabled: boolean;
  authType: 'api_key' | 'oauth' | 'signed_request' | 'none';
  webhookSecret?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
}

export interface IntegrationResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  timestamp: Date;
}

// ============== SERVICE ==============
export class IntegrationHubService {

  private integrations: Map<string, IntegrationConfig> = new Map();
  private webhookHistory: { event: string; timestamp: Date; success: boolean }[] = [];

  /**
   * Register an integration
   */
  async registerIntegration(config: Omit<IntegrationConfig, 'integrationId' | 'createdAt'>): Promise<IntegrationConfig> {
    const integrationId = `INT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const integration: IntegrationConfig = {
      ...config,
      integrationId,
      createdAt: new Date(),
    };
    
    this.integrations.set(integrationId, integration);
    return integration;
  }

  /**
   * Get all integrations
   */
  async getIntegrations(): Promise<IntegrationConfig[]> {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<IntegrationConfig | undefined> {
    return this.integrations.get(integrationId);
  }

  /**
   * Enable/disable integration
   */
  async toggleIntegration(integrationId: string, enabled: boolean): Promise<IntegrationConfig | null> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return null;
    
    integration.enabled = enabled;
    this.integrations.set(integrationId, integration);
    return integration;
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string): Promise<boolean> {
    return this.integrations.delete(integrationId);
  }

  /**
   * Send webhook to external system
   */
  async sendWebhook(integrationId: string, event: string, data: any): Promise<IntegrationResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return { success: false, error: 'Integration not found', timestamp: new Date() };
    }
    
    if (!integration.enabled) {
      return { success: false, error: 'Integration disabled', timestamp: new Date() };
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Add signature if webhook secret is configured
    if (integration.webhookSecret) {
      payload.signature = this.generateSignature(payload, integration.webhookSecret);
    }

    // Simulate webhook sending (in production, use actual HTTP client)
    try {
      // In real implementation: await axios.post(integration.endpoint, payload);
      const success = Math.random() > 0.1; // 90% success rate simulation
      
      this.webhookHistory.push({ event, timestamp: new Date(), success });
      integration.lastUsedAt = new Date();
      this.integrations.set(integrationId, integration);

      return {
        success,
        statusCode: success ? 200 : 500,
        response: success ? { received: true } : { error: 'Internal error' },
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, secret: string): boolean {
    if (!payload.signature) return false;
    
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(payload.signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Get webhook history
   */
  getWebhookHistory(limit = 50): { event: string; timestamp: Date; success: boolean }[] {
    return this.webhookHistory.slice(-limit);
  }

  /**
   * Test integration connection
   */
  async testIntegration(integrationId: string): Promise<IntegrationResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return { success: false, error: 'Integration not found', timestamp: new Date() };
    }

    // Simulate test (in production, send test request)
    const success = Math.random() > 0.2;
    return {
      success,
      statusCode: success ? 200 : 400,
      response: success ? { message: 'Connection successful' } : { error: 'Connection failed' },
      timestamp: new Date(),
    };
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
    recentSuccessRate: number;
  } {
    const integrations = Array.from(this.integrations.values());
    
    const enabled = integrations.filter(i => i.enabled).length;
    const disabled = integrations.filter(i => !i.enabled).length;
    
    const byType: Record<string, number> = {};
    integrations.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
    });

    // Calculate recent success rate from webhook history
    const recent = this.webhookHistory.slice(-100);
    const successCount = recent.filter(w => w.success).length;
    const recentSuccessRate = recent.length > 0 
      ? Math.round((successCount / recent.length) * 100) 
      : 100;

    return {
      total: integrations.length,
      enabled,
      disabled,
      byType,
      recentSuccessRate,
    };
  }

  /**
   * Get available integration types
   */
  getAvailableTypes(): { type: string; description: string }[] {
    return [
      { type: 'moderation_api', description: 'External content moderation API' },
      { type: 'alert_system', description: 'Alert and notification system' },
      { type: 'policy_dashboard', description: 'Policy management dashboard' },
      { type: 'reporting_pipeline', description: 'Reporting and analytics pipeline' },
      { type: 'webhook', description: 'Generic webhook receiver' },
    ];
  }
}

export const integrationHub = new IntegrationHubService();
