import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ContentGeneratorAgent } from './agents/content-generator.agent';
import { EngagementAgent } from './agents/engagement.agent';
import { AnalyticsAgent } from './agents/analytics.agent';
import { CampaignOptimizerAgent } from './agents/campaign-optimizer.agent';
import { TrendDetectionAgent } from './agents/trend-detection.agent';
import { SupportBotAgent } from './agents/support-bot.agent';
import { ContentGenerationRequest } from '@barmagly/shared';

@Injectable()
export class AiAgentsService {
  readonly client: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly contentGenerator: ContentGeneratorAgent,
    private readonly engagement: EngagementAgent,
    private readonly analytics: AnalyticsAgent,
    private readonly campaignOptimizer: CampaignOptimizerAgent,
    private readonly trendDetection: TrendDetectionAgent,
    private readonly supportBot: SupportBotAgent,
  ) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateContent(request: ContentGenerationRequest) {
    return this.contentGenerator.generate(request);
  }

  async suggestReply(messageContent: string, authorName: string, platform: string, brandVoice?: string) {
    return this.engagement.suggestReply({ messageContent, authorName, platform, brandVoice });
  }

  async analyzePerformance(workspaceId: string, query: string) {
    return this.analytics.analyze({ workspaceId, query });
  }

  async optimizeCampaign(campaignData: Record<string, unknown>) {
    return this.campaignOptimizer.optimize(campaignData);
  }

  async detectTrends(industry: string, platforms: string[]) {
    return this.trendDetection.detect({ industry, platforms });
  }

  async handleSupportQuery(message: string, context?: Record<string, unknown>) {
    return this.supportBot.handle({ message, context });
  }
}
