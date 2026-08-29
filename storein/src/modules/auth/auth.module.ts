import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { SmsService } from './sms/sms.service.abstract';
import { MockSmsService } from './sms/mock-sms.service';
import { KavenegarSmsService } from './sms/kavenegar-sms.service';
import { DynamicSmsService } from './sms/dynamic-sms.service';
import { UserModule } from '../user/user.module';
import { SettingsModule } from '../settings/settings.module';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './entities/refresh-token.schema';

@Module({
  imports: [
    UserModule,
    SettingsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('jwt.secret')!,
        signOptions: { expiresIn: cs.get('jwt.expiresIn') },
      }),
    }),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    MockSmsService,
    KavenegarSmsService,
    DynamicSmsService,
    { provide: SmsService, useExisting: DynamicSmsService },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
