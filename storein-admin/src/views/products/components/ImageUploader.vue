<template>
  <div>
    <!-- Image grid -->
    <div class="grid grid-cols-3 gap-2 mb-3">

      <!-- Existing images -->
      <div
        v-for="(img, idx) in modelValue"
        :key="img.url"
        class="relative group aspect-square rounded-xl overflow-hidden border-2 border-border bg-surface"
      >
        <img :src="resolveUrl(img)" class="w-full h-full object-cover" />

        <!-- Main badge -->
        <div v-if="idx === 0"
             class="absolute top-1 right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          اصلی
        </div>

        <!-- Overlay actions -->
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button v-if="idx !== 0" @click="setMain(idx)" title="تصویر اصلی"
            class="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full text-white text-sm transition-colors flex items-center justify-center">
            ⭐
          </button>
          <button @click="remove(idx)" title="حذف"
            class="w-8 h-8 bg-red-500/80 hover:bg-red-600 rounded-full text-white text-sm transition-colors flex items-center justify-center">
            ✕
          </button>
        </div>
      </div>

      <!-- Upload slot -->
      <div
        v-if="modelValue.length < maxImages"
        @click="triggerInput"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        :class="[
          'aspect-square rounded-xl border-2 border-dashed cursor-pointer',
          'flex flex-col items-center justify-center gap-2 transition-all duration-150',
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border hover:border-primary/50 hover:bg-surface',
        ]"
      >
        <template v-if="uploading">
          <svg class="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-xs text-text-secondary">در حال آپلود...</span>
        </template>
        <template v-else>
          <svg class="w-6 h-6 text-text-disabled" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <span class="text-xs text-text-disabled text-center px-1">آپلود تصویر</span>
        </template>
      </div>
    </div>

    <p v-if="uploadError" class="text-error text-xs mb-1">{{ uploadError }}</p>
    <p class="text-text-disabled text-xs">حداکثر {{ maxImages }} تصویر — فرمت: JPG, PNG, WEBP — سایز پیشنهادی: <span class="text-text-secondary font-medium">800×800px</span></p>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp"
           multiple class="hidden" @change="onFilesSelected" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadService } from '@/services/upload.service'

const props = defineProps({
  modelValue: { type: Array,  default: () => [] },
  maxImages:  { type: Number, default: 8 },
})
const emit = defineEmits(['update:modelValue'])

const fileInput   = ref(null)
const uploading   = ref(false)
const isDragging  = ref(false)
const uploadError = ref('')

// Handles all image shapes:
// - plain string URL (from DB)
// - { url } (normalized)
// - { original: { url }, thumbnail: { url } }  (upload API response)
function resolveUrl(img) {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (img.thumbnail?.url)  return img.thumbnail.url
  if (typeof img.thumbnail === 'string' && img.thumbnail) return img.thumbnail
  if (img.url)             return img.url
  if (img.original?.url)   return img.original.url
  return ''
}

function triggerInput() {
  if (uploading.value) return
  fileInput.value?.click()
}

async function onFilesSelected(e) {
  await uploadFiles([...e.target.files])
  e.target.value = ''
}

function onDrop(e) {
  isDragging.value = false
  uploadFiles([...(e.dataTransfer?.files ?? [])])
}

async function uploadFiles(files) {
  uploadError.value = ''
  const slots = props.maxImages - props.modelValue.length
  const toUpload = files.slice(0, slots)
  if (!toUpload.length) return

  const invalid = toUpload.filter(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
  if (invalid.length) {
    uploadError.value = 'فرمت فایل معتبر نیست. فقط JPG، PNG، WEBP مجاز است'
    return
  }

  uploading.value = true
  try {
    const results = await Promise.all(toUpload.map(f => uploadService.uploadImage(f)))
    const newImages = results.map(r => r.data)
    emit('update:modelValue', [...props.modelValue, ...newImages])
  } catch {
    uploadError.value = 'خطا در آپلود تصویر. دوباره تلاش کنید'
  } finally {
    uploading.value = false
  }
}

function remove(idx) {
  const updated = [...props.modelValue]
  updated.splice(idx, 1)
  emit('update:modelValue', updated)
}

function setMain(idx) {
  const updated = [...props.modelValue]
  const [item] = updated.splice(idx, 1)
  updated.unshift(item)
  emit('update:modelValue', updated)
}
</script>
