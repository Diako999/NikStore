<template>
  <div class="max-w-3xl mx-auto space-y-5">

    <!-- Header -->
    <div>
      <h1 class="page-title">تم سایت</h1>
      <p class="text-text-secondary text-sm mt-0.5">رنگ اصلی و رنگ‌بندی بخش‌های مختلف سایت</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <AdminSkeleton height="200px" class="rounded-xl" />
      <AdminSkeleton height="300px" class="rounded-xl" />
    </div>

    <template v-else>

      <!-- ── رنگ اصلی ── -->
      <div class="admin-card space-y-6">
        <div>
          <h3 class="section-title">رنگ اصلی سایت</h3>
          <p class="text-text-secondary text-sm mt-1">
            این رنگ روی دکمه‌ها، لینک‌ها، بج‌ها و المان‌های تعاملی سایت اصلی اعمال می‌شود.
          </p>
        </div>

        <!-- Preset grid -->
        <div class="grid grid-cols-5 sm:grid-cols-6 gap-3">
          <button
            v-for="preset in colorPresets"
            :key="preset.key"
            type="button"
            @click="selectPreset(preset)"
            :class="[
              'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
              theme.preset === preset.key
                ? 'border-primary scale-105 shadow-md'
                : 'border-border hover:border-primary/40',
            ]"
          >
            <div
              class="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center overflow-hidden"
              :style="preset.color ? `background:${preset.color}` : 'background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red)'"
            >
              <svg v-if="theme.preset === preset.key"
                   class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <span class="text-[11px] text-text-secondary font-medium">{{ preset.label }}</span>
          </button>
        </div>

        <!-- Custom color picker -->
        <Transition name="slide-down">
          <div v-if="theme.preset === 'custom'" class="space-y-3 pt-1">
            <label class="field-label">رنگ سفارشی (Hex)</label>
            <div class="flex items-center gap-3">
              <input type="color" v-model="theme.primaryColor"
                class="w-12 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5" />
              <AdminInput v-model="theme.primaryColor" dir="ltr" placeholder="#1A3620" class="flex-1"
                hint="فرمت hex — مثال: #1A3620" />
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── پیش‌نمایش ── -->
      <div class="admin-card space-y-4">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider">پیش‌نمایش رنگ اصلی</p>
        <div class="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div class="flex flex-wrap gap-3 items-center">
            <button class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
                    :style="`background:${activeColor}`">افزودن به سبد خرید</button>
            <button class="px-5 py-2.5 rounded-xl text-sm font-semibold border-2"
                    :style="`border-color:${activeColor}; color:${activeColor}`">مشاهده محصول</button>
            <span class="px-3 py-1 rounded-full text-xs font-bold text-white"
                  :style="`background:${activeColor}`">تخفیف ۲۰٪</span>
          </div>
          <div class="flex items-center gap-4 bg-card rounded-xl p-4 border border-border max-w-sm">
            <div class="w-16 h-16 rounded-xl flex-shrink-0 opacity-20" :style="`background:${activeColor}`"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 rounded-full bg-text-disabled/30 w-3/4"></div>
              <div class="h-2.5 rounded-full bg-text-disabled/20 w-1/2"></div>
              <p class="text-sm font-bold" :style="`color:${activeColor}`">۱,۲۵۰,۰۰۰ تومان</p>
            </div>
          </div>
          <div class="flex gap-4 text-sm border-b border-border pb-3">
            <span class="font-semibold border-b-2 pb-1"
                  :style="`border-color:${activeColor}; color:${activeColor}`">همه محصولات</span>
            <span class="text-text-secondary">عینک آفتابی</span>
            <span class="text-text-secondary">عینک طبی</span>
          </div>
        </div>
      </div>

      <!-- ── رنگ‌بندی بخش‌ها ── -->
      <div class="admin-card space-y-6">
        <!-- Header -->
        <div>
          <h3 class="section-title">رنگ‌بندی بخش‌های مختلف سایت</h3>
          <p class="text-text-secondary text-sm mt-1">
            رنگ پس‌زمینه و متن بخش‌های مختلف سایت را تنظیم کنید.
          </p>
        </div>

        <!-- Navbar -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔝</span>
              <div>
                <p class="text-sm font-semibold text-text-primary">هدر / ناوبار</p>
                <p class="text-xs text-text-secondary">پس‌زمینه نوار بالای سایت اصلی</p>
              </div>
            </div>
            <button v-if="theme.navbarBg || theme.navbarBorder"
              @click="resetSection('navbarBg', 'navbarBorder')"
              class="text-xs text-text-secondary hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
            >↺ پیش‌فرض</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="field-label text-xs">رنگ پس‌زمینه</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="color" :value="theme.navbarBg || '#FFFFFF'"
                  @input="e => theme.navbarBg = e.target.value"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                <input v-model="theme.navbarBg" dir="ltr"
                  class="field-input flex-1 font-mono text-sm"
                  placeholder="#FFFFFF (خالی = پیش‌فرض)" />
              </div>
            </div>
            <div>
              <label class="field-label text-xs">رنگ خط جداکننده</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="color" :value="theme.navbarBorder || '#E5E7E0'"
                  @input="e => theme.navbarBorder = e.target.value"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                <input v-model="theme.navbarBorder" dir="ltr"
                  class="field-input flex-1 font-mono text-sm"
                  placeholder="#E5E7E0 (خالی = پیش‌فرض)" />
              </div>
            </div>
          </div>
          <!-- Preview -->
          <div class="rounded-xl overflow-hidden border border-border bg-white">
            <div class="h-10 flex items-center px-4 gap-3"
                 :style="{
                   backgroundColor: theme.navbarBg || '#FFFFFF',
                   borderBottom: `1px solid ${theme.navbarBorder || '#E5E7E0'}`
                 }">
              <span class="font-bold text-sm" :style="{ color: navbarTextColorCur }">نیک</span>
              <div class="flex-1 h-5 rounded" style="background-color:#E5E7EB"></div>
              <div class="w-5 h-5 rounded-full" :style="{ backgroundColor: activeColor }"></div>
            </div>
            <div class="h-6 flex items-center px-4 gap-2" style="background-color:#F8FAFC">
              <span v-for="i in 4" :key="i" class="h-1.5 w-12 rounded-full" style="background-color:#E2E8F0"></span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-border pt-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">📄</span>
              <div>
                <p class="text-sm font-semibold text-text-primary">فوتر</p>
                <p class="text-xs text-text-secondary">پس‌زمینه و رنگ متن بخش پایین سایت</p>
              </div>
            </div>
            <button v-if="theme.footerBg || theme.footerText"
              @click="resetSection('footerBg', 'footerText')"
              class="text-xs text-text-secondary hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
            >↺ پیش‌فرض</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="field-label text-xs">رنگ پس‌زمینه</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="color" :value="theme.footerBg || '#14291A'"
                  @input="e => theme.footerBg = e.target.value"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                <input v-model="theme.footerBg" dir="ltr"
                  class="field-input flex-1 font-mono text-sm" placeholder="#14291A (خالی = پیش‌فرض)" />
              </div>
            </div>
            <div>
              <label class="field-label text-xs">رنگ متن</label>
              <div class="flex items-center gap-2 mt-1">
                <input type="color" :value="theme.footerText || '#FFFFFF'"
                  @input="e => theme.footerText = e.target.value"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
                <input v-model="theme.footerText" dir="ltr"
                  class="field-input flex-1 font-mono text-sm" placeholder="#FFFFFF (خالی = پیش‌فرض)" />
              </div>
            </div>
          </div>
          <div class="rounded-xl overflow-hidden border border-border">
            <div class="h-16 px-4 py-3 flex items-start gap-4"
                 :style="{ backgroundColor: theme.footerBg || '#14291A' }">
              <div>
                <p class="font-bold text-sm" :style="{ color: theme.footerText || '#FFFFFF' }">نیک</p>
                <p class="text-xs mt-0.5" :style="{ color: theme.footerText || '#FFFFFF', opacity: 0.7 }">فروشگاه تخصصی عینک</p>
              </div>
              <div class="flex-1"></div>
              <div class="text-right">
                <p class="text-xs font-semibold" :style="{ color: theme.footerText || '#FFFFFF' }">دسته‌بندی‌ها</p>
                <p class="text-xs mt-1" :style="{ color: theme.footerText || '#FFFFFF', opacity: 0.7 }">عینک آفتابی</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Page Background -->
        <div class="border-t border-border pt-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎨</span>
              <div>
                <p class="text-sm font-semibold text-text-primary">پس‌زمینه کلی سایت</p>
                <p class="text-xs text-text-secondary">رنگ بک‌گراند اصلی تمام صفحات سایت</p>
              </div>
            </div>
            <button v-if="theme.pageBg" @click="resetSection('pageBg')"
              class="text-xs text-text-secondary hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
            >↺ پیش‌فرض</button>
          </div>
          <div class="flex items-center gap-2">
            <input type="color" :value="theme.pageBg || '#EEF1EA'"
              @input="e => theme.pageBg = e.target.value"
              class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
            <input v-model="theme.pageBg" dir="ltr"
              class="field-input flex-1 font-mono text-sm"
              placeholder="#EEF1EA (خالی = پیش‌فرض)" />
          </div>
          <!-- Preview -->
          <div class="rounded-xl border border-border overflow-hidden">
            <div class="p-4 flex items-center gap-3"
                 :style="{ backgroundColor: theme.pageBg || '#EEF1EA' }">
              <div class="flex-1 rounded-xl overflow-hidden shadow-sm" style="background:#FFFFFF; max-width:110px">
                <div class="h-14" style="background-color:#F3F4F6"></div>
                <div class="p-2 space-y-1">
                  <div class="h-1.5 rounded-full w-3/4" style="background-color:#E5E7EB"></div>
                  <div class="h-3 rounded w-1/2 text-white text-[8px] flex items-center justify-center font-bold"
                       :style="{ backgroundColor: activeColor }">خرید</div>
                </div>
              </div>
              <div class="flex-1 rounded-xl overflow-hidden shadow-sm" style="background:#FFFFFF; max-width:110px">
                <div class="h-14" style="background-color:#F3F4F6"></div>
                <div class="p-2 space-y-1">
                  <div class="h-1.5 rounded-full w-2/3" style="background-color:#E5E7EB"></div>
                  <div class="h-3 rounded w-1/2 text-white text-[8px] flex items-center justify-center font-bold"
                       :style="{ backgroundColor: activeColor }">خرید</div>
                </div>
              </div>
              <span class="text-[10px] font-medium flex-shrink-0"
                    :style="{ color: isLightBgCur ? '#374151' : '#e2e8f0' }">
                ← پس‌زمینه
              </span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="border-t border-border pt-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🗂</span>
              <div>
                <p class="text-sm font-semibold text-text-primary">سایدبار ادمین</p>
                <p class="text-xs text-text-secondary">رنگ منوی کناری پنل مدیریت</p>
              </div>
            </div>
            <button v-if="theme.sidebarBg" @click="resetSection('sidebarBg')"
              class="text-xs text-text-secondary hover:text-error px-2 py-1 rounded-lg hover:bg-error/10 transition-colors"
            >↺ پیش‌فرض</button>
          </div>
          <div class="flex items-center gap-2">
            <input type="color" :value="theme.sidebarBg || '#171717'"
              @input="e => theme.sidebarBg = e.target.value"
              class="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0" />
            <input v-model="theme.sidebarBg" dir="ltr"
              class="field-input flex-1 font-mono text-sm"
              placeholder="#171717 (خالی = پیش‌فرض)" />
          </div>
          <div class="flex rounded-xl overflow-hidden border border-border h-24">
            <div class="w-16 flex flex-col gap-1.5 p-2"
                 :style="{ backgroundColor: theme.sidebarBg || '#171717' }">
              <div v-for="i in 4" :key="i" class="h-1.5 rounded-full bg-white/20"></div>
              <div class="h-1.5 rounded-full mt-auto" :style="{ backgroundColor: activeColor, opacity: 0.8 }"></div>
            </div>
            <div class="flex-1 p-3 space-y-2" style="background-color:#F8FAFC">
              <div class="h-2.5 rounded-full w-3/4" style="background-color:#E2E8F0"></div>
              <div class="h-2 rounded-full w-1/2" style="background-color:#E2E8F0"></div>
              <div class="h-2 rounded-full w-2/3" style="background-color:#E2E8F0"></div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Sticky save bar -->
    <Transition name="slide-up">
      <div v-if="dirty"
           class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-5 py-3">
        <span class="text-sm text-text-secondary">تغییرات ذخیره نشده دارید</span>
        <AdminButton variant="ghost" @click="resetTheme">بازگردانی</AdminButton>
        <AdminButton :loading="saving" @click="saveTheme">ذخیره تغییرات</AdminButton>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { settingsService } from '@/services/settings.service'
import { useUiStore }      from '@/stores/ui.store'
import { useAdminTheme }   from '@/composables/useAdminTheme'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const ui = useUiStore()
const { applyTheme } = useAdminTheme()

const loading       = ref(true)
const saving        = ref(false)
const savedSnapshot = ref('')

const dirty = computed(() => JSON.stringify(theme) !== savedSnapshot.value)

function snapshot() {
  savedSnapshot.value = JSON.stringify(theme)
}

const theme = reactive({
  preset:           'forest-green',
  primaryColor:     '#1A3620',
  defaultMode:      'light',
  navbarBg:         '',
  navbarBorder:     '',
  footerBg:         '',
  footerText:       '',
  sidebarBg:        '',
  pageBg:           '',
})

// ── Helpers ───────────────────────────────────────────────────────

// Reset one or more fields to empty
function resetSection(...fields) {
  for (const f of fields) {
    theme[f] = ''
  }
}

// ── Computed for previews ─────────────────────────────────────────

function isLight(hex, defaultLight = true) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return defaultLight
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

const isLightBgCur = computed(() => {
  const hex = theme.pageBg
  return hex ? isLight(hex) : true
})

const navbarTextColorCur = computed(() => {
  const hex = theme.navbarBg
  if (!hex) return '#1f2937'
  return isLight(hex) ? '#1f2937' : '#f9fafb'
})

// ── Presets ───────────────────────────────────────────────────────

const colorPresets = [
  { key: 'forest-green', label: 'سبز جنگلی',  color: '#1A3620' },
  { key: 'indigo',  label: 'نیلی',      color: '#6366F1' },
  { key: 'violet',  label: 'بنفش',      color: '#8B5CF6' },
  { key: 'rose',    label: 'صورتی',     color: '#F43F5E' },
  { key: 'orange',  label: 'نارنجی',    color: '#F97316' },
  { key: 'amber',   label: 'زرد',       color: '#F59E0B' },
  { key: 'emerald', label: 'سبز',       color: '#10B981' },
  { key: 'teal',    label: 'فیروزه‌ای', color: '#14B8A6' },
  { key: 'cyan',    label: 'آبی روشن',  color: '#06B6D4' },
  { key: 'slate',   label: 'خاکستری',   color: '#64748B' },
  { key: 'custom',  label: 'سفارشی',    color: null },
]

function selectPreset(preset) {
  theme.preset = preset.key
  if (preset.color) theme.primaryColor = preset.color
}

const activeColor = computed(() =>
  theme.preset === 'custom'
    ? theme.primaryColor
    : (colorPresets.find(p => p.key === theme.preset)?.color ?? '#1A3620')
)

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const { data } = await settingsService.get()
    const t = data.theme ?? {}
    Object.assign(theme, {
      preset:           t.preset           ?? 'forest-green',
      primaryColor:     t.primaryColor     ?? '#1A3620',
      defaultMode:      t.defaultMode      ?? 'light',
      navbarBg:         t.navbarBg         ?? '',
      navbarBorder:     t.navbarBorder     ?? '',
      footerBg:         t.footerBg         ?? '',
      footerText:       t.footerText       ?? '',
      sidebarBg:        t.sidebarBg        ?? '',
      pageBg:           t.pageBg           ?? '',
    })
    snapshot()
  } catch {
    ui.addToast('خطا در بارگذاری تم', 'error')
  } finally {
    loading.value = false
  }
})

function resetTheme() {
  if (savedSnapshot.value) Object.assign(theme, JSON.parse(savedSnapshot.value))
}

async function saveTheme() {
  saving.value = true
  try {
    const { data } = await settingsService.update({ theme: { ...theme } })
    applyTheme(data.theme)
    snapshot()
    ui.addToast('تم ذخیره شد ✓', 'success')
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره تم'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
</style>
