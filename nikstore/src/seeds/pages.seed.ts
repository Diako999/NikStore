/**
 * Seed default static pages.
 * Run: npx ts-node -r tsconfig-paths/register src/seeds/pages.seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nikstore';

const PageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type PageStatus = 'draft' | 'published';

interface PageSeed {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  order: number;
}

const defaultPages: PageSeed[] = [
  {
    title: 'درباره ما',
    slug: 'about',
    status: 'published',
    order: 1,
    excerpt:
      'آشنایی با فروشگاه استورین، مرجع پوشاک زنانه، مردانه و بچگانه ایران',
    metaTitle: 'درباره استورین',
    metaDescription:
      'استورین، فروشگاه تخصصی پوشاک زنانه، مردانه و بچگانه با گارانتی اصالت کالا',
    content: `<h2>درباره استورین</h2>
<p>استورین یک فروشگاه تخصصی پوشاک است که با هدف ارائه بهترین برندهای معتبر لباس زنانه، مردانه و بچگانه در ایران فعالیت می‌کند.</p>
<h2>ماموریت ما</h2>
<p>ما معتقدیم که هر کسی حق دارد از بهترین محصولات با کیفیت استفاده کند. به همین دلیل تمامی محصولات ما دارای گواهی اصالت و گارانتی معتبر هستند.</p>
<h2>چرا استورین؟</h2>
<ul>
<li>بیش از ۵۰۰ مدل پوشاک از برندهای معتبر جهانی</li>
<li>ضمانت ۷ روزه بازگشت کالا</li>
<li>ارسال سریع به سراسر کشور</li>
<li>پشتیبانی ۲۴/۷</li>
</ul>`,
  },
  {
    title: 'تماس با ما',
    slug: 'contact',
    status: 'published',
    order: 2,
    excerpt: 'راه‌های ارتباطی با تیم پشتیبانی نیک',
    metaTitle: 'تماس با استورین',
    metaDescription:
      'با تیم پشتیبانی نیک از طریق تلفن، ایمیل یا شبکه‌های اجتماعی در ارتباط باشید',
    content: `<h2>تماس با ما</h2>
<p>تیم پشتیبانی نیک آماده پاسخگویی به سوالات شماست.</p>
<h2>اطلاعات تماس</h2>
<ul>
<li><strong>تلفن:</strong> ۰۲۱-۱۲۳۴۵۶۷۸</li>
<li><strong>ایمیل:</strong> support@nikstore.ir</li>
<li><strong>ساعات پشتیبانی:</strong> شنبه تا چهارشنبه، ۹ صبح تا ۶ عصر</li>
</ul>
<h2>آدرس</h2>
<p>تهران، خیابان ولیعصر، پلاک ۱۰۰</p>`,
  },
  {
    title: 'قوانین و مقررات',
    slug: 'terms',
    status: 'published',
    order: 3,
    excerpt: 'شرایط و قوانین استفاده از خدمات فروشگاه استورین',
    metaTitle: 'قوانین استورین',
    metaDescription: 'شرایط و ضوابط استفاده از سایت و خدمات فروشگاه استورین',
    content: `<h2>قوانین و مقررات</h2>
<p>با استفاده از خدمات استورین، شما با شرایط زیر موافقت می‌کنید.</p>
<h2>حریم خصوصی</h2>
<p>اطلاعات شخصی شما نزد ما محفوظ است و هرگز به اشخاص ثالث فروخته نمی‌شود.</p>
<h2>سیاست بازگشت کالا</h2>
<p>تمامی محصولات دارای ضمانت ۷ روزه بازگشت هستند. در صورت عدم رضایت، با پشتیبانی تماس بگیرید.</p>
<h2>پرداخت</h2>
<p>تمامی پرداخت‌ها از طریق درگاه‌های معتبر بانکی انجام می‌شود و اطلاعات کارت شما ذخیره نمی‌شود.</p>`,
  },
  {
    title: 'سیاست حریم خصوصی',
    slug: 'privacy',
    status: 'published',
    order: 4,
    excerpt: 'نحوه جمع‌آوری و استفاده از اطلاعات کاربران در استورین',
    metaTitle: 'حریم خصوصی استورین',
    metaDescription:
      'سیاست حریم خصوصی و نحوه استفاده از اطلاعات کاربران در استورین',
    content: `<h2>سیاست حریم خصوصی</h2>
<p>استورین متعهد به حفظ حریم خصوصی کاربران است.</p>
<h2>اطلاعات جمع‌آوری شده</h2>
<ul>
<li>شماره تلفن برای احراز هویت</li>
<li>آدرس برای ارسال سفارش</li>
<li>تاریخچه خریدها برای بهبود تجربه کاربری</li>
</ul>
<h2>استفاده از اطلاعات</h2>
<p>اطلاعات شما فقط برای بهبود خدمات و ارسال سفارشات استفاده می‌شود و هرگز به اشخاص ثالث فروخته نمی‌شود.</p>`,
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const PageModel = mongoose.model('Page', PageSchema);

  let created = 0;
  let skipped = 0;

  for (const page of defaultPages) {
    const exists = await PageModel.findOne({ slug: page.slug });
    if (exists) {
      console.log(`  ⏭  Skipped: "${page.title}" (slug already exists)`);
      skipped++;
    } else {
      await PageModel.create(page);
      console.log(`  ✓  Created: "${page.title}" → /pages/${page.slug}`);
      created++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err: Error) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
