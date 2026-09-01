<template>
  <footer class="site-footer relative overflow-hidden">

    <!-- Subtle top glow -->
    <div class="footer-top-glow absolute top-0 left-0 right-0 h-px" />
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 footer-radial-glow pointer-events-none" />

    <!-- ═══ Main grid ═══ -->
    <div class="container-main pt-14 pb-10 relative z-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-10">

        <!-- Col 1 — Brand (4 cols) -->
        <div class="sm:col-span-2 md:col-span-4 flex flex-col gap-6">
          <div>
            <div v-if="store.logoUrl" class="mb-3">
              <img :src="store.logoUrl" :alt="store.siteName" class="h-10 object-contain" />
            </div>
            <div v-else class="flex items-center gap-2 mb-3">
              <span class="brand-dot w-2.5 h-2.5 rounded-full flex-shrink-0" />
              <span class="text-white font-extrabold text-2xl tracking-tight">{{ store.siteName }}</span>
            </div>

            <p class="footer-muted text-sm leading-relaxed max-w-xs">
              {{ store.footerTagline || store.tagline || 'فروشگاه نیک' }}
            </p>
          </div>

          <!-- Social icons -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <a v-if="store.social.whatsapp" :href="store.social.whatsapp"
               target="_blank" rel="noopener" aria-label="واتساپ" class="social-icon" data-testid="social-whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a v-if="store.social.telegram" :href="store.social.telegram"
               target="_blank" rel="noopener" aria-label="تلگرام" class="social-icon" data-testid="social-telegram">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.012 9.46c-.143.649-.52.808-1.056.502l-2.885-2.13-1.395 1.34c-.154.154-.283.283-.579.283l.206-2.93 5.33-4.817c.232-.206-.05-.32-.36-.114l-6.59 4.148-2.838-.886c-.617-.194-.63-.617.128-.913l11.085-4.276c.514-.194.964.117.966.333z"/>
              </svg>
            </a>
            <a v-if="store.social.instagram" :href="store.social.instagram"
               target="_blank" rel="noopener" aria-label="اینستاگرام" class="social-icon" data-testid="social-instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a v-if="store.social.twitter" :href="store.social.twitter"
               target="_blank" rel="noopener" aria-label="توییتر" class="social-icon" data-testid="social-twitter">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a v-if="store.social.linkedin" :href="store.social.linkedin"
               target="_blank" rel="noopener" aria-label="لینکدین" class="social-icon" data-testid="social-linkedin">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a v-if="store.social.youtube" :href="store.social.youtube"
               target="_blank" rel="noopener" aria-label="یوتیوب" class="social-icon" data-testid="social-youtube">
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Col 2 — Categories (2 cols) -->
        <div class="md:col-span-2">
          <h4 class="footer-heading" data-testid="heading-categories">دسته‌بندی‌ها</h4>
          <ul class="space-y-3 mt-4">
            <li v-for="cat in footerCategories" :key="cat.slug">
              <NuxtLink
                :to="`/category/${cat.slug}`"
                class="footer-link"
              >
                <svg class="footer-link-arrow w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
                </svg>
                {{ cat.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Col 3 — Quick links (3 cols) -->
        <div class="md:col-span-3">
          <template v-if="store.footerLinks.length">
            <h4 class="footer-heading">لینک‌های سریع</h4>
            <ul class="space-y-3 mt-4">
              <li v-for="link in store.footerLinks" :key="link.url">
                <a :href="link.url" class="footer-link">
                  <svg class="footer-link-arrow w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </template>
          <template v-else>
            <h4 class="footer-heading">دسترسی سریع</h4>
            <ul class="space-y-3 mt-4">
              <li v-for="link in quickLinks" :key="link.name">
                <NuxtLink :to="link.to" class="footer-link">
                  <svg class="footer-link-arrow w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </template>
        </div>

        <!-- Col 4 — Contact (3 cols) -->
        <div class="md:col-span-3">
          <h4 class="footer-heading">تماس با ما</h4>
          <ul class="space-y-2 mt-4">

            <!-- Email -->
            <li data-testid="contact-email">
              <a :href="`mailto:${store.email || 'support@nikstore.ir'}`" class="contact-item contact-item--link">
                <span class="contact-icon">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </span>
                <span dir="ltr" class="footer-muted text-sm transition-colors">{{ store.email || 'support@nikstore.ir' }}</span>
              </a>
            </li>

            <!-- Landline -->
            <li data-testid="contact-phone">
              <a :href="`tel:${(store.phone || '').replace(/\D/g, '')}`" class="contact-item contact-item--link">
                <span class="contact-icon">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </span>
                <span dir="ltr" class="footer-muted text-sm transition-colors">{{ store.phone || '۰۸۷-۳۳۱۷۷۱۸۹' }}</span>
              </a>
            </li>

            <!-- Mobiles -->
            <template v-if="store.mobiles.length">
              <li v-for="(mobile, idx) in store.mobiles" :key="`m-${idx}`"
                  :data-testid="`contact-mobile-${idx}`">
                <a :href="`tel:${mobile.replace(/\D/g, '')}`" class="contact-item contact-item--link">
                  <span class="contact-icon">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <span dir="ltr" class="footer-muted text-sm transition-colors">{{ mobile }}</span>
                </a>
              </li>
            </template>

            <!-- Addresses -->
            <template v-if="store.addresses.length">
              <li v-for="(addr, idx) in store.addresses" :key="`a-${idx}`"
                  class="items-start" :data-testid="`contact-address-${idx}`">
                <a :href="addr.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(addr.text)}`"
                   target="_blank" rel="noopener"
                   class="contact-item items-start contact-item--link">
                  <span class="contact-icon mt-0.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </span>
                  <span class="footer-muted text-sm leading-relaxed transition-colors">{{ addr.text }}</span>
                </a>
              </li>
            </template>

          </ul>
        </div>

      </div>
    </div>

    <!-- ═══ Trust badges ═══ -->
    <div class="trust-strip relative z-10">
      <div class="container-main py-5">
        <div class="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          <div v-for="badge in trustBadges" :key="badge.label" class="trust-badge" :data-testid="`badge-${badge.key}`">
            <span class="trust-badge-icon">
              <component :is="'svg'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4" v-html="badge.svgPath" />
            </span>
            <span class="text-sm font-medium footer-muted">{{ badge.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Copyright ═══ -->
    <div class="copyright-bar relative z-10">
      <div class="container-main py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs footer-muted opacity-70" data-testid="copyright">
          {{ store.footerCopyright }} &copy; {{ currentYear }}
        </p>
        <p class="text-xs footer-muted opacity-50">
          طراحی و توسعه SVM
        </p>
      </div>
    </div>

  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '~/stores/settings.store'
import { categoryService } from '~/services/category.service'
import { logger } from '~/utils/logger'

const store = useSettingsStore()
const currentYear = computed(() => new Date().getFullYear())

const footerCategories = ref([])
categoryService.getRoots().then(({ data }) => { if (Array.isArray(data)) footerCategories.value = data }).catch(() => {})

const quickLinks = [
  { label: 'درباره ما',         to: '/pages/about' },
  { label: 'تماس با ما',        to: '/pages/contact' },
  { label: 'قوانین و مقررات',   to: '/pages/terms' },
  { label: 'سیاست حریم خصوصی', to: '/pages/privacy' },
]

const trustBadges = [
  {
    key: 'secure-pay',
    label: 'پرداخت امن',
    svgPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>',
  },
  {
    key: 'return',
    label: 'ضمانت بازگشت ۷ روزه',
    svgPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
  },
  {
    key: 'authentic',
    label: 'اصالت کالا',
    svgPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
  },
  {
    key: 'fast-ship',
    label: 'ارسال سریع',
    svgPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/><path stroke-linecap="round" d="M13 16h-1v-4h-1m1-4h.01"/>',
  },
]

// Log if settings store fails to load (no settings configured)
if (!store.siteName) {
  logger.warn('AppFooter: settings not loaded — using defaults', {}, 'AppFooter')
}
</script>

<style scoped>
.site-footer {
  background-color: var(--brand-dark);
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-dark) 22%, black) 0%, color-mix(in srgb, var(--brand-dark) 34%, black) 100%);
  color: var(--text-primary);
}
[data-theme='light'] .site-footer {
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-dark) 92%, black) 0%, color-mix(in srgb, var(--brand-dark) 100%, black) 100%);
}

/* ── Top glow line ─────────────────────────────── */
.footer-top-glow {
  background: linear-gradient(90deg,
    transparent 0%,
    rgb(var(--brand-rgb) / .6) 30%,
    rgb(var(--brand-rgb) / .35) 70%,
    transparent 100%
  );
}

.footer-radial-glow {
  background: radial-gradient(ellipse at top, rgb(var(--brand-rgb) / .12) 0%, transparent 70%);
}

/* ── Brand dot ─────────────────────────────────── */
.brand-dot {
  background: linear-gradient(135deg, var(--brand-light), var(--brand-dark));
  box-shadow: 0 0 8px rgb(var(--brand-rgb) / .5);
}

/* ── Muted text ────────────────────────────────── */
.footer-muted {
  color: var(--text-secondary);
}

/* ── Section headings ──────────────────────────── */
.footer-heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.footer-heading::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  border-radius: 9999px;
  background: linear-gradient(180deg, var(--brand-light), var(--brand-dark));
  flex-shrink: 0;
}

/* ── Links ─────────────────────────────────────── */
.footer-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: color 0.18s ease, gap 0.18s ease;
  text-decoration: none;
}
.footer-link:hover {
  color: var(--text-primary);
  gap: 0.6rem;
}
.footer-link-arrow {
  opacity: 0;
  transition: opacity 0.18s ease;
  color: var(--brand-light);
  flex-shrink: 0;
}
.footer-link:hover .footer-link-arrow {
  opacity: 1;
}

/* ── Social icons ──────────────────────────────── */
.social-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  transition: all 0.2s ease;
  text-decoration: none;
}
.social-icon:hover {
  color: var(--text-primary);
  background: rgb(var(--brand-rgb) / .35);
  border-color: rgb(var(--brand-rgb) / .55);
  box-shadow: 0 0 14px rgb(var(--brand-rgb) / .3);
  transform: translateY(-2px);
}

/* ── Contact ───────────────────────────────────── */
.contact-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.contact-item--link {
  text-decoration: none;
  border-radius: 0.625rem;
  padding: 0.25rem 0.375rem 0.25rem 0.25rem;
  margin: -0.25rem -0.375rem -0.25rem -0.25rem;
  transition: background 0.18s;
}
.contact-item--link:hover .contact-icon {
  background: rgb(var(--brand-rgb) / .35);
  border-color: rgb(var(--brand-rgb) / .55);
  color: var(--text-primary);
}
.contact-item--link:hover span.footer-muted {
  color: var(--text-primary);
}
.contact-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgb(var(--brand-rgb) / .18);
  color: var(--brand-light);
  border: 1px solid rgb(var(--brand-rgb) / .3);
}

/* ── Trust strip ───────────────────────────────── */
.trust-strip {
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass);
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  border: 1px solid var(--glass-border);
  background: var(--glass);
  transition: border-color 0.2s, background 0.2s;
}
.trust-badge:hover {
  border-color: rgb(var(--brand-rgb) / .4);
  background: rgb(var(--brand-rgb) / .14);
}

.trust-badge-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgb(var(--brand-rgb) / .22);
  color: var(--brand-light);
}

/* ── Copyright ─────────────────────────────────── */
.copyright-bar {
  border-top: 1px solid var(--glass-border);
}
</style>
