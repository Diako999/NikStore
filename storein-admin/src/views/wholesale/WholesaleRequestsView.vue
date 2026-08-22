<template>
  <div class="p-6">

    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="page-title">درخواست‌های عمده‌فروشی</h1>
      <div class="flex gap-2">
        <button
          v-for="s in statusTabs"
          :key="s.value"
          @click="currentStatus = s.value; fetchRequests()"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            currentStatus === s.value
              ? 'bg-primary text-[#171717]'
              : 'bg-surface text-text-secondary hover:bg-surface-hover',
          ]"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-xl skeleton" />
    </div>

    <!-- Table -->
    <div v-else class="admin-card overflow-hidden p-0">
      <table class="w-full text-sm">
        <thead class="border-b border-border">
          <tr class="text-text-secondary text-xs">
            <th class="text-right px-4 py-3 font-medium">کاربر</th>
            <th class="text-right px-4 py-3 font-medium">شرکت</th>
            <th class="text-right px-4 py-3 font-medium">کد ملی</th>
            <th class="text-right px-4 py-3 font-medium hidden md:table-cell">توضیحات</th>
            <th class="text-right px-4 py-3 font-medium">تاریخ</th>
            <th class="text-right px-4 py-3 font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="req in requests"
            :key="req._id"
            class="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="font-medium text-text-primary">{{ req.firstName }} {{ req.lastName }}</div>
              <div class="text-text-disabled text-xs font-fanum">{{ req.phone }}</div>
            </td>
            <td class="px-4 py-3 text-text-primary">{{ req.wholesaleCompanyName }}</td>
            <td class="px-4 py-3 font-fanum text-text-secondary">{{ req.wholesaleNationalId }}</td>
            <td class="px-4 py-3 text-text-secondary max-w-xs truncate hidden md:table-cell">
              {{ req.wholesaleDescription || '—' }}
            </td>
            <td class="px-4 py-3 text-text-disabled text-xs font-fanum">
              {{ new Date(req.createdAt).toLocaleDateString('fa-IR') }}
            </td>
            <td class="px-4 py-3">
              <!-- pending: approve + reject -->
              <div v-if="currentStatus === 'pending'" class="flex gap-2">
                <button
                  @click="handleAction(req._id, 'approve')"
                  :disabled="actionLoading === req._id"
                  class="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  ✓ تأیید
                </button>
                <button
                  @click="openReject(req._id)"
                  :disabled="actionLoading === req._id"
                  class="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  ✕ رد
                </button>
              </div>

              <!-- approved: status + revoke button -->
              <div v-else-if="currentStatus === 'approved'" class="flex items-center gap-2 flex-wrap">
                <span class="text-green-600 text-xs font-bold">✓ تأیید شده</span>
                <button
                  @click="openRevoke(req._id, req.firstName, req.lastName, req.phone)"
                  :disabled="actionLoading === req._id"
                  class="text-xs px-2.5 py-1 rounded-lg border border-orange-400 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                >
                  لغو دسترسی
                </button>
              </div>

              <!-- rejected -->
              <span v-else class="text-red-500 text-xs font-bold">✕ رد شده</span>
            </td>
          </tr>
          <tr v-if="!requests.length && !loading">
            <td colspan="6" class="text-center py-16 text-text-disabled">
              درخواستی یافت نشد
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal رد کردن -->
    <Teleport to="body">
      <div v-if="rejectModal.open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 class="font-bold text-text-primary mb-4">دلیل رد درخواست</h3>
          <textarea
            v-model="rejectModal.reason"
            class="w-full border border-border rounded-xl p-3 text-sm resize-none mb-4 bg-surface text-text-primary"
            rows="3"
            placeholder="دلیل را وارد کنید (اختیاری)"
          />
          <div class="flex gap-3">
            <button
              @click="confirmReject"
              class="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors"
            >
              تأیید رد
            </button>
            <button
              @click="rejectModal.open = false"
              class="flex-1 border border-border py-2.5 rounded-xl text-text-secondary hover:bg-surface transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal لغو دسترسی -->
    <Teleport to="body">
      <div v-if="revokeModal.open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-text-primary">لغو دسترسی عمده</h3>
              <p class="text-text-secondary text-sm mt-0.5">
                {{ revokeModal.name || revokeModal.phone }}
              </p>
            </div>
          </div>
          <p class="text-text-secondary text-sm mb-5 leading-relaxed">
            با لغو دسترسی، این کاربر دیگر قیمت عمده را نخواهد دید و از گروه خریداران عمده خارج می‌شود.
            کاربر می‌تواند مجدداً درخواست ثبت کند.
          </p>
          <div class="flex gap-3">
            <button
              @click="confirmRevoke"
              :disabled="actionLoading !== null"
              class="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              بله، لغو شود
            </button>
            <button
              @click="revokeModal.open = false"
              class="flex-1 border border-border py-2.5 rounded-xl text-text-secondary hover:bg-surface transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/services/http.service'
import { useUiStore } from '@/stores/ui.store'

const ui            = useUiStore()
const requests      = ref([])
const loading       = ref(false)
const actionLoading = ref(null)
const currentStatus = ref('pending')

const rejectModal = reactive({ open: false, userId: null, reason: '' })
const revokeModal = reactive({ open: false, userId: null, name: '', phone: '' })

const statusTabs = [
  { value: 'pending',  label: '⏳ در انتظار' },
  { value: 'approved', label: '✓ تأیید شده' },
  { value: 'rejected', label: '✕ رد شده'    },
]

async function fetchRequests() {
  loading.value = true
  try {
    const { data } = await http.get('/admin/wholesale-requests', { params: { status: currentStatus.value } })
    requests.value = data || []
  } catch {
    ui.addToast('خطا در بارگذاری درخواست‌ها', 'error')
  } finally {
    loading.value = false
  }
}

async function handleAction(userId, action, reason = '') {
  actionLoading.value = userId
  try {
    await http.patch(`/admin/wholesale-requests/${userId}`, { action, reason })
    const messages = { approve: 'کاربر تأیید شد ✓', reject: 'درخواست رد شد', revoke: 'دسترسی عمده لغو شد' }
    ui.addToast(messages[action] ?? 'انجام شد', 'success')
    await fetchRequests()
  } catch {
    ui.addToast('خطا در انجام عملیات', 'error')
  } finally {
    actionLoading.value = null
  }
}

function openReject(userId) {
  rejectModal.open   = true
  rejectModal.userId = userId
  rejectModal.reason = ''
}

async function confirmReject() {
  await handleAction(rejectModal.userId, 'reject', rejectModal.reason)
  rejectModal.open = false
}

function openRevoke(userId, firstName, lastName, phone) {
  revokeModal.open   = true
  revokeModal.userId = userId
  revokeModal.name   = [firstName, lastName].filter(Boolean).join(' ') || ''
  revokeModal.phone  = phone
}

async function confirmRevoke() {
  await handleAction(revokeModal.userId, 'revoke')
  revokeModal.open = false
}

onMounted(fetchRequests)
</script>
