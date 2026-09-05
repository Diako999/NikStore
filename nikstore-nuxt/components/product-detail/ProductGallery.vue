<template>
  <div class="gallery">
    <div class="gallery__main">
      <div ref="trackRef" class="gallery__track" @scroll="onScroll">
        <div v-for="(img, i) in images" :key="i" class="gallery__slide">
          <img v-if="img" :src="img" :alt="alt" loading="lazy">
          <div v-else class="gallery__fallback" />
        </div>
      </div>

      <div v-if="images.length > 1" class="gallery__dots">
        <span v-for="(img, i) in images" :key="i" class="gallery__dot" :class="{ 'gallery__dot--active': i === active }" />
      </div>
    </div>

    <div v-if="images.length > 1" class="gallery__thumbs">
      <button
        v-for="(img, i) in images"
        :key="i"
        type="button"
        class="gallery__thumb"
        :class="{ 'gallery__thumb--active': i === active }"
        @click="scrollTo(i)"
      >
        <img v-if="img" :src="img" :alt="alt" loading="lazy">
        <div v-else class="gallery__fallback" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  alt: { type: String, default: '' },
})

const trackRef = ref(null)
const active = ref(0)

function onScroll() {
  const el = trackRef.value
  if (!el) return
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  active.value = Math.min(Math.max(idx, 0), props.images.length - 1)
}

function scrollTo(i) {
  const el = trackRef.value
  if (!el) return
  el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' })
  active.value = i
}
</script>

<style scoped>
.gallery__main {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--glass);
}

.gallery__track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.gallery__track::-webkit-scrollbar { display: none; }

.gallery__slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  aspect-ratio: 1 / 1.05;
}
.gallery__slide img { width: 100%; height: 100%; object-fit: cover; }
.gallery__fallback {
  width: 100%;
  height: 100%;
  background: radial-gradient(120% 120% at 30% 20%, #A9C9B4 0%, #3D8B52 55%, #0F1A13 100%);
}

.gallery__dots {
  position: absolute;
  bottom: 10px;
  inset-inline: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
}
.gallery__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .45);
}
.gallery__dot--active { background: #fff; width: 14px; border-radius: 3px; }

.gallery__thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
  scrollbar-width: none;
}
.gallery__thumbs::-webkit-scrollbar { display: none; }
.gallery__thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid transparent;
}
.gallery__thumb--active { border-color: var(--brand-light); }
.gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
</style>
