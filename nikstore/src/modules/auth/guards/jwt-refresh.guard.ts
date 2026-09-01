import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  /**
   * Convert any JWT verification error (TokenExpiredError, JsonWebTokenError, etc.)
   * to UnauthorizedException so NestJS returns 401, not 500.
   * Without this override, the default AuthGuard.handleRequest does `throw err`
   * on a non-null err, which re-throws the raw jsonwebtoken error → 500.
   */
  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      this.logger.debug(
        `Refresh token rejected — ${err?.name ?? info?.name ?? 'no token'}: ` +
          (err?.message ?? info?.message ?? 'cookie missing or invalid'),
      );
      throw new UnauthorizedException('توکن نامعتبر یا منقضی است');
    }
    return user;
  }
}
