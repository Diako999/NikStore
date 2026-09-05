<template>
  <div class="page">
    <slot />
    <ThemeToggle />
    <BottomNav :cart-count="cartStore.totalCount" />
  </div>
</template>

<script setup>
import BottomNav from '~/components/ui/BottomNav.vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
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
