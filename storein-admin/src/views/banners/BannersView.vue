<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">مدیریت بنرها</h1>
        <p class="text-text-secondary text-sm mt-0.5">
          {{ activeTab === 'hero' ? 'اسلایدر صفحه اصلی' : 'بنرهای ویژه دو‌ستونی' }}
          — {{ filteredBanners.length }} بنر
        </p>
      </div>
      <AdminButton @click="openCreate">+ بنر جدید</AdminButton>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6 bg-surface p-1 rounded-xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
          activeTab === tab.key
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        ]"
      >
        <span>{{ tab.icon }}</span>
        {{ tab.label }}
        <span :class="[
          'text-xs px-1.5 py-0.5 rounded-full font-semibold',
          activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-border text-text-disabled',
        ]">
          {{ countByType(tab.key) }}
        </span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 3" :key="i" height="100px" class="rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!filteredBanners.length"
         class="admin-card flex flex-col items-center py-16 gap-4">
      <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-3xl">
        {{ activeTab === 'hero' ? '🖼' : '🃏' }}
      </div>
      <p class="text-text-secondary text-center">
        {{ activeTab === 'hero'
            ? 'هنوز بنری برای اسلایدر ثبت نشده.'
            : 'هنوز بنر ویژه‌ای ثبت نشده.' }}
      </p>
      <AdminButton @click="openCreate">اولین بنر را بسازید</AdminButton>
    </div>

    <!-- Banner list -->
    <div v-else class="space-y-3">
      <div
        v-for="(banner, idx) in pagedBanners"
        :key="banner._id"
        draggable="true"
        @dragstart="onDragStart(idx)"
        @dragover.prevent="onDragOver(idx)"
        @dragleave="dragOverIdx = null"
        @drop.prevent="onDrop(idx)"
        @dragend="onDragEnd"
        :class="[
          'admin-card flex items-center gap-4 cursor-grab active:cursor-grabbing',
          'transition-all duration-150 select-none',
          draggingIdx === idx ? 'opacity-40 scale-[0.98]' : '',
          dragOverIdx === idx && draggingIdx !== idx
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : '',
        ]"
      >
        <!-- Drag handle -->
        <div class="text-text-disabled flex-shrink-0 cursor-grab">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="7" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/>
            <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
            <circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/>
          </svg>
        </div>

        <!-- Mini preview — hero style vs promo style -->
        <div class="flex-shrink-0 rounded-xl overflow-hidden relative"
             :class="activeTab === 'promo' ? 'w-48 h-20' : 'w-40 h-20'">
          <div v-if="banner.imageUrl"
               class="absolute inset-0 bg-cover bg-center"
               :style="{ backgroundImage: `url(${banner.imageUrl})` }">
            <div class="absolute inset-0 bg-black/40"></div>
          </div>
          <div v-else class="absolute inset-0"
               :style="{ background: `linear-gradient(135deg, ${banner.bgFrom}, ${banner.bgTo})` }">
          </div>

          <!-- promo card layout preview -->
          <template v-if="activeTab === 'promo'">
            <div class="absolute inset-0 flex items-center justify-between px-3 z-10">
              <div class="text-white min-w-0">
                <p class="text-[8px] opacity-70 truncate">{{ banner.eyebrow }}</p>
                <p class="text-white font-black text-xs leading-tight truncate">{{ banner.title }}</p>
                <span class="inline-block mt-1 text-[7px] bg-white/25 rounded-full px-2 py-0.5">
                  {{ banner.cta }}
                </span>
              </div>
              <!-- tiny badge svg -->
              <div class="opacity-[0.15] flex-shrink-0 ml-1">
                <svg v-if="banner.badgeType === 'sale'" width="36" height="18" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5">
                  <circle cx="55" cy="32" r="15"/>
                  <circle cx="125" cy="58" r="15"/>
                  <path d="M150 18 L30 72"/>
                </svg>
                <svg v-else-if="banner.badgeType === 'new'" width="36" height="18" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5">
                  <path d="M48 20 Q54 42 76 46 Q54 50 48 72 Q42 50 20 46 Q42 42 48 20 Z"/>
                  <path d="M132 34 Q136 48 150 50 Q136 52 132 66 Q128 52 114 50 Q128 48 132 34 Z"/>
                </svg>
              </div>
            </div>
          </template>

          <!-- hero card layout preview -->
          <template v-else>
            <div class="absolute inset-0 flex flex-col justify-center px-3 z-10">
              <p class="text-[9px] font-medium truncate"
                 :style="{ color: banner.accent + 'dd' }">{{ banner.eyebrow }}</p>
              <p class="text-white font-bold text-xs leading-tight truncate">{{ banner.title }}</p>
              <div class="mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold w-fit"
                   :style="{ backgroundColor: banner.accent, color: banner.bgFrom }">
                {{ banner.cta }}
              </div>
            </div>
          </template>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-text-primary text-sm truncate">{{ banner.title }}</p>
          <p v-if="banner.subtitle" class="text-text-secondary text-xs truncate mt-0.5">
            {{ banner.subtitle }}
          </p>
          <p class="text-text-disabled text-xs mt-1">ترتیب: {{ idx + 1 }}</p>
        </div>

        <AdminBadge :variant="banner.isActive ? 'success' : 'gray'" size="sm">
          {{ banner.isActive ? 'فعال' : 'غیرفعال' }}
        </AdminBadge>

        <!-- Actions -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <button @click.stop="toggleActive(banner)"
            :title="banner.isActive ? 'غیرفعال کردن' : 'فعال کردن'"
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors',
              banner.isActive ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10',
            ]">
            {{ banner.isActive ? '🙈' : '👁' }}
          </button>
          <button @click.stop="openEdit(banner)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-text-secondary hover:bg-surface hover:text-primary transition-colors"
            title="ویرایش">✏️</button>
          <button @click.stop="confirmDelete(banner)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
            title="حذف">🗑</button>
        </div>
      </div>

      <p class="text-center text-text-disabled text-xs pt-1">
        برای تغییر ترتیب، بنرها را بکشید — ترتیب بلافاصله ذخیره می‌شود
      </p>
      <AdminPagination v-model="page" :total-pages="totalPages" :loading="loading" />
    </div>

    <!-- ── Create / Edit Modal ───────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="modalOpen"
           class="fixed inset-0 z-modal flex items-center justify-center p-4"
           @click.self="closeModal">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <h2 class="text-lg font-bold text-text-primary">
                {{ editingBanner ? 'ویرایش بنر' : 'بنر جدید' }}
              </h2>
              <p class="text-xs text-text-secondary mt-0.5">
                {{ form.type === 'promo' ? 'بنر ویژه — کارت دو‌ستونی' : 'اسلایدر اصلی' }}
              </p>
            </div>
            <button @click="closeModal"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="overflow-y-auto flex-1">
            <div class="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border">

              <!-- ── Form ── -->
              <div class="lg:col-span-3 p-6 space-y-5">

                <div class="space-y-4">
                  <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">متن و لینک</h3>

                  <AdminInput v-model="form.title"
                    label="عنوان اصلی" placeholder="مثلاً: عینک آفتابی" required />

                  <AdminInput v-model="form.eyebrow"
                    label="متن کوچک بالا" placeholder="مثلاً: کلکسیون تابستان ۱۴۰۴" />

                  <AdminInput v-if="form.type === 'hero'" v-model="form.subtitle"
                    label="زیرعنوان" placeholder="توضیح کوتاه..." />

                  <div class="grid grid-cols-2 gap-4">
                    <AdminInput v-model="form.cta"
                      label="متن دکمه" placeholder="مشاهده محصولات" />
                    <AdminInput v-model="form.ctaLink"
                      label="لینک" placeholder="/category/sunglasses" dir="ltr" />
                  </div>
                </div>

                <!-- رنگ‌ها -->
                <div class="space-y-3">
                  <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">رنگ‌ها</h3>
                  <div :class="form.type === 'hero' ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'">
                    <div>
                      <label class="field-label">از</label>
                      <div class="flex items-center gap-2 mt-1">
                        <input type="color" v-model="form.bgFrom"
                          class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                        <input v-model="form.bgFrom" dir="ltr"
                          class="field-input font-mono text-xs flex-1 min-w-0" placeholder="#0F3D73" />
                      </div>
                    </div>
                    <div>
                      <label class="field-label">به</label>
                      <div class="flex items-center gap-2 mt-1">
                        <input type="color" v-model="form.bgTo"
                          class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                        <input v-model="form.bgTo" dir="ltr"
                          class="field-input font-mono text-xs flex-1 min-w-0" placeholder="#1B4F8A" />
                      </div>
                    </div>
                    <div v-if="form.type === 'hero'">
                      <label class="field-label">لهجه (دکمه)</label>
                      <div class="flex items-center gap-2 mt-1">
                        <input type="color" v-model="form.accent"
                          class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                        <input v-model="form.accent" dir="ltr"
                          class="field-input font-mono text-xs flex-1 min-w-0" placeholder="#FFD700" />
                      </div>
                    </div>
                  </div>
                  <p v-if="form.type === 'promo'" class="text-xs text-text-disabled">
                    رنگ دکمه در بنر ویژه همیشه سفید/شفاف است
                  </p>
                </div>

                <!-- تزیینات SVG -->
                <div>
                  <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">تزیین SVG</h3>
                  <div class="grid grid-cols-4 gap-2">
                    <button v-for="g in badgeOptions" :key="g.value"
                      @click="form.badgeType = g.value"
                      :class="[
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                        form.badgeType === g.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-text-secondary hover:border-border/60',
                      ]">
                      <span class="text-xl">{{ g.icon }}</span>
                      {{ g.label }}
                    </button>
                  </div>
                </div>

                <!-- تصویر پس‌زمینه دسکتاپ -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      🖥 تصویر دسکتاپ
                    </h3>
                    <span class="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg font-mono font-semibold">
                      {{ form.type === 'hero' ? '1440 × 560' : '720 × 400' }} px
                    </span>
                  </div>
                  <p class="text-xs text-text-secondary mb-3">
                    گرادیان را جایگزین می‌کند — <span class="font-mono text-text-primary">JPG / WebP</span>
                    — نسبت تصویر <span class="font-mono text-text-primary">{{ form.type === 'hero' ? '16:6' : '9:5' }}</span>
                  </p>
                  <div v-if="form.imageUrl" class="flex items-center gap-3 mb-3 p-3 bg-surface rounded-xl">
                    <img :src="form.imageUrl" class="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                    <p class="flex-1 text-xs text-text-secondary truncate dir-ltr">{{ form.imageUrl }}</p>
                    <button @click="form.imageUrl = ''"
                      class="text-error hover:bg-error/10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm transition-colors">✕</button>
                  </div>
                  <div class="flex gap-2">
                    <AdminInput v-model="form.imageUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                    <AdminButton variant="secondary" :loading="uploading" @click="triggerImageUpload">
                      📷 آپلود
                    </AdminButton>
                  </div>
                  <input ref="imageFileInput" type="file" accept="image/jpeg,image/png,image/webp"
                         class="hidden" @change="onImageFileChange" />
                </div>

                <!-- تصویر موبایل (اختیاری) -->
                <div v-if="form.type === 'hero'" class="border border-dashed border-border rounded-xl p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        📱 تصویر موبایل
                      </h3>
                      <span class="text-[10px] bg-amber-500/15 text-amber-600 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">اختیاری</span>
                    </div>
                    <span class="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-lg font-mono font-semibold">
                      800 × 600 px
                    </span>
                  </div>
                  <p class="text-xs text-text-secondary">
                    اگر خالی باشد، تصویر دسکتاپ روی موبایل هم نمایش داده می‌شود.
                    برای موبایل تصویر <span class="font-mono text-text-primary">4:3</span> یا <span class="font-mono text-text-primary">1:1</span> بهتر است.
                  </p>
                  <div v-if="form.mobileImageUrl" class="flex items-center gap-3 p-3 bg-surface rounded-xl">
                    <img :src="form.mobileImageUrl" class="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                    <p class="flex-1 text-xs text-text-secondary truncate dir-ltr">{{ form.mobileImageUrl }}</p>
                    <button @click="form.mobileImageUrl = ''"
                      class="text-error hover:bg-error/10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm transition-colors">✕</button>
                  </div>
                  <div class="flex gap-2">
                    <AdminInput v-model="form.mobileImageUrl" dir="ltr" placeholder="https://... (اختیاری)" class="flex-1" />
                    <AdminButton variant="secondary" :loading="uploadingMobile" @click="triggerMobileImageUpload">
                      📱 آپلود
                    </AdminButton>
                  </div>
                  <input ref="mobileImageFileInput" type="file" accept="image/jpeg,image/png,image/webp"
                         class="hidden" @change="onMobileImageFileChange" />
                </div>

                <!-- وضعیت -->
                <div class="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div>
                    <p class="text-sm font-medium text-text-primary">وضعیت نمایش</p>
                    <p class="text-xs text-text-secondary mt-0.5">بنر در صفحه اصلی نمایش داده شود</p>
                  </div>
                  <button @click="form.isActive = !form.isActive"
                    :class="[
                      'relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                      form.isActive ? 'bg-primary' : 'bg-border',
                    ]">
                    <span :class="[
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                      form.isActive ? 'left-0.5 translate-x-6' : 'left-0.5',
                    ]"></span>
                  </button>
                </div>
              </div>

              <!-- ── Live Preview ── -->
              <div class="lg:col-span-2 p-6 flex flex-col gap-4">
                <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">پیش‌نمایش زنده</h3>

                <!-- HERO preview -->
                <template v-if="form.type === 'hero'">
                  <div class="rounded-2xl overflow-hidden relative" style="height: 200px;">
                    <div v-if="form.imageUrl" class="absolute inset-0 bg-cover bg-center"
                         :style="{ backgroundImage: `url(${form.imageUrl})` }">
                      <div class="absolute inset-0 bg-black/40"></div>
                    </div>
                    <div v-else class="absolute inset-0"
                         :style="{ background: `linear-gradient(135deg, ${form.bgFrom || '#0F3D73'} 0%, ${form.bgTo || '#1B4F8A'} 100%)` }">
                    </div>
                    <div v-if="!form.imageUrl && form.badgeType !== 'none'"
                         class="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.13] pointer-events-none scale-[0.6] origin-left">
                      <svg v-if="form.badgeType === 'sale'" width="340" height="200" viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
                        <circle cx="90" cy="90" r="60"/>
                        <circle cx="250" cy="140" r="60"/>
                        <path d="M300 40 L40 170"/>
                      </svg>
                      <svg v-else-if="form.badgeType === 'new'" width="340" height="200" viewBox="0 0 340 200" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
                        <path d="M90 40 Q104 96 170 108 Q104 120 90 176 Q76 120 10 108 Q76 96 90 40 Z"/>
                        <path d="M260 70 Q268 100 300 108 Q268 116 260 146 Q252 116 220 108 Q252 100 260 70 Z"/>
                      </svg>
                      <svg v-else width="200" height="200" viewBox="0 0 280 280" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
                        <path d="M140 30 L140 250"/>
                        <path d="M40 80 L240 200"/>
                        <path d="M240 80 L40 200"/>
                      </svg>
                    </div>
                    <div class="absolute inset-0 flex items-center px-6 z-10">
                      <div class="max-w-[200px]">
                        <p class="text-xs font-medium mb-1" :style="{ color: (form.accent || '#FFD700') + 'cc' }">
                          {{ form.eyebrow || 'متن کوچک' }}
                        </p>
                        <h3 class="text-white font-black text-base leading-tight mb-2">
                          {{ form.title || 'عنوان بنر' }}
                        </h3>
                        <p class="text-white/70 text-xs mb-3 leading-relaxed line-clamp-2">{{ form.subtitle }}</p>
                        <div class="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg"
                             :style="{ backgroundColor: form.accent || '#FFD700', color: form.bgFrom || '#0F3D73' }">
                          {{ form.cta || 'مشاهده محصولات' }}
                          <svg class="w-3 h-3 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div v-if="!form.isActive" class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                      <span class="text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-lg">غیرفعال</span>
                    </div>
                  </div>
                  <p class="text-xs text-text-disabled text-center">پیش‌نمایش اسلایدر اصلی</p>
                </template>

                <!-- PROMO preview -->
                <template v-else>
                  <!-- shows exactly as it will appear in the 2-col grid -->
                  <div class="rounded-2xl overflow-hidden relative flex items-center justify-between px-6 py-6"
                       :style="promoCardStyle">
                    <div v-if="form.imageUrl" class="absolute inset-0 bg-cover bg-center"
                         :style="{ backgroundImage: `url(${form.imageUrl})` }">
                      <div class="absolute inset-0 bg-black/40"></div>
                    </div>
                    <div class="text-white z-10 relative">
                      <p class="text-xs opacity-75 mb-1">{{ form.eyebrow || 'متن بالا' }}</p>
                      <h3 class="text-xl font-black mb-3 leading-tight">{{ form.title || 'عنوان' }}</h3>
                      <span class="inline-flex items-center gap-1 text-xs bg-white/20 rounded-full px-3 py-1.5">
                        {{ form.cta || 'مشاهده محصولات' }}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 rtl:rotate-180">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                        </svg>
                      </span>
                    </div>
                    <div v-if="!form.imageUrl && form.badgeType !== 'none'"
                         class="opacity-[0.13] pointer-events-none flex-shrink-0 z-10">
                      <svg v-if="form.badgeType === 'sale'" width="90" height="45" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round">
                        <circle cx="55" cy="32" r="15"/>
                        <circle cx="125" cy="58" r="15"/>
                        <path d="M150 18 L30 72"/>
                      </svg>
                      <svg v-else-if="form.badgeType === 'new'" width="90" height="45" viewBox="0 0 180 90" fill="none" stroke="white" stroke-width="5" stroke-linecap="round">
                        <path d="M48 20 Q54 42 76 46 Q54 50 48 72 Q42 50 20 46 Q42 42 48 20 Z"/>
                        <path d="M132 34 Q136 48 150 50 Q136 52 132 66 Q128 52 114 50 Q128 48 132 34 Z"/>
                      </svg>
                      <svg v-else width="60" height="60" viewBox="0 0 280 280" fill="none" stroke="white" stroke-width="8" stroke-linecap="round">
                        <path d="M140 30 L140 250"/>
                        <path d="M40 80 L240 200"/>
                        <path d="M240 80 L40 200"/>
                      </svg>
                    </div>
                    <div v-if="!form.isActive" class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                      <span class="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-lg">غیرفعال</span>
                    </div>
                  </div>
                  <p class="text-xs text-text-disabled text-center">پیش‌نمایش بنر ویژه — نیمی از عرض صفحه</p>
                </template>

                <!-- Tips -->
                <div class="bg-surface rounded-xl p-4 space-y-1.5 text-xs text-text-secondary">
                  <p class="font-medium text-text-primary text-sm">نکات</p>
                  <template v-if="form.type === 'hero'">
                    <p class="flex items-center gap-1.5">
                      <span class="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">1440 × 560 px</span>
                      سایز دسکتاپ
                    </p>
                    <p class="flex items-center gap-1.5">
                      <span class="font-mono bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-bold">800 × 600 px</span>
                      سایز موبایل — نسبت 4:3
                    </p>
                    <p>• اگر تصویر موبایل نداشتید، تصویر دسکتاپ fallback می‌شود</p>
                    <p>• حداکثر ۵ اسلایدر فعال توصیه می‌شود</p>
                    <p>• تصویر پس‌زمینه گرادیان را جایگزین می‌کند</p>
                  </template>
                  <template v-else>
                    <p class="flex items-center gap-1.5">
                      <span class="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">720 × 400 px</span>
                      سایز پیشنهادی تصویر
                    </p>
                    <p>• معمولاً ۲ بنر ویژه هم‌زمان نمایش داده می‌شود</p>
                    <p>• رنگ دکمه همیشه سفید/شفاف است</p>
                    <p>• زیرعنوان در این نوع بنر نمایش داده نمی‌شود</p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <AdminButton variant="secondary" @click="closeModal">انصراف</AdminButton>
            <AdminButton :loading="saving" @click="saveModal">
              {{ editingBanner ? '✓ ذخیره تغییرات' : '+ ایجاد بنر' }}
            </AdminButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialogOpen"
      title="حذف بنر"
      :message="`بنر «${deletingBanner?.title}» حذف شود؟ این عملیات قابل بازگشت نیست.`"
      confirm-label="بله، حذف شود"
      :loading="deleting"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { bannerService } from '@/services/banner.service'
import { uploadService } from '@/services/upload.service'
import { useUiStore }    from '@/stores/ui.store'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminSkeleton   from '@/components/common/AdminSkeleton.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

// ── State ──────────────────────────────────────────────────
const allBanners      = ref([])
const loading              = ref(false)
const saving               = ref(false)
const deleting             = ref(false)
const uploading            = ref(false)
const uploadingMobile      = ref(false)
const modalOpen            = ref(false)
const editingBanner        = ref(null)
const deleteDialogOpen     = ref(false)
const deletingBanner       = ref(null)
const imageFileInput       = ref(null)
const mobileImageFileInput = ref(null)
const activeTab            = ref('hero')

const draggingIdx = ref(null)
const dragOverIdx = ref(null)
const PER_PAGE    = 10
const page        = ref(1)

// ── Tabs ───────────────────────────────────────────────────
const tabs = [
  { key: 'hero',  icon: '🖼',  label: 'اسلایدر اصلی' },
  { key: 'promo', icon: '🃏', label: 'بنرهای ویژه' },
]

const filteredBanners = computed(() =>
  allBanners.value.filter(b => b.type === activeTab.value),
)

const totalPages   = computed(() => Math.ceil(filteredBanners.value.length / PER_PAGE))
const pagedBanners = computed(() =>
  filteredBanners.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

watch(activeTab, () => { page.value = 1 })

function countByType(type) {
  return allBanners.value.filter(b => b.type === type).length
}

// ── Form ───────────────────────────────────────────────────
const badgeOptions = [
  { value: 'sale',   icon: '🏷️', label: 'حراج' },
  { value: 'new',    icon: '✨', label: 'جدید' },
  { value: 'season', icon: '🍂', label: 'فصلی' },
  { value: 'none',   icon: '✕',  label: 'بدون' },
]

const defaultForm = () => ({
  type:           'hero',
  title:          '',
  eyebrow:        '',
  subtitle:       '',
  cta:            'مشاهده محصولات',
  ctaLink:        '/',
  bgFrom:         '#0F3D73',
  bgTo:           '#1B4F8A',
  accent:         '#FFD700',
  imageUrl:       '',
  mobileImageUrl: '',
  badgeType:      'sale',
  isActive:       true,
})

const form = reactive(defaultForm())

const promoCardStyle = computed(() => {
  if (form.imageUrl) return {}
  return { background: `linear-gradient(135deg, ${form.bgFrom || '#0F3D73'} 0%, ${form.bgTo || '#1B4F8A'} 100%)` }
})

// ── Data ───────────────────────────────────────────────────
async function loadBanners() {
  loading.value = true
  try {
    const { data } = await bannerService.getAll()
    allBanners.value = Array.isArray(data) ? data : []
  } catch {
    ui.addToast('خطا در بارگذاری بنرها', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadBanners)

// ── Modal ──────────────────────────────────────────────────
function openCreate() {
  editingBanner.value = null
  Object.assign(form, defaultForm())
  form.type = activeTab.value   // lock to current tab type
  modalOpen.value = true
}

function openEdit(banner) {
  editingBanner.value = banner
  Object.assign(form, {
    type:           banner.type           ?? 'hero',
    title:          banner.title          ?? '',
    eyebrow:        banner.eyebrow        ?? '',
    subtitle:       banner.subtitle       ?? '',
    cta:            banner.cta            ?? 'مشاهده محصولات',
    ctaLink:        banner.ctaLink        ?? '/',
    bgFrom:         banner.bgFrom         ?? '#0F3D73',
    bgTo:           banner.bgTo           ?? '#1B4F8A',
    accent:         banner.accent         ?? '#FFD700',
    imageUrl:       banner.imageUrl       ?? '',
    mobileImageUrl: banner.mobileImageUrl ?? '',
    badgeType:      banner.badgeType      ?? 'sale',
    isActive:       banner.isActive       ?? true,
  })
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false }

async function saveModal() {
  if (!form.title.trim()) {
    ui.addToast('عنوان بنر الزامی است', 'error')
    return
  }
  saving.value = true
  try {
    const dto = {
      type:           form.type,
      title:          form.title.trim(),
      eyebrow:        form.eyebrow.trim(),
      subtitle:       form.subtitle.trim(),
      cta:            form.cta.trim() || 'مشاهده محصولات',
      ctaLink:        form.ctaLink.trim() || '/',
      bgFrom:         form.bgFrom,
      bgTo:           form.bgTo,
      accent:         form.accent,
      imageUrl:       form.imageUrl.trim(),
      mobileImageUrl: form.mobileImageUrl.trim(),
      badgeType:      form.badgeType,
      isActive:       form.isActive,
    }

    if (editingBanner.value) {
      const { data } = await bannerService.update(editingBanner.value._id, dto)
      const idx = allBanners.value.findIndex(b => b._id === editingBanner.value._id)
      if (idx !== -1) allBanners.value[idx] = data
      ui.addToast('بنر ویرایش شد ✓', 'success')
    } else {
      const { data } = await bannerService.create(dto)
      allBanners.value.push(data)
      ui.addToast('بنر جدید ایجاد شد ✓', 'success')
    }
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره', 'error')
  } finally {
    saving.value = false
  }
}

// ── Toggle ─────────────────────────────────────────────────
async function toggleActive(banner) {
  try {
    const { data } = await bannerService.toggleActive(banner._id)
    const idx = allBanners.value.findIndex(b => b._id === banner._id)
    if (idx !== -1) allBanners.value[idx] = { ...allBanners.value[idx], isActive: data.isActive }
    ui.addToast(data.isActive ? 'بنر فعال شد' : 'بنر غیرفعال شد', 'success')
  } catch {
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

// ── Delete ─────────────────────────────────────────────────
function confirmDelete(banner) {
  deletingBanner.value = banner
  deleteDialogOpen.value = true
}

async function doDelete() {
  if (!deletingBanner.value) return
  deleting.value = true
  try {
    await bannerService.remove(deletingBanner.value._id)
    allBanners.value = allBanners.value.filter(b => b._id !== deletingBanner.value._id)
    ui.addToast('بنر حذف شد', 'success')
    deleteDialogOpen.value = false
  } catch {
    ui.addToast('خطا در حذف بنر', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Drag & Drop (operates on filteredBanners; persists via allBanners) ────
function onDragStart(idx) { draggingIdx.value = idx }
function onDragOver(idx)  { dragOverIdx.value = idx }
function onDragEnd()      { draggingIdx.value = null; dragOverIdx.value = null }

async function onDrop(targetIdx) {
  const fromIdx = draggingIdx.value
  if (fromIdx === null || fromIdx === targetIdx) {
    draggingIdx.value = null
    dragOverIdx.value = null
    return
  }

  // Convert local page indices to absolute indices within filteredBanners
  const offset     = (page.value - 1) * PER_PAGE
  const absFrom    = offset + fromIdx
  const absTarget  = offset + targetIdx

  // Work on the filtered subset only
  const subset = [...filteredBanners.value]
  const [moved] = subset.splice(absFrom, 1)
  subset.splice(absTarget, 0, moved)

  // Reflect new order back into allBanners
  const otherType  = activeTab.value === 'hero' ? 'promo' : 'hero'
  const others     = allBanners.value.filter(b => b.type === otherType)
  allBanners.value = [...subset, ...others]

  draggingIdx.value = null
  dragOverIdx.value = null

  try {
    await bannerService.reorder(subset.map(b => b._id))
    ui.addToast('ترتیب بنرها ذخیره شد ✓', 'success')
  } catch {
    ui.addToast('خطا در ذخیره ترتیب', 'error')
    loadBanners()
  }
}

// ── Image upload ───────────────────────────────────────────
function triggerImageUpload()       { imageFileInput.value?.click() }
function triggerMobileImageUpload() { mobileImageFileInput.value?.click() }

async function onImageFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'banners')
    form.imageUrl = data?.original?.url || data?.url || ''
    ui.addToast('تصویر دسکتاپ آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

async function onMobileImageFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingMobile.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'banners')
    form.mobileImageUrl = data?.original?.url || data?.url || ''
    ui.addToast('تصویر موبایل آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر موبایل', 'error')
  } finally {
    uploadingMobile.value = false
    e.target.value = ''
  }
}
</script>
