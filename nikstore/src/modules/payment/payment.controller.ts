import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PayOrderDto } from './dto/pay-order.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  getBalance(@CurrentUser() user: UserDocument) {
    return this.paymentService.getBalance(uid(user));
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentService.getTransactions(uid(user), +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('wallet/topup')
  topupWallet(@CurrentUser() user: UserDocument, @Body() dto: TopupWalletDto) {
    return this.paymentService.topupWallet(uid(user), dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('pay')
  payOrder(@CurrentUser() user: UserDocument, @Body() dto: PayOrderDto) {
    return this.paymentService.payOrder(uid(user), dto);
  }

  @Public()
  @Get('verify')
  verifyPayment(@Query() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto.authority, dto.status);
  }
}
