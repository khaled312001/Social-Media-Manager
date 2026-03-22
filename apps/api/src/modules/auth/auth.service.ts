import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly users: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const slugBase = dto.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        memberships: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: dto.workspaceName,
                slug,
              },
            },
          },
        },
      },
      include: { memberships: { include: { workspace: true } } },
    });

    const workspace = user.memberships[0].workspace;
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { workspace: true }, take: 1 } },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        return { requiresTwoFactor: true, userId: user.id };
      }
      const valid = authenticator.verify({ token: dto.totpCode, secret: user.twoFactorSecret! });
      if (!valid) throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const workspace = user.memberships[0]?.workspace;
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      workspace: workspace
        ? { id: workspace.id, name: workspace.name, slug: workspace.slug }
        : null,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: await bcrypt.hash(refreshToken, 10) },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
    await this.redis.del(`user:${userId}:profile`);
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'Barmagly', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    await this.redis.set(`2fa:setup:${userId}`, secret, 600);

    return { secret, qrCodeDataUrl, otpAuthUrl };
  }

  async enable2FA(userId: string, totpCode: string) {
    const secret = await this.redis.get<string>(`2fa:setup:${userId}`);
    if (!secret) throw new BadRequestException('2FA setup session expired. Please start over.');

    const valid = authenticator.verify({ token: totpCode, secret });
    if (!valid) throw new BadRequestException('Invalid TOTP code');

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
      },
    });

    await this.redis.del(`2fa:setup:${userId}`);
    return { backupCodes };
  }

  async disable2FA(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');

    const valid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret! });
    if (!valid) throw new UnauthorizedException('Invalid TOTP code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: userId, email }),
      this.generateRefreshToken(userId),
    ]);
    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(40).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return token;
  }
}
