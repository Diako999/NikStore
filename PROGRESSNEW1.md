# NIKSTORE — گزارش جامع پیشرفت پروژه

> آخرین بروزرسانی: ۱۴۰۴/۰۳/۲۹ | نوشته‌شده پس از خواندن کامل سورس‌کد

---

## ۱. معماری کلی پروژه

پروژه NikStore یک فروشگاه اینترنتی کامل است که از سه سرویس مستقل تشکیل شده و روی Railway دپلوی می‌شود:

```
nikstore-new/
├── nikstore/          ← Backend  (NestJS 11 + TypeScript)
├── nikstore-admin/    ← Admin Panel (Vue 3 + Vite)
├── nikstore-nuxt/     ← Storefront (Nuxt 3 — جایگزین nikstore-front)
├── docs/             ← بکاپ MongoDB + فونت‌های ایران‌سنس
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### استک فنی

| لایه | تکنولوژی |
|------|-----------|
| Backend | NestJS 11، TypeScript 5.7، MongoDB 9.6 (Mongoose)، Redis 5 (ioredis) |
| Real-time | Socket.IO 4 (WebSocket Gateway) |
| Admin Panel | Vue 3.5، Vite 8، Pinia 3، TailwindCSS، TipTap editor |
| Storefront | Nuxt 3.13، SSR/CSR Hybrid، Pinia 2، TailwindCSS RTL |
| Auth | JWT + Refresh Token + OTP (SMS via Kavenegar) |
| پرداخت | درگاه Zarinpal + کیف پول داخلی |
| لاگ‌گذاری | Winston + daily-rotate-file |
| کشینگ | Redis با cache-manager-ioredis |
| تست | Jest (backend)، Vitest + @vue/test-utils (frontend) |
| دپلوی | Railway + NIXPACKS، Docker (local dev) |
| SMS | Kavenegar (production) + Mock (test/dev) |

---

## ۲. بخش Backend (`nikstore/`)

### ماژول‌های پیاده‌سازی‌شده (۲۵ ماژول)

| ماژول | توضیح |
|-------|--------|
| `auth` | ورود با OTP + رمز عبور، JWT، Refresh Token، خروج |
| `user` | پروفایل کاربر، آدرس‌های پستی |
| `product` | محصولات، واریانت‌ها (سایز/رنگ)، قیمت‌گذاری |
| `category` | دسته‌بندی سلسله‌مراتبی |
| `brand` | برندها |
| `color` | رنگ‌ها برای واریانت محصول |
| `cart` | سبد خرید (session-based) |
| `order` | سفارشات، تغییر وضعیت، لغو |
| `payment` | اتصال به Zarinpal، تأیید پرداخت، کیف پول |
| `discount` | کوپن‌ها، محدودیت استفاده، تاریخ انقضا |
| `review` | نظرات محصول، تأیید admin |
| `wishlist` | علاقه‌مندی‌ها، مقایسه محصول |
| `search` | جستجو، پیشنهاد خودکار |
| `notification` | اعلان‌های کاربری، SMS broadcast |
| `banner` | بنرهای صفحه اصلی با ترتیب‌دهی |
| `blog` | مقالات با slug و سئو |
| `page` | صفحات ثابت (درباره ما، قوانین) |
| `settings` | تنظیمات سایت (نام، لوگو، تماس) |
| `popup` | پاپ‌آپ‌های تبلیغاتی |
| `frame-attribute` | مشخصات فنی محصول |
| `admin` | آمار و analytics داشبورد |
| `sitemap` | سایت‌مپ XML برای سئو |
| `health` | Health check endpoint |
| `gateway` | WebSocket Gateway برای real-time |
| `database` & `redis` | تنظیم اتصال پایگاه داده |

### نکات مهم معماری

- **Response Format یکپارچه** — همه پاسخ‌ها از `ResponseInterceptor` عبور می‌کنند: `{ data, message, statusCode }`
- **Global Error Filter** — `HttpExceptionFilter` تمام خطاها را با فرمت یکسان برمی‌گرداند
- **Request ID** — هر request یک `X-Request-ID` منحصربه‌فرد دریافت می‌کند (Correlation ID)
- **Rate Limiting** — ۱۰۰ درخواست در ۶۰ ثانیه با `@nestjs/throttler`
- **Image Processing** — آپلود با `sharp` (resize + optimize)
- **Static Files** — پوشه `/uploads` مستقیم سرو می‌شود
- **Swagger** — مستندات API در `/api/docs`

### Deployment (Railway)
```toml
# nixpacks.toml
[phases.setup]
  nixPkgs = ["nodejs_20"]
[phases.install]
  cmds = ["npm ci"]
[phases.build]
  cmds = ["npm run build"]
[start]
  cmd = "node dist/main"
```

---

## ۳. پنل مدیریت (`nikstore-admin/`)

### صفحات پیاده‌سازی‌شده

| صفحه | مسیر | توضیح |
|------|-------|--------|
| لاگین | `/login` | ورود با رمز عبور، dark glassmorphism UI |
| داشبورد | `/` | آمار، نمودارها، quick actions |
| محصولات | `/products` | لیست + فرم ایجاد/ویرایش |
| دسته‌بندی | `/categories` | درختی |
| برندها | `/brands` | مدیریت برند |
| رنگ‌ها | `/colors` | رنگ‌های واریانت |
| سفارشات | `/orders` | لیست + جزئیات + تغییر وضعیت |
| کاربران | `/users` | لیست + پروفایل کاربر |
| نظرات | `/reviews` | تأیید/رد نظرات |
| تخفیف‌ها | `/discounts` | کوپن‌ها |
| بنرها | `/banners` | بنرهای صفحه اصلی |
| بلاگ | `/blog` | مقالات با ویرایشگر TipTap |
| صفحات ثابت | `/pages` | درباره ما، قوانین |
| پاپ‌آپ | `/popup` | پاپ‌آپ تبلیغاتی |
| اعلان‌ها | `/notifications` | broadcast + SMS |
| تنظیمات | `/settings` | اطلاعات سایت، تم، رمز عبور |

### Store‌های Pinia

| Store | وظیفه |
|-------|--------|
| `auth.store.js` | وضعیت احراز هویت، refresh token |
| `ui.store.js` | تم، سایدبار، اعلان‌های real-time، `pendingOrdersCount`، `pendingReviewsCount` |
| `settings.store.js` | کش تنظیمات سایت (نام، لوگو) |

### ویژگی‌های کلیدی

- **Real-time اعلان‌ها** — Socket.IO در `App.vue`؛ رویدادهای `new_order` و `new_review` به‌طور انحصاری در یک جا handle می‌شوند
- **Bell Dropdown** — طراحی مجدد کامل با CSS prefix `anh__*`، آیکون‌های رنگی (amber سفارش، indigo نظر، gray سیستم)، unread border، max 8 آیتم، empty state
- **Quick Actions Badges** — تعداد سفارشات جدید و نظرات در انتظار به‌صورت real-time روی کارت‌های دسترسی سریع داشبورد
- **Splash Screen** — انیمیشن radar/pulse با نمایش نام سایت از DB
- **تم پویا** — light/dark + رنگ primary از تنظیمات
- **Dynamic Title** — عنوان مرورگر از `settings.store` در هر صفحه
- **Sidebar** — آیکون‌های SVG، active glow، collapse mode

### تست‌های نوشته‌شده

| فایل | تعداد تست |
|------|-----------|
| `AdminHeader.test.js` | ۲۵ تست (badge، toggle، empty state، unread/read، cap@8، markRead، markAllRead، clear، timeAgo، icon class) |
| `AdminSplash.test.js` | — |
| `auth.store.test.js` | — |
| `ui.store.test.js` | — |
| `socket.service.test.js` | — |
| `guard.test.js` | — |

---

## ۴. فرانت‌اند مشتری (`nikstore-nuxt/`)

> **نکته مهم:** `nikstore-front` (Vue 3 SPA با Vite) با `nikstore-nuxt` (Nuxt 3 Hybrid SSR/CSR) جایگزین شد. دلیل اصلی: SEO، کش سرورساید، و حذف Express server.js جداگانه.

### Hybrid Rendering

```ts
routeRules: {
  '/':            { swr: 60 },    // SSR + کش ۱ دقیقه
  '/products':    { swr: 60 },
  '/category/**': { swr: 60 },
  '/product/**':  { swr: 300 },   // کش ۵ دقیقه
  '/blog':        { swr: 300 },
  '/blog/**':     { swr: 3600 },  // کش ۱ ساعت
  '/pages/**':    { swr: 3600 },
  '/search':      { ssr: true },

  '/auth/**':    { ssr: false },   // CSR-only (نیاز به auth)
  '/cart':       { ssr: false },
  '/checkout':   { ssr: false },
  '/payment/**': { ssr: false },
  '/user/**':    { ssr: false },
}
```

### Nitro Proxy (جایگزین Express `server.js`)

```ts
nitro: {
  routeRules: {
    '/api/**':       { proxy: `${API_INTERNAL_URL}/api/**` },
    '/socket.io/**': { proxy: `${API_INTERNAL_URL}/socket.io/**` },
    '/uploads/**':   { proxy: `${API_INTERNAL_URL}/uploads/**` },
  },
}
```

### صفحات پیاده‌سازی‌شده

| فایل | مسیر | نوع Render |
|------|-------|-----------|
| `index.vue` | `/` | SSR + SWR |
| `products.vue` | `/products` | SSR + SWR |
| `category/[slug].vue` | `/category/:slug` | SSR + SWR |
| `product/[slug].vue` | `/product/:slug` | SSR + SWR |
| `search.vue` | `/search` | SSR |
| `blog/index.vue` | `/blog` | SSR + SWR |
| `blog/[slug].vue` | `/blog/:slug` | SSR + SWR |
| `pages/[slug].vue` | `/pages/:slug` | SSR + SWR |
| `cart.vue` | `/cart` | CSR |
| `checkout.vue` | `/checkout` | CSR |
| `payment/result.vue` | `/payment/result` | CSR |
| `auth/login.vue` | `/auth/login` | CSR |
| `auth/otp.vue` | `/auth/otp` | CSR |
| `user/index.vue` | `/user` | CSR |
| `user/profile.vue` | `/user/profile` | CSR |
| `user/addresses.vue` | `/user/addresses` | CSR |
| `user/notifications.vue` | `/user/notifications` | CSR |
| `user/favorites.vue` | `/user/favorites` | CSR |
| `user/orders/index.vue` | `/user/orders` | CSR |
| `user/orders/[id].vue` | `/user/orders/:id` | CSR |

### ویژگی‌های کلیدی Checkout

- فرم ۳ مرحله‌ای: **انتخاب آدرس** → **بررسی سبد** → **پرداخت**
- دراپ‌داون استان/شهر کسکیدی با `iran-cities.js` (`PROVINCE_NAMES` + `getCities()`)
- تیتر preset chips: `خانه / محل کار / خانه پدری`
- دکمه «استفاده از شماره خودم» برای auto-fill شماره تلفن کاربر
- پشتیبانی از ۳ روش پرداخت: درگاه / کیف پول / ترکیبی

### Plugins و Middleware

```
plugins/auth.client.ts    ← initialize auth state از cookie هنگام mount
plugins/socket.client.ts  ← اتصال Socket.IO
plugins/theme.client.ts   ← اعمال تم dark/light از localStorage

middleware/auth.ts        ← redirect به /auth/login اگر لاگین نباشد
middleware/guest.ts       ← redirect به / اگر قبلاً لاگین شده باشد
```

---

## ۵. تاریخچه کامل تغییرات

### فاز ۱ — راه‌اندازی اولیه و دپلوی Railway

| کامیت | شرح |
|-------|------|
| `3b5775b` | Railway deployment config برای هر ۳ سرویس |
| `40c2be4` | سوئیچ به NIXPACKS builder (حذف Docker از frontend‌ها) |
| `8adb9a3` | اضافه کردن `engine: node>=20` برای Nixpacks Vite builds |
| `9462abf` | حذف Docker files از frontend‌ها، استفاده از npx serve |

### فاز ۲ — احراز هویت و Session Management

| کامیت | شرح |
|-------|------|
| `728a638` | لاگین با رمز عبور برای admin + تست‌ها |
| `c5d3f93` | لاگین admin: دو تب OTP/Password |
| `df4a237` | Simplify لاگین admin به password-only |
| `4ac167f` | Fix OTP length mismatch: backend 6 digits، frontend 5 boxes |
| `bc60383` | Fix session expiry on refresh + real-time notifications |
| `8fc78a4` | Fix logout-on-refresh: SameSite=None برای Railway cross-origin |
| `c1f777a` | Fix admin panel infinite refresh loop (401 on /auth/refresh) |
| `deabb87` | اضافه کردن reverse-proxy server برای رفع Cookie blocking در Safari/Firefox |
| `e99a8e2` | Fix proxy: pathFilter برای حفظ prefix /api |
| `d84fb27` | Fix admin logout: POST /auth/logout برای پاک کردن refresh token cookie |
| `b1230c5` | Fix admin logout: redirect به login بعد از page refresh |

### فاز ۳ — UI/UX پنل مدیریت

| کامیت | شرح |
|-------|------|
| `7bc35ae` | Redesign admin sidebar: آیکون‌های SVG، active indicator |
| `f261add` | Rework sidebar: dark theme عمیق‌تر، glow حالت active، pulse dot |
| `2d4c0d5` | Redesign sidebar: spacing بهتر + سفارشی‌سازی رنگ |
| `b36917e` | اضافه کردن splash screen radar/pulse به admin |
| `b2b6b4c` | Redesign صفحه لاگین: dark glassmorphism premium |
| `375eea3` | Redesign footer به ۴ ستون (رفع فضای خالی روی desktop) |
| `a276820` | Fix header layout: لوگو سمت راست، actions سمت چپ (RTL) |
| `76f76bc` | Redesign product form action bar: UI، logger، isDirty tracking، تست |

### فاز ۴ — برندینگ پویا از Database

| کامیت | شرح |
|-------|------|
| `805823d` | دریافت نام سایت از DB در هر دو splash screen |
| `eb94e19` | نام سایت + تگ‌لاین در LoginView از settings store |
| `e7745e4` | نام سایت و تگ‌لاین در header از settings store |
| `63aa656` | Dynamic page titles: `siteName - pageName` در هر route |
| `c9b855d` | نام سایت/تگ‌لاین در AuthLayout header |
| `c928fb6` | Fix splash screen flash: نمایش brand text فقط بعد از لود settings |
| `8f33951` | عنوان مرورگر admin panel از settings store |
| `f01e496` | اضافه کردن favicon، web manifest، لوگو برای هر دو frontend |

### فاز ۵ — صفحه اصلی و محصولات

| کامیت | شرح |
|-------|------|
| `2a8e54f` | Redesign homepage: hero banner، categories، flash sale، product rows، trust strip |
| `eb29c43` | اضافه کردن بخش MostViewed به homepage + sort جدید به backend |
| `41ed7c7` | تغییر پس‌زمینه MostViewed به light purple gradient |
| `e16c857` | تغییر پس‌زمینه MostViewed به neon green |
| `7f0d344` | Fix dark mode: عدم تطابق رنگ image/body در product card |
| `a5a5ea6` | Fix درصد تخفیف نادرست روی product card |
| `805823d` | اضافه کردن دکمه Share به صفحه جزئیات محصول |

### فاز ۶ — اعلان‌ها و Real-time

| کامیت | شرح |
|-------|------|
| `47f731a` | Redesign notification panel: لاگ تاریخچه، UI پالیش‌شده |
| `486281f` | اضافه کردن ارسال notification و SMS به admin |
| `2a8e54f` | اضافه کردن صفحه notifications به storefront + route + تست |
| `4e67508` | اضافه کردن notification permission flow بعد از ثبت موفق سفارش |
| `2a0422c` | Fix Vue v-if chain break + logger + تست برای notification consent |
| `33b6555` | اضافه کردن notification permission flow |
| `e2bc644` | Fix real-time Socket.IO notifications روی Railway |
| `b92f78b` | Fix: broadcast room، proxy error handler، duplicate event handlers |
| `c711091` | Fix notification log 404: error state + لاگ‌ها |

### فاز ۷ — تنظیمات پیشرفته سایت

| کامیت | شرح |
|-------|------|
| `ff51790` | اضافه کردن multi-mobile و multi-address به contact settings |
| `ec1f13a` | اضافه کردن `mobiles[]` و `addresses[]` به settings DTO/schema |
| `8a55351` | کلیک‌پذیر کردن footer contact items (mailto/tel/maps) |
| `205f66e` | اضافه کردن mapsUrl به آدرس‌ها: ذخیره متن + مختصات GPS |
| `e05b928` | Fix اولویت footerTagline نسبت به tagline |

### فاز ۸ — Change Password و Admin Security

| کامیت | شرح |
|-------|------|
| `e18a10d` | اضافه کردن admin-only change password (backend + admin panel) |
| `f3af411` | Handle initial password setup (وقتی رمز در DB ست نشده) |
| `e18a10d` | Redesign ChangePasswordView: دو ستون، strength indicator، security tips |

### فاز ۹ — SEO و آپلود تصویر

| کامیت | شرح |
|-------|------|
| `fe0a56b` | SEO کامل: meta tags، JSON-LD، sitemap، robots.txt |
| `52ab8d1` | اضافه کردن image size hints به banner form |
| `32afb24` | Fix URL تصویر: ذخیره relative path، proxy /uploads |
| `4605fd2` | Fix image 404 روی Railway: include uploads در Docker build |
| `459b1e3` | Include uploads لوگو + بروزرسانی .gitignore |

### فاز ۱۰ — مهاجرت به Nuxt 3

| کامیت | شرح |
|-------|------|
| `5b9b4b7` | Fix فرم آدرس: دکمه Save بالای mobile nav، دراپ‌داون استان/شهر |
| `4030819` | mostViewed sort، redesign notification bell dropdown، fix search DTO |
| `a1a325f` | **مهاجرت کامل Nuxt 3**: ساختار کامل nikstore-nuxt با تمام صفحات |
| `f1306f8` | **حذف nikstore-front** + real-time pending counts در admin dashboard |

---

## ۶. تغییرات اخیر (بدون کامیت جداگانه)

### Checkout (بازنویسی کامل)

فایل `nikstore-nuxt/pages/checkout.vue` خراب بود (PowerShell 5.1 متن پارسی را به `?????` تبدیل کرد). از صفر بازنویسی شد:

- ویزارد ۳ مرحله‌ای با state machine ساده
- دراپ‌داون استان → شهر (cascading) با `iran-cities.js`
- Preset chips: `خانه / محل کار / خانه پدری`
- دکمه «استفاده از شماره خودم»: `form.recipientPhone = authStore.user.phone`
- Grid layout دو ستونه برای فیلدها

### Payment Result (بازنویسی)

`payment/result.vue` به‌دلیل همان باگ encoding بازنویسی شد + تبدیل `RouterLink` به `NuxtLink` با path string.

### User Favorites (Fix باگ)

`router.push()` بدون argument → `router.push(\`/product/${product.slug}\`)`

### Admin Notification Bell (Redesign)

`AdminHeader.vue` کاملاً redesign:

```css
/* CSS prefix: anh__ */
.anh__panel      → 340px، border-radius: 18px، heavy shadow
.anh__item       → هر اعلان
.anh__item--unread → border-right: 2.5px solid #f59e0b + amber glow dot
.anh__icon--order  → amber background
.anh__icon--review → indigo background
.anh__icon--system → gray background
```

```js
function typeClass(type) {
  return ['order', 'review'].includes(type) ? type : 'system'
}
```

### Real-time Dashboard Counts

`ui.store.js` — اضافه شد:
```js
const pendingOrdersCount  = ref(0)
const pendingReviewsCount = ref(0)
function setPendingOrdersCount(n)  { pendingOrdersCount.value = n }
function setPendingReviewsCount(n) { pendingReviewsCount.value = n }
function incrementPendingOrders()  { pendingOrdersCount.value++ }
function incrementPendingReviews() { pendingReviewsCount.value++ }
```

`App.vue` — در socket handlers:
- `onNewOrder` → `ui.incrementPendingOrders()`
- `onNewReview` → `ui.incrementPendingReviews()`

`DashboardView.vue`:
- بعد از fetch → `ui.setPendingOrdersCount(n)` و `ui.setPendingReviewsCount(n)`
- `QuickActions` props: `:pending-orders="ui.pendingOrdersCount"`

---

## ۷. الگوهای ثابت‌شده (برای session‌های آینده)

| موضوع | راه‌حل درست |
|-------|-------------|
| متن پارسی در PowerShell 5.1 | از Write tool استفاده کن، نه PS heredoc/echo |
| RouterLink در Nuxt 3 | همیشه `NuxtLink` |
| Named routes در Nuxt 3 | path string: `to="/user/orders"` نه `{ name: ... }` |
| alias `@` در Nuxt 3 | `~/` |
| Pinia isolation در Vitest | `setActivePinia(createPinia())` در `beforeEach` |
| `addNotification` در ui.store | همیشه `read: false` ست می‌کند — بعداً `markRead()` فراخوان کن |
| Socket events در admin | فقط در `App.vue` register شوند (یک handler، نه duplicate) |

---

## ۸. متغیرهای محیطی

**Backend (`nikstore/.env`):**
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
KAVENEGAR_API_KEY=...
ZARINPAL_MERCHANT_ID=...
FRONTEND_URL=https://nikstore.ir
ADMIN_URL=https://admin.nikstore.ir
```

**Admin (`nikstore-admin/.env`):**
```env
VITE_API_BASE_URL=https://api.nikstore.ir
```

**Frontend (`nikstore-nuxt/.env`):**
```env
NUXT_PUBLIC_SITE_URL=https://nikstore.ir
API_INTERNAL_URL=https://api.nikstore.ir
```

---

## ۹. CI/CD

**`.github/workflows/ci.yml`** — دو job:

**Job 1 — Backend Tests:**
- Setup Node 20 + cache
- `npm ci` → `npm run lint` → `npm run test:cov` → `npm run test:e2e`
- Upload coverage به Codecov

**Job 2 — Frontend Lint:**
- lint nikstore-admin (non-blocking: `|| true`)
- lint nikstore-nuxt (non-blocking: `|| true`)

> قبلاً nikstore-front lint داشت — با مهاجرت به Nuxt، به nikstore-nuxt تغییر یافت.

---

## ۱۰. دیتابیس

**۲۰ Collection در MongoDB:**

`banners`, `blogs`, `brands`, `categories`, `colors`, `coupons`, `couponusages`, `frameattributes`, `notifications`, `orders`, `pages`, `popups`, `products`, `refreshtokens`, `reviews`, `sitesettings`, `transactions`, `users`, `wallets`, `wishlists`

| ابزار | مسیر | توضیح |
|-------|-------|--------|
| بکاپ BSON | `docs/backDB/` | export کامل MongoDB |
| بکاپ JSON | `docs/backDB-json/` | همان داده‌ها، قابل خواندن |
| import script | `docs/import-db.mjs` | import BSON به MongoDB |
| seed production | `docs/seed-railway.mjs` | seed دیتابیس Railway |

---

## ۱۱. وضعیت نهایی

| سرویس | وضعیت |
|--------|--------|
| Backend (`nikstore/`) | ✅ Production-ready — دپلوی روی Railway |
| Admin Panel (`nikstore-admin/`) | ✅ Production-ready — real-time، badge، notifications |
| Storefront (`nikstore-nuxt/`) | ✅ کد کامل — نیاز به تست کامل روی Railway |

> آخرین کامیت: `f1306f8` — Remove nikstore-front: replaced by nikstore-nuxt (Nuxt 3)
