import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { TrendingTopic } from '@barmagly/shared';

@Injectable()
export class TrendDetectionAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async detect(request: { industry: string; platforms: string[] }): Promise<TrendingTopic[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: 'You are a social media trend analyst with deep knowledge of viral content patterns.',
      messages: [{
        role: 'user',
        content: `Identify 5 trending topics for the ${request.industry} industry on ${request.platforms.join(', ')}.
Current date context: ${new Date().toLocaleDateString()}.

Return ONLY a JSON array:
[{
  "topic": "topic name",
  "volume": 0-100,
  "sentiment": -1.0 to 1.0,
  "platforms": ["PLATFORM"],
  "relatedHashtags": ["tag1"],
  "opportunityScore": 0-100
}]`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return [];
  }

  async scoreTopic(topic: string, industry: string): Promise<number> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Score the opportunity (0-100) for a ${industry} brand to post about "${topic}" on social media today. Reply with just a number.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '50';
    return parseInt(text) || 50;
  }
}
