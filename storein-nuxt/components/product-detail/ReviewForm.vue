<template>
  <GlassCard padding="lg" radius="16px" class="mb-6">

    <!-- Not logged in -->
    <div v-if="!authStore.isLoggedIn" class="text-center py-4">
      <p class="text-glass-text-secondary text-sm mb-3">
        برای ثبت نظر وارد حساب کاربری خود شوید
      </p>
      <NuxtLink to="/auth/login">
        <BaseButton variant="outline" size="sm">ورود / ثبت‌نام</BaseButton>
      </NuxtLink>
    </div>

    <!-- Form -->
    <div v-else>
      <button @click="formOpen = !formOpen" class="flex items-center justify-between w-full">
        <span class="font-bold text-glass-text-primary text-sm">ثبت نظر و امتیاز</span>
        <svg
          class="w-4 h-4 text-glass-text-secondary transition-transform duration-200"
          :class="{ 'rotate-180': formOpen }"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <Transition name="slide-down">
        <div v-if="formOpen" class="mt-4 space-y-4">

          <!-- Star selector -->
          <div>
            <label class="text-sm text-glass-text-secondary block mb-2">
              امتیاز شما:
              <span class="text-brand font-bold">{{ ratingLabel }}</span>
            </label>
            <BaseRating v-model="form.rating" size="lg" />
          </div>

          <!-- Title dropdown -->
          <div>
            <label class="block text-sm font-medium text-glass-text-primary mb-1.5">عنوان نظر</label>
            <div class="relative">
              <select
                v-model="form.title"
                :class="[
                  'input-field appearance-none w-full cursor-pointer',
                  errors.title ? 'border-error' : '',
                  !form.title ? 'text-glass-text-disabled' : 'text-glass-text-primary',
                ]"
              >
                <option value="" disabled>یک عنوان انتخاب کنید...</option>
                <option>کیفیت عالی، ارزش خرید دارد</option>
                <option>دقیقاً مطابق تصویر و توضیحات بود</option>
                <option>راضی هستم، توصیه می‌کنم</option>
                <option>قیمت مناسب، کیفیت خوب</option>
                <option>طراحی زیبا و ظاهر شیک</option>
                <option>سبک و راحت روی صورت</option>
                <option>مقاوم و با دوام به نظر می‌رسد</option>
                <option>ارسال سریع و بسته‌بندی مناسب</option>
                <option>متوسط بود، نه خوب نه بد</option>
                <option>انتظاراتم برآورده نشد</option>
              </select>
              <!-- chevron icon -->
              <svg
                class="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-glass-text-secondary"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
            <p v-if="errors.title" class="text-error text-xs mt-1">{{ errors.title }}</p>
          </div>

          <!-- Body -->
          <div>
            <label class="block text-sm font-medium text-glass-text-primary mb-1.5">
              متن نظر <span class="text-error">*</span>
            </label>
            <textarea
              v-model="form.body"
              rows="4"
              placeholder="تجربه خود از این محصول را بنویسید..."
              :class="['input-field resize-none', errors.body ? 'border-error' : '']"
            />
            <p v-if="errors.body" class="text-error text-xs mt-1">{{ errors.body }}</p>
          </div>

          <!-- API error -->
          <div v-if="apiError" class="bg-red-50 border border-red-200 rounded-xl p-3">
            <p class="text-error text-sm">{{ apiError }}</p>
          </div>

          <BaseButton block :loading="submitting" @click="submitReview">ثبت نظر</BaseButton>
        </div>
      </Transition>
    </div>
  </GlassCard>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '~/stores/auth.store'
import { useUiStore }   from '~/stores/ui.store'
import { reviewService } from '~/services/review.service'
import BaseButton from '~/components/common/BaseButton.vue'
import BaseRating from '~/components/common/BaseRating.vue'
import GlassCard  from '~/components/glass/GlassCard.vue'

const props = defineProps({
  productId: { type: String, required: true },
})
const emit = defineEmits(['submitted'])

const authStore = useAuthStore()
const ui        = useUiStore()

const formOpen  = ref(false)
const submitting = ref(false)
const apiError  = ref('')

const form   = reactive({ rating: 0, title: '', body: '' })
const errors = reactive({ title: '', body: '' })

const ratingLabels = ['', 'بد', 'متوسط', 'خوب', 'خیلی خوب', 'عالی']
const ratingLabel  = computed(() => ratingLabels[form.rating] || '')

async function submitReview() {
  errors.title = errors.body = apiError.value = ''

  if (!form.rating)           { errors.body = 'امتیاز الزامی است'; return }
  if (!form.body.trim())      { errors.body = 'متن نظر الزامی است'; return }
  if (form.body.trim().length < 20) { errors.body = 'حداقل ۲۰ کاراکتر وارد کنید'; return }

  submitting.value = true
  try {
    await reviewService.create({
      productId: props.productId,
      rating:    form.rating,
      title:     form.title.trim() || undefined,
      body:      form.body.trim(),
    })
    ui.addToast('نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود', 'success')
    Object.assign(form, { rating: 0, title: '', body: '' })
    formOpen.value = false
    emit('submitted')
  } catch (err) {
    if (err.response?.status === 403) {
      apiError.value = 'برای ثبت نظر باید این محصول را خریداری کرده باشید'
    } else {
      apiError.value = 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
