import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService, logger: Logger): Redis => {
        const client = new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
          // Fail fast instead of hanging a request for tens of seconds when
          // Redis is briefly unreachable — callers that rely on Redis for
          // caching (not primary storage) fall back to the DB on error.
          maxRetriesPerRequest: 2,
          retryStrategy: (times) => Math.min(times * 200, 1000),
        });

        client.on('connect', () =>
          logger.info('Redis connected', { context: 'Redis' }),
        );
        client.on('error', (err) =>
          logger.error(`Redis error: ${err.message}`, { context: 'Redis' }),
        );

        return client;
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
