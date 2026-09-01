import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

type RequestWithContext = Request & {
  requestId?: string;
  user?: { userId?: string };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();
    const requestId = request.requestId;
    const userId = request.user?.userId;

    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = isHttp
      ? this.extractMessage(exception)
      : 'Internal server error';

    const errorResponse = {
      success: false,
      statusCode,
      message: rawMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    };

    const logPayload = {
      context: 'ExceptionFilter',
      requestId,
      userId,
      method: request.method,
      url: request.url,
      statusCode,
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      body: this.sanitizeBody(request.body),
    };

    if (statusCode >= 500) {
      this.logger.error('Unhandled Server Error', logPayload);
    } else if (statusCode >= 400) {
      this.logger.warn('Client Error', { ...logPayload, stack: undefined });
    }

    response.status(statusCode).json(errorResponse);
  }

  private extractMessage(exception: HttpException): string | string[] {
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    const message = (body as { message?: string | string[] }).message;
    return message ?? exception.message;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    const sensitive = ['password', 'token', 'secret', 'code', 'otp'];
    const clean: Record<string, unknown> = {
      ...(body as Record<string, unknown>),
    };
    sensitive.forEach((key) => {
      if (key in clean) clean[key] = '***';
    });
    return clean;
  }
}
