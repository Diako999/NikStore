import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsEmail,
  ValidateNested,
  IsArray,
  Matches,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinksDto {
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() telegram?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() youtube?: string;
}

class AddressDto {
  @IsString() @MaxLength(300) text: string;
  @IsOptional() @IsString() @MaxLength(300) mapsUrl?: string;
}

class FooterLinkDto {
  @IsString() @MaxLength(60) label: string;
  @IsString() @MaxLength(200) url: string;
}

const HEX_OR_EMPTY = /^(#[0-9A-Fa-f]{6})?$/;
const HEX_MSG = { message: 'رنگ باید فرمت hex معتبر داشته باشد (#RRGGBB)' };

class SmsSettingsDto {
  @IsOptional()
  @IsIn(['mock', 'kavenegar'])
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  kavenegarApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kavenegarSender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  kavenegarOtpTemplate?: string;
}

class AnnouncementBarDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(200) text?: string;
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'رنگ باید hex باشد' })
  bgColor?: string;
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'رنگ باید hex باشد' })
  textColor?: string;
  @IsOptional() @IsString() @MaxLength(200) link?: string;
}

class TrustItemDto {
  @IsOptional() @IsString() @MaxLength(10) icon?: string;
  @IsOptional() @IsString() @MaxLength(60) title?: string;
  @IsOptional() @IsString() @MaxLength(120) subtitle?: string;
  @IsOptional() @IsString() @MaxLength(20) bgColor?: string;
}

class PaymentSettingsDto {
  @IsOptional()
  @IsIn(['mock', 'zarinpal'])
  gateway?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  zarinpalMerchantId?: string;

  @IsOptional()
  @IsBoolean()
  zarinpalSandbox?: boolean;
}

class ThemeDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  preset?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'رنگ باید فرمت hex معتبر داشته باشد',
  })
  primaryColor?: string;

  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  defaultMode?: string;

  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) navbarBg?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  navbarBorder?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerBg?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) footerText?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) sidebarBg?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) pageBg?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  navbarBgDark?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  navbarBorderDark?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  footerBgDark?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  footerTextDark?: string;
  @IsOptional()
  @IsString()
  @Matches(HEX_OR_EMPTY, HEX_MSG)
  sidebarBgDark?: string;
  @IsOptional() @IsString() @Matches(HEX_OR_EMPTY, HEX_MSG) pageBgDark?: string;
}

export class UpdateSettingsDto {
  // General
  @IsOptional() @IsString() @MaxLength(80) siteName?: string;
  @IsOptional() @IsString() @MaxLength(120) tagline?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() faviconUrl?: string;

  // Homepage hero
  @IsOptional() @IsString() heroImageDark?: string;
  @IsOptional() @IsString() heroImageLight?: string;

  // SEO
  @IsOptional() @IsString() @MaxLength(160) description?: string;
  @IsOptional() @IsString() @MaxLength(250) keywords?: string;
  @IsOptional() @IsString() ogImage?: string;

  // Social
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  social?: SocialLinksDto;

  // Footer
  @IsOptional() @IsString() @MaxLength(120) footerTagline?: string;
  @IsOptional() @IsString() @MaxLength(120) footerCopyright?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  footerLinks?: FooterLinkDto[];

  // Contact
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  mobiles?: string[];
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  // Theme
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeDto)
  theme?: ThemeDto;

  // Payment
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  payment?: PaymentSettingsDto;

  // SMS
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsSettingsDto)
  sms?: SmsSettingsDto;

  // Trust badges
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustItemDto)
  trustItems?: TrustItemDto[];

  // Announcement bar
  @IsOptional()
  @ValidateNested()
  @Type(() => AnnouncementBarDto)
  announcementBar?: AnnouncementBarDto;
}
