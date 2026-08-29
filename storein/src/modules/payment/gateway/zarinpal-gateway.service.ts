import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayCreateResult,
  GatewayVerifyResult,
} from './payment-gateway.abstract';
import { SettingsService } from '../../settings/settings.service';

/** Shape of ZarinPal's `POST .../request.json` response body */
interface ZarinpalCreateResponse {
  data?: {
    code: number;
    authority: string;
    fee?: number;
  };
  errors?: {
    message?: string;
  };
}

/** Shape of ZarinPal's `POST .../verify.json` response body */
interface ZarinpalVerifyResponse {
  data?: {
    code: number;
    ref_id?: number | string;
    card_pan?: string;
  };
  errors?: {
    message?: string;
  };
}

/** ZarinPal returns code 100 (success) or 101 (already processed — idempotent OK) */
const isOk = (code: number | undefined) => code === 100 || code === 101;

@Injectable()
export class ZarinpalGateway extends PaymentGateway {
  private readonly logger = new Logger(ZarinpalGateway.name);

  constructor(private readonly settingsService: SettingsService) {
    super();
  }

  // ── Config helpers (DB-first, env fallback) ───────────────────────────────

  private async merchantId(): Promise<string> {
    try {
      const s = await this.settingsService.findSettings();
      return (
        s.payment?.zarinpalMerchantId ||
        (process.env.ZARINPAL_MERCHANT_ID ?? '')
      );
    } catch {
      return process.env.ZARINPAL_MERCHANT_ID ?? '';
    }
  }

  private async isSandbox(): Promise<boolean> {
    try {
      const s = await this.settingsService.findSettings();
      // undefined → treat as true (sandbox by default)
      return s.payment?.zarinpalSandbox !== false;
    } catch {
      return true;
    }
  }

  private baseUrl(sandbox: boolean) {
    return sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';
  }

  private startPayUrl(sandbox: boolean) {
    return sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  // ── create ────────────────────────────────────────────────────────────────

  async create(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<GatewayCreateResult> {
    const [mid, sandbox] = await Promise.all([
      this.merchantId(),
      this.isSandbox(),
    ]);
    const amountRials = amount * 10; // تومان → ریال

    this.logger.debug(
      `[ZARINPAL] create request | sandbox: ${sandbox} | amount: ${amount} (${amountRials} rials)`,
    );

    const res = await fetch(`${this.baseUrl(sandbox)}/request.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: mid,
        amount: amountRials,
        description,
        callback_url: callbackUrl,
      }),
    });

    const json = (await res.json()) as ZarinpalCreateResponse;
    const code = json.data?.code;

    if (!isOk(code)) {
      const msg = json.errors?.message ?? `ZarinPal error code: ${code}`;
      this.logger.error(
        `[ZARINPAL] create failed | sandbox: ${sandbox} | code: ${code} | http: ${res.status} | ${msg}`,
      );
      throw new Error(msg);
    }

    const authority = json.data!.authority;
    const gatewayUrl = `${this.startPayUrl(sandbox)}/${authority}`;

    this.logger.log(
      `💳 [ZARINPAL] payment created | sandbox: ${sandbox} | authority: ${authority} | amount: ${amount}`,
    );

    return { authority, gatewayUrl };
  }

  // ── verify ────────────────────────────────────────────────────────────────

  async verify(
    authority: string,
    amount: number,
  ): Promise<GatewayVerifyResult> {
    const [mid, sandbox] = await Promise.all([
      this.merchantId(),
      this.isSandbox(),
    ]);
    const amountRials = amount * 10; // تومان → ریال

    this.logger.debug(
      `[ZARINPAL] verify request | sandbox: ${sandbox} | authority: ${authority}`,
    );

    const res = await fetch(`${this.baseUrl(sandbox)}/verify.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: mid,
        amount: amountRials,
        authority,
      }),
    });

    const json = (await res.json()) as ZarinpalVerifyResponse;
    const code = json.data?.code;

    if (!isOk(code)) {
      const msg = json.errors?.message ?? `ZarinPal verify error code: ${code}`;
      this.logger.warn(
        `[ZARINPAL] verify failed | sandbox: ${sandbox} | authority: ${authority} | code: ${code} | ${msg}`,
      );
      return { success: false, message: msg };
    }

    const refId = json.data!.ref_id?.toString() ?? '';
    const cardPan = json.data!.card_pan ?? '';

    this.logger.log(
      `✅ [ZARINPAL] payment verified | sandbox: ${sandbox} | authority: ${authority} | refId: ${refId} | card: ${cardPan}`,
    );

    return { success: true, refId };
  }
}
