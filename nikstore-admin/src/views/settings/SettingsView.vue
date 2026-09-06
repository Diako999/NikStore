<template>
  <div class="settings-view">
    <div class="settings-view__head">
      <div>
        <h1 class="settings-view__title">تنظیمات فروشگاه</h1>
        <p class="settings-view__subtitle">
          {{ auth.isSuperAdmin ? 'ویرایش اطلاعات عمومی، محتوایی و ظاهری فروشگاه' : 'مشاهده تنظیمات فروشگاه (فقط مدیر کل امکان ویرایش دارد)' }}
        </p>
      </div>
      <AdminButton v-if="auth.isSuperAdmin" :loading="saving" icon="check" @click="save">
        ذخیره تغییرات
      </AdminButton>
    </div>

    <div v-if="loading" class="settings-view__loading">در حال بارگذاری...</div>

    <template v-else-if="form">
      <div v-if="saveError" class="settings-view__banner settings-view__banner--error">{{ saveError }}</div>
      <div v-if="saved" class="settings-view__banner settings-view__banner--success">تغییرات ذخیره شد</div>

      <div class="settings-view__grid">
        <AdminCard title="اطلاعات عمومی">
          <div class="settings-view__fields">
            <AdminInput v-model="form.siteName" label="نام فروشگاه" :disabled="readOnly" />
            <AdminInput v-model="form.tagline" label="شعار" :disabled="readOnly" />
            <AdminInput v-model="form.logoUrl" label="آدرس لوگو" :disabled="readOnly" />
            <AdminInput v-model="form.faviconUrl" label="آدرس فاویکون" :disabled="readOnly" />
          </div>
        </AdminCard>

        <AdminCard title="سئو">
          <div class="settings-view__fields">
            <AdminTextarea v-model="form.description" label="توضیحات متا" :rows="3" :disabled="readOnly" />
            <AdminInput v-model="form.keywords" label="کلمات کلیدی" :disabled="readOnly" />
            <AdminInput v-model="form.ogImage" label="تصویر Open Graph" :disabled="readOnly" />
          </div>
        </AdminCard>

        <AdminCard title="شبکه‌های اجتماعی">
          <div class="settings-view__fields settings-view__fields--grid">
            <AdminInput v-model="form.social.instagram" label="اینستاگرام" :disabled="readOnly" />
            <AdminInput v-model="form.social.telegram" label="تلگرام" :disabled="readOnly" />
            <AdminInput v-model="form.social.twitter" label="ایکس (توییتر)" :disabled="readOnly" />
            <AdminInput v-model="form.social.whatsapp" label="واتس‌اپ" :disabled="readOnly" />
            <AdminInput v-model="form.social.linkedin" label="لینکدین" :disabled="readOnly" />
            <AdminInput v-model="form.social.youtube" label="یوتیوب" :disabled="readOnly" />
          </div>
        </AdminCard>

        <AdminCard title="اطلاعات تماس">
          <div class="settings-view__fields">
            <AdminInput v-model="form.phone" label="تلفن ثابت" :disabled="readOnly" />
            <AdminInput v-model="form.email" label="ایمیل" :disabled="readOnly" />
            <AdminInput v-model="form.address" label="آدرس" :disabled="readOnly" />

            <ListEditor
              label="شماره‌های موبایل"
              :items="form.mobiles"
              :disabled="readOnly"
              placeholder="۰۹1۲..."
              @add="form.mobiles.push('')"
              @remove="(i) => form.mobiles.splice(i, 1)"
            >
              <template #item="{ index }">
                <AdminInput v-model="form.mobiles[index]" :disabled="readOnly" />
              </template>
            </ListEditor>
          </div>
        </AdminCard>

        <AdminCard title="فوتر">
          <div class="settings-view__fields">
            <AdminInput v-model="form.footerTagline" label="شعار فوتر" :disabled="readOnly" />
            <AdminInput v-model="form.footerCopyright" label="متن کپی‌رایت" :disabled="readOnly" />

            <ListEditor
              label="لینک‌های فوتر"
              :items="form.footerLinks"
              :disabled="readOnly"
              @add="form.footerLinks.push({ label: '', url: '' })"
              @remove="(i) => form.footerLinks.splice(i, 1)"
            >
              <template #item="{ index }">
                <div class="settings-view__row">
                  <AdminInput v-model="form.footerLinks[index].label" placeholder="عنوان" :disabled="readOnly" />
                  <AdminInput v-model="form.footerLinks[index].url" placeholder="آدرس" :disabled="readOnly" />
                </div>
              </template>
            </ListEditor>
          </div>
        </AdminCard>

        <AdminCard title="ظاهر فروشگاه">
          <div class="settings-view__fields settings-view__fields--grid">
            <AdminInput v-model="form.theme.preset" label="پیش‌فرض تم" :disabled="readOnly" />
            <AdminInput v-model="form.theme.primaryColor" label="رنگ اصلی" :disabled="readOnly" />
            <AdminSelect
              v-model="form.theme.defaultMode"
              label="حالت پیش‌فرض"
              :options="themeModeOptions"
              :disabled="readOnly"
            />
          </div>
        </AdminCard>

        <AdminCard title="درگاه پرداخت">
          <div class="settings-view__fields settings-view__fields--grid">
            <AdminSelect
              v-model="form.payment.gateway"
              label="درگاه فعال"
              :options="gatewayOptions"
              :disabled="readOnly"
            />
            <AdminInput v-model="form.payment.zarinpalMerchantId" label="کد پذیرنده زرین‌پال" :disabled="readOnly" />
            <ToggleField
              v-model="form.payment.zarinpalSandbox"
              label="حالت آزمایشی (Sandbox)"
              :disabled="readOnly"
            />
          </div>
        </AdminCard>

        <AdminCard title="پیامک">
          <div class="settings-view__fields settings-view__fields--grid">
            <AdminSelect
              v-model="form.sms.provider"
              label="ارائه‌دهنده"
              :options="smsProviderOptions"
              :disabled="readOnly"
            />
            <AdminInput v-model="form.sms.kavenegarApiKey" label="کلید API کاوه‌نگار" :disabled="readOnly" />
            <AdminInput v-model="form.sms.kavenegarSender" label="شماره فرستنده" :disabled="readOnly" />
            <AdminInput v-model="form.sms.kavenegarOtpTemplate" label="نام قالب OTP" :disabled="readOnly" />
          </div>
        </AdminCard>

        <AdminCard title="نوار اعلان">
          <div class="settings-view__fields">
            <ToggleField v-model="form.announcementBar.isActive" label="نمایش نوار اعلان" :disabled="readOnly" />
            <AdminInput v-model="form.announcementBar.text" label="متن اعلان" :disabled="readOnly" />
            <div class="settings-view__row">
              <AdminInput v-model="form.announcementBar.bgColor" label="رنگ پس‌زمینه" :disabled="readOnly" />
              <AdminInput v-model="form.announcementBar.textColor" label="رنگ متن" :disabled="readOnly" />
            </div>
            <AdminInput v-model="form.announcementBar.link" label="لینک" :disabled="readOnly" />
          </div>
        </AdminCard>

        <AdminCard title="نشان‌های اعتماد" class="settings-view__span-2">
          <ListEditor
            :items="form.trustItems"
            :disabled="readOnly"
            @add="form.trustItems.push({ icon: '', title: '', subtitle: '', bgColor: '' })"
            @remove="(i) => form.trustItems.splice(i, 1)"
          >
            <template #item="{ index }">
              <div class="settings-view__trust-row">
                <AdminInput v-model="form.trustItems[index].icon" placeholder="ایموجی" :disabled="readOnly" />
                <AdminInput v-model="form.trustItems[index].title" placeholder="عنوان" :disabled="readOnly" />
                <AdminInput v-model="form.trustItems[index].subtitle" placeholder="توضیح" :disabled="readOnly" />
                <AdminInput v-model="form.trustItems[index].bgColor" placeholder="رنگ" :disabled="readOnly" />
              </div>
            </template>
          </ListEditor>
        </AdminCard>
      </div>

      <AdminCard v-if="auth.isSuperAdmin" title="سیستم">
        <div class="settings-view__system">
          <div class="settings-view__system-info">
            <p v-if="health">
              وضعیت سرویس:
              <AdminBadge :variant="health.status === 'ok' ? 'success' : 'danger'">
                {{ health.status === 'ok' ? 'سالم' : 'با اختلال' }}
              </AdminBadge>
              — پایگاه داده: {{ health.db === 'ok' ? 'متصل' : 'قطع' }}، ردیس: {{ health.redis === 'ok' ? 'متصل' : 'قطع' }}
            </p>
            <p v-if="cacheInfo" class="settings-view__cache-info">
              تعداد کلیدهای کش مدیریت: {{ formatNumber(cacheInfo.adminKeys) }}
            </p>
          </div>
          <div class="settings-view__system-actions">
            <AdminButton variant="secondary" size="sm" icon="refresh" @click="loadSystemInfo">
              بروزرسانی وضعیت
            </AdminButton>
            <AdminButton variant="secondary" size="sm" :loading="clearingCache" @click="clearCache">
              پاک‌سازی کش
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </template>
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import { settingsService } from '../../services/settings.service'
import { adminService } from '../../services/admin.service'
import { useAuthStore } from '../../stores/auth.store'

// Small in-file helper for "add/remove row" list fields (mobiles, footer
// links, trust items) so the template above doesn't repeat the same
// add/remove button markup for every list.
const ListEditor = {
  props: {
    items: { type: Array, required: true },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
  },
  emits: ['add', 'remove'],
  setup(props, { slots, emit }) {
    return () =>
      h('div', { class: 'list-editor' }, [
        props.label ? h('span', { class: 'list-editor__label' }, props.label) : null,
        ...props.items.map((item, index) =>
          h('div', { class: 'list-editor__row', key: index }, [
            slots.item ? slots.item({ index }) : null,
            !props.disabled
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'list-editor__remove',
                    onClick: () => emit('remove', index),
                  },
                  '×',
                )
              : null,
          ]),
        ),
        !props.disabled
          ? h('button', { type: 'button', class: 'list-editor__add', onClick: () => emit('add') }, '+ افزودن')
          : null,
      ])
  },
}

// Minimal switch control — the shared component set has no toggle yet, and
// building a full AdminToggle for two boolean fields felt out of scope here.
const ToggleField = {
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('label', { class: 'toggle-field' }, [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          disabled: props.disabled,
          onChange: (e) => emit('update:modelValue', e.target.checked),
        }),
        h('span', { class: 'toggle-field__track' }),
        props.label ? h('span', { class: 'toggle-field__label' }, props.label) : null,
      ])
  },
}

const auth = useAuthStore()
const readOnly = computed(() => !auth.isSuperAdmin)

const form = ref(null)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const saveError = ref('')

const themeModeOptions = [
  { label: 'روشن', value: 'light' },
  { label: 'تاریک', value: 'dark' },
  { label: 'سیستم', value: 'system' },
]
const gatewayOptions = [
  { label: 'آزمایشی (mock)', value: 'mock' },
  { label: 'زرین‌پال', value: 'zarinpal' },
]
const smsProviderOptions = [
  { label: 'آزمایشی (mock)', value: 'mock' },
  { label: 'کاوه‌نگار', value: 'kavenegar' },
]

async function loadSettings() {
  loading.value = true
  try {
    const { data } = await settingsService.getSettings()
    form.value = normalize(data)
  } finally {
    loading.value = false
  }
}

function normalize(data) {
  return {
    siteName: data.siteName ?? '',
    tagline: data.tagline ?? '',
    logoUrl: data.logoUrl ?? '',
    faviconUrl: data.faviconUrl ?? '',
    description: data.description ?? '',
    keywords: data.keywords ?? '',
    ogImage: data.ogImage ?? '',
    social: { instagram: '', telegram: '', twitter: '', whatsapp: '', linkedin: '', youtube: '', ...data.social },
    footerTagline: data.footerTagline ?? '',
    footerCopyright: data.footerCopyright ?? '',
    footerLinks: (data.footerLinks ?? []).map((l) => ({ ...l })),
    phone: data.phone ?? '',
    mobiles: [...(data.mobiles ?? [])],
    email: data.email ?? '',
    address: data.address ?? '',
    addresses: (data.addresses ?? []).map((a) => ({ ...a })),
    theme: {
      preset: 'forest-green',
      primaryColor: '#1A3620',
      defaultMode: 'light',
      navbarBg: '', navbarBorder: '', footerBg: '', footerText: '', sidebarBg: '', pageBg: '',
      navbarBgDark: '', navbarBorderDark: '', footerBgDark: '', footerTextDark: '', sidebarBgDark: '', pageBgDark: '',
      ...data.theme,
    },
    payment: { gateway: 'mock', zarinpalMerchantId: '', zarinpalSandbox: true, ...data.payment },
    sms: { provider: 'mock', kavenegarApiKey: '', kavenegarSender: '', kavenegarOtpTemplate: '', ...data.sms },
    trustItems: (data.trustItems ?? []).map((t) => ({ ...t })),
    announcementBar: { isActive: false, text: '', bgColor: '#1A3620', textColor: '#FFFFFF', link: '', ...data.announcementBar },
  }
}

async function save() {
  if (!form.value) return
  saving.value = true
  saveError.value = ''
  saved.value = false
  try {
    const { data } = await settingsService.updateSettings(form.value)
    form.value = normalize(data)
    saved.value = true
    setTimeout(() => (saved.value = false), 3000)
  } catch (error) {
    saveError.value = error.response?.data?.message || 'ذخیره تنظیمات با خطا مواجه شد'
  } finally {
    saving.value = false
  }
}

// ── System card ────────────────────────────────────────────────
const health = ref(null)
const cacheInfo = ref(null)
const clearingCache = ref(false)

async function loadSystemInfo() {
  try {
    const [{ data: healthData }, { data: cacheData }] = await Promise.all([
      adminService.getHealth(),
      adminService.getCacheInfo(),
    ])
    health.value = healthData
    cacheInfo.value = cacheData
  } catch {
    // system card is a convenience panel — silently skip on failure
  }
}

async function clearCache() {
  clearingCache.value = true
  try {
    await adminService.clearCache()
    await loadSystemInfo()
  } finally {
    clearingCache.value = false
  }
}

function formatNumber(value) {
  if (value === undefined || value === null) return '۰'
  return Number(value).toLocaleString('fa-IR')
}

onMounted(() => {
  loadSettings()
  if (auth.isSuperAdmin) loadSystemInfo()
})
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-view__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.settings-view__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.settings-view__subtitle {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.settings-view__loading {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.settings-view__banner {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
}
.settings-view__banner--error {
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
}
.settings-view__banner--success {
  color: var(--brand-dark);
  background: rgba(110, 176, 130, .18);
  border: 1px solid rgba(110, 176, 130, .4);
}

.settings-view__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
}
@media (max-width: 1100px) {
  .settings-view__grid {
    grid-template-columns: 1fr;
  }
}
.settings-view__span-2 {
  grid-column: span 2;
}
@media (max-width: 1100px) {
  .settings-view__span-2 {
    grid-column: span 1;
  }
}

.settings-view__fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.settings-view__fields--grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 560px) {
  .settings-view__fields--grid {
    grid-template-columns: 1fr;
  }
}

.settings-view__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 560px) {
  .settings-view__row {
    grid-template-columns: 1fr;
  }
}

.settings-view__trust-row {
  display: grid;
  grid-template-columns: 70px 1fr 1.4fr 90px;
  gap: 10px;
}
@media (max-width: 560px) {
  .settings-view__trust-row {
    grid-template-columns: 1fr;
  }
}

.settings-view__system {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.settings-view__system-info {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.settings-view__system-actions {
  display: flex;
  gap: 8px;
}

:deep(.list-editor) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
:deep(.list-editor__label) {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
:deep(.list-editor__row) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:deep(.list-editor__row > *:first-child) {
  flex: 1;
}
:deep(.list-editor__remove) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
:deep(.list-editor__remove:hover) {
  color: #D9534F;
}
:deep(.list-editor__add) {
  align-self: flex-start;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand-light);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

:deep(.toggle-field) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
:deep(.toggle-field input) {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
:deep(.toggle-field__track) {
  position: relative;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  transition: background .15s ease;
}
:deep(.toggle-field__track::after) {
  content: '';
  position: absolute;
  top: 2px;
  inset-inline-start: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: inset-inline-start .15s ease, background .15s ease;
}
:deep(.toggle-field input:checked + .toggle-field__track) {
  background: var(--brand);
  border-color: var(--brand);
}
:deep(.toggle-field input:checked + .toggle-field__track::after) {
  inset-inline-start: 18px;
  background: #fff;
}
:deep(.toggle-field input:disabled + .toggle-field__track) {
  opacity: .55;
  cursor: not-allowed;
}
:deep(.toggle-field__label) {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}
</style>
