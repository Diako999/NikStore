import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.wishlistService.getWishlist(uid(user), +page, +limit);
  }

  @Post(':productId')
  toggle(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.toggle(uid(user), productId);
  }

  @Get(':productId/check')
  isInWishlist(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.isInWishlist(uid(user), productId);
  }

  @Delete()
  clearWishlist(@CurrentUser() user: UserDocument) {
    return this.wishlistService.clearWishlist(uid(user));
  }
}
