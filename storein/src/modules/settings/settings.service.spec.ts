import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { SiteSettings } from './entities/site-settings.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';

// ── Shared fixtures ────────────────────────────────────────────────────────
const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const DEFAULT_TRUST_ITEMS = [
  {
    icon: '🔒',
    title: 'پرداخت امن',
    subtitle: 'درگاه پرداخت معتبر و رمزنگاری شده',
    bgColor: '#EBF4FF',
  },
  {
    icon: '↩️',
    title: 'ضمانت ۷ روزه',
    subtitle: 'بازگشت کالا در صورت عدم رضایت',
    bgColor: '#F0FDF4',
  },
  {
    icon: '✅',
    title: 'اصالت کالا',
    subtitle: 'تمام محصولات دارای گارانتی اصالت',
    bgColor: '#FFFBEB',
  },
  {
    icon: '🚚',
    title: 'ارسال سریع',
    subtitle: 'ارسال به سراسر کشور در کمترین زمان',
    bgColor: '#FFF1F2',
  },
];

const defaultDoc = {
  siteName: 'استورین',
  tagline: 'فروشگاه تخصصی پوشاک',
  logoUrl: '',
  faviconUrl: '',
  description: '',
  keywords: '',
  ogImage: '',
  social: {
    instagram: '',
    telegram: '',
    twitter: '',
    whatsapp: '',
    linkedin: '',
    youtube: '',
  },
  footerTagline: '',
  footerCopyright: 'تمامی حقوق برای استورین محفوظ است',
  footerLinks: [],
  phone: '',
  email: '',
  address: '',
  trustItems: DEFAULT_TRUST_ITEMS,
};

/** Simulates Mongoose chainable query: .select().lean() */
const chainable = (value: unknown) => {
  const q = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
  return q;
};

interface MockSettingsModel {
  findOne: jest.Mock;
  create: jest.Mock;
  findOneAndUpdate: jest.Mock;
}

// ── Suite ──────────────────────────────────────────────────────────────────
describe('SettingsService', () => {
  let service: SettingsService;
  let model: MockSettingsModel;

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue(defaultDoc),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getModelToken(SiteSettings.name), useValue: model },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(SettingsService);
    jest.clearAllMocks();
    mockLogger.setContext.mockReturnThis();
  });

  // ── findSettings ──────────────────────────────────────────────────────
  describe('findSettings', () => {
    it('queries by singleton key', async () => {
      model.findOne.mockReturnValue(chainable(defaultDoc));

      await service.findSettings();

      expect(model.findOne).toHaveBeenCalledWith({ _key: 'default' });
    });

    it('strips __v and _key from the projection', async () => {
      const q = chainable(defaultDoc);
      model.findOne.mockReturnValue(q);

      await service.findSettings();

      expect(q.select).toHaveBeenCalledWith('-__v -_key');
    });

    it('returns the existing document without calling create', async () => {
      model.findOne.mockReturnValue(chainable(defaultDoc));

      const result = await service.findSettings();

      expect(result).toEqual(defaultDoc);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('does NOT log when the document already exists', async () => {
      model.findOne.mockReturnValue(chainable(defaultDoc));

      await service.findSettings();

      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('returns trustItems from the existing document', async () => {
      model.findOne.mockReturnValue(chainable(defaultDoc));

      const result = await service.findSettings();

      expect(result.trustItems).toEqual(DEFAULT_TRUST_ITEMS);
    });

    it('calls create with singleton key when no document exists', async () => {
      model.findOne.mockReturnValue(chainable(null));

      await service.findSettings();

      expect(model.create).toHaveBeenCalledWith({ _key: 'default' });
    });

    it('logs a bootstrap message on first-run initialization', async () => {
      model.findOne.mockReturnValue(chainable(null));

      await service.findSettings();

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings not found — bootstrapping with defaults',
      );
    });
  });

  // ── updateSettings ────────────────────────────────────────────────────
  describe('updateSettings', () => {
    it('uses findOneAndUpdate with upsert on the singleton key', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({ siteName: 'استورین جدید' });

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _key: 'default' },
        { $set: { siteName: 'استورین جدید' } },
        { new: true, upsert: true, runValidators: true },
      );
    });

    it('strips __v and _key from the result projection', async () => {
      const q = chainable(defaultDoc);
      model.findOneAndUpdate.mockReturnValue(q);

      await service.updateSettings({ siteName: 'تست' });

      expect(q.select).toHaveBeenCalledWith('-__v -_key');
    });

    it('returns the updated document', async () => {
      const updated = { ...defaultDoc, siteName: 'نام جدید' };
      model.findOneAndUpdate.mockReturnValue(chainable(updated));

      const result = await service.updateSettings({ siteName: 'نام جدید' });

      expect(result.siteName).toBe('نام جدید');
    });

    it('logs updated field names', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({ siteName: 'تست', description: 'توضیح' });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({
          fields: expect.arrayContaining([
            'siteName',
            'description',
          ]) as string[],
        }),
      );
    });

    it('logs hasSocial: true when social block is present', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({
        social: { instagram: 'https://instagram.com/storein' },
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ hasSocial: true }),
      );
    });

    it('logs hasSocial: false when social block is absent', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({ siteName: 'تست' });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ hasSocial: false }),
      );
    });

    it('logs correct footerLinksCount', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));
      const dto = {
        footerLinks: [
          { label: 'درباره ما', url: '/about' },
          { label: 'تماس', url: '/contact' },
        ],
      };

      await service.updateSettings(dto);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ footerLinksCount: 2 }),
      );
    });

    it('logs footerLinksCount: 0 when footerLinks is absent', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({ siteName: 'تست' });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ footerLinksCount: 0 }),
      );
    });

    it('logs trustItemsCount when trustItems are included in DTO', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));
      const dto = { trustItems: DEFAULT_TRUST_ITEMS };

      await service.updateSettings(dto);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ trustItemsCount: 4 }),
      );
    });

    it('logs trustItemsCount: 0 when trustItems is absent', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await service.updateSettings({ siteName: 'تست' });

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ trustItemsCount: 0 }),
      );
    });

    it('passes trustItems through $set unchanged', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));
      const dto = {
        trustItems: [
          {
            icon: '🎁',
            title: 'هدیه رایگان',
            subtitle: 'با هر خرید بالای ۵۰۰ هزار تومان',
            bgColor: '#FDF4FF',
          },
        ],
      };

      await service.updateSettings(dto);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _key: 'default' },
        { $set: dto },
        expect.any(Object),
      );
    });

    it('handles empty trustItems array without throwing', async () => {
      model.findOneAndUpdate.mockReturnValue(
        chainable({ ...defaultDoc, trustItems: [] }),
      );

      await expect(
        service.updateSettings({ trustItems: [] }),
      ).resolves.toBeDefined();

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Site settings updated',
        expect.objectContaining({ trustItemsCount: 0 }),
      );
    });

    it('handles empty DTO without throwing', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));

      await expect(service.updateSettings({})).resolves.toBeDefined();
    });

    it('passes full DTO through $set unchanged', async () => {
      model.findOneAndUpdate.mockReturnValue(chainable(defaultDoc));
      const dto = {
        siteName: 'کامل',
        tagline: 'شعار',
        description: 'توضیح',
        keywords: 'کلید',
        phone: '021-111',
        email: 'a@b.com',
        address: 'تهران',
        social: { telegram: 'https://t.me/x' },
        footerLinks: [{ label: 'صفحه', url: '/page' }],
      };

      await service.updateSettings(dto);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _key: 'default' },
        { $set: dto },
        expect.any(Object),
      );
    });
  });
});
