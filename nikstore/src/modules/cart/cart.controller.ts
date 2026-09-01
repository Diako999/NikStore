import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: UserDocument) {
    return this.cartService.getCart(uid(user));
  }

  @HttpCode(HttpStatus.OK)
  @Post('items')
  addItem(@CurrentUser() user: UserDocument, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(uid(user), dto);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(uid(user), productId, dto);
  }

  @Delete('items/:productId/:variantId')
  removeItem(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.cartService.removeItem(uid(user), productId, variantId);
  }

  @Delete()
  clearCart(@CurrentUser() user: UserDocument) {
    return this.cartService.clearCart(uid(user));
  }
}
