import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & { user?: { isAdmin?: boolean } };

/** Grants access to Admin role only — managers are excluded. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest<RequestWithUser>().user;
    if (!user?.isAdmin)
      throw new ForbiddenException('دسترسی فقط برای ادمین اصلی');
    return true;
  }
}
