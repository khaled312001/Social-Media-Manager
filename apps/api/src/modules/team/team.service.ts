import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  labels?: string[];
  relatedPostId?: string;
  relatedCampaignId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskFilters {
  assigneeId?: string;
  status?: string;
  priority?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTask(workspaceId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        workspaceId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        labels: dto.labels ?? [],
        relatedPostId: dto.relatedPostId,
        relatedCampaignId: dto.relatedCampaignId,
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  async findTasks(workspaceId: string, filters: TaskFilters = {}) {
    const {
      assigneeId,
      status,
      priority,
      search,
      dueFrom,
      dueTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
      ...(assigneeId && { assigneeId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dueFrom || dueTo
        ? {
            dueDate: {
              ...(dueFrom && { gte: new Date(dueFrom) }),
              ...(dueTo && { lte: new Date(dueTo) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async updateTask(workspaceId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(workspaceId, id);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.labels !== undefined && { labels: dto.labels }),
        ...(dto.relatedPostId !== undefined && { relatedPostId: dto.relatedPostId }),
        ...(dto.relatedCampaignId !== undefined && {
          relatedCampaignId: dto.relatedCampaignId,
        }),
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  async deleteTask(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }

  async addComment(workspaceId: string, taskId: string, authorId: string, content: string) {
    await this.findOne(workspaceId, taskId);
    return this.prisma.taskComment.create({
      data: { taskId, authorId, content },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async getBoardView(workspaceId: string) {
    const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const;

    const columns = await Promise.all(
      statuses.map(async (status) => {
        const tasks = await this.prisma.task.findMany({
          where: { workspaceId, status },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          include: {
            assignee: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
          take: 100,
        });
        return { status, tasks };
      }),
    );

    return columns;
  }
}
