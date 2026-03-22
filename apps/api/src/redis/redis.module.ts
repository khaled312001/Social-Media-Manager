import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        client.on('error', (err) => console.error('Redis error:', err));
        client.on('connect', () => console.log('Redis connected'));
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
