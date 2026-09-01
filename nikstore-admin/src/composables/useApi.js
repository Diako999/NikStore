import { ref } from 'vue'

export function useApi(fn) {
  const data    = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function execute(...args) {
    loading.value = true
    error.value   = null
    try {
      const res  = await fn(...args)
      data.value = res.data
      return res.data
    } catch (e) {
      error.value = e.response?.data?.message ?? 'خطایی رخ داده است'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
