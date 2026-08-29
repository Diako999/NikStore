import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import { createTestCategory, createTestProduct } from './helpers/seed.helper';
import { CategoryDocument } from 'src/modules/category/entities/category.schema';
import { ProductDocument } from 'src/modules/product/entities/product.schema';

interface ProductListResponseBody {
  products: { slug: string }[];
  total: number;
  totalPages: number;
}

interface ProductDetailResponseBody {
  slug: string;
  variants: unknown[];
}

describe('Products — public browsing (e2e)', () => {
  let app: INestApplication<Server>;
  let category: CategoryDocument;
  let activeProduct1: ProductDocument;
  let activeProduct2: ProductDocument;
  let draftProduct: ProductDocument;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<Server>;
    category = await createTestCategory(app);

    activeProduct1 = await createTestProduct(app, category._id.toString());
    activeProduct2 = await createTestProduct(app, category._id.toString());
    draftProduct = await createTestProduct(app, category._id.toString(), {
      status: 'draft',
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ── GET /products ─────────────────────────────────────────────────────────

  describe('GET /api/v1/products', () => {
    it('returns only ACTIVE products (excludes draft)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products?category=${category.slug}`)
        .expect(200);

      const body = res.body as ProductListResponseBody;
      const slugs = body.products.map((p) => p.slug);
      expect(slugs).toContain(activeProduct1.slug);
      expect(slugs).toContain(activeProduct2.slug);
      expect(slugs).not.toContain(draftProduct.slug);
    });

    it('total reflects only active products', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products?category=${category.slug}`)
        .expect(200);

      const body = res.body as ProductListResponseBody;
      expect(body.total).toBe(2);
    });

    it('pagination: limit=1 returns 1 item with correct total', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products?category=${category.slug}&page=1&limit=1`)
        .expect(200);

      const body = res.body as ProductListResponseBody;
      expect(body.products).toHaveLength(1);
      expect(body.total).toBe(2);
      expect(body.totalPages).toBe(2);
    });

    it('filter by category returns matching products only', async () => {
      const otherCat = await createTestCategory(app);
      await createTestProduct(app, otherCat._id.toString());

      const res = await request(app.getHttpServer())
        .get(`/api/v1/products?category=${category.slug}`)
        .expect(200);

      // Should still be exactly 2 — the one in otherCat must not appear
      const body = res.body as ProductListResponseBody;
      expect(body.total).toBe(2);
    });

    it('no auth required (public endpoint)', async () => {
      await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    });
  });

  // ── GET /products/slug/:slug ──────────────────────────────────────────────

  describe('GET /api/v1/products/slug/:slug', () => {
    it('existing active slug → 200 with product details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/slug/${activeProduct1.slug}`)
        .expect(200);

      const body = res.body as ProductDetailResponseBody;
      expect(body.slug).toBe(activeProduct1.slug);
      expect(body.variants).toBeDefined();
    });

    it('draft product slug → 404 (not visible to public)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/products/slug/${draftProduct.slug}`)
        .expect(404);
    });

    it('non-existent slug → 404', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/slug/this-slug-does-not-exist-xyz')
        .expect(404);
    });
  });
});
