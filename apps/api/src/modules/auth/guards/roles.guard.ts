import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { ROLE_HIERARCHY, Role } from '@barmagly/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const workspaceId = request.headers['x-workspace-id'] || request.params?.workspaceId;

    if (!userId || !workspaceId) return false;

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) throw new ForbiddenException('Not a member of this workspace');

    const userRoleLevel = ROLE_HIERARCHY[member.role as Role] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    if (userRoleLevel < requiredLevel) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.member = member;
    return true;
  }
}
