import { ZarinpalGateway } from './zarinpal-gateway.service';
import { SettingsService } from '../../settings/settings.service';

// ── helpers ────────────────────────────────────────────────────────────────

const MERCHANT = 'test-merchant-id';
const AUTHORITY = 'A00000000000000000000000000000';

/** Build a minimal SettingsService mock */
function makeSettings(
  overrides: Partial<{
    gateway: string;
    merchantId: string;
    sandbox: boolean;
  }> = {},
) {
  return {
    findSettings: jest.fn().mockResolvedValue({
      payment: {
        gateway: overrides.gateway ?? 'zarinpal',
        zarinpalMerchantId: overrides.merchantId ?? MERCHANT,
        zarinpalSandbox: overrides.sandbox ?? true,
      },
    }),
  };
}

/** Minimal fetch mock */
function mockFetch(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

function zarinpalSuccessCreate() {
  return {
    data: { code: 100, message: 'Success', authority: AUTHORITY, fee: 0 },
    errors: [],
  };
}

function zarinpalSuccessVerify(refId = '12345678') {
  return {
    data: { code: 100, ref_id: refId, card_pan: '0000-0000-0000-0000' },
    errors: [],
  };
}

function zarinpalError(code = 41, message = 'Invalid merchant') {
  return {
    data: { code },
    errors: { message },
  };
}

// ── suite ─────────────────────────────────────────────────────────────────

describe('ZarinpalGateway', () => {
  let gateway: ZarinpalGateway;

  beforeEach(() => {
    gateway = new ZarinpalGateway(makeSettings() as unknown as SettingsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('returns authority and sandbox gateway URL on success', async () => {
      global.fetch = mockFetch(zarinpalSuccessCreate());

      const result = await gateway.create(
        100_000,
        'پرداخت تست',
        'http://localhost/callback',
      );

      expect(result.authority).toBe(AUTHORITY);
      expect(result.gatewayUrl).toBe(
        `https://sandbox.zarinpal.com/pg/StartPay/${AUTHORITY}`,
      );
    });

    it('uses production URLs when zarinpalSandbox is false', async () => {
      gateway = new ZarinpalGateway(
        makeSettings({ sandbox: false }) as unknown as SettingsService,
      );
      global.fetch = mockFetch(zarinpalSuccessCreate());

      const result = await gateway.create(10_000, 'تست', 'http://cb');

      expect(result.gatewayUrl).toContain('www.zarinpal.com');

      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
      expect(url).toContain('api.zarinpal.com');
    });

    it('converts amount from tomans to rials (× 10) in request body', async () => {
      global.fetch = mockFetch(zarinpalSuccessCreate());

      await gateway.create(50_000, 'تست', 'http://cb');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit,
      ];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.amount).toBe(500_000); // 50_000 × 10
    });

    it('sends merchantId from settings, description, and callback_url in request body', async () => {
      global.fetch = mockFetch(zarinpalSuccessCreate());

      await gateway.create(10_000, 'خرید عینک', 'http://front/payment/result');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit,
      ];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.merchant_id).toBe(MERCHANT);
      expect(body.description).toBe('خرید عینک');
      expect(body.callback_url).toBe('http://front/payment/result');
    });

    it('POSTs to the correct sandbox endpoint', async () => {
      global.fetch = mockFetch(zarinpalSuccessCreate());

      await gateway.create(1_000, 'تست', 'http://cb');

      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
      expect(url).toBe(
        'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      );
    });

    it('accepts code 101 (already created / idempotent) as success', async () => {
      global.fetch = mockFetch({
        data: { code: 101, authority: AUTHORITY },
        errors: [],
      });

      const result = await gateway.create(1_000, 'تست', 'http://cb');
      expect(result.authority).toBe(AUTHORITY);
    });

    it('throws when ZarinPal returns a non-100/101 error code', async () => {
      global.fetch = mockFetch(zarinpalError(41, 'Invalid merchant'));

      await expect(gateway.create(1_000, 'تست', 'http://cb')).rejects.toThrow(
        'Invalid merchant',
      );
    });

    it('falls back to process.env when settings service throws', async () => {
      const failingSettings = {
        findSettings: jest.fn().mockRejectedValue(new Error('DB down')),
      };
      gateway = new ZarinpalGateway(
        failingSettings as unknown as SettingsService,
      );

      process.env.ZARINPAL_MERCHANT_ID = 'env-fallback-id';
      global.fetch = mockFetch(zarinpalSuccessCreate());

      await gateway.create(1_000, 'تست', 'http://cb');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit,
      ];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.merchant_id).toBe('env-fallback-id');

      delete process.env.ZARINPAL_MERCHANT_ID;
    });
  });

  // ── verify ───────────────────────────────────────────────────────────────

  describe('verify()', () => {
    it('returns success true and ref_id on successful verification', async () => {
      global.fetch = mockFetch(zarinpalSuccessVerify('87654321'));

      const result = await gateway.verify(AUTHORITY, 100_000);

      expect(result.success).toBe(true);
      expect(result.refId).toBe('87654321');
    });

    it('converts amount from tomans to rials (× 10) in verify body', async () => {
      global.fetch = mockFetch(zarinpalSuccessVerify());

      await gateway.verify(AUTHORITY, 75_000);

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit,
      ];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.amount).toBe(750_000); // 75_000 × 10
    });

    it('accepts code 101 (already verified) as success', async () => {
      global.fetch = mockFetch({
        data: { code: 101, ref_id: '99999999' },
        errors: [],
      });

      const result = await gateway.verify(AUTHORITY, 1_000);
      expect(result.success).toBe(true);
      expect(result.refId).toBe('99999999');
    });

    it('returns success false when ZarinPal returns error code', async () => {
      global.fetch = mockFetch(zarinpalError(-54, 'Invalid authority'));

      const result = await gateway.verify('BAD-AUTH', 1_000);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid authority');
    });

    it('POSTs to the correct sandbox verify endpoint', async () => {
      global.fetch = mockFetch(zarinpalSuccessVerify());

      await gateway.verify(AUTHORITY, 1_000);

      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
      expect(url).toBe(
        'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      );
    });
  });
});
