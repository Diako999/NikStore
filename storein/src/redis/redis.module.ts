import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const client = new Redis({
          host:      configService.get<string>('redis.host'),
          port:      configService.get<number>('redis.port'),
          password:  configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
          // Fail fast instead of hanging a request for tens of seconds when
          // Redis is briefly unreachable — callers that rely on Redis for
          // caching (not primary storage) fall back to the DB on error.
          maxRetriesPerRequest: 2,
          retryStrategy: (times) => Math.min(times * 200, 1000),
        });

        client.on('connect', () => console.log('✅ Redis connected'));
        client.on('error', (err) => console.error('❌ Redis error:', err));

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
