<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-icon">
        <AppIcon name="alert" :size="30" :stroke-width="1.6" />
      </div>
      <h1>{{ isNotFound ? 'صفحه پیدا نشد' : 'مشکلی پیش آمد' }}</h1>
      <p>
        {{ isNotFound
          ? 'صفحه‌ای که دنبالش بودید وجود ندارد یا جابه‌جا شده است.'
          : 'در پردازش درخواست شما خطایی رخ داد. لطفاً کمی بعد دوباره امتحان کنید.' }}
      </p>
      <button type="button" class="error-cta" @click="backHome">
        بازگشت به خانه
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'

const error = useError()
const isNotFound = computed(() => error.value?.statusCode === 404)

function backHome() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.error-card {
  width: 100%;
  max-width: 340px;
  text-align: center;
  padding: 34px 24px;
  border-radius: 22px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}
[data-theme='light'] .error-card {
  box-shadow: var(--glass-shadow);
}

.error-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: linear-gradient(135deg, rgba(110, 176, 130, .30), rgba(231, 175, 66, .16));
  border: 1px solid var(--glass-border);
}
[data-theme='light'] .error-icon { color: var(--brand-dark); }

.error-card h1 { font-size: 18px; font-weight: 800; margin-bottom: 10px; color: var(--text-primary); }
.error-card p { font-size: 13px; line-height: 1.8; color: var(--text-secondary); margin-bottom: 22px; }

.error-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  padding: 12px 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .3);
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
  cursor: pointer;
}
</style>
