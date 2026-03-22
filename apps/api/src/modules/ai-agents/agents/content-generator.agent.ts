import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ContentGenerationRequest, GeneratedContent, Platform, PLATFORM_CHAR_LIMITS } from '@barmagly/shared';

@Injectable()
export class ContentGeneratorAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async generate(request: ContentGenerationRequest): Promise<GeneratedContent[]> {
    const platformList = request.platforms.join(', ');

    const systemPrompt = `You are an expert social media content creator for a brand.
${request.brandVoice ? `Brand voice: ${request.brandVoice}` : ''}
Your task is to create platform-optimized posts that drive engagement.
Always return a JSON array of objects, one per platform.`;

    const userPrompt = `Create ${request.tone} social media posts about: "${request.topic}"

Requirements:
- Platforms: ${platformList}
- Length: ${request.length}
- Include hashtags: ${request.includeHashtags}
- Include emojis: ${request.includeEmojis}
${request.keywords?.length ? `- Keywords to include: ${request.keywords.join(', ')}` : ''}
${request.targetAudience ? `- Target audience: ${request.targetAudience}` : ''}

Character limits per platform:
${request.platforms.map((p) => `- ${p}: ${PLATFORM_CHAR_LIMITS[p]} chars`).join('\n')}

Return ONLY a JSON array with this structure:
[{
  "platform": "PLATFORM_NAME",
  "content": "post content",
  "hashtags": ["tag1", "tag2"],
  "suggestedMediaPrompt": "image generation prompt",
  "estimatedEngagement": "low|medium|high",
  "bestTimeToPost": "9:00 AM - 11:00 AM"
}]`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]) as GeneratedContent[];
    } catch {}

    // Fallback
    return request.platforms.map((platform) => ({
      platform,
      content: text,
      hashtags: [],
    }));
  }

  async rewriteForPlatform(content: string, platform: Platform, tone?: string): Promise<string> {
    const charLimit = PLATFORM_CHAR_LIMITS[platform];
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Rewrite the following post for ${platform} (max ${charLimit} chars)${tone ? ` with a ${tone} tone` : ''}:\n\n${content}`,
      }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : content;
  }

  async generateHashtags(topic: string, platform: Platform, count = 10): Promise<string[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate ${count} relevant, trending hashtags for a ${platform} post about: "${topic}". Return only the hashtags, one per line, without the # symbol.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.split('\n').filter((t) => t.trim()).slice(0, count).map((t) => t.trim());
  }
}
