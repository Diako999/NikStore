<template>
  <AdminModal
    :model-value="modelValue"
    :title="`دسترسی‌های ${managerName}`"
    size="md"
    @close="$emit('update:modelValue', false)"
  >
    <div class="space-y-5">

      <!-- Select all row -->
      <div class="flex items-center justify-between pb-3 border-b border-border">
        <span class="text-sm text-text-secondary font-medium">
          {{ activeCount }} از {{ totalCount }} دسترسی فعال
        </span>
        <div class="flex gap-2">
          <button @click="selectAll" class="text-xs text-primary hover:underline font-medium">
            انتخاب همه
          </button>
          <span class="text-text-disabled">|</span>
          <button @click="clearAll" class="text-xs text-text-secondary hover:text-text-primary hover:underline">
            پاک کردن
          </button>
        </div>
      </div>

      <!-- Permission groups -->
      <div v-for="group in permissionGroups" :key="group.label" class="space-y-2">
        <p class="text-xs font-bold text-text-disabled uppercase tracking-wider px-1">
          {{ group.label }}
        </p>

        <!-- Simple permissions (no sub-actions) — 2-col grid -->
        <div v-if="group.simpleItems.length" class="grid grid-cols-2 gap-2">
          <label
            v-for="perm in group.simpleItems"
            :key="perm.key"
            :class="[
              'flex items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer',
              'transition-all duration-150 select-none',
              selected.includes(perm.key)
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-border hover:border-primary/40',
            ]"
          >
            <input type="checkbox" :value="perm.key" v-model="selected" class="sr-only"/>
            <div :class="[
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150',
              selected.includes(perm.key) ? 'bg-primary border-primary' : 'border-border',
            ]">
              <svg v-if="selected.includes(perm.key)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm flex items-center gap-1.5 text-text-primary">
              <span>{{ perm.icon }}</span>{{ perm.label }}
            </span>
          </label>
        </div>

        <!-- Complex permissions (with sub-actions) — full-width cards -->
        <div
          v-for="perm in group.complexItems"
          :key="perm.key"
          :class="[
            'rounded-xl border-2 overflow-hidden transition-all duration-150',
            isSectionActive(perm)
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-border',
          ]"
        >
          <!-- Section header -->
          <div class="flex items-center justify-between px-3 py-2.5">
            <span class="text-sm font-semibold flex items-center gap-1.5 text-text-primary">
              <span>{{ perm.icon }}</span>{{ perm.label }}
            </span>
            <button
              type="button"
              @click="toggleSection(perm)"
              :class="[
                'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                isSectionAllSelected(perm)
                  ? 'bg-primary/15 text-primary hover:bg-primary/25'
                  : 'bg-surface text-text-secondary hover:text-primary hover:bg-primary/10',
              ]"
            >
              {{ isSectionAllSelected(perm) ? 'حذف همه' : 'انتخاب همه' }}
            </button>
          </div>

          <!-- Action chips -->
          <div class="flex flex-wrap gap-2 px-3 pb-3">
            <label
              v-for="action in perm.actions"
              :key="action.key"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer',
                'text-xs font-medium transition-all duration-150 select-none',
                selected.includes(`${perm.key}:${action.key}`)
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:border-primary/50 hover:text-primary',
              ]"
            >
              <input
                type="checkbox"
                :value="`${perm.key}:${action.key}`"
                v-model="selected"
                class="sr-only"
              />
              <svg v-if="selected.includes(`${perm.key}:${action.key}`)" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              {{ action.label }}
            </label>
          </div>
        </div>

      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <AdminButton variant="ghost" class="flex-1" @click="$emit('update:modelValue', false)">
          انصراف
        </AdminButton>
        <AdminButton :loading="saving" class="flex-1" @click="save">
          ذخیره دسترسی‌ها
        </AdminButton>
      </div>
    </template>
  </AdminModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { userService }       from '@/services/user.service'
import { useUiStore }        from '@/stores/ui.store'
import { PANEL_PERMISSIONS } from '@/utils/constants'
import AdminModal  from '@/components/common/AdminModal.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user:       { type: Object,  default: null  },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const ui   = useUiStore()

const saving   = ref(false)
const selected = ref([])

const managerName = computed(() => {
  if (!props.user) return ''
  const name = [props.user.firstName, props.user.lastName].filter(Boolean).join(' ')
  return name || props.user.phone
})

// ── Group helpers ──────────────────────────────────────────────────────────

const permissionGroups = computed(() => {
  const groups = {}
  for (const p of PANEL_PERMISSIONS) {
    if (!groups[p.group]) groups[p.group] = { label: p.group, simpleItems: [], complexItems: [] }
    if (p.actions?.length) groups[p.group].complexItems.push(p)
    else                   groups[p.group].simpleItems.push(p)
  }
  return Object.values(groups)
})

/** All individual keys a section expands to (e.g. ['products:view', 'products:edit', ...]) */
function sectionActionKeys(perm) {
  return (perm.actions ?? []).map(a => `${perm.key}:${a.key}`)
}

function isSectionAllSelected(perm) {
  const keys = sectionActionKeys(perm)
  return keys.length > 0 && keys.every(k => selected.value.includes(k))
}

function isSectionActive(perm) {
  return sectionActionKeys(perm).some(k => selected.value.includes(k))
}

function toggleSection(perm) {
  const keys = sectionActionKeys(perm)
  if (isSectionAllSelected(perm)) {
    selected.value = selected.value.filter(k => !keys.includes(k))
  } else {
    const rest = selected.value.filter(k => !keys.includes(k))
    selected.value = [...rest, ...keys]
  }
}

// ── Total count for the "X از Y" header ────────────────────────────────────

const totalCount = computed(() =>
  PANEL_PERMISSIONS.reduce((sum, p) => sum + (p.actions?.length ?? 1), 0)
)

const activeCount = computed(() => selected.value.length)

// ── Select / clear all ─────────────────────────────────────────────────────

function selectAll() {
  const all = []
  for (const p of PANEL_PERMISSIONS) {
    if (p.actions?.length) all.push(...sectionActionKeys(p))
    else                   all.push(p.key)
  }
  selected.value = all
}

function clearAll() {
  selected.value = []
}

// ── Sync with user prop ────────────────────────────────────────────────────

watch(() => props.modelValue, (open) => {
  if (open && props.user) {
    selected.value = [...(props.user.permissions ?? [])]
  }
})

// ── Save ───────────────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  try {
    const { data } = await userService.setPermissions(props.user._id, selected.value)
    ui.addToast(`دسترسی‌های «${managerName.value}» به‌روز شد`, 'success')
    emit('saved', data)
    emit('update:modelValue', false)
  } catch (err) {
    const msg = err.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره دسترسی‌ها'), 'error')
  } finally {
    saving.value = false
  }
}
</script>
