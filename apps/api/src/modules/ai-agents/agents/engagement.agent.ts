import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Sentiment, SuggestedReply } from '@barmagly/shared';

interface ReplyRequest {
  messageContent: string;
  authorName: string;
  platform: string;
  brandVoice?: string;
  previousMessages?: string[];
}

@Injectable()
export class EngagementAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async suggestReply(request: ReplyRequest): Promise<SuggestedReply[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 600,
      system: `You are a social media customer engagement specialist.
${request.brandVoice ? `Brand voice guidelines: ${request.brandVoice}` : ''}
Generate 3 reply variants: professional, friendly, and empathetic.
Return ONLY a JSON array.`,
      messages: [{
        role: 'user',
        content: `Platform: ${request.platform}
Author: ${request.authorName}
Message: "${request.messageContent}"
${request.previousMessages?.length ? `Previous context:\n${request.previousMessages.join('\n')}` : ''}

Generate 3 reply suggestions as JSON array:
[{ "text": "...", "tone": "professional|friendly|empathetic", "confidence": 0.0-1.0 }]`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [{ text: 'Thank you for reaching out! We\'ll get back to you shortly.', tone: 'professional', confidence: 0.8 }];
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: Sentiment; score: number; reasoning: string }> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Analyze the sentiment of this social media message. Return JSON only:
{"sentiment": "POSITIVE|NEUTRAL|NEGATIVE", "score": -1.0 to 1.0, "reasoning": "brief explanation"}

Message: "${text}"`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      return JSON.parse(responseText.match(/\{[\s\S]*\}/)![0]);
    } catch {
      return { sentiment: Sentiment.NEUTRAL, score: 0, reasoning: 'Unable to analyze' };
    }
  }
}
