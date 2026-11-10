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
  user?: { _id?: { toString(): string } };
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
    const userId = request.user?._id?.toString();

    const isHttp = exception instanceof HttpException;
    // A malformed ObjectId in a route param / body makes Mongoose throw a CastError
    // (or ValidationError) — that's the client's fault (400), not a server crash.
    const errName = (exception as { name?: string } | null)?.name;
    const isBadInput = errName === 'CastError' || errName === 'ValidationError';
    // Errors raised by the body parser (payload too large, malformed JSON) are plain
    // `http-errors` objects carrying their own 4xx `status` — not Nest HttpExceptions.
    // Without this they were reported as 500 "server crashes" with a stack trace.
    const rawStatus = (exception as { status?: unknown } | null)?.status;
    const clientStatus =
      !isHttp &&
      typeof rawStatus === 'number' &&
      Number.isInteger(rawStatus) &&
      rawStatus >= 400 &&
      rawStatus < 500
        ? rawStatus
        : null;

    const statusCode = isHttp
      ? exception.getStatus()
      : clientStatus
        ? clientStatus
        : isBadInput
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = isHttp
      ? this.extractMessage(exception)
      : clientStatus
        ? clientStatus === 413
          ? 'حجم درخواست بیش از حد مجاز است'
          : 'درخواست نامعتبر است'
        : isBadInput
          ? 'ورودی نامعتبر است'
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
