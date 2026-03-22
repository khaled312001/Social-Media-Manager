import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface AuditEntry {
  workspaceId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : undefined,
        newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
      },
    });
  }

  async getWorkspaceLogs(workspaceId: string, page = 1, limit = 50) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where: { workspaceId } }),
    ]);
    return { data, total, page, limit };
  }
}
