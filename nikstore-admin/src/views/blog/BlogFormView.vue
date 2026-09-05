<template>
  <div class="blog-form">
    <div class="blog-form__head">
      <h1 class="blog-form__title">{{ isEdit ? 'ویرایش مقاله' : 'مقاله جدید' }}</h1>
      <router-link to="/blog">
        <AdminButton variant="secondary" size="sm">بازگشت به فهرست</AdminButton>
      </router-link>
    </div>

    <div v-if="loadError" class="blog-form__error">{{ loadError }}</div>

    <form class="blog-form__grid" @submit.prevent="handleSubmit">
      <div class="blog-form__main">
        <AdminCard title="محتوای مقاله">
          <div class="blog-form__fields">
            <AdminInput v-model="form.title" label="عنوان" placeholder="عنوان مقاله" :error="errors.title" />
            <AdminInput
              v-model="form.slug"
              label="اسلاگ (اختیاری)"
              placeholder="در صورت خالی بودن، خودکار از روی عنوان ساخته می‌شود"
            />
            <AdminTextarea v-model="form.excerpt" label="خلاصه" :rows="2" placeholder="خلاصه کوتاه برای فهرست و شبکه‌های اجتماعی" />

            <div class="blog-form__content-head">
              <span class="blog-form__content-label">محتوا (HTML)</span>
              <button type="button" class="blog-form__preview-toggle" @click="showPreview = !showPreview">
                {{ showPreview ? 'ویرایش' : 'پیش‌نمایش' }}
              </button>
            </div>
            <AdminTextarea
              v-if="!showPreview"
              v-model="form.content"
              :rows="14"
              placeholder="<p>متن مقاله...</p>"
              :error="errors.content"
            />
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else class="blog-form__preview" v-html="sanitizedContent" />
          </div>
        </AdminCard>
      </div>

      <div class="blog-form__side">
        <AdminCard title="تصویر شاخص">
          <div class="blog-form__cover">
            <img v-if="form.featuredImage" :src="form.featuredImage" alt="">
            <div v-else class="blog-form__cover-empty">
              <AppIcon name="image" :size="26" />
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange">
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            :loading="uploading"
            @click="fileInput?.click()"
          >
            {{ form.featuredImage ? 'تغییر تصویر' : 'بارگذاری تصویر' }}
          </AdminButton>
          <AdminButton
            v-if="form.featuredImage"
            type="button"
            variant="ghost"
            size="sm"
            @click="form.featuredImage = ''"
          >
            حذف تصویر
          </AdminButton>
        </AdminCard>

        <AdminCard title="انتشار">
          <div class="blog-form__fields">
            <AdminSelect v-model="form.status" label="وضعیت" :options="statusOptions" />
            <AdminInput v-model="tagsText" label="برچسب‌ها" placeholder="مد، پاییزه، تخفیف (با کاما جدا کنید)" />
          </div>
        </AdminCard>

        <AdminCard title="سئو">
          <div class="blog-form__fields">
            <AdminInput v-model="form.metaTitle" label="عنوان متا" placeholder="حداکثر ۷۰ کاراکتر" />
            <AdminTextarea v-model="form.metaDescription" label="توضیحات متا" :rows="3" placeholder="حداکثر ۱۶۰ کاراکتر" />
          </div>
        </AdminCard>

        <AdminButton type="submit" :loading="saving" class="blog-form__submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ثبت مقاله' }}
        </AdminButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { blogService } from '../../services/blog.service'
import { uploadService } from '../../services/upload.service'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'blog-edit')
const postId = computed(() => route.params.id)

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'منتشرشده', value: 'published' },
  { label: 'بایگانی‌شده', value: 'archived' },
]

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
})
const tagsText = ref('')

const errors = ref({})
const saving = ref(false)
const uploading = ref(false)
const loadError = ref('')
const showPreview = ref(false)
const fileInput = ref(null)

const sanitizedContent = computed(() => DOMPurify.sanitize(form.value.content || ''))

async function loadPost() {
  try {
    const { data } = await blogService.getAdminDetail(postId.value)
    form.value = {
      title: data.title ?? '',
      slug: data.slug ?? '',
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
      featuredImage: data.featuredImage ?? '',
      status: data.status ?? 'draft',
      metaTitle: data.metaTitle ?? '',
      metaDescription: data.metaDescription ?? '',
    }
    tagsText.value = (data.tags ?? []).join('، ')
  } catch (error) {
    loadError.value = error.response?.data?.message || 'دریافت اطلاعات مقاله با خطا مواجه شد'
  }
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'banners')
    form.value.featuredImage = data?.original?.url ?? ''
  } catch (error) {
    loadError.value = error.response?.data?.message || 'بارگذاری تصویر با خطا مواجه شد'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

function validate() {
  errors.value = {}
  if (!form.value.title || form.value.title.trim().length < 3) {
    errors.value.title = 'عنوان باید حداقل ۳ کاراکتر باشد'
  }
  if (!form.value.content || form.value.content.trim().length < 10) {
    errors.value.content = 'محتوا باید حداقل ۱۰ کاراکتر باشد'
  }
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  loadError.value = ''
  try {
    const tags = tagsText.value
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      title: form.value.title,
      content: form.value.content,
      excerpt: form.value.excerpt || undefined,
      featuredImage: form.value.featuredImage || undefined,
      status: form.value.status,
      tags,
      metaTitle: form.value.metaTitle || undefined,
      metaDescription: form.value.metaDescription || undefined,
    }
    if (form.value.slug) payload.slug = form.value.slug

    if (isEdit.value) {
      await blogService.update(postId.value, payload)
    } else {
      await blogService.create(payload)
    }
    router.push('/blog')
  } catch (error) {
    loadError.value = error.response?.data?.message || 'ذخیره مقاله با خطا مواجه شد'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadPost()
})
</script>

<style scoped>
.blog-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blog-form__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.blog-form__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.blog-form__error {
  font-size: 13px;
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
  border-radius: 10px;
  padding: 12px 14px;
}
.blog-form__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 1023px) {
  .blog-form__grid {
    grid-template-columns: 1fr;
  }
}
.blog-form__main,
.blog-form__side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blog-form__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.blog-form__content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.blog-form__content-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.blog-form__preview-toggle {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-light);
  background: transparent;
  border: none;
  cursor: pointer;
}
.blog-form__preview {
  min-height: 260px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-size: 13.5px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.blog-form__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.blog-form__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.blog-form__cover-empty {
  color: var(--text-disabled);
}
.blog-form__submit {
  width: 100%;
}
</style>
