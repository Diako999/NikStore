/**
 * Seed static pages (about, contact, terms, privacy)
 * Run from storein/ directory:  node scripts/seed-pages.js
 */
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storein';

const pages = [
  {
    title: 'درباره ما',
    slug: 'about',
    excerpt: 'آشنایی با فروشگاه استورین، تخصصی‌ترین فروشگاه عینک ایران',
    status: 'published',
    order: 0,
    metaTitle: 'درباره استورین',
    metaDescription: 'استورین، فروشگاه تخصصی عینک‌های طبی و آفتابی با گارانتی اصالت کالا',
    content: '<h2>درباره استورین</h2><p>استورین یک فروشگاه تخصصی عینک است که با هدف ارائه بهترین برندهای معتبر عینک طبی و آفتابی در ایران فعالیت می‌کند.</p><h2>ماموریت ما</h2><p>ما معتقدیم که هر کسی حق دارد از بهترین محصولات با کیفیت استفاده کند. به همین دلیل تمامی محصولات ما دارای گواهی اصالت و گارانتی معتبر هستند.</p><h2>چرا استورین؟</h2><ul><li><p>بیش از ۵۰۰ مدل عینک از برندهای معتبر جهانی</p></li><li><p>ضمانت ۷ روزه بازگشت کالا</p></li><li><p>ارسال سریع به سراسر کشور</p></li><li><p>پشتیبانی آنلاین و حضوری</p></li></ul><p>پشت استورین، تیمی از متخصصان اپتومتری، طراحی و تجربه کاربری قرار دارند که هر روز تلاش می‌کنند تجربه خرید شما را بهتر کنند.</p>',
  },
  {
    title: 'تماس با ما',
    slug: 'contact',
    excerpt: 'راه‌های ارتباطی با تیم پشتیبانی نیک',
    status: 'published',
    order: 2,
    metaTitle: 'تماس با استورین',
    metaDescription: 'با تیم پشتیبانی نیک از طریق تلفن، ایمیل یا شبکه‌های اجتماعی در ارتباط باشید',
    content: '<h2>تماس با ما</h2>\n<p>تیم پشتیبانی نیک آماده پاسخگویی به سوالات شماست.</p>\n<h2>اطلاعات تماس</h2>\n<ul>\n<li><strong>تلفن:</strong> ۰۲۱-۱۲۳۴۵۶۷۸</li>\n<li><strong>ایمیل:</strong> support@nikstore.ir</li>\n<li><strong>ساعات پشتیبانی:</strong> شنبه تا چهارشنبه، ۹ صبح تا ۶ عصر</li>\n</ul>\n<h2>آدرس</h2>\n<p>تهران، خیابان ولیعصر، پلاک ۱۰۰</p>',
  },
  {
    title: 'قوانین و مقررات',
    slug: 'terms',
    excerpt: 'شرایط و قوانین استفاده از خدمات فروشگاه استورین',
    status: 'published',
    order: 3,
    metaTitle: 'قوانین استورین',
    metaDescription: 'شرایط و ضوابط استفاده از سایت و خدمات فروشگاه استورین',
    content: '<h2>قوانین و مقررات</h2>\n<p>با استفاده از خدمات استورین، شما با شرایط زیر موافقت می‌کنید.</p>\n<h2>حریم خصوصی</h2>\n<p>اطلاعات شخصی شما نزد ما محفوظ است و هرگز به اشخاص ثالث فروخته نمی‌شود.</p>\n<h2>سیاست بازگشت کالا</h2>\n<p>تمامی محصولات دارای ضمانت ۷ روزه بازگشت هستند. در صورت عدم رضایت، با پشتیبانی تماس بگیرید.</p>\n<h2>پرداخت</h2>\n<p>تمامی پرداخت‌ها از طریق درگاه‌های معتبر بانکی انجام می‌شود و اطلاعات کارت شما ذخیره نمی‌شود.</p>',
  },
  {
    title: 'سیاست حریم خصوصی',
    slug: 'privacy',
    excerpt: 'نحوه جمع‌آوری و استفاده از اطلاعات کاربران در استورین',
    status: 'published',
    order: 4,
    metaTitle: 'حریم خصوصی استورین',
    metaDescription: 'سیاست حریم خصوصی و نحوه استفاده از اطلاعات کاربران در استورین',
    content: '<h2>سیاست حریم خصوصی</h2>\n<p>استورین متعهد به حفظ حریم خصوصی کاربران است.</p>\n<h2>اطلاعات جمع‌آوری شده</h2>\n<ul>\n<li>شماره تلفن برای احراز هویت</li>\n<li>آدرس برای ارسال سفارش</li>\n<li>تاریخچه خریدها برای بهبود تجربه کاربری</li>\n</ul>\n<h2>استفاده از اطلاعات</h2>\n<p>اطلاعات شما فقط برای بهبود خدمات و ارسال سفارشات استفاده می‌شود و هرگز به اشخاص ثالث فروخته نمی‌شود.</p>',
  },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const now = new Date();

  let inserted = 0, skipped = 0;
  for (const page of pages) {
    const exists = await db.collection('pages').findOne({ slug: page.slug });
    if (exists) { skipped++; continue; }
    await db.collection('pages').insertOne({ ...page, createdAt: now, updatedAt: now });
    inserted++;
  }
  console.log(`Pages: inserted ${inserted}, skipped ${skipped}`);

  await client.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
