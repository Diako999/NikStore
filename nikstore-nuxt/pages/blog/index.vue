<template>
  <div class="blog-page">
    <header class="blog-page__head">
      <h1>وبلاگ</h1>
      <p>آخرین مطالب مد، استایل و پوشاک</p>
    </header>

    <div v-if="tags.length" class="blog-tags">
      <button
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip--active': !activeTag }"
        @click="selectTag(null)"
      >
        همه
      </button>
      <button
        v-for="t in tags"
        :key="t.tag"
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip--active': activeTag === t.tag }"
        @click="selectTag(t.tag)"
      >
        {{ t.tag }}
      </button>
    </div>

    <div class="blog-list">
      <template v-if="pending">
        <div v-for="i in 3" :key="i" class="post-skel" />
      </template>
      <template v-else-if="posts.length">
        <NuxtLink
          v-for="p in posts"
          :key="p._id"
          :to="`/blog/${p.slug}`"
          class="post-card"
        >
          <div class="post-card__thumb">
            <img v-if="p.featuredImage" :src="p.featuredImage" :alt="p.title" loading="lazy">
            <div v-else class="post-card__fallback" />
          </div>
          <div class="post-card__body">
            <h2>{{ p.title }}</h2>
            <p v-if="p.excerpt" class="post-card__excerpt">{{ p.excerpt }}</p>
            <div class="post-card__meta">
              <span>{{ authorName(p.author) }}</span>
              <span class="post-card__dot">·</span>
              <span>{{ formatDate(p.publishedAt || p.createdAt) }}</span>
            </div>
          </div>
        </NuxtLink>
      </template>
      <p v-else class="empty-hint">هنوز مطلبی در وبلاگ ثبت نشده است</p>
    </div>

    <div v-if="totalPages > 1" class="blog-pager">
      <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">قبلی</button>
      <span>{{ toPersianDigits(page) }} از {{ toPersianDigits(totalPages) }}</span>
      <button type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">بعدی</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toPersianDigits } from '~/utils/format'

const route = useRoute()
const router = useRouter()

const page = computed(() => Math.max(1, parseInt(route.query.page, 10) || 1))
const activeTag = computed(() => (typeof route.query.tag === 'string' && route.query.tag ? route.query.tag : null))

// Reads through $fetch (not blogService) so the initial load runs SSR-side
// to match the /blog/** swr rule — blogService's axios instance uses a
// relative baseURL, which only resolves in the browser.
const { data: listData, pending } = await useAsyncData(
  'blog-list',
  () => $fetch('/api/v1/blog', {
    params: {
      page: page.value,
      limit: 10,
      sortBy: 'newest',
      ...(activeTag.value ? { tag: activeTag.value } : {}),
    },
  }),
  { watch: [page, activeTag], transform: (r) => r?.data ?? r },
)

const posts = computed(() => listData.value?.posts ?? [])
const totalPages = computed(() => listData.value?.totalPages ?? 1)

const { data: tagsData } = await useAsyncData('blog-tags', () => $fetch('/api/v1/blog/tags'), {
  transform: (r) => r?.data ?? r ?? [],
})
const tags = computed(() => tagsData.value ?? [])

function selectTag(tag) {
  const query = { ...route.query }
  delete query.page
  if (tag) query.tag = tag
  else delete query.tag
  router.push({ query })
}

function goPage(next) {
  router.push({ query: { ...route.query, page: next } })
}

function authorName(author) {
  if (!author) return 'نیک'
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ')
  return name || 'نیک'
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
function formatDate(value) {
  if (!value) return ''
  return dateFormatter.format(new Date(value))
}

useSeoMeta({ title: 'وبلاگ' })
</script>

<style scoped>
.blog-page__head { margin: 18px 18px 16px; }
.blog-page__head h1 { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.blog-page__head p { font-size: 12px; color: var(--text-secondary); }

.blog-tags {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 18px;
  margin-bottom: 18px;
  scrollbar-width: none;
}
.blog-tags::-webkit-scrollbar { display: none; }

.tag-chip {
  flex: 0 0 auto;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  cursor: pointer;
  white-space: nowrap;
}
.tag-chip--active {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  border-color: transparent;
}

.blog-list { display: flex; flex-direction: column; gap: 14px; margin: 0 18px 22px; }

.post-card {
  display: block;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
}
[data-theme='light'] .post-card {
  border-width: 1.5px;
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
}

.post-card__thumb { width: 100%; height: 170px; background: var(--glass); }
.post-card__thumb img { width: 100%; height: 100%; object-fit: cover; }
.post-card__fallback { width: 100%; height: 100%; background: linear-gradient(120deg, rgba(61, 139, 82, .25), rgba(231, 175, 66, .15)); }

.post-card__body { padding: 14px 16px 16px; }
.post-card__body h2 { font-size: 14.5px; font-weight: 700; line-height: 1.5; margin-bottom: 6px; color: var(--text-primary); }
.post-card__excerpt {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-card__meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-disabled); }
.post-card__dot { opacity: .6; }

.post-skel { height: 220px; border-radius: 18px; background: var(--glass); animation: pulse 1.6s ease-in-out infinite; }
.empty-hint { margin: 0 18px; font-size: 12.5px; color: var(--text-secondary); }

.blog-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 8px 18px 26px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.blog-pager button {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.blog-pager button:disabled { opacity: .4; cursor: not-allowed; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .6; }
}
</style>
