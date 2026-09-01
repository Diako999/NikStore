<template>
  <div class="container-main py-8 min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-2xl font-black text-text-primary mb-2">صفحه یافت نشد</h1>
      <p class="text-text-secondary mb-6">صفحه‌ای که دنبالش می‌گردید وجود ندارد</p>
      <NuxtLink to="/" class="btn-brand inline-block px-6 py-3">بازگشت به خانه</NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'صفحه یافت نشد', robots: 'noindex,nofollow' })
</script>
