import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

// bcryptjs must be mocked at module level — its exports are non-configurable
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2a$12$hashed'),
}));
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../user/entities/user.schema';
import { RefreshToken } from './entities/refresh-token.schema';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from './sms/sms.service.abstract';
import { REDIS_CLIENT } from '../../redis/redis.module';

const HASHED_PW = '$2a$12$hashed'; // placeholder; overridden per-test via bcrypt spy

const mockUser = {
  _id: 'uid1',
  phone: '09121234567',
  isActive: true,
  isAdmin: false,
  role: UserRole.USER,
  password: HASHED_PW,
};
const mockAdmin = { ...mockUser, isAdmin: true, role: UserRole.ADMIN };

interface ChainableQuery {
  select: jest.Mock;
  lean: jest.Mock;
  find: jest.Mock;
}

// Returns a chainable Mongoose query stub
function chainable(resolvedValue: unknown): ChainableQuery {
  const q: ChainableQuery = {
    select: jest.fn(),
    lean: jest.fn(),
    find: jest.fn(),
  };
  q.select.mockReturnValue(q);
  q.lean.mockResolvedValue(resolvedValue);
  q.find.mockReturnValue(q);
  return q;
}

interface SelectResolvesQuery {
  select: jest.Mock;
}

// Returns a stub that resolves on .select() — needed for findOne().select('+password')
function selectResolves(value: unknown): SelectResolvesQuery {
  return { select: jest.fn().mockResolvedValue(value) };
}

interface MockRedis {
  incr: jest.Mock;
  expire: jest.Mock;
  ttl: jest.Mock;
  setex: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let redis: MockRedis;

  const userModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const rtModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('tok') };
  const configService = {
    get: jest.fn(
      (k: string) =>
        ({
          'otp.length': 6,
          'otp.expiresIn': 120,
          'jwt.refreshSecret': 'rs',
          'jwt.refreshExpiresIn': '30d',
        })[k],
    ),
  };
  const smsService = { sendOtp: jest.fn() };
  const settingsService = { findSettings: jest.fn() };

  beforeEach(async () => {
    redis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn(),
      ttl: jest.fn().mockResolvedValue(100),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(RefreshToken.name), useValue: rtModel },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: SmsService, useValue: smsService },
        { provide: SettingsService, useValue: settingsService },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    // Default: OTP redis gets return 1 (under rate limit)
    redis.incr.mockResolvedValue(1);
    // Registration open by default in these tests; the gate has its own describe.
    settingsService.findSettings.mockResolvedValue({
      registrationEnabled: true,
    });
  });

  // ── sendOtp ────────────────────────────────────────────────────
  describe('sendOtp', () => {
    it('sends OTP and returns expiresIn', async () => {
      userModel.findOne.mockReturnValue(chainable(null));
      const res = await service.sendOtp({ phone: '09121234567' });
      expect(res.expiresIn).toBe(120);
      expect(smsService.sendOtp).toHaveBeenCalledWith(
        '09121234567',
        expect.any(String),
      );
    });

    it('throws BadRequestException when rate-limit exceeded', async () => {
      userModel.findOne.mockReturnValue(chainable(null));
      redis.incr.mockResolvedValue(4);
      await expect(service.sendOtp({ phone: '09121234567' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException for inactive user', async () => {
      userModel.findOne.mockReturnValue(chainable({ isActive: false }));
      await expect(service.sendOtp({ phone: '09121234567' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── registration gate ──────────────────────────────────────────
  describe('registration gate', () => {
    it('blocks OTP for an unknown phone while registration is closed', async () => {
      settingsService.findSettings.mockResolvedValue({
        registrationEnabled: false,
      });
      userModel.findOne.mockReturnValue(chainable(null));
      await expect(service.sendOtp({ phone: '09121234567' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(smsService.sendOtp).not.toHaveBeenCalled();
      expect(redis.incr).not.toHaveBeenCalled();
    });

    it('treats a missing flag as closed (fail-closed)', async () => {
      settingsService.findSettings.mockResolvedValue({});
      userModel.findOne.mockReturnValue(chainable(null));
      await expect(service.sendOtp({ phone: '09121234567' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('treats a settings read error as closed', async () => {
      settingsService.findSettings.mockRejectedValue(new Error('db down'));
      userModel.findOne.mockReturnValue(chainable(null));
      await expect(service.sendOtp({ phone: '09121234567' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('still lets an existing user request an OTP while closed', async () => {
      settingsService.findSettings.mockResolvedValue({
        registrationEnabled: false,
      });
      userModel.findOne.mockReturnValue(chainable({ isActive: true }));
      await expect(
        service.sendOtp({ phone: '09121234567' }),
      ).resolves.toBeDefined();
    });

    it('verifyOtp never creates a user while closed', async () => {
      settingsService.findSettings.mockResolvedValue({
        registrationEnabled: false,
      });
      redis.get.mockResolvedValue('123456');
      userModel.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ phone: '09121234567', code: '123456' }, {}),
      ).rejects.toThrow(ForbiddenException);
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────
  describe('verifyOtp', () => {
    it('throws UnauthorizedException when OTP expired', async () => {
      redis.get.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ phone: '09121234567', code: '123456' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when OTP wrong', async () => {
      redis.get.mockResolvedValue('999999');
      await expect(
        service.verifyOtp({ phone: '09121234567', code: '123456' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('registers a new user and returns isNewUser=true', async () => {
      redis.get.mockResolvedValue('123456');
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser);
      rtModel.create.mockResolvedValue({});

      const res = await service.verifyOtp(
        { phone: '09121234567', code: '123456' },
        {},
      );
      expect(res.isNewUser).toBe(true);
      expect(res.accessToken).toBe('tok');
    });

    it('logs in existing user without creating', async () => {
      redis.get.mockResolvedValue('123456');
      userModel.findOne.mockResolvedValue(mockUser);
      rtModel.create.mockResolvedValue({});

      const res = await service.verifyOtp(
        { phone: '09121234567', code: '123456' },
        {},
      );
      expect(res.isNewUser).toBe(false);
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  // ── adminLogin ─────────────────────────────────────────────────
  describe('adminLogin', () => {
    const dto = { phone: '09121234567', password: 'secret123' };

    beforeEach(() => {
      // findOne().select('+password') resolves to admin user by default
      userModel.findOne.mockReturnValue(selectResolves(mockAdmin));
      rtModel.create.mockResolvedValue({});
    });

    it('returns accessToken when credentials are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const res = await service.adminLogin(dto, {});
      expect(res.accessToken).toBe('tok');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockAdmin.password,
      );
    });

    it('clears rate-limit key on successful login', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await service.adminLogin(dto, {});
      expect(redis.del).toHaveBeenCalledWith(`admin:login:rl:${dto.phone}`);
    });

    it('throws UnauthorizedException when user not found', async () => {
      userModel.findOne.mockReturnValue(selectResolves(null));
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password not set', async () => {
      userModel.findOne.mockReturnValue(
        selectResolves({ ...mockAdmin, password: undefined }),
      );
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      userModel.findOne.mockReturnValue(
        selectResolves({ ...mockAdmin, isActive: false }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws ForbiddenException when user has no admin role', async () => {
      userModel.findOne.mockReturnValue(
        selectResolves({
          ...mockUser,
          password: HASHED_PW,
          isAdmin: false,
          role: UserRole.USER,
        }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows login for manager role', async () => {
      userModel.findOne.mockReturnValue(
        selectResolves({
          ...mockUser,
          password: HASHED_PW,
          isAdmin: false,
          role: UserRole.MANAGER,
          isActive: true,
        }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const res = await service.adminLogin(dto, {});
      expect(res.accessToken).toBe('tok');
    });

    it('throws BadRequestException when rate-limit exceeded', async () => {
      redis.incr.mockResolvedValue(11);
      await expect(service.adminLogin(dto, {})).rejects.toThrow(
        BadRequestException,
      );
      // Must not attempt DB query after rate-limit
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('normalizes +98 prefix before lookup', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await service.adminLogin(
        { phone: '+989121234567', password: 'secret123' },
        {},
      );
      expect(userModel.findOne).toHaveBeenCalledWith({ phone: '09121234567' });
    });
  });

  // ── refreshTokens ─────────────────────────────────────────────
  describe('refreshTokens', () => {
    const validJwt = 'header.payload.validSig';

    beforeEach(() => {
      rtModel.findOne.mockResolvedValue({ _id: 'rt1', isRevoked: false });
      userModel.findById.mockResolvedValue({ ...mockUser, _id: 'uid1' });
      rtModel.updateOne.mockResolvedValue({});
      rtModel.create.mockResolvedValue({});
    });

    it('returns new tokens when refresh token is valid', async () => {
      const res = await service.refreshTokens('uid1', validJwt, {});
      expect(res.accessToken).toBe('tok');
      expect(rtModel.create).toHaveBeenCalled();
    });

    it('looks the token up by its SHA-256 hash, not the raw value', async () => {
      await service.refreshTokens('uid1', validJwt, {});
      const [query] = rtModel.findOne.mock.calls[0] as [{ token: string }];
      expect(query.token).toMatch(/^[0-9a-f]{64}$/);
      expect(query.token).not.toContain('validSig');
    });

    it('revokes only the presented token — other devices stay logged in', async () => {
      await service.refreshTokens('uid1', validJwt, {});
      expect(rtModel.updateOne).toHaveBeenCalledWith(
        { _id: 'rt1', isRevoked: false },
        expect.objectContaining({ isRevoked: true }),
      );
      expect(rtModel.updateMany).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when no matching token found in DB', async () => {
      rtModel.findOne.mockResolvedValue(null);
      await expect(service.refreshTokens('uid1', validJwt, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a revoked token once the grace window has passed', async () => {
      rtModel.findOne.mockResolvedValue({
        _id: 'rt1',
        isRevoked: true,
        rotatedAt: new Date(Date.now() - 60_000),
      });
      await expect(service.refreshTokens('uid1', validJwt, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(rtModel.create).not.toHaveBeenCalled();
    });

    it('never gives a logged-out (revoked, not rotated) token a grace window', async () => {
      rtModel.findOne.mockResolvedValue({
        _id: 'rt1',
        isRevoked: true,
        revokedAt: new Date(Date.now() - 1_000), // revoked 1s ago by logout
      });
      await expect(service.refreshTokens('uid1', validJwt, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('accepts a just-rotated token (two tabs refreshing together)', async () => {
      rtModel.findOneAndUpdate.mockResolvedValue({ _id: 'rt1' });
      rtModel.findOne.mockResolvedValue({
        _id: 'rt1',
        isRevoked: true,
        rotatedAt: new Date(Date.now() - 1_000),
      });
      const res = await service.refreshTokens('uid1', validJwt, {});
      expect(res.accessToken).toBe('tok');
    });

    it('allows the grace exchange only once (replay of a rotated token is rejected)', async () => {
      rtModel.findOne.mockResolvedValue({
        _id: 'rt1',
        isRevoked: true,
        rotatedAt: new Date(Date.now() - 1_000),
        graceUsedAt: new Date(),
      });
      rtModel.findOneAndUpdate.mockResolvedValue(null); // claim lost: already spent
      await expect(service.refreshTokens('uid1', validJwt, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(rtModel.create).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      userModel.findById.mockResolvedValue({ ...mockUser, isActive: false });
      await expect(service.refreshTokens('uid1', validJwt, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when refreshToken is malformed', async () => {
      await expect(
        service.refreshTokens('uid1', 'malformed', {}),
      ).rejects.toThrow(UnauthorizedException);
      expect(rtModel.findOne).not.toHaveBeenCalled();
    });
  });

  // ── changePassword ────────────────────────────────────────────
  describe('changePassword', () => {
    const dto = { currentPassword: 'OldPass#1', newPassword: 'NewPass#2' };

    beforeEach(() => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ ...mockAdmin }),
      });
      userModel.findByIdAndUpdate.mockResolvedValue(mockAdmin);
      rtModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$newHashed');
    });

    it('changes password successfully and revokes all refresh tokens', async () => {
      await service.changePassword('uid1', dto);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass#2', 12);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('uid1', {
        password: '$2a$12$newHashed',
      });
      expect(rtModel.updateMany).toHaveBeenCalledWith(
        { userId: 'uid1' },
        { isRevoked: true, revokedAt: expect.any(Date) as unknown },
      );
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.changePassword('uid1', dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('allows initial password set when no password exists (no currentPassword required)', async () => {
      userModel.findById.mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ ...mockAdmin, password: undefined }),
      });
      await service.changePassword('uid1', { newPassword: 'NewPass#2' });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass#2', 12);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('uid1', {
        password: '$2a$12$newHashed',
      });
      expect(rtModel.updateMany).toHaveBeenCalledWith(
        { userId: 'uid1' },
        { isRevoked: true, revokedAt: expect.any(Date) as unknown },
      );
    });

    it('throws BadRequestException when user not found', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      await expect(service.changePassword('uid1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when new password equals current', async () => {
      const sameDto = {
        currentPassword: 'SamePass#1',
        newPassword: 'SamePass#1',
      };
      await expect(service.changePassword('uid1', sameDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
