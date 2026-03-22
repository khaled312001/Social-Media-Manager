import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class SupportBotAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async handle(request: { message: string; context?: Record<string, unknown> }) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: `You are a helpful customer support agent for Barmagly Social Media Manager.
Be concise, empathetic, and solution-focused.
If you cannot resolve an issue, escalate gracefully.`,
      messages: [{
        role: 'user',
        content: `${request.context ? `Context: ${JSON.stringify(request.context)}\n\n` : ''}Customer message: "${request.message}"

Respond naturally and provide a resolution or next steps.`,
      }],
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      response: answer,
      intent: this.classifyIntent(request.message),
      escalate: answer.toLowerCase().includes('escalat') || answer.toLowerCase().includes('human agent'),
    };
  }

  private classifyIntent(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('cancel') || lower.includes('refund')) return 'BILLING';
    if (lower.includes('error') || lower.includes('bug') || lower.includes('broken')) return 'TECHNICAL';
    if (lower.includes('how') || lower.includes('help')) return 'HOW_TO';
    if (lower.includes('feature') || lower.includes('request')) return 'FEATURE_REQUEST';
    return 'GENERAL';
  }
}
