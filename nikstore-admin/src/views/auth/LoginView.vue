<template>
  <AdminCard class="login-card">
    <RouterLink to="/" class="login-card__brand">
      <img :src="logoSrc" alt="نیک" class="login-card__logo" />
      <p class="login-card__tag">پنل مدیریت</p>
    </RouterLink>

    <form class="login-card__form" @submit.prevent="handleSubmit">
      <AdminInput
        v-model="phone"
        label="شماره موبایل"
        type="tel"
        placeholder="09xxxxxxxxx"
        icon="phone"
        autocomplete="username"
      />
      <AdminInput
        v-model="password"
        label="رمز عبور"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
      />

      <p v-if="errorMessage" class="login-card__error">{{ errorMessage }}</p>

      <AdminButton type="submit" variant="primary" :loading="loading" class="login-card__submit">
        ورود
      </AdminButton>
    </form>
  </AdminCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import { useAuthStore } from '../../stores/auth.store'
import { useTheme } from '../../composables/useTheme'

const auth = useAuthStore()
const router = useRouter()
const { mode } = useTheme()
const logoSrc = computed(() => (mode.value === 'light' ? '/images/logo-dark.png' : '/images/logo-white.png'))

const phone = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await auth.login(phone.value, password.value)
    router.push('/')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'ورود ناموفق بود. اطلاعات را بررسی کنید.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  padding: 8px;
}
.login-card__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.login-card__logo {
  height: 30px;
  width: auto;
}
.login-card__tag {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.login-card__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-card__error {
  font-size: 12.5px;
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
  border-radius: 10px;
  padding: 10px 12px;
}

.login-card__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
