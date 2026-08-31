/**
 * seed-categories.js
 * Run: node scripts/seed-categories.js
 */
const { MongoClient, ObjectId } = require('mongodb')

const MONGO_URI = 'mongodb://localhost:27017/storein'

const slugify = (str) =>
  str
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9؀-ۿ-]/g, '')
    .toLowerCase()

// ── Category tree ─────────────────────────────────────────────────────────────
// Each root entry may have a `children` array
const TREE = [
  {
    name: 'مردانه',
    slug: 'mardane',
    icon: '👔',
    sortOrder: 1,
    children: [
      { name: 'هودی و سویشرت مردانه',   slug: 'mardane-hoodie',       sortOrder: 1 },
      { name: 'کاپشن و بارانی مردانه',  slug: 'mardane-jacket',       sortOrder: 2 },
      { name: 'شلوار مردانه',           slug: 'mardane-pants',        sortOrder: 3 },
      { name: 'تیشرت و پولوشرت مردانه', slug: 'mardane-tshirt',       sortOrder: 4 },
      { name: 'کتانی و کفش مردانه',     slug: 'mardane-shoes',        sortOrder: 5 },
      { name: 'اکسسوری مردانه',         slug: 'mardane-accessories',  sortOrder: 6 },
    ],
  },
  {
    name: 'زنانه',
    slug: 'zanane',
    icon: '👗',
    sortOrder: 2,
    children: [
      { name: 'هودی و سویشرت زنانه',  slug: 'zanane-hoodie',  sortOrder: 1 },
      { name: 'کاپشن و بارانی زنانه', slug: 'zanane-jacket',  sortOrder: 2 },
      { name: 'شلوار و لگ زنانه',     slug: 'zanane-pants',   sortOrder: 3 },
      { name: 'تیشرت و بلوز زنانه',   slug: 'zanane-tshirt',  sortOrder: 4 },
      { name: 'دامن و پیراهن',        slug: 'zanane-dress',   sortOrder: 5 },
      { name: 'کیف دستی زنانه',       slug: 'zanane-bag',     sortOrder: 6 },
      { name: 'کفش و کتانی زنانه',    slug: 'zanane-shoes',   sortOrder: 7 },
    ],
  },
  {
    name: 'بچگانه',
    slug: 'bachegane',
    icon: '🧒',
    sortOrder: 3,
    children: [
      { name: 'هودی بچگانه',    slug: 'bachegane-hoodie',       sortOrder: 1 },
      { name: 'تیشرت بچگانه',   slug: 'bachegane-tshirt',       sortOrder: 2 },
      { name: 'شلوار بچگانه',   slug: 'bachegane-pants',        sortOrder: 3 },
      { name: 'کاپشن بچگانه',   slug: 'bachegane-jacket',       sortOrder: 4 },
      { name: 'کفش بچگانه',     slug: 'bachegane-shoes',        sortOrder: 5 },
      { name: 'اکسسوری بچگانه', slug: 'bachegane-accessories',  sortOrder: 6 },
    ],
  },
]

async function seed() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('✅ Connected to MongoDB')

  const db  = client.db()
  const col = db.collection('categories')

  // Clear existing categories
  const existing = await col.countDocuments()
  if (existing > 0) {
    await col.deleteMany({})
    console.log(`🗑️  Cleared ${existing} existing categories`)
  }

  const now = new Date()
  const docs = []

  for (const root of TREE) {
    const rootId = new ObjectId()
    docs.push({
      _id:       rootId,
      name:      root.name,
      slug:      root.slug,
      icon:      root.icon ?? '',
      parent:    null,
      ancestors: [],
      depth:     0,
      sortOrder: root.sortOrder,
      isActive:  true,
      createdAt: now,
      updatedAt: now,
    })

    for (const child of (root.children ?? [])) {
      const childId = new ObjectId()
      docs.push({
        _id:       childId,
        name:      child.name,
        slug:      child.slug,
        icon:      child.icon ?? '',
        parent:    rootId,
        ancestors: [rootId],
        depth:     1,
        sortOrder: child.sortOrder,
        isActive:  true,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  await col.insertMany(docs)

  const roots    = docs.filter(d => d.depth === 0).length
  const children = docs.filter(d => d.depth === 1).length
  console.log(`✅ Inserted ${docs.length} categories: ${roots} root, ${children} subcategories`)

  for (const root of docs.filter(d => d.depth === 0)) {
    const subs = docs.filter(d => d.parent?.toString() === root._id.toString())
    console.log(`  📁 ${root.name} (${subs.length} زیردسته)`)
    for (const s of subs) console.log(`     └─ ${s.name}`)
  }

  await client.close()
  console.log('\n🎉 Done!')
}

seed().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
