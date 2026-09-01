import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './entities/wallet.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from './entities/transaction.schema';
import { User, UserDocument } from '../user/entities/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentGateway } from './gateway/payment-gateway.abstract';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '../order/entities/order.schema';
import {
  EVENTS,
  PaymentSuccessEvent,
} from '../notification/notification.listener';
import { PayOrderDto } from './dto/pay-order.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class PaymentService {
  private readonly defaultCallback: string;

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private gateway: PaymentGateway,
    private orderService: OrderService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('PaymentService');
    this.defaultCallback = this.configService.get<string>(
      'app.paymentCallbackUrl',
    )!;
  }

  // ── Wallet ────────────────────────────────────────────────────
  async getOrCreateWallet(userId: string): Promise<WalletDocument> {
    const oid = new Types.ObjectId(userId);
    const wallet = await this.walletModel.findOneAndUpdate(
      { userId: oid },
      { $setOnInsert: { userId: oid, balance: 0, isActive: true } },
      { upsert: true, new: true },
    );
    return wallet;
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.getOrCreateWallet(userId);
    return { balance: wallet.balance };
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: TransactionDocument[]; total: number }> {
    const filter = { userId: new Types.ObjectId(userId) };
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.txModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<TransactionDocument[]>(),
      this.txModel.countDocuments(filter),
    ]);
    return { transactions, total };
  }

  // ── Top-up Wallet via Gateway ─────────────────────────────────
  async topupWallet(
    userId: string,
    dto: TopupWalletDto,
  ): Promise<{
    gatewayUrl: string;
    authority: string;
  }> {
    const callbackUrl = dto.callbackUrl ?? this.defaultCallback;
    const { authority, gatewayUrl } = await this.gateway.create(
      dto.amount,
      'شارژ کیف پول',
      callbackUrl,
    );

    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      type: TransactionType.CREDIT,
      amount: dto.amount,
      method: PaymentMethod.GATEWAY,
      status: TransactionStatus.PENDING,
      description: 'شارژ کیف پول',
      authority,
      gatewayUrl,
      walletAmount: 0,
      gatewayAmount: dto.amount,
    });

    return { gatewayUrl, authority };
  }

  // ── Pay Order ─────────────────────────────────────────────────
  async payOrder(
    userId: string,
    dto: PayOrderDto,
  ): Promise<{
    success: boolean;
    gatewayUrl?: string;
    authority?: string;
  }> {
    const order = await this.orderService.findMyOrderById(userId, dto.orderId);

    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('این سفارش قابل پرداخت نیست');

    this.logger.log('Payment initiated', {
      orderId: dto.orderId,
      userId,
      method: dto.method,
      amount: order.total,
    });

    const callbackUrl = dto.callbackUrl ?? this.defaultCallback;

    // ── Wallet only ──────────────────────────────────────────────
    if (dto.method === PaymentMethod.WALLET) {
      await this.debitWallet(userId, order.total, dto.orderId, 'پرداخت سفارش');
      await this.orderService.updateStatus(dto.orderId, {
        status: OrderStatus.CONFIRMED,
      });
      return { success: true };
    }

    // ── Gateway only ─────────────────────────────────────────────
    if (dto.method === PaymentMethod.GATEWAY) {
      const { authority, gatewayUrl } = await this.gateway.create(
        order.total,
        `پرداخت سفارش ${order.orderNumber}`,
        callbackUrl,
      );

      await this.txModel.create({
        userId: new Types.ObjectId(userId),
        orderId: new Types.ObjectId(dto.orderId),
        type: TransactionType.DEBIT,
        amount: order.total,
        method: PaymentMethod.GATEWAY,
        status: TransactionStatus.PENDING,
        description: `پرداخت سفارش ${order.orderNumber}`,
        authority,
        gatewayUrl,
        walletAmount: 0,
        gatewayAmount: order.total,
      });

      return { success: false, gatewayUrl, authority };
    }

    // ── Mixed (wallet + gateway) ──────────────────────────────────
    if (dto.method === PaymentMethod.MIXED) {
      const walletAmt = dto.walletAmount ?? 0;
      const gatewayAmt = order.total - walletAmt;

      if (walletAmt <= 0 || gatewayAmt <= 0)
        throw new BadRequestException('مبلغ کیف پول یا درگاه معتبر نیست');

      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.balance < walletAmt)
        throw new BadRequestException(
          `موجودی کیف پول کافی نیست. موجودی: ${wallet.balance}`,
        );

      const { authority, gatewayUrl } = await this.gateway.create(
        gatewayAmt,
        `پرداخت سفارش ${order.orderNumber}`,
        callbackUrl,
      );

      await this.txModel.create({
        userId: new Types.ObjectId(userId),
        orderId: new Types.ObjectId(dto.orderId),
        type: TransactionType.DEBIT,
        amount: order.total,
        method: PaymentMethod.MIXED,
        status: TransactionStatus.PENDING,
        description: `پرداخت سفارش ${order.orderNumber}`,
        authority,
        gatewayUrl,
        walletAmount: walletAmt,
        gatewayAmount: gatewayAmt,
      });

      return { success: false, gatewayUrl, authority };
    }

    throw new BadRequestException('روش پرداخت نامعتبر است');
  }

  // ── Verify Gateway Payment ────────────────────────────────────
  async verifyPayment(
    authority: string,
    statusParam: string,
  ): Promise<{
    success: boolean;
    refId?: string;
    message: string;
  }> {
    const tx = await this.txModel.findOne({ authority });
    if (!tx) throw new NotFoundException('تراکنش یافت نشد');

    if (tx.status !== TransactionStatus.PENDING)
      return { success: false, message: 'این تراکنش قبلاً پردازش شده است' };

    if (statusParam !== 'OK') {
      await this.txModel.findByIdAndUpdate(tx._id, {
        status: TransactionStatus.FAILED,
      });
      return { success: false, message: 'پرداخت توسط کاربر لغو شد' };
    }

    const verifyAmount = tx.gatewayAmount || tx.amount;
    const result = await this.gateway.verify(authority, verifyAmount);

    if (!result.success) {
      await this.txModel.findByIdAndUpdate(tx._id, {
        status: TransactionStatus.FAILED,
      });

      this.logger.warn('Payment verification failed', {
        authority,
        txId: tx._id.toString(),
        userId: tx.userId.toString(),
        amount: tx.amount,
        reason: result.message,
      });

      const failedUser = await this.userModel
        .findById(tx.userId)
        .select('phone')
        .lean<UserDocument>();
      if (failedUser) {
        this.eventEmitter.emit(EVENTS.PAYMENT_FAILED, {
          userId: tx.userId.toString(),
          phone: failedUser.phone,
        });
      }

      return {
        success: false,
        message: result.message ?? 'تایید پرداخت ناموفق بود',
      };
    }

    await this.txModel.findByIdAndUpdate(tx._id, {
      status: TransactionStatus.SUCCESS,
      refId: result.refId,
    });

    const successUser = await this.userModel
      .findById(tx.userId)
      .select('phone')
      .lean<UserDocument>();

    // Wallet top-up (no order attached)
    if (!tx.orderId) {
      await this.creditWallet(tx.userId.toString(), tx.amount);

      if (successUser) {
        const event: PaymentSuccessEvent = {
          userId: tx.userId.toString(),
          phone: successUser.phone,
          amount: tx.amount,
          refId: result.refId!,
          isTopup: true,
        };
        this.eventEmitter.emit(EVENTS.PAYMENT_SUCCESS, event);
      }

      return { success: true, refId: result.refId, message: 'کیف پول شارژ شد' };
    }

    // Mixed: debit wallet portion first
    if (tx.method === PaymentMethod.MIXED && tx.walletAmount > 0) {
      await this.debitWallet(
        tx.userId.toString(),
        tx.walletAmount,
        tx.orderId.toString(),
        'پرداخت ترکیبی سفارش — سهم کیف پول',
      );
    }

    await this.orderService.updateStatus(tx.orderId.toString(), {
      status: OrderStatus.CONFIRMED,
    });

    if (successUser) {
      const event: PaymentSuccessEvent = {
        userId: tx.userId.toString(),
        phone: successUser.phone,
        orderId: tx.orderId.toString(),
        amount: tx.amount,
        refId: result.refId!,
        isTopup: false,
      };
      this.eventEmitter.emit(EVENTS.PAYMENT_SUCCESS, event);
    }

    this.logger.log('Payment verified successfully', {
      authority,
      refId: result.refId,
      txId: tx._id.toString(),
      userId: tx.userId.toString(),
      orderId: tx.orderId?.toString(),
      amount: tx.amount,
    });

    return { success: true, refId: result.refId, message: 'پرداخت موفق' };
  }

  // ── Private: atomic wallet ops ────────────────────────────────
  private async debitWallet(
    userId: string,
    amount: number,
    orderId?: string,
    description = 'برداشت از کیف پول',
  ): Promise<void> {
    const updated = await this.walletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), balance: { $gte: amount } },
      { $inc: { balance: -amount } },
    );
    if (!updated)
      throw new BadRequestException(
        'موجودی کیف پول کافی نیست یا کیف پول فعال نیست',
      );

    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      orderId: orderId ? new Types.ObjectId(orderId) : null,
      type: TransactionType.DEBIT,
      amount,
      method: PaymentMethod.WALLET,
      status: TransactionStatus.SUCCESS,
      description,
      walletAmount: amount,
      gatewayAmount: 0,
    });
  }

  private async creditWallet(userId: string, amount: number): Promise<void> {
    await this.walletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { balance: amount } },
      { upsert: true },
    );
  }
}
