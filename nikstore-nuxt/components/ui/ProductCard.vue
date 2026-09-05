<template>
  <NuxtLink :to="product.slug ? `/product/${product.slug}` : '#'" class="p-card">
    <div class="p-card__thumb" :style="{ height: thumbHeight + 'px' }">
      <img v-if="imgSrc" :src="imgSrc" :alt="product.name" loading="lazy" class="p-card__img" @error="imgError = true">
      <div v-else class="p-card__fallback" :class="fallbackClass" />

      <span v-if="badge" class="p-card__badge">{{ badge }}</span>
      <button
        v-else
        type="button"
        class="p-card__heart"
        :aria-label="wished ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
        @click.stop.prevent="wishlistStore.toggle(product._id)"
      >
        <AppIcon name="heart" :size="13" :stroke-width="2" :filled="wished" />
      </button>
    </div>
    <div class="p-card__info">
      <p class="p-card__name">{{ product.name }}</p>
      <p class="p-card__price">{{ formatPrice(product.price) }}</p>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import { formatPrice } from '~/utils/format'
import { useWishlistStore } from '~/stores/wishlist.store'

const props = defineProps({
  product: { type: Object, required: true },
  badge: { type: String, default: null },
  thumbHeight: { type: [Number, String], default: 132 },
})

const wishlistStore = useWishlistStore()
const wished = computed(() => wishlistStore.isWishlisted(props.product._id))
const imgError = ref(false)
watch(() => props.product?.slug, () => { imgError.value = false })

const imgSrc = computed(() => (imgError.value ? '' : props.product.image || ''))

// Deterministic fallback gradient (mockup's g-hoodie/g-jacket/etc.) for
// products with no photo yet — same product always gets the same tone.
const FALLBACKS = ['hoodie', 'jacket', 'pants', 'tee', 'sneaker', 'bag']
const fallbackClass = computed(() => {
  const id = props.product?._id || props.product?.slug || props.product?.name || ''
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return `p-card__g-${FALLBACKS[hash % FALLBACKS.length]}`
})
</script>

<style scoped>
.p-card {
  display: block;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
}
[data-theme='light'] .p-card {
  border-width: 1.5px;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
}

.p-card__thumb { position: relative; width: 100%; background: var(--glass); }
.p-card__img { width: 100%; height: 100%; object-fit: cover; }
.p-card__fallback { width: 100%; height: 100%; }

.p-card__g-hoodie  { background: radial-gradient(120% 120% at 30% 20%, #A9C9B4 0%, #3D8B52 55%, #0F1A13 100%); }
.p-card__g-jacket  { background: radial-gradient(120% 120% at 70% 15%, #E7C878 0%, #B5893C 55%, #17130A 100%); }
.p-card__g-pants   { background: radial-gradient(120% 120% at 30% 80%, #C6B5EE 0%, #7A5ADC 55%, #140E24 100%); }
.p-card__g-tee     { background: radial-gradient(120% 120% at 50% 10%, #F5F7F3 0%, #6EB082 55%, #0F1A13 100%); }
.p-card__g-sneaker { background: radial-gradient(120% 120% at 20% 90%, #F5F7F3 0%, #93A69C 55%, #17241C 100%); }
.p-card__g-bag     { background: radial-gradient(120% 120% at 80% 20%, #FBEFC8 0%, #C7A45C 55%, #17130A 100%); }
[data-theme='light'] .p-card__g-hoodie  { background: radial-gradient(120% 120% at 30% 20%, #D9EEE0 0%, #6EB082 55%, #245535 100%); }
[data-theme='light'] .p-card__g-jacket  { background: radial-gradient(120% 120% at 70% 15%, #FBE7CE 0%, #E0A468 55%, #6B3F17 100%); }
[data-theme='light'] .p-card__g-pants   { background: radial-gradient(120% 120% at 30% 80%, #E7DCF7 0%, #A98BE6 55%, #4A2E82 100%); }
[data-theme='light'] .p-card__g-tee     { background: radial-gradient(120% 120% at 50% 10%, #FBF3D9 0%, #E9C465 55%, #7A5410 100%); }
[data-theme='light'] .p-card__g-sneaker { background: radial-gradient(120% 120% at 20% 90%, #FDE6EE 0%, #E9A0B9 55%, #7C2E45 100%); }
[data-theme='light'] .p-card__g-bag     { background: radial-gradient(120% 120% at 80% 20%, #FBEFCC 0%, #DDB667 55%, #7A5410 100%); }

.p-card__heart {
  position: absolute;
  top: 8px;
  inset-inline-end: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: rgba(9, 15, 12, .45);
  color: #fff;
}
[data-theme='light'] .p-card__heart {
  background: rgba(255, 255, 255, .55);
  box-shadow: 0 2px 6px rgba(40, 55, 46, .15);
  color: var(--brand-dark);
}

.p-card__badge {
  position: absolute;
  top: 8px;
  inset-inline-start: 8px;
  font-size: 9.5px;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 6px;
  color: #fff;
  background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(61, 139, 82, .9));
  backdrop-filter: blur(4px);
}
[data-theme='light'] .p-card__badge {
  background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(45, 107, 62, .92));
}

.p-card__info { padding: 9px 11px 12px; }
.p-card__name {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  line-height: 1.35;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
[data-theme='light'] .p-card__name { color: var(--text-primary); }

.p-card__price { font-size: 12px; font-weight: 700; color: var(--brand-light); }
[data-theme='light'] .p-card__price { color: var(--brand-dark); }
</style>
