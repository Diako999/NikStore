import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BulkDiscountDto } from './dto/bulk-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ── Public ────────────────────────────────────────────────────
  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get('brands')
  findBrandsForFilter(@Query('category') category?: string) {
    return this.productService.findBrandsForFilter(category);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/related')
  findRelated(@Param('slug') slug: string) {
    return this.productService.findRelated(slug);
  }

  // ── Admin ─────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  adminFindAll(@Query() query: ProductQueryDto) {
    return this.productService.adminFindAll(query);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('bulk-discount')
  bulkDiscount(@Body() dto: BulkDiscountDto) {
    return this.productService.bulkDiscount(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.productService.duplicate(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // ── Variants ──────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/variants')
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productService.addVariant(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/variants/:variantId')
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: Partial<CreateVariantDto>,
  ) {
    return this.productService.updateVariant(id, variantId, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id/variants/:variantId')
  removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productService.removeVariant(id, variantId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/variants/:variantId/stock')
  adjustStock(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body('delta') delta: number,
  ) {
    return this.productService.adjustStock(id, variantId, delta);
  }
}
