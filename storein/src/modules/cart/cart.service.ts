import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { Product, ProductDocument } from '../product/entities/product.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart, CartItem, CartSummary } from './cart.interface';
import { DiscountsService } from '../../discounts/discounts.service';

const CART_TTL = 60 * 60 * 24 * 7;
const cartKey  = (uid: string) => `cart:${uid}`;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(REDIS_CLIENT)      private redis: Redis,
    private readonly discountsService: DiscountsService,
  ) {}

  async getCart(userId: string): Promise<CartSummary> {
    const cart = await this.loadCart(userId);

    if (cart.items.length) {
      const ids      = [...new Set(cart.items.map((i) => i.productId))];
      const products = await this.productModel
        .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
        .select('variants')
        .lean<ProductDocument[]>();

      const productMap = new Map(
        products.map((p) => [(p._id as any).toString(), p]),
      );

      cart.items = cart.items.filter((item) => {
        const product = productMap.get(item.productId);
        if (!product) return false;

        const variant = product.variants.find(
          (v) => v._id.toString() === item.variantId,
        );
        if (!variant || !variant.isActive) return false;

        item.stock = variant.stock;
        return true;
      });

      await this.saveCart(userId, cart);
    }

    return this.buildSummary(cart);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartSummary> {
    const product = await this.productModel
      .findById(dto.productId)
      .select('name slug thumbnail variants category brand')
      .lean<ProductDocument>();
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const variant = product.variants.find(
      (v) => v._id.toString() === dto.variantId,
    );
    if (!variant || !variant.isActive)
      throw new NotFoundException('ویریانت یافت نشد');

    const cart     = await this.loadCart(userId);
    const existing = cart.items.find(
      (i) => i.productId === dto.productId && i.variantId === dto.variantId,
    );
    const newQty = (existing?.quantity ?? 0) + dto.quantity;

    if (newQty > variant.stock)
      throw new BadRequestException(
        `موجودی کافی نیست. حداکثر ${variant.stock} عدد`,
      );

    let price        = variant.price;
    let comparePrice = variant.comparePrice ?? null;

    // Apply system discount on top of the base price
    const categoryId = (product.category as any)?.toString() ?? '';
    const brandId    = (product.brand as any)?.toString() ?? '';

    const priceInfo = await this.discountsService.calculateDiscountedPrice({
      originalPrice: variant.price,
      productId:     dto.productId,
      categoryId,
      brandId,
    });
    if (priceInfo.discountAmount > 0) {
      comparePrice = price;                // original price → shown as strikethrough
      price        = priceInfo.finalPrice; // discounted price → final price
      this.logger.log(
        `Discount applied: product=${dto.productId} ` +
        `original=${comparePrice} discounted=${price} (${priceInfo.discountPercentage}%)`,
      );
    }

    if (existing) {
      existing.quantity     = newQty;
      existing.price        = price;
      existing.comparePrice = comparePrice;
    } else {
      const item: CartItem = {
        productId:    dto.productId,
        variantId:    dto.variantId,
        sku:          variant.sku,
        name:         product.name,
        slug:         product.slug,
        thumbnail:    product.thumbnail ?? null,
        price,
        comparePrice,
        quantity:     dto.quantity,
        stock:        variant.stock,
        attributes:   variant.attributes ?? [],
      };
      cart.items.push(item);
    }

    cart.updatedAt = new Date().toISOString();
    await this.saveCart(userId, cart);
    return this.buildSummary(cart);
  }

  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartSummary> {
    const cart = await this.loadCart(userId);
    const idx  = cart.items.findIndex(
      (i) => i.productId === productId && i.variantId === dto.variantId,
    );
    if (idx === -1) throw new NotFoundException('آیتم در سبد یافت نشد');

    if (dto.quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      if (dto.quantity > cart.items[idx].stock)
        throw new BadRequestException(
          `موجودی کافی نیست. حداکثر ${cart.items[idx].stock} عدد`,
        );
      cart.items[idx].quantity = dto.quantity;
    }

    cart.updatedAt = new Date().toISOString();
    await this.saveCart(userId, cart);
    return this.buildSummary(cart);
  }

  async removeItem(
    userId: string,
    productId: string,
    variantId: string,
  ): Promise<CartSummary> {
    const cart = await this.loadCart(userId);
    const idx  = cart.items.findIndex(
      (i) => i.productId === productId && i.variantId === variantId,
    );
    if (idx === -1) throw new NotFoundException('آیتم در سبد یافت نشد');

    cart.items.splice(idx, 1);
    cart.updatedAt = new Date().toISOString();
    await this.saveCart(userId, cart);
    return this.buildSummary(cart);
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(cartKey(userId));
  }

  async getRawCart(userId: string): Promise<Cart> {
    return this.loadCart(userId);
  }

  private async loadCart(userId: string): Promise<Cart> {
    const raw = await this.redis.get(cartKey(userId));
    if (raw) return JSON.parse(raw) as Cart;
    return { userId, items: [], updatedAt: new Date().toISOString() };
  }

  private async saveCart(userId: string, cart: Cart): Promise<void> {
    await this.redis.setex(cartKey(userId), CART_TTL, JSON.stringify(cart));
  }

  private buildSummary(cart: Cart): CartSummary {
    const subtotal   = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
    const savings    = cart.items.reduce((s, i) => {
      const diff = (i.comparePrice ?? i.price) - i.price;
      return s + diff * i.quantity;
    }, 0);
    return { ...cart, subtotal, totalItems, savings };
  }
}
