<template>
  <div class="user-detail">
    <div class="user-detail__head">
      <RouterLink :to="{ name: 'users' }" class="user-detail__back">
        <AppIcon name="arrow" :size="16" class="user-detail__back-icon" />
        بازگشت به کاربران
      </RouterLink>
    </div>

    <div v-if="loading" class="user-detail__loading">در حال بارگذاری...</div>
    <div v-else-if="!user" class="user-detail__error">کاربر یافت نشد</div>

    <template v-else>
      <AdminCard>
        <div class="user-detail__profile">
          <div class="user-detail__avatar">
            <AppIcon name="person" :size="28" />
          </div>
          <div class="user-detail__info">
            <h1 class="user-detail__name">
              {{ fullName || 'بدون نام' }}
              <AdminBadge :variant="user.isBlocked ? 'danger' : 'success'">
                {{ user.isBlocked ? 'مسدود' : 'فعال' }}
              </AdminBadge>
            </h1>
            <dl class="user-detail__meta">
              <div>
                <dt>موبایل</dt>
                <dd class="user-detail__ltr">{{ user.phone }}</dd>
              </div>
              <div v-if="user.email">
                <dt>ایمیل</dt>
                <dd class="user-detail__ltr">{{ user.email }}</dd>
              </div>
              <div>
                <dt>تاریخ عضویت</dt>
                <dd>{{ formatDate(user.createdAt) }}</dd>
              </div>
            </dl>
          </div>
          <AdminButton
            :variant="user.isBlocked ? 'primary' : 'danger'"
            :loading="toggling"
            @click="confirmOpen = true"
          >
            {{ user.isBlocked ? 'رفع مسدودی' : 'مسدودسازی کاربر' }}
          </AdminButton>
        </div>
      </AdminCard>

      <div class="user-detail__stats">
        <AdminCard class="stat-card">
          <p class="stat-card__label">تعداد سفارش‌ها</p>
          <p class="stat-card__value">{{ formatNumber(user.ordersCount) }}</p>
        </AdminCard>
        <AdminCard class="stat-card">
          <p class="stat-card__label">مجموع خرید</p>
          <p class="stat-card__value">{{ formatToman(user.totalSpent) }}</p>
        </AdminCard>
        <AdminCard class="stat-card">
          <p class="stat-card__label">تعداد آدرس‌ها</p>
          <p class="stat-card__value">{{ formatNumber(user.addresses?.length) }}</p>
        </AdminCard>
      </div>

      <AdminCard title="آدرس‌ها">
        <div v-if="!user.addresses?.length" class="user-detail__empty">
          آدرسی ثبت نشده است
        </div>
        <div v-else class="user-detail__addresses">
          <div v-for="addr in user.addresses" :key="addr._id" class="address-item">
            <div class="address-item__head">
              <span class="address-item__title">{{ addr.title }}</span>
              <AdminBadge v-if="addr.isDefault" variant="success">پیش‌فرض</AdminBadge>
            </div>
            <p class="address-item__text">
              {{ addr.province }}، {{ addr.city }}، {{ addr.street }} — {{ addr.detail }}
            </p>
            <p class="address-item__recipient">
              گیرنده: {{ addr.recipientName }} — <span class="user-detail__ltr">{{ addr.recipientPhone }}</span>
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="نظرات کاربر" flush>
        <AdminTable :columns="reviewColumns" :rows="reviews" :loading="loadingReviews">
          <template #cell-productId="{ value }">
            {{ value?.name || '—' }}
          </template>
          <template #cell-rating="{ value }">
            <span class="user-detail__rating">
              <AppIcon name="star" :size="14" filled />
              {{ value }}
            </span>
          </template>
          <template #cell-status="{ value }">
            <AdminBadge :variant="reviewStatusVariant(value)">
              {{ reviewStatusLabel(value) }}
            </AdminBadge>
          </template>
          <template #cell-createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #empty>این کاربر هنوز نظری ثبت نکرده است</template>
        </AdminTable>
        <AdminPagination
          v-if="reviewsTotal > reviewsLimit"
          v-model:page="reviewsPage"
          :page-size="reviewsLimit"
          :total="reviewsTotal"
        />
      </AdminCard>
    </template>

    <AdminConfirm
      v-model="confirmOpen"
      :title="user?.isBlocked ? 'رفع مسدودی کاربر' : 'مسدودسازی کاربر'"
      :message="confirmMessage"
      :confirm-text="user?.isBlocked ? 'رفع مسدودی' : 'مسدودسازی'"
      :danger="!user?.isBlocked"
      :loading="toggling"
      @confirm="toggleBlock"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AdminCard from '../../components/common/AdminCard.vue'
import AdminTable from '../../components/common/AdminTable.vue'
import AdminBadge from '../../components/common/AdminBadge.vue'
import AdminButton from '../../components/common/AdminButton.vue'
import AdminPagination from '../../components/common/AdminPagination.vue'
import AdminConfirm from '../../components/common/AdminConfirm.vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import { userService } from '../../services/user.service'

const route = useRoute()
const userId = route.params.id

const user = ref(null)
const loading = ref(true)
const confirmOpen = ref(false)
const toggling = ref(false)

const reviews = ref([])
const reviewsTotal = ref(0)
const reviewsPage = ref(1)
const reviewsLimit = 10
const loadingReviews = ref(true)

const reviewColumns = [
  { key: 'productId', label: 'محصول' },
  { key: 'rating', label: 'امتیاز' },
  { key: 'title', label: 'عنوان' },
  { key: 'status', label: 'وضعیت' },
  { key: 'createdAt', label: 'تاریخ' },
]

const fullName = computed(() =>
  [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' '),
)

const confirmMessage = computed(() => {
  if (!user.value) return ''
  const name = fullName.value || user.value.phone
  return user.value.isBlocked
    ? `آیا مسدودیت "${name}" برداشته شود؟`
    : `آیا "${name}" مسدود شود؟ این کاربر دیگر نمی‌تواند وارد حساب خود شود.`
})

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fa-IR')
}

function formatNumber(value) {
  if (value === undefined || value === null) return '۰'
  return Number(value).toLocaleString('fa-IR')
}

function formatToman(value) {
  if (!value) return '۰ تومان'
  return `${Number(value).toLocaleString('fa-IR')} تومان`
}

function reviewStatusLabel(status) {
  return { pending: 'در انتظار', approved: 'تایید‌شده', rejected: 'رد‌شده' }[status] || status
}

function reviewStatusVariant(status) {
  return { pending: 'pending', approved: 'success', rejected: 'danger' }[status] || 'neutral'
}

async function loadUser() {
  loading.value = true
  try {
    const { data } = await userService.getUser(userId)
    user.value = data
  } catch {
    user.value = null
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  loadingReviews.value = true
  try {
    const { data } = await userService.getUserReviews(userId, {
      page: reviewsPage.value,
      limit: reviewsLimit,
    })
    reviews.value = data?.items ?? []
    reviewsTotal.value = data?.total ?? 0
  } catch {
    reviews.value = []
    reviewsTotal.value = 0
  } finally {
    loadingReviews.value = false
  }
}

async function toggleBlock() {
  toggling.value = true
  try {
    await userService.toggleUserBlock(userId)
    confirmOpen.value = false
    await loadUser()
  } finally {
    toggling.value = false
  }
}

watch(reviewsPage, loadReviews)

onMounted(() => {
  loadUser()
  loadReviews()
})
</script>

<style scoped>
.user-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-detail__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.user-detail__back:hover {
  color: var(--text-primary);
}
.user-detail__back-icon {
  transform: rotate(180deg);
}

.user-detail__loading,
.user-detail__error {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.user-detail__profile {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.user-detail__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--brand-light);
  background: var(--glass);
  border: 1px solid var(--glass-border);
}

.user-detail__info {
  flex: 1;
  min-width: 200px;
}

.user-detail__name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.user-detail__meta {
  display: flex;
  gap: 24px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.user-detail__meta dt {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}
.user-detail__meta dd {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-detail__ltr {
  direction: ltr;
  unicode-bidi: isolate;
}

.user-detail__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 900px) {
  .user-detail__stats {
    grid-template-columns: 1fr;
  }
}
.stat-card__label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.stat-card__value {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
}

.user-detail__empty {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-detail__addresses {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 900px) {
  .user-detail__addresses {
    grid-template-columns: 1fr;
  }
}

.address-item {
  border-radius: 12px;
  padding: 14px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
}
.address-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.address-item__title {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-primary);
}
.address-item__text {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.address-item__recipient {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.user-detail__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #E7AF42;
  font-weight: 600;
}
</style>
