import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from './encryption.service';
import { Platform } from '@barmagly/shared';

@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {}

  async getWorkspaceAccounts(workspaceId: string) {
    return this.prisma.socialAccount.findMany({
      where: { workspaceId, isActive: true },
      select: {
        id: true, platform: true, username: true, displayName: true,
        avatarUrl: true, profileUrl: true, isActive: true, lastSyncAt: true,
        _count: { select: { posts: true } },
      },
      orderBy: { platform: 'asc' },
    });
  }

  async connectAccount(workspaceId: string, data: {
    platform: Platform;
    platformUserId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    profileUrl?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    scopes?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const existing = await this.prisma.socialAccount.findUnique({
      where: {
        workspaceId_platform_platformUserId: {
          workspaceId, platform: data.platform, platformUserId: data.platformUserId,
        },
      },
    });

    const encryptedAccessToken = this.encryption.encrypt(data.accessToken);
    const encryptedRefreshToken = data.refreshToken
      ? this.encryption.encrypt(data.refreshToken)
      : undefined;

    if (existing) {
      return this.prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: data.tokenExpiresAt,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          isActive: true,
        },
      });
    }

    return this.prisma.socialAccount.create({
      data: {
        workspaceId,
        platform: data.platform,
        platformUserId: data.platformUserId,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        profileUrl: data.profileUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes ?? [],
        metadata: data.metadata ?? {},
      },
    });
  }

  async disconnectAccount(workspaceId: string, accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, workspaceId },
    });
    if (!account) throw new NotFoundException('Social account not found');

    return this.prisma.socialAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });
  }

  async getDecryptedTokens(accountId: string) {
    const account = await this.prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Social account not found');

    return {
      accessToken: this.encryption.decrypt(account.accessToken),
      refreshToken: account.refreshToken ? this.encryption.decrypt(account.refreshToken) : null,
      tokenExpiresAt: account.tokenExpiresAt,
    };
  }

  getOAuthUrl(platform: Platform, workspaceId: string): string {
    const baseUrl = this.config.get('API_URL');
    const stateParam = Buffer.from(JSON.stringify({ workspaceId, platform })).toString('base64');

    const urls: Record<Platform, string> = {
      [Platform.FACEBOOK]: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.config.get('FACEBOOK_APP_ID')}&redirect_uri=${baseUrl}/auth/oauth/facebook/callback&state=${stateParam}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish`,
      [Platform.INSTAGRAM]: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${this.config.get('INSTAGRAM_APP_ID')}&redirect_uri=${baseUrl}/auth/oauth/instagram/callback&state=${stateParam}&scope=instagram_basic,instagram_content_publish`,
      [Platform.TWITTER]: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${this.config.get('TWITTER_API_KEY')}&redirect_uri=${baseUrl}/auth/oauth/twitter/callback&scope=tweet.read tweet.write users.read offline.access&state=${stateParam}&code_challenge=challenge&code_challenge_method=plain`,
      [Platform.TIKTOK]: `https://www.tiktok.com/v2/auth/authorize?client_key=${this.config.get('TIKTOK_APP_ID')}&scope=user.info.basic,video.list,video.upload&response_type=code&redirect_uri=${baseUrl}/auth/oauth/tiktok/callback&state=${stateParam}`,
      [Platform.LINKEDIN]: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.config.get('LINKEDIN_CLIENT_ID')}&redirect_uri=${baseUrl}/auth/oauth/linkedin/callback&scope=r_liteprofile w_member_social&state=${stateParam}`,
      [Platform.YOUTUBE]: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.config.get('YOUTUBE_CLIENT_ID')}&redirect_uri=${baseUrl}/auth/oauth/youtube/callback&scope=https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${stateParam}`,
    };

    return urls[platform];
  }
}
