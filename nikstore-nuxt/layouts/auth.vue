<template>
  <div class="page page--focused">
    <slot />
    <AppFooter />
  </div>
</template>

<script setup>
// Focused-flow layout — no bottom nav, used for auth, checkout, and
// payment-result screens where tab navigation would just be a distraction.
import AppFooter from '~/components/ui/AppFooter.vue'
</script>

<style scoped>
.page--focused {
  max-width: 480px;
  margin-inline: auto;
  min-height: 100vh;
}
</style>
