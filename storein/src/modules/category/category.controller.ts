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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ── Public ────────────────────────────────────────────────────
  @Public()
  @Get('tree')
  getTree() {
    return this.categoryService.getTree();
  }

  @Public()
  @Get('roots')
  getRoots() {
    return this.categoryService.getRoots();
  }

  @Public()
  @Get('roots-with-stock')
  getRootsWithStock() {
    return this.categoryService.getRootsWithStock();
  }

  @Public()
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoryService.getBySlug(slug);
  }

  @Public()
  @Get(':id/subtree')
  getSubtree(@Param('id') id: string) {
    return this.categoryService.getSubtree(id);
  }

  // ── Admin ─────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
