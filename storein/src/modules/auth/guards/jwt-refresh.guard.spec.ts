import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshGuard } from './jwt-refresh.guard';

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;

  beforeEach(() => {
    guard = new JwtRefreshGuard();
  });

  describe('handleRequest', () => {
    it('returns user when there is no error and user is present', () => {
      const user = { sub: 'uid1', refreshToken: 'header.payload.sig' };
      expect(guard.handleRequest(null, user, null)).toBe(user);
    });

    it('throws UnauthorizedException (not TokenExpiredError) when JWT is expired', () => {
      const tokenExpiredError = Object.assign(new Error('jwt expired'), {
        name: 'TokenExpiredError',
      });
      expect(() => guard.handleRequest(tokenExpiredError, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException (not JsonWebTokenError) when JWT signature is invalid', () => {
      const jwtError = Object.assign(new Error('invalid signature'), {
        name: 'JsonWebTokenError',
      });
      expect(() => guard.handleRequest(jwtError, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when cookie is absent (user=null, err=null)', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when cookie is absent (info carries reason)', () => {
      const info = { name: 'Error', message: 'No auth token' };
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        UnauthorizedException,
      );
    });

    it('does NOT re-throw the raw JWT error (must always wrap in UnauthorizedException)', () => {
      const rawError = Object.assign(new Error('jwt expired'), {
        name: 'TokenExpiredError',
      });
      try {
        guard.handleRequest(rawError, null, null);
        fail('Expected UnauthorizedException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedException);
        expect(e).not.toBe(rawError);
      }
    });
  });
});
