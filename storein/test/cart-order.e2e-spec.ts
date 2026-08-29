import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Server } from 'http';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  createTestCategory,
  createTestProduct,
  addAddressToUser,
} from './helpers/seed.helper';
import { loginAsNewUser, parseAccessToken } from './helpers/auth.helper';
import { CategoryDocument } from 'src/modules/category/entities/category.schema';
import { ProductDocument } from 'src/modules/product/entities/product.schema';
import type { CartSummary } from 'src/modules/cart/cart.interface';

interface OrderResponseBody {
  _id: string;
  status: string;
  orderNumber: string;
  total: number;
}

interface OrdersListResponseBody {
  orders: OrderResponseBody[];
  total: number;
}

describe('Cart → Order flow (e2e)', () => {
  let app: INestApplication<Server>;
  let category: CategoryDocument;
  let product: ProductDocument;
  let variantId: string;
  let productModel: Model<ProductDocument>;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<Server>;
    productModel = app.get<Model<ProductDocument>>(getModelToken('Product'));
    category = await createTestCategory(app);
    product = await createTestProduct(app, category._id.toString());
    variantId = product.variants[0]._id.toString();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    // Reset variant stock to 10 before every test
    await productModel.updateOne(
      { _id: product._id },
      { $set: { 'variants.0.stock': 10, totalStock: 10 } },
    );
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function freshSession() {
    const { accessToken, cookie } = await loginAsNewUser(app);
    const userId = parseAccessToken(accessToken).sub;
    const addressId = await addAddressToUser(app, userId);
    return { accessToken, cookie, userId, addressId };
  }

  function addToCart(accessToken: string, qty = 1) {
    return request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: qty });
  }

  function createOrder(accessToken: string, addressId: string) {
    return request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ addressId });
  }

  // ── Cart operations ───────────────────────────────────────────────────────

  describe('Cart operations', () => {
    it('POST /cart/items — add valid item → 200, cart has 1 item', async () => {
      const { accessToken } = await freshSession();
      const res = await addToCart(accessToken, 2).expect(200);

      const body = res.body as CartSummary;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].quantity).toBe(2);
      expect(body.subtotal).toBe(200_000);
    });

    it('POST /cart/items — add same variant again → quantity increments', async () => {
      const { accessToken } = await freshSession();
      await addToCart(accessToken, 1);
      const res = await addToCart(accessToken, 2).expect(200);

      const body = res.body as CartSummary;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].quantity).toBe(3);
    });

    it('POST /cart/items — quantity exceeds stock → 400', async () => {
      const { accessToken } = await freshSession();
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId: product._id.toString(), variantId, quantity: 11 })
        .expect(400);
    });

    it('POST /cart/items — non-existent productId → 404', async () => {
      const { accessToken } = await freshSession();
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          productId: '507f1f77bcf86cd799439011',
          variantId: '507f1f77bcf86cd799439012',
          quantity: 1,
        })
        .expect(404);
    });

    it('GET /cart → returns cart with correct totals', async () => {
      const { accessToken } = await freshSession();
      await addToCart(accessToken, 3);

      const res = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as CartSummary;
      expect(body.totalItems).toBe(3);
      expect(body.subtotal).toBe(300_000);
    });

    it('DELETE /cart/items/:productId/:variantId — removes item', async () => {
      const { accessToken } = await freshSession();
      await addToCart(accessToken, 2);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${product._id.toString()}/${variantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as CartSummary;
      expect(body.items).toHaveLength(0);
    });

    it('no auth → 401 on cart endpoints', async () => {
      await request(app.getHttpServer()).get('/api/v1/cart').expect(401);
      await request(app.getHttpServer()).post('/api/v1/cart/items').expect(401);
    });
  });

  // ── Order creation ────────────────────────────────────────────────────────

  describe('Order creation from cart', () => {
    it('POST /orders → 201 + order with status pending', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 2);

      const res = await createOrder(accessToken, addressId).expect(201);

      const body = res.body as OrderResponseBody;
      expect(body.status).toBe('pending');
      expect(body.orderNumber).toBeDefined();
    });

    it('order total equals price × quantity', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 2);

      const res = await createOrder(accessToken, addressId).expect(201);
      const body = res.body as OrderResponseBody;
      // price = 100_000, qty = 2 → total = 200_000
      expect(body.total).toBe(200_000);
    });

    it('product stock is reduced after order creation', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 3);
      await createOrder(accessToken, addressId).expect(201);

      const updated = await productModel
        .findById(product._id)
        .lean<ProductDocument>();
      expect(updated?.variants[0].stock).toBe(7); // 10 - 3
    });

    it('cart is cleared after order creation', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 1);
      await createOrder(accessToken, addressId).expect(201);

      const cartRes = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`);
      const cartBody = cartRes.body as CartSummary;
      expect(cartBody.items).toHaveLength(0);
    });

    it('empty cart → 400', async () => {
      const { accessToken, addressId } = await freshSession();
      await createOrder(accessToken, addressId).expect(400);
    });

    it('no auth → 401', async () => {
      await request(app.getHttpServer()).post('/api/v1/orders').expect(401);
    });
  });

  // ── Order retrieval ───────────────────────────────────────────────────────

  describe('Order retrieval', () => {
    it("GET /orders/my → returns only this user's orders", async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 1);
      await createOrder(accessToken, addressId).expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as OrdersListResponseBody;
      expect(body.orders).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('GET /orders/my/:id → returns specific order', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 1);
      const orderRes = await createOrder(accessToken, addressId).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/my/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as OrderResponseBody;
      expect(body._id).toBe(orderId);
    });

    it("GET /orders/my/:id with another user's orderId → 404", async () => {
      const sessionA = await freshSession();
      await addToCart(sessionA.accessToken, 1);
      const orderRes = await createOrder(
        sessionA.accessToken,
        sessionA.addressId,
      ).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      // Reset stock so user B can also add to cart
      await productModel.updateOne(
        { _id: product._id },
        { $set: { 'variants.0.stock': 10, totalStock: 10 } },
      );

      const sessionB = await freshSession();
      await request(app.getHttpServer())
        .get(`/api/v1/orders/my/${orderId}`)
        .set('Authorization', `Bearer ${sessionB.accessToken}`)
        .expect(404);
    });
  });

  // ── Order cancellation ────────────────────────────────────────────────────

  describe('Order cancellation by user', () => {
    it('PATCH /orders/my/:id/cancel on PENDING order → 200, status=cancelled', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 2);
      const orderRes = await createOrder(accessToken, addressId).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/orders/my/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as OrderResponseBody;
      expect(body.status).toBe('cancelled');
    });

    it('stock is restored after cancellation', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 4);
      const orderRes = await createOrder(accessToken, addressId).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      // Stock is now 10 - 4 = 6
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/my/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`);

      const updated = await productModel
        .findById(product._id)
        .lean<ProductDocument>();
      expect(updated?.variants[0].stock).toBe(10); // restored
    });

    it('cancelling an already-cancelled order → 400', async () => {
      const { accessToken, addressId } = await freshSession();
      await addToCart(accessToken, 1);
      const orderRes = await createOrder(accessToken, addressId).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      await request(app.getHttpServer())
        .patch(`/api/v1/orders/my/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Second cancel attempt
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/my/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it("cannot cancel another user's order → 404", async () => {
      const sessionA = await freshSession();
      await addToCart(sessionA.accessToken, 1);
      const orderRes = await createOrder(
        sessionA.accessToken,
        sessionA.addressId,
      ).expect(201);
      const orderId = (orderRes.body as OrderResponseBody)._id;

      await productModel.updateOne(
        { _id: product._id },
        { $set: { 'variants.0.stock': 10, totalStock: 10 } },
      );

      const sessionB = await freshSession();
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/my/${orderId}/cancel`)
        .set('Authorization', `Bearer ${sessionB.accessToken}`)
        .expect(404);
    });
  });
});
