import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request } from 'express';

const SLOW_HANDLER_MS = 1000;

type RequestWithContext = Request & {
  requestId?: string;
  user?: { userId?: string };
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithContext>();
    const handler = context.getHandler().name;
    const cls = context.getClass().name;
    const requestId = req['requestId'];
    const userId = req['user']?.userId;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > SLOW_HANDLER_MS) {
          this.logger.warn('Slow Handler Detected', {
            context: `${cls}.${handler}`,
            requestId,
            userId,
            duration: `${duration}ms`,
          });
        }
      }),
      catchError((error: unknown) => {
        this.logger.error('Handler Error', {
          context: `${cls}.${handler}`,
          requestId,
          userId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${Date.now() - start}ms`,
        });
        return throwError(() => error);
      }),
    );
  }
}
