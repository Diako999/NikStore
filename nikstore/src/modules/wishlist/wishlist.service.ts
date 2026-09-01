import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { Wishlist, WishlistDocument } from './entities/wishlist.schema';
import { Product, ProductDocument } from '../product/entities/product.schema';

const MAX_COMPARE = 4;
const COMPARE_TTL = 60 * 60 * 24;
const compareKey = (uid: string) => `compare:${uid}`;

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // ── Toggle (add if absent, remove if present) ─────────────────
  async toggle(
    userId: string,
    productId: string,
  ): Promise<{
    added: boolean;
    wishlistCount: number;
  }> {
    const oid = new Types.ObjectId(userId);
    const pid = new Types.ObjectId(productId);

    const exists = await this.productModel.exists({ _id: pid });
    if (!exists) throw new NotFoundException('محصول یافت نشد');

    const pulled = await this.wishlistModel.findOneAndUpdate(
      { userId: oid, productIds: pid },
      { $pull: { productIds: pid } },
      { new: true },
    );

    if (pulled) {
      return { added: false, wishlistCount: pulled.productIds.length };
    }

    const pushed = await this.wishlistModel.findOneAndUpdate(
      { userId: oid },
      { $addToSet: { productIds: pid } },
      { upsert: true, new: true },
    );

    return { added: true, wishlistCount: pushed.productIds.length };
  }

  // ── Get paginated wishlist ────────────────────────────────────
  async getWishlist(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    products: ProductDocument[];
    total: number;
    totalPages: number;
  }> {
    const wishlist = await this.wishlistModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean<WishlistDocument>();

    if (!wishlist || !wishlist.productIds.length)
      return { products: [], total: 0, totalPages: 0 };

    const total = wishlist.productIds.length;
    const skip = (page - 1) * limit;
    const pageIds = wishlist.productIds.slice(skip, skip + limit);

    const products = await this.productModel
      .find({ _id: { $in: pageIds } })
      .select(
        'name slug thumbnail minPrice maxPrice totalStock avgRating reviewCount category',
      )
      .lean<ProductDocument[]>();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const ordered = pageIds
      .map((id) => productMap.get(id.toString()))
      .filter(Boolean) as ProductDocument[];

    return { products: ordered, total, totalPages: Math.ceil(total / limit) };
  }

  // ── Check single product ──────────────────────────────────────
  async isInWishlist(
    userId: string,
    productId: string,
  ): Promise<{ inWishlist: boolean }> {
    const exists = await this.wishlistModel.exists({
      userId: new Types.ObjectId(userId),
      productIds: new Types.ObjectId(productId),
    });
    return { inWishlist: !!exists };
  }

  // ── Clear wishlist ────────────────────────────────────────────
  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { productIds: [] } },
    );
  }

  // ── Add to compare ────────────────────────────────────────────
  async addToCompare(
    userId: string,
    productId: string,
  ): Promise<{
    productIds: string[];
    count: number;
  }> {
    const product = await this.productModel.exists({ _id: productId });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const key = compareKey(userId);
    const raw = await this.redis.get(key);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];

    if (list.includes(productId))
      return { productIds: list, count: list.length };

    if (list.length >= MAX_COMPARE)
      throw new BadRequestException(
        `حداکثر ${MAX_COMPARE} محصول قابل مقایسه است`,
      );

    list.push(productId);
    await this.redis.setex(key, COMPARE_TTL, JSON.stringify(list));

    return { productIds: list, count: list.length };
  }

  // ── Remove from compare ───────────────────────────────────────
  async removeFromCompare(
    userId: string,
    productId: string,
  ): Promise<{
    productIds: string[];
    count: number;
  }> {
    const key = compareKey(userId);
    const raw = await this.redis.get(key);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const updated = list.filter((id) => id !== productId);

    await this.redis.setex(key, COMPARE_TTL, JSON.stringify(updated));
    return { productIds: updated, count: updated.length };
  }

  // ── Get compare list with full specs ─────────────────────────
  async getCompare(userId: string): Promise<{
    products: ProductDocument[];
    specKeys: string[];
  }> {
    const key = compareKey(userId);
    const raw = await this.redis.get(key);
    if (!raw) return { products: [], specKeys: [] };

    const ids = JSON.parse(raw) as string[];
    if (!ids.length) return { products: [], specKeys: [] };

    const products = await this.productModel
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .select(
        'name slug thumbnail minPrice maxPrice totalStock avgRating specs variants category',
      )
      .populate('category', 'name slug')
      .lean<ProductDocument[]>();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const ordered = ids
      .map((id) => productMap.get(id))
      .filter(Boolean) as ProductDocument[];

    const keySet = new Set<string>();
    ordered.forEach((p) => (p.specs ?? []).forEach((s) => keySet.add(s.key)));

    return { products: ordered, specKeys: Array.from(keySet) };
  }

  // ── Clear compare ─────────────────────────────────────────────
  async clearCompare(userId: string): Promise<void> {
    await this.redis.del(compareKey(userId));
  }
}
