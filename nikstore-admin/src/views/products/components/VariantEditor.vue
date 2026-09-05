<template>
  <div class="variant-editor">
    <div v-if="!variants.length" class="variant-editor__empty">
      هنوز ترکیبی (رنگ/سایز) اضافه نشده است.
    </div>

    <div v-for="(variant, index) in variants" :key="variant._id || variant.key" class="variant-row">
      <div class="variant-row__grid">
        <AdminSelect
          label="رنگ"
          placeholder="بدون رنگ"
          :options="colorOptions"
          :model-value="getAttr(variant, 'رنگ')"
          @update:model-value="setAttr(variant, 'رنگ', $event)"
        />
        <AdminInput
          label="سایز"
          placeholder="مثلاً M یا 42"
          :model-value="getAttr(variant, 'سایز')"
          @update:model-value="setAttr(variant, 'سایز', $event)"
        />
        <AdminInput label="کد انبار (SKU)" v-model="variant.sku" placeholder="اختیاری" />
        <AdminInput label="قیمت (تومان)" type="number" v-model.number="variant.price" />
        <AdminInput label="قیمت قبل از تخفیف" type="number" v-model.number="variant.comparePrice" placeholder="اختیاری" />
        <AdminInput label="موجودی" type="number" v-model.number="variant.stock" />
      </div>

      <div class="variant-row__footer">
        <label class="variant-row__active">
          <input type="checkbox" v-model="variant.isActive">
          فعال
        </label>
        <AdminButton variant="ghost" size="sm" icon="trash" @click="removeVariant(index)">
          حذف
        </AdminButton>
      </div>
    </div>

    <AdminButton variant="secondary" size="sm" icon="plus" @click="addVariant">
      افزودن ترکیب
    </AdminButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AdminInput from '../../../components/common/AdminInput.vue'
import AdminSelect from '../../../components/common/AdminSelect.vue'
import AdminButton from '../../../components/common/AdminButton.vue'

const props = defineProps({
  colors: { type: Array, default: () => [] },
})

const variants = defineModel({ type: Array, default: () => [] })

const colorOptions = computed(() => props.colors.map((color) => ({ label: color.name, value: color.name })))

function getAttr(variant, key) {
  return variant.attributes?.find((attr) => attr.key === key)?.value ?? ''
}

function setAttr(variant, key, value) {
  if (!variant.attributes) variant.attributes = []
  const existing = variant.attributes.find((attr) => attr.key === key)
  if (existing) {
    existing.value = value
  } else if (value) {
    variant.attributes.push({ key, value })
  }
}

function addVariant() {
  variants.value = [
    ...variants.value,
    {
      key: `new-${Date.now()}-${variants.value.length}`,
      sku: '',
      price: 0,
      comparePrice: null,
      stock: 0,
      isActive: true,
      attributes: [],
      images: [],
    },
  ]
}

function removeVariant(index) {
  variants.value = variants.value.filter((_, i) => i !== index)
}
</script>

<style scoped>
.variant-editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.variant-editor__empty {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 16px;
  text-align: center;
  border-radius: 12px;
  border: 1px dashed var(--glass-border);
}
.variant-row {
  border-radius: 14px;
  padding: 16px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.variant-row__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
@media (max-width: 1180px) {
  .variant-row__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 720px) {
  .variant-row__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.variant-row__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
}
.variant-row__active {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
</style>
