<template>
  <div class="product-form">
    <div class="product-form__header">
      <h1 class="product-form__title">{{ isEdit ? 'ویرایش محصول' : 'محصول جدید' }}</h1>
      <div class="product-form__header-actions">
        <AdminButton variant="secondary" @click="router.push('/products')">انصراف</AdminButton>
        <AdminButton :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد محصول' }}
        </AdminButton>
      </div>
    </div>

    <p v-if="loadError" class="product-form__error">{{ loadError }}</p>

    <div v-if="loading" class="product-form__loading">در حال بارگذاری...</div>

    <div v-else class="product-form__grid">
      <div class="product-form__main">
        <AdminCard title="اطلاعات پایه">
          <div class="product-form__row">
            <AdminInput label="نام محصول" v-model="form.name" placeholder="مثلاً پیراهن مردانه کلاسیک" :error="errors.name" @blur="autoSlug" />
            <AdminInput label="اسلاگ (URL)" v-model="form.slug" placeholder="اختیاری، خودکار ساخته می‌شود" />
          </div>
          <div class="product-form__row">
            <AdminSelect label="دسته‌بندی" v-model="form.category" placeholder="انتخاب دسته‌بندی" :options="categoryOptions" :error="errors.category" />
            <AdminSelect label="برند" v-model="form.brand" placeholder="بدون برند" :options="brandOptions" />
          </div>
          <AdminTextarea label="توضیح کوتاه" v-model="form.shortDescription" :rows="2" placeholder="یک خط معرفی محصول برای لیست‌ها" />
          <AdminTextarea label="توضیحات کامل" v-model="form.description" :rows="6" placeholder="توضیحات کامل محصول" />
        </AdminCard>

        <AdminCard title="تصاویر محصول">
          <ImageUploader v-model="form.images" folder="products" />
        </AdminCard>

        <AdminCard title="ترکیب‌های رنگ و سایز (واریانت‌ها)">
          <VariantEditor v-model="form.variants" :colors="colors" />
        </AdminCard>

        <AdminCard title="مشخصات فنی">
          <div v-for="(spec, index) in form.specs" :key="index" class="product-form__spec-row">
            <AdminInput placeholder="ویژگی (مثلاً جنس)" v-model="spec.key" />
            <AdminInput placeholder="مقدار (مثلاً پنبه)" v-model="spec.value" />
            <AdminInput placeholder="واحد (اختیاری)" v-model="spec.unit" />
            <button type="button" class="product-form__spec-remove" @click="removeSpec(index)">
              <AppIcon name="close" :size="14" />
            </button>
          </div>
          <AdminButton variant="secondary" size="sm" icon="plus" @click="addSpec">افزودن ویژگی</AdminButton>
        </AdminCard>
      </div>

      <div class="product-form__side">
        <AdminCard title="وضعیت انتشار">
          <AdminSelect v-model="form.status" :options="statusOptions" />
        </AdminCard>

        <AdminCard title="برچسب‌ها">
          <AdminInput v-model="tagsInput" placeholder="برچسب‌ها را با ویرگول جدا کنید" />
          <p class="product-form__hint">مثلاً: تخفیف‌دار، پرفروش، جدید</p>
        </AdminCard>

        <AdminCard title="وزن">
          <AdminInput type="number" v-model.number="form.weight" placeholder="وزن به گرم" />
        </AdminCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import ImageUploader from './components/ImageUploader.vue'
import VariantEditor from './components/VariantEditor.vue'
import { productService } from '../../services/product.service'
import { categoryService } from '../../services/category.service'
import { brandService } from '../../services/brand.service'
import { colorService } from '../../services/color.service'

const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.id)
const isEdit = computed(() => !!productId.value)

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const errors = reactive({ name: '', category: '' })

const categories = ref([])
const brands = ref([])
const colors = ref([])
const tagsInput = ref('')
const slugTouched = ref(false)

const form = reactive({
  name: '',
  slug: '',
  category: '',
  brand: '',
  shortDescription: '',
  description: '',
  images: [],
  thumbnail: '',
  specs: [],
  variants: [],
  tags: [],
  weight: 0,
  status: 'draft',
})

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'در حال فروش', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' },
]

const categoryOptions = computed(() =>
  categories.value.map((category) => ({
    label: `${'ـ '.repeat(category.depth || 0)}${category.name}`,
    value: category._id,
  })),
)
const brandOptions = computed(() => brands.value.map((brand) => ({ label: brand.name, value: brand._id })))

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function autoSlug() {
  if (!slugTouched.value && !form.slug) {
    form.slug = slugify(form.name)
  }
}

function addSpec() {
  form.specs.push({ key: '', value: '', unit: '' })
}
function removeSpec(index) {
  form.specs.splice(index, 1)
}

function validate() {
  errors.name = form.name.trim() ? '' : 'نام محصول الزامی است'
  errors.category = form.category ? '' : 'انتخاب دسته‌بندی الزامی است'
  return !errors.name && !errors.category
}

function buildPayload() {
  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const specs = form.specs.filter((s) => s.key.trim() && s.value.trim())

  const variants = form.variants.map((variant) => {
    const payload = {
      sku: variant.sku || undefined,
      price: Number(variant.price) || 0,
      comparePrice: variant.comparePrice ? Number(variant.comparePrice) : undefined,
      stock: Number(variant.stock) || 0,
      isActive: variant.isActive !== false,
      attributes: (variant.attributes || [])
        .filter((a) => a.value)
        .map((a) => ({ key: a.key, value: a.value })),
    }
    if (variant._id) payload._id = variant._id
    return payload
  })

  return {
    name: form.name.trim(),
    slug: form.slug ? slugify(form.slug) : undefined,
    category: form.category,
    brand: form.brand || undefined,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    images: form.images,
    thumbnail: form.images[0] || undefined,
    specs,
    variants,
    tags,
    weight: Number(form.weight) || 0,
    status: form.status,
  }
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  loadError.value = ''
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await productService.update(productId.value, payload)
    } else {
      await productService.create(payload)
    }
    router.push('/products')
  } catch (err) {
    loadError.value = err.response?.data?.message || 'ذخیره محصول با خطا مواجه شد'
  } finally {
    saving.value = false
  }
}

async function loadLookups() {
  const [categoriesRes, brandsRes, colorsRes] = await Promise.all([
    categoryService.list(),
    brandService.list(),
    colorService.list(),
  ])
  categories.value = categoriesRes.data ?? []
  brands.value = brandsRes.data ?? []
  colors.value = colorsRes.data ?? []
}

async function loadProduct() {
  if (!isEdit.value) return
  const { data } = await productService.getById(productId.value)
  form.name = data.name
  form.slug = data.slug
  form.category = data.category?._id || data.category
  form.brand = data.brand?._id || data.brand || ''
  form.shortDescription = data.shortDescription || ''
  form.description = data.description || ''
  form.images = data.images || []
  form.thumbnail = data.thumbnail || ''
  form.specs = (data.specs || []).map((s) => ({ ...s }))
  form.variants = (data.variants || []).map((v) => ({ ...v, attributes: (v.attributes || []).map((a) => ({ ...a })) }))
  form.tags = data.tags || []
  form.weight = data.weight || 0
  form.status = data.status || 'draft'
  tagsInput.value = (data.tags || []).join('، ')
  slugTouched.value = true
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadLookups(), loadProduct()])
  } catch (err) {
    loadError.value = err.response?.data?.message || 'بارگذاری اطلاعات با خطا مواجه شد'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.product-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.product-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.product-form__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.product-form__header-actions {
  display: flex;
  gap: 10px;
}
.product-form__error {
  font-size: 13px;
  color: #D9534F;
  background: rgba(217, 83, 79, .12);
  border: 1px solid rgba(217, 83, 79, .3);
  border-radius: 10px;
  padding: 12px 14px;
}
.product-form__loading {
  padding: 60px;
  text-align: center;
  color: var(--text-secondary);
}
.product-form__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 1180px) {
  .product-form__grid {
    grid-template-columns: 1fr;
  }
}
.product-form__main,
.product-form__side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.product-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
@media (max-width: 640px) {
  .product-form__row {
    grid-template-columns: 1fr;
  }
}
.product-form__spec-row {
  display: grid;
  grid-template-columns: 1fr 1fr 100px 32px;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
@media (max-width: 640px) {
  .product-form__spec-row {
    grid-template-columns: 1fr;
  }
}
.product-form__spec-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.product-form__spec-remove:hover {
  color: #D9534F;
}
.product-form__hint {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--text-secondary);
}
</style>
