import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { blogService } from '~/services/blog.service'

export const useBlogStore = defineStore('blog', () => {
  const posts      = ref([])
  const post       = ref(null)
  const tags       = ref([])
  const loading    = ref(false)
  const total      = ref(0)
  const totalPages = ref(1)

  const filters = reactive({
    search: '',
    tag:    '',
    sortBy: 'newest',
    page:   1,
    limit:  12,
  })

  async function fetchPosts(extraParams = {}) {
    loading.value = true
    try {
      const params = {
        page:   filters.page,
        limit:  filters.limit,
        sortBy: filters.sortBy,
        search: filters.search || undefined,
        tag:    filters.tag    || undefined,
        ...extraParams,
      }
      const { data } = await blogService.getAll(params)
      posts.value      = data.posts      ?? []
      total.value      = data.total      ?? 0
      totalPages.value = data.totalPages ?? 1
    } finally {
      loading.value = false
    }
  }

  async function fetchPostBySlug(slug) {
    loading.value = true
    post.value    = null
    try {
      const { data } = await blogService.getBySlug(slug)
      post.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchTags() {
    try {
      const { data } = await blogService.getTags()
      tags.value = Array.isArray(data) ? data : []
    } catch { /* non-critical */ }
  }

  function resetFilters() {
    filters.search = ''
    filters.tag    = ''
    filters.sortBy = 'newest'
    filters.page   = 1
  }

  return {
    posts, post, tags, loading, total, totalPages, filters,
    fetchPosts, fetchPostBySlug, fetchTags, resetFilters,
  }
})
