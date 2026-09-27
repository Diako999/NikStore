<template>
  <footer class="footer">
    <div class="footer__brand">
      <img :src="logoSrc" :alt="settings.siteName" class="footer__logo" />
      <p v-if="settings.footerTagline || settings.tagline" class="footer__tagline">
        {{ settings.footerTagline || settings.tagline }}
      </p>
    </div>

    <nav v-if="footerLinks.length" class="footer__links">
      <NuxtLink v-for="link in footerLinks" :key="link.url" :to="link.url">
        {{ link.label }}
      </NuxtLink>
    </nav>

    <div v-if="socialLinks.length" class="footer__social">
      <a v-for="s in socialLinks" :key="s.key" :href="s.url" target="_blank" rel="noopener noreferrer">
        {{ s.label }}
      </a>
    </div>

    <p class="footer__copyright">
      {{ settings.footerCopyright || `تمامی حقوق برای ${settings.siteName} محفوظ است` }}
    </p>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const { settings } = useSiteSettings()
const { mode } = useTheme()
const logoSrc = computed(() => (mode.value === 'light' ? '/images/logo-dark.png' : '/images/logo-white.png'))

const footerLinks = computed(() => settings.value.footerLinks?.filter((l) => l.label && l.url) ?? [])

const SOCIAL_LABELS = {
  instagram: 'اینستاگرام',
  telegram: 'تلگرام',
  twitter: 'ایکس',
  whatsapp: 'واتس‌اپ',
  linkedin: 'لینکدین',
  youtube: 'یوتیوب',
}
const socialLinks = computed(() => {
  const social = settings.value.social ?? {}
  return Object.entries(SOCIAL_LABELS)
    .filter(([key]) => social[key])
    .map(([key, label]) => ({ key, label, url: social[key] }))
})
</script>

<style scoped>
.footer {
  padding: 36px 18px calc(106px + 16px);
  margin-bottom: -106px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  border-radius: 0;
  background: var(--glass);
  border-top: 1px solid var(--glass-border);
}

.footer__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.footer__logo {
  height: 24px;
  width: auto;
}
.footer__tagline {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}
.footer__links a {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.footer__links a:hover {
  color: var(--brand-light);
}

.footer__social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.footer__social a {
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  color: var(--text-primary);
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
}

.footer__copyright {
  font-size: 10.5px;
  color: var(--text-disabled, var(--text-secondary));
}
</style>
