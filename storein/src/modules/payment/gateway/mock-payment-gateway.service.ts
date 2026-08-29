import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayCreateResult,
  GatewayVerifyResult,
} from './payment-gateway.abstract';

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  create(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<GatewayCreateResult> {
    const authority = `MOCK-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    this.logger.log(
      `💳 [MOCK GATEWAY] Created | amount: ${amount} | authority: ${authority}`,
    );

    return Promise.resolve({
      authority,
      gatewayUrl: `http://localhost:3000/mock-pay?authority=${authority}&callback=${encodeURIComponent(callbackUrl)}`,
    });
  }

  verify(authority: string): Promise<GatewayVerifyResult> {
    const refId = `REF-${Date.now()}`;
    this.logger.log(
      `✅ [MOCK GATEWAY] Verified | authority: ${authority} | refId: ${refId}`,
    );
    return Promise.resolve({ success: true, refId });
  }
}
