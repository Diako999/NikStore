<template>
  <div class="auth-layout">
    <div class="auth-layout__toggle">
      <ThemeToggle />
    </div>
    <div class="auth-layout__card">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import ThemeToggle from '../components/common/ThemeToggle.vue'
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.auth-layout__toggle {
  position: absolute;
  top: 24px;
  inset-inline-end: 24px;
}

.auth-layout__card {
  width: 100%;
  max-width: 400px;
}
</style>
