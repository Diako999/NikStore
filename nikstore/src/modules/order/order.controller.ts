import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';
import { OrderStatus, PaymentStatus } from './entities/order.schema';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  CreateGuestOrderDto,
  GuestLookupDto,
} from './dto/create-guest-order.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateOrderDto) {
    return this.orderService.createFromCart(uid(user), dto);
  }

  // ── Guest checkout (no account) ──────────────────────────────
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('guest')
  createGuest(@Body() dto: CreateGuestOrderDto) {
    return this.orderService.createGuestOrder(dto);
  }

  // POST (not GET) so the secret token never lands in URLs / access logs.
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('guest/lookup')
  lookupGuest(@Body() dto: GuestLookupDto) {
    return this.orderService.findGuestOrder(dto.orderId, dto.token);
  }

  @Get('my')
  findMyOrders(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.findMyOrders(uid(user), +page, +limit, status);
  }

  @Get('my/:id')
  findMyOrderById(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.orderService.findMyOrderById(uid(user), id);
  }

  @Patch('my/:id/cancel')
  cancelMyOrder(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.orderService.cancelMyOrder(uid(user), id);
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  adminFindAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.adminFindAll(+page, +limit, {
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
    });
  }

  @UseGuards(AdminGuard)
  @Get('admin/:id')
  adminFindById(@Param('id') id: string) {
    return this.orderService.adminFindById(id);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/payment')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(id, dto);
  }
}
