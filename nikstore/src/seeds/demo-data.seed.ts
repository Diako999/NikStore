/**
 * Seed demo brands and products so every storefront page/section has real
 * content to render (homepage rows, category pages, product detail, search,
 * brand strip). Run `npm run seed:categories` FIRST — this script looks up
 * the women/men/kids top-level categories it creates rather than
 * re-creating them.
 * Run: npx ts-node -r tsconfig-paths/register src/seeds/demo-data.seed.ts
 * Safe to re-run — upserts by slug, never duplicates.
 */
import 'dotenv/config';
import mongoose, { Schema, Types } from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nikstore';

const CategorySchema = new Schema(
  { name: String, slug: { type: String, unique: true } },
  { strict: false },
);

const BrandSchema = new Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    logo: String,
    description: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false },
);

const ProductSchema = new Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    shortDescription: String,
    description: String,
    images: { type: [String], default: [] },
    thumbnail: String,
    variants: { type: [Schema.Types.Mixed], default: [] },
    minPrice: Number,
    maxPrice: Number,
    totalStock: Number,
    maxComparePrice: Number,
    tags: { type: [String], default: [] },
    status: { type: String, default: 'active' },
    soldCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false },
);

function computeAggregates(variants: any[]) {
  const active = variants.filter((v) => v.isActive !== false);
  if (!active.length) return { minPrice: 0, maxPrice: 0, totalStock: 0, maxComparePrice: 0 };
  const prices = active.map((v) => v.price);
  const totalStock = active.reduce((s, v) => s + (v.stock ?? 0), 0);
  const comparePrices = active.map((v) => v.comparePrice).filter((p) => p != null) as number[];
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    totalStock,
    maxComparePrice: comparePrices.length ? Math.max(...comparePrices) : 0,
  };
}

function variant(price: number, comparePrice: number | null, stock: number, size: string, color: string) {
  return {
    _id: new Types.ObjectId(),
    sku: `${size}-${color}`.toUpperCase(),
    price,
    comparePrice,
    stock,
    isActive: true,
    images: [],
    attributes: [
      { key: 'سایز', value: size },
      { key: 'رنگ', value: color },
    ],
  };
}

function photo(seed: string, w = 800, h = 1000) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const CATEGORY_SLUGS = ['women', 'men', 'kids'];

const BRANDS = [
  { name: 'نیک کلاسیک', slug: 'nik-classic', description: 'پوشاک روزمره با کیفیت بالا' },
  { name: 'استایل مدرن', slug: 'modern-style', description: 'طراحی امروزی برای نسل جدید' },
  { name: 'پوشاک آرتین', slug: 'artin-wear', description: 'کیفیت و راحتی در کنار هم' },
  { name: 'کالکشن رونیکا', slug: 'ronika-collection', description: 'مد و فشن زنانه' },
];

type SeedProduct = {
  name: string; slug: string; categorySlug: string; brandSlug: string;
  desc: string; tags: string[]; soldCount: number; daysAgo: number;
  variants: ReturnType<typeof variant>[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: 'هودی پرفورمنس مردانه', slug: 'hoodie-performance', categorySlug: 'men', brandSlug: 'nik-classic',
    desc: 'هودی گرم و راحت، مناسب فصل پاییز و زمستان با پارچه پنبه‌ای درجه یک.', tags: ['هودی', 'مردانه', 'زمستانی'],
    soldCount: 154, daysAgo: 1,
    variants: [variant(3250000, 4200000, 12, 'M', 'مشکی'), variant(3250000, 4200000, 8, 'L', 'مشکی'), variant(3250000, 4200000, 5, 'L', 'طوسی')],
  },
  {
    name: 'تیشرت بیسیک مردانه', slug: 'tshirt-basic-men', categorySlug: 'men', brandSlug: 'modern-style',
    desc: 'تیشرت نخی ساده و روزمره با برش راحت.', tags: ['تیشرت', 'مردانه'],
    soldCount: 302, daysAgo: 3,
    variants: [variant(890000, 1100000, 20, 'M', 'سفید'), variant(890000, 1100000, 15, 'L', 'سفید'), variant(890000, null, 10, 'M', 'سرمه‌ای')],
  },
  {
    name: 'شلوار جین اسلیم مردانه', slug: 'jeans-slim-men', categorySlug: 'men', brandSlug: 'artin-wear',
    desc: 'شلوار جین اسلیم‌فیت با پارچه استرچ.', tags: ['شلوار', 'جین', 'مردانه'],
    soldCount: 88, daysAgo: 8,
    variants: [variant(2450000, 2900000, 9, '32', 'آبی'), variant(2450000, 2900000, 6, '34', 'آبی')],
  },
  {
    name: 'کاپشن اسپرت مردانه', slug: 'jacket-sport-men', categorySlug: 'men', brandSlug: 'nik-classic',
    desc: 'کاپشن ضدباد مناسب فعالیت‌های روزمره.', tags: ['کاپشن', 'مردانه'],
    soldCount: 41, daysAgo: 15,
    variants: [variant(4600000, 5400000, 7, 'L', 'مشکی'), variant(4600000, 5400000, 4, 'XL', 'سبز')],
  },
  {
    name: 'پیراهن مجلسی زنانه', slug: 'dress-formal-women', categorySlug: 'women', brandSlug: 'ronika-collection',
    desc: 'پیراهن شیک مجلسی با پارچه ساتن.', tags: ['پیراهن', 'زنانه', 'مجلسی'],
    soldCount: 210, daysAgo: 2,
    variants: [variant(3900000, 4800000, 6, 'S', 'صورتی'), variant(3900000, 4800000, 6, 'M', 'صورتی'), variant(3900000, 4800000, 4, 'M', 'مشکی')],
  },
  {
    name: 'تاپ کژوال زنانه', slug: 'top-casual-women', categorySlug: 'women', brandSlug: 'modern-style',
    desc: 'تاپ نخی راحت برای استفاده روزانه.', tags: ['تاپ', 'زنانه'],
    soldCount: 176, daysAgo: 4,
    variants: [variant(650000, 800000, 18, 'S', 'سفید'), variant(650000, 800000, 14, 'M', 'کرم')],
  },
  {
    name: 'دامن پلیسه زنانه', slug: 'skirt-pleated-women', categorySlug: 'women', brandSlug: 'ronika-collection',
    desc: 'دامن پلیسه بلند با حالت شیک.', tags: ['دامن', 'زنانه'],
    soldCount: 63, daysAgo: 10,
    variants: [variant(1850000, 2200000, 10, 'S', 'مشکی'), variant(1850000, 2200000, 8, 'M', 'مشکی')],
  },
  {
    name: 'ژاکت بافت زنانه', slug: 'cardigan-knit-women', categorySlug: 'women', brandSlug: 'artin-wear',
    desc: 'ژاکت بافت گرم مناسب پاییز.', tags: ['ژاکت', 'زنانه', 'زمستانی'],
    soldCount: 97, daysAgo: 6,
    variants: [variant(2100000, 2600000, 11, 'M', 'قرمز'), variant(2100000, 2600000, 9, 'L', 'قرمز')],
  },
  {
    name: 'تیشرت طرح‌دار بچگانه', slug: 'tshirt-print-kids', categorySlug: 'kids', brandSlug: 'modern-style',
    desc: 'تیشرت شاد و رنگارنگ برای کودکان.', tags: ['تیشرت', 'بچگانه'],
    soldCount: 134, daysAgo: 5,
    variants: [variant(490000, 600000, 16, '6', 'زرد'), variant(490000, 600000, 12, '8', 'آبی')],
  },
  {
    name: 'شلوارک تابستانه بچگانه', slug: 'shorts-summer-kids', categorySlug: 'kids', brandSlug: 'nik-classic',
    desc: 'شلوارک سبک و راحت برای تابستان.', tags: ['شلوارک', 'بچگانه', 'تابستانی'],
    soldCount: 72, daysAgo: 12,
    variants: [variant(390000, 480000, 20, '4', 'نارنجی'), variant(390000, 480000, 15, '6', 'سبز')],
  },
  {
    name: 'ست دورویه بچگانه', slug: 'set-reversible-kids', categorySlug: 'kids', brandSlug: 'artin-wear',
    desc: 'ست دو تکه راحت برای بازی و مدرسه.', tags: ['ست', 'بچگانه'],
    soldCount: 45, daysAgo: 9,
    variants: [variant(980000, 1200000, 10, '8', 'طوسی'), variant(980000, 1200000, 7, '10', 'مشکی')],
  },
  {
    name: 'کاپشن پاییزه بچگانه', slug: 'jacket-autumn-kids', categorySlug: 'kids', brandSlug: 'ronika-collection',
    desc: 'کاپشن گرم و سبک برای فصل پاییز.', tags: ['کاپشن', 'بچگانه'],
    soldCount: 28, daysAgo: 20,
    variants: [variant(1650000, 1950000, 8, '6', 'آبی'), variant(1650000, 1950000, 6, '8', 'قرمز')],
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  const CategoryModel = mongoose.model('Category', CategorySchema, 'categories');
  const BrandModel = mongoose.model('Brand', BrandSchema, 'brands');
  const ProductModel = mongoose.model('Product', ProductSchema, 'products');

  const categoryIds: Record<string, Types.ObjectId> = {};
  for (const slug of CATEGORY_SLUGS) {
    const doc = await CategoryModel.findOne({ slug });
    if (!doc) {
      throw new Error(
        `Category "${slug}" not found — run "npm run seed:categories" first.`,
      );
    }
    categoryIds[slug] = doc._id as Types.ObjectId;
  }

  const brandIds: Record<string, Types.ObjectId> = {};
  for (const b of BRANDS) {
    const doc = await BrandModel.findOneAndUpdate(
      { slug: b.slug },
      { name: b.name, slug: b.slug, description: b.description, isActive: true },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    brandIds[b.slug] = doc!._id as Types.ObjectId;
  }
  console.log(`Brands: ${BRANDS.length} upserted`);

  let productCount = 0;
  for (const p of PRODUCTS) {
    const agg = computeAggregates(p.variants);
    const thumb = photo(p.slug);
    const createdAt = new Date(Date.now() - p.daysAgo * 86_400_000);
    await ProductModel.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        category: categoryIds[p.categorySlug],
        brand: brandIds[p.brandSlug],
        shortDescription: p.desc,
        description: p.desc,
        images: [thumb, photo(`${p.slug}-2`)],
        thumbnail: thumb,
        variants: p.variants,
        tags: p.tags,
        status: 'active',
        soldCount: p.soldCount,
        avgRating: 4,
        reviewCount: 0,
        createdAt,
        ...agg,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    productCount += 1;
  }
  console.log(`Products: ${productCount} upserted`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
