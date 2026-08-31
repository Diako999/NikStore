<template>
  <div ref="wrapper" class="relative w-full">
    <!-- Search input wrapper -->
    <div
      :class="[
        'flex items-center rounded-full border transition-all duration-200',
        isFocused
          ? 'border-brand shadow-[0_0_0_3px_rgb(var(--brand-rgb)/0.18)] bg-glass-strong'
          : 'border-glass-border bg-glass hover:border-white/20',
      ]"
    >
      <!-- Search icon -->
      <span class="pr-3.5 pl-1 text-glass-text-secondary pointer-events-none shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4.5 h-4.5 w-[18px] h-[18px]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
      </span>

      <!-- Input -->
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        dir="rtl"
        autocomplete="off"
        placeholder="جستجو در پوشاک، برند، دسته‌بندی ..."
        class="flex-1 min-w-0 py-2.5 bg-transparent text-sm text-glass-text-primary placeholder:text-glass-text-disabled focus:outline-none"
        @focus="onFocus"
        @keydown="onInputKeydown"
      />

      <!-- Keyboard shortcut hint — desktop only -->
      <div class="hidden lg:flex items-center gap-1 ml-2 shrink-0">
        <kbd class="px-1.5 py-0.5 text-[10px] font-mono rounded border border-glass-border text-glass-text-disabled bg-glass leading-none">Ctrl</kbd>
        <span class="text-glass-text-disabled text-[10px]">+</span>
        <kbd class="px-1.5 py-0.5 text-[10px] font-mono rounded border border-glass-border text-glass-text-disabled bg-glass leading-none">K</kbd>
      </div>

      <!-- Search button -->
      <button
        type="button"
        @click="handleSearch"
        class="m-1 px-4 py-1.5 bg-brand hover:bg-brand-dark active:scale-95 text-white text-sm font-medium rounded-full transition-all duration-150 shrink-0"
      >
        جستجو
      </button>
    </div>

    <!-- Suggestions dropdown -->
    <Transition name="search-drop">
      <div
        v-if="isOpen && query.trim().length >= 2"
        class="absolute top-full mt-2 w-full rounded-2xl shadow-dropdown z-dropdown overflow-hidden search-drop-panel"
      >
        <!-- Loading -->
        <div v-if="loading" class="p-4 space-y-3">
          <div v-for="i in 4" :key="i" class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg skeleton shrink-0" />
            <div class="flex-1 h-3.5 skeleton rounded-full" />
          </div>
        </div>

        <template v-else>
          <template v-if="hasResults">
            <!-- Product suggestions -->
            <div v-if="suggestions.products?.length">
              <div class="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-glass-text-disabled">
                محصولات
              </div>
              <button
                v-for="(item, idx) in suggestions.products.slice(0, 5)"
                :key="item.slug"
                type="button"
                class="w-full text-right px-4 py-2.5 flex items-center gap-3 transition-colors duration-100 group"
                :style="{ color: 'var(--text-primary)', backgroundColor: activeIndex === idx ? 'var(--glass)' : '' }"
                @mouseenter="activeIndex = idx"
                @mouseleave="activeIndex = -1"
                @click="goToProduct(item)"
              >
                <span class="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-brand">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                </span>
                <span class="text-sm truncate">{{ item.name }}</span>
              </button>
            </div>

            <!-- Category suggestions -->
            <div v-if="suggestions.categories?.length">
              <div
                v-if="suggestions.products?.length"
                class="mx-4 my-1"
                style="border-top: 1px solid var(--glass-border);"
              />
              <div class="px-4 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-glass-text-disabled">
                دسته‌بندی‌ها
              </div>
              <button
                v-for="(cat, cidx) in suggestions.categories.slice(0, 3)"
                :key="cat.slug"
                type="button"
                class="w-full text-right px-4 py-2.5 flex items-center gap-3 transition-colors duration-100"
                :style="{ color: 'var(--text-primary)', backgroundColor: activeIndex === (suggestions.products?.length || 0) + cidx ? 'var(--glass)' : '' }"
                @mouseenter="activeIndex = (suggestions.products?.length || 0) + cidx"
                @mouseleave="activeIndex = -1"
                @click="goToCategory(cat)"
              >
                <span class="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-brand">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                  </svg>
                </span>
                <span class="text-sm truncate">{{ cat.name }}</span>
                <span class="mr-auto text-xs px-2 py-0.5 rounded-full text-brand" style="background-color: rgb(var(--brand-rgb) / 0.15);">دسته‌بندی</span>
              </button>
            </div>
          </template>

          <!-- No results -->
          <div v-else class="py-10 text-center">
            <div class="text-3xl mb-2">🔍</div>
            <p class="text-sm text-glass-text-secondary">نتیجه‌ای برای «{{ query }}» یافت نشد</p>
          </div>

          <!-- Search all -->
          <div style="border-top: 1px solid var(--glass-border);">
            <button
              type="button"
              class="w-full px-4 py-3 text-sm text-brand flex items-center justify-center gap-2 font-medium transition-colors duration-100"
              @mouseenter="e => e.currentTarget.style.backgroundColor = 'var(--glass)'"
              @mouseleave="e => e.currentTarget.style.backgroundColor = ''"
              @click="handleSearch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              جستجو برای «{{ query }}»
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import http from '~/services/http.service'
import { logger } from '~/utils/logger'

const router    = useRouter()
const wrapper   = ref(null)
const inputEl   = ref(null)
const query     = ref('')
const isOpen    = ref(false)
const isFocused = ref(false)
const loading   = ref(false)
const activeIndex = ref(-1)
const suggestions = ref({ products: [], categories: [] })

const hasResults = computed(() =>
  suggestions.value.products?.length > 0 || suggestions.value.categories?.length > 0
)

const allItems = computed(() => [
  ...(suggestions.value.products || []).slice(0, 5).map(p => ({ type: 'product', item: p })),
  ...(suggestions.value.categories || []).slice(0, 3).map(c => ({ type: 'category', item: c })),
])

onClickOutside(wrapper, close)

function onFocus() {
  isFocused.value = true
  isOpen.value = true
}

function close() {
  isFocused.value = false
  isOpen.value = false
}

function normalizeSuggestData(data) {
  if (!data) return { products: [], categories: [] }
  // Legacy backend returns string[] — map to { name, slug } with empty slug
  if (Array.isArray(data)) {
    return { products: data.map((name) => ({ name, slug: '' })), categories: [] }
  }
  return { products: data.products ?? [], categories: data.categories ?? [] }
}

const fetchSuggestions = useDebounceFn(async (q) => {
  const trimmed = q.trim()
  if (trimmed.length < 2) { suggestions.value = { products: [], categories: [] }; return }
  loading.value = true
  try {
    const { data } = await http.get('/search/suggest', { params: { q: trimmed } })
    suggestions.value = normalizeSuggestData(data)
    logger.info('search: suggestions fetched', { q: trimmed, products: suggestions.value.products.length, categories: suggestions.value.categories.length }, 'AppHeaderSearch')
  } catch (err) {
    logger.error('search: suggest request failed', { q: trimmed, err }, 'AppHeaderSearch')
    suggestions.value = { products: [], categories: [] }
  } finally {
    loading.value = false
  }
}, 300)

watch(query, fetchSuggestions)
watch(suggestions, () => { activeIndex.value = -1 })

function onInputKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, allItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && allItems.value[activeIndex.value]) {
      const selected = allItems.value[activeIndex.value]
      if (selected.type === 'product') goToProduct(selected.item)
      else goToCategory(selected.item)
    } else {
      handleSearch()
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function handleSearch() {
  if (!query.value.trim()) return
  router.push({ path: '/search', query: { q: query.value.trim() } })
  close()
}

function goToProduct(item) {
  if (item.slug) {
    router.push(`/product/${item.slug}`)
  } else {
    router.push({ path: '/search', query: { q: item.name } })
  }
  close()
  query.value = ''
}

function goToCategory(cat) {
  router.push(`/category/${cat.slug}`)
  close()
  query.value = ''
}

// Ctrl+K shortcut
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.search-drop-panel {
  background: var(--glass-strong);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
}

.search-drop-enter-active { transition: all 0.15s ease; }
.search-drop-leave-active { transition: all 0.1s ease; }
.search-drop-enter-from,
.search-drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
