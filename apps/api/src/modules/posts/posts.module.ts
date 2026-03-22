import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { QUEUE_NAMES } from '@barmagly/shared';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.POST_SCHEDULER }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
