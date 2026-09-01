import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseErrorNS, Model, SortOrder, Types } from 'mongoose';
import slugify from 'slugify';
import {
  Product,
  ProductDocument,
  ProductStatus,
} from './entities/product.schema';
import { Variant } from './entities/variant.schema';
import { DiscountDocument } from '../../discounts/schemas/discount.schema';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.schema';
import { Color, ColorDocument } from '../color/entities/color.schema';
import { Brand, BrandDocument } from '../brand/entities/brand.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BulkDiscountDto } from './dto/bulk-discount.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { DiscountsService } from '../../discounts/discounts.service';
import { UploadService } from '../upload/upload.service';

// Structural shape shared by CreateVariantDto and the Variant schema class —
// only the fields calcDenormalized() actually reads.
interface VariantPriceInput {
  isActive?: boolean;
  price: number;
  stock?: number;
  comparePrice?: number | null;
}

// Structural shape shared by every product-like object attachBulkDiscounts()
// is called with (lean query results, populated documents, single docs).
// A ref field (category/brand) that may have been populated by Mongoose —
// the schema's static Types.ObjectId type doesn't reflect that possibility.
interface PopulatedIdRef {
  _id?: Types.ObjectId;
  toString(): string;
}

// Lean-query result shape including the Mongoose-managed fields that aren't
// declared on the Product schema class itself (versionKey + timestamps).
type ProductLeanRecord = ProductDocument & {
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

interface PricableProduct {
  _id: Types.ObjectId;
  category?: Types.ObjectId;
  brand?: Types.ObjectId;
  minPrice?: number;
  discountPercentage?: number;
  finalPrice?: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Color.name) private colorModel: Model<ColorDocument>,
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    private readonly logger: AppLoggerService,
    private readonly discountsService: DiscountsService,
    private readonly uploadService: UploadService,
  ) {
    this.logger.setContext('ProductService');
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async resolveCategoryId(
    category: string,
  ): Promise<Types.ObjectId | null> {
    if (!category) return null;
    if (Types.ObjectId.isValid(category)) return new Types.ObjectId(category);
    const cat = await this.categoryModel
      .findOne({ slug: category })
      .select('_id')
      .lean();
    return cat ? cat._id : null;
  }

  // Returns the category itself + all descendants (uses ancestors index for O(1) lookup)
  private async resolveCategoryIds(
    category: string,
  ): Promise<Types.ObjectId[] | null> {
    const catId = await this.resolveCategoryId(category);
    if (!catId) return null;
    const all = await this.categoryModel
      .find({ $or: [{ _id: catId }, { ancestors: catId }], isActive: true })
      .select('_id')
      .lean();
    return all.map((c) => c._id);
  }

  private makeSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, locale: 'fa' });
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const MAX_ATTEMPTS = 20;
    let slug = base;
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const exists = await this.productModel
        .findOne({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })
        .lean();
      if (!exists) return slug;
      slug = `${base}-${i}`;
    }
    throw new BadRequestException(
      `تولید slug منحصربه‌فرد پس از ${MAX_ATTEMPTS} تلاش ناموفق بود`,
    );
  }

  private calcDenormalized(variants: VariantPriceInput[]): {
    minPrice: number;
    maxPrice: number;
    totalStock: number;
    maxComparePrice: number;
  } {
    const active = variants.filter((v) => v.isActive !== false);
    if (!active.length)
      return { minPrice: 0, maxPrice: 0, totalStock: 0, maxComparePrice: 0 };

    const prices = active.map((v) => v.price);
    const totalStock = active.reduce((s, v) => s + (v.stock ?? 0), 0);
    const comparePrices = active
      .map((v) => v.comparePrice ?? 0)
      .filter((cp) => cp > 0);
    const maxComparePrice = comparePrices.length
      ? Math.max(...comparePrices)
      : 0;
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock,
      maxComparePrice,
    };
  }

  // ── Public ────────────────────────────────────────────────────
  async findAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 20,
      gender,
      hasDiscount,
    } = query;

    const filter: Record<string, any> = {
      status: ProductStatus.ACTIVE,
    };

    const catIds = category ? await this.resolveCategoryIds(category) : null;
    if (catIds?.length) filter.category = { $in: catIds };
    if (brand && Types.ObjectId.isValid(brand))
      filter.brand = new Types.ObjectId(brand);
    if (minPrice !== undefined) filter.minPrice = { $gte: minPrice };
    if (maxPrice !== undefined)
      filter.maxPrice = {
        ...(filter.maxPrice as Record<string, unknown> | undefined),
        $lte: maxPrice,
      };
    if (inStock) filter.totalStock = { $gt: 0 };

    // Gender filter — resolve via category.gender field (includes descendants)
    if (gender) {
      const genders = gender
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      const genderCats = await this.categoryModel
        .find({ gender: { $in: genders } })
        .select('_id')
        .lean();
      if (genderCats.length) {
        const genderCatIds = genderCats.map((c) => c._id);
        const allGenderCats = await this.categoryModel
          .find({
            $or: [
              { _id: { $in: genderCatIds } },
              { ancestors: { $in: genderCatIds } },
            ],
          })
          .select('_id')
          .lean();
        filter.$and = [
          ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),
          { category: { $in: allGenderCats.map((c) => c._id) } },
        ];
      } else {
        filter._id = { $exists: false }; // no matching categories → empty result
      }
    }

    // When sorting by discount, only return products that actually have a discount
    if (sort === 'discount') {
      filter.$expr = { $gt: ['$maxComparePrice', '$minPrice'] };
    }

    // hasDiscount=true → only products that have an active time-discount
    // (guards both the transformed boolean and a raw string, for callers that
    // bypass the ValidationPipe's transform, e.g. direct service calls in tests)
    if ((hasDiscount as unknown as string) === 'true' || hasDiscount === true) {
      const activeDiscounts = await this.discountsService.getActiveDiscounts();
      const allProductIds = activeDiscounts.flatMap((d) =>
        d.targetType === 'products'
          ? d.targetIds.map((id) => id.toString())
          : [],
      );
      const allCategoryIds = activeDiscounts.flatMap((d) =>
        d.targetType === 'categories'
          ? d.targetIds.map((id) => id.toString())
          : [],
      );
      const hasAll = activeDiscounts.some((d) => d.targetType === 'all');
      if (!hasAll) {
        const orConditions: Record<string, unknown>[] = [];
        if (allProductIds.length)
          orConditions.push({
            _id: { $in: allProductIds.map((id) => new Types.ObjectId(id)) },
          });
        if (allCategoryIds.length)
          orConditions.push({
            category: {
              $in: allCategoryIds.map((id) => new Types.ObjectId(id)),
            },
          });
        if (!orConditions.length) filter._id = { $exists: false };
        else
          filter.$or = [
            ...((filter.$or as Record<string, unknown>[] | undefined) ?? []),
            ...orConditions,
          ];
      }
    }

    const sortMap: Record<string, Record<string, SortOrder>> = {
      newest: { createdAt: -1 },
      price_asc: { minPrice: 1 },
      price_desc: { minPrice: -1 },
      popular: { soldCount: -1, viewCount: -1 },
      bestseller: { soldCount: -1 },
      discount: { maxComparePrice: -1, minPrice: 1 },
      mostViewed: { viewCount: -1, createdAt: -1 },
    };
    const sortObj = sortMap[sort ?? 'newest'] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select(
          'name slug images thumbnail minPrice maxPrice maxComparePrice totalStock avgRating reviewCount viewCount soldCount category brand tags specs createdAt variants',
        )
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<ProductDocument[]>(),
      this.productModel.countDocuments(filter),
    ]);

    // Bulk-attach discountPercentage + finalPrice from active system discounts (single cache read)
    await this.attachBulkDiscounts(products);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  private async attachBulkDiscounts(
    products: PricableProduct[],
  ): Promise<void> {
    if (!products.length) return;

    const activeDiscounts = await this.discountsService.getActiveDiscounts();
    const now = new Date();

    const isTimeValid = (d: DiscountDocument) => {
      if (d.minQuantity) return false;
      if (d.startDate && d.endDate) {
        if (now < new Date(d.startDate) || now > new Date(d.endDate))
          return false;
      }
      return true;
    };

    const publicDiscounts = activeDiscounts.filter(isTimeValid);

    if (!publicDiscounts.length) {
      products.forEach((p) => {
        p.discountPercentage = 0;
        p.finalPrice = p.minPrice;
      });
      return;
    }

    // Build lookup maps once for each discount bucket
    const buildMaps = (discounts: DiscountDocument[]) => {
      const byProduct: Map<string, DiscountDocument[]> = new Map();
      const byCategory: Map<string, DiscountDocument[]> = new Map();
      const byBrand: Map<string, DiscountDocument[]> = new Map();
      const forAll: DiscountDocument[] = [];

      for (const d of discounts) {
        if (d.targetType === 'all') {
          forAll.push(d);
        } else if (d.targetType === 'products') {
          d.targetIds.forEach((id) => {
            const k = id.toString();
            if (!byProduct.has(k)) byProduct.set(k, []);
            byProduct.get(k)!.push(d);
          });
        } else if (d.targetType === 'categories') {
          d.targetIds.forEach((id) => {
            const k = id.toString();
            if (!byCategory.has(k)) byCategory.set(k, []);
            byCategory.get(k)!.push(d);
          });
        } else if (d.targetType === 'brands') {
          (d.brandIds ?? []).forEach((id) => {
            const k = id.toString();
            if (!byBrand.has(k)) byBrand.set(k, []);
            byBrand.get(k)!.push(d);
          });
        } else if (d.targetType === 'brand_category') {
          d.targetIds.forEach((id) => {
            const k = id.toString();
            if (!byCategory.has(k)) byCategory.set(k, []);
            byCategory.get(k)!.push(d);
          });
          (d.brandIds ?? []).forEach((id) => {
            const k = id.toString();
            if (!byBrand.has(k)) byBrand.set(k, []);
            byBrand.get(k)!.push(d);
          });
        }
      }
      return { forAll, byProduct, byCategory, byBrand };
    };

    const publicMaps = buildMaps(publicDiscounts);

    const bestDiscount = (
      maps: ReturnType<typeof buildMaps>,
      productId: string,
      categoryId: string,
      brandId: string,
      basePrice: number,
    ) => {
      const applicable = [
        ...maps.forAll,
        ...(maps.byProduct.get(productId) ?? []),
        ...(maps.byCategory.get(categoryId) ?? []),
        ...(brandId ? (maps.byBrand.get(brandId) ?? []) : []),
      ];
      if (!applicable.length || basePrice <= 0)
        return { pct: 0, finalPrice: basePrice };

      let bestAmount = 0;
      for (const d of applicable) {
        let amount: number;
        if (d.discountType === 'percentage') {
          const raw = Math.floor((basePrice * d.value) / 100);
          amount = d.maxDiscountAmount
            ? Math.min(raw, d.maxDiscountAmount)
            : raw;
        } else {
          amount = Math.min(d.value, basePrice);
        }
        if (amount > bestAmount) bestAmount = amount;
      }
      return {
        pct: Math.round((bestAmount / basePrice) * 100),
        finalPrice: Math.max(0, basePrice - bestAmount),
      };
    };

    for (const product of products) {
      const productId = product._id.toString();
      const categoryId = product.category?.toString() ?? '';
      const brandId = product.brand?.toString() ?? '';

      const retail = bestDiscount(
        publicMaps,
        productId,
        categoryId,
        brandId,
        product.minPrice ?? 0,
      );
      product.discountPercentage = retail.pct;
      product.finalPrice = retail.finalPrice;
    }
  }

  async findBrandsForFilter(category?: string): Promise<BrandDocument[]> {
    const filter: Record<string, any> = { status: ProductStatus.ACTIVE };

    if (category) {
      const catIds = await this.resolveCategoryIds(category);
      if (!catIds?.length) return [];
      filter.category = { $in: catIds };
    }

    const brandIds = await this.productModel.distinct('brand', filter);
    if (!brandIds.length) return [];

    return this.brandModel
      .find({ _id: { $in: brandIds }, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean<BrandDocument[]>();
  }

  async findBySlug(slug: string): Promise<any> {
    const product = await this.productModel
      .findOne({ slug, status: ProductStatus.ACTIVE })
      .select('-__v')
      .populate('category', 'name slug')
      .lean<ProductDocument>();
    if (!product) throw new NotFoundException('محصول یافت نشد');

    // Increment view count (fire and forget)
    void this.productModel
      .findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } })
      .exec();

    // Build colorMap: { 'مشکی': '#1a1a1a', ... } from DB Colors collection
    const colorNames = (product.variants ?? [])
      .flatMap((v) =>
        (v.attributes ?? []).filter((a) => a.key === 'رنگ').map((a) => a.value),
      )
      .filter(Boolean);

    let colorMap: Record<string, string> = {};
    if (colorNames.length > 0) {
      const colors = await this.colorModel
        .find({ name: { $in: colorNames } })
        .select('name hex')
        .lean<ColorDocument[]>();
      colorMap = Object.fromEntries(colors.map((c) => [c.name, c.hex]));
    }

    // Attach time-discount pricing
    // (category may or may not be populated at this point — the static
    // Types.ObjectId schema type doesn't reflect that, hence the cast)
    const categoryRef = product.category as unknown as
      | PopulatedIdRef
      | undefined;
    const categoryId =
      categoryRef?._id?.toString() ?? categoryRef?.toString() ?? '';
    const brandId = product.brand?.toString() ?? '';
    const pid = product._id.toString();

    const priceInfo = await this.discountsService.calculateDiscountedPrice({
      originalPrice: product.minPrice,
      productId: pid,
      categoryId,
      brandId,
    });

    return {
      ...product,
      colorMap,
      finalPrice: priceInfo.finalPrice,
      discountAmount: priceInfo.discountAmount,
      discountPercentage: priceInfo.discountPercentage,
      activeDiscountId: priceInfo.activeDiscount?.id ?? null,
      activeDiscount: priceInfo.activeDiscount,
    };
  }

  async findRelated(slug: string, limit = 8): Promise<ProductDocument[]> {
    const product = await this.productModel
      .findOne({ slug, status: ProductStatus.ACTIVE })
      .select('category tags')
      .lean<ProductDocument>();
    if (!product) return [];

    const catIds = product.category
      ? await this.resolveCategoryIds(product.category.toString())
      : null;

    const filter: Record<string, any> = {
      status: ProductStatus.ACTIVE,
      slug: { $ne: slug },
    };
    if (catIds?.length) filter.category = { $in: catIds };

    return this.productModel
      .find(filter)
      .select(
        'name slug images thumbnail minPrice maxPrice maxComparePrice totalStock avgRating reviewCount',
      )
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit)
      .lean<ProductDocument[]>();
  }

  // ── Admin ─────────────────────────────────────────────────────
  async adminFindAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      status,
      category,
      brand,
      search,
      sort,
      page = 1,
      limit = 20,
    } = query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (brand && Types.ObjectId.isValid(brand))
      filter.brand = { $in: [new Types.ObjectId(brand), brand] };
    const catIds2 = category ? await this.resolveCategoryIds(category) : null;
    if (catIds2?.length) filter.category = { $in: catIds2 };
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];

    const sortMap: Record<string, Record<string, SortOrder>> = {
      newest: { createdAt: -1 },
      price_asc: { minPrice: 1 },
      price_desc: { minPrice: -1 },
    };
    const sortObj = sortMap[sort ?? 'newest'] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('-__v')
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<ProductDocument[]>(),
      this.productModel.countDocuments(filter),
    ]);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean<ProductDocument>();
    if (!product) throw new NotFoundException('محصول یافت نشد');
    await this.attachBulkDiscounts([product]);
    return product;
  }

  async findManyByIds(ids: string[]): Promise<ProductDocument[]> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    return this.productModel
      .find({ _id: { $in: validIds } })
      .select('-__v')
      .lean<ProductDocument[]>();
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const base = dto.slug ? this.makeSlug(dto.slug) : this.makeSlug(dto.name);
    const slug = await this.uniqueSlug(base);
    const denorm = this.calcDenormalized(dto.variants ?? []);

    try {
      const doc = {
        ...dto,
        slug,
        category: new Types.ObjectId(dto.category),
        ...(dto.brand && { brand: new Types.ObjectId(dto.brand) }),
        ...denorm,
      };
      const product = await this.productModel.create(
        doc as unknown as Partial<Product>,
      );
      this.logger.log('Product created', {
        productId: product._id.toString(),
        slug: product.slug,
        totalStock: denorm.totalStock,
      });
      return product.toObject();
    } catch (err) {
      if (err instanceof Error && err.name === 'ValidationError') {
        const validationErr = err as InstanceType<
          typeof MongooseErrorNS.ValidationError
        >;
        this.logger.error('Product create validation failed', validationErr, {
          slug,
        });
        throw new BadRequestException(
          Object.values(validationErr.errors)
            .map((e) => e.message)
            .join(', '),
        );
      }
      throw err;
    }
  }

  async duplicate(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const src = await this.productModel.findById(id).lean<ProductDocument>();
    if (!src) throw new NotFoundException('محصول یافت نشد');

    const baseSlug = await this.uniqueSlug(src.slug);
    this.logger.debug('Duplicate slug resolved', {
      srcSlug: src.slug,
      baseSlug,
    });

    const { _id, __v, createdAt, updatedAt, ...rest } =
      src as unknown as ProductLeanRecord;
    void _id;
    void __v;
    void createdAt;
    void updatedAt;

    // Clear SKUs on variants to avoid duplicate-SKU constraint
    const variants = (rest.variants ?? []).map((v) => {
      const { _id: _vid, ...vRest } = v;
      void _vid;
      return { ...vRest, sku: '' };
    });

    const doc = {
      ...rest,
      slug: baseSlug,
      name: `${rest.name} (کپی)`,
      status: 'draft',
      variants,
      viewCount: 0,
      soldCount: 0,
      avgRating: 0,
      reviewCount: 0,
    };

    const created = await this.productModel.create(
      doc as unknown as Partial<Product>,
    );
    this.logger.log('Product duplicated', {
      src: id,
      new: created._id.toString(),
    });
    return created.toObject();
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const existing = await this.productModel.findById(id);
    if (!existing) throw new NotFoundException('محصول یافت نشد');

    const updateData: Record<string, unknown> = { ...dto };

    // Only regenerate slug when explicitly provided — never derive from Persian name on update
    if (dto.slug) {
      updateData.slug = await this.uniqueSlug(this.makeSlug(dto.slug), id);
    } else {
      delete updateData.slug; // ensure slug field is never touched without explicit intent
    }

    if (dto.category) updateData.category = new Types.ObjectId(dto.category);
    if (dto.brand && Types.ObjectId.isValid(dto.brand))
      updateData.brand = new Types.ObjectId(dto.brand);
    else if (dto.brand === '' || dto.brand === null)
      updateData.brand = undefined;

    if (dto.variants)
      Object.assign(updateData, this.calcDenormalized(dto.variants));

    const updated = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .select('-__v')
      .lean<ProductDocument>();

    return updated!;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const product = await this.productModel
      .findById(id)
      .select('images')
      .lean<{ images?: string[] }>();

    if (!product) throw new NotFoundException('محصول یافت نشد');

    await this.productModel.findByIdAndDelete(id);
    this.logger.log('Product removed', { productId: id });

    const keys = (product.images ?? [])
      .map((url) => this.extractStorageKey(url))
      .filter((k): k is string => !!k);

    if (keys.length) {
      this.logger.log('Deleting product images from storage', {
        productId: id,
        count: keys.length,
      });
      for (const key of keys) {
        this.uploadService.deleteFile(key).catch((err: Error) =>
          this.logger.warn('Failed to delete product image', {
            productId: id,
            key,
            error: err.message,
          }),
        );
      }
    }
  }

  private extractStorageKey(url: string): string | null {
    if (!url) return null;
    const m = url.match(/^\/uploads\/(.+)$/);
    return m ? m[1] : null;
  }

  // ── Variant Management ────────────────────────────────────────
  async addVariant(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const skuExists = product.variants.some((v) => v.sku === dto.sku);
    if (skuExists) throw new BadRequestException(`SKU تکراری است: ${dto.sku}`);

    product.variants.push({
      ...dto,
      _id: new Types.ObjectId(),
    } as unknown as Variant);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  async bulkDiscount(
    dto: BulkDiscountDto,
  ): Promise<{ updated: number; mode: 'timed' | 'permanent' }> {
    const { productIds, discountPct, startDate, endDate, title } = dto;
    const pct = Math.max(0, Math.min(90, discountPct));

    // ── Timed mode: delegate to DiscountsService, prices stay untouched ──
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate))
        throw new BadRequestException(
          'تاریخ پایان باید بعد از تاریخ شروع باشد',
        );

      this.logger.log('BulkDiscount[timed]: creating time-limited discount', {
        pct,
        count: productIds.length,
        startDate,
        endDate,
      });

      await this.discountsService.create({
        title: title?.trim() || `تخفیف گروهی ${pct}٪`,
        discountType: 'percentage',
        value: pct,
        startDate,
        endDate,
        targetType: 'products',
        targetIds: productIds,
      });

      this.logger.log('BulkDiscount[timed]: done', {
        pct,
        count: productIds.length,
      });
      return { updated: productIds.length, mode: 'timed' };
    }

    // ── Permanent mode: modify variant prices directly ──
    const products = await this.productModel
      .find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
      .exec();

    if (pct === 0) {
      this.logger.warn('BulkDiscount: removing discount', {
        count: products.length,
      });
    } else {
      this.logger.log('BulkDiscount: applying', {
        pct,
        count: products.length,
      });
    }

    let updated = 0;
    for (const product of products) {
      product.variants.forEach((v) => {
        const comparePrice = v.comparePrice ?? 0;
        if (pct === 0) {
          if (comparePrice > 0) {
            v.price = comparePrice;
            v.comparePrice = 0;
          }
        } else {
          // Always discount from the original price (comparePrice if set, otherwise current price)
          const basePrice = comparePrice > 0 ? comparePrice : v.price;
          v.comparePrice = basePrice;
          v.price = Math.round(basePrice * (1 - pct / 100));
        }
      });
      // Required: Mongoose does not detect mutations on nested array elements automatically
      product.markModified('variants');
      Object.assign(product, this.calcDenormalized(product.variants));
      await product.save();
      updated++;
    }

    this.logger.log('BulkDiscount: done', { updated, pct });
    return { updated, mode: 'permanent' };
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: Partial<CreateVariantDto>,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const variant = product.variants.find(
      (v) => v._id.toString() === variantId,
    );
    if (!variant) throw new NotFoundException('ویریانت یافت نشد');

    if (dto.sku && dto.sku !== variant.sku) {
      const duplicate = product.variants.some(
        (v) => v.sku === dto.sku && v._id.toString() !== variantId,
      );
      if (duplicate)
        throw new BadRequestException(`SKU تکراری است: ${dto.sku}`);
    }

    Object.assign(variant, dto);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  async removeVariant(
    productId: string,
    variantId: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const idx = product.variants.findIndex(
      (v) => v._id.toString() === variantId,
    );
    if (idx === -1) throw new NotFoundException('ویریانت یافت نشد');

    product.variants.splice(idx, 1);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  // ── Inventory ─────────────────────────────────────────────────
  async bulkAdjustStock(
    items: { productId: string; variantId: string; delta: number }[],
  ): Promise<void> {
    if (!items.length) return;

    await this.productModel.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: {
            _id: new Types.ObjectId(item.productId),
            'variants._id': new Types.ObjectId(item.variantId),
          },
          update: { $inc: { 'variants.$.stock': item.delta } },
        },
      })),
    );

    const uniqueIds = [...new Set(items.map((i) => i.productId))];
    await Promise.all(uniqueIds.map((id) => this.recalcDenormalized(id)));
  }

  private async recalcDenormalized(productId: string): Promise<void> {
    const product = await this.productModel.findById(productId);
    if (!product) return;
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
  }

  async adjustStock(
    productId: string,
    variantId: string,
    delta: number,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const variant = product.variants.find(
      (v) => v._id.toString() === variantId,
    );
    if (!variant) throw new NotFoundException('ویریانت یافت نشد');

    const newStock = variant.stock + delta;
    if (newStock < 0) throw new BadRequestException('موجودی کافی نیست');

    variant.stock = newStock;
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();

    if (newStock <= 5) {
      this.logger.warn('Low stock', { productId, variantId, stock: newStock });
    }

    return product.toObject();
  }
}
