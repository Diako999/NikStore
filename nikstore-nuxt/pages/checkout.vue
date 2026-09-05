<template>
  <div class="checkout-page">
    <header class="checkout-header">
      <button type="button" class="checkout-header__back" aria-label="بازگشت" @click="$router.back()">
        <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
      </button>
      <h1>تسویه حساب</h1>
      <span class="checkout-header__spacer" />
    </header>

    <div v-if="loading" class="checkout-state">
      <p>در حال آماده‌سازی سفارش...</p>
    </div>

    <div v-else-if="initError" class="checkout-state checkout-state--error">
      <p>{{ initError }}</p>
      <button type="button" class="checkout-retry" @click="init">تلاش مجدد</button>
    </div>

    <template v-else>
      <section class="checkout-section">
        <h2 class="checkout-section__title">خلاصه سفارش</h2>
        <ul class="order-summary">
          <li v-for="item in cartStore.items" :key="item.productId + (item.variant || '')" class="order-summary__row">
            <span class="order-summary__name">{{ item.name }} × {{ toPersianDigits(item.qty) }}</span>
            <span class="order-summary__price">{{ formatPrice(item.price * item.qty) }}</span>
          </li>
        </ul>
        <div class="order-summary__total">
          <span>جمع کل</span>
          <span>{{ formatPrice(cartStore.totalPrice) }}</span>
        </div>
      </section>

      <section class="checkout-section">
        <div class="checkout-section__head">
          <h2 class="checkout-section__title">آدرس تحویل</h2>
          <button v-if="!showForm" type="button" class="checkout-section__add" @click="showForm = true">
            <AppIcon name="plus" :size="13" :stroke-width="2.2" />
            آدرس جدید
          </button>
        </div>

        <div v-if="addresses.length && !showForm" class="address-list">
          <AddressCard
            v-for="addr in addresses"
            :key="addr._id"
            :address="addr"
            :selected="selectedAddressId === addr._id"
            @select="selectedAddressId = addr._id"
          />
        </div>

        <p v-else-if="!showForm" class="checkout-empty-hint">هنوز آدرسی ثبت نکرده‌اید</p>

        <AddressForm
          v-if="showForm"
          :submitting="addingAddress"
          :error="addAddressError"
          @submit="submitNewAddress"
          @cancel="cancelAddForm"
        />
      </section>

      <p v-if="placeError" class="checkout-place-error">{{ placeError }}</p>

      <button
        type="button"
        class="btn-primary btn-primary--block"
        :disabled="!selectedAddressId || placingOrder || showForm"
        @click="placeOrder"
      >
        {{ placingOrder ? 'در حال ثبت سفارش...' : `پرداخت ${formatPrice(cartStore.totalPrice)}` }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '~/components/icons/AppIcon.vue'
import AddressCard from '~/components/checkout/AddressCard.vue'
import AddressForm from '~/components/checkout/AddressForm.vue'
import { formatPrice, toPersianDigits } from '~/utils/format'
import { useCartStore } from '~/stores/cart.store'
import { cartService } from '~/services/cart.service'
import { userService } from '~/services/user.service'
import { orderService } from '~/services/order.service'
import { paymentService, PaymentMethod } from '~/services/payment.service'

definePageMeta({ layout: 'auth', middleware: 'auth' })

const cartStore = useCartStore()
const router = useRouter()

const loading = ref(true)
const initError = ref('')
const addresses = ref([])
const selectedAddressId = ref(null)
const showForm = ref(false)
const addingAddress = ref(false)
const addAddressError = ref('')
const placingOrder = ref(false)
const placeError = ref('')

function extractErrorMessage(err) {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  return msg || 'خطایی رخ داد، لطفا دوباره تلاش کنید'
}

async function syncCartToServer() {
  // The server cart is the source of truth for order creation, so mirror the
  // local cart into it exactly — clearing first avoids stacking quantities
  // on top of whatever a previous visit to this page already synced.
  await cartService.clear()
  for (const item of cartStore.items) {
    await cartService.addItem({
      productId: item.productId,
      variantId: item.variant,
      quantity: item.qty,
    })
  }
}

async function loadAddresses() {
  const { data } = await userService.getMe()
  addresses.value = data?.addresses || []
  const def = addresses.value.find((a) => a.isDefault)
  selectedAddressId.value = (def || addresses.value[0])?._id || null
  showForm.value = addresses.value.length === 0
}

async function init() {
  if (!cartStore.items.length) {
    router.replace('/cart')
    return
  }
  loading.value = true
  initError.value = ''
  try {
    await syncCartToServer()
    await loadAddresses()
  } catch (e) {
    initError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

init()

function cancelAddForm() {
  addAddressError.value = ''
  showForm.value = false
}

async function submitNewAddress(payload) {
  addingAddress.value = true
  addAddressError.value = ''
  try {
    const { data } = await userService.addAddress(payload)
    addresses.value = data?.addresses || []
    selectedAddressId.value = addresses.value[addresses.value.length - 1]?._id || null
    showForm.value = false
  } catch (e) {
    addAddressError.value = extractErrorMessage(e)
  } finally {
    addingAddress.value = false
  }
}

async function placeOrder() {
  if (!selectedAddressId.value || placingOrder.value) return
  placingOrder.value = true
  placeError.value = ''
  try {
    const { data: order } = await orderService.create({ addressId: selectedAddressId.value })
    const { data: payment } = await paymentService.pay({
      orderId: order._id,
      method: PaymentMethod.GATEWAY,
      callbackUrl: `${window.location.origin}/payment/result?orderId=${order._id}`,
    })

    cartStore.clear()

    if (payment?.gatewayUrl) {
      window.location.href = payment.gatewayUrl
      return
    }

    router.push({ path: '/payment/result', query: { orderId: order._id } })
  } catch (e) {
    placeError.value = extractErrorMessage(e)
    placingOrder.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  padding: 18px 18px 32px;
}

.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.checkout-header h1 { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.checkout-header__back {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text-primary);
  cursor: pointer;
}
.checkout-header__spacer { width: 34px; }

.checkout-state { padding: 60px 20px; text-align: center; color: var(--text-secondary); font-size: 13px; }
.checkout-state--error { color: #E8848C; }
.checkout-retry {
  margin-top: 12px;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.checkout-section { margin-bottom: 22px; }
.checkout-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.checkout-section__title { font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.checkout-section__head .checkout-section__title { margin-bottom: 0; }
.checkout-section__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--brand-light);
  background: transparent;
  border: none;
  cursor: pointer;
}
[data-theme='light'] .checkout-section__add { color: var(--brand-dark); }

.order-summary { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.order-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}
.order-summary__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-inline-end: 10px; }
.order-summary__price { color: var(--text-primary); font-weight: 600; white-space: nowrap; }

.order-summary__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
  font-size: 13.5px;
  font-weight: 800;
  color: var(--text-primary);
}

.address-list { display: flex; flex-direction: column; gap: 10px; }
.checkout-empty-hint { font-size: 12px; color: var(--text-secondary); }

.checkout-place-error {
  font-size: 12px;
  color: #E8848C;
  margin-bottom: 12px;
  text-align: center;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  padding: 14px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .25);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .30);
  cursor: pointer;
}
[data-theme='light'] .btn-primary {
  border-color: rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.btn-primary:disabled { opacity: .55; cursor: default; }
</style>
