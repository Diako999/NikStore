<template>
  <div class="cat-page">
    <nav class="cat-page__crumb" aria-label="مسیر صفحه">
      <NuxtLink to="/">خانه</NuxtLink>
      <AppIcon name="chevron-left" :size="11" :stroke-width="2" />
      <span>{{ category.name }}</span>
    </nav>

    <header class="cat-page__head">
      <h1>{{ category.name }}</h1>
      <p v-if="category.description">{{ category.description }}</p>
    </header>

    <div v-if="children.length" class="cat-page__subs">
      <NuxtLink
        v-for="c in children"
        :key="c._id"
        :to="`/category/${c.slug}`"
        class="cat-page__sub"
      >
        {{ c.name }}
      </NuxtLink>
    </div>

    <ProductListing
      :category="slug"
      empty-text="محصولی در این دسته‌بندی یافت نشد"
      @loaded="onLoaded"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import ProductListing from '~/components/products/ProductListing.vue'

const route = useRoute()
const slug = route.params.slug

const { data, error } = await useAsyncData(
  `category-${slug}`,
  () => $fetch(`/api/v1/categories/slug/${slug}`),
)

if (error.value || !data.value?.category) {
  throw createError({ statusCode: 404, statusMessage: 'دسته‌بندی یافت نشد' })
}

const category = computed(() => data.value.category)
const children = computed(() => data.value.children ?? [])

const total = ref(null)
function onLoaded({ total: t }) {
  total.value = t
}

useSeoMeta({ title: () => `${category.value.name} | فروشگاه پوشاک` })
</script>

<style scoped>
.cat-page__crumb {
  margin: 18px 18px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-secondary);
}
.cat-page__crumb span { color: var(--text-primary); font-weight: 600; }

.cat-page__head { margin: 0 18px 14px; }
.cat-page__head h1 { font-size: 19px; font-weight: 800; color: var(--text-primary); }
.cat-page__head p { margin-top: 4px; font-size: 12px; color: var(--text-secondary); line-height: 1.6; }

.cat-page__subs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 18px 16px;
  scrollbar-width: none;
}
.cat-page__subs::-webkit-scrollbar { display: none; }
.cat-page__sub {
  flex: 0 0 auto;
  font-size: 11.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  white-space: nowrap;
}
</style>
