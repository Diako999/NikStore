<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">

    <div v-if="pending" class="space-y-4 animate-pulse">
      <div class="h-8 bg-surface rounded-lg w-2/3" />
      <div class="h-4 bg-surface rounded w-full" />
      <div class="h-4 bg-surface rounded w-5/6" />
    </div>

    <div v-else-if="!page" class="text-center py-20">
      <p class="text-5xl mb-4">😕</p>
      <h1 class="text-xl font-bold text-text-primary mb-2">صفحه یافت نشد</h1>
      <NuxtLink to="/" class="text-brand hover:underline text-sm">بازگشت به صفحه اصلی</NuxtLink>
    </div>

    <GlassCard v-else padding="lg" as="article">
      <h1 class="text-2xl font-black text-glass-text-primary mb-6 leading-snug">{{ page.title }}</h1>
      <div class="prose-page text-glass-text-primary text-sm leading-loose" v-html="page.content" />
    </GlassCard>
  </div>
</template>

<script setup>
import GlassCard from '~/components/glass/GlassCard.vue'

definePageMeta({ layout: 'default' })

const route  = useRoute()
const config = useRuntimeConfig()

const slug = computed(() => route.params.slug)

// ── SSR Data Fetch — Google sees full page content ──────────────
const { data: page, error, pending } = await useFetch(
  () => `/api/v1/pages/slug/${slug.value}`,
  { key: () => `page-${slug.value}`, transform: (r) => r?.data ?? r }
)

if (error.value) {
  throw createError({ statusCode: 404, fatal: true, message: 'صفحه یافت نشد' })
}

useSeoMeta({
  title:       () => page.value?.metaTitle       || page.value?.title   || '',
  description: () => page.value?.metaDescription || page.value?.excerpt || '',
  ogUrl:       () => `${config.public.siteUrl}/pages/${slug.value}`,
})
useHead({ link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/pages/${slug.value}` }] })
</script>

<style>
.prose-page h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
.prose-page h3 { font-size: 1.1rem;  font-weight: 600; margin: 1rem 0 0.4rem; }
.prose-page p  { margin-bottom: 0.75rem; }
.prose-page ul { list-style: disc;    padding-right: 1.5rem; margin-bottom: 0.75rem; }
.prose-page ol { list-style: decimal; padding-right: 1.5rem; margin-bottom: 0.75rem; }
.prose-page blockquote { border-right: 3px solid var(--color-primary); padding-right: 0.75rem; color: var(--color-text-secondary); margin: 0.75rem 0; }
.prose-page a   { color: var(--color-primary); text-decoration: underline; }
.prose-page strong { font-weight: 700; }
</style>
