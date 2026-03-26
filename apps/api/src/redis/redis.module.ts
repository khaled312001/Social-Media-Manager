import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const client = new Redis(url, {
          maxRetriesPerRequest: 3,
          lazyConnect: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        client.on('error', (err) => console.error('Redis error:', err.message));
        client.on('connect', () => console.log('✅ Redis connected'));
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
