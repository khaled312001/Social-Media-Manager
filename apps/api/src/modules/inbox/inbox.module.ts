import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { QUEUE_NAMES } from '@barmagly/shared';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.INBOX_SYNC })],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
