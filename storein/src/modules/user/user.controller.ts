import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from './entities/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ── Profile ───────────────────────────────────────────────────
  @Get('me')
  getProfile(@CurrentUser() user: UserDocument) {
    return this.userService.getProfile((user._id as any).toString());
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: UserDocument, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile((user._id as any).toString(), dto);
  }

  // ── Addresses ─────────────────────────────────────────────────
  @Post('me/addresses')
  addAddress(@CurrentUser() user: UserDocument, @Body() dto: CreateAddressDto) {
    return this.userService.addAddress((user._id as any).toString(), dto);
  }

  @Patch('me/addresses/:addressId')
  updateAddress(
    @CurrentUser() user: UserDocument,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userService.updateAddress((user._id as any).toString(), addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  removeAddress(@CurrentUser() user: UserDocument, @Param('addressId') addressId: string) {
    return this.userService.removeAddress((user._id as any).toString(), addressId);
  }

  @Patch('me/addresses/:addressId/default')
  setDefault(@CurrentUser() user: UserDocument, @Param('addressId') addressId: string) {
    return this.userService.setDefaultAddress((user._id as any).toString(), addressId);
  }

  // ── Admin ─────────────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('page')      page      = 1,
    @Query('limit')     limit     = 20,
    @Query('search')    search?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('role')      role?: string,
  ) {
    return this.userService.findAll(+page, +limit, search, isBlocked, role);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(AdminGuard)
  @Get(':id/reviews')
  getUserReviews(
    @Param('id') id: string,
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.getUserReviews(id, +page, +limit);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/block')
  block(@Param('id') id: string) {
    return this.userService.toggleBlock(id);
  }
}
