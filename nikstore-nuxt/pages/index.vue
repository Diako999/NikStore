<template>
  <div>
    <!-- Hero spacer — reserves the fixed hero's height in normal document
         flow so the page has room to scroll before .sheet catches up to it. -->
    <div class="hero-spacer" aria-hidden="true" />

    <!-- Hero — fixed to the viewport; .sheet scrolls up and over it -->
    <HeroBanner
      class="home-hero"
      :image-dark="heroImageDark"
      :image-light="heroImageLight"
      position-dark="85% 50%"
      position-light="50% 40%"
      :mode="mode"
    >
      <div class="hero-copy">
        <h1 class="hero-wordmark">نیک استور</h1>
      </div>
    </HeroBanner>

    <!-- Top nav — fixed above both the hero and the sheet, so it stays
         visible through the whole scroll instead of getting covered along
         with the rest of the hero. -->
    <div class="topbar">
      <BrandMark />
      <div class="top-actions">
        <IconButton type="button" :aria-label="mode === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'" @click="toggleTheme">
          <Transition name="theme-swap" mode="out-in">
            <AppIcon :key="mode" :name="mode === 'dark' ? 'sun' : 'moon'" :size="17" :stroke-width="2" />
          </Transition>
        </IconButton>
        <IconButton dot aria-label="علاقه‌مندی‌ها">
          <AppIcon name="heart" :size="17" :stroke-width="2" />
        </IconButton>
        <IconButton as="NuxtLink" to="/cart" aria-label="سبد خرید">
          <AppIcon name="bag" :size="17" :stroke-width="2" />
        </IconButton>
      </div>
    </div>

    <div class="sheet">
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

    <!-- Brands -->
    <section v-if="brands.length" class="section">
      <SectionHead title="برندهای ما" />
      <div class="row-scroll">
        <NuxtLink
          v-for="b in brands"
          :key="b._id || b.slug"
          :to="`/products?brand=${b.slug}`"
          class="brand-chip"
        >
          <img v-if="b.logo" :src="b.logo" :alt="b.name" class="brand-chip__logo">
          <span v-else class="brand-chip__initial">{{ b.name?.[0] }}</span>
          <span class="brand-chip__name">{{ b.name }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="section section--tight">
      <TrustStrip :items="trustItems" />
    </section>
    </div>
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
import { toPersianDigits2 } from '~/utils/format'

useSeoMeta({ title: 'فروشگاه پوشاک' })

// In-flow theme toggle in the hero's own icon row — the site-wide fixed
// ThemeToggle is suppressed on this page (see app.vue) since it used to sit
// pinned right on top of this same row's cart icon and stayed stuck through
// scroll, which is exactly what this in-flow version avoids.
const { mode, toggle: toggleTheme } = useTheme()

// ── Hero background — admin-configurable per theme, falls back to the
// bundled defaults when unset ──
const { settings } = useSiteSettings()
const heroImageDark = computed(() => settings.value.heroImageDark || '/images/hero-photo.jpg')
const heroImageLight = computed(() => settings.value.heroImageLight || '/images/hero-photo-light.jpg')

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

// ── Brands — admin-managed catalog brands, shown once at least one exists ──
const { data: brandsRes } = await useAsyncData(
  'home-brands',
  () => $fetch('/api/v1/brands').catch(() => []),
  { transform: (r) => r?.data ?? r ?? [] },
)
const brands = computed(() => brandsRes.value ?? [])

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
/* Fixed hero + sliding sheet — the hero is pinned to the viewport (not
   sticky: a sticky element's "stuck" range is bounded by its own parent's
   height, and since hero's parent here is the whole page, sticky made it
   stay pinned for the entire scroll instead of just the reveal zone).
   .hero-spacer reserves the hero's height in normal document flow; .sheet
   then starts in ordinary flow right at the spacer's end (no negative
   margin) and, being normal-flow content, slides upward with scroll while
   the fixed hero stays put — naturally covering it as the user scrolls,
   with no JS needed for the cover itself. */
.hero-spacer {
  /* Sits directly behind the fixed hero at the exact same position, so the
     tiny triangular gaps its rounded bottom corners cut away show this
     same glass tone instead of the raw page background — otherwise those
     slivers read as a mismatched color against the sheet's glass tint,
     which is what the rest of the page actually looks like. */
  height: 420px;
  background: var(--glass-strong);
}
.home-hero {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 0;
  height: 420px;
  max-width: 480px;
  margin-inline: auto;
  border-radius: 0 0 40px 40px;
}
.sheet {
  position: relative;
  z-index: 1;
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-radius: 0;
  padding-top: 18px;
}

.topbar {
  position: fixed;
  top: max(14px, env(safe-area-inset-top));
  inset-inline: 18px;
  z-index: 2;
  max-width: 444px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.top-actions { display: flex; gap: 8px; }

.hero-copy {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  min-height: 240px;
  padding: 150px 20px 26px;
  text-align: left;
  color: #fff;
}

.hero-wordmark {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: .5px;
  color: #fff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, .5);
}

.section { margin-bottom: 26px; }
.section--tight {
  /* Trust strip has no SectionHead above it, unlike every other section —
     without a heading's own margin to read as a "breather", the standard
     26px gap alone looks visually tighter than the rest of the page's
     rhythm. A bit of extra top margin restores the same perceived spacing. */
  margin-top: 14px;
  margin-bottom: 8px;
}

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

.brand-chip {
  flex: 0 0 auto;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 78px;
  text-align: center;
}
.brand-chip__logo,
.brand-chip__initial {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
}
.brand-chip__logo { object-fit: cover; }
.brand-chip__initial {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}
.brand-chip__name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.theme-swap-enter-active,
.theme-swap-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.theme-swap-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(.6);
}
.theme-swap-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(.6);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}
</style>
