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
import { PageService } from './page.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('pages')
@UseGuards(JwtAuthGuard)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  // ── Public endpoints ──────────────────────────────────────────
  @Public()
  @Get()
  findAll() {
    return this.pageService.findAll();
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pageService.findBySlug(slug);
  }

  // ── Admin endpoints ───────────────────────────────────────────
  @Get('admin')
  @UseGuards(AdminGuard)
  findAllAdmin() {
    return this.pageService.findAll(true);
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  findById(@Param('id') id: string) {
    return this.pageService.findById(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePageDto) {
    return this.pageService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pageService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.pageService.remove(id);
  }
}
