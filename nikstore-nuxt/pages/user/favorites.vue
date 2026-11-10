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
        <button type="button" class="pager__btn" :disabled="page <= 1" aria-label="صفحه قبل" @click="page--">
          <AppIcon name="chevron-right" :size="14" :stroke-width="2" />
        </button>
        <span class="pager__label">{{ toPersianDigits(page) }} از {{ toPersianDigits(totalPages) }}</span>
        <button type="button" class="pager__btn" :disabled="page >= totalPages" aria-label="صفحه بعد" @click="page++">
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
import { productService } from '~/services/product.service'
import { useAuthStore } from '~/stores/auth.store'
import { useWishlistStore } from '~/stores/wishlist.store'
import { toPersianDigits } from '~/utils/format'

// No auth middleware: guests keep favorites in this browser, so they must be able to open them.
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'علاقه‌مندی‌ها | نیک' })

const wishlistStore = useWishlistStore()
const auth = useAuthStore()

const page = ref(1)
const products = ref([])
const totalPages = ref(1)
const loading = ref(false)

async function loadWishlist() {
  loading.value = true
  try {
    if (auth.isLoggedIn) {
      const { data } = await wishlistService.get({ page: page.value, limit: 20 })
      products.value = data.products || []
      totalPages.value = data.totalPages || 1
    } else {
      // Guest: the favorites are only product ids in localStorage — fetch their details.
      const ids = wishlistStore.ids.slice()
      if (!ids.length) {
        products.value = []
      } else {
        const { data } = await productService.getByIds(ids)
        products.value = data.products || []
      }
      totalPages.value = 1
    }
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

onMounted(loadWishlist)
watch(page, loadWishlist)
// Un-favoriting from a card here updates the store; refresh the list to match.
watch(() => wishlistStore.ids.length, loadWishlist)
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
