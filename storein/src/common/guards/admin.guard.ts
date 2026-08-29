import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../../modules/user/entities/user.schema';

type RequestWithUser = Request & {
  user?: { isAdmin?: boolean; role?: string };
};

/** Grants access to Admin and Manager roles. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const user = ctx.switchToHttp().getRequest<RequestWithUser>().user;
    if (!user?.isAdmin && user?.role !== UserRole.MANAGER)
      throw new ForbiddenException('دسترسی فقط برای ادمین یا مدیر');
    return true;
  }
}
