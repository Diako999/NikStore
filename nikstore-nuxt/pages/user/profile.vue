<template>
  <div class="profile">
    <SectionHead title="اطلاعات شخصی" />
    <section class="panel">
      <form class="form" @submit.prevent="onSaveProfile">
        <div class="form__row">
          <label class="field">
            <span class="field__label">نام</span>
            <input v-model="profileForm.firstName" class="field__input" type="text" placeholder="نام">
          </label>
          <label class="field">
            <span class="field__label">نام خانوادگی</span>
            <input v-model="profileForm.lastName" class="field__input" type="text" placeholder="نام خانوادگی">
          </label>
        </div>
        <label class="field">
          <span class="field__label">ایمیل</span>
          <input v-model="profileForm.email" class="field__input" type="email" dir="ltr" placeholder="example@mail.com">
        </label>
        <label class="field">
          <span class="field__label">شماره موبایل</span>
          <input :value="displayPhone" class="field__input" type="text" dir="ltr" disabled>
        </label>

        <p v-if="profileError" class="msg msg--error">{{ profileError }}</p>
        <p v-if="profileSaved" class="msg msg--ok">تغییرات با موفقیت ذخیره شد</p>

        <button type="submit" class="btn-primary" :disabled="savingProfile">
          {{ savingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
        </button>
      </form>
    </section>

    <div class="section-gap" />

    <SectionHead title="آدرس‌های من" />
    <section class="panel">
      <div v-if="addressesLoading" class="empty-hint">در حال بارگذاری...</div>
      <div v-else class="addresses">
        <p v-if="!addresses.length" class="empty-hint">هنوز آدرسی ثبت نکرده‌اید</p>

        <div v-for="addr in addresses" :key="addr._id" class="addr-card">
          <div class="addr-card__head">
            <span class="addr-card__title">
              <AppIcon name="pin" :size="15" :stroke-width="1.8" />
              {{ addr.title }}
            </span>
            <span v-if="addr.isDefault" class="addr-card__badge">
              <AppIcon name="check" :size="10" :stroke-width="2.5" />
              پیش‌فرض
            </span>
          </div>
          <p class="addr-card__line">{{ addr.province }}، {{ addr.city }}، {{ addr.street }}</p>
          <p class="addr-card__line">{{ addr.detail }}</p>
          <p class="addr-card__line addr-card__meta">
            گیرنده: {{ addr.recipientName }} · <bdi>{{ toPersianDigits(addr.recipientPhone) }}</bdi> ·
            کد پستی <bdi>{{ toPersianDigits(addr.postalCode) }}</bdi>
          </p>
          <div class="addr-card__actions">
            <button
              v-if="!addr.isDefault"
              type="button"
              class="addr-card__action"
              :disabled="settingDefaultId === addr._id"
              @click="onSetDefault(addr)"
            >
              انتخاب به‌عنوان پیش‌فرض
            </button>
            <button type="button" class="addr-card__action" @click="onEditAddress(addr)">
              <AppIcon name="edit" :size="13" :stroke-width="1.8" /> ویرایش
            </button>
            <button
              type="button"
              class="addr-card__action addr-card__action--danger"
              :disabled="deletingId === addr._id"
              @click="onDeleteAddress(addr)"
            >
              <AppIcon name="trash" :size="13" :stroke-width="1.8" /> حذف
            </button>
          </div>
        </div>
      </div>

      <button v-if="!formOpen" type="button" class="add-btn" @click="openAddForm">
        <AppIcon name="plus" :size="16" :stroke-width="2" />
        افزودن آدرس جدید
      </button>

      <form v-else class="form addr-form" @submit.prevent="onSaveAddress">
        <p class="addr-form__title">{{ editingId ? 'ویرایش آدرس' : 'آدرس جدید' }}</p>

        <label class="field">
          <span class="field__label">عنوان آدرس</span>
          <input v-model="addressForm.title" class="field__input" type="text" placeholder="مثلاً خانه، محل کار">
        </label>
        <div class="form__row">
          <label class="field">
            <span class="field__label">استان</span>
            <input v-model="addressForm.province" class="field__input" type="text">
          </label>
          <label class="field">
            <span class="field__label">شهر</span>
            <input v-model="addressForm.city" class="field__input" type="text">
          </label>
        </div>
        <label class="field">
          <span class="field__label">خیابان</span>
          <input v-model="addressForm.street" class="field__input" type="text">
        </label>
        <label class="field">
          <span class="field__label">جزئیات آدرس (پلاک، واحد و...)</span>
          <textarea v-model="addressForm.detail" class="field__input field__textarea" rows="2" />
        </label>
        <div class="form__row">
          <label class="field">
            <span class="field__label">کد پستی</span>
            <input v-model="addressForm.postalCode" class="field__input" type="text" dir="ltr" inputmode="numeric" maxlength="10" placeholder="۱۰ رقم">
          </label>
          <label class="field">
            <span class="field__label">شماره گیرنده</span>
            <input v-model="addressForm.recipientPhone" class="field__input" type="text" dir="ltr" placeholder="09xxxxxxxxx">
          </label>
        </div>
        <label class="field">
          <span class="field__label">نام گیرنده</span>
          <input v-model="addressForm.recipientName" class="field__input" type="text">
        </label>
        <label class="checkbox">
          <input v-model="addressForm.isDefault" type="checkbox">
          <span>تنظیم به‌عنوان آدرس پیش‌فرض</span>
        </label>

        <p v-if="addressError" class="msg msg--error">{{ addressError }}</p>

        <div class="addr-form__actions">
          <button type="button" class="btn-ghost" @click="closeForm">انصراف</button>
          <button type="submit" class="btn-primary" :disabled="savingAddress">
            {{ savingAddress ? 'در حال ذخیره...' : 'ذخیره آدرس' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppIcon from '~/components/icons/AppIcon.vue'
import SectionHead from '~/components/ui/SectionHead.vue'
import { userService } from '~/services/user.service'
import { useAuthStore } from '~/stores/auth.store'
import { toPersianDigits } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'پروفایل من | نیک' })

const authStore = useAuthStore()

const displayPhone = toPersianDigits(authStore.user?.phone || '')

// ── Profile form ─────────────────────────────────────
const profileForm = reactive({
  firstName: authStore.user?.firstName || '',
  lastName: authStore.user?.lastName || '',
  email: authStore.user?.email || '',
})
const savingProfile = ref(false)
const profileError = ref('')
const profileSaved = ref(false)

async function onSaveProfile() {
  savingProfile.value = true
  profileError.value = ''
  profileSaved.value = false
  try {
    await userService.updateMe({
      firstName: profileForm.firstName?.trim() || undefined,
      lastName: profileForm.lastName?.trim() || undefined,
      email: profileForm.email?.trim() || undefined,
    })
    await authStore.fetchMe()
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 3000)
  } catch (e) {
    profileError.value = e.response?.data?.message || 'ذخیره اطلاعات با خطا مواجه شد'
  } finally {
    savingProfile.value = false
  }
}

// ── Addresses ────────────────────────────────────────
const addresses = ref(authStore.user?.addresses || [])
const addressesLoading = ref(false)

async function loadAddresses() {
  addressesLoading.value = true
  try {
    const data = await authStore.fetchMe()
    addresses.value = data?.addresses || []
  } finally {
    addressesLoading.value = false
  }
}

onMounted(() => {
  loadAddresses()
})

const EMPTY_ADDRESS = () => ({
  title: '',
  province: '',
  city: '',
  street: '',
  detail: '',
  postalCode: '',
  recipientName: '',
  recipientPhone: '',
  isDefault: false,
})

const formOpen = ref(false)
const editingId = ref(null)
const addressForm = reactive(EMPTY_ADDRESS())
const savingAddress = ref(false)
const addressError = ref('')
const settingDefaultId = ref(null)
const deletingId = ref(null)

function openAddForm() {
  editingId.value = null
  Object.assign(addressForm, EMPTY_ADDRESS())
  addressError.value = ''
  formOpen.value = true
}

function onEditAddress(addr) {
  editingId.value = addr._id
  Object.assign(addressForm, {
    title: addr.title,
    province: addr.province,
    city: addr.city,
    street: addr.street,
    detail: addr.detail,
    postalCode: addr.postalCode,
    recipientName: addr.recipientName,
    recipientPhone: addr.recipientPhone,
    isDefault: addr.isDefault,
  })
  addressError.value = ''
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
}

async function onSaveAddress() {
  if (!/^\d{10}$/.test(addressForm.postalCode)) {
    addressError.value = 'کد پستی باید ۱۰ رقم باشد'
    return
  }
  savingAddress.value = true
  addressError.value = ''
  try {
    const payload = { ...addressForm }
    if (editingId.value) {
      await userService.updateAddress(editingId.value, payload)
    } else {
      await userService.addAddress(payload)
    }
    await loadAddresses()
    closeForm()
  } catch (e) {
    addressError.value = e.response?.data?.message || 'ذخیره آدرس با خطا مواجه شد'
  } finally {
    savingAddress.value = false
  }
}

async function onSetDefault(addr) {
  settingDefaultId.value = addr._id
  try {
    await userService.setDefaultAddress(addr._id)
    await loadAddresses()
  } finally {
    settingDefaultId.value = null
  }
}

async function onDeleteAddress(addr) {
  if (typeof window !== 'undefined' && !window.confirm('این آدرس حذف شود؟')) return
  deletingId.value = addr._id
  try {
    await userService.removeAddress(addr._id)
    await loadAddresses()
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.profile { padding: 24px 0 8px; }
.section-gap { height: 26px; }

.panel { margin: 0 18px; }

.form { display: flex; flex-direction: column; gap: 14px; }
.form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field__label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.field__input {
  padding: 12px 14px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  outline: none;
}
.field__input:disabled { opacity: .6; }
.field__input::placeholder { color: var(--text-disabled); }
.field__textarea { resize: vertical; font-family: inherit; }
[data-theme='light'] .field__input {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: var(--glass-shadow);
}

.checkbox { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-secondary); }
.checkbox input { width: 16px; height: 16px; accent-color: var(--brand); }

.msg { font-size: 12px; margin: 0; }
.msg--error { color: #E8837F; }
.msg--ok { color: var(--brand-light); }
[data-theme='light'] .msg--ok { color: var(--brand-dark); }

.btn-primary {
  padding: 13px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .3);
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  font-family: inherit;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 55%, #2D6B3E 100%);
  box-shadow: 0 10px 22px rgba(40, 55, 46, .30), inset 0 1px 0 rgba(255, 255, 255, .35);
  cursor: pointer;
}
.btn-primary:disabled { opacity: .55; cursor: not-allowed; }

.btn-ghost {
  padding: 13px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 13.5px;
  font-family: inherit;
  background: transparent;
  cursor: pointer;
}

.empty-hint { font-size: 12.5px; color: var(--text-secondary); padding: 8px 2px; }

.addresses { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }

.addr-card {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(150deg, rgba(255, 255, 255, .42), rgba(255, 255, 255, .03) 55%, rgba(231, 175, 66, .28)) border-box;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
[data-theme='light'] .addr-card {
  border-width: 1.5px;
  box-shadow: var(--glass-shadow);
  background:
    linear-gradient(var(--glass), var(--glass)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(231, 175, 66, .5) 55%, rgba(122, 90, 220, .4) 100%) border-box;
}

.addr-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.addr-card__title { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--text-primary); }
.addr-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, rgba(110, 176, 130, .95), rgba(61, 139, 82, .9));
}

.addr-card__line { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }
.addr-card__meta { margin-top: 4px; font-size: 11px; }

.addr-card__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.addr-card__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  padding: 7px 10px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.addr-card__action--danger { color: #E8837F; }
.addr-card__action:disabled { opacity: .5; cursor: not-allowed; }

.add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px;
  border-radius: 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-light);
  background: var(--glass);
  border: 1px dashed var(--glass-border);
  cursor: pointer;
}
[data-theme='light'] .add-btn { color: var(--brand-dark); }

.addr-form { margin-top: 4px; padding: 16px; border-radius: 16px; background: var(--glass); border: 1px solid var(--glass-border); }
.addr-form__title { font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.addr-form__actions { display: flex; gap: 10px; }
.addr-form__actions .btn-ghost,
.addr-form__actions .btn-primary { flex: 1; }
</style>
