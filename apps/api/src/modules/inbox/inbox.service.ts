import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../websockets/events.gateway';
import { InboxStatus, Sentiment, SLA_RESPONSE_TIME_HOURS } from '@barmagly/shared';

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async findAll(workspaceId: string, filters: {
    status?: InboxStatus; platform?: string; sentiment?: Sentiment;
    assignedToId?: string; search?: string; page?: number; limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: any = {
      workspaceId,
      ...(filters.status && { status: filters.status }),
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.sentiment && { sentiment: filters.sentiment }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.search && {
        OR: [
          { content: { contains: filters.search, mode: 'insensitive' } },
          { authorName: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inboxMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          socialAccount: { select: { platform: true, displayName: true, avatarUrl: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          replies: { orderBy: { sentAt: 'asc' }, take: 1 },
          _count: { select: { replies: true, internalNotes: true } },
        },
      }),
      this.prisma.inboxMessage.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(workspaceId: string, messageId: string) {
    const message = await this.prisma.inboxMessage.findFirst({
      where: { id: messageId, workspaceId },
      include: {
        socialAccount: true,
        assignedTo: { select: { id: true, name: true, avatar: true } },
        replies: { orderBy: { sentAt: 'asc' } },
        internalNotes: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async sendReply(workspaceId: string, messageId: string, userId: string, content: string) {
    const message = await this.prisma.inboxMessage.findFirst({
      where: { id: messageId, workspaceId },
      include: { socialAccount: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    const reply = await this.prisma.inboxReply.create({
      data: { messageId, content, sentById: userId },
    });

    await this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });

    return reply;
  }

  async assign(workspaceId: string, messageId: string, assignedToId: string) {
    await this.prisma.inboxMessage.findFirstOrThrow({ where: { id: messageId, workspaceId } });
    return this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { assignedToId, status: 'ASSIGNED' },
    });
  }

  async addInternalNote(workspaceId: string, messageId: string, authorId: string, content: string) {
    await this.prisma.inboxMessage.findFirstOrThrow({ where: { id: messageId, workspaceId } });
    return this.prisma.internalNote.create({ data: { messageId, authorId, content } });
  }

  async updateStatus(workspaceId: string, messageId: string, status: InboxStatus) {
    return this.prisma.inboxMessage.update({
      where: { id: messageId },
      data: { status, ...(status === 'RESOLVED' && { resolvedAt: new Date() }) },
    });
  }

  async ingestWebhookMessage(data: {
    workspaceId: string;
    socialAccountId: string;
    platform: string;
    externalId: string;
    type: string;
    content: string;
    authorName: string;
    authorId?: string;
    authorAvatar?: string;
    parentExternalId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await this.prisma.inboxMessage.findUnique({
      where: { socialAccountId_externalId: { socialAccountId: data.socialAccountId, externalId: data.externalId } },
    });
    if (existing) return existing;

    const slaDeadline = new Date(Date.now() + SLA_RESPONSE_TIME_HOURS * 60 * 60 * 1000);

    const message = await this.prisma.inboxMessage.create({
      data: {
        workspaceId: data.workspaceId,
        socialAccountId: data.socialAccountId,
        platform: data.platform as any,
        externalId: data.externalId,
        type: data.type as any,
        content: data.content,
        authorName: data.authorName,
        authorId: data.authorId,
        authorAvatar: data.authorAvatar,
        parentExternalId: data.parentExternalId,
        metadata: data.metadata,
        slaDeadline,
      },
    });

    this.events.emitNewMessage(data.workspaceId, message);
    return message;
  }

  async getStats(workspaceId: string) {
    const [total, unread, assigned, resolved] = await this.prisma.$transaction([
      this.prisma.inboxMessage.count({ where: { workspaceId } }),
      this.prisma.inboxMessage.count({ where: { workspaceId, status: 'UNREAD' } }),
      this.prisma.inboxMessage.count({ where: { workspaceId, status: 'ASSIGNED' } }),
      this.prisma.inboxMessage.count({ where: { workspaceId, status: 'RESOLVED' } }),
    ]);
    return { total, unread, assigned, resolved };
  }
}
