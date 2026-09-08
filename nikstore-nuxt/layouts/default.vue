<template>
  <div class="page">
    <slot />
    <AppFooter />
    <ScrollTopButton />
    <BottomNav :cart-count="cartStore.totalCount" />
  </div>
</template>

<script setup>
import BottomNav from '~/components/ui/BottomNav.vue'
import ScrollTopButton from '~/components/ui/ScrollTopButton.vue'
import AppFooter from '~/components/ui/AppFooter.vue'
import { useCartStore } from '~/stores/cart.store'

const cartStore = useCartStore()
</script>

<style scoped>
.page {
  max-width: 480px;
  margin-inline: auto;
  padding-bottom: 106px;
}
</style>
