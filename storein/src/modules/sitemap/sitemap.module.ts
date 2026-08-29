import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitemapController } from './sitemap.controller';
import { Product, ProductSchema } from '../product/entities/product.schema';
import { Blog, BlogSchema } from '../blog/entities/blog.schema';
import { Category, CategorySchema } from '../category/entities/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [SitemapController],
})
export class SitemapModule {}
