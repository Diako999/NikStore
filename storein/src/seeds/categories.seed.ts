/**
 * Seed the gender > product-type category taxonomy.
 * Run: npx ts-node -r tsconfig-paths/register src/seeds/categories.seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/storein';

const CategorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    ancestors:   { type: [mongoose.Schema.Types.ObjectId], ref: 'Category', default: [] },
    depth:       { type: Number, default: 0 },
    description: { type: String, trim: true },
    icon:        { type: String },
    image:       { type: String },
    sortOrder:   { type: Number, default: 0 },
    gender:      { type: String, enum: ['', 'men', 'women', 'kids', 'unisex'], default: '' },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true },
);

interface GenderNode {
  name: string;
  slug: string;
  gender: 'women' | 'men' | 'kids';
  sortOrder: number;
  children: { name: string; slug: string; sortOrder: number }[];
}

const taxonomy: GenderNode[] = [
  {
    name: 'زنانه', slug: 'women', gender: 'women', sortOrder: 1,
    children: [
      { name: 'شومیز', slug: 'women-blouse', sortOrder: 1 },
      { name: 'پیراهن', slug: 'women-dress', sortOrder: 2 },
      { name: 'شلوار', slug: 'women-pants', sortOrder: 3 },
      { name: 'کت', slug: 'women-coat', sortOrder: 4 },
      { name: 'تیشرت', slug: 'women-tshirt', sortOrder: 5 },
      { name: 'دامن', slug: 'women-skirt', sortOrder: 6 },
    ],
  },
  {
    name: 'مردانه', slug: 'men', gender: 'men', sortOrder: 2,
    children: [
      { name: 'پیراهن', slug: 'men-shirt', sortOrder: 1 },
      { name: 'شلوار', slug: 'men-pants', sortOrder: 2 },
      { name: 'کت', slug: 'men-coat', sortOrder: 3 },
      { name: 'تیشرت', slug: 'men-tshirt', sortOrder: 4 },
    ],
  },
  {
    name: 'بچگانه', slug: 'kids', gender: 'kids', sortOrder: 3,
    children: [
      { name: 'تیشرت', slug: 'kids-tshirt', sortOrder: 1 },
      { name: 'شلوار', slug: 'kids-pants', sortOrder: 2 },
      { name: 'ژاکت', slug: 'kids-jacket', sortOrder: 3 },
      { name: 'پیراهن', slug: 'kids-dress', sortOrder: 4 },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const CategoryModel = mongoose.model('Category', CategorySchema);

  let created = 0;
  let skipped = 0;

  for (const node of taxonomy) {
    let parent = await CategoryModel.findOne({ slug: node.slug });
    if (parent) {
      console.log(`  ⏭  Skipped: "${node.name}" (slug already exists)`);
      skipped++;
    } else {
      parent = await CategoryModel.create({
        name:      node.name,
        slug:      node.slug,
        parent:    null,
        ancestors: [],
        depth:     0,
        gender:    node.gender,
        sortOrder: node.sortOrder,
        isActive:  true,
      });
      console.log(`  ✓  Created: "${node.name}" (top-level, gender=${node.gender})`);
      created++;
    }

    for (const child of node.children) {
      const exists = await CategoryModel.findOne({ slug: child.slug });
      if (exists) {
        console.log(`      ⏭  Skipped: "${child.name}" under "${node.name}" (slug already exists)`);
        skipped++;
        continue;
      }
      await CategoryModel.create({
        name:      child.name,
        slug:      child.slug,
        parent:    parent._id,
        ancestors: [parent._id],
        depth:     1,
        gender:    node.gender,
        sortOrder: child.sortOrder,
        isActive:  true,
      });
      console.log(`      ✓  Created: "${child.name}" under "${node.name}"`);
      created++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
