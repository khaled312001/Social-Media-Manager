import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../../database/prisma.service';
import { Platform } from '@barmagly/shared';

export interface AnalyticsOverview {
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  totalReach: number;
  engagementRate: number;
  followersGrowth: number;
  periodComparison: {
    postsChange: number;
    impressionsChange: number;
    engagementsChange: number;
  };
}

export interface PlatformBreakdown {
  platform: Platform;
  posts: number;
  impressions: number;
  engagements: number;
  reach: number;
  engagementRate: number;
  followers: number;
  followersGrowth: number;
}

export interface TopPost {
  id: string;
  content: string;
  platform: Platform[];
  impressions: number;
  engagements: number;
  reach: number;
  publishedAt: Date;
  thumbnailUrl?: string;
}

export interface EngagementDataPoint {
  date: string;
  impressions: number;
  engagements: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface ExportReportConfig {
  format: 'pdf' | 'csv' | 'xlsx';
  dateFrom: string;
  dateTo: string;
  platforms?: Platform[];
  metrics?: string[];
  includeTopPosts?: boolean;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearch: ElasticsearchService,
  ) {}

  async getOverview(
    workspaceId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<AnalyticsOverview> {
    const periodLength = dateTo.getTime() - dateFrom.getTime();
    const prevFrom = new Date(dateFrom.getTime() - periodLength);
    const prevTo = new Date(dateFrom);

    const [current, previous, postCount, prevPostCount] = await Promise.all([
      this.prisma.postAnalytics.aggregate({
        where: {
          post: { workspaceId },
          recordedAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: {
          impressions: true,
          engagements: true,
          reach: true,
          likes: true,
          comments: true,
          shares: true,
        },
      }),
      this.prisma.postAnalytics.aggregate({
        where: {
          post: { workspaceId },
          recordedAt: { gte: prevFrom, lte: prevTo },
        },
        _sum: {
          impressions: true,
          engagements: true,
          reach: true,
        },
      }),
      this.prisma.post.count({
        where: {
          workspaceId,
          publishedAt: { gte: dateFrom, lte: dateTo },
          status: 'PUBLISHED',
        },
      }),
      this.prisma.post.count({
        where: {
          workspaceId,
          publishedAt: { gte: prevFrom, lte: prevTo },
          status: 'PUBLISHED',
        },
      }),
    ]);

    const totalImpressions = current._sum.impressions ?? 0;
    const totalEngagements = current._sum.engagements ?? 0;
    const totalReach = current._sum.reach ?? 0;

    const prevImpressions = previous._sum.impressions ?? 1;
    const prevEngagements = previous._sum.engagements ?? 1;

    const engagementRate = totalImpressions > 0
      ? (totalEngagements / totalImpressions) * 100
      : 0;

    return {
      totalPosts: postCount,
      totalImpressions,
      totalEngagements,
      totalReach,
      engagementRate: Math.round(engagementRate * 100) / 100,
      followersGrowth: 0, // Requires social-account follower snapshots
      periodComparison: {
        postsChange: prevPostCount > 0 ? ((postCount - prevPostCount) / prevPostCount) * 100 : 0,
        impressionsChange: ((totalImpressions - prevImpressions) / prevImpressions) * 100,
        engagementsChange: ((totalEngagements - prevEngagements) / prevEngagements) * 100,
      },
    };
  }

  async getPlatformBreakdown(
    workspaceId: string,
    platform: Platform,
  ): Promise<PlatformBreakdown> {
    const analytics = await this.prisma.postAnalytics.aggregate({
      where: {
        post: {
          workspaceId,
          platforms: { has: platform },
          status: 'PUBLISHED',
        },
      },
      _sum: {
        impressions: true,
        engagements: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
      },
      _count: { id: true },
    });

    const totalImpressions = analytics._sum.impressions ?? 0;
    const totalEngagements = analytics._sum.engagements ?? 0;

    const socialAccount = await this.prisma.socialAccount.findFirst({
      where: { workspaceId, platform },
      select: { followersCount: true },
    });

    return {
      platform,
      posts: analytics._count.id,
      impressions: totalImpressions,
      engagements: totalEngagements,
      reach: analytics._sum.reach ?? 0,
      engagementRate: totalImpressions > 0
        ? Math.round((totalEngagements / totalImpressions) * 10000) / 100
        : 0,
      followers: socialAccount?.followersCount ?? 0,
      followersGrowth: 0,
    };
  }

  async getTopPosts(
    workspaceId: string,
    limit = 10,
  ): Promise<TopPost[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        workspaceId,
        status: 'PUBLISHED',
        analytics: { some: {} },
      },
      include: {
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        media: { take: 1 },
      },
      orderBy: {
        analytics: { _count: 'desc' },
      },
      take: limit * 3,
    });

    const scored = posts
      .map((post) => {
        const a = post.analytics[0];
        const score = (a?.impressions ?? 0) + (a?.engagements ?? 0) * 5;
        return { post, a, score };
      })
      .sort((x, y) => y.score - x.score)
      .slice(0, limit);

    return scored.map(({ post, a }) => ({
      id: post.id,
      content: post.content,
      platform: post.platforms as Platform[],
      impressions: a?.impressions ?? 0,
      engagements: a?.engagements ?? 0,
      reach: a?.reach ?? 0,
      publishedAt: post.publishedAt!,
      thumbnailUrl: post.media[0]?.url,
    }));
  }

  async getEngagementTimeSeries(
    workspaceId: string,
    from: Date,
    to: Date,
  ): Promise<EngagementDataPoint[]> {
    try {
      const response = await this.elasticsearch.search({
        index: 'post_analytics',
        body: {
          query: {
            bool: {
              filter: [
                { term: { workspaceId } },
                { range: { recordedAt: { gte: from.toISOString(), lte: to.toISOString() } } },
              ],
            },
          },
          aggs: {
            by_day: {
              date_histogram: {
                field: 'recordedAt',
                calendar_interval: 'day',
                format: 'yyyy-MM-dd',
              },
              aggs: {
                impressions: { sum: { field: 'impressions' } },
                engagements: { sum: { field: 'engagements' } },
                reach: { sum: { field: 'reach' } },
                likes: { sum: { field: 'likes' } },
                comments: { sum: { field: 'comments' } },
                shares: { sum: { field: 'shares' } },
              },
            },
          },
          size: 0,
        },
      });

      const buckets = (response.aggregations?.by_day as any)?.buckets ?? [];
      return buckets.map((b: any) => ({
        date: b.key_as_string,
        impressions: b.impressions?.value ?? 0,
        engagements: b.engagements?.value ?? 0,
        reach: b.reach?.value ?? 0,
        likes: b.likes?.value ?? 0,
        comments: b.comments?.value ?? 0,
        shares: b.shares?.value ?? 0,
      }));
    } catch (err) {
      this.logger.warn('Elasticsearch unavailable, falling back to Prisma', err);
      return this.getEngagementTimeSeriesFallback(workspaceId, from, to);
    }
  }

  private async getEngagementTimeSeriesFallback(
    workspaceId: string,
    from: Date,
    to: Date,
  ): Promise<EngagementDataPoint[]> {
    const analytics = await this.prisma.postAnalytics.findMany({
      where: {
        post: { workspaceId },
        recordedAt: { gte: from, lte: to },
      },
      select: {
        recordedAt: true,
        impressions: true,
        engagements: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
      },
      orderBy: { recordedAt: 'asc' },
    });

    const map = new Map<string, EngagementDataPoint>();
    for (const a of analytics) {
      const day = a.recordedAt.toISOString().split('T')[0];
      const existing = map.get(day) ?? {
        date: day,
        impressions: 0,
        engagements: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      existing.impressions += a.impressions ?? 0;
      existing.engagements += a.engagements ?? 0;
      existing.reach += a.reach ?? 0;
      existing.likes += a.likes ?? 0;
      existing.comments += a.comments ?? 0;
      existing.shares += a.shares ?? 0;
      map.set(day, existing);
    }

    return Array.from(map.values());
  }

  async exportReport(
    workspaceId: string,
    config: ExportReportConfig,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const from = new Date(config.dateFrom);
    const to = new Date(config.dateTo);

    const [overview, topPosts, timeSeries] = await Promise.all([
      this.getOverview(workspaceId, from, to),
      config.includeTopPosts ? this.getTopPosts(workspaceId, 20) : Promise.resolve([]),
      this.getEngagementTimeSeries(workspaceId, from, to),
    ]);

    // In production this would generate a real file via a BullMQ job and return a signed URL.
    // Here we return a placeholder that the worker will resolve.
    const reportId = `report_${workspaceId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    this.logger.log(`Export report queued: ${reportId}`, { overview, topPosts, timeSeries });

    return {
      downloadUrl: `/api/analytics/reports/${reportId}/download`,
      expiresAt,
    };
  }
}
