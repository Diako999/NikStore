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
import { OrderStatus } from './entities/order.schema';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateOrderDto) {
    return this.orderService.createFromCart(uid(user), dto);
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
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.adminFindAll(+page, +limit, {
      status,
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
}
