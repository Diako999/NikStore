<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">دسته‌بندی‌ها</h1>
        <p class="text-text-secondary text-sm mt-0.5 font-fanum">{{ flatList.length }} دسته‌بندی</p>
      </div>
      <AdminButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        افزودن دسته‌بندی
      </AdminButton>
    </div>

    <!-- Toolbar -->
    <div class="admin-card">
      <div class="flex gap-3 items-center flex-wrap">
        <AdminInput v-model="search" placeholder="جستجو در نام دسته‌بندی..." prepend="🔍" class="flex-1 min-w-[200px]" />
        <AdminButton variant="secondary" @click="loadTree" :loading="loading">
          <svg :class="['w-4 h-4', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          بارگذاری مجدد
        </AdminButton>
      </div>
    </div>

    <!-- Tree table -->
    <div class="admin-card p-0 overflow-hidden">
      <table class="w-full text-sm text-right">
        <thead class="bg-surface border-b border-border">
          <tr>
            <th class="px-4 py-3 text-text-secondary font-medium">نام دسته‌بندی</th>
            <th class="px-4 py-3 text-text-secondary font-medium w-32">والد</th>
            <th class="px-4 py-3 text-text-secondary font-medium text-center w-24">محصولات</th>
            <th class="px-4 py-3 text-text-secondary font-medium text-center w-24">ترتیب</th>
            <th class="px-4 py-3 text-text-secondary font-medium text-center w-24">وضعیت</th>
            <th class="px-4 py-3 w-20"></th>
          </tr>
        </thead>

        <!-- Loading -->
        <tbody v-if="loading">
          <tr v-for="i in 6" :key="i" class="border-b border-border">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <AdminSkeleton width="32px" height="32px" class="rounded-lg flex-shrink-0" />
                <div>
                  <AdminSkeleton height="1rem" width="120px" class="mb-1.5" />
                  <AdminSkeleton height="0.7rem" width="80px" />
                </div>
              </div>
            </td>
            <td class="px-4 py-3"><AdminSkeleton height="1rem" width="80px" /></td>
            <td class="px-4 py-3 text-center"><AdminSkeleton height="1rem" width="30px" class="mx-auto" /></td>
            <td class="px-4 py-3 text-center"><AdminSkeleton height="1rem" width="24px" class="mx-auto" /></td>
            <td class="px-4 py-3 text-center"><AdminSkeleton height="22px" width="50px" class="mx-auto rounded-full" /></td>
            <td class="px-4 py-3"></td>
          </tr>
        </tbody>

        <!-- Empty -->
        <tbody v-else-if="filteredRows.length === 0">
          <tr>
            <td colspan="6" class="py-16 text-center text-text-disabled">
              <div class="text-4xl mb-2">📂</div>
              <p>{{ search ? 'دسته‌ای با این نام یافت نشد' : 'دسته‌بندی‌ای ثبت نشده' }}</p>
            </td>
          </tr>
        </tbody>

        <!-- Rows -->
        <tbody v-else>
          <template v-for="row in filteredRows" :key="row.category._id">
            <CategoryTreeRow
              :category="row.category"
              :depth="row.depth"
              :expanded="expandedIds.has(row.category._id)"
              @toggle-expand="toggleExpand"
              @edit="openEdit"
              @delete="confirmDelete"
            />
          </template>
        </tbody>
      </table>
    </div>

    <!-- Form modal -->
    <CategoryFormModal
      v-model="modalOpen"
      :category="editingCategory"
      :parent-options="allParentOptions"
      @saved="onSaved"
    />

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="deleteDialog.open"
      title="حذف دسته‌بندی"
      :message="`آیا از حذف دسته «${deleteDialog.category?.name}» مطمئنید؟`"
      confirm-label="بله، حذف شود"
      confirm-variant="danger"
      :loading="deleteDialog.loading"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { categoryService } from '@/services/category.service'
import { useUiStore }      from '@/stores/ui.store'

import CategoryFormModal from './components/CategoryFormModal.vue'
import CategoryTreeRow   from './components/CategoryTreeRow.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'
import AdminConfirm  from '@/components/common/AdminConfirm.vue'

const ui = useUiStore()

const tree       = ref([])
const loading    = ref(true)
const search     = ref('')
const expandedIds = ref(new Set())
const modalOpen  = ref(false)
const editingCategory = ref(null)
const deleteDialog    = ref({ open: false, category: null, loading: false })

// ── Flatten tree (DFS) ────────────────────────────
function flattenTree(nodes, depth = 0) {
  const result = []
  for (const node of nodes) {
    result.push({ category: node, depth })
    if (node.children?.length && expandedIds.value.has(node._id)) {
      result.push(...flattenTree(node.children, depth + 1))
    }
  }
  return result
}

// All nodes flat (for count + search)
const flatList = computed(() => {
  const result = []
  function flatten(nodes) {
    for (const n of nodes) {
      result.push(n)
      if (n.children?.length) flatten(n.children)
    }
  }
  flatten(tree.value)
  return result
})

const filteredRows = computed(() => {
  if (!search.value.trim()) return flattenTree(tree.value)
  const q = search.value.trim().toLowerCase()
  return flatList.value
    .filter(c => c.name.toLowerCase().includes(q))
    .map(c => ({ category: c, depth: c.parentId ? 1 : 0 }))
})

const allParentOptions = computed(() => {
  const result = []
  function walk(nodes, depth = 0) {
    for (const n of nodes) {
      const prefix = depth === 0 ? '' : ('　'.repeat(depth - 1) + '└ ')
      result.push({ value: n._id, label: prefix + n.name })
      if (n.children?.length) walk(n.children, depth + 1)
    }
  }
  walk(tree.value)
  return result
})

// ── Load ──────────────────────────────────────────
async function loadTree() {
  loading.value = true
  try {
    const { data } = await categoryService.getTree()
    tree.value = Array.isArray(data) ? data : []
    // Expand all root nodes that have children
    const newSet = new Set(expandedIds.value)
    tree.value.forEach(c => { if (c.children?.length) newSet.add(c._id) })
    expandedIds.value = newSet
  } catch {
    ui.addToast('خطا در بارگذاری دسته‌بندی‌ها', 'error')
  } finally {
    loading.value = false
  }
}

// ── Actions ───────────────────────────────────────
function toggleExpand(id) {
  const s = new Set(expandedIds.value)
  if (s.has(id)) s.delete(id)
  else            s.add(id)
  expandedIds.value = s   // reassign for Vue reactivity
}

function openCreate() {
  editingCategory.value = null
  modalOpen.value = true
}

function openEdit(category) {
  editingCategory.value = category
  modalOpen.value = true
}

function onSaved() { loadTree() }

function confirmDelete(category) {
  deleteDialog.value = { open: true, category, loading: false }
}

async function doDelete() {
  const cat = deleteDialog.value.category
  deleteDialog.value.loading = true
  try {
    await categoryService.remove(cat._id)
    ui.addToast(`دسته «${cat.name}» حذف شد`, 'success')
    deleteDialog.value.open = false
    loadTree()
  } catch (err) {
    ui.addToast(err.response?.data?.message ?? 'خطا در حذف دسته‌بندی', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

onMounted(loadTree)
</script>
