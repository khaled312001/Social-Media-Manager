import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../websockets/events.gateway';

export interface CreateNotificationDto {
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async create(userId: string, data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        actionUrl: data.actionUrl,
        metadata: data.metadata as any,
        read: false,
      },
    });

    // Emit real-time notification via WebSocket
    try {
      this.events.server.to(`user:${userId}`).emit('notification:new', notification);
    } catch (err) {
      this.logger.warn(`Failed to emit real-time notification to user ${userId}`, err);
    }

    return notification;
  }

  async getUnread(userId: string) {
    const [data, count] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { data, unreadCount: count };
  }

  async getAll(userId: string, options: NotificationListOptions = {}) {
    const { page = 1, limit = 20, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return { data, total, page, limit, pages: Math.ceil(total / limit), unreadCount };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    // Sync unread count in real time
    try {
      const unreadCount = await this.prisma.notification.count({
        where: { userId, read: false },
      });
      this.events.server
        .to(`user:${userId}`)
        .emit('notification:unread_count', { count: unreadCount });
    } catch {}

    return updated;
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    try {
      this.events.server
        .to(`user:${userId}`)
        .emit('notification:unread_count', { count: 0 });
    } catch {}

    return { updated: result.count };
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}
