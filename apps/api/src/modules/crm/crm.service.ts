import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FunnelStage } from '@barmagly/shared';

export interface CreateContactDto {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  stage?: FunnelStage;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export interface ContactFilters {
  stage?: FunnelStage;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AddNoteDto {
  content: string;
}

export interface AddActivityDto {
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'OTHER';
  description: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createContact(workspaceId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        workspaceId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        jobTitle: dto.jobTitle,
        stage: dto.stage ?? FunnelStage.LEAD,
        tags: dto.tags ?? [],
        metadata: dto.metadata as any,
      },
    });
  }

  async findAll(workspaceId: string, filters: ContactFilters = {}) {
    const {
      stage,
      search,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      ...(stage && { stage }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { notes: true, activities: true } },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async update(workspaceId: string, id: string, dto: UpdateContactDto) {
    await this.findOne(workspaceId, id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.stage !== undefined && { stage: dto.stage }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as any }),
      },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.contact.delete({ where: { id } });
    return { success: true };
  }

  async addNote(workspaceId: string, contactId: string, dto: AddNoteDto) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contactNote.create({
      data: {
        contactId,
        content: dto.content,
      },
    });
  }

  async addActivity(workspaceId: string, contactId: string, dto: AddActivityDto) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contactActivity.create({
      data: {
        contactId,
        type: dto.type,
        description: dto.description,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        metadata: dto.metadata as any,
      },
    });
  }

  async updateStage(workspaceId: string, contactId: string, stage: FunnelStage) {
    await this.findOne(workspaceId, contactId);
    return this.prisma.contact.update({
      where: { id: contactId },
      data: { stage },
    });
  }

  async getPipeline(workspaceId: string) {
    const stages = Object.values(FunnelStage);

    const results = await Promise.all(
      stages.map(async (stage) => {
        const [contacts, count] = await this.prisma.$transaction([
          this.prisma.contact.findMany({
            where: { workspaceId, stage },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              stage: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          }),
          this.prisma.contact.count({ where: { workspaceId, stage } }),
        ]);

        return { stage, contacts, count };
      }),
    );

    return results;
  }
}
