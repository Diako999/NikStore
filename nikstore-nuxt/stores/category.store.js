import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryService } from '~/services/category.service'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loading    = ref(false)

  async function fetchCategories() {
    if (categories.value.length) return
    loading.value = true
    try {
      const { data } = await categoryService.getTree()
      categories.value = Array.isArray(data) ? data : []
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, fetchCategories }
})
