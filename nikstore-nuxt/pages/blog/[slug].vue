<template>
  <div class="post-page">
    <NuxtLink to="/blog" class="post-back">
      <AppIcon name="chevron-right" :size="15" :stroke-width="2.2" />
      بازگشت به وبلاگ
    </NuxtLink>

    <div v-if="post.featuredImage" class="post-cover">
      <img :src="post.featuredImage" :alt="post.title" loading="lazy">
    </div>

    <header class="post-head">
      <div v-if="post.tags?.length" class="post-tags">
        <NuxtLink v-for="t in post.tags" :key="t" :to="`/blog?tag=${t}`" class="post-tag">
          {{ t }}
        </NuxtLink>
      </div>
      <h1>{{ post.title }}</h1>
      <div class="post-meta">
        <span>{{ authorName(post.author) }}</span>
        <span class="post-meta__dot">·</span>
        <span>{{ formatDate(post.publishedAt || post.createdAt) }}</span>
        <span class="post-meta__dot">·</span>
        <span>{{ toPersianDigits(post.viewCount ?? 0) }} بازدید</span>
      </div>
    </header>

    <div class="post-body" v-html="sanitizedContent" />

    <div class="post-actions">
      <button type="button" class="like-btn" :class="{ 'like-btn--active': liked }" @click="toggleLike">
        <AppIcon name="heart" :size="17" :stroke-width="2" :filled="liked" />
        <span>{{ toPersianDigits(likeCount) }}</span>
      </button>
    </div>

    <section class="comments">
      <h2 class="comments__head">
        <AppIcon name="message" :size="16" :stroke-width="1.8" />
        دیدگاه‌ها
        <span v-if="comments.length" class="comments__count">({{ toPersianDigits(comments.length) }})</span>
      </h2>

      <div v-if="authStore.isLoggedIn" class="comment-form">
        <textarea
          v-model="commentText"
          rows="3"
          maxlength="1000"
          placeholder="دیدگاه خود را بنویسید..."
        />
        <button
          type="button"
          class="comment-submit"
          :disabled="!commentText.trim() || submitting"
          @click="submitComment"
        >
          <AppIcon name="send" :size="14" :stroke-width="2" />
          ارسال دیدگاه
        </button>
        <p v-if="submitMessage" class="comment-form__msg">{{ submitMessage }}</p>
      </div>
      <div v-else class="comment-login-hint">
        برای ثبت دیدگاه ابتدا <NuxtLink to="/auth/login">وارد شوید</NuxtLink>
      </div>

      <ul v-if="comments.length" class="comment-list">
        <li v-for="c in comments" :key="c._id" class="comment-item">
          <div class="comment-item__head">
            <span class="comment-item__author">{{ authorName(c.author) }}</span>
            <span class="comment-item__date">{{ formatDate(c.createdAt) }}</span>
          </div>
          <p class="comment-item__text">{{ c.content }}</p>
        </li>
      </ul>
      <p v-else class="empty-hint">هنوز دیدگاهی ثبت نشده است. اولین نفر باشید.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DOMPurify from 'isomorphic-dompurify'
import AppIcon from '~/components/icons/AppIcon.vue'
import { blogService } from '~/services/blog.service'
import { useAuthStore } from '~/stores/auth.store'
import { toPersianDigits } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug
const authStore = useAuthStore()

// Reads through $fetch (not blogService) so this runs SSR-side to match
// the /blog/** swr rule — blogService's axios instance uses a relative
// baseURL, which only resolves in the browser.
const { data: postData, error: postError } = await useAsyncData(
  `blog-post-${slug}`,
  () => $fetch(`/api/v1/blog/slug/${slug}`),
  { transform: (r) => r?.data ?? r },
)

if (postError.value || !postData.value) {
  throw createError({
    statusCode: postError.value?.statusCode || postError.value?.data?.statusCode || 404,
    statusMessage: 'پست یافت نشد',
    fatal: true,
  })
}

const post = computed(() => postData.value)

useSeoMeta({
  title: post.value.metaTitle || post.value.title,
  description: post.value.metaDescription || post.value.excerpt || undefined,
})

// ── Comments — public to read, so this also runs SSR-side ──────
const { data: commentsData } = await useAsyncData(
  `blog-comments-${slug}`,
  () => $fetch(`/api/v1/blog/${post.value._id}/comments`),
  { transform: (r) => r?.data ?? r ?? [] },
)
const comments = computed(() => commentsData.value ?? [])

// ── Like — needs auth, so it only ever runs client-side ─────────
const liked = ref(false)
const likeCount = ref(post.value.likeCount ?? 0)

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  try {
    const res = await blogService.getLikeStatus(post.value._id)
    liked.value = res.data.isLiked
    likeCount.value = res.data.likeCount
  } catch {
    // Not fatal — the like button just shows the logged-out default state.
  }
})

async function toggleLike() {
  if (!authStore.isLoggedIn) {
    navigateTo('/auth/login')
    return
  }
  try {
    const res = await blogService.like(post.value._id)
    liked.value = res.data.isLiked
    likeCount.value = res.data.likeCount
  } catch {
    // Leave the state as-is on failure rather than showing a broken toggle.
  }
}

// ── Comment form ─────────────────────────────────────────────
const commentText = ref('')
const submitting = ref(false)
const submitMessage = ref('')

async function submitComment() {
  const content = commentText.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  submitMessage.value = ''
  try {
    await blogService.addComment(post.value._id, { content })
    commentText.value = ''
    submitMessage.value = 'دیدگاه شما ثبت شد و پس از تایید نمایش داده می‌شود.'
  } catch {
    submitMessage.value = 'ثبت دیدگاه ناموفق بود. لطفاً دوباره تلاش کنید.'
  } finally {
    submitting.value = false
  }
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

// Content comes from the CMS's rich-text editor (admin-authored, not open
// user input), but still gets sanitized before going into v-html — strips
// anything that could execute if an admin account were ever compromised
// or a paste brought stray markup along. Runs through a real HTML parser
// (DOMPurify), not a hand-rolled regex, since regex-based tag stripping
// is reliably bypassable with malformed or nested markup.
const sanitizedContent = computed(() => DOMPurify.sanitize(post.value.content || ''))
</script>

<style scoped>
.post-page { padding-bottom: 8px; }

.post-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 18px 18px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.post-cover {
  margin: 0 18px 16px;
  border-radius: 18px;
  overflow: hidden;
  height: 200px;
  background: var(--glass);
}
.post-cover img { width: 100%; height: 100%; object-fit: cover; }

.post-head { margin: 0 18px 18px; }

.post-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.post-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}

.post-head h1 { font-size: 19px; font-weight: 800; line-height: 1.5; color: var(--text-primary); margin-bottom: 10px; }

.post-meta { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-disabled); flex-wrap: wrap; }
.post-meta__dot { opacity: .6; }

.post-body { margin: 0 18px 22px; }
.post-body :deep(p) { margin-bottom: 14px; line-height: 1.9; color: var(--text-primary); font-size: 14px; }
.post-body :deep(h2) { font-size: 16.5px; font-weight: 700; margin: 20px 0 10px; color: var(--text-primary); }
.post-body :deep(h3) { font-size: 15px; font-weight: 700; margin: 18px 0 8px; color: var(--text-primary); }
.post-body :deep(a) { color: var(--brand-light); text-decoration: underline; }
[data-theme='light'] .post-body :deep(a) { color: var(--brand-dark); }
.post-body :deep(img) { border-radius: 14px; margin: 14px 0; }
.post-body :deep(ul),
.post-body :deep(ol) { margin: 0 0 14px; padding-inline-start: 20px; color: var(--text-primary); line-height: 1.9; }
.post-body :deep(blockquote) {
  border-inline-start: 3px solid var(--brand);
  padding-inline-start: 14px;
  margin: 16px 0;
  color: var(--text-secondary);
  font-style: italic;
}
.post-body :deep(strong) { font-weight: 700; }
.post-body :deep(code) { background: var(--glass); padding: 2px 6px; border-radius: 6px; font-size: 12.5px; }

.post-actions { margin: 0 18px 26px; }
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  cursor: pointer;
}
.like-btn--active { color: var(--brand-light); border-color: var(--brand); }
[data-theme='light'] .like-btn--active { color: var(--brand-dark); }

.comments { margin: 0 18px 26px; }
.comments__head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
}
.comments__count { font-weight: 500; color: var(--text-secondary); }

.comment-form { margin-bottom: 18px; }
.comment-form textarea {
  width: 100%;
  resize: vertical;
  border-radius: 14px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  margin-bottom: 10px;
}
.comment-form textarea::placeholder { color: var(--text-secondary); }

.comment-submit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .3);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  cursor: pointer;
}
.comment-submit:disabled { opacity: .5; cursor: not-allowed; }

.comment-form__msg { margin-top: 8px; font-size: 11.5px; color: var(--brand-light); }
[data-theme='light'] .comment-form__msg { color: var(--brand-dark); }

.comment-login-hint {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 18px;
}
.comment-login-hint a { color: var(--brand-light); font-weight: 700; text-decoration: underline; }
[data-theme='light'] .comment-login-hint a { color: var(--brand-dark); }

.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item {
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.comment-item__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.comment-item__author { font-size: 12px; font-weight: 700; color: var(--text-primary); }
.comment-item__date { font-size: 10.5px; color: var(--text-disabled); }
.comment-item__text { font-size: 12.5px; line-height: 1.8; color: var(--text-secondary); }

.empty-hint { font-size: 12.5px; color: var(--text-secondary); }
</style>
