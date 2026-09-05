<template>
  <div class="favorites">
    <SectionHead title="علاقه‌مندی‌ها" />

    <section class="panel">
      <div v-if="loading" class="grid2">
        <div v-for="i in 4" :key="i" class="skel" />
      </div>

      <p v-else-if="!products.length" class="empty-hint">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید</p>

      <div v-else class="grid2">
        <ProductCard
          v-for="p in products"
          :key="p._id"
          :product="mapProduct(p)"
          :thumb-height="150"
        />
      </div>

      <div v-if="totalPages > 1" class="pager">
        <button type="button" class="pager__btn" :disabled="page <= 1" @click="page--">
          <AppIcon name="chevron-right" :size="14" :stroke-width="2" />
        </button>
        <span class="pager__label">{{ toPersianDigits(page) }} از {{ toPersianDigits(totalPages) }}</span>
        <button type="button" class="pager__btn" :disabled="page >= totalPages" @click="page++">
          <AppIcon name="chevron-left" :size="14" :stroke-width="2" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import ProductCard from '~/components/ui/ProductCard.vue'
import { wishlistService } from '~/services/wishlist.service'
import { useWishlistStore } from '~/stores/wishlist.store'
import { toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'علاقه‌مندی‌ها | نیک' })

const wishlistStore = useWishlistStore()

const page = ref(1)
const products = ref([])
const totalPages = ref(1)
const loading = ref(false)

async function loadWishlist() {
  loading.value = true
  try {
    const { data } = await wishlistService.get({ page: page.value, limit: 20 })
    products.value = data.products || []
    totalPages.value = data.totalPages || 1
  } finally {
    loading.value = false
  }
}

function mapProduct(p) {
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: p.finalPrice ?? p.minPrice ?? 0,
    image: p.thumbnail || p.images?.[0] || '',
  }
}

// Merge any products favorited while browsing as a guest (local store) into
// the server wishlist so they show up here too.
async function mergeGuestWishlist() {
  const localIds = wishlistStore.ids.slice()
  if (!localIds.length) return
  const known = new Set(products.value.map((p) => p._id))
  const missing = localIds.filter((id) => !known.has(id))
  if (!missing.length) return
  await Promise.all(missing.map((id) => wishlistService.toggle(id).catch(() => null)))
  await loadWishlist()
}

onMounted(async () => {
  await loadWishlist()
  await mergeGuestWishlist()
})
watch(page, loadWishlist)
</script>

<style scoped>
.favorites { padding: 24px 0 8px; }
.panel { margin: 0 18px; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.skel { height: 230px; border-radius: 18px; background: var(--glass); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }

.empty-hint { font-size: 12.5px; color: var(--text-secondary); padding: 8px 2px; }

.pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding-top: 18px; }
.pager__btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.pager__btn:disabled { opacity: .4; cursor: not-allowed; }
.pager__label { font-size: 12px; color: var(--text-secondary); }
</style>
