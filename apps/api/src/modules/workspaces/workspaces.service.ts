import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CACHE_TTL } from '@barmagly/shared';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import * as crypto from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getUserWorkspaces(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true, name: true, slug: true, logoUrl: true,
            customDomain: true, whiteLabelEnabled: true, isActive: true,
            _count: { select: { members: true, socialAccounts: true, posts: true } },
          },
        },
      },
    });
  }

  async getWorkspace(workspaceId: string, userId: string) {
    const cached = await this.redis.get(`workspace:${workspaceId}`);
    if (cached) return cached;

    await this.assertMember(workspaceId, userId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        subscription: { include: { plan: true } },
        brandingConfig: true,
        _count: { select: { socialAccounts: true, posts: true, contacts: true } },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    await this.redis.set(`workspace:${workspaceId}`, workspace, CACHE_TTL.WORKSPACE);
    return workspace;
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
    });
  }

  async updateWorkspace(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.assertRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        timezone: dto.timezone,
        website: dto.website,
      },
    });

    await this.redis.del(`workspace:${workspaceId}`);
    return workspace;
  }

  async inviteMember(workspaceId: string, invitedById: string, dto: InviteMemberDto) {
    await this.assertRole(workspaceId, invitedById, ['OWNER', 'ADMIN', 'MANAGER']);

    const existing = await this.prisma.workspaceInvitation.findFirst({
      where: { workspaceId, email: dto.email, isRevoked: false, expiresAt: { gt: new Date() } },
    });
    if (existing) throw new ConflictException('Invitation already sent to this email');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return this.prisma.workspaceInvitation.create({
      data: { workspaceId, email: dto.email, role: dto.role, token, invitedById, expiresAt },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({ where: { token } });
    if (!invitation || invitation.isRevoked || invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Invalid or expired invitation');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId } },
    });
    if (existing) throw new ConflictException('Already a member of this workspace');

    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: { workspaceId: invitation.workspaceId, userId, role: invitation.role },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
  }

  async removeMember(workspaceId: string, requesterId: string, memberId: string) {
    await this.assertRole(workspaceId, requesterId, ['OWNER', 'ADMIN']);
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
    });
    await this.redis.del(`workspace:${workspaceId}`);
  }

  async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    return member;
  }

  async assertRole(workspaceId: string, userId: string, roles: string[]) {
    const member = await this.assertMember(workspaceId, userId);
    if (!roles.includes(member.role)) throw new ForbiddenException('Insufficient permissions');
    return member;
  }
}
