import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, SortOrder, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import {
  Product,
  ProductDocument,
  ProductStatus,
} from '../product/entities/product.schema';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.schema';
import { SearchQueryDto } from './dto/search-query.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const HISTORY_KEY = (uid: string) => `search:history:${uid}`;
const HISTORY_MAX = 10;
const SUGGEST_TTL = 300;

export interface SuggestResult {
  products: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
}

interface FacetAggregationResult {
  priceRange: { min: number; max: number }[];
  attributeValues: { key: string; values: string[] }[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('SearchService');
  }

  // ── Main Search ───────────────────────────────────────────────
  async search(dto: SearchQueryDto): Promise<{
    products: any[];
    total: number;
    page: number;
    totalPages: number;
    facets: { priceRange: any; attributes: any[] };
  }> {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      attrs,
      sort,
      page = 1,
      limit = 20,
    } = dto;

    const match: Record<string, any> = { status: ProductStatus.ACTIVE };

    if (q?.trim()) {
      const term = q.trim();
      const regex = new RegExp(this.escapeRegex(term), 'i');
      match.$or = [
        { name: { $regex: regex } },
        { shortDescription: { $regex: regex } },
        { tags: { $elemMatch: { $regex: regex } } },
        { description: { $regex: regex } },
      ];
    }

    if (category) {
      const ids = await this.getCategorySubtreeIds(category);
      match.category = { $in: ids };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: { $gte?: number; $lte?: number } = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
      match.minPrice = priceFilter;
    }

    if (inStock) match.totalStock = { $gt: 0 };

    if (attrs) {
      const attrFilters = this.parseAttrs(attrs);
      if (attrFilters.length) {
        match['variants.attributes'] = {
          $all: attrFilters.map((a) => ({
            $elemMatch: { key: a.key, value: a.value },
          })),
        };
      }
    }

    const sortMap: Record<string, Record<string, SortOrder>> = {
      newest: { createdAt: -1 },
      price_asc: { minPrice: 1 },
      price_desc: { minPrice: -1 },
      popular: { soldCount: -1, createdAt: -1 },
      mostViewed: { viewCount: -1, createdAt: -1 },
      relevant: { soldCount: -1, createdAt: -1 },
    };
    const resolvedSort = sort ?? (q ? 'relevant' : 'newest');
    const sortStage = sortMap[resolvedSort];
    this.logger.log('search', { q, sort: resolvedSort, page, limit });

    const skip = (page - 1) * limit;

    const hasTextSearch = false; // regex-only: no textScore needed
    const projectFields = {
      name: 1,
      slug: 1,
      thumbnail: 1,
      images: 1,
      minPrice: 1,
      maxPrice: 1,
      maxComparePrice: 1,
      totalStock: 1,
      category: 1,
      tags: 1,
      soldCount: 1,
      createdAt: 1,
      avgRating: 1,
      ...(hasTextSearch ? { score: { $meta: 'textScore' } } : {}),
    };

    const [products, countResult, facets] = await Promise.all([
      this.productModel
        .find(match, hasTextSearch ? { score: { $meta: 'textScore' } } : {})
        .select(projectFields)
        .sort(sortStage)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .lean(),

      this.productModel.countDocuments(match),

      this.buildFacets(match),
    ]);

    return {
      products,
      total: countResult,
      page,
      totalPages: Math.ceil(countResult / limit),
      facets,
    };
  }

  // ── Autocomplete Suggestions ──────────────────────────────────
  async suggest(q: string): Promise<SuggestResult> {
    const term = q.trim();
    if (!term) return { products: [], categories: [] };

    this.logger.log(`suggest: q="${term}"`);

    const cacheKey = `search:suggest:v2:${term.toLowerCase()}`;

    // Redis is optional — failure must never break search
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.log(`suggest: cache hit for "${term}"`);
        return JSON.parse(cached) as SuggestResult;
      }
    } catch (redisErr) {
      this.logger.warn(
        `suggest: Redis get failed, falling back to DB — ${redisErr}`,
      );
    }

    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [productDocs, categoryDocs] = await Promise.all([
      this.productModel
        .find({ name: regex, status: ProductStatus.ACTIVE })
        .select('name slug')
        .limit(5)
        .lean(),
      this.categoryModel
        .find({ name: regex, isActive: true })
        .select('name slug')
        .limit(3)
        .lean(),
    ]);

    const result = {
      products: productDocs.map((p) => ({ name: p.name, slug: p.slug })),
      categories: categoryDocs.map((c) => ({ name: c.name, slug: c.slug })),
    };

    this.logger.log(
      `suggest: "${term}" → ${result.products.length} products, ${result.categories.length} categories`,
    );

    // Best-effort cache write
    try {
      await this.redis.setex(cacheKey, SUGGEST_TTL, JSON.stringify(result));
    } catch (redisErr) {
      this.logger.warn(`suggest: Redis setex failed — ${redisErr}`);
    }

    return result;
  }

  // ── User Search History ───────────────────────────────────────
  async saveHistory(userId: string, q: string): Promise<void> {
    const key = HISTORY_KEY(userId);
    await this.redis.lrem(key, 0, q);
    await this.redis.lpush(key, q);
    await this.redis.ltrim(key, 0, HISTORY_MAX - 1);
    await this.redis.expire(key, 60 * 60 * 24 * 30);
  }

  async getHistory(userId: string): Promise<string[]> {
    return this.redis.lrange(HISTORY_KEY(userId), 0, -1);
  }

  async clearHistory(userId: string): Promise<void> {
    await this.redis.del(HISTORY_KEY(userId));
  }

  async removeHistoryItem(userId: string, q: string): Promise<void> {
    await this.redis.lrem(HISTORY_KEY(userId), 0, q);
  }

  // ── Facets ────────────────────────────────────────────────────
  private async buildFacets(match: Record<string, any>): Promise<{
    priceRange: { min: number; max: number } | null;
    attributes: { key: string; values: string[] }[];
  }> {
    const pipeline: PipelineStage[] = [
      { $match: match },
      { $unwind: { path: '$variants', preserveNullAndEmptyArrays: false } },
      { $match: { 'variants.isActive': true } },
      {
        $facet: {
          priceRange: [
            {
              $group: {
                _id: null,
                min: { $min: '$variants.price' },
                max: { $max: '$variants.price' },
              },
            },
          ],
          attributeValues: [
            { $unwind: '$variants.attributes' },
            {
              $group: {
                _id: {
                  key: '$variants.attributes.key',
                  value: '$variants.attributes.value',
                },
              },
            },
            {
              $group: {
                _id: '$_id.key',
                values: { $addToSet: '$_id.value' },
              },
            },
            { $project: { key: '$_id', values: 1, _id: 0 } },
            { $sort: { key: 1 } },
          ],
        },
      },
    ];

    const [result] =
      await this.productModel.aggregate<FacetAggregationResult>(pipeline);

    return {
      priceRange: result?.priceRange?.[0]
        ? { min: result.priceRange[0].min, max: result.priceRange[0].max }
        : null,
      attributes: result?.attributeValues ?? [],
    };
  }

  // ── Private Helpers ───────────────────────────────────────────
  private async getCategorySubtreeIds(
    categoryId: string,
  ): Promise<Types.ObjectId[]> {
    const oid = new Types.ObjectId(categoryId);
    const cats = await this.categoryModel
      .find({
        $or: [{ _id: oid }, { ancestors: oid }],
        isActive: true,
      })
      .select('_id')
      .lean();
    return cats.map((c) => c._id);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private parseAttrs(attrs: string): { key: string; value: string }[] {
    return attrs
      .split(',')
      .map((pair) => {
        const [key, value] = pair.split(':');
        return key && value ? { key: key.trim(), value: value.trim() } : null;
      })
      .filter(Boolean) as { key: string; value: string }[];
  }
}
