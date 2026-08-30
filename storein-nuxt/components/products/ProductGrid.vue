<template>
  <div>
    <!-- Loading skeleton grid -->
    <div
      v-if="loading"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="rounded-xl p-3" style="background-color: var(--color-card);"
      >
        <div class="skeleton rounded-lg h-44 mb-3" />
        <div class="skeleton rounded h-4 mb-2" />
        <div class="skeleton rounded h-3.5 w-3/5 mb-3" />
        <div class="skeleton rounded h-5 w-1/2 mb-3" />
        <div class="skeleton rounded-lg h-10" />
      </div>
    </div>

    <!-- Product grid -->
    <div
      v-else-if="products.length > 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
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

    <!-- Empty state -->
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
import { useRouter }        from 'vue-router'
import { useWishlistStore } from '~/stores/wishlist.store'
import { useCartStore }     from '~/stores/cart.store'
import { useUiStore }       from '~/stores/ui.store'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseEmpty       from '~/components/common/BaseEmpty.vue'

defineProps({
  products:      { type: Array,   default: () => [] },
  loading:       { type: Boolean, default: false },
  skeletonCount: { type: Number,  default: 12 },
})

const router         = useRouter()
const wishlistStore = useWishlistStore()
const cartStore     = useCartStore()
const ui            = useUiStore()

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
