<template>
  <section v-if="items.length" class="cat-bar">
    <div ref="gridRef" class="cat-bar__grid">
      <GlassCategoryTile
        v-for="item in items"
        :key="item.slug"
        :to="`/category/${item.slug}`"
        :label="item.name"
        :sub="subtitleFor(item.slug)"
      >
        <template #icon>
          <img v-if="item.image" :src="item.image" :alt="item.name" class="cat-bar__img" />
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
               class="cat-bar__svg">
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
              <!-- Generic apparel hanger — fallback for any other category -->
              <path d="M12 3a2 2 0 0 1 2 2c0 .9-.6 1.6-1.4 1.9L12 7l-.6-.1A2 2 0 0 1 10 5a2 2 0 0 1 2-2z"/>
              <path d="M12 7 3 13l1 3h16l1-3-9-6z"/>
              <path d="M6 16v3h12v-3"/>
            </template>
          </svg>
        </template>
      </GlassCategoryTile>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryService } from '~/services/category.service'
import GlassCategoryTile from '~/components/glass/CategoryTile.vue'
import { useGsapReveal } from '~/composables/useGsapReveal'

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
const gridRef = ref(null)

useGsapReveal(gridRef, { y: 18, stagger: 0.06 })

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

.cat-bar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.cat-bar__svg {
  width: 20px;
  height: 20px;
}
</style>
