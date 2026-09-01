<template>
  <div>
    <!-- Loading skeleton grid -->
    <div
      v-if="loading"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
    >
      <GlassCard
        v-for="i in skeletonCount"
        :key="i"
        padding="sm"
        radius="14px"
      >
        <div class="skeleton rounded-lg h-44 mb-3" />
        <div class="skeleton rounded h-4 mb-2" />
        <div class="skeleton rounded h-3.5 w-3/5 mb-3" />
        <div class="skeleton rounded h-5 w-1/2 mb-3" />
        <div class="skeleton rounded-lg h-10" />
      </GlassCard>
    </div>

    <!-- Product grid -->
    <div
      v-else-if="products.length > 0"
      ref="gridEl"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <BaseProductCard
        v-for="product in products"
        :key="product._id"
        :product="product"
        :wishlist="wishlistStore.isInWishlist(product._id)"
        @add-to-cart="handleAddToCart(product)"
        @buy-now="handleBuyNow(product)"
        @toggle-wish="wishlistStore.toggle(product._id)"
      />
    </div>

    <!-- Fetch failed — distinct from a genuine zero-result empty state -->
    <BaseEmpty
      v-else-if="error"
      icon="📡"
      title="ارتباط با سرور برقرار نشد"
      subtitle="مشکلی در دریافت محصولات پیش آمد. لطفاً اتصال خود را بررسی و دوباره تلاش کنید"
      action="تلاش دوباره"
      @action="$emit('retry')"
    />

    <!-- Empty state — fetch succeeded, genuinely zero results -->
    <BaseEmpty
      v-else
      icon="🛍️"
      title="محصولی یافت نشد"
      subtitle="فیلترهای انتخابی را تغییر دهید یا دسته‌بندی دیگری را بررسی کنید"
      action="مشاهده همه محصولات"
      to="/products"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter }        from 'vue-router'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useCartStore }     from '~/stores/cart.store'
import { useUiStore }       from '~/stores/ui.store'
import { useGsapReveal }    from '~/composables/useGsapReveal'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseEmpty       from '~/components/common/BaseEmpty.vue'
import GlassCard        from '~/components/glass/GlassCard.vue'

defineProps({
  products:      { type: Array,   default: () => [] },
  loading:       { type: Boolean, default: false },
  skeletonCount: { type: Number,  default: 12 },
  // True when the last fetch itself failed (network/5xx) rather than
  // succeeding with zero matches — shows a distinct offline/error state.
  error:         { type: Boolean, default: false },
})

defineEmits(['retry'])

const router         = useRouter()
const wishlistStore = useWishlistStore()
const cartStore     = useCartStore()
const ui            = useUiStore()

// Scroll-in stagger for the grid's initial paint — see useGsapReveal.js
// (reduced-motion aware, SSR-safe, fires once).
const gridEl = ref(null)
useGsapReveal(gridEl, { y: 20, stagger: 0.04 })

async function handleAddToCart(product) {
  const variant = product.variants?.find(v => v.stock > 0 && v.isActive !== false) ?? product.variants?.[0]
  if (!variant?._id) {
    ui.addToast('این محصول در حال حاضر قابل سفارش نیست', 'error')
    return
  }
  try {
    await cartStore.addItem(product._id, variant._id, 1)
    ui.addToast('محصول به سبد خرید افزوده شد', 'success')
  } catch {
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
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
    ui.addToast('خطا در افزودن به سبد خرید', 'error')
  }
}
</script>
