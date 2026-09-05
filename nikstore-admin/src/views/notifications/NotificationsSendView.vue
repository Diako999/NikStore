<template>
  <div class="notify">
    <h1 class="notify__title">اعلان‌ها</h1>

    <div class="notify__grid">
      <AdminCard title="ارسال اعلان درون‌برنامه‌ای">
        <form class="notify__form" @submit.prevent="sendBroadcast">
          <AdminSelect v-model="broadcast.type" label="نوع" :options="typeOptions" />
          <AdminInput v-model="broadcast.title" label="عنوان" />
          <AdminTextarea v-model="broadcast.body" label="متن پیام" :rows="4" />
          <AdminInput v-model="broadcast.targetUserId" label="ارسال به کاربر خاص (اختیاری)" placeholder="شناسه کاربر" />
          <AdminButton type="submit" icon="send" :loading="sendingBroadcast">ارسال به همه کاربران</AdminButton>
          <p v-if="broadcastMessage" class="notify__result">{{ broadcastMessage }}</p>
        </form>
      </AdminCard>

      <AdminCard title="ارسال پیامک">
        <form class="notify__form" @submit.prevent="sendSms">
          <AdminInput v-model="sms.phone" label="شماره موبایل (اختیاری، خالی = همه)" placeholder="09xxxxxxxxx" />
          <AdminTextarea v-model="sms.message" label="متن پیامک" :rows="4" />
          <AdminButton type="submit" icon="message" :loading="sendingSms">ارسال پیامک</AdminButton>
          <p v-if="smsMessage" class="notify__result">{{ smsMessage }}</p>
        </form>
      </AdminCard>
    </div>

    <AdminCard title="تاریخچه اعلان‌های درون‌برنامه‌ای" flush>
      <AdminTable :columns="broadcastColumns" :rows="broadcastLogs" :loading="loadingLogs">
        <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
        <template #cell-actions="{ row }">
          <AdminButton variant="ghost" size="sm" icon="trash" @click="removeBroadcastLog(row)">حذف</AdminButton>
        </template>
        <template #empty>هنوز اعلانی ارسال نشده است</template>
      </AdminTable>
    </AdminCard>

    <AdminCard title="تاریخچه پیامک‌ها" flush>
      <AdminTable :columns="smsColumns" :rows="smsLogs" :loading="loadingLogs">
        <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
        <template #empty>هنوز پیامکی ارسال نشده است</template>
      </AdminTable>
    </AdminCard>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminInput from '../../components/common/AdminInput.vue'
import AdminSelect from '../../components/common/AdminSelect.vue'
import AdminTextarea from '../../components/common/AdminTextarea.vue'
import { notificationService } from '../../services/notification.service'
import { formatDateTime } from '../../utils/format'

const typeOptions = [
  { label: 'سیستمی', value: 'system' },
  { label: 'پروموشن', value: 'promo' },
  { label: 'سفارش', value: 'order_update' },
  { label: 'پرداخت', value: 'payment' },
]

const broadcastColumns = [
  { key: 'title', label: 'عنوان' },
  { key: 'body', label: 'متن' },
  { key: 'createdAt', label: 'تاریخ' },
  { key: 'actions', label: '', width: '100px', align: 'end' },
]

const smsColumns = [
  { key: 'phone', label: 'شماره' },
  { key: 'message', label: 'متن' },
  { key: 'createdAt', label: 'تاریخ' },
]

const broadcast = ref({ type: 'system', title: '', body: '', targetUserId: '' })
const sendingBroadcast = ref(false)
const broadcastMessage = ref('')

const sms = ref({ phone: '', message: '' })
const sendingSms = ref(false)
const smsMessage = ref('')

const broadcastLogs = ref([])
const smsLogs = ref([])
const loadingLogs = ref(true)

async function fetchLogs() {
  loadingLogs.value = true
  try {
    const [b, s] = await Promise.all([
      notificationService.getBroadcastLogs({ limit: 20 }),
      notificationService.getSmsLogs({ limit: 20 }),
    ])
    broadcastLogs.value = b.data?.items ?? b.data ?? []
    smsLogs.value = s.data?.items ?? s.data ?? []
  } catch {
    broadcastLogs.value = []
    smsLogs.value = []
  } finally {
    loadingLogs.value = false
  }
}

async function sendBroadcast() {
  sendingBroadcast.value = true
  broadcastMessage.value = ''
  try {
    const payload = { ...broadcast.value }
    if (!payload.targetUserId) delete payload.targetUserId
    await notificationService.sendBroadcast(payload)
    broadcastMessage.value = 'اعلان با موفقیت ارسال شد'
    broadcast.value = { type: 'system', title: '', body: '', targetUserId: '' }
    await fetchLogs()
  } catch {
    broadcastMessage.value = 'ارسال اعلان ناموفق بود'
  } finally {
    sendingBroadcast.value = false
  }
}

async function sendSms() {
  sendingSms.value = true
  smsMessage.value = ''
  try {
    const payload = { ...sms.value }
    if (!payload.phone) delete payload.phone
    await notificationService.sendSms(payload)
    smsMessage.value = 'پیامک با موفقیت ارسال شد'
    sms.value = { phone: '', message: '' }
    await fetchLogs()
  } catch {
    smsMessage.value = 'ارسال پیامک ناموفق بود'
  } finally {
    sendingSms.value = false
  }
}

async function removeBroadcastLog(row) {
  await notificationService.deleteBroadcastLog(row._id)
  await fetchLogs()
}

onMounted(fetchLogs)
</script>

<style scoped>
.notify { display: flex; flex-direction: column; gap: 20px; }
.notify__title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.notify__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .notify__grid { grid-template-columns: 1fr; } }
.notify__form { display: flex; flex-direction: column; gap: 14px; }
.notify__result { font-size: 12.5px; color: var(--brand-light); }
[data-theme='light'] .notify__result { color: var(--brand-dark); }
</style>
