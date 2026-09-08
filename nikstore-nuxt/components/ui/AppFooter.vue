<template>
  <footer class="footer">
    <div class="footer__brand">
      <div class="footer__ring">NK</div>
      <div>
        <p class="footer__name">{{ settings.siteName }}</p>
        <p v-if="settings.footerTagline || settings.tagline" class="footer__tagline">
          {{ settings.footerTagline || settings.tagline }}
        </p>
      </div>
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
  padding: 24px 18px;
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
  align-items: center;
  gap: 10px;
}
.footer__ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: #16241C;
  flex-shrink: 0;
  background: conic-gradient(from 200deg, #E7C878, #FBEFC8, #E7C878);
}
.footer__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
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
