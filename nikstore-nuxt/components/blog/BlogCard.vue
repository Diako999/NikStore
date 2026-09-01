<template>
  <NuxtLink :to="`/blog/${post.slug}`" class="group block h-full">
    <GlassCard padding="sm" class="overflow-hidden h-full flex flex-col !p-0">

      <!-- Image -->
      <div class="relative overflow-hidden aspect-[16/9] bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        <img
          v-if="post.featuredImage"
          :src="post.featuredImage"
          :alt="post.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-gray-600">
          📝
        </div>

        <!-- Tags overlay -->
        <div v-if="post.tags?.length" class="absolute top-3 right-3 flex flex-wrap gap-1">
          <span
            v-for="tag in post.tags.slice(0, 2)"
            :key="tag"
            class="text-xs bg-black/50 text-white backdrop-blur-sm px-2 py-0.5 rounded-full"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="p-4 flex flex-col flex-1">
        <h3 class="font-bold text-glass-text-primary text-base leading-snug line-clamp-2 group-hover:text-glass-brand transition-colors mb-2">
          {{ post.title }}
        </h3>

        <p v-if="post.excerpt" class="text-glass-text-secondary text-sm line-clamp-2 leading-relaxed flex-1">
          {{ post.excerpt }}
        </p>

        <!-- Meta -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-glass-border text-xs text-glass-text-secondary">
          <div class="flex items-center gap-2">
            <span v-if="authorName">✍️ {{ authorName }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="post.viewCount" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ post.viewCount }}
            </span>
            <span class="font-fanum">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  </NuxtLink>
</template>

<script setup>
import { computed } from 'vue'
import GlassCard from '~/components/glass/GlassCard.vue'

const props = defineProps({
  post: { type: Object, required: true },
})

const authorName = computed(() => {
  const a = props.post.author
  if (!a) return ''
  if (a.firstName || a.lastName) return `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim()
  return 'تیم تحریریه نیمرُخ اپتیک'
})

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}
</script>
