<template>
  <div class="page-form">
    <div class="page-form__head">
      <h1 class="page-form__title">{{ isEdit ? 'ویرایش صفحه' : 'صفحه جدید' }}</h1>
      <router-link to="/pages">
        <AdminButton variant="secondary" size="sm">بازگشت به فهرست</AdminButton>
      </router-link>
    </div>

    <div v-if="loadError" class="page-form__error">{{ loadError }}</div>

    <form class="page-form__grid" @submit.prevent="handleSubmit">
      <div class="page-form__main">
        <AdminCard title="محتوای صفحه">
          <div class="page-form__fields">
            <AdminInput v-model="form.title" label="عنوان" :error="errors.title" />
            <AdminInput v-model="form.slug" label="اسلاگ" placeholder="about-us" :error="errors.slug" />
            <AdminTextarea v-model="form.excerpt" label="خلاصه (اختیاری)" :rows="2" />

            <div class="page-form__content-head">
              <span class="page-form__content-label">محتوا (HTML)</span>
              <button type="button" class="page-form__preview-toggle" @click="showPreview = !showPreview">
                {{ showPreview ? 'ویرایش' : 'پیش‌نمایش' }}
              </button>
            </div>
            <AdminTextarea
              v-if="!showPreview"
              v-model="form.content"
              :rows="16"
              placeholder="<p>متن صفحه...</p>"
              :error="errors.content"
            />
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else class="page-form__preview" v-html="sanitizedContent" />
          </div>
        </AdminCard>
      </div>

      <div class="page-form__side">
        <AdminCard title="انتشار">
          <div class="page-form__fields">
            <AdminSelect v-model="form.status" label="وضعیت" :options="statusOptions" />
            <AdminInput v-model.number="form.order" type="number" label="ترتیب" />
          </div>
        </AdminCard>

        <AdminCard title="SEO">
          <div class="page-form__fields">
            <AdminInput v-model="form.metaTitle" label="عنوان متا" />
            <AdminTextarea v-model="form.metaDescription" label="توضیحات متا" :rows="3" />
          </div>
        </AdminCard>

        <AdminButton type="submit" :loading="saving" class="page-form__submit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد صفحه' }}
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
import { pageService } from '../../services/page.service'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const loadError = ref('')
const saving = ref(false)
const showPreview = ref(false)
const errors = ref({})

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'منتشرشده', value: 'published' },
]

const form = ref(emptyForm())

function emptyForm() {
  return {
    title: '', slug: '', content: '', excerpt: '',
    status: 'draft', metaTitle: '', metaDescription: '', order: 0,
  }
}

const sanitizedContent = computed(() => DOMPurify.sanitize(form.value.content || ''))

async function loadPage() {
  if (!isEdit.value) return
  try {
    const { data } = await pageService.getAdminDetail(route.params.id)
    form.value = { ...emptyForm(), ...data }
  } catch {
    loadError.value = 'بارگذاری صفحه با خطا مواجه شد'
  }
}

function validate() {
  errors.value = {}
  if (!form.value.title.trim()) errors.value.title = 'عنوان الزامی است'
  if (!form.value.slug.trim()) errors.value.slug = 'اسلاگ الزامی است'
  if (!form.value.content.trim()) errors.value.content = 'محتوا نمی‌تواند خالی باشد'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    if (isEdit.value) await pageService.update(route.params.id, form.value)
    else await pageService.create(form.value)
    router.push('/pages')
  } finally {
    saving.value = false
  }
}

onMounted(loadPage)
</script>

<style scoped>
.page-form { display: flex; flex-direction: column; gap: 20px; }
.page-form__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-form__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.page-form__error { padding: 12px 16px; border-radius: 12px; background: rgba(214, 87, 87, .12); color: #d65757; font-size: 13px; }
.page-form__grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 960px) { .page-form__grid { grid-template-columns: 1fr; } }
.page-form__main, .page-form__side { display: flex; flex-direction: column; gap: 16px; }
.page-form__fields { display: flex; flex-direction: column; gap: 14px; }
.page-form__content-head { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.page-form__content-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.page-form__preview-toggle {
  font-size: 12px; font-weight: 600; color: var(--brand-light); background: none; border: none; cursor: pointer;
}
[data-theme='light'] .page-form__preview-toggle { color: var(--brand-dark); }
.page-form__preview {
  min-height: 280px; padding: 14px; border-radius: 12px; background: var(--glass);
  border: 1px solid var(--glass-border); color: var(--text-primary); font-size: 13.5px; line-height: 1.9;
}
.page-form__submit { width: 100%; }
</style>
