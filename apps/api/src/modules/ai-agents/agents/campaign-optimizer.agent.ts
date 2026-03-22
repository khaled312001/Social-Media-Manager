import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class CampaignOptimizerAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async optimize(campaignData: Record<string, unknown>) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: 'You are a digital marketing campaign optimization expert. Analyze campaign data and provide specific, ROI-focused recommendations.',
      messages: [{
        role: 'user',
        content: `Analyze this campaign data and provide optimization recommendations:\n${JSON.stringify(campaignData, null, 2)}\n\nProvide: 1) Performance assessment 2) Top 3 optimizations 3) Budget reallocation suggestions 4) Predicted impact. Return as JSON.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { recommendations: text };
  }

  async predictEngagement(postContent: string, platform: string, historicalData?: Record<string, unknown>) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Predict engagement for this ${platform} post:
"${postContent}"
${historicalData ? `Historical average: ${JSON.stringify(historicalData)}` : ''}

Return JSON: {"predicted_likes": 0, "predicted_comments": 0, "predicted_shares": 0, "engagement_rate": 0.0, "confidence": "low|medium|high", "tips": ["tip1"]}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { engagement_rate: 0, confidence: 'low' };
  }
}
