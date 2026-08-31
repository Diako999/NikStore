<template>
  <div>
    <h3 class="font-bold text-glass-text-primary mb-4">مشخصات کلی</h3>

    <table class="w-full text-sm">
      <tbody>
        <tr
          v-for="spec in generalSpecs"
          :key="spec.key"
          class="border-b border-glass-border"
        >
          <td class="py-3 pr-0 pl-6 text-glass-text-secondary w-1/3 font-medium">{{ spec.label }}</td>
          <td class="py-3 text-glass-text-primary font-medium">{{ spec.value }}</td>
        </tr>
        <tr
          v-for="(value, key) in variantAttributes"
          :key="key"
          class="border-b border-glass-border"
        >
          <td class="py-3 pr-0 pl-6 text-glass-text-secondary w-1/3 font-medium">{{ key }}</td>
          <td class="py-3 text-glass-text-primary font-medium">{{ value }}</td>
        </tr>
      </tbody>
    </table>

    <!-- All color variants table -->
    <div v-if="product?.variants?.length > 1" class="mt-6">
      <h3 class="font-bold text-glass-text-primary mb-4">تنوع رنگ موجود</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border border-glass-border rounded-xl overflow-hidden">
          <thead class="bg-glass">
            <tr>
              <th class="py-2 px-4 text-right text-glass-text-secondary font-medium">رنگ</th>
              <th class="py-2 px-4 text-right text-glass-text-secondary font-medium">قیمت</th>
              <th class="py-2 px-4 text-right text-glass-text-secondary font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="v in product.variants"
              :key="v._id"
              class="border-t border-glass-border"
            >
              <td class="py-2 px-4">{{ normalizeAttrs(v.attributes)['رنگ'] || '—' }}</td>
              <td class="py-2 px-4 font-fanum">{{ formatPrice(v.price) }}</td>
              <td class="py-2 px-4">
                <BaseBadge :variant="v.stock > 0 ? 'green' : 'red'" size="sm">
                  {{ v.stock > 0 ? 'موجود' : 'ناموجود' }}
                </BaseBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from '~/components/common/BaseBadge.vue'
import { formatPrice } from '~/utils/formatters'

const props = defineProps({
  product: { type: Object, default: null },
})

const generalSpecs = computed(() => {
  const p = props.product
  if (!p) return []
  const specs = []
  if (p.category?.name) specs.push({ label: 'دسته‌بندی', value: p.category.name })
  if (p.totalStock > 0)  specs.push({ label: 'موجودی',    value: `${p.totalStock} عدد` })
  if (p.reviewCount > 0) specs.push({ label: 'تعداد نظرات', value: `${p.reviewCount} نظر` })
  if (p.viewCount > 0)   specs.push({ label: 'بازدید',    value: `${p.viewCount} بازدید` })
  return specs
})

function normalizeAttrs(raw) {
  if (!raw) return {}
  if (Array.isArray(raw)) {
    const obj = {}
    for (const a of raw) if (a.key) obj[a.key] = a.value
    return obj
  }
  return raw
}

const variantAttributes = computed(() => {
  const attrs = normalizeAttrs(props.product?.variants?.[0]?.attributes)
  const result = {}
  for (const [k, v] of Object.entries(attrs)) {
    if (k !== 'رنگ') result[k] = v
  }
  return result
})
</script>
