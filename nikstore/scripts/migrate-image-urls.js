/**
 * migrate-image-urls.js
 *
 * Strips the absolute hostname from image URLs stored in MongoDB so that
 * records are environment-independent (e.g. /uploads/products/file.webp
 * instead of http://localhost:3000/uploads/products/file.webp).
 *
 * Safe to run multiple times — already-migrated paths are left untouched.
 *
 * Run: node scripts/migrate-image-urls.js [MONGODB_URI]
 *
 * MONGODB_URI defaults to the value in the environment or mongodb://localhost:27017/nikstore
 */

const { MongoClient } = require('mongodb')

const MONGO_URI =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/nikstore'

// Regex: matches any URL that has a protocol+host prefix before /uploads/
const ABS_URL_RE = /^https?:\/\/[^/]+(\/uploads\/.+)$/

/**
 * Strips the protocol+host prefix from a single URL string.
 * Returns the original value unchanged if it is already a relative path or null.
 */
function toRelative(url) {
  if (!url || typeof url !== 'string') return url
  const m = url.match(ABS_URL_RE)
  return m ? m[1] : url
}

/**
 * Migrates a string field on all documents in a collection.
 * @param {import('mongodb').Collection} col
 * @param {string} field
 */
async function migrateStringField(col, field) {
  let updated = 0
  const cursor = col.find({ [field]: { $regex: '^https?://' } })
  for await (const doc of cursor) {
    const newVal = toRelative(doc[field])
    if (newVal !== doc[field]) {
      await col.updateOne({ _id: doc._id }, { $set: { [field]: newVal } })
      updated++
    }
  }
  return updated
}

/**
 * Migrates an array-of-strings field on all documents.
 * @param {import('mongodb').Collection} col
 * @param {string} field
 */
async function migrateArrayField(col, field) {
  let updated = 0
  const cursor = col.find({ [field]: { $elemMatch: { $regex: '^https?://' } } })
  for await (const doc of cursor) {
    const newArr = (doc[field] || []).map(toRelative)
    const changed = newArr.some((v, i) => v !== doc[field][i])
    if (changed) {
      await col.updateOne({ _id: doc._id }, { $set: { [field]: newArr } })
      updated++
    }
  }
  return updated
}

async function run() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log(`[migrate] Connected to ${MONGO_URI.replace(/:\/\/[^@]+@/, '://***@')}`)
  const db = client.db()

  const jobs = [
    // collection name        field         type
    ['products',    'images',         'array'],
    ['products',    'thumbnail',      'string'],
    ['categories',  'image',          'string'],
    ['banners',     'imageUrl',       'string'],
    ['brands',      'logo',           'string'],
    ['blogs',       'featuredImage',  'string'],
    ['popups',      'imageUrl',       'string'],
    ['reviews',     'images',         'array'],
    ['sitesettings','logoUrl',        'string'],
    ['users',       'avatar',         'string'],
    ['orders',      'thumbnail',      'string'],
  ]

  let totalUpdated = 0
  for (const [colName, field, type] of jobs) {
    const col = db.collection(colName)
    const n = type === 'array'
      ? await migrateArrayField(col, field)
      : await migrateStringField(col, field)
    if (n > 0) console.log(`[migrate] ${colName}.${field}: updated ${n} document(s)`)
    totalUpdated += n
  }

  console.log(`[migrate] Done — ${totalUpdated} document(s) updated in total`)
  await client.close()
}

run().catch((err) => {
  console.error('[migrate] Fatal error:', err.message)
  process.exit(1)
})
