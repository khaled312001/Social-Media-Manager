import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@barmagly/shared';
import { EmailMarketingController } from './email-marketing.controller';
import { EmailMarketingService } from './email-marketing.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.EMAIL_SEND }),
  ],
  controllers: [EmailMarketingController],
  providers: [EmailMarketingService],
  exports: [EmailMarketingService],
})
export class EmailMarketingModule {}
