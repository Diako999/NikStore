<template>
  <Teleport to="body">
    <Transition name="detail-modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.6);"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="glass-surface w-full max-w-3xl flex flex-col overflow-hidden"
          style="max-height: 90vh;"
        >

          <!-- ── Header ─────────────────────────────────────── -->
          <div class="relative flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <h2 class="font-bold text-glass-text-primary text-base truncate">{{ product?.name }}</h2>
              <span :class="statusClass(product?.status)" class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {{ statusLabel(product?.status) }}
              </span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <RouterLink
                v-if="productId"
                :to="{ name: 'product-edit', params: { id: productId } }"
                class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                @click="$emit('update:modelValue', false)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                ویرایش
              </RouterLink>
              <button
                @click="$emit('update:modelValue', false)"
                class="w-8 h-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-glass transition-colors flex items-center justify-center"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ── Loading ────────────────────────────────────── -->
          <div v-if="loading" class="relative flex-1 flex items-center justify-center py-20">
            <div class="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"/>
          </div>

          <!-- ── Body ──────────────────────────────────────── -->
          <div v-else-if="detail" class="relative flex-1 overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0">

              <!-- Left: Images -->
              <div class="border-b md:border-b-0 md:border-l border-border p-5 flex flex-col gap-3">
                <!-- Main image -->
                <div class="w-full aspect-square rounded-xl overflow-hidden bg-surface flex items-center justify-center">
                  <img
                    v-if="activeImage"
                    :src="activeImage"
                    :alt="detail.name"
                    class="w-full h-full object-contain"
                  />
                  <svg v-else class="w-12 h-12 text-text-disabled" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5h.008v.008H6.75V7.5zm10.5 0h.008v.008h-.008V7.5zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z"/>
                  </svg>
                </div>

                <!-- Thumbnails -->
                <div v-if="allImages.length > 1" class="grid grid-cols-4 gap-1.5">
                  <button
                    v-for="(img, i) in allImages"
                    :key="i"
                    @click="activeImage = img"
                    :class="[
                      'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      activeImage === img ? 'border-primary' : 'border-transparent hover:border-border',
                    ]"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                  </button>
                </div>

                <!-- Slug -->
                <div class="mt-auto pt-2">
                  <p class="text-[11px] text-text-disabled font-mono break-all" dir="ltr">{{ detail.slug }}</p>
                </div>
              </div>

              <!-- Right: Info -->
              <div class="p-5 space-y-5">

                <!-- Key stats row -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="rounded-xl p-3 text-center" style="background-color: var(--color-bg);">
                    <p class="text-xs text-text-secondary mb-1">قیمت</p>
                    <p class="font-bold text-text-primary font-fanum text-sm">{{ formatPrice(detail.minPrice) }}</p>
                  </div>
                  <div class="rounded-xl p-3 text-center" style="background-color: var(--color-bg);">
                    <p class="text-xs text-text-secondary mb-1">موجودی</p>
                    <p :class="['font-bold font-fanum text-sm', detail.totalStock === 0 ? 'text-error' : detail.totalStock < 5 ? 'text-warning' : 'text-text-primary']">
                      {{ formatNumber(detail.totalStock) }}
                    </p>
                  </div>
                  <div class="rounded-xl p-3 text-center" style="background-color: var(--color-bg);">
                    <p class="text-xs text-text-secondary mb-1">تخفیف</p>
                    <p class="font-bold text-sm" :class="discountPct > 0 ? 'text-red-500' : 'text-text-disabled'">
                      {{ discountPct > 0 ? discountPct + '٪' : '—' }}
                    </p>
                  </div>
                </div>

                <!-- Meta info -->
                <div class="space-y-2.5">
                  <div v-if="detail.category?.name" class="flex items-center gap-2 text-sm">
                    <span class="text-text-secondary w-24 flex-shrink-0">دسته‌بندی</span>
                    <span class="font-medium text-text-primary">{{ detail.category.name }}</span>
                  </div>
                  <div v-if="detail.brand?.name" class="flex items-center gap-2 text-sm">
                    <span class="text-text-secondary w-24 flex-shrink-0">برند</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {{ detail.brand.name }}
                    </span>
                  </div>
                  <div v-if="detail.avgRating" class="flex items-center gap-2 text-sm">
                    <span class="text-text-secondary w-24 flex-shrink-0">امتیاز</span>
                    <span class="font-medium text-text-primary flex items-center gap-1">
                      <svg class="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {{ detail.avgRating?.toFixed(1) }}
                      <span class="text-text-disabled">({{ formatNumber(detail.reviewCount) }})</span>
                    </span>
                  </div>
                  <div v-if="detail.soldCount" class="flex items-center gap-2 text-sm">
                    <span class="text-text-secondary w-24 flex-shrink-0">فروش</span>
                    <span class="font-medium text-text-primary font-fanum">{{ formatNumber(detail.soldCount) }} عدد</span>
                  </div>
                  <div v-if="detail.tags?.length" class="flex items-start gap-2 text-sm">
                    <span class="text-text-secondary w-24 flex-shrink-0 mt-0.5">تگ‌ها</span>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in detail.tags"
                        :key="tag"
                        class="text-xs px-2 py-0.5 rounded-full border border-border text-text-secondary"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Variants -->
                <div v-if="detail.variants?.length">
                  <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    ویریانت‌ها ({{ detail.variants.length }})
                  </p>
                  <div class="rounded-xl overflow-hidden border border-border">
                    <table class="w-full text-xs">
                      <thead>
                        <tr style="background-color: var(--color-bg);">
                          <th class="text-right px-3 py-2 font-semibold text-text-secondary">SKU</th>
                          <th class="text-right px-3 py-2 font-semibold text-text-secondary">مشخصات</th>
                          <th class="text-right px-3 py-2 font-semibold text-text-secondary">قیمت</th>
                          <th class="text-center px-3 py-2 font-semibold text-text-secondary">موجودی</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="v in detail.variants"
                          :key="v._id || v.sku"
                          class="border-t border-border"
                          :class="v.isActive === false ? 'opacity-40' : ''"
                        >
                          <td class="px-3 py-2 font-mono text-text-disabled" dir="ltr">{{ v.sku }}</td>
                          <td class="px-3 py-2">
                            <div class="flex flex-wrap gap-1">
                              <span
                                v-for="attr in v.attributes"
                                :key="attr.key"
                                class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-surface text-text-secondary"
                              >
                                <span class="font-medium text-text-primary">{{ attr.key }}:</span>
                                {{ attr.value }}
                              </span>
                            </div>
                          </td>
                          <td class="px-3 py-2 font-fanum">
                            <div>
                              <span class="font-bold text-text-primary">{{ formatPrice(v.price) }}</span>
                              <span v-if="v.comparePrice > 0" class="block text-text-disabled line-through text-[10px]">
                                {{ formatPrice(v.comparePrice) }}
                              </span>
                            </div>
                          </td>
                          <td class="px-3 py-2 text-center font-fanum font-bold"
                            :class="v.stock === 0 ? 'text-error' : v.stock < 5 ? 'text-warning' : 'text-text-primary'">
                            {{ formatNumber(v.stock) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ── Footer ─────────────────────────────────────── -->
          <div v-if="detail" class="relative flex-shrink-0 border-t border-glass-border px-6 py-3 flex items-center justify-between text-xs text-text-disabled">
            <span dir="ltr">ID: {{ detail._id }}</span>
            <span>ایجاد: {{ formatDate(detail.createdAt) }}</span>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { productService } from '@/services/product.service'
import { formatPrice, formatNumber } from '@/utils/formatters'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  productId:  { type: String,  default: null },
  product:    { type: Object,  default: null },
})
defineEmits(['update:modelValue'])

const detail      = ref(null)
const loading     = ref(false)
const activeImage = ref(null)

const allImages = computed(() => {
  const imgs = []
  if (detail.value?.thumbnail) imgs.push(detail.value.thumbnail)
  for (const img of detail.value?.images ?? []) {
    if (!imgs.includes(img)) imgs.push(img)
  }
  return imgs
})

const discountPct = computed(() => {
  if (!detail.value) return 0
  const sysPct = detail.value.discountPercentage ?? 0
  const maxCompare = Math.max(
    0,
    ...(detail.value.variants ?? [])
      .filter(v => v.comparePrice > 0 && v.isActive !== false)
      .map(v => v.comparePrice),
  )
  const variantPct = (!maxCompare || !detail.value.minPrice || maxCompare <= detail.value.minPrice)
    ? 0
    : Math.round((1 - detail.value.minPrice / maxCompare) * 100)
  return Math.max(sysPct, variantPct)
})

watch(() => props.modelValue, async (open) => {
  if (!open) { detail.value = null; return }
  const id = props.productId ?? props.product?._id
  if (!id) return
  loading.value = true
  try {
    const { data } = await productService.getById(id)
    detail.value = data
    activeImage.value = data?.thumbnail || data?.images?.[0] || null
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
})

function statusLabel(s) {
  return { active: 'فعال', draft: 'پیش‌نویس', inactive: 'غیرفعال' }[s] ?? s
}
function statusClass(s) {
  return {
    active:   'bg-green-100 text-green-700',
    draft:    'bg-yellow-100 text-yellow-700',
    inactive: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600'
}

function formatDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}
</script>

<style scoped>
.detail-modal-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.4,0.64,1);
}
.detail-modal-leave-active {
  transition: opacity 0.2s ease, transform 0.15s ease;
}
.detail-modal-enter-from,
.detail-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
</style>
