<template>
  <div class="reviews">
    <div class="reviews__summary">
      <div class="reviews__avg">
        <span class="reviews__avg-num">{{ toPersianDigits(stats.avgRating || 0) }}</span>
        <div class="reviews__avg-stars">
          <AppIcon
            v-for="i in 5"
            :key="i"
            name="star"
            :size="12"
            :filled="i <= Math.round(stats.avgRating || 0)"
          />
        </div>
        <span class="reviews__avg-count">{{ toPersianDigits(total) }} نظر</span>
      </div>

      <div class="reviews__dist">
        <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="reviews__dist-row">
          <span>{{ toPersianDigits(n) }}</span>
          <div class="reviews__dist-track">
            <div class="reviews__dist-fill" :style="{ width: distPct(n) + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="pending" class="reviews__skel">
      <div v-for="i in 2" :key="i" class="reviews__skel-item" />
    </div>

    <div v-else-if="reviews.length" class="reviews__list">
      <article v-for="r in reviews" :key="r._id" class="review-card">
        <header class="review-card__head">
          <div class="review-card__author">
            <span class="review-card__name">{{ authorName(r) }}</span>
            <span v-if="r.isVerifiedPurchase" class="review-card__verified">خرید تأیید شده</span>
          </div>
          <div class="review-card__stars">
            <AppIcon v-for="i in 5" :key="i" name="star" :size="11" :filled="i <= r.rating" />
          </div>
        </header>

        <h4 v-if="r.title" class="review-card__title">{{ r.title }}</h4>
        <p class="review-card__body">{{ r.body }}</p>

        <div v-if="r.pros?.length || r.cons?.length" class="review-card__proscons">
          <div v-if="r.pros?.length" class="review-card__pros">
            <span v-for="(p, i) in r.pros" :key="i">+ {{ p }}</span>
          </div>
          <div v-if="r.cons?.length" class="review-card__cons">
            <span v-for="(c, i) in r.cons" :key="i">- {{ c }}</span>
          </div>
        </div>

        <button type="button" class="review-card__helpful" @click="$emit('toggle-helpful', r._id)">
          <AppIcon name="check" :size="12" :stroke-width="2" />
          مفید بود ({{ toPersianDigits(r.helpfulCount || 0) }})
        </button>
      </article>

      <button v-if="hasMore" type="button" class="reviews__more" :disabled="loadingMore" @click="$emit('load-more')">
        {{ loadingMore ? 'در حال بارگذاری...' : 'مشاهده نظرات بیشتر' }}
      </button>
    </div>

    <p v-else class="reviews__empty">هنوز نظری برای این محصول ثبت نشده است</p>
  </div>
</template>

<script setup>
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

const props = defineProps({
  reviews: { type: Array, default: () => [] },
  stats: { type: Object, default: () => ({ avgRating: 0, distribution: {} }) },
  total: { type: Number, default: 0 },
  pending: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
})

defineEmits(['load-more', 'toggle-helpful'])

function distPct(n) {
  const count = props.stats.distribution?.[n] || 0
  if (!props.total) return 0
  return Math.round((count / props.total) * 100)
}

function authorName(r) {
  const u = r.userId
  if (!u || typeof u === 'string') return 'کاربر نیک'
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || 'کاربر نیک'
}
</script>

<style scoped>
.reviews__summary {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;
}

.reviews__avg { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
.reviews__avg-num { font-size: 26px; font-weight: 800; color: var(--text-primary); }
.reviews__avg-stars { display: flex; gap: 2px; color: #E7C878; }
.reviews__avg-count { font-size: 10.5px; color: var(--text-secondary); }

.reviews__dist { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.reviews__dist-row { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text-secondary); }
.reviews__dist-track { flex: 1; height: 5px; border-radius: 3px; background: var(--glass); overflow: hidden; }
.reviews__dist-fill { height: 100%; background: var(--brand-light); border-radius: 3px; }

.reviews__skel-item { height: 90px; border-radius: 16px; background: var(--glass); margin-bottom: 10px; animation: rv-pulse 1.6s ease-in-out infinite; }
@keyframes rv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }

.reviews__list { display: flex; flex-direction: column; gap: 10px; }

.review-card {
  border-radius: 16px;
  padding: 13px 15px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
}

.review-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.review-card__author { display: flex; align-items: center; gap: 6px; }
.review-card__name { font-size: 12px; font-weight: 700; color: var(--text-primary); }
.review-card__verified {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  color: var(--brand-light);
  background: rgba(110, 176, 130, .16);
}
[data-theme='light'] .review-card__verified { color: var(--brand-dark); }
.review-card__stars { display: flex; gap: 1px; color: #E7C878; }

.review-card__title { font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.review-card__body { font-size: 12px; line-height: 1.7; color: var(--text-secondary); }

.review-card__proscons { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
.review-card__pros span { display: block; font-size: 11px; color: var(--brand-light); }
[data-theme='light'] .review-card__pros span { color: var(--brand-dark); }
.review-card__cons span { display: block; font-size: 11px; color: #E08585; }

.review-card__helpful {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
}

.reviews__more {
  margin-top: 4px;
  padding: 11px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}

.reviews__empty { font-size: 12.5px; color: var(--text-secondary); text-align: center; padding: 20px 0; }
</style>
