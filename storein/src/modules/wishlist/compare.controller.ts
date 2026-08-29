import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => u._id.toString();

@UseGuards(JwtAuthGuard)
@Controller('compare')
export class CompareController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getCompare(@CurrentUser() user: UserDocument) {
    return this.wishlistService.getCompare(uid(user));
  }

  @Post(':productId')
  add(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.addToCompare(uid(user), productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromCompare(uid(user), productId);
  }

  @Delete()
  clear(@CurrentUser() user: UserDocument) {
    return this.wishlistService.clearCompare(uid(user));
  }
}
