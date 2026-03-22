import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { EventsGateway } from '../../websockets/events.gateway';
import { QUEUE_NAMES, Platform } from '@barmagly/shared';

interface PublishJobData {
  postId: string;
  workspaceId: string;
}

@Processor(QUEUE_NAMES.POST_SCHEDULER, {
  concurrency: 10,
})
export class SchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly socialAccounts: SocialAccountsService,
    private readonly events: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>) {
    const { postId, workspaceId } = job.data;
    this.logger.log(`Processing publish job for post ${postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        media: true,
        accounts: { include: { socialAccount: true } },
      },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found, skipping`);
      return;
    }

    if (post.status === 'PUBLISHED' || post.status === 'CANCELLED') {
      this.logger.warn(`Post ${postId} already ${post.status}, skipping`);
      return;
    }

    await this.prisma.post.update({ where: { id: postId }, data: { status: 'PUBLISHING' } });

    const results = await Promise.allSettled(
      post.accounts.map((account) =>
        this.publishToplatform(post, account.socialAccount, account.id),
      ),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    const newStatus = failures.length === results.length ? 'FAILED' : 'PUBLISHED';

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: newStatus, publishedAt: newStatus === 'PUBLISHED' ? new Date() : undefined },
    });

    if (newStatus === 'PUBLISHED') {
      this.events.emitPostPublished(workspaceId, { postId, status: 'PUBLISHED' });
    } else {
      this.events.emitPostFailed(workspaceId, { postId, status: 'FAILED' });
    }

    this.logger.log(`Post ${postId} → ${newStatus} (${failures.length} failures)`);
  }

  private async publishToplatform(
    post: { id: string; content: string; media: { url: string }[] },
    account: { id: string; platform: string; accessToken: string },
    postAccountId: string,
  ) {
    try {
      const tokens = await this.socialAccounts.getDecryptedTokens(account.id);

      // Platform-specific publishing logic
      // In production: call each platform's API SDK
      switch (account.platform as Platform) {
        case Platform.FACEBOOK:
          await this.publishToFacebook(post, tokens.accessToken, account);
          break;
        case Platform.INSTAGRAM:
          await this.publishToInstagram(post, tokens.accessToken, account);
          break;
        case Platform.TWITTER:
          await this.publishToTwitter(post, tokens.accessToken);
          break;
        case Platform.LINKEDIN:
          await this.publishToLinkedIn(post, tokens.accessToken, account);
          break;
        case Platform.TIKTOK:
          await this.publishToTikTok(post, tokens.accessToken);
          break;
        case Platform.YOUTUBE:
          await this.publishToYouTube(post, tokens.accessToken);
          break;
      }

      await this.prisma.postAccount.update({
        where: { id: postAccountId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
    } catch (error) {
      await this.prisma.postAccount.update({
        where: { id: postAccountId },
        data: { status: 'FAILED', failureReason: (error as Error).message },
      });
      throw error;
    }
  }

  private async publishToFacebook(post: any, token: string, account: any) {
    const { default: axios } = await import('axios');
    const pageId = account.metadata?.pageId ?? account.platformUserId;
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      { message: post.content, access_token: token },
    );
    return response.data;
  }

  private async publishToInstagram(post: any, token: string, account: any) {
    const { default: axios } = await import('axios');
    const igUserId = account.platformUserId;
    // Step 1: Create media container
    const container = await axios.post(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        caption: post.content,
        ...(post.media[0] && { image_url: post.media[0].url }),
        access_token: token,
      },
    );
    // Step 2: Publish
    await axios.post(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      { creation_id: container.data.id, access_token: token },
    );
  }

  private async publishToTwitter(post: any, token: string) {
    const { default: axios } = await import('axios');
    await axios.post(
      'https://api.twitter.com/2/tweets',
      { text: post.content.substring(0, 280) },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  private async publishToLinkedIn(post: any, token: string, account: any) {
    const { default: axios } = await import('axios');
    await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${account.platformUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  private async publishToTikTok(_post: any, _token: string) {
    // TikTok requires video content — placeholder
    this.logger.log('TikTok publishing: video upload flow');
  }

  private async publishToYouTube(_post: any, _token: string) {
    // YouTube requires video content — placeholder
    this.logger.log('YouTube publishing: video upload flow');
  }
}
