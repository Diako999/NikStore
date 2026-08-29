import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // ── Public ───────────────────────────────────────────────
  @Public()
  @Get()
  findActive() {
    return this.bannerService.findActive();
  }

  // NOTE: static segments ('promo', 'admin/all', 'reorder') MUST be declared
  // before dynamic ':id' params or NestJS will treat them as param values.
  @Public()
  @Get('promo')
  findActivePromo() {
    return this.bannerService.findActivePromo();
  }

  // ── Admin ────────────────────────────────────────────────
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.bannerService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorder(@Body() dto: ReorderBannersDto) {
    return this.bannerService.reorder(dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, AdminGuard)
  toggleActive(@Param('id') id: string) {
    return this.bannerService.toggleActive(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
