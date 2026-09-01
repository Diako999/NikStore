<template>
  <div class="space-y-5">

    <!-- Back + header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <button @click="$router.back()"
          class="w-9 h-9 rounded-lg border border-border flex items-center
                 justify-center text-text-secondary hover:border-primary
                 hover:text-primary transition-colors flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor"
               stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">
            {{ user
              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'کاربر'
              : '...' }}
          </h1>
          <p v-if="user" class="text-text-secondary text-xs mt-0.5 font-fanum" dir="ltr">
            {{ user.phone }}
          </p>
        </div>
      </div>

      <!-- Block / Unblock button -->
      <AdminButton v-if="user && !user.isAdmin"
        :variant="user.isBlocked ? 'secondary' : 'danger'"
        :loading="blockLoading"
        @click="toggleBlock">
        {{ user.isBlocked ? '🔓 رفع مسدودی' : '🔒 مسدود کردن' }}
      </AdminButton>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminSkeleton height="160px" class="rounded-xl" />
        <AdminSkeleton height="160px" class="rounded-xl" />
      </div>
      <AdminSkeleton height="120px" class="rounded-xl" />
      <AdminSkeleton height="200px" class="rounded-xl" />
    </div>

    <template v-else-if="user">

      <!-- Info + Stats row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- User info card -->
        <div class="admin-card">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <span>👤</span> اطلاعات کاربر
          </h3>

          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <div :class="[
              'w-14 h-14 rounded-full flex items-center justify-center',
              'text-xl font-black flex-shrink-0',
              user.isBlocked ? 'bg-red-100 text-red-600'
                             : 'bg-primary/10 text-primary',
            ]">
              {{ (user.firstName?.[0] ?? user.phone?.[2] ?? '؟').toUpperCase() }}
            </div>
            <div>
              <p class="font-bold text-text-primary">
                {{ user.firstName ?? '—' }} {{ user.lastName ?? '' }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <AdminBadge
                  :variant="user.isBlocked ? 'error' : 'success'"
                  size="sm">
                  {{ user.isBlocked ? 'مسدود' : 'فعال' }}
                </AdminBadge>
                <AdminBadge v-if="user.isAdmin" variant="navy" size="sm">
                  ادمین
                </AdminBadge>
              </div>
            </div>
          </div>

          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between">
              <dt class="text-text-secondary">شماره موبایل:</dt>
              <dd class="font-fanum font-medium" dir="ltr">{{ user.phone }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-text-secondary">تاریخ عضویت:</dt>
              <dd class="font-fanum">{{ formatDate(user.createdAt) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-text-secondary">آخرین فعالیت:</dt>
              <dd class="font-fanum">{{ formatDate(user.updatedAt) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Purchase stats card -->
        <div class="admin-card">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <span>📊</span> آمار خرید
          </h3>
          <div class="grid grid-cols-2 gap-4">

            <div class="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p class="text-3xl font-black text-primary font-fanum">
                {{ formatNumber(user.ordersCount ?? 0) }}
              </p>
              <p class="text-text-secondary text-xs mt-1">تعداد سفارشات</p>
            </div>

            <div class="text-center p-4 rounded-xl bg-success/5 border border-success/10">
              <p class="text-lg font-black text-success font-fanum leading-tight">
                {{ formatPrice(user.totalSpent ?? 0) }}
              </p>
              <p class="text-text-secondary text-xs mt-1">مجموع خرید</p>
            </div>

            <div class="col-span-2 text-center p-3 rounded-xl bg-surface border border-border">
              <p class="text-sm font-bold text-text-primary font-fanum">
                میانگین هر سفارش:
                {{
                  (user.ordersCount ?? 0) > 0
                    ? formatPrice(Math.round((user.totalSpent ?? 0) / user.ordersCount))
                    : '—'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Addresses -->
      <div v-if="user.addresses?.length" class="admin-card">
        <h3 class="section-title mb-4 flex items-center gap-2">
          <span>📍</span>
          آدرس‌ها
          <span class="text-text-disabled font-normal text-xs font-fanum">
            ({{ user.addresses.length }})
          </span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="addr in user.addresses" :key="addr._id"
               :class="[
                 'p-4 rounded-xl border text-sm',
                 addr.isDefault
                   ? 'border-primary/30 bg-primary/5'
                   : 'border-border',
               ]">
            <div class="flex items-center gap-2 mb-1.5">
              <p class="font-bold text-text-primary">{{ addr.title }}</p>
              <AdminBadge v-if="addr.isDefault" variant="navy" size="sm">
                پیش‌فرض
              </AdminBadge>
            </div>
            <p class="text-text-secondary leading-6">
              {{ addr.province }}، {{ addr.city }}، {{ addr.street }}
            </p>
            <p class="text-text-disabled text-xs mt-1 flex gap-3">
              <span>{{ addr.recipient }}</span>
              <span class="font-fanum" dir="ltr">{{ addr.phone }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Recent orders -->
      <div v-if="recentOrders.length" class="admin-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="section-title flex items-center gap-2">
            <span>📦</span> سفارشات اخیر
          </h3>
          <RouterLink :to="{ name: 'orders' }"
            class="text-primary text-xs hover:underline">
            مشاهده همه سفارشات
          </RouterLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-right">
            <thead class="bg-surface border-b border-border">
              <tr>
                <th class="px-3 py-2 text-text-secondary font-medium">شماره</th>
                <th class="px-3 py-2 text-text-secondary font-medium text-center">وضعیت</th>
                <th class="px-3 py-2 text-text-secondary font-medium text-center">مبلغ</th>
                <th class="px-3 py-2 text-text-secondary font-medium">تاریخ</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order._id"
                  class="border-b border-border hover:bg-surface/50">
                <td class="px-3 py-2.5 font-fanum text-primary
                           text-xs font-bold" dir="ltr">
                  {{ order.orderNumber }}
                </td>
                <td class="px-3 py-2.5 text-center">
                  <AdminBadge
                    :variant="ORDER_STATUSES[order.status]?.color ?? 'gray'"
                    size="sm">
                    {{ ORDER_STATUSES[order.status]?.label ?? order.status }}
                  </AdminBadge>
                </td>
                <td class="px-3 py-2.5 text-center font-fanum font-medium">
                  {{ formatPrice(order.total) }}
                </td>
                <td class="px-3 py-2.5 text-text-secondary text-xs font-fanum">
                  {{ formatDate(order.createdAt) }}
                </td>
                <td class="px-3 py-2.5">
                  <RouterLink
                    :to="{ name: 'order-detail', params: { id: order._id } }"
                    class="text-text-secondary hover:text-primary transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                         stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0
                           8.268 2.943 9.542 7-1.274 4.057-5.064
                           7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- User reviews -->
      <div class="admin-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="section-title flex items-center gap-2">
            <span>⭐</span> نظرات کاربر
            <span class="text-text-disabled font-normal text-xs font-fanum">
              ({{ reviewsTotal }})
            </span>
          </h3>
        </div>

        <!-- Empty -->
        <div v-if="!reviewsLoading && userReviews.length === 0"
             class="text-center py-8 text-text-disabled text-sm">
          این کاربر هنوز نظری ثبت نکرده است
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
          <div v-for="review in userReviews" :key="review._id"
               class="p-4 rounded-xl border border-border bg-surface/40 text-sm">

            <!-- Product + status -->
            <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div class="flex items-center gap-3 min-w-0">
                <img :src="review.productId?.thumbnail"
                     class="w-9 h-9 rounded-lg object-contain border border-border bg-surface flex-shrink-0"
                     @error="e => e.target.style.opacity='0'" />
                <span class="font-medium text-text-primary truncate">
                  {{ review.productId?.name ?? '—' }}
                </span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <!-- Stars -->
                <span v-for="i in 5" :key="i"
                  :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                  class="text-sm leading-none">★</span>
                <AdminBadge
                  :variant="REVIEW_STATUSES[review.status]?.color ?? 'gray'"
                  size="sm">
                  {{ REVIEW_STATUSES[review.status]?.label ?? review.status }}
                </AdminBadge>
              </div>
            </div>

            <!-- Title + body -->
            <p v-if="review.title" class="font-bold text-text-primary mb-1">
              {{ review.title }}
            </p>
            <p class="text-text-secondary leading-6 line-clamp-3">{{ review.body }}</p>

            <!-- Date + verified -->
            <div class="flex items-center gap-3 mt-2 text-xs text-text-disabled">
              <span class="font-fanum">{{ formatDate(review.createdAt) }}</span>
              <span v-if="review.isVerifiedPurchase"
                    class="flex items-center gap-1 text-success">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                </svg>
                خرید تأیید شده
              </span>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- 404 state -->
    <div v-else-if="!loading"
         class="text-center py-20 text-text-disabled">
      کاربر یافت نشد
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute }     from 'vue-router'
import { userService }  from '@/services/user.service'
import { orderService } from '@/services/order.service'
import { useUiStore }   from '@/stores/ui.store'
import { formatPrice, formatNumber, formatDate } from '@/utils/formatters'
import { ORDER_STATUSES, REVIEW_STATUSES } from '@/utils/constants'

import AdminBadge    from '@/components/common/AdminBadge.vue'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const route = useRoute()
const ui    = useUiStore()

const user           = ref(null)
const recentOrders   = ref([])
const userReviews    = ref([])
const reviewsTotal   = ref(0)
const reviewsLoading = ref(false)
const loading        = ref(true)
const blockLoading   = ref(false)

async function fetchUser() {
  loading.value = true
  try {
    const { data } = await userService.getById(route.params.id)
    user.value = data
    document.title = `${data.firstName ?? data.phone} | ادمین نیک`
  } catch {
    ui.addToast('خطا در بارگذاری کاربر', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchRecentOrders() {
  try {
    const { data } = await orderService.getAll({
      page: 1, limit: 5,
      userId: route.params.id,
    })
    recentOrders.value = data?.items ?? []
  } catch { /* non-critical */ }
}

async function fetchUserReviews() {
  reviewsLoading.value = true
  try {
    const { data } = await userService.getReviews(route.params.id, { page: 1, limit: 20 })
    userReviews.value  = data?.items ?? []
    reviewsTotal.value = data?.total ?? 0
  } catch { /* non-critical */ } finally {
    reviewsLoading.value = false
  }
}

async function toggleBlock() {
  if (!user.value) return
  blockLoading.value = true
  try {
    const { data } = await userService.block(user.value._id)
    user.value.isBlocked = data?.isBlocked ?? !user.value.isBlocked
    ui.addToast(
      user.value.isBlocked ? 'کاربر مسدود شد' : 'مسدودی کاربر رفع شد',
      user.value.isBlocked ? 'warning' : 'success'
    )
  } catch {
    ui.addToast('خطا در تغییر وضعیت', 'error')
  } finally {
    blockLoading.value = false
  }
}

onMounted(() => Promise.allSettled([fetchUser(), fetchRecentOrders(), fetchUserReviews()]))
onUnmounted(() => { document.title = 'نیک | پنل مدیریت' })
</script>
