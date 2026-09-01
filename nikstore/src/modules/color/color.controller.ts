import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  // Public — storefront uses this to get hex values for color swatches
  @Get()
  findAll() {
    return this.colorService.findAll();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminFindAll() {
    return this.colorService.adminFindAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateColorDto) {
    return this.colorService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateColorDto) {
    return this.colorService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.colorService.remove(id);
  }
}
