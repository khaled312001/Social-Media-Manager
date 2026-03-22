import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '@barmagly/shared';

// Minimal Resend client interface – avoids hard dep at compile time
interface ResendClient {
  emails: {
    send(payload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
    }): Promise<{ id: string }>;
  };
}

export interface CreateListDto {
  name: string;
  description?: string;
  tags?: string[];
}

export interface AddSubscriberDto {
  email: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEmailCampaignDto {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  listIds: string[];
  templateJson?: Record<string, unknown>; // drag-drop JSON template
  htmlContent?: string;
  scheduledAt?: string;
}

export interface SendCampaignOptions {
  immediate?: boolean;
}

export interface CreateAutomationDto {
  name: string;
  trigger: 'SUBSCRIBER_ADDED' | 'TAG_ADDED' | 'FORM_SUBMITTED' | 'SCHEDULED';
  triggerConfig?: Record<string, unknown>;
  steps: AutomationStep[];
}

export interface AutomationStep {
  type: 'SEND_EMAIL' | 'WAIT' | 'CONDITION' | 'ADD_TAG' | 'REMOVE_TAG';
  config: Record<string, unknown>;
  delay?: number; // seconds
}

function renderJsonTemplate(templateJson: Record<string, unknown>): string {
  // Basic recursive renderer for a block-based JSON template.
  const blocks: unknown[] = Array.isArray((templateJson as any).blocks)
    ? (templateJson as any).blocks
    : [];

  const renderBlock = (block: any): string => {
    switch (block.type) {
      case 'heading':
        return `<h${block.level ?? 2} style="${block.style ?? ''}">${block.text}</h${block.level ?? 2}>`;
      case 'text':
        return `<p style="${block.style ?? ''}">${block.text}</p>`;
      case 'image':
        return `<img src="${block.src}" alt="${block.alt ?? ''}" style="${block.style ?? ''}" />`;
      case 'button':
        return `<a href="${block.href}" style="${block.style ?? ''}">${block.label}</a>`;
      case 'divider':
        return `<hr style="${block.style ?? ''}" />`;
      case 'columns': {
        const cols = (block.columns ?? []).map((c: any) => renderBlock(c)).join('');
        return `<table><tr>${cols}</tr></table>`;
      }
      default:
        return '';
    }
  };

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto">
${blocks.map(renderBlock).join('\n')}
</body></html>`;
}

@Injectable()
export class EmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);
  private resend: ResendClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND) private readonly emailQueue: Queue,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      try {
        // Dynamic import to avoid crashing when RESEND_API_KEY is missing in dev
        const { Resend } = require('resend');
        this.resend = new Resend(apiKey) as ResendClient;
      } catch {
        this.logger.warn('Resend SDK not installed. Email sending will use queue only.');
      }
    }
  }

  // ─── Lists ────────────────────────────────────────────────────────────────

  async createList(workspaceId: string, dto: CreateListDto) {
    return this.prisma.emailList.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags ?? [],
      },
    });
  }

  async getLists(workspaceId: string) {
    return this.prisma.emailList.findMany({
      where: { workspaceId },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getList(workspaceId: string, id: string) {
    const list = await this.prisma.emailList.findFirst({ where: { id, workspaceId } });
    if (!list) throw new NotFoundException(`List ${id} not found`);
    return list;
  }

  // ─── Subscribers ──────────────────────────────────────────────────────────

  async addSubscriber(workspaceId: string, listId: string, dto: AddSubscriberDto) {
    await this.getList(workspaceId, listId);

    return this.prisma.emailSubscriber.upsert({
      where: { listId_email: { listId, email: dto.email } },
      create: {
        listId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        metadata: dto.metadata as any,
        status: 'ACTIVE',
      },
      update: {
        status: 'ACTIVE',
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });
  }

  async removeSubscriber(workspaceId: string, listId: string, email: string) {
    await this.getList(workspaceId, listId);

    const subscriber = await this.prisma.emailSubscriber.findFirst({
      where: { listId, email },
    });
    if (!subscriber) throw new NotFoundException(`Subscriber ${email} not found`);

    return this.prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: { status: 'UNSUBSCRIBED' },
    });
  }

  async getSubscribers(workspaceId: string, listId: string, page = 1, limit = 50) {
    await this.getList(workspaceId, listId);
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.emailSubscriber.findMany({
        where: { listId, status: 'ACTIVE' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailSubscriber.count({ where: { listId, status: 'ACTIVE' } }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────

  async createCampaign(workspaceId: string, dto: CreateEmailCampaignDto) {
    const htmlContent = dto.templateJson
      ? renderJsonTemplate(dto.templateJson)
      : (dto.htmlContent ?? '');

    return this.prisma.emailCampaign.create({
      data: {
        workspaceId,
        name: dto.name,
        subject: dto.subject,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
        listIds: dto.listIds,
        templateJson: dto.templateJson as any,
        htmlContent,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: 'DRAFT',
      },
    });
  }

  async getCampaigns(workspaceId: string) {
    return this.prisma.emailCampaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(workspaceId: string, id: string) {
    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id, workspaceId },
    });
    if (!campaign) throw new NotFoundException(`Email campaign ${id} not found`);
    return campaign;
  }

  async sendCampaign(
    workspaceId: string,
    id: string,
    options: SendCampaignOptions = {},
  ) {
    const campaign = await this.getCampaign(workspaceId, id);

    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      throw new BadRequestException(`Campaign is already in status: ${campaign.status}`);
    }

    // Gather all active subscribers across the campaign's lists
    const subscribers = await this.prisma.emailSubscriber.findMany({
      where: {
        listId: { in: campaign.listIds as string[] },
        status: 'ACTIVE',
      },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      throw new BadRequestException('No active subscribers found in the target lists');
    }

    // Queue each batch of emails for reliable delivery with retry
    const batchSize = 100;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize).map((s) => s.email);
      await this.emailQueue.add(
        'send-campaign-batch',
        {
          campaignId: id,
          workspaceId,
          toAddresses: batch,
          subject: campaign.subject,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
          htmlContent: campaign.htmlContent,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }

    const updated = await this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    this.logger.log(`Campaign ${id} queued for ${subscribers.length} recipients`);
    return updated;
  }

  // ─── Automations ──────────────────────────────────────────────────────────

  async createAutomation(workspaceId: string, dto: CreateAutomationDto) {
    return this.prisma.emailAutomation.create({
      data: {
        workspaceId,
        name: dto.name,
        trigger: dto.trigger,
        triggerConfig: dto.triggerConfig as any,
        steps: dto.steps as any,
        status: 'ACTIVE',
      },
    });
  }

  async getAutomations(workspaceId: string) {
    return this.prisma.emailAutomation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAutomation(workspaceId: string, id: string, dto: Partial<CreateAutomationDto>) {
    const existing = await this.prisma.emailAutomation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException(`Automation ${id} not found`);

    return this.prisma.emailAutomation.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.trigger && { trigger: dto.trigger }),
        ...(dto.triggerConfig && { triggerConfig: dto.triggerConfig as any }),
        ...(dto.steps && { steps: dto.steps as any }),
      },
    });
  }

  async deleteAutomation(workspaceId: string, id: string) {
    const existing = await this.prisma.emailAutomation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException(`Automation ${id} not found`);
    await this.prisma.emailAutomation.delete({ where: { id } });
    return { success: true };
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats(workspaceId: string) {
    const [totalLists, totalSubscribers, totalCampaigns, sentCampaigns] = await Promise.all([
      this.prisma.emailList.count({ where: { workspaceId } }),
      this.prisma.emailSubscriber.count({
        where: { list: { workspaceId }, status: 'ACTIVE' },
      }),
      this.prisma.emailCampaign.count({ where: { workspaceId } }),
      this.prisma.emailCampaign.count({ where: { workspaceId, status: 'SENT' } }),
    ]);

    return { totalLists, totalSubscribers, totalCampaigns, sentCampaigns };
  }
}
