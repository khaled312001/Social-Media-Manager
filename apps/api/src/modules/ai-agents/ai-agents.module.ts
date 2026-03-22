import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAgentsController } from './ai-agents.controller';
import { AiAgentsService } from './ai-agents.service';
import { ContentGeneratorAgent } from './agents/content-generator.agent';
import { EngagementAgent } from './agents/engagement.agent';
import { AnalyticsAgent } from './agents/analytics.agent';
import { CampaignOptimizerAgent } from './agents/campaign-optimizer.agent';
import { TrendDetectionAgent } from './agents/trend-detection.agent';
import { SupportBotAgent } from './agents/support-bot.agent';

@Module({
  imports: [ConfigModule],
  controllers: [AiAgentsController],
  providers: [
    AiAgentsService,
    ContentGeneratorAgent,
    EngagementAgent,
    AnalyticsAgent,
    CampaignOptimizerAgent,
    TrendDetectionAgent,
    SupportBotAgent,
  ],
  exports: [AiAgentsService, ContentGeneratorAgent, EngagementAgent, SupportBotAgent],
})
export class AiAgentsModule {}
