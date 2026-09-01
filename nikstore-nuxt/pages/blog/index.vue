<template>
  <div class="min-h-screen">

    <div class="bg-gradient-to-l from-brand to-brand-dark py-12 text-white">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-3xl font-black mb-2">بلاگ {{ settingsStore.siteName }}</h1>
        <p class="text-white/80 text-sm">مقالات، نکات و راهنماهای خرید پوشاک</p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">

        <aside class="w-full lg:w-64 flex-shrink-0 space-y-5">
          <GlassCard padding="md">
            <h3 class="font-bold text-glass-text-primary text-sm mb-3">جستجو</h3>
            <GlassSearchBar
              v-model="store.filters.search"
              placeholder="جستجو در بلاگ..."
              @update:model-value="onSearchInput"
            />
          </GlassCard>

          <GlassCard padding="md">
            <h3 class="font-bold text-glass-text-primary text-sm mb-3">مرتب‌سازی</h3>
            <div class="space-y-1">
              <button
                v-for="s in sortOptions" :key="s.value"
                @click="setSort(s.value)"
                :class="['flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all', store.filters.sortBy === s.value ? 'bg-brand text-white' : 'text-glass-text-secondary hover:bg-glass']"
              >
                <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="s.icon" />
                </svg>{{ s.label }}
              </button>
            </div>
          </GlassCard>

          <GlassCard v-if="store.tags.length" padding="md">
            <h3 class="font-bold text-glass-text-primary text-sm mb-3">موضوعات</h3>
            <div class="flex flex-wrap gap-2">
              <button @click="clearTag" :class="['text-xs px-3 py-1.5 rounded-xl transition-all border', !store.filters.tag ? 'bg-brand text-white border-brand' : 'border-glass-border text-glass-text-secondary']">همه</button>
              <button v-for="t in store.tags" :key="t.tag" @click="selectTag(t.tag)" :class="['text-xs px-3 py-1.5 rounded-xl transition-all border', store.filters.tag === t.tag ? 'bg-brand text-white border-brand' : 'border-glass-border text-glass-text-secondary']">
                #{{ t.tag }} <span class="text-[10px] opacity-70">{{ t.count }}</span>
              </button>
            </div>
          </GlassCard>
        </aside>

        <main class="flex-1 min-w-0">
          <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <GlassCard v-for="i in 6" :key="i" padding="sm" class="overflow-hidden animate-pulse !p-0">
              <div class="aspect-[16/9] bg-gray-200 dark:bg-gray-700"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </GlassCard>
          </div>

          <GlassCard v-else-if="!store.posts.length" padding="lg" class="flex flex-col items-center py-20 gap-4">
            <span class="text-5xl">📭</span>
            <p class="text-glass-text-secondary text-center">هنوز مقاله‌ای منتشر نشده.</p>
          </GlassCard>

          <div v-else>
            <p class="text-sm text-glass-text-secondary mb-4">{{ store.total }} مقاله یافت شد</p>
            <div ref="blogGridRef" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <BlogCard v-for="post in store.posts" :key="post._id" :post="post" />
            </div>
            <div v-if="store.totalPages > 1" class="flex justify-center mt-8 gap-2 flex-wrap">
              <button
                v-for="p in store.totalPages" :key="p"
                @click="goToPage(p)"
                :class="['w-9 h-9 rounded-xl text-sm font-medium transition-all border', store.filters.page === p ? 'bg-brand text-white border-brand' : 'bg-glass border-glass-border text-glass-text-secondary']"
              >{{ p }}</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDebounceFn } from '@vueuse/core'
import BlogCard from '~/components/blog/BlogCard.vue'
import GlassCard from '~/components/glass/GlassCard.vue'
import GlassSearchBar from '~/components/glass/GlassSearchBar.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

definePageMeta({ layout: 'default' })
const settingsStore = useSettingsStore()

const config = useRuntimeConfig()
const store  = useBlogStore()

useSeoMeta({
  title:       'وبلاگ | آخرین مقالات',
  description: 'مقالات آموزشی در زمینه مد، استایل و پوشاک',
  ogType:      'website',
  ogUrl:       `${config.public.siteUrl}/blog`,
})
useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/blog` }],
  script: computed(() => {
    const posts = store.posts
    if (!posts?.length) return []
    return [{
      type: 'application/ld+json',
      key:  'jsonld-blog-list',
      innerHTML: JSON.stringify({
        '@context':  'https://schema.org',
        '@type':     'Blog',
        name:        `وبلاگ ${settingsStore.siteName}`,
        description: 'مقالات آموزشی در زمینه مد، استایل و پوشاک',
        url:         `${config.public.siteUrl}/blog`,
        blogPost:    posts.slice(0, 10).map(p => ({
          '@type':       'BlogPosting',
          headline:       p.title,
          url:            `${config.public.siteUrl}/blog/${p.slug}`,
          datePublished:  p.publishedAt,
          image:          p.featuredImage || undefined,
        })),
      }),
    }]
  }),
})

// Outlined stroke-path icons (viewBox 0 0 24 24) — matches the simple
// line-icon language used everywhere else (header/cart/search icons)
// instead of raw platform emoji, which render inconsistently across OSes.
const sortOptions = [
  { value: 'newest',  icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', label: 'جدیدترین' },
  { value: 'oldest',  icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', label: 'قدیمی‌ترین' },
  { value: 'popular', icon: 'M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518L21.75 6M21.75 6h-5.25M21.75 6v5.25', label: 'محبوب‌ترین' },
]

// ── SSR: pre-fetch posts and tags ───────────────────────────────
await Promise.all([
  useAsyncData('blog-posts', async () => {
    const res = await $fetch('/api/v1/blog', {
      params: { page: store.filters.page, limit: store.filters.limit, sortBy: store.filters.sortBy, status: 'published' },
    })
    const d = res?.data ?? res
    store.posts      = d?.posts      ?? []
    store.total      = d?.total      ?? 0
    store.totalPages = d?.totalPages ?? 1
    return null
  }),
  useAsyncData('blog-tags', async () => {
    const res = await $fetch('/api/v1/blog/tags')
    const d   = res?.data ?? res
    store.tags = Array.isArray(d) ? d : []
    return null
  }),
])

// Fires on mount — the posts above are already resolved via the awaited
// useAsyncData call, so the grid's cards exist in the DOM by the time this
// composable takes its children snapshot (unlike a CSR-only fetch-in-onMounted
// list, where the snapshot would land before the data — see the order-history
// page for that case).
const blogGridRef = ref(null)
useGsapReveal(blogGridRef, { y: 20, stagger: 0.06 })

const onSearchInput = useDebounceFn(() => {
  store.filters.page = 1
  store.fetchPosts()
}, 350)

function setSort(val) { store.filters.sortBy = val; store.filters.page = 1; store.fetchPosts() }
function selectTag(tag) { store.filters.tag = tag; store.filters.page = 1; store.fetchPosts() }
function clearTag() { store.filters.tag = ''; store.filters.page = 1; store.fetchPosts() }

function goToPage(p) {
  store.filters.page = p
  store.fetchPosts()
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  if (!store.posts.length) store.fetchPosts()
  if (!store.tags.length)  store.fetchTags()
})
</script>
