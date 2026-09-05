<template>
  <form class="review-form" @submit.prevent="submit">
    <div class="review-form__rating">
      <span class="review-form__label">امتیاز شما</span>
      <div class="review-form__stars">
        <button
          v-for="i in 5"
          :key="i"
          type="button"
          class="review-form__star"
          :aria-label="`${i} ستاره`"
          @click="rating = i"
        >
          <AppIcon name="star" :size="22" :filled="i <= rating" />
        </button>
      </div>
    </div>

    <input v-model.trim="title" class="review-form__input" type="text" maxlength="100" placeholder="عنوان نظر (اختیاری)">

    <textarea
      v-model.trim="body"
      class="review-form__textarea"
      rows="4"
      maxlength="1000"
      placeholder="تجربه خود را از این محصول بنویسید (حداقل ۲۰ کاراکتر)..."
    />
    <span class="review-form__hint" :class="{ 'review-form__hint--ok': body.length >= 20 }">
      {{ toPersianDigits(body.length) }} / ۱۰۰۰
    </span>

    <p v-if="error" class="review-form__error">{{ error }}</p>

    <button type="submit" class="review-form__submit" :disabled="!canSubmit || submitting">
      {{ submitting ? 'در حال ارسال...' : 'ثبت نظر' }}
    </button>
  </form>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

defineProps({
  submitting: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['submit'])

const rating = ref(0)
const title = ref('')
const body = ref('')

const canSubmit = computed(() => rating.value > 0 && body.value.length >= 20)

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    rating: rating.value,
    title: title.value || undefined,
    body: body.value,
  })
}

defineExpose({
  reset: () => {
    rating.value = 0
    title.value = ''
    body.value = ''
  },
})
</script>

<style scoped>
.review-form { display: flex; flex-direction: column; gap: 12px; }

.review-form__rating { display: flex; align-items: center; gap: 10px; }
.review-form__label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.review-form__stars { display: flex; gap: 4px; color: #E7C878; }
.review-form__star { display: flex; }

.review-form__input,
.review-form__textarea {
  width: 100%;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  outline: none;
  resize: vertical;
}

.review-form__hint { align-self: flex-start; font-size: 10px; color: var(--text-disabled); margin-top: -6px; }
.review-form__hint--ok { color: var(--brand-light); }

.review-form__error { font-size: 11.5px; color: #E08585; }

.review-form__submit {
  padding: 13px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 8px 20px rgba(40, 55, 46, .3);
}
.review-form__submit:disabled { opacity: .5; }
</style>
