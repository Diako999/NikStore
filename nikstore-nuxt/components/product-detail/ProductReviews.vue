<template>
  <div>

    <!-- Stats panel -->
    <GlassCard v-if="stats" padding="lg" radius="18px" class="mb-6">
      <div class="flex items-start gap-6 flex-wrap">

        <!-- Overall score -->
        <div class="text-center flex-shrink-0">
          <div class="text-5xl font-black text-glass-text-primary font-fanum mb-1">
            {{ stats.avgRating?.toFixed(1) || '0.0' }}
          </div>
          <BaseRating :modelValue="stats.avgRating || 0" readonly size="sm" />
          <div class="text-glass-text-secondary text-xs mt-1 font-fanum">
            از {{ formatNumber(stats.reviewCount) }} نظر
          </div>
        </div>

        <!-- Bar distribution -->
        <div class="flex-1 min-w-[200px] space-y-2">
          <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-3">
            <span class="text-xs text-glass-text-secondary w-4 text-left font-fanum flex-shrink-0">{{ star }}</span>
            <svg class="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <div class="flex-1 rounded-full h-2 overflow-hidden" style="background-color: var(--glass-border);">
              <div
                class="h-full bg-yellow-400 rounded-full transition-all duration-500"
                :style="{ width: barWidth(star) + '%' }"
              />
            </div>
            <span class="text-xs text-glass-text-disabled font-fanum w-8 text-left">
              {{ stats.distribution?.[star] || 0 }}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>

    <!-- Review form -->
    <ReviewForm :product-id="productId" @submitted="onReviewSubmitted" />

    <!-- Pending review notice -->
    <div v-if="myPending"
         class="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
      <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div>
        <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">نظر شما در انتظار تأیید است</p>
        <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1 line-clamp-2">{{ myPending.body }}</p>
      </div>
    </div>

    <!-- List header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-glass-text-primary">نظرات کاربران</h3>
      <select
        v-model="sortBy"
        @change="fetchReviews(true)"
        class="text-sm border border-glass-border rounded-lg px-3 py-1.5 text-glass-text-secondary outline-none focus:border-brand"
        style="background-color: var(--glass-strong);"
      >
        <option value="createdAt">جدیدترین</option>
        <option value="helpful">مفیدترین</option>
        <option value="rating">بالاترین امتیاز</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="py-5 border-b border-glass-border">
        <div class="flex gap-3 mb-3">
          <BaseSkeleton circle width="40px" height="40px" />
          <div class="flex-1">
            <BaseSkeleton height="1rem" width="120px" class="mb-2" />
            <BaseSkeleton height="0.75rem" width="80px" />
          </div>
        </div>
        <BaseSkeleton height="0.875rem" class="mb-2" />
        <BaseSkeleton height="0.875rem" width="80%" />
      </div>
    </div>

    <!-- Review list -->
    <template v-else>
      <ReviewCard
        v-for="review in reviews"
        :key="review._id"
        :review="review"
      />

      <!-- Empty state -->
      <div v-if="reviews.length === 0" class="text-center py-10">
        <div class="text-4xl mb-3">💬</div>
        <p class="text-glass-text-secondary text-sm">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="text-center mt-6">
        <BaseButton variant="outline" :loading="loadingMore" @click="loadMore">
          نمایش نظرات بیشتر
        </BaseButton>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore }  from '~/stores/auth.store'
import { reviewService } from '~/services/review.service'
import { formatNumber }  from '~/utils/formatters'
import BaseRating   from '~/components/common/BaseRating.vue'
import BaseSkeleton from '~/components/common/BaseSkeleton.vue'
import BaseButton   from '~/components/common/BaseButton.vue'
import GlassCard    from '~/components/glass/GlassCard.vue'
import ReviewCard   from './ReviewCard.vue'
import ReviewForm   from './ReviewForm.vue'

const props = defineProps({
  productId: { type: String, default: '' },
  stats:     { type: Object, default: null },
  loading:   { type: Boolean, default: false },
})

const authStore   = useAuthStore()
const reviews     = ref([])
const page        = ref(1)
const hasMore     = ref(false)
const loadingMore = ref(false)
const sortBy      = ref('createdAt')
const myPending   = ref(null)

async function fetchMyPending() {
  if (!authStore.isLoggedIn || !props.productId) return
  try {
    const { data } = await reviewService.getMyReviews({ page: 1, limit: 50 })
    const found = (data.reviews ?? data.items ?? []).find(
      r => (r.productId?._id ?? r.productId) === props.productId && r.status === 'pending'
    )
    myPending.value = found ?? null
  } catch { /* silent */ }
}

async function fetchReviews(reset = false) {
  if (reset) { page.value = 1; reviews.value = [] }
  if (!props.productId) return
  try {
    const { data } = await reviewService.getByProduct(props.productId, {
      page:  page.value,
      limit: 5,
      sortBy: sortBy.value,
    })
    if (reset) {
      reviews.value = data.items ?? []
    } else {
      reviews.value.push(...(data.items ?? []))
    }
    hasMore.value = reviews.value.length < (data.total ?? 0)
    page.value++
  } catch {
    // silent
  }
}

async function loadMore() {
  loadingMore.value = true
  try { await fetchReviews(false) }
  finally { loadingMore.value = false }
}


function onReviewSubmitted() {
  fetchReviews(true)
  fetchMyPending()
}

function barWidth(star) {
  const total = props.stats?.reviewCount || 1
  return Math.round(((props.stats?.distribution?.[star] || 0) / total) * 100)
}

onMounted(() => { fetchReviews(true); fetchMyPending() })
</script>
