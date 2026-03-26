import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import {
  QUEUE_NAMES,
  AutomationTriggerType,
  AutomationActionType,
  AutomationStatus,
} from '@barmagly/shared';

export interface CreateAutomationDto {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerConfig?: Record<string, unknown>;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt' | 'in' | 'notIn';
  value: unknown;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, unknown>;
  delay?: number;
  order: number;
}

export interface UpdateAutomationDto extends Partial<CreateAutomationDto> {}

export interface AutomationFilters {
  status?: AutomationStatus;
  triggerType?: AutomationTriggerType;
  page?: number;
  limit?: number;
}

export interface TriggerContext {
  triggerType: AutomationTriggerType;
  payload: Record<string, unknown>;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.AUTOMATION_EXECUTE) private readonly automationQueue: Queue,
  ) {}

  async findAll(workspaceId: string, filters: AutomationFilters = {}) {
    const { status, triggerType, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      ...(status && { status }),
      ...(triggerType && { triggerType }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.automation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.automation.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(workspaceId: string, id: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!automation) throw new NotFoundException(`Automation ${id} not found`);
    return automation;
  }

  async create(workspaceId: string, dto: CreateAutomationDto) {
    return this.prisma.automation.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        trigger: dto.triggerConfig as any ?? {},
        conditions: dto.conditions as any ?? [],
        actions: dto.actions as any,
        status: AutomationStatus.DRAFT,
      },
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateAutomationDto) {
    await this.findOne(workspaceId, id);
    return this.prisma.automation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.triggerConfig !== undefined && { trigger: dto.triggerConfig as any ?? {} }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions as any }),
        ...(dto.actions !== undefined && { actions: dto.actions as any }),
      },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.automation.delete({ where: { id } });
    return { success: true };
  }

  async toggle(workspaceId: string, id: string) {
    const automation = await this.findOne(workspaceId, id);

    const newStatus =
      automation.status === AutomationStatus.ACTIVE
        ? AutomationStatus.INACTIVE
        : AutomationStatus.ACTIVE;

    const updated = await this.prisma.automation.update({
      where: { id },
      data: { status: newStatus },
    });

    this.logger.log(`Automation ${id} toggled to ${newStatus}`);
    return updated;
  }

  /**
   * Evaluate all active automations for a workspace that match the given trigger.
   * Matching automations are enqueued for execution via BullMQ.
   */
  async evaluate(trigger: TriggerContext, workspaceId: string): Promise<number> {
    const automations = await this.prisma.automation.findMany({
      where: {
        workspaceId,
        triggerType: trigger.triggerType,
        status: AutomationStatus.ACTIVE,
      },
    });

    let queued = 0;
    for (const automation of automations) {
      const conditions: AutomationCondition[] = (automation.conditions as any) ?? [];
      if (this.evaluateConditions(conditions, trigger.payload)) {
        await this.automationQueue.add(
          'execute',
          {
            automationId: automation.id,
            workspaceId,
            triggerPayload: trigger.payload,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 50 },
          },
        );
        queued++;
      }
    }

    this.logger.log(
      `Trigger ${trigger.triggerType} evaluated for workspace ${workspaceId}: ${queued}/${automations.length} automations queued`,
    );

    return queued;
  }

  private evaluateConditions(
    conditions: AutomationCondition[],
    payload: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => {
      const fieldValue = this.getNestedValue(payload, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().includes(String(condition.value).toLowerCase());
        case 'startsWith':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().startsWith(String(condition.value).toLowerCase());
        case 'gt':
          return Number(fieldValue) > Number(condition.value);
        case 'lt':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}
