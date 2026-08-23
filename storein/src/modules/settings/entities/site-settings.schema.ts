import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;

class SocialLinks {
  @Prop({ default: '' }) instagram: string;
  @Prop({ default: '' }) telegram:  string;
  @Prop({ default: '' }) twitter:   string;
  @Prop({ default: '' }) whatsapp:  string;
  @Prop({ default: '' }) linkedin:  string;
  @Prop({ default: '' }) youtube:   string;
}

class ThemeSettings {
  @Prop({ default: 'carbon-lime' }) preset:       string;
  @Prop({ default: '#C6FF34' })     primaryColor: string;
  @Prop({ default: 'light', enum: ['light', 'dark', 'system'] }) defaultMode: string;

  // Section colors — empty string means "use default"
  @Prop({ default: '' }) navbarBg:         string;
  @Prop({ default: '' }) navbarBorder:     string;
  @Prop({ default: '' }) footerBg:         string;
  @Prop({ default: '' }) footerText:       string;
  @Prop({ default: '' }) sidebarBg:        string;
  @Prop({ default: '' }) pageBg:           string;
  // Dark mode overrides
  @Prop({ default: '' }) navbarBgDark:     string;
  @Prop({ default: '' }) navbarBorderDark: string;
  @Prop({ default: '' }) footerBgDark:     string;
  @Prop({ default: '' }) footerTextDark:   string;
  @Prop({ default: '' }) sidebarBgDark:    string;
  @Prop({ default: '' }) pageBgDark:       string;
}

class FooterLink {
  @Prop({ default: '' }) label: string;
  @Prop({ default: '' }) url:   string;
}

class SmsSettings {
  /** ارائه‌دهنده: mock (تستی) یا kavenegar */
  @Prop({ default: 'mock', enum: ['mock', 'kavenegar'] })
  provider: string;

  /** API Key کاوه‌نگار */
  @Prop({ default: '' })
  kavenegarApiKey: string;

  /** شماره فرستنده (خط اختصاصی) */
  @Prop({ default: '' })
  kavenegarSender: string;

  /** نام قالب OTP در پنل کاوه‌نگار */
  @Prop({ default: 'nikstore-otp' })
  kavenegarOtpTemplate: string;
}

class AnnouncementBar {
  @Prop({ default: false }) isActive:  boolean;
  @Prop({ default: '' })    text:      string;
  @Prop({ default: '#C6FF34' }) bgColor:   string;
  @Prop({ default: '#171717' }) textColor: string;
  @Prop({ default: '' })    link:      string;
}

class TrustItem {
  @Prop({ default: '' }) icon:     string;
  @Prop({ default: '' }) title:    string;
  @Prop({ default: '' }) subtitle: string;
  @Prop({ default: '#EBF4FF' }) bgColor: string;
}

class PaymentSettings {
  /** درگاه فعال: mock (تستی داخلی) یا zarinpal */
  @Prop({ default: 'mock', enum: ['mock', 'zarinpal'] })
  gateway: string;

  /** کد پذیرنده زرین‌پال */
  @Prop({ default: '' })
  zarinpalMerchantId: string;

  /** true = sandbox (تست) | false = production */
  @Prop({ default: true })
  zarinpalSandbox: boolean;
}

@Schema({ timestamps: true })
export class SiteSettings {
  // Singleton guard — only one document with key 'default'
  @Prop({ default: 'default', unique: true })
  _key: string;

  // ── General ──────────────────────────────────────────────
  @Prop({ default: 'نیک' })
  siteName: string;

  @Prop({ default: 'بوتیک پوشاک نیک' })
  tagline: string;

  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: '' })
  faviconUrl: string;

  // ── SEO ───────────────────────────────────────────────────
  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  keywords: string;

  @Prop({ default: '' })
  ogImage: string;

  // ── Social ────────────────────────────────────────────────
  @Prop({ type: SocialLinks, default: () => ({}) })
  social: SocialLinks;

  // ── Footer ────────────────────────────────────────────────
  @Prop({ default: '' })
  footerTagline: string;

  @Prop({ default: 'تمامی حقوق برای نیک محفوظ است' })
  footerCopyright: string;

  @Prop({ type: [{ _id: false, label: String, url: String }], default: [] })
  footerLinks: FooterLink[];

  // ── Theme ─────────────────────────────────────────────────
  @Prop({ type: ThemeSettings, default: () => ({ preset: 'carbon-lime', primaryColor: '#C6FF34' }) })
  theme: ThemeSettings;

  // ── Payment ───────────────────────────────────────────────
  @Prop({ type: PaymentSettings, default: () => ({ gateway: 'mock', zarinpalSandbox: true }) })
  payment: PaymentSettings;

  // ── SMS ───────────────────────────────────────────────────
  @Prop({ type: SmsSettings, default: () => ({ provider: 'mock', kavenegarOtpTemplate: 'nikstore-otp' }) })
  sms: SmsSettings;

  // ── Trust badges ──────────────────────────────────────────
  @Prop({
    type: [{ _id: false, icon: String, title: String, subtitle: String, bgColor: String }],
    default: () => [
      { icon: '🔒', title: 'پرداخت امن',    subtitle: 'درگاه پرداخت معتبر و رمزنگاری شده',      bgColor: '#EBF4FF' },
      { icon: '↩️', title: 'ضمانت ۷ روزه', subtitle: 'بازگشت کالا در صورت عدم رضایت',          bgColor: '#F0FDF4' },
      { icon: '✅', title: 'اصالت کالا',    subtitle: 'تمام محصولات دارای گارانتی اصالت',       bgColor: '#FFFBEB' },
      { icon: '🚚', title: 'ارسال سریع',   subtitle: 'ارسال به سراسر کشور در کمترین زمان',    bgColor: '#FFF1F2' },
    ],
  })
  trustItems: TrustItem[];

  // ── Announcement Bar ──────────────────────────────────────
  @Prop({
    type: { _id: false, isActive: Boolean, text: String, bgColor: String, textColor: String, link: String },
    default: () => ({ isActive: false, text: '', bgColor: '#C6FF34', textColor: '#171717', link: '' }),
  })
  announcementBar: AnnouncementBar;

  // ── Contact ───────────────────────────────────────────────
  @Prop({ default: '' })
  phone: string;

  @Prop({ type: [String], default: [] })
  mobiles: string[];

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ type: [{ _id: false, text: String, mapsUrl: String }], default: [] })
  addresses: { text: string; mapsUrl: string }[];
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
