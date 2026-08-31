<template>
  <div class="py-5 border-b border-glass-border last:border-none">

    <!-- Header -->
    <div class="flex items-start gap-3 mb-3">
      <div class="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
        <span class="text-brand font-bold text-sm">
          {{ (review.userId?.firstName || '?')[0] }}
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="font-medium text-glass-text-primary text-sm">
            {{ review.userId?.firstName }} {{ review.userId?.lastName }}
          </span>
          <span class="text-glass-text-disabled text-xs font-fanum">
            {{ formatDate(review.createdAt) }}
          </span>
        </div>
        <BaseRating :modelValue="review.rating" readonly size="sm" class="mt-1" />
      </div>
    </div>

    <!-- Title -->
    <h4 v-if="review.title" class="font-bold text-glass-text-primary text-sm mb-2">
      {{ review.title }}
    </h4>

    <!-- Body -->
    <p class="text-glass-text-secondary text-sm leading-7 mb-3">
      {{ review.body }}
    </p>

    <!-- Review images -->
    <div v-if="review.images?.length" class="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
      <img
        v-for="img in review.images"
        :key="img"
        :src="img"
        alt="تصویر نظر"
        class="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-glass-border cursor-pointer hover:opacity-80 transition-opacity"
      />
    </div>

    <!-- Helpful button -->
    <div class="flex items-center gap-2">
      <span class="text-glass-text-disabled text-xs">آیا این نظر مفید بود؟</span>
      <button
        @click="toggleHelpful"
        :disabled="loading"
        :class="[
          'flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-all duration-200',
          liked
            ? 'text-brand border-brand/30 bg-brand/8 font-medium'
            : 'text-glass-text-secondary border-transparent hover:text-brand hover:bg-brand/5 hover:border-brand/20',
          loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ]"
      >
        <svg
          class="w-3.5 h-3.5 transition-all duration-200"
          :fill="liked ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
        مفید بود
        <span v-if="count > 0" class="font-fanum">({{ count }})</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore }   from '~/stores/auth.store'
import { useUiStore }     from '~/stores/ui.store'
import { reviewService }  from '~/services/review.service'
import BaseRating from '~/components/common/BaseRating.vue'
import { formatDate } from '~/utils/formatters'

const props = defineProps({
  review: { type: Object, required: true },
})

const authStore = useAuthStore()
const ui        = useUiStore()

const liked   = ref(false)
const count   = ref(props.review.helpfulCount ?? 0)
const loading = ref(false)

async function toggleHelpful() {
  if (!authStore.isLoggedIn) {
    ui.addToast('برای ثبت نظر مفید باید وارد حساب خود شوید', 'info')
    return
  }
  if (loading.value) return

  // Optimistic update
  liked.value  = !liked.value
  count.value += liked.value ? 1 : -1

  loading.value = true
  try {
    const { data } = await reviewService.markHelpful(props.review._id)
    liked.value = data.helpful
    count.value = data.count
  } catch {
    // Revert on error
    liked.value  = !liked.value
    count.value += liked.value ? 1 : -1
  } finally {
    loading.value = false
  }
}
</script>
