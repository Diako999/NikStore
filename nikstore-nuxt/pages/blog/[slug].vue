<template>
  <div class="min-h-screen">

    <template v-if="pending">
      <div class="animate-pulse">
        <div class="h-64 bg-gray-300 dark:bg-gray-700 w-full"></div>
        <div class="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </template>

    <article v-else-if="post">
      <div v-if="post.featuredImage" class="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-900">
        <img :src="post.featuredImage" :alt="post.title" class="w-full h-full object-cover opacity-80" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div class="absolute bottom-0 right-0 left-0 p-6 lg:p-10">
          <div class="container mx-auto max-w-3xl">
            <div class="flex flex-wrap gap-2 mb-3">
              <NuxtLink v-for="tag in post.tags" :key="tag" :to="`/blog?tag=${tag}`" class="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors">#{{ tag }}</NuxtLink>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">{{ post.title }}</h1>
          </div>
        </div>
      </div>
      <div v-else class="bg-gradient-to-l from-brand to-brand-dark py-12 px-4">
        <div class="container mx-auto max-w-3xl">
          <h1 class="text-2xl sm:text-3xl font-black text-white leading-tight">{{ post.title }}</h1>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">
          <GlassCard padding="lg">
            <div class="flex items-center justify-between flex-wrap gap-3 mb-6 pb-6 border-b border-glass-border">
              <div class="flex items-center gap-2 text-sm text-glass-text-secondary">
                <NuxtLink to="/" class="hover:text-glass-brand">خانه</NuxtLink>
                <span>/</span>
                <NuxtLink to="/blog" class="hover:text-glass-brand">بلاگ</NuxtLink>
                <span>/</span>
                <span class="text-glass-text-primary line-clamp-1">{{ post.title }}</span>
              </div>
              <div class="text-xs text-glass-text-secondary">
                <span class="flex items-center gap-1 font-fanum">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
              </div>
            </div>

            <p v-if="post.excerpt" class="text-lg text-glass-text-secondary leading-relaxed mb-8 font-light border-r-4 border-brand pr-4">{{ post.excerpt }}</p>

            <!-- Long-form reading text stays solid/high-contrast — glass is a
                 decorative surface only, never applied to the prose itself. -->
            <div class="blog-content text-glass-text-primary leading-loose" v-html="post.content" />

            <div v-if="post.tags?.length" class="mt-10 pt-6 border-t border-glass-border">
              <div class="flex flex-wrap gap-2">
                <NuxtLink v-for="tag in post.tags" :key="tag" :to="`/blog?tag=${tag}`" class="text-sm bg-brand/10 text-brand px-3 py-1.5 rounded-xl hover:bg-brand hover:text-white transition-all">#{{ tag }}</NuxtLink>
              </div>
            </div>

            <!-- ── Like + share bar ── -->
            <div class="mt-10 pt-6 border-t border-glass-border flex items-center justify-between flex-wrap gap-4">
              <NuxtLink to="/blog" class="flex items-center gap-2 text-sm text-glass-text-secondary hover:text-glass-brand transition-colors">
                <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
                بازگشت به بلاگ
              </NuxtLink>
              <div class="flex items-center gap-3">
                <!-- Like button -->
                <button
                  @click="handleLike"
                  :disabled="likeLoading"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                  :class="isLiked
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-glass border border-glass-border text-glass-text-secondary hover:border-rose-400 hover:text-rose-500'"
                >
                  <svg class="w-4 h-4 transition-transform" :class="isLiked ? 'scale-110' : ''"
                       :fill="isLiked ? 'currentColor' : 'none'"
                       stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
                  </svg>
                  <span class="font-fanum">{{ likeCount }}</span>
                </button>
                <!-- Copy link -->
                <button @click="copyLink" class="flex items-center gap-2 text-sm text-glass-text-secondary hover:text-glass-brand transition-colors">
                  {{ copied ? 'کپی شد ✓' : 'کپی لینک' }}
                </button>
              </div>
            </div>
          </GlassCard>

          <!-- ── Comments section ── -->
          <div class="mt-12">
            <h2 class="text-xl font-black text-glass-text-primary mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
              </svg>
              دیدگاه‌ها
              <span class="text-sm font-normal text-glass-text-secondary font-fanum">({{ comments.length }})</span>
            </h2>

            <!-- Comment form -->
            <GlassCard padding="lg" class="mb-8">
              <template v-if="auth.isLoggedIn">
                <p class="text-sm font-semibold text-glass-text-primary mb-3">دیدگاه خود را بنویسید</p>
                <textarea
                  v-model="commentText"
                  :disabled="commentSubmitting"
                  placeholder="نظر شما..."
                  rows="4"
                  maxlength="1000"
                  class="glass-textarea text-sm p-3"
                />
                <div class="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <span class="text-xs text-glass-text-disabled font-fanum">{{ commentText.length }}/1000</span>
                  <div class="flex items-center gap-3">
                    <span v-if="commentSuccess" class="text-xs text-success font-semibold">✓ دیدگاه شما پس از تأیید منتشر می‌شود</span>
                    <span v-if="commentError" class="text-xs text-error">{{ commentError }}</span>
                    <GlassButton variant="primary" size="sm" :loading="commentSubmitting" :disabled="commentSubmitting || commentText.trim().length < 2" @click="submitComment">
                      {{ commentSubmitting ? 'در حال ارسال...' : 'ارسال دیدگاه' }}
                    </GlassButton>
                  </div>
                </div>
              </template>
              <template v-else>
                <p class="text-sm text-center text-glass-text-secondary py-2">
                  برای ثبت دیدگاه
                  <NuxtLink to="/auth/login" class="text-glass-brand font-semibold hover:underline">وارد حساب کاربری</NuxtLink>
                  خود شوید
                </p>
              </template>
            </GlassCard>

            <!-- Comments list -->
            <div v-if="commentsLoading" class="space-y-4">
              <GlassCard v-for="n in 2" :key="n" padding="lg" class="animate-pulse">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-9 h-9 rounded-full bg-glass-strong"/>
                  <div class="space-y-1.5">
                    <div class="h-3 w-24 rounded bg-glass-strong"/>
                    <div class="h-2.5 w-16 rounded bg-glass-strong"/>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 rounded bg-glass-strong"/>
                  <div class="h-3 w-3/4 rounded bg-glass-strong"/>
                </div>
              </GlassCard>
            </div>

            <div v-else-if="!comments.length" class="text-center py-10 text-glass-text-secondary text-sm">
              هنوز دیدگاهی ثبت نشده — اولین نفر باشید!
            </div>

            <div v-else class="space-y-4">
              <GlassCard v-for="c in comments" :key="c._id" padding="lg">
                <div class="flex items-start gap-3">
                  <!-- Avatar -->
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-glass-brand text-white opacity-85">
                    {{ commentAuthorInitial(c.author) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <!-- Name + date -->
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="text-sm font-bold text-glass-text-primary">{{ commentAuthorName(c.author) }}</span>
                      <span class="text-xs text-glass-text-disabled font-fanum">{{ formatDate(c.createdAt) }}</span>
                    </div>
                    <!-- Content -->
                    <p class="text-sm text-glass-text-primary leading-relaxed">{{ c.content }}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import http from '~/services/http.service'
import GlassCard   from '~/components/glass/GlassCard.vue'
import GlassButton from '~/components/glass/GlassButton.vue'

definePageMeta({ layout: 'default' })

const route         = useRoute()
const config        = useRuntimeConfig()
const settingsStore = useSettingsStore()

const slug = computed(() => route.params.slug)

// ── SSR Data Fetch — Google sees full article content ──────────
const { data: post, error, pending } = await useFetch(
  () => `/api/v1/blog/slug/${slug.value}`,
  { key: () => `blog-${slug.value}`, transform: (r) => r?.data ?? r }
)

if (error.value) {
  throw createError({ statusCode: 404, fatal: true, message: 'مقاله یافت نشد' })
}

// ── SEO ─────────────────────────────────────────────────────────
useSeoMeta({
  title:                () => post.value?.metaTitle       || post.value?.title   || '',
  description:          () => post.value?.metaDescription || post.value?.excerpt || '',
  ogTitle:              () => post.value?.title   || '',
  ogDescription:        () => post.value?.excerpt || '',
  ogImage: () => {
    const img = post.value?.featuredImage
    if (!img) return undefined
    return img.startsWith('http') ? img : `${config.public.siteUrl}${img}`
  },
  ogType:               'article',
  articlePublishedTime: () => post.value?.publishedAt || undefined,
  ogUrl:                () => `${config.public.siteUrl}/blog/${slug.value}`,
})
useHead({
  link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/blog/${slug.value}` }],
  script: computed(() => {
    const p = post.value
    if (!p) return []
    const img = p.featuredImage ? (p.featuredImage.startsWith('http') ? p.featuredImage : `${config.public.siteUrl}${p.featuredImage}`) : null
    const scripts = [{
      type: 'application/ld+json', key: 'jsonld-article',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: p.title, description: p.excerpt, image: img,
        datePublished: p.publishedAt, dateModified: p.updatedAt,
        url: `${config.public.siteUrl}/blog/${p.slug}`,
        author:    { '@type': 'Organization', name: settingsStore.siteName },
        publisher: { '@type': 'Organization', name: settingsStore.siteName, logo: { '@type': 'ImageObject', url: `${config.public.siteUrl}/nik-logo.png` } },
        keywords: (p.tags || []).join(', '),
      }),
    }]
    if (p.faq?.length) {
      scripts.push({
        type: 'application/ld+json', key: 'jsonld-faq',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: p.faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }),
      })
    }
    return scripts
  }),
})

const auth = useAuthStore()

const copied = ref(false)

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch { /* ignore */ }
}

// ── Like ─────────────────────────────────────────────────────────
const likeCount   = ref(post.value?.likeCount ?? 0)
const isLiked     = ref(false)
const likeLoading = ref(false)

onMounted(async () => {
  if (!auth.isLoggedIn || !post.value?._id) return
  try {
    const { data } = await http.get(`/blog/${post.value._id}/like-status`)
    isLiked.value  = data.isLiked
    likeCount.value = data.likeCount
  } catch { /* ignore — show default */ }
})

async function handleLike() {
  if (!auth.isLoggedIn) { navigateTo('/auth/login'); return }
  if (likeLoading.value) return
  likeLoading.value = true
  try {
    const { data } = await http.post(`/blog/${post.value._id}/like`)
    isLiked.value   = data.isLiked
    likeCount.value = data.likeCount
  } catch { /* ignore */ } finally {
    likeLoading.value = false
  }
}

// ── Comments ─────────────────────────────────────────────────────
const comments         = ref([])
const commentsLoading  = ref(true)
const commentText      = ref('')
const commentSubmitting = ref(false)
const commentSuccess   = ref(false)
const commentError     = ref('')

onMounted(async () => {
  if (!post.value?._id) return
  try {
    const { data } = await http.get(`/blog/${post.value._id}/comments`)
    comments.value = Array.isArray(data) ? data : (data?.comments ?? [])
  } catch { comments.value = [] } finally {
    commentsLoading.value = false
  }
})

async function submitComment() {
  const text = commentText.value.trim()
  if (text.length < 2) return
  commentSubmitting.value = true
  commentSuccess.value    = false
  commentError.value      = ''
  try {
    await http.post(`/blog/${post.value._id}/comments`, { content: text })
    commentText.value    = ''
    commentSuccess.value = true
    setTimeout(() => { commentSuccess.value = false }, 5000)
  } catch (e) {
    commentError.value = e?.response?.data?.message ?? 'خطا در ارسال دیدگاه'
    setTimeout(() => { commentError.value = '' }, 4000)
  } finally {
    commentSubmitting.value = false
  }
}

function commentAuthorName(author) {
  if (!author) return 'کاربر'
  if (author.firstName || author.lastName) return `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim()
  return 'کاربر'
}

function commentAuthorInitial(author) {
  return author?.firstName?.[0] ?? '👤'
}
</script>

<style>
.blog-content { font-size: 1rem; }
.blog-content h2 { font-size: 1.35rem; font-weight: 700; margin: 1.8rem 0 0.8rem; color: var(--color-text-primary); }
.blog-content h3 { font-size: 1.1rem; font-weight: 600; margin: 1.4rem 0 0.6rem; color: var(--color-text-primary); }
.blog-content p  { margin-bottom: 1rem; color: var(--color-text-primary); }
.blog-content ul, .blog-content ol { padding-right: 1.5rem; margin-bottom: 1rem; }
.blog-content li { margin-bottom: 0.5rem; }
.blog-content a  { color: rgb(var(--color-brand-rgb)); text-decoration: underline; }
.blog-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
.blog-content blockquote { border-right: 4px solid rgb(var(--color-brand-rgb)); padding-right: 1rem; color: var(--color-text-secondary); font-style: italic; margin: 1.5rem 0; }
.blog-content code { background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.15em 0.45em; border-radius: 4px; font-size: 0.85em; }
.blog-content pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; }
.blog-content hr { border-color: var(--color-border); margin: 2rem 0; }

/* Comment textarea — matches GlassInput's shallow-blur, high-contrast recipe */
.glass-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1.5px solid var(--glass-border);
  background: var(--glass);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  color: var(--text-primary);
  outline: none;
  resize: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.glass-textarea::placeholder { color: var(--text-secondary); opacity: 0.6; }
.glass-textarea:focus { border-color: var(--brand-light); box-shadow: 0 0 0 3px rgb(var(--brand-rgb) / 0.18); }
</style>
