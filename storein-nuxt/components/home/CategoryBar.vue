<template>
  <section v-if="items.length" class="cat-bar">
    <div class="cat-bar__grid">
      <NuxtLink
        v-for="item in items"
        :key="item.slug"
        :to="`/category/${item.slug}`"
        class="cat-tile"
      >
        <div class="cat-tile__ico">
          <img v-if="item.image" :src="item.image" :alt="item.name" class="cat-tile__img" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="#6EB082"
               stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
               class="cat-tile__svg">
            <template v-if="iconFor(item.slug) === 'women'">
              <!-- Dress / blouse silhouette -->
              <path d="M9.5 3.5 12 6l2.5-2.5"/>
              <path d="M9.5 3.5 7 6.5 8.5 8l-2 3L5 20h14l-1.5-8.5-2-3 1.5-1.5-2.5-3"/>
              <path d="M9.5 8.5h5"/>
            </template>
            <template v-else-if="iconFor(item.slug) === 'men'">
              <!-- Shirt silhouette -->
              <path d="M8.5 4 5 6.5 6.5 10l2-1v11h7V9l2 1L19 6.5 15.5 4l-1.5 1.5a3 3 0 0 1-4 0z"/>
            </template>
            <template v-else-if="iconFor(item.slug) === 'kids'">
              <!-- Onesie / kids garment -->
              <path d="M9 3 7 5.5 8 8l-1.5 1v3l1.5-.5V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8.5l1.5.5v-3L16 8l1-2.5L15 3l-1.5 2a2 2 0 0 1-3 0z"/>
              <circle cx="12" cy="12.5" r="1.1"/>
            </template>
            <template v-else>
              <rect x="4" y="4" width="16" height="16" rx="4"/>
            </template>
          </svg>
        </div>
        <span class="cat-tile__lbl">{{ item.name }}</span>
        <span class="cat-tile__sub">{{ subtitleFor(item.slug) }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryService } from '~/services/category.service'

const ICON_SLUG_MAP = { women: 'women', men: 'men', kids: 'kids' }
const SUBTITLE_MAP  = {
  women: 'مد و پوشاک زنانه',
  men:   'استایل مردانه',
  kids:  'راحت و شاد برای کودکان',
}

function iconFor(slug) {
  return ICON_SLUG_MAP[slug] ?? 'default'
}
function subtitleFor(slug) {
  return SUBTITLE_MAP[slug] ?? 'مشاهده محصولات'
}

const items = ref([])

onMounted(async () => {
  try {
    const { data } = await categoryService.getRoots()
    if (Array.isArray(data)) items.value = data
  } catch {}
})
</script>

<style scoped>
.cat-bar {
  padding: 1.25rem 0 0.5rem;
}

.cat-bar__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.cat-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.1rem 0.5rem;
  border-radius: 18px;
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--glass-border);
  text-decoration: none;
  text-align: center;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, background-color 0.22s ease;
}

.cat-tile:hover {
  transform: translateY(-4px);
  background: rgba(27, 42, 33, 0.72);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.cat-tile__ico {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-brand-rgb) / 0.16);
  flex-shrink: 0;
}

.cat-tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}

.cat-tile__svg {
  width: 24px;
  height: 24px;
}

.cat-tile__lbl {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.cat-tile__sub {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.3;
}
</style>
