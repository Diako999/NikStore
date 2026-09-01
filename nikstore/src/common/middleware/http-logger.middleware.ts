import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const SLOW_THRESHOLD_MS = 2000;

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const requestId = req['requestId'];
    const startTime = Date.now();

    this.logger.info('Incoming Request', {
      context: 'HTTP',
      requestId,
      method,
      url: originalUrl,
      ip: (req.headers['x-forwarded-for'] as string) || ip,
      userAgent: req.headers['user-agent'],
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const level =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      this.logger.log(level, 'Response Sent', {
        context: 'HTTP',
        requestId,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ...(duration > SLOW_THRESHOLD_MS ? { slowRequest: true } : {}),
      });

      if (duration > SLOW_THRESHOLD_MS) {
        this.logger.warn('Slow Request Detected', {
          context: 'Performance',
          requestId,
          method,
          url: originalUrl,
          duration: `${duration}ms`,
          threshold: `${SLOW_THRESHOLD_MS}ms`,
        });
      }
    });

    next();
  }
}
