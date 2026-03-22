import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';

export interface GenerateApiKeyDto {
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  workspaceId?: string;
  permissions?: string[];
  keyId?: string;
}

const KEY_PREFIX = 'bky_';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generate(workspaceId: string, dto: GenerateApiKeyDto) {
    // Generate a cryptographically secure random key
    const rawKey = KEY_PREFIX + crypto.randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(rawKey, BCRYPT_ROUNDS);
    // Store only the first 12 chars as a lookup prefix (not a secret)
    const keyPrefix = rawKey.slice(0, KEY_PREFIX.length + 8);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspaceId,
        name: dto.name,
        hashedKey,
        keyPrefix,
        permissions: dto.permissions ?? ['read'],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        lastUsedAt: null,
      },
    });

    this.logger.log(`API key generated for workspace ${workspaceId}: ${apiKey.id}`);

    // Return the raw key once — it will never be retrievable again
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async list(workspaceId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  async revoke(workspaceId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, workspaceId, revokedAt: null },
    });
    if (!key) throw new NotFoundException(`API key ${id} not found`);

    await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return { success: true, revokedAt: new Date() };
  }

  async validate(rawKey: string): Promise<ApiKeyValidationResult> {
    if (!rawKey.startsWith(KEY_PREFIX)) {
      return { valid: false };
    }

    const keyPrefix = rawKey.slice(0, KEY_PREFIX.length + 8);

    // Find candidate keys by prefix
    const candidates = await this.prisma.apiKey.findMany({
      where: {
        keyPrefix,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    for (const candidate of candidates) {
      const matches = await bcrypt.compare(rawKey, candidate.hashedKey);
      if (matches) {
        // Update last used timestamp non-blocking
        this.prisma.apiKey
          .update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});

        return {
          valid: true,
          workspaceId: candidate.workspaceId,
          permissions: candidate.permissions as string[],
          keyId: candidate.id,
        };
      }
    }

    return { valid: false };
  }

  async getOne(workspaceId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    if (!key) throw new NotFoundException(`API key ${id} not found`);
    return key;
  }
}
