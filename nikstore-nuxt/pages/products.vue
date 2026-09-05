<template>
  <div class="products-page">
    <header class="products-page__head">
      <h1>همه محصولات</h1>
      <p v-if="total !== null">{{ toPersianDigits(total) }} کالا</p>
    </header>

    <ProductListing
      :brand-param="initialBrand"
      empty-text="محصولی با این فیلترها یافت نشد"
      @loaded="onLoaded"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProductListing from '~/components/products/ProductListing.vue'
import { toPersianDigits } from '~/utils/format'

const route = useRoute()
const initialBrand = typeof route.query.brand === 'string' ? route.query.brand : null

const total = ref(null)
function onLoaded({ total: t }) {
  total.value = t
}

useSeoMeta({ title: 'همه محصولات | فروشگاه پوشاک' })
</script>

<style scoped>
.products-page__head {
  margin: 18px 18px 16px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.products-page__head h1 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.products-page__head p {
  font-size: 11.5px;
  color: var(--text-secondary);
}
</style>
