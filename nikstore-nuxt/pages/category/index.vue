<template>
  <div class="cats-page">
    <nav class="cats-page__crumb" aria-label="مسیر صفحه">
      <NuxtLink to="/">خانه</NuxtLink>
      <AppIcon name="chevron-left" :size="11" :stroke-width="2" />
      <span>دسته‌بندی‌ها</span>
    </nav>

    <header class="cats-page__head">
      <h1>دسته‌بندی‌ها</h1>
      <p>برای دیدن محصولات، یک دسته را انتخاب کنید</p>
    </header>

    <p v-if="!roots.length" class="cats-page__empty">فعلاً دسته‌بندی‌ای ثبت نشده است.</p>

    <ul v-else class="cats-page__list">
      <li v-for="root in roots" :key="root._id" class="cats-card">
        <NuxtLink :to="`/category/${root.slug}`" class="cats-card__main">
          <span class="cats-card__icon" aria-hidden="true">
            <AppIcon :name="iconFor(root)" :size="22" :stroke-width="2" />
          </span>
          <span class="cats-card__text">
            <span class="cats-card__name">{{ root.name }}</span>
            <span v-if="root.productsCount" class="cats-card__count">{{ toPersianDigits(root.productsCount) }} محصول</span>
          </span>
          <AppIcon name="chevron-left" :size="16" :stroke-width="2" class="cats-card__arrow" />
        </NuxtLink>

        <div v-if="root.children?.length" class="cats-card__subs">
          <NuxtLink
            v-for="c in root.children"
            :key="c._id"
            :to="`/category/${c.slug}`"
            class="cats-card__sub"
          >
            {{ c.name }}
          </NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import { toPersianDigits } from '~/utils/format'

useSeoMeta({ title: 'دسته‌بندی‌ها | فروشگاه پوشاک', description: 'همه دسته‌بندی‌های پوشاک زنانه، مردانه و بچگانه' })

// Plain $fetch (like the other public pages) so it also works during SSR.
const { data } = await useAsyncData('category-tree', () => $fetch('/api/v1/categories/tree'), {
  transform: (r) => r?.data ?? r,
  default: () => [],
})
const roots = computed(() => (Array.isArray(data.value) ? data.value : []))

const ICONS = { women: 'women', men: 'men', kids: 'kids' }
const iconFor = (c) => ICONS[c.gender] || ICONS[c.slug] || 'grid'
</script>

<style scoped>
.cats-page { padding-bottom: 12px; }

.cats-page__crumb {
  display: flex; align-items: center; gap: 6px;
  margin: 18px 18px 12px; font-size: 12px; color: var(--text-secondary);
}
.cats-page__crumb span { color: var(--text-primary); font-weight: 600; }

.cats-page__head { margin: 0 18px 16px; }
.cats-page__head h1 { font-size: 19px; font-weight: 800; color: var(--text-primary); }
.cats-page__head p { margin-top: 4px; font-size: 12px; color: var(--text-secondary); line-height: 1.6; }

.cats-page__empty { padding: 48px 24px; text-align: center; font-size: 13px; color: var(--text-secondary); }

.cats-page__list { display: flex; flex-direction: column; gap: 12px; margin: 0 18px; padding: 0; list-style: none; }

.cats-card {
  border-radius: 18px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  overflow: hidden;
}
[data-theme='light'] .cats-card { box-shadow: var(--glass-shadow); }

.cats-card__main {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; min-height: 56px; color: var(--text-primary);
}
.cats-card__icon {
  width: 42px; height: 42px; border-radius: 12px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--glass-strong); color: var(--brand-light);
}
.cats-card__text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cats-card__name { font-size: 15px; font-weight: 800; }
.cats-card__count { font-size: 12px; color: var(--text-secondary); }
.cats-card__arrow { color: var(--text-secondary); flex: none; }

.cats-card__subs {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 0 16px 14px;
}
.cats-card__sub {
  display: inline-flex; align-items: center; min-height: 36px;
  padding: 0 14px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
  color: var(--text-primary); background: var(--glass); border: 1px solid var(--glass-border);
}
</style>
