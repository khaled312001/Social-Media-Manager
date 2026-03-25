import { Controller, Get, Query, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SocialAccountsService } from './social-accounts.service';
import { Platform } from '@barmagly/shared';

interface OAuthState {
  workspaceId: string;
  platform: string;
}

/**
 * Handles OAuth2 callbacks from all 6 social platforms.
 * Flow: Platform → POST /oauth/callback/:platform?code=xxx&state=yyy
 *        → exchange code for token → save to DB → redirect to frontend
 */
@ApiTags('oauth')
@Controller('auth/oauth')
export class OAuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly service: SocialAccountsService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private decodeState(state: string): OAuthState {
    try {
      return JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      return { workspaceId: '', platform: '' };
    }
  }

  private successRedirect(res: Response, platform: string) {
    return res.redirect(`${this.frontendUrl}/auth/oauth/callback?success=true&platform=${platform}`);
  }

  private errorRedirect(res: Response, platform: string, message = 'Connection failed') {
    return res.redirect(
      `${this.frontendUrl}/auth/oauth/callback?success=false&platform=${platform}&error=${encodeURIComponent(message)}`,
    );
  }

  // ─── Facebook ─────────────────────────────────────────────────────────────

  @Get('facebook/callback')
  @ApiExcludeEndpoint()
  async facebookCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'FACEBOOK', 'Missing code or state');

    try {
      const appId = this.config.get('FACEBOOK_APP_ID');
      const appSecret = this.config.get('FACEBOOK_APP_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/facebook/callback`;

      const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code },
      });
      const { access_token: accessToken } = tokenRes.data;

      const profileRes = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: { fields: 'id,name,email,picture', access_token: accessToken },
      });
      const profile = profileRes.data;

      await this.service.connectAccount(workspaceId, {
        platform: Platform.FACEBOOK,
        platformUserId: profile.id,
        username: profile.name?.toLowerCase().replace(/\s+/g, '') ?? profile.id,
        displayName: profile.name ?? profile.id,
        avatarUrl: profile.picture?.data?.url,
        accessToken,
        scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
      });

      return this.successRedirect(res, 'FACEBOOK');
    } catch (err: any) {
      return this.errorRedirect(res, 'FACEBOOK', err?.response?.data?.error?.message ?? 'Facebook auth failed');
    }
  }

  // ─── Instagram ────────────────────────────────────────────────────────────

  @Get('instagram/callback')
  @ApiExcludeEndpoint()
  async instagramCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'INSTAGRAM', 'Missing code or state');

    try {
      const appId = this.config.get('INSTAGRAM_APP_ID');
      const appSecret = this.config.get('INSTAGRAM_APP_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/instagram/callback`;

      // Step 1: short-lived token
      const formData = new URLSearchParams({
        client_id: appId, client_secret: appSecret,
        grant_type: 'authorization_code', redirect_uri: redirectUri, code,
      });
      const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { access_token: shortToken, user_id: userId } = tokenRes.data;

      // Step 2: long-lived token
      const longTokenRes = await axios.get('https://graph.instagram.com/access_token', {
        params: { grant_type: 'ig_exchange_token', client_secret: appSecret, access_token: shortToken },
      });
      const { access_token: accessToken, expires_in: expiresIn } = longTokenRes.data;

      const profileRes = await axios.get(`https://graph.instagram.com/${userId}`, {
        params: { fields: 'id,username,name,profile_picture_url', access_token: accessToken },
      });
      const profile = profileRes.data;

      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : new Date(Date.now() + 60 * 24 * 3600 * 1000); // 60 days default

      await this.service.connectAccount(workspaceId, {
        platform: Platform.INSTAGRAM,
        platformUserId: profile.id,
        username: profile.username ?? profile.id,
        displayName: profile.name ?? profile.username ?? profile.id,
        avatarUrl: profile.profile_picture_url,
        accessToken,
        tokenExpiresAt,
        scopes: ['instagram_basic', 'instagram_content_publish'],
      });

      return this.successRedirect(res, 'INSTAGRAM');
    } catch (err: any) {
      return this.errorRedirect(res, 'INSTAGRAM', err?.response?.data?.error?.message ?? 'Instagram auth failed');
    }
  }

  // ─── Twitter / X ──────────────────────────────────────────────────────────

  @Get('twitter/callback')
  @ApiExcludeEndpoint()
  async twitterCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'TWITTER', 'Missing code or state');

    try {
      const clientId = this.config.get('TWITTER_API_KEY');
      const clientSecret = this.config.get('TWITTER_API_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/twitter/callback`;
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const tokenRes = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: 'challenge', // matches code_challenge=challenge in getOAuthUrl
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
        },
      );
      const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenRes.data;

      const profileRes = await axios.get('https://api.twitter.com/2/users/me', {
        params: { 'user.fields': 'id,name,username,profile_image_url' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = profileRes.data.data;

      await this.service.connectAccount(workspaceId, {
        platform: Platform.TWITTER,
        platformUserId: profile.id,
        username: profile.username,
        displayName: profile.name,
        avatarUrl: profile.profile_image_url,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      });

      return this.successRedirect(res, 'TWITTER');
    } catch (err: any) {
      return this.errorRedirect(res, 'TWITTER', err?.response?.data?.error ?? 'Twitter auth failed');
    }
  }

  // ─── LinkedIn ─────────────────────────────────────────────────────────────

  @Get('linkedin/callback')
  @ApiExcludeEndpoint()
  async linkedinCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'LINKEDIN', 'Missing code or state');

    try {
      const clientId = this.config.get('LINKEDIN_CLIENT_ID');
      const clientSecret = this.config.get('LINKEDIN_CLIENT_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/linkedin/callback`;

      const tokenRes = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenRes.data;

      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = profileRes.data;

      await this.service.connectAccount(workspaceId, {
        platform: Platform.LINKEDIN,
        platformUserId: profile.sub,
        username: (profile.name ?? profile.email ?? profile.sub).toLowerCase().replace(/\s+/g, ''),
        displayName: profile.name ?? profile.sub,
        avatarUrl: profile.picture,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scopes: ['r_liteprofile', 'w_member_social'],
      });

      return this.successRedirect(res, 'LINKEDIN');
    } catch (err: any) {
      return this.errorRedirect(res, 'LINKEDIN', err?.response?.data?.error_description ?? 'LinkedIn auth failed');
    }
  }

  // ─── TikTok ───────────────────────────────────────────────────────────────

  @Get('tiktok/callback')
  @ApiExcludeEndpoint()
  async tiktokCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'TIKTOK', 'Missing code or state');

    try {
      const clientKey = this.config.get('TIKTOK_APP_ID');
      const clientSecret = this.config.get('TIKTOK_APP_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/tiktok/callback`;

      const tokenRes = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      const { access_token: accessToken, refresh_token: refreshToken, open_id: openId, expires_in: expiresIn } = tokenRes.data.data;

      const profileRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
        params: { fields: 'open_id,union_id,avatar_url,display_name' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = profileRes.data.data.user;

      await this.service.connectAccount(workspaceId, {
        platform: Platform.TIKTOK,
        platformUserId: openId ?? profile.open_id,
        username: profile.display_name?.toLowerCase().replace(/\s+/g, '') ?? openId,
        displayName: profile.display_name ?? openId,
        avatarUrl: profile.avatar_url,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scopes: ['user.info.basic', 'video.list', 'video.upload'],
      });

      return this.successRedirect(res, 'TIKTOK');
    } catch (err: any) {
      return this.errorRedirect(res, 'TIKTOK', err?.response?.data?.error?.message ?? 'TikTok auth failed');
    }
  }

  // ─── YouTube ──────────────────────────────────────────────────────────────

  @Get('youtube/callback')
  @ApiExcludeEndpoint()
  async youtubeCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { workspaceId } = this.decodeState(state);
    if (!workspaceId || !code) return this.errorRedirect(res, 'YOUTUBE', 'Missing code or state');

    try {
      const clientId = this.config.get('YOUTUBE_CLIENT_ID');
      const clientSecret = this.config.get('YOUTUBE_CLIENT_SECRET');
      const redirectUri = `${this.config.get('API_URL')}/auth/oauth/youtube/callback`;

      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenRes.data;

      const profileRes = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const profile = profileRes.data;

      await this.service.connectAccount(workspaceId, {
        platform: Platform.YOUTUBE,
        platformUserId: profile.sub,
        username: (profile.name ?? profile.email ?? profile.sub).toLowerCase().replace(/\s+/g, ''),
        displayName: profile.name ?? profile.sub,
        avatarUrl: profile.picture,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
        scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
      });

      return this.successRedirect(res, 'YOUTUBE');
    } catch (err: any) {
      return this.errorRedirect(res, 'YOUTUBE', err?.response?.data?.error ?? 'YouTube auth failed');
    }
  }
}
