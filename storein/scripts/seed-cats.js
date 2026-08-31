/**
 * Seed categories from backup data (preserves exact IDs + slugs)
 * Run from storein/ directory:  node scripts/seed-cats.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storein';

const ID = {
  mardane:              '6a298eff1151570cae42b601',
  mardane_hoodie:       '6a298eff1151570cae42b602',
  mardane_jacket:       '6a298eff1151570cae42b603',
  mardane_pants:        '6a298eff1151570cae42b604',
  mardane_tshirt:       '6a298eff1151570cae42b605',
  mardane_shoes:        '6a298eff1151570cae42b606',
  zanane:               '6a298eff1151570cae42b607',
  zanane_hoodie:        '6a298eff1151570cae42b608',
  zanane_jacket:        '6a298eff1151570cae42b609',
  zanane_pants:         '6a298eff1151570cae42b60a',
  zanane_dress:         '6a298eff1151570cae42b60b',
  zanane_bag:           '6a298eff1151570cae42b60c',
  zanane_shoes:         '6a298eff1151570cae42b60d',
  bachegane:            '6a298eff1151570cae42b60f',
  bachegane_hoodie:     '6a298eff1151570cae42b610',
  bachegane_tshirt:     '6a298eff1151570cae42b611',
  bachegane_pants:      '6a298eff1151570cae42b612',
  bachegane_jacket:     '6a298eff1151570cae42b613',
  bachegane_shoes:      '6a298eff1151570cae42b614',
  accessories:          '6a298eff1151570cae42b615',
  accessories_bag:      '6a298eff1151570cae42b616',
  accessories_belt:     '6a298eff1151570cae42b617',
  accessories_scarf:    '6a298eff1151570cae42b618',
  accessories_backpack: '6a298eff1151570cae42b619',
  sportswear:           '6a298eff1151570cae42b61a',
  sportswear_hoodie:    '6a298eff1151570cae42b61b',
  sportswear_pants:     '6a298eff1151570cae42b61c',
  sportswear_tshirt:    '6a298eff1151570cae42b61d',
  sportswear_shoes:     '6a298eff1151570cae42b61e',
  shoes_limited:        '6a29914622063db883ea8186',
};

function o(key) { return new ObjectId(ID[key]); }

const categories = [
  // roots
  { _id: o('mardane'),    name: 'مردانه',      slug: 'mardane',    icon: '👔', parent: null, ancestors: [], depth: 0, sortOrder: 1 },
  { _id: o('zanane'),     name: 'زنانه',       slug: 'zanane',     icon: '👗', parent: null, ancestors: [], depth: 0, sortOrder: 2 },
  { _id: o('bachegane'),  name: 'بچگانه',      slug: 'bachegane',  icon: '🧒', parent: null, ancestors: [], depth: 0, sortOrder: 3 },
  { _id: o('accessories'),name: 'اکسسوری',     slug: 'accessories', icon: '👜', parent: null, ancestors: [], depth: 0, sortOrder: 4 },
  { _id: o('sportswear'), name: 'پوشاک ورزشی', slug: 'sportswear', icon: '🏃', parent: null, ancestors: [], depth: 0, sortOrder: 5 },
  // مردانه
  { _id: o('mardane_hoodie'), name: 'هودی و سویشرت مردانه',  slug: 'mardane-hoodie',  icon: '', gender: 'men', parent: o('mardane'), ancestors: [o('mardane')], depth: 1, sortOrder: 1 },
  { _id: o('mardane_jacket'), name: 'کاپشن و بارانی مردانه', slug: 'mardane-jacket',  icon: '', gender: 'men', parent: o('mardane'), ancestors: [o('mardane')], depth: 1, sortOrder: 2 },
  { _id: o('mardane_pants'),  name: 'شلوار مردانه',           slug: 'mardane-pants',   icon: '', gender: 'men', parent: o('mardane'), ancestors: [o('mardane')], depth: 1, sortOrder: 3 },
  { _id: o('mardane_tshirt'), name: 'تیشرت و پولوشرت مردانه', slug: 'mardane-tshirt',  icon: '', gender: 'men', parent: o('mardane'), ancestors: [o('mardane')], depth: 1, sortOrder: 4 },
  { _id: o('mardane_shoes'),  name: 'کتانی و کفش مردانه',     slug: 'mardane-shoes',   icon: '', gender: 'men', parent: o('mardane'), ancestors: [o('mardane')], depth: 1, sortOrder: 5 },
  // کتانی و کفش مردانه > لیمیتد ادیشن
  { _id: o('shoes_limited'), name: 'کتانی لیمیتد ادیشن', slug: 'mardane-shoes-limited', icon: '', parent: o('mardane_shoes'), ancestors: [o('mardane'), o('mardane_shoes')], depth: 2, sortOrder: 10 },
  // زنانه
  { _id: o('zanane_hoodie'), name: 'هودی و سویشرت زنانه',  slug: 'zanane-hoodie', icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 1 },
  { _id: o('zanane_jacket'), name: 'کاپشن و بارانی زنانه', slug: 'zanane-jacket', icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 2 },
  { _id: o('zanane_pants'),  name: 'شلوار و لگ زنانه',     slug: 'zanane-pants',  icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 3 },
  { _id: o('zanane_dress'),  name: 'دامن و پیراهن',        slug: 'zanane-dress',  icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 4 },
  { _id: o('zanane_bag'),    name: 'کیف دستی زنانه',       slug: 'zanane-bag',    icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 5 },
  { _id: o('zanane_shoes'),  name: 'کفش و کتانی زنانه',    slug: 'zanane-shoes',  icon: '', gender: 'women', parent: o('zanane'), ancestors: [o('zanane')], depth: 1, sortOrder: 6 },
  // بچگانه
  { _id: o('bachegane_hoodie'), name: 'هودی بچگانه',  slug: 'bachegane-hoodie', icon: '', gender: 'kids', parent: o('bachegane'), ancestors: [o('bachegane')], depth: 1, sortOrder: 1 },
  { _id: o('bachegane_tshirt'), name: 'تیشرت بچگانه', slug: 'bachegane-tshirt', icon: '', gender: 'kids', parent: o('bachegane'), ancestors: [o('bachegane')], depth: 1, sortOrder: 2 },
  { _id: o('bachegane_pants'),  name: 'شلوار بچگانه', slug: 'bachegane-pants',  icon: '', gender: 'kids', parent: o('bachegane'), ancestors: [o('bachegane')], depth: 1, sortOrder: 3 },
  { _id: o('bachegane_jacket'), name: 'کاپشن بچگانه', slug: 'bachegane-jacket', icon: '', gender: 'kids', parent: o('bachegane'), ancestors: [o('bachegane')], depth: 1, sortOrder: 4 },
  { _id: o('bachegane_shoes'),  name: 'کفش بچگانه',   slug: 'bachegane-shoes',  icon: '', gender: 'kids', parent: o('bachegane'), ancestors: [o('bachegane')], depth: 1, sortOrder: 5 },
  // اکسسوری
  { _id: o('accessories_bag'),      name: 'کیف چرم',           slug: 'accessories-bag',      icon: '', parent: o('accessories'), ancestors: [o('accessories')], depth: 1, sortOrder: 1 },
  { _id: o('accessories_belt'),     name: 'کمربند و کلاه',     slug: 'accessories-belt',     icon: '', parent: o('accessories'), ancestors: [o('accessories')], depth: 1, sortOrder: 2 },
  { _id: o('accessories_scarf'),    name: 'شال و روسری',       slug: 'accessories-scarf',    icon: '', parent: o('accessories'), ancestors: [o('accessories')], depth: 1, sortOrder: 3 },
  { _id: o('accessories_backpack'), name: 'کیف مدرسه و پشتی', slug: 'accessories-backpack', icon: '', parent: o('accessories'), ancestors: [o('accessories')], depth: 1, sortOrder: 4 },
  // پوشاک ورزشی
  { _id: o('sportswear_hoodie'), name: 'هودی ورزشی',           slug: 'sportswear-hoodie', icon: '', parent: o('sportswear'), ancestors: [o('sportswear')], depth: 1, sortOrder: 1 },
  { _id: o('sportswear_pants'),  name: 'شلوار اسلیم ورزشی',    slug: 'sportswear-pants',  icon: '', parent: o('sportswear'), ancestors: [o('sportswear')], depth: 1, sortOrder: 2 },
  { _id: o('sportswear_tshirt'), name: 'تیشرت ورزشی',          slug: 'sportswear-tshirt', icon: '', parent: o('sportswear'), ancestors: [o('sportswear')], depth: 1, sortOrder: 3 },
  { _id: o('sportswear_shoes'),  name: 'کتانی اسپرت',          slug: 'sportswear-shoes',  icon: '', parent: o('sportswear'), ancestors: [o('sportswear')], depth: 1, sortOrder: 4 },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('categories');
  const now = new Date();

  let inserted = 0, skipped = 0;
  for (const cat of categories) {
    const exists = await col.findOne({ slug: cat.slug });
    if (exists) { skipped++; continue; }
    await col.insertOne({ ...cat, isActive: true, createdAt: now, updatedAt: now });
    inserted++;
  }
  console.log(`Categories: inserted ${inserted}, skipped ${skipped} (total ${categories.length})`);
  await client.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
