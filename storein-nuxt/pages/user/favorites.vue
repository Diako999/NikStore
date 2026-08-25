<template>
  <div class="container-main py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        علاقه‌مندی‌ها
        <span v-if="total > 0" class="font-fanum text-text-secondary text-base font-normal mr-2">
          ({{ formatNumber(total) }} محصول)
        </span>
      </h1>

      <template v-if="products.length">
        <div v-if="confirmingClear" class="flex items-center gap-2 text-sm">
          <span class="text-text-secondary">همه حذف شوند؟</span>
          <button @click="doClear" :disabled="clearing" class="text-error font-medium hover:underline disabled:opacity-50">بله</button>
          <button @click="confirmingClear = false" class="text-text-secondary hover:underline">خیر</button>
        </div>
        <button v-else @click="confirmingClear = true" class="text-sm text-text-secondary hover:text-error transition-colors">
          پاک کردن همه
        </button>
      </template>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <BaseProductCard v-for="i in 8" :key="i" :loading="true" />
    </div>

    <!-- Empty -->
    <BaseEmpty
      v-else-if="!products.length"
      icon="❤️"
      title="علاقه‌مندی شما خالی است"
      subtitle="محصولات دلخواه‌تان را با زدن دکمه قلب ذخیره کنید"
      action="مشاهده محصولات"
      :to="'/products'"
    />

    <!-- Grid -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="product in products" :key="product._id" class="relative">
          <BaseProductCard
            :product="product"
            :wishlist="true"
            @toggle-wish="handleRemove(product)"
            @add-to-cart="handleAddToCart(product)"
            @buy-now="handleAddToCart(product)"
          />
          <!-- Removing overlay -->
          <Transition name="fade">
            <div
              v-if="removingId === product._id"
              class="absolute inset-0 rounded-xl flex items-center justify-center z-10"
              style="background: rgba(0,0,0,0.4)"
            >
              <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
        <button
          v-for="p in totalPages" :key="p"
          @click="page = p; fetchFavorites()"
          :class="[
            'w-9 h-9 rounded-lg text-sm font-medium transition-colors font-fanum',
            page === p
              ? 'bg-brand text-white'
              : 'border border-surface-border text-text-secondary hover:text-text-primary',
          ]"
        >
          {{ p }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'علاقه‌مندی‌ها', robots: 'noindex,nofollow' })


import { ref, onMounted }    from 'vue'
import { useRouter }         from 'vue-router'
import { wishlistService }   from '~/services/wishlist.service'
import { useWishlistStore }  from '~/stores/wishlist.store'
import { useUiStore }        from '~/stores/ui.store'
import { formatNumber }      from '~/utils/formatters'
import BaseProductCard from '~/components/common/BaseProductCard.vue'
import BaseEmpty       from '~/components/common/BaseEmpty.vue'

const wishlistStore = useWishlistStore()
const router        = useRouter()
const ui            = useUiStore()

const products        = ref([])
const total           = ref(0)
const totalPages      = ref(1)
const page            = ref(1)
const loading         = ref(true)
const removingId      = ref(null)
const confirmingClear = ref(false)
const clearing        = ref(false)

async function fetchFavorites() {
  loading.value = true
  try {
    const { data } = await wishlistService.getAll({ page: page.value, limit: 16 })
    products.value  = data.products ?? []
    total.value     = data.total ?? 0
    totalPages.value = data.totalPages ?? 1
  } catch {
    ui.addToast('خطا در دریافت علاقه‌مندی‌ها', 'error')
  } finally {
    loading.value = false
  }
}

async function handleRemove(product) {
  if (removingId.value) return
  removingId.value = product._id
  try {
    await wishlistStore.toggle(product._id)
    // Remove from local list with animation
    products.value = products.value.filter(p => p._id !== product._id)
    total.value = Math.max(0, total.value - 1)
    // If page is now empty and not first page, go back
    if (products.value.length === 0 && page.value > 1) {
      page.value--
      await fetchFavorites()
    }
  } finally {
    removingId.value = null
  }
}

async function doClear() {
  clearing.value = true
  try {
    await wishlistService.clear()
    wishlistStore.wishlistIds = new Set()
    products.value = []
    total.value    = 0
    confirmingClear.value = false
    ui.addToast('علاقه‌مندی‌ها پاک شد', 'success')
  } catch {
    ui.addToast('خطا در پاک کردن علاقه‌مندی‌ها', 'error')
  } finally {
    clearing.value = false
  }
}

function handleAddToCart(product) {
  // Wishlist response doesn't include variants — navigate to product page for selection
  if (product?.slug) router.push(`/product/${product.slug}`)
}

onMounted(fetchFavorites)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
