import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsService } from '~/services/settings.service'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(null)
  const loading  = ref(false)
  let   fetched  = false

  const siteName        = computed(() => settings.value?.siteName        ?? 'نیک')
  const tagline         = computed(() => settings.value?.tagline         ?? 'فروشگاه نیک')
  const description     = computed(() => settings.value?.description     ?? '')
  const keywords        = computed(() => settings.value?.keywords        ?? '')
  const logoUrl         = computed(() => settings.value?.logoUrl         ?? '')
  const faviconUrl      = computed(() => settings.value?.faviconUrl      ?? '')
  const ogImage         = computed(() => settings.value?.ogImage         ?? '')
  const social          = computed(() => settings.value?.social          ?? {})
  const phone     = computed(() => settings.value?.phone ?? '')
  const mobiles   = computed(() => settings.value?.mobiles ?? [])
  const email     = computed(() => settings.value?.email ?? '')
  // addresses: prefer new array field, fall back to legacy single address string
  const addresses = computed(() => {
    if (settings.value?.addresses?.length) return settings.value.addresses
    if (settings.value?.address) return [{ text: settings.value.address, mapsUrl: '' }]
    return []
  })
  const address   = computed(() => settings.value?.address ?? '')
  const footerTagline   = computed(() => settings.value?.footerTagline   ?? '')
  const footerCopyright = computed(() => settings.value?.footerCopyright ?? `تمامی حقوق برای ${settings.value?.siteName ?? ''} محفوظ است`)
  const footerLinks     = computed(() => settings.value?.footerLinks     ?? [])
  const theme           = computed(() => settings.value?.theme ?? { preset: 'lime', primaryColor: '#C6FF34', defaultMode: 'light' })
  const trustItems      = computed(() => settings.value?.trustItems?.length
    ? settings.value.trustItems
    : [
        { icon: '🔒', title: 'پرداخت امن',    subtitle: 'درگاه پرداخت معتبر و رمزنگاری شده',    bgColor: '#EBF4FF' },
        { icon: '↩️', title: 'ضمانت ۷ روزه', subtitle: 'بازگشت کالا در صورت عدم رضایت',        bgColor: '#F0FDF4' },
        { icon: '✅', title: 'اصالت کالا',    subtitle: 'تمام محصولات دارای گارانتی اصالت',     bgColor: '#FFFBEB' },
        { icon: '🚚', title: 'ارسال سریع',   subtitle: 'ارسال به سراسر کشور در کمترین زمان',  bgColor: '#FFF1F2' },
      ]
  )

  async function fetchSettings() {
    if (fetched) return
    fetched   = true
    loading.value = true
    try {
      const { data } = await settingsService.getSettings()
      settings.value = data
    } catch {
      // silently use defaults — site must work even if API is down
    } finally {
      loading.value = false
    }
  }

  return {
    settings, loading,
    siteName, tagline, description, keywords,
    logoUrl, faviconUrl, ogImage, social,
    phone, mobiles, email, addresses, address,
    footerTagline, footerCopyright, footerLinks,
    theme, trustItems,
    fetchSettings,
  }
})
