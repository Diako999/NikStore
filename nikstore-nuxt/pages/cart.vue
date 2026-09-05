<template>
  <div class="cart-page">
    <header class="cart-header">
      <h1>سبد خرید</h1>
      <span v-if="cartStore.totalCount" class="cart-header__count">{{ toPersianDigits(cartStore.totalCount) }} کالا</span>
    </header>

    <div v-if="!cartStore.items.length" class="cart-empty">
      <div class="cart-empty__icon">
        <AppIcon name="bag" :size="30" :stroke-width="1.6" />
      </div>
      <p class="cart-empty__title">سبد خرید شما خالی است</p>
      <p class="cart-empty__sub">محصولات مورد علاقه‌تان را پیدا کنید و به سبد اضافه کنید</p>
      <NuxtLink to="/" class="btn-primary">
        مشاهده محصولات
        <AppIcon name="arrow" :size="16" />
      </NuxtLink>
    </div>

    <template v-else>
      <ul class="cart-list">
        <li v-for="item in cartStore.items" :key="lineKey(item)" class="cart-item">
          <NuxtLink :to="item.slug ? `/product/${item.slug}` : '#'" class="cart-item__thumb">
            <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy">
            <div v-else class="cart-item__fallback">
              <AppIcon name="hoodie" :size="26" :stroke-width="1.5" />
            </div>
          </NuxtLink>

          <div class="cart-item__body">
            <NuxtLink :to="item.slug ? `/product/${item.slug}` : '#'" class="cart-item__name">{{ item.name }}</NuxtLink>
            <p v-if="item.variant" class="cart-item__variant">{{ item.variant }}</p>

            <div class="cart-item__row">
              <p class="cart-item__price">{{ formatPrice(item.price) }}</p>

              <div class="qty-stepper">
                <button
                  type="button"
                  class="qty-stepper__btn"
                  aria-label="کاهش تعداد"
                  @click="dec(item)"
                >
                  <AppIcon :name="item.qty === 1 ? 'trash' : 'minus'" :size="13" :stroke-width="2" />
                </button>
                <span class="qty-stepper__value">{{ toPersianDigits(item.qty) }}</span>
                <button
                  type="button"
                  class="qty-stepper__btn"
                  aria-label="افزایش تعداد"
                  @click="inc(item)"
                >
                  <AppIcon name="plus" :size="13" :stroke-width="2" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="cart-item__remove"
            aria-label="حذف از سبد خرید"
            @click="remove(item)"
          >
            <AppIcon name="close" :size="13" :stroke-width="2" />
          </button>
        </li>
      </ul>

      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>جمع سبد خرید</span>
          <span class="cart-summary__value">{{ formatPrice(cartStore.totalPrice) }}</span>
        </div>
        <p class="cart-summary__hint">هزینه ارسال در مرحله بعد محاسبه می‌شود</p>
        <NuxtLink to="/checkout" class="btn-primary btn-primary--block">
          تسویه حساب
          <AppIcon name="arrow" :size="16" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'
import { formatPrice, toPersianDigits } from '~/utils/format'
import { useCartStore } from '~/stores/cart.store'

const cartStore = useCartStore()

function lineKey(item) {
  return item.variant ? `${item.productId}::${item.variant}` : item.productId
}

function inc(item) {
  cartStore.updateQty(item.productId, item.variant, item.qty + 1)
}

function dec(item) {
  cartStore.updateQty(item.productId, item.variant, item.qty - 1)
}

function remove(item) {
  cartStore.removeItem(item.productId, item.variant)
}
</script>

<style scoped>
.cart-page {
  padding: 18px 18px 32px;
}

.cart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
}
.cart-header h1 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.cart-header__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 20px 40px;
  gap: 6px;
}
.cart-empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-disabled);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .cart-empty__icon { box-shadow: var(--glass-shadow); }
.cart-empty__title { font-size: 14.5px; font-weight: 700; color: var(--text-primary); }
.cart-empty__sub { font-size: 12px; color: var(--text-secondary); margin-bottom: 18px; max-width: 260px; }

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin-bottom: 18px;
}

.cart-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .cart-item {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.cart-item__thumb {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--glass-strong);
  display: block;
}
.cart-item__thumb img { width: 100%; height: 100%; object-fit: cover; }
.cart-item__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: radial-gradient(120% 120% at 30% 20%, rgba(110, 176, 130, .35) 0%, rgba(61, 139, 82, .25) 55%, transparent 100%);
}
[data-theme='light'] .cart-item__fallback { color: var(--brand-dark); }

.cart-item__body { flex: 1; min-width: 0; }
.cart-item__name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cart-item__variant { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }

.cart-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.cart-item__price { font-size: 13px; font-weight: 700; color: var(--brand-light); }
[data-theme='light'] .cart-item__price { color: var(--brand-dark); }

.qty-stepper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 999px;
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
}
.qty-stepper__btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}
.qty-stepper__value {
  min-width: 14px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.cart-item__remove {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background: rgba(9, 15, 12, .3);
  color: var(--text-secondary);
}
[data-theme='light'] .cart-item__remove { background: rgba(255, 255, 255, .5); }

.cart-summary {
  border-radius: 18px;
  padding: 18px;
  background:
    linear-gradient(105deg, rgba(122, 90, 220, .22), rgba(231, 175, 66, .12)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, .4), rgba(255, 255, 255, .03) 60%) border-box;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .cart-summary {
  border-width: 1.5px;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(105deg, rgba(122, 90, 220, .18), rgba(231, 175, 66, .16)) padding-box,
    linear-gradient(120deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2) 60%) border-box;
}

.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.cart-summary__value { font-size: 16px; font-weight: 800; color: var(--brand-light); }
[data-theme='light'] .cart-summary__value { color: var(--brand-dark); }
.cart-summary__hint { font-size: 10.5px; color: var(--text-secondary); margin-bottom: 14px; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  padding: 12px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .25);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 22px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .30);
}
[data-theme='light'] .btn-primary {
  border-color: rgba(255, 255, 255, .3);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.btn-primary--block { width: 100%; }
</style>
