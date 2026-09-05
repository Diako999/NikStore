<template>
  <div class="account">
    <header class="account__hero">
      <div class="account__avatar">
        <AppIcon name="person" :size="26" :stroke-width="1.8" />
      </div>
      <div class="account__who">
        <p class="account__greeting">سلام{{ firstName ? '، ' + firstName : '' }} 👋</p>
        <bdi class="account__phone">{{ displayPhone }}</bdi>
      </div>
    </header>

    <section class="section">
      <div class="links">
        <NuxtLink to="/user/profile" class="link-card">
          <span class="link-card__ico">
            <AppIcon name="person" :size="18" :stroke-width="1.8" />
          </span>
          <span class="link-card__body">
            <span class="link-card__title">پروفایل من</span>
            <span class="link-card__sub">اطلاعات شخصی و آدرس‌ها</span>
          </span>
          <AppIcon name="chevron-left" :size="16" :stroke-width="2" class="link-card__chev" />
        </NuxtLink>

        <NuxtLink to="/user/orders" class="link-card">
          <span class="link-card__ico">
            <AppIcon name="receipt" :size="18" :stroke-width="1.8" />
          </span>
          <span class="link-card__body">
            <span class="link-card__title">سفارش‌های من</span>
            <span class="link-card__sub">پیگیری و تاریخچه خرید</span>
          </span>
          <AppIcon name="chevron-left" :size="16" :stroke-width="2" class="link-card__chev" />
        </NuxtLink>

        <NuxtLink to="/user/favorites" class="link-card">
          <span class="link-card__ico">
            <AppIcon name="heart" :size="18" :stroke-width="1.8" />
          </span>
          <span class="link-card__body">
            <span class="link-card__title">علاقه‌مندی‌ها</span>
            <span class="link-card__sub">محصولات نشان‌شده</span>
          </span>
          <AppIcon name="chevron-left" :size="16" :stroke-width="2" class="link-card__chev" />
        </NuxtLink>
      </div>
    </section>

    <section class="section">
      <button type="button" class="logout" :disabled="loggingOut" @click="onLogout">
        <AppIcon name="logout" :size="17" :stroke-width="1.8" />
        {{ loggingOut ? 'در حال خروج...' : 'خروج از حساب کاربری' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import { useAuthStore } from '~/stores/auth.store'
import { toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'حساب من | نیک' })

const authStore = useAuthStore()
const router = useRouter()

const firstName = computed(() => authStore.user?.firstName || '')
const displayPhone = computed(() => toPersianDigits(authStore.user?.phone || ''))

const loggingOut = ref(false)
async function onLogout() {
  loggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    loggingOut.value = false
    router.push('/')
  }
}
</script>

<style scoped>
.account { padding: 24px 18px 8px; }

.account__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.account__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .account__avatar {
  color: var(--brand-dark);
  box-shadow: var(--glass-shadow);
}
.account__greeting { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.account__phone { font-size: 12.5px; color: var(--text-secondary); unicode-bidi: plaintext; }

.section { margin-bottom: 22px; }

.links { display: flex; flex-direction: column; gap: 10px; }
.link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .link-card {
  border-width: 1.5px;
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
}
.link-card__ico {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: linear-gradient(135deg, rgba(110, 176, 130, .30), rgba(231, 175, 66, .16));
  border: 1px solid rgba(255, 255, 255, .18);
}
[data-theme='light'] .link-card__ico {
  color: var(--brand-dark);
  background: linear-gradient(135deg, rgba(61, 139, 82, .20), rgba(231, 175, 66, .14));
  border-color: rgba(255, 255, 255, .6);
}
.link-card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.link-card__title { font-size: 13.5px; font-weight: 700; color: var(--text-primary); }
.link-card__sub { font-size: 11px; color: var(--text-secondary); }
.link-card__chev { color: var(--text-disabled); flex-shrink: 0; }

.logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  font-size: 13.5px;
  font-weight: 700;
  font-family: inherit;
  color: #E8837F;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  cursor: pointer;
}
.logout:disabled { opacity: .6; cursor: not-allowed; }
</style>
