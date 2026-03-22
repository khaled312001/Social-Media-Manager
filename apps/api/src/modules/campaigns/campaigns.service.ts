import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateCampaignDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goals?: string[];
  tags?: string[];
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}

export interface CampaignFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string, filters: CampaignFilters = {}) {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(workspaceId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, workspaceId },
      include: {
        posts: {
          include: {
            analytics: { orderBy: { recordedAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async create(workspaceId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        goals: dto.goals ?? [],
        tags: dto.tags ?? [],
        status: 'DRAFT',
      },
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateCampaignDto) {
    await this.findOne(workspaceId, id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.goals !== undefined && { goals: dto.goals }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }

  async addPostToCampaign(workspaceId: string, campaignId: string, postId: string) {
    await this.findOne(workspaceId, campaignId);

    const post = await this.prisma.post.findFirst({
      where: { id: postId, workspaceId },
    });
    if (!post) throw new NotFoundException(`Post ${postId} not found`);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { posts: { connect: { id: postId } } },
    });
  }

  async removePostFromCampaign(workspaceId: string, campaignId: string, postId: string) {
    await this.findOne(workspaceId, campaignId);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { posts: { disconnect: { id: postId } } },
    });
  }

  async getCampaignAnalytics(workspaceId: string, campaignId: string) {
    const campaign = await this.findOne(workspaceId, campaignId);

    const postIds = campaign.posts.map((p: any) => p.id);
    if (postIds.length === 0) {
      return {
        campaignId,
        totalPosts: 0,
        publishedPosts: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        totalReach: 0,
        engagementRate: 0,
        postBreakdown: [],
      };
    }

    const analytics = await this.prisma.postAnalytics.aggregate({
      where: { postId: { in: postIds } },
      _sum: {
        impressions: true,
        engagements: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
      },
    });

    const publishedCount = await this.prisma.post.count({
      where: { id: { in: postIds }, status: 'PUBLISHED' },
    });

    const totalImpressions = analytics._sum.impressions ?? 0;
    const totalEngagements = analytics._sum.engagements ?? 0;

    return {
      campaignId,
      totalPosts: postIds.length,
      publishedPosts: publishedCount,
      totalImpressions,
      totalEngagements,
      totalReach: analytics._sum.reach ?? 0,
      totalLikes: analytics._sum.likes ?? 0,
      totalComments: analytics._sum.comments ?? 0,
      totalShares: analytics._sum.shares ?? 0,
      engagementRate: totalImpressions > 0
        ? Math.round((totalEngagements / totalImpressions) * 10000) / 100
        : 0,
    };
  }

  async publishAllCampaignPosts(workspaceId: string, campaignId: string) {
    const campaign = await this.findOne(workspaceId, campaignId);

    const draftPosts = campaign.posts.filter((p: any) => p.status === 'DRAFT');
    if (draftPosts.length === 0) {
      throw new BadRequestException('No draft posts found in this campaign');
    }

    const updated = await this.prisma.post.updateMany({
      where: {
        id: { in: draftPosts.map((p: any) => p.id) },
        status: 'DRAFT',
      },
      data: { status: 'SCHEDULED', scheduledAt: new Date() },
    });

    this.logger.log(`Campaign ${campaignId}: scheduled ${updated.count} posts for publishing`);

    return { scheduled: updated.count };
  }
}
