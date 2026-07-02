<template>
  <div class="container-main py-8 min-h-[60vh]">

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        سبد خرید
        <span v-if="cartStore.items.length" class="font-fanum text-text-secondary text-base font-normal mr-2">({{ formatNumber(cartStore.totalItems) }} کالا)</span>
      </h1>
      <template v-if="cartStore.items.length">
        <div v-if="confirmingClear" role="alert" class="flex items-center gap-2 text-sm">
          <span class="text-text-secondary">پاک شود؟</span>
          <button @click="doClear" :disabled="clearing" class="text-error font-medium hover:underline disabled:opacity-50">بله</button>
          <button @click="confirmingClear = false" class="text-text-secondary hover:underline">خیر</button>
        </div>
        <button v-else @click="confirmingClear = true" class="text-sm text-text-secondary hover:text-error transition-colors">پاک کردن سبد</button>
      </template>
    </div>

    <div v-if="cartStore.loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div v-for="i in 3" :key="i" class="h-32 rounded-2xl skeleton" />
      </div>
      <div class="h-72 rounded-2xl skeleton" />
    </div>

    <BaseEmpty
      v-else-if="!cartStore.items.length"
      icon="🛒"
      title="سبد خرید شما خالی است"
      subtitle="محصولات مورد علاقه‌تان را به سبد خرید اضافه کنید"
      action="مشاهده محصولات"
      to="/products"
    />

    <div v-else>

      <!-- Mixed cart warning (UXID-013) -->
      <div v-if="cartStore.hasMixedCart" role="alert" class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-6">
        <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <p class="font-bold text-amber-800 mb-1 text-sm">سبد شما شامل هر دو نوع سفارش است</p>
          <p class="text-text-secondary text-xs leading-relaxed">آیتم‌های عمده و تکی باید جداگانه ثبت شوند. از دو دکمه پایین هر بخش برای ثبت سفارش استفاده کنید.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <!-- Items column -->
        <div class="lg:col-span-2 flex flex-col gap-8">

          <!-- Wholesale section (UXID-013) -->
          <section v-if="cartStore.hasWholesaleItems" aria-label="سبد سفارش عمده">
            <div class="flex items-center gap-2 mb-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <svg class="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <h2 class="font-bold text-amber-800 text-sm">سبد عمده</h2>
              <span class="text-xs text-amber-600 mr-1 font-fanum">({{ formatNumber(cartStore.wholesaleItems.reduce((s,i)=>s+i.quantity,0)) }} عدد)</span>
            </div>
            <TransitionGroup name="cart-item" tag="div" class="flex flex-col gap-4">
              <div
                v-for="item in cartStore.wholesaleItems"
                :key="`${item.productId}-${item.variantId}`"
                class="flex gap-4 p-4 rounded-2xl transition-all bg-card border border-amber-200/50"
              >
                <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl" @error="e => e.target.src = PLACEHOLDER" />
                </NuxtLink>
                <div v-else class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 object-cover rounded-xl" />
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="text-text-primary font-medium text-sm leading-6 hover:text-brand line-clamp-2 transition-colors">{{ item.name }}</NuxtLink>
                    <span v-else class="text-text-primary font-medium text-sm line-clamp-2">{{ item.name }}</span>
                    <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">🏪 قیمت عمده</span>
                  </div>
                  <div v-if="item.attributes?.length" class="flex flex-wrap gap-1.5">
                    <span v-for="attr in item.attributes" :key="attr.key" class="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-lg border border-surface-border">{{ attr.key }}: {{ attr.value }}</span>
                  </div>
                  <div class="flex items-center justify-between mt-auto flex-wrap gap-3 pt-1">
                    <!-- 3-level price display for wholesale items -->
                    <div>
                      <!-- Level 1: retail price — only when system discount is also active -->
                      <div v-if="item.retailPrice" class="flex items-center gap-1.5 leading-none mb-0.5">
                        <span class="text-text-disabled line-through text-[11px] font-fanum">{{ formatPrice(item.retailPrice) }}</span>
                        <span class="text-[9px] text-text-disabled opacity-70 font-bold">خرده</span>
                      </div>
                      <!-- Level 2: wholesale price — crossed out when system discount active -->
                      <div v-if="item.comparePrice > item.price" class="flex items-center gap-1.5 leading-none mb-0.5">
                        <span :class="['line-through text-xs font-fanum', item.retailPrice ? 'text-amber-700/60' : 'text-text-disabled']">
                          {{ formatPrice(item.comparePrice) }}
                        </span>
                        <span v-if="item.retailPrice" class="text-[9px] text-amber-700/60 font-bold">عمده</span>
                      </div>
                      <!-- Level 3: final price -->
                      <div class="text-text-primary font-bold font-fanum">{{ formatPrice(item.price) }}</div>
                      <div class="text-text-secondary text-xs font-fanum mt-0.5">جمع: {{ formatPrice(item.price * item.quantity) }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button @click="handleRemove(item)" :disabled="removingKey === itemKey(item)" :aria-label="`حذف ${item.name} از سبد خرید`" class="text-text-disabled hover:text-error transition-colors disabled:opacity-50 w-11 h-11 flex items-center justify-center">
                        <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      <div class="flex items-center border border-surface-border rounded-xl overflow-hidden">
                        <button @click="changeQty(item, item.quantity - 1)" :disabled="item.quantity <= 1 || updatingKey === itemKey(item)" :aria-label="`کاهش تعداد ${item.name}`" class="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 12H4"/></svg>
                        </button>
                        <span class="w-11 text-center font-fanum text-sm font-bold text-text-primary select-none" aria-live="polite" aria-atomic="true">{{ formatNumber(item.quantity) }}</span>
                        <button @click="changeQty(item, item.quantity + 1)" :disabled="item.quantity >= item.stock || updatingKey === itemKey(item)" :aria-label="`افزایش تعداد ${item.name}`" class="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </section>

          <!-- Retail section (UXID-013) -->
          <section v-if="cartStore.hasRetailItems" aria-label="سبد سفارش تکی">
            <div class="flex items-center gap-2 mb-3 px-3.5 py-2 rounded-xl bg-surface border border-surface-border">
              <svg class="w-4 h-4 text-text-secondary flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <h2 class="font-bold text-text-primary text-sm">سبد خرده</h2>
              <span class="text-xs text-text-secondary mr-1 font-fanum">({{ formatNumber(cartStore.retailItems.reduce((s,i)=>s+i.quantity,0)) }} عدد)</span>
            </div>
            <TransitionGroup name="cart-item" tag="div" class="flex flex-col gap-4">
              <div
                v-for="item in cartStore.retailItems"
                :key="`${item.productId}-${item.variantId}`"
                class="flex gap-4 p-4 rounded-2xl border border-surface-border transition-all bg-card"
              >
                <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl" @error="e => e.target.src = PLACEHOLDER" />
                </NuxtLink>
                <div v-else class="flex-shrink-0">
                  <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-24 h-24 object-cover rounded-xl" />
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <NuxtLink v-if="item.slug" :to="`/product/${item.slug}`" class="text-text-primary font-medium text-sm leading-6 hover:text-brand line-clamp-2 transition-colors">{{ item.name }}</NuxtLink>
                    <span v-else class="text-text-primary font-medium text-sm line-clamp-2">{{ item.name }}</span>
                  </div>
                  <div v-if="item.attributes?.length" class="flex flex-wrap gap-1.5">
                    <span v-for="attr in item.attributes" :key="attr.key" class="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-lg border border-surface-border">{{ attr.key }}: {{ attr.value }}</span>
                  </div>
                  <div class="flex items-center justify-between mt-auto flex-wrap gap-3 pt-1">
                    <div>
                      <div v-if="item.comparePrice > item.price" class="text-text-disabled line-through text-xs font-fanum leading-none mb-0.5">{{ formatPrice(item.comparePrice) }}</div>
                      <div class="text-text-primary font-bold font-fanum">{{ formatPrice(item.price) }}</div>
                      <div class="text-text-secondary text-xs font-fanum mt-0.5">جمع: {{ formatPrice(item.price * item.quantity) }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button @click="handleRemove(item)" :disabled="removingKey === itemKey(item)" :aria-label="`حذف ${item.name} از سبد خرید`" class="text-text-disabled hover:text-error transition-colors disabled:opacity-50 w-11 h-11 flex items-center justify-center">
                        <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                      <div class="flex items-center border border-surface-border rounded-xl overflow-hidden">
                        <button @click="changeQty(item, item.quantity - 1)" :disabled="item.quantity <= 1 || updatingKey === itemKey(item)" :aria-label="`کاهش تعداد ${item.name}`" class="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 12H4"/></svg>
                        </button>
                        <span class="w-11 text-center font-fanum text-sm font-bold text-text-primary select-none" aria-live="polite" aria-atomic="true">{{ formatNumber(item.quantity) }}</span>
                        <button @click="changeQty(item, item.quantity + 1)" :disabled="item.quantity >= item.stock || updatingKey === itemKey(item)" :aria-label="`افزایش تعداد ${item.name}`" class="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </section>

        </div>

        <!-- Summary column -->
        <div class="flex flex-col gap-4 lg:sticky lg:top-24">

          <!-- Wholesale summary -->
          <div v-if="cartStore.hasWholesaleItems" class="rounded-2xl p-5 flex flex-col gap-4 bg-card border border-amber-200">
            <h2 class="font-bold text-amber-800 text-sm border-b border-amber-100 pb-3 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              خلاصه سفارش عمده
            </h2>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">تعداد</span>
                <span class="font-fanum text-text-primary">{{ formatNumber(cartStore.wholesaleItems.reduce((s,i)=>s+i.quantity,0)) }} عدد</span>
              </div>
              <!-- Savings breakdown: show two rows when both wholesale + system discount are active -->
              <template v-if="wholesaleSavings > 0">
                <template v-if="wholesaleRetailSavings > 0">
                  <div class="flex justify-between text-success text-xs">
                    <span>قیمت عمده</span>
                    <span class="font-fanum">− {{ formatPrice(wholesaleRetailSavings) }}</span>
                  </div>
                  <div class="flex justify-between text-success text-xs">
                    <span>تخفیف سیستم</span>
                    <span class="font-fanum">− {{ formatPrice(wholesaleDiscountSavings) }}</span>
                  </div>
                  <div class="flex justify-between text-success font-bold border-t border-success/20 pt-1 mt-0.5">
                    <span>کل صرفه‌جویی</span>
                    <span class="font-fanum">− {{ formatPrice(wholesaleSavings) }}</span>
                  </div>
                </template>
                <div v-else class="flex justify-between text-success">
                  <span>صرفه‌جویی</span>
                  <span class="font-fanum">− {{ formatPrice(wholesaleSavings) }}</span>
                </div>
              </template>
              <div class="flex justify-between items-center">
                <span class="text-text-secondary">ارسال</span>
                <span class="text-xs font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full">رایگان</span>
              </div>
            </div>
            <div class="border-t border-amber-100 pt-3.5">
              <div class="flex justify-between items-center">
                <span class="font-bold text-text-primary">مبلغ قابل پرداخت</span>
                <span class="text-amber-800 text-xl font-black font-fanum">{{ formatPrice(cartStore.wholesaleTotal) }}</span>
              </div>
            </div>
            <BaseButton variant="wholesale" block size="lg" @click="navigateTo('/checkout?type=wholesale')">
              ثبت سفارش عمده
            </BaseButton>
          </div>

          <!-- Retail summary -->
          <div v-if="cartStore.hasRetailItems"
               class="rounded-2xl border border-surface-border p-5 flex flex-col gap-4 bg-card">
            <h2 class="font-bold text-text-primary text-base border-b border-surface-border pb-3"><span aria-hidden="true">🛍️</span> خلاصه سفارش تکی</h2>
            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">تعداد</span>
                <span class="font-fanum text-text-primary">{{ formatNumber(cartStore.retailItems.reduce((s,i)=>s+i.quantity,0)) }} عدد</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">قیمت اصلی</span>
                <span class="font-fanum text-text-primary">{{ formatPrice(cartStore.retailItems.reduce((s,i)=>s+(i.comparePrice||i.price)*i.quantity,0)) }}</span>
              </div>
              <div v-if="retailSavings > 0" class="flex justify-between text-success">
                <span>تخفیف</span>
                <span class="font-fanum">− {{ formatPrice(retailSavings) }}</span>
              </div>
            </div>
            <div class="border-t border-surface-border pt-4">
              <div class="flex justify-between items-center">
                <span class="font-bold text-text-primary">مبلغ قابل پرداخت</span>
                <span class="text-brand text-xl font-black font-fanum">{{ formatPrice(cartStore.retailTotal) }}</span>
              </div>
            </div>
            <BaseButton variant="primary" block size="lg" @click="navigateTo('/checkout?type=retail')">ادامه و پرداخت ←</BaseButton>
          </div>

          <NuxtLink to="/products" class="text-center text-sm text-brand hover:underline block flex items-center justify-center gap-1.5">
            <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
            ادامه خرید
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { formatPrice, formatNumber } from '~/utils/formatters'
import BaseEmpty   from '~/components/common/BaseEmpty.vue'
import BaseButton  from '~/components/common/BaseButton.vue'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'سبد خرید', robots: 'noindex' })

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%23e2e8f0"%3E%3Crect width="96" height="96"/%3E%3C/svg%3E'

const cartStore = useCartStore()
const ui        = useUiStore()

const updatingKey     = ref(null)
const removingKey     = ref(null)
const clearing        = ref(false)
const confirmingClear = ref(false)

const subtotal         = computed(() => cartStore.items.reduce((s, i) => { const base = i.comparePrice > i.price ? i.comparePrice : i.price; return s + base * i.quantity }, 0))
const savings          = computed(() => subtotal.value - cartStore.totalPrice)
const retailSavings    = computed(() => cartStore.retailItems.reduce((s, i) => s + Math.max(0, (i.comparePrice - i.price) * i.quantity), 0))

// Total wholesale savings measured from the highest known price (retailPrice when available, else comparePrice)
const wholesaleSavings = computed(() =>
  cartStore.wholesaleItems.reduce((s, i) => {
    const base = i.retailPrice ?? (i.comparePrice > i.price ? i.comparePrice : i.price)
    return s + Math.max(0, (base - i.price) * i.quantity)
  }, 0),
)
// Savings breakdown — only non-zero when system discount is also active
const wholesaleRetailSavings   = computed(() =>
  cartStore.wholesaleItems.reduce((s, i) =>
    s + (i.retailPrice ? Math.max(0, (i.retailPrice - i.comparePrice) * i.quantity) : 0), 0),
)
const wholesaleDiscountSavings = computed(() =>
  cartStore.wholesaleItems.reduce((s, i) =>
    s + Math.max(0, ((i.comparePrice ?? i.price) - i.price) * i.quantity), 0),
)

function itemKey(item) { return `${item.productId}-${item.variantId}` }

async function changeQty(item, newQty) {
  if (newQty < 1 || newQty > item.stock) return
  const key = itemKey(item)
  if (updatingKey.value === key) return
  updatingKey.value = key
  try { await cartStore.updateItem(item.productId, item.variantId, newQty) }
  catch { ui.addToast('خطا در بروزرسانی تعداد', 'error') }
  finally { updatingKey.value = null }
}

async function handleRemove(item) {
  const key = itemKey(item)
  if (removingKey.value === key) return
  removingKey.value = key
  try { await cartStore.removeItem(item.productId, item.variantId); ui.addToast('کالا از سبد حذف شد', 'success') }
  catch { ui.addToast('خطا در حذف کالا', 'error') }
  finally { removingKey.value = null }
}

async function doClear() {
  clearing.value = true
  try { await cartStore.clearCart(); confirmingClear.value = false; ui.addToast('سبد خرید پاک شد', 'success') }
  catch { ui.addToast('خطا در پاک کردن سبد', 'error') }
  finally { clearing.value = false }
}

onMounted(() => cartStore.fetchCart())
</script>

<style scoped>
.cart-item-enter-active, .cart-item-leave-active { transition: all 0.3s ease; }
/* RTL: items enter from the right (negative X) and leave to the left (positive X) */
.cart-item-enter-from { opacity: 0; transform: translateX(-20px); }
.cart-item-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
