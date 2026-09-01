import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { UserDocument } from '../../user/entities/user.schema';

const makeCtx = (handler = {}, cls = {}): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => cls,
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('returns true immediately for @Public() routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(makeCtx())).toBe(true);
    });

    it('delegates to passport AuthGuard for protected routes', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);
      void guard.canActivate(makeCtx());
      expect(superActivate).toHaveBeenCalled();
      superActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('returns the user when valid', () => {
      const user = {
        _id: 'u1',
        phone: '09120000000',
      } as unknown as UserDocument;
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('throws UnauthorizedException when user is falsy', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when error is passed', () => {
      expect(() =>
        guard.handleRequest(new Error('jwt expired'), false),
      ).toThrow(UnauthorizedException);
    });
  });
});
