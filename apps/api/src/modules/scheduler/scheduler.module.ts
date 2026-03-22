import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerProcessor } from './scheduler.processor';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { QUEUE_NAMES } from '@barmagly/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.POST_SCHEDULER }),
    SocialAccountsModule,
  ],
  providers: [SchedulerProcessor],
})
export class SchedulerModule {}
