import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';
import {
  Product,
  ProductDocument,
  ProductStatus,
} from '../product/entities/product.schema';
import { Blog, BlogDocument, BlogStatus } from '../blog/entities/blog.schema';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.schema';

const BASE = 'https://nikstore.ir';

function urlEntry(
  loc: string,
  lastmod: string,
  priority: string,
  changefreq: string,
): string {
  return `  <url><loc>${BASE}${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>`;
}

type WithTimestamps = { slug: string; updatedAt?: Date };

@Controller()
export class SitemapController {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  @Public()
  @Get('sitemap.xml')
  async getSitemap(@Res() res: Response) {
    const today = new Date().toISOString().split('T')[0];

    const [products, blogs, categories] = await Promise.all([
      this.productModel
        .find({ status: ProductStatus.ACTIVE })
        .select('slug updatedAt')
        .lean<WithTimestamps[]>(),
      this.blogModel
        .find({ status: BlogStatus.PUBLISHED })
        .select('slug updatedAt')
        .lean<WithTimestamps[]>(),
      this.categoryModel
        .find({ isActive: true })
        .select('slug updatedAt')
        .lean<WithTimestamps[]>(),
    ]);

    const lastmod = (d?: Date) => (d ? d.toISOString().split('T')[0] : today);

    const entries = [
      urlEntry('/', today, '1.0', 'daily'),
      urlEntry('/products', today, '0.9', 'daily'),
      urlEntry('/blog', today, '0.7', 'weekly'),
      ...categories.map((c) =>
        urlEntry(`/category/${c.slug}`, lastmod(c.updatedAt), '0.8', 'weekly'),
      ),
      ...products.map((p) =>
        urlEntry(`/product/${p.slug}`, lastmod(p.updatedAt), '0.9', 'weekly'),
      ),
      ...blogs.map((b) =>
        urlEntry(`/blog/${b.slug}`, lastmod(b.updatedAt), '0.7', 'monthly'),
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }
}
