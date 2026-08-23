<template>
  <div class="discount-list-page px-4 py-6 max-w-7xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-text-primary">تخفیف‌ها</h1>
        <p class="text-xs text-text-disabled mt-1">مدیریت تخفیف‌های زمان‌دار و کدهای تخفیف</p>
      </div>
      <RouterLink to="/discounts/create"
        class="add-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        تخفیف جدید
      </RouterLink>
    </div>

    <!-- Kind filter tabs -->
    <div class="flex gap-2 mb-5">
      <button v-for="tab in tabs" :key="tab.value"
        @click="setKindFilter(tab.value)"
        class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="kindFilter === tab.value ? 'tab-btn--on' : 'tab-btn--off'">
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <!-- Empty state -->
    <div v-else-if="!discounts?.length" class="flex flex-col items-center justify-center py-20 text-center">
      <svg class="w-12 h-12 text-text-disabled mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
      </svg>
      <p class="text-text-secondary font-semibold">تخفیفی یافت نشد</p>
      <RouterLink to="/discounts/create" class="text-primary text-sm mt-2 hover:underline">اولین تخفیف را ایجاد کنید</RouterLink>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead>
          <tr class="table-head-row">
            <th class="th">نوع</th>
            <th class="th">عنوان</th>
            <th class="th">مقدار</th>
            <th class="th">شروع (شمسی)</th>
            <th class="th">پایان (شمسی)</th>
            <th class="th">وضعیت</th>
            <th class="th">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in discounts" :key="d._id" class="table-row border-t border-border">

            <!-- Kind badge -->
            <td class="td">
              <span v-if="resolveKind(d) === 'timed'"
                    class="kind-badge kind-badge--timed">🔴 زمان‌دار</span>
              <span v-else
                    class="kind-badge kind-badge--all">🟢 همه</span>
            </td>

            <!-- Title -->
            <td class="td font-medium text-text-primary">{{ d.title }}</td>

            <!-- Value -->
            <td class="td text-text-secondary font-fanum dir-ltr">
              <span v-if="d.discountType === 'percentage' || d.type === 'percentage'">{{ d.value }}٪</span>
              <span v-else>{{ d.value?.toLocaleString('fa-IR') ?? '—' }} تومان</span>
            </td>

            <!-- Start date -->
            <td class="td text-text-disabled font-fanum text-xs">
              {{ d.startDate ? utcToJalali(d.startDate) : '—' }}
            </td>

            <!-- End date -->
            <td class="td text-text-disabled font-fanum text-xs">
              {{ d.endDate ? utcToJalali(d.endDate) : '—' }}
            </td>

            <!-- Status -->
            <td class="td">
              <span :class="['status-badge', statusClass(d)]">
                {{ statusLabel(d) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="td">
              <div class="flex items-center gap-2">
                <!-- Edit -->
                <RouterLink :to="`/discounts/${d._id}/edit`"
                  class="action-btn action-btn--edit" title="ویرایش">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </RouterLink>

                <!-- Toggle -->
                <button @click="toggleDiscount(d)"
                  :disabled="toggling === d._id"
                  class="action-btn" :class="d.isActive ? 'action-btn--on' : 'action-btn--off'"
                  :title="d.isActive ? 'غیرفعال کردن' : 'فعال کردن'">
                  <svg v-if="toggling === d._id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </button>

                <!-- Delete -->
                <button @click="confirmDelete(d)" class="action-btn action-btn--del" title="حذف">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
      <button v-for="p in totalPages" :key="p"
        @click="goPage(p)"
        class="page-btn"
        :class="p === currentPage ? 'page-btn--on' : 'page-btn--off'">
        {{ p }}
      </button>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget"
          class="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style="background: rgba(2,8,23,0.82);"
          @click.self="deleteTarget = null">
          <div class="bg-card rounded-2xl p-6 w-full max-w-sm border border-border">
            <h3 class="font-bold text-text-primary mb-2">حذف تخفیف</h3>
            <p class="text-sm text-text-secondary mb-5">
              آیا از حذف تخفیف «<span class="text-text-primary font-semibold">{{ deleteTarget.title }}</span>» مطمئن هستید؟
              <br><span class="text-xs text-text-disabled mt-1 block">تخفیف غیرفعال می‌شود و دیگر اعمال نمی‌گردد.</span>
            </p>
            <div class="flex gap-3">
              <button @click="doDelete" :disabled="deleting"
                class="flex-1 h-10 rounded-xl bg-danger text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                {{ deleting ? 'در حال حذف...' : 'حذف' }}
              </button>
              <button @click="deleteTarget = null"
                class="flex-1 h-10 rounded-xl border border-border text-text-secondary text-sm hover:bg-surface transition-all">
                انصراف
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { discountService } from '@/services/discount.service'
import { useUiStore } from '@/stores/ui.store'
import { utcToJalali } from '@/utils/dateUtils'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

const discounts  = ref([])
const total      = ref(0)
const totalPages = ref(1)
const loading    = ref(false)
const toggling   = ref(null)
const deleting   = ref(false)
const deleteTarget = ref(null)

const tabs = [
  { value: '',             label: 'همه' },
  { value: 'time_limited', label: '🔴 زمان‌دار' },
  { value: 'coupon',       label: '🏷️ کوپن' },
]

const currentPage  = computed(() => Number(route.query.page  || 1))
const kindFilter   = computed(() => route.query.kind || '')

async function load() {
  loading.value = true
  try {
    const { data } = await discountService.getAll({
      page:  currentPage.value,
      limit: 15,
      ...(kindFilter.value && { kind: kindFilter.value }),
    })
    discounts.value  = data?.discounts ?? data?.coupons ?? data?.items ?? []
    total.value      = data?.total ?? 0
    totalPages.value = data?.totalPages ?? (Math.ceil((data?.total ?? 0) / 15) || 1)
  } catch (err) {
    ui.addToast('خطا در بارگذاری تخفیف‌ها', 'error')
  } finally {
    loading.value = false
  }
}

function setKindFilter(val) {
  router.replace({ query: { ...route.query, kind: val || undefined, page: undefined } })
}

function goPage(p) {
  router.replace({ query: { ...route.query, page: p } })
}

async function toggleDiscount(d) {
  toggling.value = d._id
  try {
    const { data } = await discountService.toggle(d._id)
    const idx = discounts.value.findIndex(x => x._id === d._id)
    if (idx !== -1) discounts.value[idx] = data
    ui.addToast(data.isActive ? 'تخفیف فعال شد' : 'تخفیف غیرفعال شد', 'success')
  } catch {
    ui.addToast('خطا در تغییر وضعیت', 'error')
  } finally {
    toggling.value = null
  }
}

function confirmDelete(d) { deleteTarget.value = d }

async function doDelete() {
  deleting.value = true
  try {
    await discountService.softDelete(deleteTarget.value._id)
    ui.addToast('تخفیف حذف شد', 'success')
    deleteTarget.value = null
    await load()
  } catch {
    ui.addToast('خطا در حذف تخفیف', 'error')
  } finally {
    deleting.value = false
  }
}

// Determines badge type from startDate with backward-compat fallback to the
// deprecated `kind` field.
function resolveKind(d) {
  if (d.kind === 'time_limited' || d.startDate) return 'timed'
  return 'all'
}

function statusClass(d) {
  if (!d.isActive) return 'status-badge--off'
  const now = Date.now()
  if (d.code) return 'status-badge--active'
  if (!d.startDate || !d.endDate) return 'status-badge--active'
  const start = new Date(d.startDate).getTime()
  const end   = new Date(d.endDate).getTime()
  if (now > end)   return 'status-badge--expired'
  if (now < start) return 'status-badge--scheduled'
  return 'status-badge--active'
}

function statusLabel(d) {
  if (!d.isActive) return '⚫ غیرفعال'
  const now = Date.now()
  if (d.code) return '🟢 فعال'
  if (!d.startDate || !d.endDate) return '🟢 فعال'
  const start = new Date(d.startDate).getTime()
  const end   = new Date(d.endDate).getTime()
  if (now > end)   return '🔴 منقضی'
  if (now < start) return '🟡 برنامه‌ریزی'
  return '🟢 فعال'
}

watch([currentPage, kindFilter], load)
onMounted(load)
</script>

<style scoped>
.add-btn {
  background: linear-gradient(135deg, #1B4F8A, #3B6FBE);
  color: white;
  box-shadow: 0 4px 14px rgba(27,79,138,0.4);
}
.add-btn:hover { opacity: 0.9; }

.tab-btn--on  { background: rgba(27,79,138,0.15); color: #3B6FBE; border: 1.5px solid rgba(27,79,138,0.3); }
.tab-btn--off { border: 1.5px solid var(--color-border); color: var(--color-text-secondary); }
.tab-btn--off:hover { border-color: rgba(27,79,138,0.3); color: #3B6FBE; }

.table-head-row { background: rgba(27,79,138,0.06); }
.th { padding: 0.75rem 1rem; text-align: right; font-size: 0.75rem; font-weight: 600; color: var(--color-text-disabled); white-space: nowrap; }
.td { padding: 0.75rem 1rem; }
.table-row:hover { background: rgba(27,79,138,0.03); }

.kind-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.kind-badge--timed { background: rgba(239,68,68,0.1);  color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.kind-badge--all   { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }

.status-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.status-badge--active    { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.status-badge--scheduled { background: rgba(245,158,11,0.1);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
.status-badge--expired   { background: rgba(239,68,68,0.1);   color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.status-badge--off       { background: rgba(107,114,128,0.1); color: #6b7280; border: 1px solid rgba(107,114,128,0.2); }

.action-btn { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.action-btn--edit { color: #3B6FBE; background: rgba(27,79,138,0.08); }
.action-btn--edit:hover { background: rgba(27,79,138,0.18); }
.action-btn--on  { color: #10b981; background: rgba(16,185,129,0.1); }
.action-btn--on:hover  { background: rgba(16,185,129,0.2); }
.action-btn--off { color: #6b7280; background: rgba(107,114,128,0.08); }
.action-btn--off:hover { background: rgba(107,114,128,0.15); }
.action-btn--del { color: #ef4444; background: rgba(239,68,68,0.06); }
.action-btn--del:hover { background: rgba(239,68,68,0.14); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.page-btn { width: 32px; height: 32px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; }
.page-btn--on  { background: linear-gradient(135deg, #1B4F8A, #3B6FBE); color: white; }
.page-btn--off { border: 1px solid var(--color-border); color: var(--color-text-secondary); }
.page-btn--off:hover { border-color: rgba(27,79,138,0.4); color: #3B6FBE; }

.dir-ltr { direction: ltr; text-align: right; }

.text-danger { color: #ef4444; }
.bg-danger   { background-color: #ef4444; }

.modal-enter-active { transition: all 0.2s ease; }
.modal-leave-active { transition: all 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
