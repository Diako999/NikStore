<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">تنظیمات سایت</h1>
        <p class="text-text-secondary text-sm mt-0.5">عنوان، لوگو، سئو، شبکه‌های اجتماعی و فوتر</p>
      </div>
      <AdminButton :loading="saving" :disabled="!dirty" @click="saveAll">
        {{ dirty ? '✓ ذخیره تغییرات' : 'ذخیره‌شده ✓' }}
      </AdminButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 4" :key="i" height="80px" class="rounded-xl" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex items-center gap-1 mb-6 bg-surface p-1 rounded-xl w-fit flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-card text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          ]"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab: عمومی ──────────────────────────────────── -->
      <div v-show="activeTab === 'general'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات عمومی سایت</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.siteName"
              label="نام سایت" placeholder="نیک" required
              hint="در تب مرورگر و عنوان صفحات نمایش داده می‌شود" />
            <AdminInput v-model="form.tagline"
              label="شعار سایت" placeholder="فروشگاه تخصصی عینک‌های طبی و آفتابی"
              hint="زیر نام سایت در فوتر نمایش داده می‌شود" />
          </div>

          <!-- Logo upload -->
          <div>
            <label class="field-label">لوگو سایت</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-24 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-contain p-1" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.logoUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.logo" @click="triggerUpload('logo')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: PNG با پس‌زمینه شفاف، ارتفاع ۱۲۰px</p>
              </div>
            </div>
          </div>

          <!-- Favicon upload -->
          <div>
            <label class="field-label">فاوآیکون (Favicon)</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.faviconUrl" :src="form.faviconUrl" class="w-8 h-8 object-contain" />
                <span v-else class="text-2xl">🌐</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.faviconUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.favicon" @click="triggerUpload('favicon')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: ICO یا PNG مربعی ۳۲×۳۲ یا ۶۴×۶۴</p>
              </div>
            </div>
          </div>

          <input ref="fileInputLogo"    type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'logo')" />
          <input ref="fileInputFavicon" type="file" accept="image/png,image/x-icon,image/svg+xml" class="hidden" @change="onFileChange($event, 'favicon')" />
        </div>
      </div>


      <!-- ── Tab: سئو ────────────────────────────────────── -->
      <div v-show="activeTab === 'seo'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">تنظیمات سئو</h3>

          <AdminTextarea v-model="form.description"
            label="توضیحات متا (Meta Description)"
            placeholder="توضیح کوتاهی درباره سایت که در نتایج جستجو نمایش داده می‌شود..."
            :rows="3"
            :hint="`${form.description.length}/160 کاراکتر`" />

          <AdminInput v-model="form.keywords"
            label="کلمات کلیدی (Keywords)"
            placeholder="عینک آفتابی, عینک طبی, لنز رنگی, خرید عینک"
            hint="با کاما جدا کنید" />

          <!-- OG Image -->
          <div>
            <label class="field-label">تصویر شبکه‌های اجتماعی (OG Image)</label>
            <p class="text-xs text-text-disabled mb-2">هنگام اشتراک لینک در واتساپ، تلگرام و ... نمایش داده می‌شود</p>
            <div class="flex items-center gap-4">
              <div class="w-32 h-20 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.ogImage" :src="form.ogImage" class="w-full h-full object-cover" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 flex gap-2">
                <AdminInput v-model="form.ogImage" dir="ltr" placeholder="https://..." class="flex-1" />
                <AdminButton variant="secondary" :loading="uploading.ogImage" @click="triggerUpload('ogImage')">
                  📷 آپلود
                </AdminButton>
              </div>
            </div>
            <input ref="fileInputOg" type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'ogImage')" />
          </div>

          <!-- SEO preview -->
          <div class="bg-surface rounded-xl p-4 border border-border">
            <p class="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">پیش‌نمایش نتیجه جستجو</p>
            <p class="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-medium leading-tight">
              {{ form.siteName || 'نام سایت' }}
            </p>
            <p class="text-[#006621] dark:text-[#34a853] text-xs my-0.5">storein.ir ›</p>
            <p class="text-[#545454] dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {{ form.description || 'توضیحات متا در اینجا نمایش داده می‌شود...' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Tab: شبکه‌های اجتماعی ──────────────────────── -->
      <div v-show="activeTab === 'social'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">لینک‌های شبکه‌های اجتماعی</h3>
          <p class="text-text-secondary text-sm -mt-2">لینک‌های خالی در فوتر نمایش داده نخواهند شد</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div v-for="platform in socialPlatforms" :key="platform.key">
              <label class="field-label flex items-center gap-2">
                <span>{{ platform.icon }}</span>
                {{ platform.label }}
              </label>
              <AdminInput
                v-model="form.social[platform.key]"
                :placeholder="platform.placeholder"
                dir="ltr"
                class="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: فوتر ───────────────────────────────────── -->
      <div v-show="activeTab === 'footer'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">محتوای فوتر</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.footerTagline"
              label="شعار فوتر"
              placeholder="با بیش از هزاران محصول از برترین برندهای جهانی..."
              hint="اگر خالی باشد از شعار اصلی استفاده می‌شود" />
            <AdminInput v-model="form.footerCopyright"
              label="متن کپی‌رایت"
              placeholder="تمامی حقوق برای نیک محفوظ است" />
          </div>

          <!-- Footer links -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="field-label mb-0">لینک‌های سفارشی فوتر</label>
              <AdminButton variant="ghost" size="sm" @click="addFooterLink">
                + افزودن لینک
              </AdminButton>
            </div>

            <div v-if="!form.footerLinks.length"
                 class="py-8 text-center text-text-disabled text-sm border border-dashed border-border rounded-xl">
              هنوز لینکی اضافه نشده — دکمه بالا را بزنید
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(link, idx) in form.footerLinks"
                :key="idx"
                class="flex items-center gap-2"
              >
                <AdminInput v-model="link.label"
                  placeholder="عنوان لینک مثلاً: درباره ما"
                  class="flex-1" />
                <AdminInput v-model="link.url"
                  placeholder="/about یا https://..."
                  dir="ltr"
                  class="flex-1" />
                <button
                  @click="removeFooterLink(idx)"
                  class="w-9 h-9 flex-shrink-0 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors text-sm"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: تماس ───────────────────────────────────── -->
      <div v-show="activeTab === 'contact'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات تماس</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.phone"
              label="شماره تلفن ثابت" placeholder="۰۸۷-۳۳۱۷۷۱۸۹" dir="ltr"
              hint="در فوتر سایت نمایش داده می‌شود" />
            <AdminInput v-model="form.email"
              label="ایمیل پشتیبانی" placeholder="support@storein.ir" dir="ltr" />
          </div>

          <!-- Mobile numbers (multi) -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="field-label mb-0">شماره موبایل</label>
              <AdminButton variant="ghost" size="sm" @click="addMobile">+ افزودن شماره</AdminButton>
            </div>
            <div v-if="!form.mobiles.length"
                 class="py-6 text-center text-text-disabled text-sm border border-dashed border-border rounded-xl">
              شماره موبایلی ثبت نشده — دکمه بالا را بزنید
            </div>
            <div v-else class="space-y-2">
              <div v-for="(mob, idx) in form.mobiles" :key="idx" class="flex items-center gap-2">
                <AdminInput
                  v-model="mob.value"
                  placeholder="۰۹۱۲-۳۴۵-۶۷۸۹"
                  dir="ltr"
                  class="flex-1"
                />
                <button
                  @click="removeMobile(idx)"
                  class="w-9 h-9 flex-shrink-0 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors"
                  title="حذف"
                >✕</button>
              </div>
            </div>
          </div>

          <!-- Addresses (multi) -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="field-label mb-0">آدرس</label>
              <AdminButton variant="ghost" size="sm" @click="addAddress">+ افزودن آدرس</AdminButton>
            </div>
            <div v-if="!form.addresses.length"
                 class="py-6 text-center text-text-disabled text-sm border border-dashed border-border rounded-xl">
              آدرسی ثبت نشده — دکمه بالا را بزنید
            </div>
            <div v-else class="space-y-3">
              <div v-for="(addr, idx) in form.addresses" :key="idx"
                   class="flex items-start gap-2 p-3 bg-surface rounded-xl border border-border">
                <div class="flex-1 space-y-2">
                  <AdminTextarea
                    v-model="addr.text"
                    placeholder="تهران، خیابان ..."
                    :rows="2"
                  />
                  <AdminInput
                    v-model="addr.mapsUrl"
                    placeholder="مختصات GPS: 35.328, 47.002  یا  لینک گوگل مپس"
                    dir="ltr"
                    hint="با کلیک روی آدرس در سایت، کاربر به این موقعیت هدایت می‌شود"
                  />
                </div>
                <button
                  @click="removeAddress(idx)"
                  class="w-9 h-9 flex-shrink-0 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors mt-1"
                  title="حذف"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: پرداخت ────────────────────────────────── -->
      <div v-show="activeTab === 'payment'" class="space-y-5">
        <!-- Gateway selector -->
        <div class="admin-card space-y-5">
          <div>
            <h3 class="section-title">درگاه پرداخت فعال</h3>
            <p class="text-text-secondary text-sm mt-2">
              تغییر درگاه بلافاصله و بدون نیاز به ریستارت سرور اعمال می‌شود.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Mock -->
            <button
              @click="form.payment.gateway = 'mock'"
              :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all',
                form.payment.gateway === 'mock'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40',
              ]"
            >
              <div class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                🔧
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-primary text-sm">درگاه آزمایشی (Mock)</p>
                <p class="text-xs text-text-secondary mt-1 leading-relaxed">
                  پرداخت‌ها بدون اتصال به بانک تأیید می‌شوند — مناسب برای توسعه
                </p>
              </div>
              <div :class="[
                'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all',
                form.payment.gateway === 'mock' ? 'border-primary bg-primary' : 'border-border',
              ]">
                <div v-if="form.payment.gateway === 'mock'" class="w-full h-full rounded-full bg-white scale-[0.4]"></div>
              </div>
            </button>

            <!-- ZarinPal -->
            <button
              @click="form.payment.gateway = 'zarinpal'"
              :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all',
                form.payment.gateway === 'zarinpal'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40',
              ]"
            >
              <div class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                💳
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-primary text-sm">زرین‌پال (ZarinPal)</p>
                <p class="text-xs text-text-secondary mt-1 leading-relaxed">
                  درگاه بانکی زرین‌پال — Sandbox برای تست، Production برای واقعی
                </p>
              </div>
              <div :class="[
                'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all',
                form.payment.gateway === 'zarinpal' ? 'border-primary bg-primary' : 'border-border',
              ]">
                <div v-if="form.payment.gateway === 'zarinpal'" class="w-full h-full rounded-full bg-white scale-[0.4]"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- ZarinPal config (only shown when zarinpal is selected) -->
        <Transition name="slide-down">
          <div v-if="form.payment.gateway === 'zarinpal'" class="admin-card space-y-5">
            <h3 class="section-title">تنظیمات زرین‌پال</h3>

            <!-- Merchant ID -->
            <div>
              <AdminInput
                v-model="form.payment.zarinpalMerchantId"
                label="شناسه پذیرنده (Merchant ID)"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                dir="ltr"
                hint="از پنل زرین‌پال دریافت می‌شود"
              />
            </div>

            <!-- Sandbox / Production toggle -->
            <div>
              <label class="field-label mb-3 block">حالت اتصال</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Sandbox -->
                <button
                  @click="form.payment.zarinpalSandbox = true"
                  :class="[
                    'flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all',
                    form.payment.zarinpalSandbox
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10 shadow-sm'
                      : 'border-border hover:border-amber-300',
                  ]"
                >
                  <span class="text-2xl">🧪</span>
                  <div class="flex-1">
                    <p class="font-semibold text-sm text-text-primary">Sandbox</p>
                    <p class="text-xs text-text-secondary mt-0.5">تست — پول واقعی کسر نمی‌شود</p>
                  </div>
                  <div :class="[
                    'w-4 h-4 rounded-full border-2 transition-all flex-shrink-0',
                    form.payment.zarinpalSandbox ? 'border-amber-400 bg-amber-400' : 'border-border',
                  ]"></div>
                </button>

                <!-- Production -->
                <button
                  @click="form.payment.zarinpalSandbox = false"
                  :class="[
                    'flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all',
                    !form.payment.zarinpalSandbox
                      ? 'border-success bg-success/5 shadow-sm'
                      : 'border-border hover:border-success/40',
                  ]"
                >
                  <span class="text-2xl">🏦</span>
                  <div class="flex-1">
                    <p class="font-semibold text-sm text-text-primary">Production</p>
                    <p class="text-xs text-text-secondary mt-0.5">واقعی — پرداخت‌های زنده</p>
                  </div>
                  <div :class="[
                    'w-4 h-4 rounded-full border-2 transition-all flex-shrink-0',
                    !form.payment.zarinpalSandbox ? 'border-success bg-success' : 'border-border',
                  ]"></div>
                </button>
              </div>
            </div>

            <!-- Info banner -->
            <div :class="[
              'flex items-start gap-3 p-4 rounded-xl text-sm',
              form.payment.zarinpalSandbox
                ? 'bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/30 text-amber-800 dark:text-amber-300'
                : 'bg-success/5 border border-success/30 text-success',
            ]">
              <span class="text-lg flex-shrink-0">{{ form.payment.zarinpalSandbox ? '⚠️' : '✅' }}</span>
              <span>
                <template v-if="form.payment.zarinpalSandbox">
                  حالت <strong>Sandbox</strong> فعال است — تراکنش‌های آزمایشی با کارت‌های تستی امکان‌پذیر است.
                  برای پرداخت‌های واقعی حتماً به Production تغییر دهید.
                </template>
                <template v-else>
                  حالت <strong>Production</strong> فعال است — تراکنش‌های واقعی پردازش می‌شوند.
                </template>
              </span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── Tab: پیامک ────────────────────────────────── -->
      <div v-show="activeTab === 'sms'" class="space-y-5">

        <!-- Provider selector -->
        <div class="admin-card space-y-5">
          <div>
            <h3 class="section-title">سرویس پیامک فعال</h3>
            <p class="text-text-secondary text-sm mt-2">
              هم OTP ورود و هم پیامک‌های اطلاع‌رسانی سفارش از همین سرویس ارسال می‌شوند.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Mock -->
            <button
              @click="form.sms.provider = 'mock'"
              :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all',
                form.sms.provider === 'mock'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40',
              ]"
            >
              <div class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0 mt-0.5">🔧</div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-primary text-sm">تستی (Mock)</p>
                <p class="text-xs text-text-secondary mt-1 leading-relaxed">پیامک‌ها فقط در لاگ سرور نمایش داده می‌شوند</p>
              </div>
              <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1', form.sms.provider === 'mock' ? 'border-primary bg-primary' : 'border-border']">
                <div v-if="form.sms.provider === 'mock'" class="w-full h-full rounded-full bg-white scale-[0.4]"></div>
              </div>
            </button>

            <!-- Kavenegar -->
            <button
              @click="form.sms.provider = 'kavenegar'"
              :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all',
                form.sms.provider === 'kavenegar'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40',
              ]"
            >
              <div class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0 mt-0.5">📨</div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-primary text-sm">کاوه‌نگار</p>
                <p class="text-xs text-text-secondary mt-1 leading-relaxed">ارسال واقعی از طریق API کاوه‌نگار</p>
              </div>
              <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1', form.sms.provider === 'kavenegar' ? 'border-primary bg-primary' : 'border-border']">
                <div v-if="form.sms.provider === 'kavenegar'" class="w-full h-full rounded-full bg-white scale-[0.4]"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- Kavenegar config -->
        <Transition name="slide-down">
          <div v-if="form.sms.provider === 'kavenegar'" class="admin-card space-y-5">
            <h3 class="section-title">تنظیمات کاوه‌نگار</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AdminInput
                v-model="form.sms.kavenegarApiKey"
                label="API Key"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                dir="ltr"
                hint="از پنل کاوه‌نگار → تنظیمات → API Keys"
              />
              <AdminInput
                v-model="form.sms.kavenegarSender"
                label="شماره فرستنده"
                placeholder="10004346"
                dir="ltr"
                hint="خط اختصاصی یا اشتراکی کاوه‌نگار"
              />
            </div>

            <AdminInput
              v-model="form.sms.kavenegarOtpTemplate"
              label="نام قالب OTP"
              placeholder="storein-otp"
              dir="ltr"
              hint="نام قالب verify/lookup که در پنل کاوه‌نگار ساخته‌اید"
            />

            <!-- Info box -->
            <div class="bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/30 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <p class="font-semibold">راهنمای قالب OTP:</p>
              <ul class="space-y-1 text-xs list-disc list-inside">
                <li>در پنل کاوه‌نگار یک قالب تأیید (verify) بسازید</li>
                <li>متغیر کد را <span class="font-mono bg-blue-100 dark:bg-blue-400/20 px-1 rounded">token</span> نام‌گذاری کنید</li>
                <li>نام قالب را عیناً در فیلد بالا وارد کنید</li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── Tab: اعتماد ───────────────────────────────────── -->
      <!-- ── Announcement Bar ────────────────────────────────── -->
      <div v-show="activeTab === 'announcement'" class="space-y-5">
        <div class="admin-card space-y-5">
          <div>
            <h3 class="section-title">نوار اطلاع‌رسانی</h3>
            <p class="text-text-secondary text-xs mt-0.5">نواری که در بالای صفحه فروشگاه نمایش داده می‌شود</p>
          </div>

          <!-- Toggle -->
          <div class="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p class="text-sm font-medium text-text-primary">فعال‌سازی نوار</p>
              <p class="text-xs text-text-secondary mt-0.5">در صورت غیرفعال بودن، نوار اصلاً نمایش داده نمی‌شود</p>
            </div>
            <button
              type="button"
              @click="form.announcementBar.isActive = !form.announcementBar.isActive"
              :class="[
                'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                form.announcementBar.isActive ? 'bg-primary' : 'bg-border',
              ]"
            >
              <span
                :class="[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                  form.announcementBar.isActive ? 'right-1' : 'left-1',
                ]"
              />
            </button>
          </div>

          <!-- Text -->
          <AdminInput
            v-model="form.announcementBar.text"
            label="متن نوار"
            placeholder="ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان 🎉"
            hint="حداکثر ۲۰۰ کاراکتر"
          />

          <!-- Colors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label">رنگ پس‌زمینه</label>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  v-model="form.announcementBar.bgColor"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <input
                  type="text"
                  v-model="form.announcementBar.bgColor"
                  dir="ltr"
                  maxlength="7"
                  placeholder="#3b82f6"
                  class="flex-1 admin-input text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label class="field-label">رنگ متن</label>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  v-model="form.announcementBar.textColor"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <input
                  type="text"
                  v-model="form.announcementBar.textColor"
                  dir="ltr"
                  maxlength="7"
                  placeholder="#ffffff"
                  class="flex-1 admin-input text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Link -->
          <AdminInput
            v-model="form.announcementBar.link"
            label="لینک (اختیاری)"
            placeholder="https://example.com/sale"
            hint="اگر خالی بماند، نوار کلیک‌پذیر نخواهد بود"
            dir="ltr"
          />

          <!-- Live preview -->
          <div>
            <p class="field-label mb-2">پیش‌نمایش</p>
            <div class="rounded-xl overflow-hidden border border-border">
              <div
                v-if="form.announcementBar.text"
                class="w-full text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2"
                :style="{ backgroundColor: form.announcementBar.bgColor, color: form.announcementBar.textColor }"
              >
                <span>{{ form.announcementBar.text }}</span>
                <span class="opacity-60 text-xs">(× بستن)</span>
              </div>
              <div
                v-else
                class="w-full text-center py-2 text-xs text-text-disabled bg-surface/50"
              >متن نوار وارد کنید تا پیش‌نمایش نمایش داده شود</div>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'trust'" class="space-y-5">
        <div class="admin-card space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="section-title">نشان‌های اعتماد</h3>
              <p class="text-text-secondary text-xs mt-0.5">این کارت‌ها در صفحه اصلی فروشگاه نمایش داده می‌شوند</p>
            </div>
            <AdminButton variant="ghost" size="sm" @click="addTrustItem">+ افزودن کارت</AdminButton>
          </div>

          <!-- Preview — click each card to open its editor -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border border-dashed border-border bg-surface/50">
            <button
              v-for="(item, idx) in form.trustItems"
              :key="idx"
              type="button"
              @click="openTrustIdx = openTrustIdx === idx ? null : idx"
              :class="[
                'rounded-xl p-3 flex items-start gap-2 shadow-sm text-right transition-all duration-150',
                'hover:ring-2 hover:ring-primary/40',
                openTrustIdx === idx ? 'ring-2 ring-primary' : '',
              ]"
              style="background-color: var(--color-card);"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xl"
                :style="{ backgroundColor: item.bgColor || '#EBF4FF' }"
              >{{ item.icon || '🏷️' }}</div>
              <div class="min-w-0">
                <p class="font-bold text-text-primary text-xs leading-tight truncate">{{ item.title || '...' }}</p>
                <p class="text-text-secondary text-[10px] leading-relaxed line-clamp-2">{{ item.subtitle || '...' }}</p>
              </div>
            </button>
          </div>

          <!-- Editor rows — only the active one is shown -->
          <div class="space-y-2">
            <div
              v-for="(item, idx) in form.trustItems"
              :key="idx"
              class="rounded-xl border transition-colors duration-150"
              :class="openTrustIdx === idx ? 'border-primary/50' : 'border-border'"
            >
              <!-- Row header — always visible, click toggles -->
              <button
                type="button"
                @click="openTrustIdx = openTrustIdx === idx ? null : idx"
                class="w-full flex items-center justify-between px-4 py-3 text-sm"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base leading-none">{{ item.icon || '🏷️' }}</span>
                  <span class="font-medium text-text-primary">{{ item.title || `کارت ${idx + 1}` }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-text-disabled text-xs ml-2">{{ openTrustIdx === idx ? 'بستن' : 'ویرایش' }}</span>
                  <span
                    class="text-text-secondary transition-transform duration-200"
                    :class="openTrustIdx === idx ? 'rotate-180' : ''"
                  >▾</span>
                </div>
              </button>

              <!-- Collapsible fields -->
              <Transition name="collapse">
                <div v-if="openTrustIdx === idx" class="px-4 pb-4 space-y-3 border-t border-border">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <AdminInput
                      v-model="item.icon"
                      label="آیکون (ایموجی)"
                      placeholder="🔒"
                      hint="یک ایموجی وارد کنید"
                    />
                    <div>
                      <label class="field-label">رنگ پس‌زمینه</label>
                      <div class="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          v-model="item.bgColor"
                          class="w-10 h-10 rounded-lg cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          v-model="item.bgColor"
                          dir="ltr"
                          maxlength="7"
                          placeholder="#EBF4FF"
                          class="flex-1 admin-input text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <AdminInput v-model="item.title"    label="عنوان"  placeholder="پرداخت امن" />
                  <AdminInput v-model="item.subtitle" label="توضیح"  placeholder="درگاه پرداخت معتبر و رمزنگاری شده" />
                  <div class="flex justify-end pt-1">
                    <button
                      type="button"
                      @click="removeTrustItem(idx)"
                      class="text-xs text-error hover:underline"
                    >حذف این کارت</button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom save bar (sticky) -->
      <Transition name="slide-up">
        <div v-if="dirty"
             class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-5 py-3">
          <span class="text-sm text-text-secondary">تغییرات ذخیره نشده دارید</span>
          <AdminButton variant="ghost" @click="resetForm">بازگردانی</AdminButton>
          <AdminButton :loading="saving" @click="saveAll">ذخیره تغییرات</AdminButton>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { settingsService } from '@/services/settings.service'
import { uploadService }   from '@/services/upload.service'
import { useUiStore }      from '@/stores/ui.store'
import { logger }          from '@/utils/logger'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const ui = useUiStore()

const loading = ref(false)
const saving  = ref(false)
const uploading = reactive({ logo: false, favicon: false, ogImage: false })

const fileInputLogo    = ref(null)
const fileInputFavicon = ref(null)
const fileInputOg      = ref(null)

const activeTab = ref('general')

const tabs = [
  { key: 'general', icon: '⚙️', label: 'عمومی' },
  { key: 'seo',     icon: '🔍', label: 'سئو' },
  { key: 'social',  icon: '📱', label: 'شبکه‌های اجتماعی' },
  { key: 'footer',  icon: '📄', label: 'فوتر' },
  { key: 'contact', icon: '📞', label: 'تماس' },
  { key: 'payment', icon: '💳', label: 'پرداخت' },
  { key: 'sms',     icon: '📱', label: 'پیامک' },
  { key: 'trust',        icon: '🛡️', label: 'اعتماد' },
  { key: 'announcement', icon: '📢', label: 'نوار اطلاع‌رسانی' },
]

const socialPlatforms = [
  { key: 'instagram', icon: '📷', label: 'اینستاگرام', placeholder: 'https://instagram.com/storein' },
  { key: 'telegram',  icon: '✈️', label: 'تلگرام',     placeholder: 'https://t.me/storein' },
  { key: 'twitter',   icon: '🐦', label: 'توییتر / X',  placeholder: 'https://x.com/storein' },
  { key: 'whatsapp',  icon: '💬', label: 'واتساپ',      placeholder: 'https://wa.me/989...' },
  { key: 'linkedin',  icon: '💼', label: 'لینکدین',     placeholder: 'https://linkedin.com/company/storein' },
  { key: 'youtube',   icon: '▶️', label: 'یوتیوب',     placeholder: 'https://youtube.com/@storein' },
]

const emptyForm = () => ({
  siteName:        '',
  tagline:         '',
  logoUrl:         '',
  faviconUrl:      '',
  description:     '',
  keywords:        '',
  ogImage:         '',
  social: {
    instagram: '',
    telegram:  '',
    twitter:   '',
    whatsapp:  '',
    linkedin:  '',
    youtube:   '',
  },
  footerTagline:   '',
  footerCopyright: '',
  footerLinks:     [],
  phone:     '',
  mobiles:   [],
  email:     '',
  addresses: [],  // [{ text: string, mapsUrl: string }]
  payment: {
    gateway:             'mock',
    zarinpalMerchantId:  '',
    zarinpalSandbox:     true,
  },
  sms: {
    provider:             'mock',
    kavenegarApiKey:      '',
    kavenegarSender:      '',
    kavenegarOtpTemplate: 'storein-otp',
  },
  trustItems: [
    { icon: '🔒', title: 'پرداخت امن',    subtitle: 'درگاه پرداخت معتبر و رمزنگاری شده',    bgColor: '#EBF4FF' },
    { icon: '↩️', title: 'ضمانت ۷ روزه', subtitle: 'بازگشت کالا در صورت عدم رضایت',        bgColor: '#F0FDF4' },
    { icon: '✅', title: 'اصالت کالا',    subtitle: 'تمام محصولات دارای گارانتی اصالت',     bgColor: '#FFFBEB' },
    { icon: '🚚', title: 'ارسال سریع',   subtitle: 'ارسال به سراسر کشور در کمترین زمان',  bgColor: '#FFF1F2' },
  ],
  announcementBar: {
    isActive:  false,
    text:      '',
    bgColor:   '#3b82f6',
    textColor: '#ffffff',
    link:      '',
  },
})

const form         = reactive(emptyForm())
const savedSnapshot = ref('')

const dirty = computed(() => JSON.stringify(form) !== savedSnapshot.value)

function snapshot() {
  savedSnapshot.value = JSON.stringify(form)
}

function applyData(data) {
  Object.assign(form, {
    siteName:        data.siteName        ?? '',
    tagline:         data.tagline         ?? '',
    logoUrl:         data.logoUrl         ?? '',
    faviconUrl:      data.faviconUrl      ?? '',
    description:     data.description     ?? '',
    keywords:        data.keywords        ?? '',
    ogImage:         data.ogImage         ?? '',
    social: {
      instagram: data.social?.instagram ?? '',
      telegram:  data.social?.telegram  ?? '',
      twitter:   data.social?.twitter   ?? '',
      whatsapp:  data.social?.whatsapp  ?? '',
      linkedin:  data.social?.linkedin  ?? '',
      youtube:   data.social?.youtube   ?? '',
    },
    footerTagline:   data.footerTagline   ?? '',
    footerCopyright: data.footerCopyright ?? '',
    footerLinks:     (data.footerLinks ?? []).map(l => ({ label: l.label ?? '', url: l.url ?? '' })),
    phone:     data.phone ?? '',
    mobiles:   (data.mobiles ?? []).map(v => ({ value: typeof v === 'string' ? v : '' })),
    email:     data.email ?? '',
    addresses: (
      data.addresses?.length ? data.addresses
      : data.address         ? [{ text: data.address, mapsUrl: '' }]
      : []
    ).map(v => typeof v === 'string'
      ? { text: v, mapsUrl: '' }
      : { text: v.text ?? '', mapsUrl: v.mapsUrl ?? '' }
    ),
    payment: {
      gateway:            data.payment?.gateway            ?? 'mock',
      zarinpalMerchantId: data.payment?.zarinpalMerchantId ?? '',
      zarinpalSandbox:    data.payment?.zarinpalSandbox    ?? true,
    },
    sms: {
      provider:             data.sms?.provider             ?? 'mock',
      kavenegarApiKey:      data.sms?.kavenegarApiKey      ?? '',
      kavenegarSender:      data.sms?.kavenegarSender      ?? '',
      kavenegarOtpTemplate: data.sms?.kavenegarOtpTemplate ?? 'storein-otp',
    },
    trustItems: (data.trustItems ?? []).map(t => ({
      icon:     t.icon     ?? '',
      title:    t.title    ?? '',
      subtitle: t.subtitle ?? '',
      bgColor:  t.bgColor  ?? '#EBF4FF',
    })),
    announcementBar: {
      isActive:  data.announcementBar?.isActive  ?? false,
      text:      data.announcementBar?.text      ?? '',
      bgColor:   data.announcementBar?.bgColor   ?? '#3b82f6',
      textColor: data.announcementBar?.textColor ?? '#ffffff',
      link:      data.announcementBar?.link      ?? '',
    },
  })
  snapshot()
}

function resetForm() {
  if (savedSnapshot.value) {
    applyData(JSON.parse(savedSnapshot.value))
  }
}

// ── Load ──────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  logger.info('settings: loading site settings', {}, 'SettingsView')
  try {
    const { data } = await settingsService.get()
    applyData(data)
    logger.debug('settings: settings loaded', { mobiles: data.mobiles?.length ?? 0, addresses: data.addresses?.length ?? 0 }, 'SettingsView')
  } catch {
    logger.error('settings: failed to load settings', {}, 'SettingsView')
    ui.addToast('خطا در بارگذاری تنظیمات', 'error')
  } finally {
    loading.value = false
  }
})

// ── Save ──────────────────────────────────────────────────
async function saveAll() {
  saving.value = true
  logger.info('settings: saving site settings', { mobiles: form.mobiles.length, addresses: form.addresses.length }, 'SettingsView')
  try {
    const dto = {
      siteName:        form.siteName.trim(),
      tagline:         form.tagline.trim(),
      logoUrl:         form.logoUrl.trim(),
      faviconUrl:      form.faviconUrl.trim(),
      description:     form.description.trim(),
      keywords:        form.keywords.trim(),
      ogImage:         form.ogImage.trim(),
      social: { ...form.social },
      footerTagline:   form.footerTagline.trim(),
      footerCopyright: form.footerCopyright.trim(),
      footerLinks:     form.footerLinks
        .filter(l => l.label.trim() && l.url.trim())
        .map(l => ({ label: l.label.trim(), url: l.url.trim() })),
      phone:     form.phone.trim(),
      mobiles:   form.mobiles.filter(m => m.value.trim()).map(m => m.value.trim()),
      email:     form.email.trim(),
      addresses: form.addresses
        .filter(a => a.text.trim())
        .map(a => ({ text: a.text.trim(), mapsUrl: normalizeMapsUrl(a.mapsUrl) })),
      payment: {
        gateway:            form.payment.gateway,
        zarinpalMerchantId: form.payment.zarinpalMerchantId.trim(),
        zarinpalSandbox:    form.payment.zarinpalSandbox,
      },
      sms: {
        provider:             form.sms.provider,
        kavenegarApiKey:      form.sms.kavenegarApiKey.trim(),
        kavenegarSender:      form.sms.kavenegarSender.trim(),
        kavenegarOtpTemplate: form.sms.kavenegarOtpTemplate.trim(),
      },
      trustItems: form.trustItems.map(t => ({
        icon:     t.icon.trim(),
        title:    t.title.trim(),
        subtitle: t.subtitle.trim(),
        bgColor:  t.bgColor.trim(),
      })),
      announcementBar: {
        isActive:  form.announcementBar.isActive,
        text:      form.announcementBar.text.trim(),
        bgColor:   form.announcementBar.bgColor.trim(),
        textColor: form.announcementBar.textColor.trim(),
        link:      form.announcementBar.link.trim(),
      },
    }
    const { data } = await settingsService.update(dto)
    applyData(data)
    logger.info('settings: settings saved successfully', {}, 'SettingsView')
    ui.addToast('تنظیمات ذخیره شد ✓', 'success')
  } catch (err) {
    const msg = err.response?.data?.message
    logger.error('settings: failed to save settings', { msg }, 'SettingsView')
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره تنظیمات', 'error')
  } finally {
    saving.value = false
  }
}

// ── Trust items ───────────────────────────────────────────
const openTrustIdx = ref(null)

function addTrustItem() {
  form.trustItems.push({ icon: '🏷️', title: '', subtitle: '', bgColor: '#EBF4FF' })
  openTrustIdx.value = form.trustItems.length - 1
}

function removeTrustItem(idx) {
  form.trustItems.splice(idx, 1)
  if (openTrustIdx.value === idx) openTrustIdx.value = null
  else if (openTrustIdx.value > idx) openTrustIdx.value--
}

// ── Footer links ──────────────────────────────────────────
function addFooterLink() {
  form.footerLinks.push({ label: '', url: '' })
}

function removeFooterLink(idx) {
  form.footerLinks.splice(idx, 1)
}

// ── Contact: mobiles ──────────────────────────────────────
function addMobile() {
  form.mobiles.push({ value: '' })
  logger.debug('settings: mobile field added', { count: form.mobiles.length }, 'SettingsView')
}
function removeMobile(idx) {
  form.mobiles.splice(idx, 1)
  logger.debug('settings: mobile field removed', { idx }, 'SettingsView')
}

// ── Contact: addresses ────────────────────────────────────
function addAddress() {
  form.addresses.push({ text: '', mapsUrl: '' })
  logger.debug('settings: address field added', { count: form.addresses.length }, 'SettingsView')
}
function removeAddress(idx) {
  form.addresses.splice(idx, 1)
  logger.debug('settings: address field removed', { idx }, 'SettingsView')
}

function normalizeMapsUrl(input) {
  const s = (input ?? '').trim()
  if (!s) return ''
  // already a URL
  if (s.startsWith('http')) return s
  // bare coordinates: "35.328, 47.002" or "35.328,47.002"
  const coordRe = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
  const m = s.match(coordRe)
  if (m) return `https://maps.google.com/?q=${m[1]},${m[2]}`
  return s
}

// ── Image upload ──────────────────────────────────────────
const uploadTargets = {
  logo:    { ref: fileInputLogo,    key: 'logoUrl',    flag: 'logo' },
  favicon: { ref: fileInputFavicon, key: 'faviconUrl', flag: 'favicon' },
  ogImage: { ref: fileInputOg,      key: 'ogImage',    flag: 'ogImage' },
}

function triggerUpload(target) {
  uploadTargets[target].ref.value?.click()
}

async function onFileChange(e, target) {
  const file = e.target.files?.[0]
  if (!file) return
  const { key, flag } = uploadTargets[target]
  uploading[flag] = true
  try {
    const { data } = await uploadService.uploadImage(file, 'logos')
    form[key] = data?.original?.url || data?.url || ''
    ui.addToast('تصویر آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading[flag] = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.section-title {
  @apply text-base font-semibold text-text-primary border-b border-border pb-3;
}
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.collapse-enter-active, .collapse-leave-active { transition: all 0.2s ease; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; max-height: 0; }
.collapse-enter-to, .collapse-leave-from { opacity: 1; max-height: 400px; }
</style>
