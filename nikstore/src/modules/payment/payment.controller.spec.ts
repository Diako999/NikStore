import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentMethod } from './entities/transaction.schema';
import type { UserDocument } from '../user/entities/user.schema';

const mockService = {
  getBalance: jest.fn(),
  getTransactions: jest.fn(),
  topupWallet: jest.fn(),
  payOrder: jest.fn(),
  verifyPayment: jest.fn(),
};

const userId = new Types.ObjectId().toString();
const mockUser = {
  _id: { toString: () => userId },
} as unknown as UserDocument;

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: mockService }],
    }).compile();

    controller = module.get(PaymentController);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('returns wallet balance', async () => {
      mockService.getBalance.mockResolvedValue({ balance: 50_000_000 });
      const result = await controller.getBalance(mockUser);
      expect(result.balance).toBe(50_000_000);
      expect(mockService.getBalance).toHaveBeenCalledWith(userId);
    });
  });

  describe('getTransactions', () => {
    it('returns paginated transactions', async () => {
      mockService.getTransactions.mockResolvedValue({
        transactions: [],
        total: 0,
      });
      const result = await controller.getTransactions(mockUser, 1, 20);
      expect(mockService.getTransactions).toHaveBeenCalledWith(userId, 1, 20);
      expect(result.total).toBe(0);
    });
  });

  describe('topupWallet', () => {
    it('returns gatewayUrl and authority', async () => {
      mockService.topupWallet.mockResolvedValue({
        gatewayUrl: 'http://gw/pay',
        authority: 'AUTH-001',
      });
      const result = await controller.topupWallet(mockUser, {
        amount: 50_000_000,
      });
      expect(result.authority).toBe('AUTH-001');
      expect(mockService.topupWallet).toHaveBeenCalledWith(userId, {
        amount: 50_000_000,
      });
    });
  });

  describe('payOrder', () => {
    const orderId = new Types.ObjectId().toString();

    it('wallet pay: returns success true', async () => {
      mockService.payOrder.mockResolvedValue({ success: true });
      const result = await controller.payOrder(mockUser, {
        orderId,
        method: PaymentMethod.WALLET,
      });
      expect(result.success).toBe(true);
    });

    it('gateway pay: returns gatewayUrl', async () => {
      mockService.payOrder.mockResolvedValue({
        success: false,
        gatewayUrl: 'http://gw',
        authority: 'AUTH-002',
      });
      const result = await controller.payOrder(mockUser, {
        orderId,
        method: PaymentMethod.GATEWAY,
      });
      expect(result.gatewayUrl).toBe('http://gw');
    });

    it('propagates BadRequestException when order not payable', async () => {
      mockService.payOrder.mockRejectedValue(new BadRequestException());
      await expect(
        controller.payOrder(mockUser, {
          orderId,
          method: PaymentMethod.WALLET,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates NotFoundException when order not found', async () => {
      mockService.payOrder.mockRejectedValue(new NotFoundException());
      await expect(
        controller.payOrder(mockUser, {
          orderId,
          method: PaymentMethod.WALLET,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyPayment', () => {
    it('returns success on valid verify', async () => {
      mockService.verifyPayment.mockResolvedValue({
        success: true,
        refId: 'REF-001',
        message: 'پرداخت موفق',
      });
      const result = await controller.verifyPayment({
        authority: 'AUTH-001',
        status: 'OK',
      });
      expect(result.success).toBe(true);
      expect(result.refId).toBe('REF-001');
    });

    it('returns failure when user cancelled', async () => {
      mockService.verifyPayment.mockResolvedValue({
        success: false,
        message: 'پرداخت توسط کاربر لغو شد',
      });
      const result = await controller.verifyPayment({
        authority: 'AUTH-001',
        status: 'NOK',
      });
      expect(result.success).toBe(false);
    });

    it('propagates NotFoundException for unknown authority', async () => {
      mockService.verifyPayment.mockRejectedValue(new NotFoundException());
      await expect(
        controller.verifyPayment({ authority: 'INVALID', status: 'OK' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
