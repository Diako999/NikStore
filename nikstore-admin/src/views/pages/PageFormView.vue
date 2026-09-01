<template>
  <div class="max-w-5xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <RouterLink :to="{ name: 'pages' }" class="hover:text-primary transition-colors">صفحات</RouterLink>
          <span>/</span>
          <span>{{ isEdit ? 'ویرایش صفحه' : 'صفحه جدید' }}</span>
        </div>
        <h1 class="page-title">{{ isEdit ? 'ویرایش صفحه' : 'صفحه جدید' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink :to="{ name: 'pages' }">
          <AdminButton variant="secondary">انصراف</AdminButton>
        </RouterLink>
        <AdminButton variant="secondary" :loading="saving" @click="save('draft')">
          💾 پیش‌نویس
        </AdminButton>
        <AdminButton :loading="saving" @click="save('published')">
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

        <!-- Title + Slug -->
        <div class="admin-card space-y-3">
          <AdminInput
            v-model="form.title"
            label="عنوان صفحه *"
            placeholder="درباره ما، تماس با ما، ..."
            @input="onTitleInput"
          />
          <div>
            <label class="field-label">آدرس (Slug)</label>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-text-disabled flex-shrink-0">/pages/</span>
              <input
                v-model="form.slug"
                type="text"
                dir="ltr"
                class="field-input flex-1 text-sm font-mono"
                placeholder="about-us"
              />
            </div>
          </div>
        </div>

        <!-- TipTap Editor -->
        <div class="admin-card">
          <label class="field-label mb-3 block">محتوا *</label>

          <!-- Toolbar -->
          <div v-if="editor" class="flex flex-wrap items-center gap-0.5 mb-3 pb-3 border-b border-border">
            <ToolBtn @click="editor.chain().focus().toggleBold().run()"        :active="editor.isActive('bold')">        <strong>B</strong></ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleItalic().run()"      :active="editor.isActive('italic')">       <em>I</em></ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleUnderline().run()"   :active="editor.isActive('underline')">    <span class="underline">U</span></ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleStrike().run()"      :active="editor.isActive('strike')">       <span class="line-through">S</span></ToolBtn>

            <div class="w-px h-5 bg-border mx-1" />

            <ToolBtn @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :active="editor.isActive('heading', { level: 2 })">H2</ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :active="editor.isActive('heading', { level: 3 })">H3</ToolBtn>

            <div class="w-px h-5 bg-border mx-1" />

            <ToolBtn @click="editor.chain().focus().toggleBulletList().run()"   :active="editor.isActive('bulletList')">  ≡</ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleOrderedList().run()"  :active="editor.isActive('orderedList')"> 1.</ToolBtn>
            <ToolBtn @click="editor.chain().focus().toggleBlockquote().run()"   :active="editor.isActive('blockquote')">  ❝</ToolBtn>
            <ToolBtn @click="editor.chain().focus().setHorizontalRule().run()">  ─</ToolBtn>

            <div class="w-px h-5 bg-border mx-1" />

            <ToolBtn @click="editor.chain().focus().setTextAlign('right').run()"  :active="editor.isActive({ textAlign: 'right' })">↦</ToolBtn>
            <ToolBtn @click="editor.chain().focus().setTextAlign('center').run()" :active="editor.isActive({ textAlign: 'center' })">⊞</ToolBtn>
            <ToolBtn @click="editor.chain().focus().setTextAlign('left').run()"   :active="editor.isActive({ textAlign: 'left' })">↤</ToolBtn>

            <div class="w-px h-5 bg-border mx-1" />

            <ToolBtn @click="setLink">🔗</ToolBtn>
            <ToolBtn @click="editor.chain().focus().unsetLink().run()" :disabled="!editor.isActive('link')">🔗✕</ToolBtn>

            <div class="w-px h-5 bg-border mx-1" />

            <ToolBtn @click="editor.chain().focus().undo().run()">↩</ToolBtn>
            <ToolBtn @click="editor.chain().focus().redo().run()">↪</ToolBtn>
          </div>

          <!-- Editor area -->
          <EditorContent
            :editor="editor"
            class="tiptap-content min-h-[300px] focus-within:ring-1 focus-within:ring-primary rounded-lg border border-border p-3 text-sm"
          />
        </div>

        <!-- Excerpt -->
        <div class="admin-card">
          <label class="field-label mb-2 block">خلاصه (اختیاری)</label>
          <textarea
            v-model="form.excerpt"
            rows="3"
            maxlength="500"
            placeholder="خلاصه‌ای کوتاه از محتوای صفحه..."
            class="field-input w-full resize-none text-sm"
          />
          <p class="text-xs text-text-disabled mt-1 text-left">{{ form.excerpt.length }}/500</p>
        </div>

      </div>

      <!-- ── Sidebar ── -->
      <div class="space-y-4">

        <!-- Status -->
        <div class="admin-card space-y-3">
          <h3 class="section-title">وضعیت</h3>
          <div class="flex gap-2">
            <button
              v-for="s in statuses"
              :key="s.key"
              type="button"
              @click="form.status = s.key"
              :class="[
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                form.status === s.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40',
              ]"
            >{{ s.label }}</button>
          </div>
          <p v-if="isEdit" class="text-xs text-text-disabled">
            آدرس: <span class="font-mono">/pages/{{ form.slug }}</span>
          </p>
        </div>

        <!-- Order -->
        <div class="admin-card">
          <AdminInput
            v-model.number="form.order"
            type="number"
            label="ترتیب نمایش"
            placeholder="0"
            hint="عدد کمتر = نمایش زودتر"
          />
        </div>

        <!-- SEO -->
        <div class="admin-card space-y-3">
          <h3 class="section-title">سئو</h3>
          <AdminInput
            v-model="form.metaTitle"
            label="Meta Title"
            dir="auto"
            placeholder="عنوان در گوگل..."
            :maxlength="200"
          />
          <div>
            <label class="field-label mb-1 block">Meta Description</label>
            <textarea
              v-model="form.metaDescription"
              rows="3"
              maxlength="320"
              dir="auto"
              placeholder="توضیح در نتایج جستجو..."
              class="field-input w-full resize-none text-sm"
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs text-text-disabled">{{ form.metaDescription.length }}/320</span>
              <span
                class="text-xs"
                :class="form.metaDescription.length > 160 ? 'text-yellow-500' : 'text-text-disabled'"
              >بهینه: زیر ۱۶۰ کاراکتر</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit    from '@tiptap/starter-kit'
import Underline     from '@tiptap/extension-underline'
import TextAlign     from '@tiptap/extension-text-align'
import Link          from '@tiptap/extension-link'
import Placeholder   from '@tiptap/extension-placeholder'
import { pageService } from '@/services/page.service'
import { useUiStore }  from '@/stores/ui.store'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

// ── Inline toolbar button component ─────────────────────────
const ToolBtn = defineComponent({
  props: { active: Boolean, disabled: Boolean },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => h('button', {
      type: 'button',
      disabled: props.disabled,
      onClick: (e) => { e.preventDefault(); emit('click') },
      class: [
        'w-8 h-8 rounded flex items-center justify-center text-sm transition-colors',
        props.active
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:bg-surface',
        props.disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' '),
    }, slots.default?.())
  },
})

// ── Setup ────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const isEdit       = computed(() => !!route.params.id)
const initialLoading = ref(isEdit.value)
const saving         = ref(false)

const form = reactive({
  title:           '',
  slug:            '',
  excerpt:         '',
  status:          'draft',
  metaTitle:       '',
  metaDescription: '',
  order:           0,
})

const statuses = [
  { key: 'draft',     label: '📝 پیش‌نویس' },
  { key: 'published', label: '🚀 منتشر شده' },
]

// ── TipTap editor ────────────────────────────────────────────
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: 'محتوای صفحه را اینجا بنویسید...' }),
  ],
  editorProps: {
    attributes: { dir: 'auto', class: 'outline-none' },
  },
})

onBeforeUnmount(() => editor.value?.destroy())

// ── Slug auto-generate ───────────────────────────────────────
let slugEdited = false

function onTitleInput() {
  if (slugEdited || isEdit.value) return
  form.slug = form.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// ── Link ─────────────────────────────────────────────────────
function setLink() {
  const prev = editor.value?.getAttributes('link').href ?? ''
  const url  = window.prompt('آدرس لینک:', prev)
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}

// ── Load ─────────────────────────────────────────────────────
onMounted(async () => {
  if (!isEdit.value) return

  try {
    const { data } = await pageService.getById(route.params.id)
    Object.assign(form, {
      title:           data.title           ?? '',
      slug:            data.slug            ?? '',
      excerpt:         data.excerpt         ?? '',
      status:          data.status          ?? 'draft',
      metaTitle:       data.metaTitle       ?? '',
      metaDescription: data.metaDescription ?? '',
      order:           data.order           ?? 0,
    })
    editor.value?.commands.setContent(data.content ?? '')
    slugEdited = true
  } catch {
    ui.addToast('خطا در بارگذاری صفحه', 'error')
    router.push({ name: 'pages' })
  } finally {
    initialLoading.value = false
  }
})

// ── Save ─────────────────────────────────────────────────────
async function save(status) {
  const content = editor.value?.getHTML() ?? ''
  if (!form.title.trim()) return ui.addToast('عنوان الزامی است', 'error')
  if (!form.slug.trim())  return ui.addToast('slug الزامی است', 'error')
  if (!content || content === '<p></p>') return ui.addToast('محتوا الزامی است', 'error')

  saving.value = true
  try {
    const dto = { ...form, content, status }
    if (isEdit.value) {
      await pageService.update(route.params.id, dto)
    } else {
      await pageService.create(dto)
    }
    ui.addToast(status === 'published' ? 'صفحه منتشر شد ✓' : 'پیش‌نویس ذخیره شد ✓', 'success')
    router.push({ name: 'pages' })
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره صفحه', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style>
/* TipTap content styles */
.tiptap-content .ProseMirror {
  outline: none;
  min-height: 280px;
}
.tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--color-text-disabled);
  pointer-events: none;
  float: right;
  height: 0;
}
.tiptap-content .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.tiptap-content .ProseMirror h3 { font-size: 1.1rem;  font-weight: 600; margin: 0.75rem 0 0.4rem; }
.tiptap-content .ProseMirror p  { margin-bottom: 0.5rem; line-height: 1.7; }
.tiptap-content .ProseMirror ul { list-style: disc;   padding-right: 1.5rem; margin-bottom: 0.5rem; }
.tiptap-content .ProseMirror ol { list-style: decimal; padding-right: 1.5rem; margin-bottom: 0.5rem; }
.tiptap-content .ProseMirror blockquote {
  border-right: 3px solid var(--color-primary);
  padding-right: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0.5rem 0;
}
.tiptap-content .ProseMirror a { color: var(--color-primary); text-decoration: underline; }
.tiptap-content .ProseMirror hr { border-color: var(--color-border); margin: 1rem 0; }
.tiptap-content .ProseMirror strong { font-weight: 700; }
.tiptap-content .ProseMirror em { font-style: italic; }
.tiptap-content .ProseMirror s  { text-decoration: line-through; }
</style>
