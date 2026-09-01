<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <GlassCard padding="lg" radius="24px" class="text-center max-w-sm w-full">
      <div class="text-6xl mb-4" aria-hidden="true">{{ error.statusCode === 404 ? '🔍' : '⚠️' }}</div>
      <h1 class="text-2xl font-black text-glass-text-primary mb-2">
        {{ error.statusCode === 404 ? 'صفحه یافت نشد' : 'خطایی رخ داد' }}
      </h1>
      <p class="text-glass-text-secondary mb-6">{{ error.message || 'لطفاً دوباره تلاش کنید' }}</p>
      <GlassButton :to="'/'" variant="primary">
        بازگشت به صفحه اصلی
      </GlassButton>
    </GlassCard>
  </div>
</template>

<script setup>
import GlassCard   from '~/components/glass/GlassCard.vue'
import GlassButton from '~/components/glass/GlassButton.vue'

const props = defineProps({ error: Object })
useSeoMeta({
  title: props.error?.statusCode === 404 ? 'صفحه یافت نشد' : 'خطا',
  robots: 'noindex,nofollow',
})
</script>
