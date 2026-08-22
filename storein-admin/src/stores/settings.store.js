import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsService } from '@/services/settings.service'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(null)
  let fetched = false

  const siteName = computed(() => settings.value?.siteName ?? 'نیک')
  const tagline  = computed(() => settings.value?.tagline  ?? 'فروشگاه تخصصی عینک‌های طبی و آفتابی')
  const logoUrl  = computed(() => settings.value?.logoUrl  ?? '')

  async function fetchSettings() {
    if (fetched) return
    fetched = true
    try {
      const { data } = await settingsService.get()
      settings.value = data
    } catch {
      // silently use defaults
    }
  }

  return { settings, siteName, tagline, logoUrl, fetchSettings }
})
