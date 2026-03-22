import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../websockets/events.gateway';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QUEUE_NAMES } from '@barmagly/shared';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    @InjectQueue(QUEUE_NAMES.POST_SCHEDULER) private readonly schedulerQueue: Queue,
  ) {}

  async findAll(workspaceId: string, query: PaginationDto & { status?: string; platform?: string }) {
    const where = {
      workspaceId,
      ...(query.status && { status: query.status as any }),
      ...(query.platform && { platforms: { has: query.platform as any } }),
      ...(query.search && { content: { contains: query.search, mode: 'insensitive' as any } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        skip: query.skip,
        take: query.limit,
        include: {
          media: true,
          analytics: true,
          accounts: { include: { socialAccount: { select: { id: true, platform: true, displayName: true } } } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / (query.limit ?? 20)) } };
  }

  async findOne(workspaceId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, workspaceId },
      include: {
        media: true,
        analytics: true,
        accounts: { include: { socialAccount: true } },
        approvals: { include: { reviewer: { select: { id: true, name: true } } } },
        comments: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(workspaceId: string, userId: string, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        workspaceId,
        createdById: userId,
        content: dto.content,
        platforms: dto.platforms,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: dto.scheduledAt,
        campaignId: dto.campaignId,
        aiGenerated: dto.aiGenerated ?? false,
        approvalRequired: dto.approvalRequired ?? false,
        media: dto.mediaUrls?.length
          ? { create: dto.mediaUrls.map((url, i) => ({ url, type: dto.mediaType ?? 'IMAGE', order: i })) }
          : undefined,
        accounts: dto.socialAccountIds?.length
          ? { create: dto.socialAccountIds.map((socialAccountId) => ({ socialAccountId })) }
          : undefined,
      },
      include: { media: true, accounts: true },
    });

    if (post.scheduledAt && post.status === 'SCHEDULED') {
      await this.schedulerQueue.add(
        'publish-post',
        { postId: post.id, workspaceId },
        { delay: post.scheduledAt.getTime() - Date.now(), jobId: `post:${post.id}` },
      );
    }

    return post;
  }

  async update(workspaceId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.findOne(workspaceId, postId);
    if (['PUBLISHED', 'PUBLISHING'].includes(post.status)) {
      throw new ForbiddenException('Cannot edit a published post');
    }

    if (dto.scheduledAt && post.status === 'SCHEDULED') {
      await this.schedulerQueue.remove(`post:${postId}`);
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content,
        platforms: dto.platforms,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    if (updated.scheduledAt && updated.status === 'SCHEDULED') {
      await this.schedulerQueue.add(
        'publish-post',
        { postId, workspaceId },
        { delay: updated.scheduledAt.getTime() - Date.now(), jobId: `post:${postId}` },
      );
    }

    return updated;
  }

  async delete(workspaceId: string, postId: string) {
    await this.findOne(workspaceId, postId);
    await this.schedulerQueue.remove(`post:${postId}`);
    return this.prisma.post.delete({ where: { id: postId } });
  }

  async publishNow(workspaceId: string, postId: string) {
    await this.findOne(workspaceId, postId);
    await this.prisma.post.update({ where: { id: postId }, data: { status: 'SCHEDULED', scheduledAt: new Date() } });
    await this.schedulerQueue.add('publish-post', { postId, workspaceId }, { jobId: `post:${postId}:now` });
    return { message: 'Post queued for immediate publishing' };
  }

  async getCalendar(workspaceId: string, from: Date, to: Date) {
    return this.prisma.post.findMany({
      where: {
        workspaceId,
        scheduledAt: { gte: from, lte: to },
        status: { in: ['SCHEDULED', 'PUBLISHED'] },
      },
      select: { id: true, content: true, platforms: true, scheduledAt: true, status: true, media: { take: 1 } },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
