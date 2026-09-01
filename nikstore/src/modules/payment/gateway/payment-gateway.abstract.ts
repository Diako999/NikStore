export interface GatewayCreateResult {
  authority: string;
  gatewayUrl: string;
}

export interface GatewayVerifyResult {
  success: boolean;
  refId?: string;
  message?: string;
}

export abstract class PaymentGateway {
  abstract create(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<GatewayCreateResult>;
  abstract verify(
    authority: string,
    amount: number,
  ): Promise<GatewayVerifyResult>;
}
