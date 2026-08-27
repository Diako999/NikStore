<template>
  <div class="min-h-screen bg-[var(--color-bg)]">

    <div class="bg-gradient-to-l from-brand to-brand-dark py-12 text-white">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-3xl font-black mb-2">بلاگ {{ settingsStore.siteName }}</h1>
        <p class="text-white/80 text-sm">مقالات، نکات و راهنماهای خرید پوشاک</p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">

        <aside class="w-full lg:w-64 flex-shrink-0 space-y-5">
          <div class="bg-card rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 class="font-bold text-[var(--color-text-primary)] text-sm mb-3">جستجو</h3>
            <div class="relative">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-disabled)] text-sm">🔍</span>
              <input
                v-model="store.filters.search"
                @input="onSearchInput"
                type="text"
                placeholder="جستجو در بلاگ..."
                class="w-full pr-9 pl-3 py-2 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text-primary)] outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          <div class="bg-card rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 class="font-bold text-[var(--color-text-primary)] text-sm mb-3">مرتب‌سازی</h3>
            <div class="space-y-1">
              <button
                v-for="s in sortOptions" :key="s.value"
                @click="setSort(s.value)"
                :class="['flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all', store.filters.sortBy === s.value ? 'bg-brand text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]']"
              >
                <span>{{ s.icon }}</span>{{ s.label }}
              </button>
            </div>
          </div>

          <div v-if="store.tags.length" class="bg-card rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 class="font-bold text-[var(--color-text-primary)] text-sm mb-3">موضوعات</h3>
            <div class="flex flex-wrap gap-2">
              <button @click="clearTag" :class="['text-xs px-3 py-1.5 rounded-xl transition-all border', !store.filters.tag ? 'bg-brand text-white border-brand' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]']">همه</button>
              <button v-for="t in store.tags" :key="t.tag" @click="selectTag(t.tag)" :class="['text-xs px-3 py-1.5 rounded-xl transition-all border', store.filters.tag === t.tag ? 'bg-brand text-white border-brand' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]']">
                #{{ t.tag }} <span class="text-[10px] opacity-70">{{ t.count }}</span>
              </button>
            </div>
          </div>
        </aside>

        <main class="flex-1 min-w-0">
          <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <div v-for="i in 6" :key="i" class="bg-card rounded-2xl overflow-hidden border border-[var(--color-border)] animate-pulse">
              <div class="aspect-[16/9] bg-gray-200 dark:bg-gray-700"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!store.posts.length" class="bg-card rounded-2xl border border-[var(--color-border)] flex flex-col items-center py-20 gap-4">
            <span class="text-5xl">📭</span>
            <p class="text-[var(--color-text-secondary)] text-center">هنوز مقاله‌ای منتشر نشده.</p>
          </div>

          <div v-else>
            <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ store.total }} مقاله یافت شد</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <BlogCard v-for="post in store.posts" :key="post._id" :post="post" />
            </div>
            <div v-if="store.totalPages > 1" class="flex justify-center mt-8 gap-2 flex-wrap">
              <button
                v-for="p in store.totalPages" :key="p"
                @click="goToPage(p)"
                :class="['w-9 h-9 rounded-xl text-sm font-medium transition-all border', store.filters.page === p ? 'bg-brand text-white border-brand' : 'bg-card border-[var(--color-border)] text-[var(--color-text-secondary)]']"
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

const sortOptions = [
  { value: 'newest',  icon: '🕐', label: 'جدیدترین' },
  { value: 'oldest',  icon: '📅', label: 'قدیمی‌ترین' },
  { value: 'popular', icon: '🔥', label: 'محبوب‌ترین' },
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
