<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <RouterLink :to="{ name: 'blog' }" class="hover:text-primary transition-colors">بلاگ</RouterLink>
          <span>/</span>
          <span>{{ isEdit ? 'ویرایش پست' : 'پست جدید' }}</span>
        </div>
        <h1 class="page-title">{{ isEdit ? 'ویرایش پست' : 'پست جدید' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink :to="{ name: 'blog' }">
          <AdminButton variant="secondary">انصراف</AdminButton>
        </RouterLink>
        <AdminButton variant="secondary" :loading="saving" @click="saveDraft">
          💾 پیش‌نویس
        </AdminButton>
        <AdminButton :loading="saving" @click="savePublished">
          🚀 انتشار
        </AdminButton>
      </div>
    </div>

    <div v-if="initialLoading" class="space-y-4">
      <AdminSkeleton height="56px" class="rounded-xl" />
      <AdminSkeleton height="400px" class="rounded-xl" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- ── Main Content ── -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Title -->
        <div class="admin-card">
          <AdminInput
            v-model="form.title"
            label="عنوان پست *"
            placeholder="عنوان جذاب برای پست..."
            @input="onTitleInput"
          />

          <!-- Slug -->
          <div class="mt-3">
            <label class="field-label">آدرس (Slug)</label>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-text-disabled flex-shrink-0">/blog/</span>
              <input
                v-model="form.slug"
                type="text"
                dir="ltr"
                class="field-input flex-1 text-sm font-mono"
                placeholder="post-slug"
              />
            </div>
          </div>
        </div>

        <!-- Content editor -->
        <div class="admin-card">
          <div class="flex items-center justify-between mb-3">
            <label class="field-label">محتوا *</label>
            <div class="flex items-center gap-1 bg-surface rounded-lg p-0.5">
              <button
                @click="editorMode = 'write'"
                :class="[
                  'px-3 py-1 text-xs rounded-md transition-all',
                  editorMode === 'write' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary',
                ]"
              >✏️ نوشتن</button>
              <button
                @click="editorMode = 'preview'"
                :class="[
                  'px-3 py-1 text-xs rounded-md transition-all',
                  editorMode === 'preview' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary',
                ]"
              >👁 پیش‌نمایش</button>
            </div>
          </div>

          <!-- Toolbar -->
          <div v-if="editorMode === 'write'" class="flex items-center gap-1 flex-wrap mb-2 pb-2 border-b border-border">
            <button
              v-for="tool in toolbar"
              :key="tool.cmd"
              @click="insertFormat(tool)"
              :title="tool.title"
              class="w-7 h-7 rounded flex items-center justify-center text-xs text-text-secondary hover:bg-surface hover:text-text-primary transition-colors font-mono font-bold"
            >{{ tool.icon }}</button>
          </div>

          <!-- Write mode -->
          <textarea
            v-if="editorMode === 'write'"
            ref="editorRef"
            v-model="form.content"
            class="field-input w-full font-mono text-sm resize-none min-h-[360px]"
            placeholder="محتوای پست را اینجا بنویسید... (HTML پشتیبانی می‌شود)"
            dir="auto"
          />

          <!-- Preview mode -->
          <div
            v-else
            class="prose prose-sm max-w-none min-h-[360px] p-3 bg-surface rounded-xl border border-border overflow-auto text-text-primary"
            v-html="DOMPurify.sanitize(form.content || '<p class=\'text-text-disabled text-sm\'>محتوایی برای پیش‌نمایش وجود ندارد</p>')"
          />

          <p class="text-xs text-text-disabled mt-2">
            HTML پشتیبانی می‌شود. برای تیتر از &lt;h2&gt;، برای پاراگراف از &lt;p&gt; استفاده کنید.
          </p>
        </div>

        <!-- Excerpt -->
        <div class="admin-card">
          <label class="field-label">خلاصه / توضیح کوتاه</label>
          <textarea
            v-model="form.excerpt"
            class="field-input w-full mt-1 resize-none h-24 text-sm"
            placeholder="خلاصه‌ای که در لیست بلاگ نمایش داده می‌شود..."
            maxlength="500"
          />
          <p class="text-xs text-text-disabled mt-1 text-left dir-ltr">{{ form.excerpt.length }} / 500</p>
        </div>

        <!-- FAQ -->
        <div class="admin-card">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-text-primary">🙋 سوالات متداول (FAQ Schema)</h3>
              <p class="text-xs text-text-disabled mt-0.5">در نتایج گوگل به عنوان Rich Result نمایش داده می‌شود</p>
            </div>
            <AdminButton variant="secondary" size="sm" @click="addFaq">+ سوال</AdminButton>
          </div>

          <div v-if="form.faq.length === 0"
               class="text-center py-8 rounded-xl border-2 border-dashed border-border text-text-disabled text-sm">
            هنوز سوالی اضافه نشده — روی «+ سوال» کلیک کنید
          </div>

          <div v-else class="space-y-3">
            <div v-for="(item, i) in form.faq" :key="i"
                 class="relative border border-border rounded-xl p-4">
              <button
                @click="removeFaq(i)"
                class="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-xs text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
              >✕</button>
              <label class="field-label mb-1 block">سوال {{ i + 1 }}</label>
              <input
                v-model="item.question"
                type="text"
                class="field-input w-full text-sm mb-3"
                :placeholder="`سوال ${i + 1} را بنویسید...`"
                dir="rtl"
              />
              <label class="field-label mb-1 block">پاسخ</label>
              <textarea
                v-model="item.answer"
                rows="3"
                class="field-input w-full text-sm resize-none"
                placeholder="پاسخ کامل و جامع..."
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Sidebar ── -->
      <div class="space-y-4">

        <!-- Status -->
        <div class="admin-card">
          <h3 class="text-sm font-semibold text-text-primary mb-3">وضعیت انتشار</h3>
          <div class="space-y-2">
            <label
              v-for="s in statuses"
              :key="s.value"
              :class="[
                'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                form.status === s.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/60',
              ]"
            >
              <input type="radio" v-model="form.status" :value="s.value" class="hidden" />
              <span class="text-xl">{{ s.icon }}</span>
              <div>
                <p class="text-sm font-medium text-text-primary">{{ s.label }}</p>
                <p class="text-xs text-text-secondary">{{ s.desc }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Featured Image -->
        <div class="admin-card">
          <h3 class="text-sm font-semibold text-text-primary mb-3">تصویر شاخص</h3>
          <div v-if="form.featuredImage" class="relative mb-3 rounded-xl overflow-hidden aspect-video bg-surface">
            <img :src="form.featuredImage" alt="تصویر شاخص" class="w-full h-full object-cover" />
            <button
              @click="form.featuredImage = ''"
              class="absolute top-2 left-2 w-7 h-7 bg-black/60 text-white rounded-lg flex items-center justify-center text-xs hover:bg-error transition-colors"
            >✕</button>
          </div>
          <div class="flex gap-2">
            <AdminInput v-model="form.featuredImage" dir="ltr" placeholder="https://..." class="flex-1 text-xs" />
            <AdminButton variant="secondary" size="sm" :loading="uploading" @click="triggerUpload">
              📷
            </AdminButton>
          </div>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileChange" />
        </div>

        <!-- Tags -->
        <div class="admin-card">
          <h3 class="text-sm font-semibold text-text-primary mb-3">تگ‌ها</h3>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg"
            >
              #{{ tag }}
              <button @click="removeTag(tag)" class="hover:text-error transition-colors">✕</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              @keydown.comma.prevent="addTag"
              type="text"
              class="field-input flex-1 text-sm"
              placeholder="تگ جدید..."
              dir="rtl"
            />
            <AdminButton variant="secondary" size="sm" @click="addTag">+</AdminButton>
          </div>
          <p class="text-xs text-text-disabled mt-1">Enter یا کاما برای افزودن</p>
        </div>

        <!-- SEO settings -->
        <div class="admin-card">
          <h3 class="text-sm font-semibold text-text-primary mb-4">🔍 تنظیمات سئو</h3>

          <div class="mb-3">
            <label class="field-label">عنوان سئو <span class="text-text-disabled font-normal">(اختیاری)</span></label>
            <input
              v-model="form.metaTitle"
              type="text"
              maxlength="70"
              class="field-input w-full mt-1 text-sm"
              placeholder="اگر خالی باشد، عنوان پست استفاده می‌شود"
              dir="rtl"
            />
            <div class="flex justify-between mt-1">
              <p class="text-xs text-text-disabled">بهترین طول: ۵۰–۶۰ کاراکتر</p>
              <p class="text-xs" :class="form.metaTitle.length > 60 ? 'text-warning' : 'text-text-disabled'">
                {{ form.metaTitle.length }} / 70
              </p>
            </div>
          </div>

          <div class="mb-4">
            <label class="field-label">توضیح متا <span class="text-text-disabled font-normal">(اختیاری)</span></label>
            <textarea
              v-model="form.metaDescription"
              maxlength="160"
              rows="3"
              class="field-input w-full mt-1 text-sm resize-none"
              placeholder="اگر خالی باشد، خلاصه پست استفاده می‌شود"
              dir="rtl"
            />
            <div class="flex justify-between mt-1">
              <p class="text-xs text-text-disabled">بهترین طول: ۱۲۰–۱۵۸ کاراکتر</p>
              <p class="text-xs" :class="form.metaDescription.length > 158 ? 'text-warning' : 'text-text-disabled'">
                {{ form.metaDescription.length }} / 160
              </p>
            </div>
          </div>

          <!-- Google preview -->
          <div class="rounded-xl p-3" style="background: var(--color-surface); border: 1px solid var(--color-border);">
            <p class="text-[10px] text-text-disabled uppercase tracking-widest mb-2">پیش‌نمایش گوگل</p>
            <p class="text-[#1a0dab] dark:text-info text-sm font-medium line-clamp-1 leading-snug">
              {{ form.metaTitle || form.title || 'عنوان پست' }}
            </p>
            <p class="text-success text-xs font-mono my-0.5">{{ siteUrl }}/blog/{{ form.slug || 'post-slug' }}</p>
            <p class="text-text-secondary text-xs line-clamp-2 leading-relaxed">
              {{ form.metaDescription || form.excerpt || 'توضیح کوتاه از محتوای پست در اینجا نمایش داده می‌شود...' }}
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import { blogService }   from '@/services/blog.service'
import { uploadService } from '@/services/upload.service'
import { useUiStore }    from '@/stores/ui.store'
import AdminButton   from '@/components/common/AdminButton.vue'

const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit        = computed(() => !!route.params.id)
const initialLoading = ref(false)
const saving         = ref(false)
const uploading      = ref(false)
const editorMode     = ref('write')
const tagInput       = ref('')
const editorRef      = ref(null)
const fileInput      = ref(null)

const form = reactive({
  title:           '',
  slug:            '',
  content:         '',
  excerpt:         '',
  featuredImage:   '',
  tags:            [],
  status:          'draft',
  metaTitle:       '',
  metaDescription: '',
  faq:             [],
})

const statuses = [
  { value: 'published', icon: '🟢', label: 'منتشر شده', desc: 'در سایت نمایش داده می‌شود' },
  { value: 'draft',     icon: '🟡', label: 'پیش‌نویس',  desc: 'فقط در پنل قابل مشاهده است' },
  { value: 'archived',  icon: '⚫', label: 'آرشیو',     desc: 'از نمایش حذف می‌شود' },
]

const toolbar = [
  { cmd: 'h2',     icon: 'H2',  title: 'تیتر ۲',   wrap: ['<h2>', '</h2>'] },
  { cmd: 'h3',     icon: 'H3',  title: 'تیتر ۳',   wrap: ['<h3>', '</h3>'] },
  { cmd: 'bold',   icon: 'B',   title: 'ضخیم',      wrap: ['<strong>', '</strong>'] },
  { cmd: 'italic', icon: 'I',   title: 'ایتالیک',   wrap: ['<em>', '</em>'] },
  { cmd: 'ul',     icon: '≡',   title: 'لیست',      wrap: ['<ul>\n  <li>', '</li>\n</ul>'] },
  { cmd: 'ol',     icon: '1.',  title: 'لیست عددی', wrap: ['<ol>\n  <li>', '</li>\n</ol>'] },
  { cmd: 'link',   icon: '🔗',  title: 'لینک',      wrap: ['<a href="">', '</a>'] },
  { cmd: 'img',    icon: '🖼',  title: 'تصویر',     wrap: ['<img src="', '" alt="" class="w-full rounded-xl my-4" />'] },
  { cmd: 'p',      icon: 'P',   title: 'پاراگراف',  wrap: ['<p>', '</p>'] },
  { cmd: 'hr',     icon: '—',   title: 'خط جداکننده', insert: '\n<hr class="my-6" />\n' },
  { cmd: 'code',   icon: '</>',  title: 'کد',        wrap: ['<code>', '</code>'] },
  { cmd: 'quote',  icon: '"',   title: 'نقل‌قول',   wrap: ['<blockquote class="border-r-4 border-primary pr-4 my-4">', '</blockquote>'] },
]

function slugify(text) {
  return text.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w؀-ۿ-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

let autoSlug = true
function onTitleInput() {
  if (autoSlug) form.slug = slugify(form.title)
}

function insertFormat(tool) {
  const el = editorRef.value
  if (!el) return

  const start = el.selectionStart
  const end   = el.selectionEnd
  const sel   = form.content.slice(start, end)

  let inserted = ''
  if (tool.insert) {
    inserted = tool.insert
  } else if (tool.wrap) {
    inserted = tool.wrap[0] + (sel || 'متن') + tool.wrap[1]
  }

  form.content = form.content.slice(0, start) + inserted + form.content.slice(end)

  const newPos = start + inserted.length
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(newPos, newPos)
  }, 0)
}

function addTag() {
  const t = tagInput.value.trim().replace(/,/g, '')
  if (t && !form.tags.includes(t)) form.tags.push(t)
  tagInput.value = ''
}

function removeTag(tag) {
  form.tags = form.tags.filter(t => t !== tag)
}

function addFaq() {
  form.faq.push({ question: '', answer: '' })
}

function removeFaq(i) {
  form.faq.splice(i, 1)
}

function triggerUpload() { fileInput.value?.click() }

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const { data } = await uploadService.uploadImage(file, 'blog')
    form.featuredImage = data?.original?.url || data?.url || ''
    ui.addToast('تصویر آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

async function save(status) {
  if (!form.title.trim()) { ui.addToast('عنوان الزامی است', 'error'); return }
  if (!form.content.trim()) { ui.addToast('محتوا الزامی است', 'error'); return }

  saving.value = true
  try {
    const dto = {
      title:           form.title.trim(),
      slug:            form.slug.trim() || undefined,
      content:         form.content,
      excerpt:         form.excerpt.trim(),
      featuredImage:   form.featuredImage.trim(),
      tags:            form.tags,
      status,
      metaTitle:       form.metaTitle.trim()       || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      faq:             form.faq.filter(f => f.question.trim() && f.answer.trim()),
    }

    if (isEdit.value) {
      await blogService.update(route.params.id, dto)
      ui.addToast('پست ویرایش شد ✓', 'success')
    } else {
      await blogService.create(dto)
      ui.addToast('پست ایجاد شد ✓', 'success')
      router.push({ name: 'blog' })
    }
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره', 'error')
  } finally {
    saving.value = false
  }
}

function saveDraft()     { form.status = 'draft';     save('draft') }
function savePublished() { form.status = 'published'; save('published') }

onMounted(async () => {
  if (!isEdit.value) return
  initialLoading.value = true
  try {
    const { data } = await blogService.getById(route.params.id)
    form.title           = data.title           ?? ''
    form.slug            = data.slug            ?? ''
    form.content         = data.content         ?? ''
    form.excerpt         = data.excerpt         ?? ''
    form.featuredImage   = data.featuredImage   ?? ''
    form.tags            = data.tags            ?? []
    form.status          = data.status          ?? 'draft'
    form.metaTitle       = data.metaTitle       ?? ''
    form.metaDescription = data.metaDescription ?? ''
    form.faq             = data.faq             ?? []
    autoSlug = false
  } catch {
    ui.addToast('خطا در بارگذاری پست', 'error')
    router.push({ name: 'blog' })
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
.prose { line-height: 1.8; }
.prose h2 { font-size: 1.2rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.prose h3 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
.prose p  { margin-bottom: 0.75rem; }
.prose ul, .prose ol { padding-right: 1.5rem; margin-bottom: 0.75rem; }
.prose li { margin-bottom: 0.25rem; }
.prose blockquote { color: var(--color-text-secondary); }
.prose code { background: var(--color-surface); padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.85em; }
.prose a { color: var(--color-primary); text-decoration: underline; }
.prose img { max-width: 100%; border-radius: 0.5rem; }
.prose hr { border-color: var(--color-border); }
</style>
