import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

import { AppController } from './app.controller';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { SocialAccountsModule } from './modules/social-accounts/social-accounts.module';
import { PostsModule } from './modules/posts/posts.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiAgentsModule } from './modules/ai-agents/ai-agents.module';
import { EmailMarketingModule } from './modules/email-marketing/email-marketing.module';
import { CrmModule } from './modules/crm/crm.module';
import { TeamModule } from './modules/team/team.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { AutomationModule } from './modules/automation/automation.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { WebSocketsModule } from './websockets/websockets.module';
import { QUEUE_NAMES } from '@barmagly/shared';

@Module({
  imports: [
    // ─── Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ─── Rate Limiting ─────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ─── Cron Scheduling ───────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── BullMQ ────────────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),

    // ─── Cache (Redis-backed) ──────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('REDIS_URL'))],
        ttl: 300 * 1000, // 5 minutes default
      }),
    }),

    // ─── Core Infrastructure ───────────────────────────────────
    PrismaModule,
    RedisModule,
    StorageModule,
    AuditModule,
    SearchModule,
    WebSocketsModule,

    // ─── Auth & Users ──────────────────────────────────────────
    AuthModule,
    UsersModule,
    WorkspacesModule,

    // ─── Social Features ───────────────────────────────────────
    SocialAccountsModule,
    PostsModule,
    SchedulerModule,
    InboxModule,
    CampaignsModule,

    // ─── Analytics & AI ────────────────────────────────────────
    AnalyticsModule,
    AiAgentsModule,

    // ─── Marketing ─────────────────────────────────────────────
    EmailMarketingModule,
    CrmModule,

    // ─── Collaboration ─────────────────────────────────────────
    TeamModule,
    NotificationsModule,

    // ─── Platform ──────────────────────────────────────────────
    BillingModule,
    WhiteLabelModule,
    AutomationModule,
    ApiKeysModule,
    WebhooksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
