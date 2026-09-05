<template>
  <div class="image-uploader">
    <div class="image-uploader__grid">
      <div v-for="(url, index) in images" :key="url" class="image-uploader__item">
        <img :src="url" :alt="`تصویر ${index + 1}`">
        <span v-if="index === 0" class="image-uploader__primary">تصویر اصلی</span>
        <button
          type="button"
          class="image-uploader__remove"
          aria-label="حذف تصویر"
          @click="removeImage(index)"
        >
          <AppIcon name="close" :size="13" />
        </button>
      </div>

      <label class="image-uploader__drop" :class="{ 'image-uploader__drop--busy': uploading }">
        <input
          type="file"
          accept="image/*"
          multiple
          class="image-uploader__input"
          :disabled="uploading"
          @change="handleFiles"
        >
        <span v-if="uploading" class="image-uploader__spinner" aria-hidden="true" />
        <template v-else>
          <AppIcon name="upload" :size="20" />
          <span>افزودن تصویر</span>
        </template>
      </label>
    </div>
    <p v-if="error" class="image-uploader__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '../../../components/icons/AppIcon.vue'
import { uploadService } from '../../../services/upload.service'

const props = defineProps({
  folder: { type: String, default: 'products' },
})

const images = defineModel({ type: Array, default: () => [] })

const uploading = ref(false)
const error = ref('')

async function handleFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  error.value = ''
  try {
    const { data } = await uploadService.uploadImages(files, props.folder)
    const uploaded = (data ?? []).map((item) => item.original?.url).filter(Boolean)
    images.value = [...images.value, ...uploaded]
  } catch (err) {
    error.value = err.response?.data?.message || 'آپلود تصویر با خطا مواجه شد'
  } finally {
    uploading.value = false
  }
}

function removeImage(index) {
  images.value = images.value.filter((_, i) => i !== index)
}
</script>

<style scoped>
.image-uploader__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}
.image-uploader__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--glass);
}
.image-uploader__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.image-uploader__primary {
  position: absolute;
  inset-inline-start: 6px;
  bottom: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 0, 0, .55);
  padding: 2px 8px;
  border-radius: 999px;
}
.image-uploader__remove {
  position: absolute;
  top: 6px;
  inset-inline-end: 6px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: rgba(0, 0, 0, .55);
  border: none;
  cursor: pointer;
}
.image-uploader__remove:hover {
  background: #D9534F;
}

.image-uploader__drop {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-secondary);
  border-radius: 12px;
  border: 1.5px dashed var(--glass-border);
  background: var(--glass);
  cursor: pointer;
  transition: border-color .15s ease, color .15s ease;
}
.image-uploader__drop:hover {
  border-color: var(--brand-light);
  color: var(--text-primary);
}
.image-uploader__drop--busy {
  cursor: wait;
}
.image-uploader__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.image-uploader__spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--text-secondary);
  border-inline-end-color: transparent;
  animation: image-uploader-spin .6s linear infinite;
}
@keyframes image-uploader-spin {
  to { transform: rotate(360deg); }
}

.image-uploader__error {
  margin-top: 10px;
  font-size: 12px;
  color: #D9534F;
}
</style>
