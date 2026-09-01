import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomInt, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { SmsService } from './sms/sms.service.abstract';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User, UserDocument, UserRole } from '../user/entities/user.schema';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './entities/refresh-token.schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private rtModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // ── OTP ──────────────────────────────────────────────────────
  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);

    // Block check before doing anything (don't waste SMS quota on blocked users)
    const existingUser = await this.userModel
      .findOne({ phone })
      .select('isActive')
      .lean();
    if (existingUser && !existingUser.isActive) {
      this.logger.warn(`OTP blocked — inactive user: ${this.maskPhone(phone)}`);
      throw new ForbiddenException(
        'حساب کاربری شما مسدود شده است. با پشتیبانی سایت تماس بگیرید',
      );
    }

    const rlKey = `otp:rl:${phone}`;
    const attempts = await this.redis.incr(rlKey);
    if (attempts === 1) await this.redis.expire(rlKey, 600);
    if (attempts > 3) {
      this.logger.warn(
        `OTP rate-limit hit: ${this.maskPhone(phone)} (attempts=${attempts})`,
      );
      throw new BadRequestException('درخواست زیاد. ۱۰ دقیقه دیگر تلاش کنید');
    }

    const length = this.configService.get<number>('otp.length')!;
    const ttl = this.configService.get<number>('otp.expiresIn')!;
    const code = Array.from({ length }, () => randomInt(0, 10)).join('');

    await this.redis.setex(`otp:${phone}`, ttl, code);
    await this.smsService.sendOtp(phone, code);
    this.logger.log(`OTP sent → ${this.maskPhone(phone)}`);

    return { message: 'کد تایید ارسال شد', expiresIn: ttl };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    meta: { userAgent?: string; ip?: string },
  ) {
    const phone = this.normalizePhone(dto.phone);
    const key = `otp:${phone}`;
    const verifyKey = `otp:verify:${phone}`;

    // Brute-force guard: max 5 attempts per OTP window (300 s)
    const attempts = await this.redis.incr(verifyKey);
    if (attempts === 1) await this.redis.expire(verifyKey, 300);
    if (attempts > 5) {
      this.logger.warn(
        `OTP verify rate-limit: ${this.maskPhone(phone)} (attempts=${attempts})`,
      );
      throw new BadRequestException(
        'تعداد تلاش‌های اشتباه زیاد است. ۵ دقیقه دیگر تلاش کنید',
      );
    }

    const stored = await this.redis.get(key);

    if (!stored) {
      this.logger.warn(`OTP expired: ${this.maskPhone(phone)}`);
      throw new UnauthorizedException('کد منقضی شده است');
    }
    if (stored !== dto.code) {
      this.logger.warn(`OTP mismatch: ${this.maskPhone(phone)}`);
      throw new UnauthorizedException('کد اشتباه است');
    }

    await this.redis.del(key, `otp:rl:${phone}`, verifyKey);

    let user = await this.userModel.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await this.userModel.create({ phone });
      this.logger.log(`New user registered: ${this.maskPhone(phone)}`);
    } else if (!user.isActive) {
      this.logger.warn(
        `Login blocked — inactive user: ${this.maskPhone(phone)}`,
      );
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    const tokens = await this.issueTokens(user, meta);
    this.logger.log(`OTP verified — user logged in: ${this.maskPhone(phone)}`);
    return { ...tokens, isNewUser };
  }

  // ── Admin Password Login ───────────────────────────────────────
  async adminLogin(
    dto: AdminLoginDto,
    meta: { userAgent?: string; ip?: string },
  ) {
    const phone = this.normalizePhone(dto.phone);

    // Brute-force guard: 10 attempts / 10 min
    const rlKey = `admin:login:rl:${phone}`;
    const attempts = await this.redis.incr(rlKey);
    if (attempts === 1) await this.redis.expire(rlKey, 600);
    if (attempts > 10) {
      this.logger.warn(`Admin login rate-limit: ${this.maskPhone(phone)}`);
      throw new BadRequestException(
        'تعداد تلاش زیاد. ۱۰ دقیقه دیگر امتحان کنید',
      );
    }

    const user = await this.userModel.findOne({ phone }).select('+password');

    // Use same error message for "not found" and "wrong password" to avoid user enumeration
    if (!user || !user.password) {
      this.logger.warn(
        `Admin login — no password set: ${this.maskPhone(phone)}`,
      );
      throw new UnauthorizedException('شماره یا رمز عبور اشتباه است');
    }

    if (!user.isActive) {
      this.logger.warn(
        `Admin login blocked — inactive: ${this.maskPhone(phone)}`,
      );
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    const adminRoles: string[] = [UserRole.ADMIN, UserRole.MANAGER];
    if (!user.isAdmin && !adminRoles.includes(user.role)) {
      this.logger.warn(
        `Admin login denied — insufficient role: ${this.maskPhone(phone)}`,
      );
      throw new ForbiddenException('دسترسی به پنل مدیریت ندارید');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(
        `Admin login — wrong password: ${this.maskPhone(phone)}`,
      );
      throw new UnauthorizedException('شماره یا رمز عبور اشتباه است');
    }

    await this.redis.del(rlKey); // clear rate-limit on success
    const tokens = await this.issueTokens(user, meta);
    this.logger.log(`Admin password login: ${this.maskPhone(phone)}`);
    return tokens;
  }

  /** One-time bootstrap: hash and store password, mark user as admin. */
  async setAdminPassword(phone: string, plainPassword: string): Promise<void> {
    const normalized = this.normalizePhone(phone);
    const hashed = await bcrypt.hash(plainPassword, 12);
    const user = await this.userModel.findOneAndUpdate(
      { phone: normalized },
      { password: hashed, isAdmin: true, role: UserRole.ADMIN },
      { new: true },
    );
    if (!user) throw new Error(`User not found: ${normalized}`);
    this.logger.log(`Admin password set for: ${this.maskPhone(normalized)}`);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new BadRequestException('کاربر یافت نشد');

    if (user.password) {
      // Password already set — must verify current password
      if (!dto.currentPassword) {
        throw new BadRequestException('رمز عبور فعلی الزامی است');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) {
        this.logger.warn(
          `changePassword failed — wrong current password: userId=${userId}`,
        );
        throw new UnauthorizedException('رمز عبور فعلی اشتباه است');
      }
      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException(
          'رمز عبور جدید نباید با رمز فعلی یکسان باشد',
        );
      }
      this.logger.log(`Admin password changed: userId=${userId}`);
    } else {
      // No password set yet — initial setup via authenticated admin session
      this.logger.log(`Admin initial password set: userId=${userId}`);
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userModel.findByIdAndUpdate(userId, { password: hashed });

    // Revoke all existing refresh tokens — force re-login on other devices
    await this.rtModel.updateMany({ userId }, { isRevoked: true });
  }

  // ── Tokens ────────────────────────────────────────────────────
  async refreshTokens(
    userId: string,
    refreshToken: string,
    meta: { userAgent?: string; ip?: string },
  ) {
    const sig = refreshToken?.split('.')?.[2];
    if (!sig) {
      this.logger.warn(`Refresh — malformed token payload: userId=${userId}`);
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    // Limit to the 3 most recent non-revoked tokens.
    // bcrypt.compare on a slow VPS takes ~2-3s per round; iterating all accumulated
    // tokens (one created per page-refresh) causes the request to exceed the 15s
    // client timeout after just 5-6 refreshes.
    const candidates = await this.rtModel
      .find({
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .limit(3);

    let doc: RefreshTokenDocument | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(sig, candidate.token)) {
        doc = candidate;
        break;
      }
    }
    if (!doc) {
      this.logger.warn(`Refresh token invalid/expired: userId=${userId}`);
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const user = await this.userModel.findById(userId);
    if (!user?.isActive) {
      this.logger.warn(`Refresh blocked — inactive user: userId=${userId}`);
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    // Token rotation: revoke ALL active tokens for this user before issuing a new one.
    // This keeps exactly one active token in DB at all times, eliminating bcrypt
    // accumulation from repeated page refreshes. Explicit logout-all still works.
    await this.rtModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    await this.rtModel.deleteMany({ userId, expiresAt: { $lte: new Date() } });
    return this.issueTokens(user, meta);
  }

  async logout(userId: string, token: string) {
    const sig = token.split('.')[2] || token;
    const active = await this.rtModel.find({ userId, isRevoked: false });
    for (const doc of active) {
      if (await bcrypt.compare(sig, doc.token)) {
        await this.rtModel.findByIdAndUpdate(doc._id, { isRevoked: true });
        break;
      }
    }
    return { message: 'خروج موفق' };
  }

  async logoutAll(userId: string) {
    await this.rtModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    return { message: 'خروج از همه دستگاه‌ها' };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async issueTokens(
    user: HydratedDocument<User>,
    meta: { userAgent?: string; ip?: string },
  ) {
    const payload: JwtPayload = { sub: user._id.toString(), phone: user.phone };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      },
    );

    // Hash only the JWT signature (last segment) to stay within bcrypt's 72-byte limit.
    // Full JWTs for the same user share a long common prefix, making the full-JWT hash collide.
    const sig = refreshToken.split('.')[2];
    const hashedToken = await bcrypt.hash(sig, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.rtModel.create({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      ...meta,
    });

    return { accessToken, refreshToken };
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('+98')) return '0' + phone.slice(3);
    if (phone.startsWith('98')) return '0' + phone.slice(2);
    return phone;
  }

  private maskPhone(phone: string): string {
    return phone.length > 4 ? phone.slice(0, -4) + '****' : '****';
  }
}
