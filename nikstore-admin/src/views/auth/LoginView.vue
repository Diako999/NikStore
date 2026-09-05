<template>
  <AdminCard class="login-card">
    <div class="login-card__brand">
      <span class="login-card__ring">NK</span>
      <div>
        <p class="login-card__name">نیک</p>
        <p class="login-card__tag">پنل مدیریت</p>
      </div>
    </div>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import { useAuthStore } from '../../stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

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
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.login-card__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #E7C878, #FBEFC8, #E7C878);
  color: #16241C;
  font-weight: 800;
  font-size: 14px;
}
.login-card__name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
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
