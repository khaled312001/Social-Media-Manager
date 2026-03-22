import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CACHE_TTL } from '@barmagly/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string) {
    const cached = await this.redis.get(`user:${id}:profile`);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, avatar: true,
        phone: true, timezone: true, locale: true,
        twoFactorEnabled: true, emailVerified: true,
        createdAt: true, lastLoginAt: true,
        memberships: {
          select: {
            role: true,
            workspace: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    await this.redis.set(`user:${id}:profile`, user, CACHE_TTL.USER);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        timezone: dto.timezone,
        locale: dto.locale,
        avatar: dto.avatar,
      },
      select: { id: true, email: true, name: true, avatar: true, phone: true, timezone: true, locale: true },
    });
    await this.redis.del(`user:${userId}:profile`);
    return user;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, email: `deleted-${userId}@barmagly-deleted.com` },
    });
    await this.redis.del(`user:${userId}:profile`);
  }
}
