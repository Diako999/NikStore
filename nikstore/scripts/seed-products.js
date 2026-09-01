/**
 * seed-products.js
 * Run from nikstore/: node scripts/seed-products.js
 *
 * 1. Converts JPG photos from docs/photo → uploads/products (WebP)
 * 2. Inserts 10 product documents into MongoDB
 */
const { MongoClient, ObjectId } = require('mongodb')
const sharp  = require('sharp')
const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')

const MONGO_URI   = 'mongodb://localhost:27017/nikstore'
const PHOTOS_DIR  = path.resolve(__dirname, '../../docs/photo')
const UPLOADS_DIR = path.resolve(__dirname, '../uploads/products')
const BASE_URL    = 'http://localhost:3000'

// ── Photo groups (50 images, 5 per product) ───────────────────────────────────
const PHOTO_GROUPS = [
  ['IMG_1538.jpg','IMG_1539.jpg','IMG_15391.jpg','IMG_1542.jpg','IMG_1545.jpg'],
  ['IMG_1546.jpg','IMG_3760.jpg','IMG_3760 (1).jpg','IMG_3761.jpg','IMG_3789.jpg'],
  ['IMG_4483.jpg','IMG_5660.jpg','IMG_5680.jpg','IMG_5684.jpg','IMG_5699.jpg'],
  ['IMG_5713.jpg','IMG_5726.jpg','IMG_5733.jpg','IMG_5733 (1).jpg','IMG_5736.jpg'],
  ['IMG_700140.jpg','IMG_700142.jpg','IMG_7117.jpg','IMG_7120.jpg','IMG_7139.jpg'],
  ['IMG_7140.jpg','IMG_714002.jpg','IMG_7142.jpg','IMG_7148.jpg','IMG_7151.jpg'],
  ['IMG_7152.jpg','IMG_7247.jpg','IMG_8345.jpg','IMG_900794.jpg','IMG_97368.jpg'],
  ['IMG_9768.jpg','IMG_9768 (1).jpg','IMG_9768 (2).jpg','IMG_9775-1.jpg','IMG_9783334.jpg'],
  ['IMG_97834.jpg','IMG_9784.jpg','IMG_9785.jpg','IMG_9793.jpg','IMG_9793 (1).jpg'],
  ['IMG_9794.jpg','IMG_9798.jpg','IMG_9800.jpg','IMG_9800142.jpg','IMG_9801.jpg'],
]

// ── Convert one JPG → WebP, save to uploads/products ─────────────────────────
async function convertAndSave(filename) {
  const src = path.join(PHOTOS_DIR, filename)
  const id  = crypto.randomUUID()

  const buf = await sharp(src)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const dest = path.join(UPLOADS_DIR, `${id}.webp`)
  fs.writeFileSync(dest, buf)

  const thumbBuf = await sharp(src)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer()

  fs.writeFileSync(path.join(UPLOADS_DIR, `${id}_thumb.webp`), thumbBuf)

  return `${BASE_URL}/uploads/products/${id}.webp`
}

// ── Variant builder helpers ───────────────────────────────────────────────────
function makeVariant(attrs, price, comparePrice, stock, sku) {
  return {
    _id:          new ObjectId(),
    sku,
    price,
    comparePrice: comparePrice ?? null,
    stock,
    attributes:   attrs,
    isActive:     true,
  }
}

// ── Product definitions (category slug → filled in at runtime) ────────────────
const PRODUCT_DEFS = [
  {
    name:  'هودی پرفورمنس مردانه',
    slug:  'hoodie-performance-mardane',
    catSlug: 'mardane-hoodie',
    shortDescription: 'هودی پرفورمنس مردانه با پارچه ضدعرق و طراحی اسپرت',
    description: 'هودی پرفورمنس مردانه از پارچه پلی‌استر ضدعرق با تهویه بالا، مناسب برای تمرین و استفاده روزمره. دارای کلاه تنظیم‌پذیر و جیب کانگرویی.',
    tags: ['هودی', 'پرفورمنس', 'مردانه', 'ورزشی', 'اسپرت'],
    specs: [
      { key: 'جنس پارچه', value: 'پلی‌استر ضدعرق' },
      { key: 'برش',      value: 'رگولار' },
      { key: 'کلاه',      value: 'تنظیم‌پذیر بنددار' },
      { key: 'وزن',      value: '450', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'مشکی' }], 890_000, 1_050_000, 20, 'HD-PRF-M-BLK'),
      makeVariant([{ key: 'سایز', value: 'L' }, { key: 'رنگ', value: 'مشکی' }], 890_000, 1_050_000, 15, 'HD-PRF-L-BLK'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'طوسی' }], 890_000, 1_050_000, 12, 'HD-PRF-M-GRY'),
    ],
    weight: 450,
    sortOrder: 1,
  },
  {
    name:  'کاپشن بادی زنانه',
    slug:  'jacket-windbreaker-zanane',
    catSlug: 'zanane-jacket',
    shortDescription: 'کاپشن بادی زنانه ضدآب با طراحی سبک و مدرن',
    description: 'کاپشن بادی زنانه از پارچه ضدآب و بادگیر با آستر توری تنفس‌پذیر. مناسب برای فصل بهار و پاییز، دارای کلاه جداشونده و زیپ مخفی.',
    tags: ['کاپشن', 'بادی', 'زنانه', 'ضدآب', 'بهاره'],
    specs: [
      { key: 'جنس',  value: 'نایلون ضدآب' },
      { key: 'آستر', value: 'توری تنفس‌پذیر' },
      { key: 'کلاه', value: 'جداشونده' },
      { key: 'وزن',  value: '380', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'S' }, { key: 'رنگ', value: 'صورتی' }], 1_450_000, 1_700_000, 10, 'JKT-WB-S-PNK'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'صورتی' }], 1_450_000, 1_700_000, 14, 'JKT-WB-M-PNK'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'سرمه‌ای' }], 1_450_000, 1_700_000,  9, 'JKT-WB-M-NVY'),
    ],
    weight: 380,
    sortOrder: 2,
  },
  {
    name:  'کتانی اسپرت مردانه',
    slug:  'sneaker-sport-mardane',
    catSlug: 'mardane-shoes',
    shortDescription: 'کتانی اسپرت مردانه سبک با کفی طبی',
    description: 'کتانی اسپرت مردانه با رویه مش تنفس‌پذیر، کفی طبی ضربه‌گیر و بندهای الاستیک. مناسب برای دویدن و استفاده روزمره.',
    tags: ['کتانی', 'اسپرت', 'مردانه', 'ورزشی', 'راحتی'],
    specs: [
      { key: 'رویه', value: 'مش تنفس‌پذیر' },
      { key: 'کفی',  value: 'ضربه‌گیر EVA' },
      { key: 'بست',  value: 'بندی الاستیک' },
      { key: 'وزن',  value: '620', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: '42' }, { key: 'رنگ', value: 'مشکی/سفید' }], 1_950_000, 2_300_000, 18, 'SNK-42-BLKWHT'),
      makeVariant([{ key: 'سایز', value: '43' }, { key: 'رنگ', value: 'مشکی/سفید' }], 1_950_000, 2_300_000, 20, 'SNK-43-BLKWHT'),
      makeVariant([{ key: 'سایز', value: '44' }, { key: 'رنگ', value: 'طوسی' }],       1_950_000, 2_300_000, 13, 'SNK-44-GRY'),
    ],
    weight: 620,
    sortOrder: 3,
  },
  {
    name:  'کاپشن چرم لاکچری مردانه',
    slug:  'jacket-leather-luxury-mardane',
    catSlug: 'mardane-jacket',
    shortDescription: 'کاپشن چرم طبیعی لاکچری با طراحی ایتالیایی',
    description: 'کاپشن چرم طبیعی مردانه ساخت ایتالیا با آستر ابریشمی و دکمه‌های فلزی دست‌ساز. برای افرادی که کیفیت و استایل را در اولویت قرار می‌دهند.',
    tags: ['کاپشن', 'چرم', 'لاکچری', 'ایتالیا', 'مردانه'],
    specs: [
      { key: 'جنس',  value: 'چرم طبیعی گاوی' },
      { key: 'آستر', value: 'ابریشم مصنوعی' },
      { key: 'ساخت', value: 'ایتالیا' },
      { key: 'وزن',  value: '900', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'L' }, { key: 'رنگ', value: 'مشکی' }],    7_800_000, 9_200_000, 4, 'JKT-LTH-L-BLK'),
      makeVariant([{ key: 'سایز', value: 'L' }, { key: 'رنگ', value: 'قهوه‌ای' }], 7_800_000, 9_200_000, 3, 'JKT-LTH-L-BRN'),
    ],
    weight: 900,
    sortOrder: 4,
  },
  {
    name:  'شلوار کتان اسلیم مردانه',
    slug:  'pants-slim-cotton-mardane',
    catSlug: 'mardane-pants',
    shortDescription: 'شلوار کتان اسلیم مردانه با پارچه نخی مرغوب',
    description: 'شلوار کتان اسلیم‌فیت مردانه از پارچه نخی سبک با کشسانی مناسب. طراحی مینیمال، مناسب برای محیط کار و استفاده روزمره.',
    tags: ['شلوار', 'کتان', 'اسلیم', 'مردانه', 'نخی'],
    specs: [
      { key: 'جنس',      value: 'نخی کتان' },
      { key: 'برش',      value: 'اسلیم‌فیت' },
      { key: 'کشسانی',   value: 'دارد' },
      { key: 'وزن',      value: '420', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: '32' }, { key: 'رنگ', value: 'بژ' }],       980_000, 1_150_000, 10, 'PNT-32-BEG'),
      makeVariant([{ key: 'سایز', value: '34' }, { key: 'رنگ', value: 'بژ' }],       980_000, 1_150_000,  8, 'PNT-34-BEG'),
      makeVariant([{ key: 'سایز', value: '34' }, { key: 'رنگ', value: 'سرمه‌ای' }], 980_000, 1_150_000,  6, 'PNT-34-NVY'),
    ],
    weight: 420,
    sortOrder: 5,
  },
  {
    name:  'تیشرت یقه گرد بیسیک زنانه',
    slug:  'tshirt-basic-crewneck-zanane',
    catSlug: 'zanane-tshirt',
    shortDescription: 'تیشرت یقه گرد بیسیک زنانه از نخ ترک مرغوب',
    description: 'تیشرت بیسیک یقه گرد زنانه با پارچه نخی نرم و برش راحت. مناسب برای ست کردن با هر نوع لباس، در چند رنگ پرکاربرد.',
    tags: ['تیشرت', 'بیسیک', 'زنانه', 'یقه گرد', 'نخی'],
    specs: [
      { key: 'جنس', value: 'نخ ترک' },
      { key: 'یقه', value: 'گرد' },
      { key: 'برش', value: 'رگولار' },
      { key: 'وزن', value: '180', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'سفید' }], 420_000, 500_000, 25, 'TSH-M-WHT'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'مشکی' }], 420_000, 500_000, 22, 'TSH-M-BLK'),
      makeVariant([{ key: 'سایز', value: 'L' }, { key: 'رنگ', value: 'مشکی' }], 420_000, 500_000, 18, 'TSH-L-BLK'),
    ],
    weight: 180,
    sortOrder: 6,
  },
  {
    name:  'دامن پلیسه زنانه',
    slug:  'skirt-pleated-zanane',
    catSlug: 'zanane-dress',
    shortDescription: 'دامن پلیسه زنانه با طراحی شیک و مدرن',
    description: 'دامن پلیسه زنانه با پارچه ریزشی و کمر کشی راحت. مناسب برای استفاده روزمره و مهمانی، در طول زانو.',
    tags: ['دامن', 'پلیسه', 'زنانه', 'شیک'],
    specs: [
      { key: 'جنس', value: 'کرپ ریزشی' },
      { key: 'طول', value: 'زیر زانو' },
      { key: 'کمر', value: 'کشی' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'S' }, { key: 'رنگ', value: 'مشکی' }], 650_000, 780_000, 12, 'SKT-S-BLK'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'مشکی' }], 650_000, 780_000,  9, 'SKT-M-BLK'),
      makeVariant([{ key: 'سایز', value: 'M' }, { key: 'رنگ', value: 'قرمز' }], 650_000, 780_000,  7, 'SKT-M-RED'),
    ],
    weight: 250,
    sortOrder: 7,
  },
  {
    name:  'کیف دستی چرم زنانه',
    slug:  'bag-leather-handbag-zanane',
    catSlug: 'zanane-bag',
    shortDescription: 'کیف دستی چرم طبیعی زنانه با طراحی کلاسیک',
    description: 'کیف دستی زنانه از چرم طبیعی گاوی با آستر پارچه‌ای و جیب‌های داخلی متعدد. مناسب برای استفاده روزانه و مناسبت‌های رسمی.',
    tags: ['کیف', 'چرم', 'زنانه', 'دستی', 'کلاسیک'],
    specs: [
      { key: 'جنس',  value: 'چرم طبیعی' },
      { key: 'آستر', value: 'پارچه‌ای' },
      { key: 'ابعاد', value: '32×24×12', unit: 'سانتی‌متر' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'مشکی' }],    1_250_000, 1_500_000, 15, 'BAG-LTH-BLK'),
      makeVariant([{ key: 'رنگ', value: 'قهوه‌ای' }], 1_250_000, 1_500_000, 11, 'BAG-LTH-BRN'),
      makeVariant([{ key: 'رنگ', value: 'کرم' }],     1_350_000, 1_600_000,  8, 'BAG-LTH-CRM'),
    ],
    weight: 600,
    sortOrder: 8,
  },
  {
    name:  'هودی بچگانه رنگی',
    slug:  'hoodie-colorful-bachegane',
    catSlug: 'bachegane-hoodie',
    shortDescription: 'هودی بچگانه رنگارنگ با پارچه نرم و راحت',
    description: 'هودی بچگانه از پارچه پنبه‌ای ترکیبی نرم با طرح‌های رنگارنگ و کلاه دوگوش. مناسب برای فعالیت روزمره و بازی کودکان.',
    tags: ['هودی', 'بچگانه', 'رنگی', 'نخی'],
    specs: [
      { key: 'جنس', value: 'پنبه ترکیبی' },
      { key: 'کلاه', value: 'دوگوش' },
      { key: 'وزن', value: '280', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: '6-7 سال' }, { key: 'رنگ', value: 'زرد' }], 520_000, 620_000, 20, 'KID-HD-67-YLW'),
      makeVariant([{ key: 'سایز', value: '8-9 سال' }, { key: 'رنگ', value: 'آبی' }], 540_000, 640_000, 16, 'KID-HD-89-BLU'),
    ],
    weight: 280,
    sortOrder: 9,
  },
  {
    name:  'کفش کتانی بچگانه',
    slug:  'sneaker-kids-bachegane',
    catSlug: 'bachegane-shoes',
    shortDescription: 'کفش کتانی بچگانه سبک با چراغ‌دار پاشنه',
    description: 'کفش کتانی بچگانه با چراغ LED در پاشنه، رویه مقاوم و کفی ضدلغزش. مناسب برای مهدکودک و بازی در فضای باز.',
    tags: ['کفش', 'کتانی', 'بچگانه', 'چراغ‌دار'],
    specs: [
      { key: 'رویه', value: 'مقاوم ضدآب' },
      { key: 'کفی',  value: 'ضدلغزش' },
      { key: 'ویژگی', value: 'چراغ LED پاشنه' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: '28' }, { key: 'رنگ', value: 'قرمز' }], 620_000, 720_000, 14, 'KID-SHO-28-RED'),
      makeVariant([{ key: 'سایز', value: '30' }, { key: 'رنگ', value: 'آبی' }],  640_000, 740_000, 12, 'KID-SHO-30-BLU'),
    ],
    weight: 320,
    sortOrder: 10,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  // Ensure uploads dir exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })

  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('✅ Connected to MongoDB')

  const db       = client.db()
  const catCol   = db.collection('categories')
  const prodCol  = db.collection('products')

  // Load category slug → _id map
  const cats = await catCol.find({}, { projection: { slug: 1 } }).toArray()
  const catMap = {}
  for (const c of cats) catMap[c.slug] = c._id

  console.log(`📂 Found ${cats.length} categories`)

  // Check for missing categories
  const missing = PRODUCT_DEFS.filter(p => !catMap[p.catSlug]).map(p => p.catSlug)
  if (missing.length) {
    console.warn('⚠️  Missing categories (will skip those products):', missing)
  }

  // Remove existing seeded products (by slug)
  const slugs = PRODUCT_DEFS.map(p => p.slug)
  const deleted = await prodCol.deleteMany({ slug: { $in: slugs } })
  if (deleted.deletedCount) console.log(`🗑️  Removed ${deleted.deletedCount} existing seed products`)

  // Process each product
  const now  = new Date()
  const docs = []

  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const def = PRODUCT_DEFS[i]
    const catId = catMap[def.catSlug]
    if (!catId) { console.warn(`⚠️  Skipping "${def.name}" — category "${def.catSlug}" not found`); continue }

    process.stdout.write(`📸 Processing product ${i + 1}/10: ${def.name} ... `)

    // Convert images for this product
    const imageUrls = []
    for (const filename of PHOTO_GROUPS[i]) {
      const src = path.join(PHOTOS_DIR, filename)
      if (!fs.existsSync(src)) {
        console.warn(`\n   ⚠️  Photo not found: ${filename}, skipping`)
        continue
      }
      try {
        const url = await convertAndSave(filename)
        imageUrls.push(url)
      } catch (err) {
        console.warn(`\n   ⚠️  Failed to convert ${filename}: ${err.message}`)
      }
    }

    const thumbnail = imageUrls[0]?.replace('.webp', '_thumb.webp') ?? null

    // Compute min/max price + total stock from variants
    const prices = def.variants.map(v => v.price)
    const minPrice   = Math.min(...prices)
    const maxPrice   = Math.max(...prices)
    const totalStock = def.variants.reduce((s, v) => s + v.stock, 0)

    docs.push({
      _id:              new ObjectId(),
      name:             def.name,
      slug:             def.slug,
      category:         catId,
      shortDescription: def.shortDescription,
      description:      def.description,
      images:           imageUrls,
      thumbnail,
      specs:            def.specs,
      variants:         def.variants,
      minPrice,
      maxPrice,
      totalStock,
      tags:             def.tags,
      weight:           def.weight,
      status:           'active',
      viewCount:        Math.floor(Math.random() * 300),
      soldCount:        Math.floor(Math.random() * 80),
      avgRating:        +(3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount:      Math.floor(Math.random() * 30),
      createdAt:        now,
      updatedAt:        now,
    })

    console.log(`✅ ${imageUrls.length} images`)
  }

  if (docs.length === 0) {
    console.error('❌ No products to insert')
    await client.close()
    return
  }

  await prodCol.insertMany(docs)
  console.log(`\n🎉 Inserted ${docs.length} products:`)
  for (const d of docs) {
    console.log(`  📦 ${d.name}  [${d.images.length} imgs | min: ${d.minPrice.toLocaleString()} تومان | stock: ${d.totalStock}]`)
  }

  await client.close()
  console.log('\n✅ Done!')
}

seed().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
