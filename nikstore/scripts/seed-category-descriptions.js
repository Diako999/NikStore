/**
 * Update category descriptions with SEO-optimized Persian text
 * Run from nikstore/ directory:  node scripts/seed-category-descriptions.js
 */
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nikstore';

const descriptions = [
  // ── roots ──────────────────────────────────────────────────────────────────
  {
    slug: 'mardane',
    description: 'خرید پوشاک مردانه با کیفیت و برندهای معتبر. مجموعه کامل هودی، کاپشن، شلوار، تیشرت و کتانی مردانه با قیمت مناسب و گارانتی اصالت کالا.',
  },
  {
    slug: 'zanane',
    description: 'خرید پوشاک زنانه با طراحی‌های روز و متنوع. از هودی و کاپشن گرفته تا دامن، پیراهن و کیف دستی، با گزینه‌های شیک و باکیفیت.',
  },
  {
    slug: 'bachegane',
    description: 'خرید پوشاک بچگانه راحت و باکیفیت برای فعالیت روزمره کودکان. هودی، تیشرت، شلوار و کفش با پارچه نرم و طرح‌های شاد و رنگارنگ.',
  },
  {
    slug: 'accessories',
    description: 'اکسسوری‌های پوشاک شامل کیف چرم، کمربند، کلاه، شال و کیف مدرسه. تکمیل استایل روزانه شما با لوازم جانبی باکیفیت استورین.',
  },
  {
    slug: 'sportswear',
    description: 'خرید پوشاک ورزشی راحت و تنفس‌پذیر برای تمرین و فعالیت روزمره. هودی، شلوار اسلیم، تیشرت و کتانی اسپرت از برندهای معتبر.',
  },

  // ── مردانه ──────────────────────────────────────────────────────────
  {
    slug: 'mardane-hoodie',
    description: 'هودی و سویشرت مردانه با طراحی مدرن و راحت. پارچه نخی گرم و کیفیت بالا برای هر مناسبت، با مناسب‌ترین قیمت‌ها.',
  },
  {
    slug: 'mardane-jacket',
    description: 'کاپشن و بارانی مردانه با جدیدترین طرح‌های روز دنیا. محافظت کامل در برابر سرما و باران با گزینه‌های شیک و کاربردی.',
  },
  {
    slug: 'mardane-pants',
    description: 'شلوار مردانه با برش اسلیم و کلاسیک. پارچه‌های نخی و کتان مقاوم و راحت، مناسب برای محیط کار و استفاده روزمره.',
  },
  {
    slug: 'mardane-tshirt',
    description: 'تیشرت و پولوشرت مردانه با پارچه نخی نرم و برش راحت. طیف گسترده‌ای از رنگ‌ها و طرح‌ها برای استایل روزانه.',
  },
  {
    slug: 'mardane-shoes',
    description: 'کتانی و کفش مردانه مخصوص فعالیت روزمره و ورزش. طراحی سبک، کفی راحت و دوام بالا برای دویدن و پیاده‌روی.',
  },
  {
    slug: 'mardane-shoes-limited',
    description: 'کتانی لیمیتد ادیشن مردانه با طراحی خلاقانه و تیراژ محدود. ایده‌آل برای افرادی که می‌خواهند متفاوت باشند.',
  },

  // ── زنانه ─────────────────────────────────────────────────────────────────
  {
    slug: 'zanane-hoodie',
    description: 'هودی و سویشرت زنانه با فیت راحت و طرح‌های ظریف. مناسب برای استفاده روزانه با کیفیت پارچه بالا.',
  },
  {
    slug: 'zanane-jacket',
    description: 'کاپشن و بارانی زنانه با طراحی سبک و مدرن. ترکیب زیبایی و گرمای کافی با گزینه‌های رنگارنگ و شیک.',
  },
  {
    slug: 'zanane-pants',
    description: 'شلوار و لگ زنانه با کشسانی و راحتی بالا. مناسب برای ورزش، کار و استفاده روزمره با طرح‌های متنوع.',
  },
  {
    slug: 'zanane-dress',
    description: 'دامن و پیراهن زنانه با طراحی‌های شیک و به‌روز. انتخاب ایده‌آل برای مهمانی‌ها و استفاده روزمره.',
  },
  {
    slug: 'zanane-bag',
    description: 'کیف دستی زنانه از بهترین جنس‌ها با طراحی کلاسیک و مدرن. تکمیل‌کننده استایل روزانه بانوان.',
  },
  {
    slug: 'zanane-shoes',
    description: 'کفش و کتانی زنانه با طراحی شیک و راحتی بالا. مناسب برای پیاده‌روی روزانه و مناسبت‌های خاص.',
  },

  // ── بچگانه ───────────────────────────────────────────────────────────
  {
    slug: 'bachegane-hoodie',
    description: 'هودی بچگانه با پارچه نرم و راحت برای بازی و فعالیت روزمره. طرح‌های رنگارنگ و شاد مخصوص کودکان.',
  },
  {
    slug: 'bachegane-tshirt',
    description: 'تیشرت بچگانه با پارچه نخی نرم و طرح‌های جذاب. مناسب برای فعالیت روزانه کودکان و نوجوانان.',
  },
  {
    slug: 'bachegane-pants',
    description: 'شلوار بچگانه مقاوم و راحت برای بازی و فعالیت روزمره. کشسانی بالا و دوام مناسب برای کودکان پرتحرک.',
  },
  {
    slug: 'bachegane-jacket',
    description: 'کاپشن بچگانه گرم و سبک برای فصل سرد. طراحی راحت با کلاه و زیپ ایمن مناسب کودکان.',
  },
  {
    slug: 'bachegane-shoes',
    description: 'کفش بچگانه سبک و راحت با کفی ضدلغزش. مناسب برای مهدکودک، مدرسه و بازی در فضای باز.',
  },

  // ── اکسسوری ──────────────────────────────────────────────────────────
  {
    slug: 'accessories-bag',
    description: 'کیف چرم طبیعی با طراحی کلاسیک و مدرن. مناسب برای استفاده روزانه و مناسبت‌های رسمی.',
  },
  {
    slug: 'accessories-belt',
    description: 'کمربند و کلاه با جنس باکیفیت و طرح‌های متنوع. مکمل مناسب برای هر استایل و مناسبتی.',
  },
  {
    slug: 'accessories-scarf',
    description: 'شال و روسری با پارچه نرم و طرح‌های شیک. انتخابی ایده‌آل برای تکمیل استایل بانوان.',
  },
  {
    slug: 'accessories-backpack',
    description: 'کیف مدرسه و پشتی مقاوم با جادهی مناسب برای وسایل روزمره. مناسب برای مدرسه، دانشگاه و سفر.',
  },

  // ── پوشاک ورزشی ──────────────────────────────────────────────────────
  {
    slug: 'sportswear-hoodie',
    description: 'هودی ورزشی با پارچه تنفس‌پذیر و ضدعرق. مناسب برای تمرین، دویدن و فعالیت‌های روزمره.',
  },
  {
    slug: 'sportswear-pants',
    description: 'شلوار اسلیم ورزشی با کشسانی بالا و راحتی کامل. ایده‌آل برای باشگاه، دویدن و تمرینات روزانه.',
  },
  {
    slug: 'sportswear-tshirt',
    description: 'تیشرت ورزشی با پارچه سبک و تنفس‌پذیر. مناسب برای تمرین، دویدن و فعالیت در فضای باز.',
  },
  {
    slug: 'sportswear-shoes',
    description: 'کتانی اسپرت با کفی ضربه‌گیر و رویه مش تنفس‌پذیر. مناسب برای دویدن، پیاده‌روی و تمرینات بدنی.',
  },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('categories');
  const now = new Date();

  let updated = 0, notFound = 0;
  for (const item of descriptions) {
    const result = await col.updateOne(
      { slug: item.slug },
      { $set: { description: item.description, updatedAt: now } }
    );
    if (result.matchedCount === 0) {
      console.log(`NOT FOUND: ${item.slug}`);
      notFound++;
    } else {
      updated++;
    }
  }
  console.log(`Categories: updated ${updated}, not found ${notFound}`);
  await client.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
