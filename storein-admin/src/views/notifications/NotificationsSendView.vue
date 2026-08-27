<template>
  <div class="space-y-6">

    <!-- ── Page header ────────────────────────────────────────── -->
    <div>
      <h1 class="page-title">اعلان و پیامک</h1>
      <p class="text-text-secondary text-sm mt-0.5">ارسال اعلان داخلی یا پیامک به کاربران و مشاهده تاریخچه ارسال‌ها</p>
    </div>

    <!-- ── Tab bar ────────────────────────────────────────────── -->
    <div class="flex gap-1 p-1 bg-surface rounded-xl border border-border w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          activeTab === tab.id
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg',
        ]"
        @click="switchTab(tab.id)"
      >
        <span>{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: ارسال نوتیفیکیشن                                     -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'notification'">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <!-- Form card -->
        <div class="lg:col-span-3 admin-card p-6 space-y-5">
          <div class="flex items-center gap-3 pb-1 border-b border-border">
            <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">🔔</div>
            <div>
              <h3 class="font-semibold text-text-primary">ارسال نوتیفیکیشن داخلی</h3>
              <p class="text-text-disabled text-xs mt-0.5">اعلان در پنل کاربری نمایش داده می‌شود</p>
            </div>
          </div>

          <!-- Alert banner -->
          <TransitionGroup name="fade">
            <div v-if="notif.success" key="ns"
              class="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
              <span class="text-green-500 text-xl flex-shrink-0">✓</span>
              <p class="text-green-700 dark:text-green-400 text-sm font-medium">{{ notif.success }}</p>
            </div>
            <div v-if="notif.error" key="ne"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
              <p class="text-error text-sm">{{ notif.error }}</p>
            </div>
          </TransitionGroup>

          <!-- Target toggle -->
          <div>
            <label class="field-label">گیرنده</label>
            <div class="flex gap-2 mt-1.5">
              <button v-for="t in targets" :key="t.id"
                :class="[
                  'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150',
                  notifForm.target === t.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:border-primary/40',
                ]"
                @click="notifForm.target = t.id; notifForm.targetUserId = ''">
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
          </div>

          <AdminInput
            v-if="notifForm.target === 'specific'"
            v-model="notifForm.targetUserId"
            label="شناسه کاربر (ObjectId)"
            placeholder="64a1f2e3b4c5d6e7f8a9b0c1"
            dir="ltr"
            :error="notifErrors.targetUserId"
          />

          <!-- Type -->
          <div>
            <label class="field-label">نوع اعلان</label>
            <div class="grid grid-cols-2 gap-2 mt-1.5">
              <button v-for="t in notifTypes" :key="t.value"
                :class="[
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all duration-150',
                  notifForm.type === t.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-text-secondary hover:border-primary/40',
                ]"
                @click="notifForm.type = t.value">
                <span>{{ t.icon }}</span><span>{{ t.label }}</span>
              </button>
            </div>
          </div>

          <AdminInput
            v-model="notifForm.title"
            label="عنوان اعلان"
            placeholder="عنوان کوتاه و واضح..."
            :error="notifErrors.title"
          />

          <div>
            <label class="field-label">متن اعلان</label>
            <textarea
              v-model="notifForm.body"
              rows="3"
              placeholder="محتوای کامل اعلان را وارد کنید..."
              class="input-field mt-1 resize-none"
              :class="notifErrors.body ? 'border-error ring-2 ring-error/15' : ''"
            />
            <div class="flex justify-between mt-1">
              <p v-if="notifErrors.body" class="field-error">{{ notifErrors.body }}</p>
              <p class="text-text-disabled text-xs mr-auto font-fanum">{{ notifForm.body.length }} / ۵۰۰</p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <AdminButton :loading="notif.loading" class="flex-1" @click="handleBroadcast">
              ارسال اعلان
            </AdminButton>
            <button type="button"
              class="px-4 py-2 rounded-xl text-sm text-text-secondary border border-border hover:border-primary/40 hover:text-text-primary transition-colors"
              @click="resetNotif">پاک کردن</button>
          </div>
        </div>

        <!-- Tips card -->
        <div class="lg:col-span-2 space-y-4">
          <div class="admin-card p-5">
            <h4 class="font-medium text-text-primary text-sm mb-3 flex items-center gap-2">
              <span class="text-primary">💡</span> راهنما
            </h4>
            <ul class="space-y-2 text-text-secondary text-xs leading-relaxed">
              <li class="flex gap-2"><span class="text-primary flex-shrink-0 mt-0.5">•</span>اعلان‌های سیستمی برای اطلاع‌رسانی عمومی استفاده می‌شوند</li>
              <li class="flex gap-2"><span class="text-primary flex-shrink-0 mt-0.5">•</span>اعلان‌های پروموشن برای کمپین‌های تخفیف مناسب‌اند</li>
              <li class="flex gap-2"><span class="text-primary flex-shrink-0 mt-0.5">•</span>برای ارسال به یک کاربر خاص، شناسه MongoDB را وارد کنید</li>
              <li class="flex gap-2"><span class="text-primary flex-shrink-0 mt-0.5">•</span>عنوان حداکثر ۱۰۰ کاراکتر باید باشد</li>
            </ul>
          </div>
          <div class="admin-card p-5 bg-primary/5 border-primary/20">
            <p class="text-xs text-text-secondary">آخرین ارسال</p>
            <p v-if="lastBroadcastLog" class="text-sm font-medium text-text-primary mt-1 truncate">{{ lastBroadcastLog.title }}</p>
            <p v-if="lastBroadcastLog" class="text-xs text-text-disabled font-fanum mt-0.5">{{ formatDateTime(lastBroadcastLog.createdAt) }}</p>
            <p v-else class="text-xs text-text-disabled mt-1">هنوز اعلانی ارسال نشده</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: ارسال پیامک                                          -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'sms'">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <!-- Form card -->
        <div class="lg:col-span-3 admin-card p-6 space-y-5">
          <div class="flex items-center gap-3 pb-1 border-b border-border">
            <div class="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-lg">📱</div>
            <div>
              <h3 class="font-semibold text-text-primary">ارسال پیامک</h3>
              <p class="text-text-disabled text-xs mt-0.5">پیامک از طریق سرویس SMS ارسال می‌شود</p>
            </div>
          </div>

          <TransitionGroup name="fade">
            <div v-if="sms.success" key="ss"
              class="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
              <span class="text-green-500 text-xl flex-shrink-0">✓</span>
              <p class="text-green-700 dark:text-green-400 text-sm font-medium">{{ sms.success }}</p>
            </div>
            <div v-if="sms.error" key="se"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
              <p class="text-error text-sm">{{ sms.error }}</p>
            </div>
          </TransitionGroup>

          <!-- Target toggle -->
          <div>
            <label class="field-label">گیرنده</label>
            <div class="flex gap-2 mt-1.5">
              <button v-for="t in targets" :key="t.id"
                :class="[
                  'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150',
                  smsForm.target === t.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:border-primary/40',
                ]"
                @click="smsForm.target = t.id; smsForm.phone = ''">
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
          </div>

          <AdminInput
            v-if="smsForm.target === 'specific'"
            v-model="smsForm.phone"
            label="شماره موبایل"
            placeholder="09xxxxxxxxx"
            type="tel"
            dir="ltr"
            :error="smsErrors.phone"
          />

          <!-- Broadcast warning -->
          <div v-if="smsForm.target === 'all'"
            class="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
            <span class="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
            <p class="text-amber-700 dark:text-amber-400 text-sm">
              این پیامک برای <strong>همه کاربران فعال</strong> ارسال می‌شود.
              هزینه هر پیامک از اعتبار حساب Kavenegar کسر می‌گردد.
            </p>
          </div>

          <div>
            <label class="field-label">متن پیامک</label>
            <textarea
              v-model="smsForm.message"
              rows="4"
              placeholder="متن پیامک را وارد کنید..."
              class="input-field mt-1 resize-none"
              :class="smsErrors.message ? 'border-error ring-2 ring-error/15' : ''"
            />
            <div class="flex justify-between mt-1">
              <p v-if="smsErrors.message" class="field-error">{{ smsErrors.message }}</p>
              <p class="text-text-disabled text-xs mr-auto font-fanum"
                :class="smsForm.message.length > 70 ? 'text-warning' : ''">
                {{ smsForm.message.length }} / ۱۶۰
                <span v-if="smsForm.message.length > 70" class="text-warning">
                  ({{ Math.ceil(smsForm.message.length / 70) }} صفحه)
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <AdminButton :loading="sms.loading" class="flex-1" @click="handleSendSms">
              ارسال پیامک
            </AdminButton>
            <button type="button"
              class="px-4 py-2 rounded-xl text-sm text-text-secondary border border-border hover:border-primary/40 hover:text-text-primary transition-colors"
              @click="resetSms">پاک کردن</button>
          </div>
        </div>

        <!-- Tips card -->
        <div class="lg:col-span-2 space-y-4">
          <div class="admin-card p-5">
            <h4 class="font-medium text-text-primary text-sm mb-3 flex items-center gap-2">
              <span class="text-green-500">💡</span> راهنما
            </h4>
            <ul class="space-y-2 text-text-secondary text-xs leading-relaxed">
              <li class="flex gap-2"><span class="text-green-500 flex-shrink-0 mt-0.5">•</span>هر پیامک تا ۷۰ کاراکتر یک صفحه محسوب می‌شود</li>
              <li class="flex gap-2"><span class="text-green-500 flex-shrink-0 mt-0.5">•</span>از ارسال انبوه به صورت مکرر خودداری کنید</li>
              <li class="flex gap-2"><span class="text-green-500 flex-shrink-0 mt-0.5">•</span>شماره باید با ۰۹ شروع شود</li>
              <li class="flex gap-2"><span class="text-green-500 flex-shrink-0 mt-0.5">•</span>پیامک‌های ناموفق در تاریخچه ثبت می‌شوند</li>
            </ul>
          </div>
          <div class="admin-card p-5 bg-green-500/5 border-green-500/20">
            <p class="text-xs text-text-secondary">آخرین پیامک</p>
            <p v-if="lastSmsLog" class="text-sm font-medium text-text-primary mt-1 line-clamp-2">{{ lastSmsLog.message }}</p>
            <p v-if="lastSmsLog" class="text-xs text-text-disabled font-fanum mt-0.5">{{ formatDateTime(lastSmsLog.createdAt) }}</p>
            <p v-else class="text-xs text-text-disabled mt-1">هنوز پیامکی ارسال نشده</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: تاریخچه اعلان‌ها                                     -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'broadcast-logs'">
      <div class="admin-card p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 class="font-semibold text-text-primary">تاریخچه اعلان‌های ارسالی</h3>
            <p v-if="!broadcastLogs.loading" class="text-text-disabled text-xs mt-0.5 font-fanum">
              {{ formatNumber(broadcastLogs.total) }} رکورد
            </p>
          </div>
          <button @click="loadBroadcastLogs(broadcastLogs.page)"
            class="text-primary text-sm hover:underline transition-opacity"
            :class="broadcastLogs.loading ? 'opacity-50 pointer-events-none' : ''">
            بارگذاری مجدد
          </button>
        </div>

        <div v-if="broadcastLogs.error"
          class="flex items-center gap-3 mx-5 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <span class="text-error text-lg flex-shrink-0">⚠</span>
          <p class="text-error text-sm">{{ broadcastLogs.error }}</p>
        </div>

        <AdminTable
          :columns="broadcastCols"
          :rows="broadcastLogs.items"
          :loading="broadcastLogs.loading"
          :skeleton-rows="8"
          empty-text="هنوز اعلانی ارسال نشده است">

          <template #cell-type="{ value }">
            <AdminBadge :variant="typeVariant(value)" size="sm">
              {{ typeLabel(value) }}
            </AdminBadge>
          </template>

          <template #cell-title="{ row }">
            <div>
              <p class="font-medium text-text-primary text-sm">{{ row.title }}</p>
              <p class="text-text-disabled text-xs mt-0.5 truncate max-w-[220px]">{{ row.body }}</p>
            </div>
          </template>

          <template #cell-target="{ value }">
            <span :class="[
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
              value === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            ]">
              {{ value === 'all' ? '📢 همه' : '🎯 یک نفر' }}
            </span>
          </template>

          <template #cell-sent="{ value }">
            <span class="font-bold text-primary font-fanum text-sm">{{ formatNumber(value) }}</span>
          </template>

          <template #cell-createdAt="{ value }">
            <span class="text-text-secondary text-xs font-fanum" dir="rtl">{{ formatDateTime(value) }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center justify-center gap-1.5">
              <!-- Confirm step -->
              <template v-if="deletingBroadcastId === row._id">
                <button
                  class="px-2 py-1 rounded-lg text-xs bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                  :disabled="deleteBroadcastLoading === row._id"
                  @click="handleDeleteBroadcastLog(row._id)">
                  {{ deleteBroadcastLoading === row._id ? '...' : 'حذف' }}
                </button>
                <button
                  class="px-2 py-1 rounded-lg text-xs border border-border text-text-secondary hover:text-text-primary transition-colors"
                  :disabled="deleteBroadcastLoading === row._id"
                  @click="deletingBroadcastId = null">
                  انصراف
                </button>
              </template>

              <!-- Initial delete trigger -->
              <button
                v-else
                class="p-1.5 rounded-lg text-text-disabled hover:text-error hover:bg-error/10 transition-colors"
                title="حذف رکورد"
                @click="deletingBroadcastId = row._id">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </template>
        </AdminTable>

        <div class="px-5 pb-4">
          <AdminPagination
            v-model="broadcastLogs.page"
            :total-pages="broadcastLogs.totalPages"
            :loading="broadcastLogs.loading"
            @update:model-value="loadBroadcastLogs"
          />
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: تاریخچه پیامک‌ها                                     -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'sms-logs'">
      <div class="admin-card p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 class="font-semibold text-text-primary">تاریخچه پیامک‌های ارسالی</h3>
            <p v-if="!smsLogs.loading" class="text-text-disabled text-xs mt-0.5 font-fanum">
              {{ formatNumber(smsLogs.total) }} رکورد
            </p>
          </div>
          <button @click="loadSmsLogs(smsLogs.page)"
            class="text-primary text-sm hover:underline transition-opacity"
            :class="smsLogs.loading ? 'opacity-50 pointer-events-none' : ''">
            بارگذاری مجدد
          </button>
        </div>

        <div v-if="smsLogs.error"
          class="flex items-center gap-3 mx-5 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <span class="text-error text-lg flex-shrink-0">⚠</span>
          <p class="text-error text-sm">{{ smsLogs.error }}</p>
        </div>

        <AdminTable
          :columns="smsCols"
          :rows="smsLogs.items"
          :loading="smsLogs.loading"
          :skeleton-rows="8"
          empty-text="هنوز پیامکی ارسال نشده است">

          <template #cell-target="{ row }">
            <div>
              <span :class="[
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                row.target === 'all'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              ]">
                {{ row.target === 'all' ? '📢 همه' : '🎯 یک نفر' }}
              </span>
              <p v-if="row.phone" class="text-text-disabled text-xs mt-1 font-mono" dir="ltr">{{ row.phone }}</p>
            </div>
          </template>

          <template #cell-message="{ value }">
            <p class="text-text-primary text-sm max-w-[260px] truncate">{{ value }}</p>
          </template>

          <template #cell-sent="{ value }">
            <span class="font-bold text-primary font-fanum text-sm">{{ formatNumber(value) }}</span>
          </template>

          <template #cell-failed="{ value }">
            <span :class="[
              'font-bold font-fanum text-sm',
              value > 0 ? 'text-error' : 'text-text-disabled',
            ]">{{ formatNumber(value) }}</span>
          </template>

          <template #cell-createdAt="{ value }">
            <span class="text-text-secondary text-xs font-fanum" dir="rtl">{{ formatDateTime(value) }}</span>
          </template>
        </AdminTable>

        <div class="px-5 pb-4">
          <AdminPagination
            v-model="smsLogs.page"
            :total-pages="smsLogs.totalPages"
            :loading="smsLogs.loading"
            @update:model-value="loadSmsLogs"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { notificationService } from '@/services/notification.service'
import { logger } from '@/utils/logger'
import { formatNumber, formatDateTime, truncate } from '@/utils/formatters'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

// ── Tabs ──────────────────────────────────────────────────────
const activeTab = ref('notification')

const tabs = [
  { id: 'notification',   icon: '🔔', label: 'ارسال اعلان' },
  { id: 'sms',            icon: '📱', label: 'ارسال پیامک' },
  { id: 'broadcast-logs', icon: '📋', label: 'تاریخچه اعلان‌ها' },
  { id: 'sms-logs',       icon: '📄', label: 'تاریخچه پیامک‌ها' },
]

const targets = [
  { id: 'all',      icon: '📢', label: 'همه کاربران' },
  { id: 'specific', icon: '🎯', label: 'کاربر مشخص' },
]

const notifTypes = [
  { value: 'system',       icon: '⚙️', label: 'سیستمی' },
  { value: 'promo',        icon: '🎁', label: 'پروموشن' },
  { value: 'order_update', icon: '📦', label: 'وضعیت سفارش' },
  { value: 'payment',      icon: '💳', label: 'پرداخت' },
]

// ── Notification form ──────────────────────────────────────────
const notifForm = reactive({ target: 'all', targetUserId: '', type: 'system', title: '', body: '' })
const notifErrors = reactive({ targetUserId: '', title: '', body: '' })
const notif = reactive({ loading: false, success: '', error: '' })

function resetNotif() {
  notifForm.target = 'all'; notifForm.targetUserId = ''
  notifForm.type = 'system'; notifForm.title = ''; notifForm.body = ''
  notifErrors.targetUserId = ''; notifErrors.title = ''; notifErrors.body = ''
  notif.success = ''; notif.error = ''
}

function validateNotif() {
  let ok = true
  notifErrors.targetUserId = ''; notifErrors.title = ''; notifErrors.body = ''
  if (notifForm.target === 'specific' && !notifForm.targetUserId.trim()) {
    notifErrors.targetUserId = 'شناسه کاربر الزامی است'; ok = false
  }
  if (!notifForm.title.trim()) { notifErrors.title = 'عنوان الزامی است'; ok = false }
  if (!notifForm.body.trim())  { notifErrors.body  = 'متن اعلان الزامی است'; ok = false }
  return ok
}

async function handleBroadcast() {
  notif.success = ''; notif.error = ''
  if (!validateNotif()) return
  notif.loading = true
  try {
    const payload = {
      type:  notifForm.type,
      title: notifForm.title.trim(),
      body:  notifForm.body.trim(),
      ...(notifForm.target === 'specific' && { targetUserId: notifForm.targetUserId.trim() }),
    }
    const { data } = await notificationService.broadcast(payload)
    logger.info('Admin broadcast sent', { sent: data.sent }, 'NotificationsSendView')
    const msg = `نوتیفیکیشن با موفقیت برای ${data.sent} کاربر ارسال شد`
    resetNotif()
    notif.success = msg
    loadBroadcastLogs(1)
    broadcastLogs.items[0] && (lastBroadcastLog.value = broadcastLogs.items[0])
  } catch (e) {
    logger.error('Admin broadcast failed', e, {}, 'NotificationsSendView')
    const msg = e.response?.data?.message
    notif.error = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال اعلان')
  } finally {
    notif.loading = false
  }
}

// ── SMS form ───────────────────────────────────────────────────
const smsForm   = reactive({ target: 'all', phone: '', message: '' })
const smsErrors = reactive({ phone: '', message: '' })
const sms = reactive({ loading: false, success: '', error: '' })

function resetSms() {
  smsForm.target = 'all'; smsForm.phone = ''; smsForm.message = ''
  smsErrors.phone = ''; smsErrors.message = ''
  sms.success = ''; sms.error = ''
}

function validateSms() {
  let ok = true
  smsErrors.phone = ''; smsErrors.message = ''
  if (smsForm.target === 'specific') {
    if (!smsForm.phone.trim()) {
      smsErrors.phone = 'شماره موبایل الزامی است'; ok = false
    } else if (!/^((\+98|0)?9\d{9})$/.test(smsForm.phone.trim())) {
      smsErrors.phone = 'شماره موبایل معتبر نیست'; ok = false
    }
  }
  if (!smsForm.message.trim()) { smsErrors.message = 'متن پیامک الزامی است'; ok = false }
  return ok
}

async function handleSendSms() {
  sms.success = ''; sms.error = ''
  if (!validateSms()) return
  sms.loading = true
  try {
    const payload = {
      message: smsForm.message.trim(),
      ...(smsForm.target === 'specific' && { phone: smsForm.phone.trim() }),
    }
    const { data } = await notificationService.sendSms(payload)
    logger.info('Admin SMS sent', { sent: data.sent, failed: data.failed }, 'NotificationsSendView')
    const msg = data.failed > 0
      ? `پیامک برای ${data.sent} نفر ارسال شد (${data.failed} شکست خورد)`
      : `پیامک با موفقیت برای ${data.sent} نفر ارسال شد`
    resetSms()
    sms.success = msg
    loadSmsLogs(1)
  } catch (e) {
    logger.error('Admin SMS failed', e, {}, 'NotificationsSendView')
    const msg = e.response?.data?.message
    sms.error = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال پیامک')
  } finally {
    sms.loading = false
  }
}

// ── Broadcast logs ─────────────────────────────────────────────
const broadcastLogs = reactive({ items: [], total: 0, totalPages: 1, page: 1, loading: false, error: '' })
const lastBroadcastLog = ref(null)

const deletingBroadcastId      = ref(null)   // row._id currently in confirm state
const deleteBroadcastLoading   = ref(null)   // row._id being actively deleted

const broadcastCols = [
  { key: 'type',      label: 'نوع',     width: '90px' },
  { key: 'title',     label: 'عنوان و متن' },
  { key: 'target',    label: 'گیرنده',  width: '110px', align: 'center' },
  { key: 'sent',      label: 'ارسال شد', width: '80px', align: 'center' },
  { key: 'createdAt', label: 'تاریخ',   width: '160px' },
  { key: 'actions',   label: '',         width: '90px',  align: 'center' },
]

async function handleDeleteBroadcastLog(id) {
  deleteBroadcastLoading.value = id
  try {
    await notificationService.deleteBroadcastLog(id)
    logger.info('Admin deleted broadcast log', { id }, 'NotificationsSendView')
    broadcastLogs.items = broadcastLogs.items.filter(r => r._id !== id)
    broadcastLogs.total = Math.max(0, broadcastLogs.total - 1)
    if (broadcastLogs.items.length === 0 && broadcastLogs.page > 1) {
      loadBroadcastLogs(broadcastLogs.page - 1)
    }
  } catch (e) {
    logger.error('Admin delete broadcast log failed', e, { id }, 'NotificationsSendView')
  } finally {
    deleteBroadcastLoading.value = null
    deletingBroadcastId.value    = null
  }
}

async function loadBroadcastLogs(page = 1) {
  broadcastLogs.loading = true
  broadcastLogs.error   = ''
  broadcastLogs.page    = page
  try {
    const { data } = await notificationService.getBroadcastLogs({ page, limit: 10 })
    broadcastLogs.items      = data.logs
    broadcastLogs.total      = data.total
    broadcastLogs.totalPages = data.totalPages
    if (page === 1 && data.logs.length) lastBroadcastLog.value = data.logs[0]
    logger.info('Broadcast logs loaded', { page, total: data.total }, 'NotificationsSendView')
  } catch (e) {
    logger.error('Failed to load broadcast logs', e, { page }, 'NotificationsSendView')
    broadcastLogs.error = e?.response?.data?.message ?? 'خطا در بارگذاری تاریخچه اعلان‌ها'
  } finally {
    broadcastLogs.loading = false
  }
}

// ── SMS logs ───────────────────────────────────────────────────
const smsLogs = reactive({ items: [], total: 0, totalPages: 1, page: 1, loading: false, error: '' })
const lastSmsLog = ref(null)

const smsCols = [
  { key: 'target',    label: 'گیرنده',   width: '140px' },
  { key: 'message',   label: 'متن پیامک' },
  { key: 'sent',      label: 'ارسال شد', width: '80px', align: 'center' },
  { key: 'failed',    label: 'شکست خورد', width: '90px', align: 'center' },
  { key: 'createdAt', label: 'تاریخ',    width: '160px' },
]

async function loadSmsLogs(page = 1) {
  smsLogs.loading = true
  smsLogs.error   = ''
  smsLogs.page    = page
  try {
    const { data } = await notificationService.getSmsLogs({ page, limit: 10 })
    smsLogs.items      = data.logs
    smsLogs.total      = data.total
    smsLogs.totalPages = data.totalPages
    if (page === 1 && data.logs.length) lastSmsLog.value = data.logs[0]
    logger.info('SMS logs loaded', { page, total: data.total }, 'NotificationsSendView')
  } catch (e) {
    logger.error('Failed to load SMS logs', e, { page }, 'NotificationsSendView')
    smsLogs.error = e?.response?.data?.message ?? 'خطا در بارگذاری تاریخچه پیامک‌ها'
  } finally {
    smsLogs.loading = false
  }
}

// ── Helpers ────────────────────────────────────────────────────
function typeVariant(type) {
  return { system: 'gray', promo: 'success', order_update: 'info', payment: 'warning' }[type] ?? 'gray'
}
function typeLabel(type) {
  return { system: 'سیستمی', promo: 'پروموشن', order_update: 'سفارش', payment: 'پرداخت' }[type] ?? type
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'broadcast-logs' && !broadcastLogs.items.length) loadBroadcastLogs()
  if (tab === 'sms-logs'       && !smsLogs.items.length)       loadSmsLogs()
}

// ── Init ───────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadBroadcastLogs(1), loadSmsLogs(1)])
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
