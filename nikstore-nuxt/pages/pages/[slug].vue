<template>
  <div class="cms-page">
    <NuxtLink to="/" class="cms-back">
      <AppIcon name="chevron-right" :size="15" :stroke-width="2.2" />
      بازگشت به خانه
    </NuxtLink>

    <article class="cms-card">
      <h1>{{ page.title }}</h1>
      <div class="cms-body" v-html="sanitizedContent" />
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DOMPurify from 'isomorphic-dompurify'
import AppIcon from '~/components/icons/AppIcon.vue'

const route = useRoute()
const slug = route.params.slug

// Reads through $fetch (not pageService) so this runs SSR-side to match
// the /pages/** swr rule — pageService's axios instance uses a relative
// baseURL, which only resolves in the browser.
const { data: pageData, error: pageError } = await useAsyncData(
  `cms-page-${slug}`,
  () => $fetch(`/api/v1/pages/slug/${slug}`),
  { transform: (r) => r?.data ?? r },
)

if (pageError.value || !pageData.value) {
  throw createError({
    statusCode: pageError.value?.statusCode || pageError.value?.data?.statusCode || 404,
    statusMessage: 'صفحه یافت نشد',
    fatal: true,
  })
}

const page = computed(() => pageData.value)

useSeoMeta({
  title: page.value.metaTitle || page.value.title,
  description: page.value.metaDescription || page.value.excerpt || undefined,
})

// Content comes from the CMS's rich-text editor (admin-authored, not open
// user input), but still gets sanitized before going into v-html — strips
// anything that could execute if an admin account were ever compromised
// or a paste brought stray markup along. Runs through a real HTML parser
// (DOMPurify), not a hand-rolled regex, since regex-based tag stripping
// is reliably bypassable with malformed or nested markup.
const sanitizedContent = computed(() => DOMPurify.sanitize(page.value.content || ''))
</script>

<style scoped>
.cms-page { padding-bottom: 8px; }

.cms-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 18px 18px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.cms-card {
  margin: 0 18px 26px;
  padding: 22px 18px;
  border-radius: 18px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .cms-card {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.cms-card h1 { font-size: 18px; font-weight: 800; line-height: 1.5; color: var(--text-primary); margin-bottom: 16px; }

.cms-body :deep(p) { margin-bottom: 14px; line-height: 1.9; color: var(--text-primary); font-size: 13.5px; }
.cms-body :deep(h2) { font-size: 16px; font-weight: 700; margin: 18px 0 10px; color: var(--text-primary); }
.cms-body :deep(h3) { font-size: 14.5px; font-weight: 700; margin: 16px 0 8px; color: var(--text-primary); }
.cms-body :deep(a) { color: var(--brand-light); text-decoration: underline; }
[data-theme='light'] .cms-body :deep(a) { color: var(--brand-dark); }
.cms-body :deep(img) { border-radius: 14px; margin: 14px 0; }
.cms-body :deep(ul),
.cms-body :deep(ol) { margin: 0 0 14px; padding-inline-start: 20px; color: var(--text-primary); line-height: 1.9; }
.cms-body :deep(blockquote) {
  border-inline-start: 3px solid var(--brand);
  padding-inline-start: 14px;
  margin: 16px 0;
  color: var(--text-secondary);
  font-style: italic;
}
.cms-body :deep(strong) { font-weight: 700; }
</style>
