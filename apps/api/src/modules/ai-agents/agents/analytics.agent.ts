import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AnalyticsAgent {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    this.client = new Anthropic({ apiKey: config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async analyze(request: { workspaceId: string; query: string }) {
    // Fetch recent analytics data
    const [posts, snapshots] = await Promise.all([
      this.prisma.post.findMany({
        where: { workspaceId: request.workspaceId, status: 'PUBLISHED' },
        include: { analytics: true },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      }),
      this.prisma.analyticsSnapshot.findMany({
        where: { workspaceId: request.workspaceId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    const context = JSON.stringify({ posts: posts.length, snapshots: snapshots.slice(0, 5) }, null, 2);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: 'You are a social media analytics expert. Analyze data and provide actionable insights.',
      messages: [{
        role: 'user',
        content: `Based on this analytics data:\n${context}\n\nAnswer: ${request.query}\n\nProvide specific, actionable insights with numbers.`,
      }],
    });

    return {
      answer: response.content[0].type === 'text' ? response.content[0].text : '',
      dataPoints: posts.length + snapshots.length,
    };
  }

  async generateInsightSummary(workspaceId: string, period: '7d' | '30d' | '90d') {
    const days = parseInt(period);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [published, totalEngagement] = await Promise.all([
      this.prisma.post.count({ where: { workspaceId, status: 'PUBLISHED', publishedAt: { gte: from } } }),
      this.prisma.postAnalytics.aggregate({
        _sum: { likes: true, comments: true, shares: true, clicks: true },
        where: { post: { workspaceId, publishedAt: { gte: from } } },
      }),
    ]);

    const metrics = { published, ...totalEngagement._sum };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Create a concise ${period} performance summary for these metrics: ${JSON.stringify(metrics)}. Focus on highlights and 2-3 key recommendations.`,
      }],
    });

    return {
      summary: response.content[0].type === 'text' ? response.content[0].text : '',
      metrics,
      period,
    };
  }
}
