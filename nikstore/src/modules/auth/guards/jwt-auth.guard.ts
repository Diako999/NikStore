import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import type { UserDocument } from '../../user/entities/user.schema';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    return isPublic ? true : super.canActivate(ctx);
  }

  // Signature must structurally match the base `IAuthGuard.handleRequest`
  // (`<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any) => TUser`)
  // — narrowing it to `(err: Error | null, user: UserDocument | false): UserDocument`
  // is not assignable to that generic base signature because `UserDocument`
  // can't satisfy an arbitrary `TUser`. A function type with fewer parameters
  // is assignable to one declaring more (extra call-site args are simply
  // ignored), so the trailing `info`/`context`/`status` params can be omitted
  // as long as the method stays generic over `TUser`.
  handleRequest<TUser = UserDocument>(
    err: unknown,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      const message = err instanceof Error ? err.message : undefined;
      this.logger.warn('JWT auth failed', { error: message });
      throw new UnauthorizedException('لطفاً وارد حساب کاربری خود شوید');
    }
    return user;
  }
}
