import { MongoClient } from 'mongodb'

const URI = 'mongodb://localhost:27017/nikstore'

const FRAME_SHAPES = [
  { type: 'frameShape', label: 'گرد',       value: 'round',       icon: '⭕', isActive: true, sortOrder: 0 },
  { type: 'frameShape', label: 'مربعی',      value: 'square',      icon: '🔲', isActive: true, sortOrder: 1 },
  { type: 'frameShape', label: 'بیضی',       value: 'oval',        icon: '🥚', isActive: true, sortOrder: 2 },
  { type: 'frameShape', label: 'مستطیلی',    value: 'rectangular', icon: '▬',  isActive: true, sortOrder: 3 },
  { type: 'frameShape', label: 'پایلوت',     value: 'aviator',     icon: '✈️', isActive: true, sortOrder: 4 },
  { type: 'frameShape', label: 'گربه‌ای',    value: 'cat-eye',     icon: '😼', isActive: true, sortOrder: 5 },
  { type: 'frameShape', label: 'هشت‌ضلعی',  value: 'octagonal',   icon: '🔷', isActive: true, sortOrder: 6 },
  { type: 'frameShape', label: 'بی‌فریم',    value: 'rimless',     icon: '💎', isActive: true, sortOrder: 7 },
]

const FRAME_MATERIALS = [
  { type: 'frameMaterial', label: 'استیل',    value: 'steel',    icon: '🔩', isActive: true, sortOrder: 0 },
  { type: 'frameMaterial', label: 'تیتانیوم', value: 'titanium', icon: '🪖', isActive: true, sortOrder: 1 },
  { type: 'frameMaterial', label: 'استات',    value: 'acetate',  icon: '🎭', isActive: true, sortOrder: 2 },
  { type: 'frameMaterial', label: 'TR90',      value: 'tr90',     icon: '🧬', isActive: true, sortOrder: 3 },
  { type: 'frameMaterial', label: 'کربن',     value: 'carbon',   icon: '🖤', isActive: true, sortOrder: 4 },
]

async function seed() {
  const client = new MongoClient(URI)
  await client.connect()
  const db  = client.db()
  const col = db.collection('frameattributes')

  const now = new Date()
  const docs = [...FRAME_SHAPES, ...FRAME_MATERIALS].map(d => ({ ...d, createdAt: now, updatedAt: now }))

  let inserted = 0, skipped = 0
  for (const doc of docs) {
    try {
      await col.insertOne(doc)
      console.log(`✓ ${doc.label} (${doc.value})`)
      inserted++
    } catch (e) {
      if (e.code === 11000) {
        console.log(`– ${doc.label} already exists, skipped`)
        skipped++
      } else throw e
    }
  }

  console.log(`\nدone: ${inserted} inserted, ${skipped} skipped`)
  await client.close()
}

seed().catch(e => { console.error(e); process.exit(1) })
