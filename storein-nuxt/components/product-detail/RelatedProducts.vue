<template>
  <section v-if="products.length > 0 || loading" class="mt-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-text-primary">محصولات مرتبط</h2>
      <NuxtLink
        :to="`/category/${categorySlug}`"
        class="text-brand text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
      >
        مشاهده همه
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
    </div>

    <!-- Horizontal scroll row -->
    <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-2">

      <!-- Skeleton -->
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="min-w-[180px] rounded-xl p-3 flex-shrink-0" style="background-color: var(--color-card);">
          <BaseSkeleton height="150px" class="rounded-lg mb-3" />
          <BaseSkeleton height="1rem" class="mb-2" />
          <BaseSkeleton height="1.25rem" width="60%" />
        </div>
      </template>

      <!-- Real products -->
      <template v-else>
        <div
          v-for="product in products"
          :key="product._id"
          class="min-w-[180px] max-w-[180px] flex-shrink-0"
        >
          <BaseProductCard
            :product="product"
            :wishlist="wishlistStore.isInWishlist(product._id)"
            @add-to-cart="handleAddToCart(product)"
            @buy-now="handleBuyNow(product)"
            @toggle-wish="wishlistStore.toggle(product._id)"
          />
        </div>
      </template>

    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }        from 'vue-router'
import { productService }   from '~/services/product.service'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useCartStore }     from '~/stores/cart.store'
import { useUiStore }       from '~/stores/ui.store'
import BaseSkeleton    from '~/components/common/BaseSkeleton.vue'
import BaseProductCard from '~/components/common/BaseProductCard.vue'

const props = defineProps({
  categorySlug: { type: String, default: '' },
  excludeId:    { type: String, default: '' },
})

const router         = useRouter()
const wishlistStore = useWishlistStore()
const cartStore     = useCartStore()
const ui            = useUiStore()

const products = ref([])
const loading  = ref(true)

async function handleAddToCart(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) {
    ui.addToast('این محصول در حال حاضر قابل سفارش نیست', 'error')
    return
  }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد ✓', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد', 'error')
  }
}

async function handleBuyNow(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) {
    ui.addToast('این محصول در حال حاضر قابل سفارش نیست', 'error')
    return
  }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    router.push('/checkout')
  } catch {
    ui.addToast('خطا در افزودن به سبد', 'error')
  }
}

onMounted(async () => {
  if (!props.categorySlug) { loading.value = false; return }
  try {
    const { data } = await productService.getAll({
      category: props.categorySlug, limit: 8, status: 'active',
    })
    products.value = (data?.items ?? []).filter(p => p._id !== props.excludeId)
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})
</script>
