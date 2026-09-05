<template>
  <div>
    <!-- Hero -->
    <HeroBanner image="/images/hero-photo.jpg">
      <div class="topbar">
        <BrandMark />
        <div class="top-actions">
          <IconButton dot aria-label="علاقه‌مندی‌ها">
            <AppIcon name="heart" :size="17" :stroke-width="2" />
          </IconButton>
          <IconButton as="NuxtLink" to="/cart" aria-label="سبد خرید">
            <AppIcon name="bag" :size="17" :stroke-width="2" />
          </IconButton>
        </div>
      </div>

      <div class="hero-copy">
        <span class="eyebrow">پیشنهاد ویژه هفته</span>
        <h1>هودی پرفورمنس مردانه</h1>
        <div class="price-row">
          <span class="compare">{{ formatNumber(4200000) }}</span>
          <span class="price">{{ formatNumber(3250000) }}<small> تومان</small></span>
        </div>
        <NuxtLink to="/product/hoodie-performance" class="btn-primary">
          خرید فوری
          <AppIcon name="arrow" :size="16" :stroke-width="2" />
        </NuxtLink>
      </div>
    </HeroBanner>

    <SearchBar />

    <!-- Categories -->
    <section class="section">
      <CategoryGrid :categories="categoryTiles" />
    </section>

    <!-- Flash sale -->
    <section class="section">
      <GlassBanner variant="flash">
        <div>
          <div class="flash-t1">⚡ فروش ویژه امروز</div>
          <div class="flash-t2">تا ۴۰٪ تخفیف، فقط تا پایان امشب</div>
        </div>
        <div class="timer">
          <span>{{ hh }}</span><span>:</span><span>{{ mm }}</span><span>:</span><span>{{ ss }}</span>
        </div>
      </GlassBanner>
    </section>

    <!-- Newest products -->
    <section class="section">
      <SectionHead title="جدیدترین محصولات" to="/products?sort=newest" />
      <div class="row-scroll">
        <template v-if="pendingNew">
          <div v-for="i in 4" :key="i" class="p-skel" />
        </template>
        <template v-else-if="newest.length">
          <ProductCard
            v-for="(p, i) in newest"
            :key="p._id || p.slug"
            class="row-scroll__item"
            :product="mapProduct(p)"
            :badge="i === 0 ? 'جدید' : null"
          />
        </template>
        <p v-else class="empty-hint">هنوز محصولی ثبت نشده است</p>
      </div>
    </section>

    <!-- Promo banner -->
    <section class="section">
      <GlassBanner variant="promo" to="/products">
        <div class="promo-txt">
          <div class="promo-kicker">کالکشن پاییزه</div>
          <h3 class="promo-title">۲۰٪ تخفیف ویژه</h3>
          <span class="promo-cta">مشاهده کالکشن</span>
        </div>
        <div class="promo-num">٪۲۰</div>
      </GlassBanner>
    </section>

    <!-- Bestsellers -->
    <section class="section">
      <SectionHead title="پرفروش‌ترین‌ها" to="/products?sort=bestseller" />
      <div v-if="pendingBest || bestsellers.length" class="grid2">
        <template v-if="pendingBest">
          <div v-for="i in 2" :key="i" class="p-skel p-skel--grid" />
        </template>
        <ProductCard
          v-for="(p, i) in bestsellers"
          v-else
          :key="p._id || p.slug"
          :product="mapProduct(p)"
          :badge="i === 0 ? 'پرفروش' : null"
          :thumb-height="150"
        />
      </div>
      <p v-else class="empty-hint">هنوز محصولی ثبت نشده است</p>
    </section>

    <!-- Trust strip -->
    <section class="section section--tight">
      <TrustStrip :items="trustItems" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import BrandMark from '~/components/ui/BrandMark.vue'
import IconButton from '~/components/ui/IconButton.vue'
import HeroBanner from '~/components/ui/HeroBanner.vue'
import SearchBar from '~/components/ui/SearchBar.vue'
import CategoryGrid from '~/components/ui/CategoryGrid.vue'
import GlassBanner from '~/components/ui/GlassBanner.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import ProductCard from '~/components/ui/ProductCard.vue'
import TrustStrip from '~/components/ui/TrustStrip.vue'
import { formatNumber, toPersianDigits2 } from '~/utils/format'

useSeoMeta({ title: 'فروشگاه پوشاک' })

// ── Category grid — real data with fixed, spec-literal presentation ──
// (labels/icons/order are the store's structural nav categories, same as
// the mockup; only the destination link is resolved from live category
// slugs when the backend has matching seeded categories).
const STATIC_TILES = [
  { key: 'women', icon: 'women', label: 'زنانه', sub: 'مد و پوشاک زنانه', gender: 'women' },
  { key: 'men', icon: 'men', label: 'مردانه', sub: 'استایل مردانه', gender: 'men' },
  { key: 'kids', icon: 'kids', label: 'بچگانه', sub: 'راحت و شاد برای کودکان', gender: 'kids' },
]

const { data: rootCategories } = await useAsyncData(
  'home-categories',
  () => $fetch('/api/v1/categories/roots').catch(() => []),
  { transform: (r) => r?.data ?? r ?? [] },
)

const categoryTiles = computed(() => {
  const roots = rootCategories.value ?? []
  return STATIC_TILES.map((tile) => {
    const match = roots.find((c) => c.gender === tile.gender)
    return { ...tile, to: match ? `/category/${match.slug}` : '/products' }
  })
})

// ── Product rows — real data, sorted newest / bestseller ──
const { data: newRes, pending: pendingNew } = await useAsyncData(
  'home-newest',
  () => $fetch('/api/v1/products', { params: { sort: 'newest', limit: 4, status: 'active' } }),
  { transform: (r) => r?.data ?? r },
)
const { data: bestRes, pending: pendingBest } = await useAsyncData(
  'home-bestsellers',
  () => $fetch('/api/v1/products', { params: { sort: 'bestseller', limit: 2, status: 'active' } }),
  { transform: (r) => r?.data ?? r, lazy: true },
)

const newest = computed(() => newRes.value?.products ?? [])
const bestsellers = computed(() => bestRes.value?.products ?? [])

function mapProduct(p) {
  const image = p.thumbnail || p.images?.[0] || ''
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: p.finalPrice ?? p.minPrice ?? 0,
    image,
  }
}

// ── Flash-sale countdown — client-only demo timer, no persistence ──
const now = ref(null)
let timer = null
const endsAt = Date.now() + (2 * 3_600_000 + 14 * 60_000 + 36_000)

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const remainingMs = computed(() => (now.value === null ? null : Math.max(0, endsAt - now.value)))
const hh = computed(() => (remainingMs.value === null ? '۰۲' : toPersianDigits2(Math.floor(remainingMs.value / 3_600_000))))
const mm = computed(() => (remainingMs.value === null ? '۱۴' : toPersianDigits2(Math.floor((remainingMs.value % 3_600_000) / 60_000))))
const ss = computed(() => (remainingMs.value === null ? '۳۶' : toPersianDigits2(Math.floor((remainingMs.value % 60_000) / 1000))))

const trustItems = [
  { icon: 'truck', label: 'ارسال رایگان' },
  { icon: 'shield', label: 'ضمانت اصالت' },
  { icon: 'card', label: 'پرداخت امن' },
  { icon: 'refresh', label: '۷ روز مهلت مرجوعی' },
]
</script>

<style scoped>
.topbar {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 0;
}
.top-actions { display: flex; gap: 8px; }

.hero-copy {
  position: relative;
  z-index: 3;
  padding: 150px 20px 26px;
  max-width: 80%;
  color: #fff;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
}
[data-theme='light'] .eyebrow {
  background: rgba(9, 15, 12, .38);
  border-color: rgba(255, 255, 255, .25);
}
.eyebrow::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brand-light);
}

.hero-copy h1 {
  font-size: 22px;
  line-height: 1.4;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, .45);
}

.price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
.compare { font-size: 12px; text-decoration: line-through; color: rgba(255, 255, 255, .55); }
.price { font-size: 16px; font-weight: 700; color: #fff; }
.price small { font-size: 11px; font-weight: 500; color: rgba(255, 255, 255, .7); }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  padding: 12px 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border: 1px solid rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
}

.section { margin-bottom: 26px; }
.section--tight { margin-bottom: 8px; }

.flash-t1 { font-size: 14px; font-weight: 700; margin-bottom: 3px; color: #fff; }
[data-theme='light'] .flash-t1 { color: var(--text-primary); }
.flash-t2 { font-size: 11px; color: rgba(245, 247, 243, .75); }
[data-theme='light'] .flash-t2 { color: var(--text-secondary); }

.timer { display: flex; gap: 5px; }
.timer span {
  border-radius: 7px;
  padding: 6px 7px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(9, 15, 12, .4);
  border: 1px solid var(--glass-border);
  color: #fff;
}
[data-theme='light'] .timer span {
  background: rgba(255, 255, 255, .6);
  color: var(--text-primary);
}

.row-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 2px 18px 8px;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}
.row-scroll::-webkit-scrollbar { display: none; }
.row-scroll__item { flex: 0 0 132px; scroll-snap-align: start; }
.p-skel { flex: 0 0 132px; height: 200px; border-radius: 18px; background: var(--glass); animation: pulse 1.6s ease-in-out infinite; }
.p-skel--grid { flex: unset; height: 230px; }

.empty-hint { margin: 0 18px; font-size: 12.5px; color: var(--text-secondary); }

.promo-txt { position: relative; }
.promo-kicker { font-size: 10.5px; font-weight: 700; letter-spacing: .5px; margin-bottom: 6px; color: var(--brand-light); }
[data-theme='light'] .promo-kicker { color: var(--brand-dark); }
.promo-title { font-size: 17px; font-weight: 800; margin-bottom: 10px; color: #fff; }
[data-theme='light'] .promo-title { color: var(--text-primary); }
.promo-cta {
  font-size: 12px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 999px;
  display: inline-block;
  color: #16241C;
  background: #F5F7F3;
}
[data-theme='light'] .promo-cta { color: #fff; background: var(--brand-dark); }
.promo-num { font-size: 34px; font-weight: 800; color: rgba(255, 255, 255, .18); position: relative; }
[data-theme='light'] .promo-num { color: rgba(30, 40, 34, .10); }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 18px; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}
</style>
