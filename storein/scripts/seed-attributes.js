/**
 * Seed colors
 * Run from storein/ directory:  node scripts/seed-attributes.js
 */
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storein';

const colors = [
  { name: 'صورتی',       hex: '#FFC0CB', isActive: true, sortOrder: 0 },
  { name: 'زرد',         hex: '#FED049', isActive: true, sortOrder: 1 },
  { name: 'بنفش',        hex: '#800080', isActive: true, sortOrder: 2 },
  { name: 'آبی',         hex: '#2563EB', isActive: true, sortOrder: 3 },
  { name: 'عسلی',        hex: '#C4830A', isActive: true, sortOrder: 4 },
  { name: 'مشکی',        hex: '#000000', isActive: true, sortOrder: 5 },
  { name: 'طلایی',       hex: '#D4AF37', isActive: true, sortOrder: 6 },
  { name: 'خاکستری',     hex: '#6B7280', isActive: true, sortOrder: 7 },
  { name: 'سبز',         hex: '#16A34A', isActive: true, sortOrder: 8 },
  { name: 'نقره‌ای', hex: '#C0C0C0', isActive: true, sortOrder: 9 },
  { name: 'مسی',         hex: '#B87333', isActive: true, sortOrder: 10 },
  { name: 'آبی اقیانوسی', hex: '#0284C7', isActive: true, sortOrder: 11 },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const now = new Date();

  // ── Colors ──────────────────────────────────────────────────────────────────
  let colorsInserted = 0, colorsSkipped = 0;
  for (const c of colors) {
    const exists = await db.collection('colors').findOne({ name: c.name });
    if (exists) { colorsSkipped++; continue; }
    await db.collection('colors').insertOne({ ...c, createdAt: now, updatedAt: now });
    colorsInserted++;
  }
  console.log(`Colors:          inserted ${colorsInserted}, skipped ${colorsSkipped}`);

  await client.close();
  console.log('\nDone!');
}

main().catch(err => { console.error(err); process.exit(1); });
