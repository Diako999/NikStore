import { ref } from 'vue'

const isLoading = ref(false)

export function useRouteLoading() {
  return { isLoading }
}

export function setupRouteLoading(router) {
  router.beforeEach((to, from) => {
    if (to.path !== from.path) isLoading.value = true
    return true
  })
  router.afterEach(() => {
    isLoading.value = false
  })
  router.onError(() => {
    isLoading.value = false
  })
}
