import { ref, computed } from 'vue'
import { logger } from '~/utils/logger'

const STORAGE_KEY = 'notif_asked'
const CTX = 'useNotificationPermission'

const hasApi = (
  typeof window !== 'undefined' &&
  'Notification' in window &&
  window.Notification != null
)

logger.debug('notification API available', { hasApi, permission: hasApi ? Notification.permission : 'n/a' }, CTX)

const permission   = ref(hasApi ? Notification.permission : 'denied')

// Module-level reactive flag so canAsk updates immediately after dismiss/request
let _asked = false
try { _asked = !!localStorage.getItem(STORAGE_KEY) } catch {}
const alreadyAsked = ref(_asked)

export function useNotificationPermission() {
  const canAsk = computed(
    () => hasApi && permission.value === 'default' && !alreadyAsked.value,
  )

  const isGranted = computed(() => hasApi && permission.value === 'granted')

  async function requestPermission() {
    if (!hasApi) {
      logger.warn('notification API not available — cannot request permission', {}, CTX)
      return 'denied'
    }
    alreadyAsked.value = true
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* storage blocked */ }
    const result = await Notification.requestPermission()
    permission.value = result
    logger.info('notification permission result', { result }, CTX)
    return result
  }

  function dismiss() {
    alreadyAsked.value = true
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* storage blocked */ }
    logger.debug('notification consent dismissed without requesting', {}, CTX)
  }

  return { canAsk, isGranted, requestPermission, dismiss }
}
