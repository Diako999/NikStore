import { defineStore } from 'pinia'
import { ref } from 'vue'
import { colorService } from '~/services/color.service'

export const useColorStore = defineStore('color', () => {
  const colors  = ref([])
  const loaded  = ref(false)
  const loading = ref(false)

  async function fetch() {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const { data } = await colorService.getActive()
      colors.value = Array.isArray(data) ? data : []
      loaded.value = true
    } catch (e) {
      console.error('[ColorStore] fetch failed', e)
    } finally {
      loading.value = false
    }
  }

  function hexOf(name) {
    return colors.value.find(c => c.name === name)?.hex ?? null
  }

  return { colors, loaded, loading, fetch, hexOf }
})
