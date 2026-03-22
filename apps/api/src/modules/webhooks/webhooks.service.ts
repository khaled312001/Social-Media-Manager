import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '@barmagly/shared';

export interface RegisterWebhookDto {
  url: string;
  events: string[];
  secret?: string;
  description?: string;
}

export interface WebhookFilters {
  event?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.WEBHOOK_DELIVER) private readonly deliverQueue: Queue,
  ) {}

  async register(workspaceId: string, dto: RegisterWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        workspaceId,
        url: dto.url,
        events: dto.events,
        secret: dto.secret,
        description: dto.description,
        active: true,
      },
    });
  }

  async list(workspaceId: string, filters: WebhookFilters = {}) {
    const { event, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      ...(event && { events: { has: event } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.webhook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          url: true,
          events: true,
          description: true,
          active: true,
          createdAt: true,
          // Never expose the secret
        },
      }),
      this.prisma.webhook.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(workspaceId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, workspaceId },
    });
    if (!webhook) throw new NotFoundException(`Webhook ${id} not found`);
    return webhook;
  }

  async update(workspaceId: string, id: string, dto: Partial<RegisterWebhookDto> & { active?: boolean }) {
    await this.findOne(workspaceId, id);
    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.secret !== undefined && { secret: dto.secret }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.webhook.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Enqueue a webhook delivery for all active webhooks subscribed to the event.
   * Uses BullMQ with exponential backoff retries.
   */
  async deliver(
    workspaceId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<number> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { workspaceId, active: true, events: { has: event } },
    });

    let queued = 0;
    for (const webhook of webhooks) {
      await this.deliverQueue.add(
        'deliver',
        {
          webhookId: webhook.id,
          url: webhook.url,
          secret: webhook.secret,
          event,
          payload,
          workspaceId,
          timestamp: new Date().toISOString(),
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 100 },
        },
      );
      queued++;
    }

    this.logger.log(
      `Event "${event}" queued for ${queued} webhook(s) in workspace ${workspaceId}`,
    );
    return queued;
  }

  async getDeliveryLogs(workspaceId: string, webhookId: string, page = 1, limit = 20) {
    await this.findOne(workspaceId, webhookId);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where: { webhookId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookDelivery.count({ where: { webhookId } }),
    ]);

    return { data, total, page, limit };
  }
}
