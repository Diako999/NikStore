<template>
  <div class="container-main py-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-text-primary">
        آدرس‌های من
        <span class="text-text-secondary font-normal text-sm font-fanum mr-2">
          ({{ addresses.length }} از ۱۰)
        </span>
      </h1>
      <GlassButton v-if="addresses.length < 10" variant="primary" size="sm" @click="openAdd">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
        </svg>
        افزودن آدرس
      </GlassButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 3" :key="i" class="h-44 rounded-2xl skeleton" />
    </div>

    <!-- Empty -->
    <BaseEmpty
      v-else-if="!addresses.length"
      icon="🏠"
      title="آدرسی ثبت نشده"
      subtitle="آدرس تحویل سفارش‌هایتان را اینجا ذخیره کنید"
      action="افزودن آدرس"
      @action="openAdd"
    />

    <!-- Address cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GlassCard
        v-for="addr in addresses" :key="addr._id"
        padding="lg"
        :tint="addr.isDefault ? 'accent-gold' : 'default'"
        class="flex flex-col gap-3 relative"
      >
        <!-- Default badge -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-glass-text-primary">{{ addr.title }}</span>
            <span
              v-if="addr.isDefault"
              class="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-medium"
            >
              پیش‌فرض
            </span>
          </div>
          <!-- Actions menu -->
          <div class="flex items-center gap-1">
            <button
              v-if="!addr.isDefault"
              @click="setDefault(addr)"
              :disabled="settingDefaultId === addr._id"
              class="text-xs text-brand hover:underline disabled:opacity-50 transition-opacity px-2 py-1"
            >
              {{ settingDefaultId === addr._id ? '...' : 'پیش‌فرض' }}
            </button>
            <button
              @click="openEdit(addr)"
              class="w-11 h-11 flex items-center justify-center rounded-lg text-glass-text-secondary hover:text-brand hover:bg-brand/5 transition-colors"
              :aria-label="`ویرایش آدرس ${addr.title}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="openDelete(addr)"
              class="w-11 h-11 flex items-center justify-center rounded-lg text-glass-text-secondary hover:text-error hover:bg-error/5 transition-colors"
              :aria-label="`حذف آدرس ${addr.title}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Address info -->
        <div class="text-sm text-glass-text-secondary leading-7 border-t border-glass-border pt-3">
          <p class="text-glass-text-primary font-medium">{{ addr.recipientName }}</p>
          <p class="font-fanum dir-ltr inline-block">{{ addr.recipientPhone }}</p>
          <p class="mt-1">
            {{ addr.province }}، {{ addr.city }}، {{ addr.street }}
          </p>
          <p>{{ addr.detail }}</p>
          <p class="text-xs font-fanum mt-1 text-glass-text-disabled">کد پستی: {{ addr.postalCode }}</p>
        </div>
      </GlassCard>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style="background: rgba(0,0,0,0.55)"
          @click.self="closeModal"
        >
          <div
            class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-glass-border bg-glass-strong backdrop-blur-xl flex flex-col max-h-[calc(90dvh-3.5rem)] sm:max-h-[85vh] mb-14 sm:mb-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0">
              <h2 id="address-modal-title" class="font-bold text-glass-text-primary">
                {{ editTarget ? 'ویرایش آدرس' : 'افزودن آدرس جدید' }}
              </h2>
              <button @click="closeModal" class="w-11 h-11 flex items-center justify-center rounded-lg text-glass-text-secondary hover:text-glass-text-primary transition-colors" aria-label="بستن">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal body (scrollable) -->
            <form @submit.prevent="handleSave" class="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

              <!-- Title -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">عنوان آدرس <span class="text-error">*</span></label>
                <div class="flex gap-2">
                  <button
                    v-for="preset in titlePresets" :key="preset"
                    type="button"
                    @click="form.title = preset"
                    :class="[
                      'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                      form.title === preset
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-glass-border text-glass-text-secondary hover:border-brand/40',
                    ]"
                  >
                    {{ preset }}
                  </button>
                </div>
                <GlassInput v-model="form.title" placeholder="مثلاً: خانه، محل کار" maxlength="30" :error="errors.title" required />
              </div>

              <!-- Recipient -->
              <div class="grid grid-cols-2 gap-3">
                <GlassInput v-model="form.recipientName" label="نام گیرنده" placeholder="نام و نام خانوادگی" maxlength="60" :error="errors.recipientName" required />
                <div class="flex flex-col gap-1.5">
                  <GlassInput v-model="form.recipientPhone" label="تلفن گیرنده" type="tel" class="font-fanum" dir="ltr" placeholder="09xxxxxxxxx" maxlength="11" :error="errors.recipientPhone" required />
                  <button
                    v-if="authStore.user?.phone && form.recipientPhone !== authStore.user.phone"
                    type="button"
                    @click="form.recipientPhone = authStore.user.phone"
                    class="flex items-center gap-1 text-xs text-brand hover:underline self-start mt-0.5"
                  >
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/>
                    </svg>
                    استفاده از شماره خودم ({{ authStore.user.phone }})
                  </button>
                </div>
              </div>

              <!-- Province + City dropdowns -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">استان <span class="text-error">*</span></label>
                  <div class="select-wrapper">
                    <select
                      v-model="form.province"
                      class="glass-select"
                      required
                      @change="onProvinceChange"
                    >
                      <option value="" disabled>انتخاب استان</option>
                      <option v-for="p in PROVINCE_NAMES" :key="p" :value="p">{{ p }}</option>
                    </select>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="form-label">شهر <span class="text-error">*</span></label>
                  <div class="select-wrapper">
                    <select
                      v-model="form.city"
                      class="glass-select"
                      required
                      :disabled="!form.province"
                    >
                      <option value="" disabled>{{ form.province ? 'انتخاب شهر' : 'اول استان را انتخاب کنید' }}</option>
                      <option v-for="c in availableCities" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Street -->
              <GlassInput v-model="form.street" label="خیابان / بلوار / کوچه" placeholder="خیابان ولیعصر، کوچه بهار" maxlength="100" required />

              <!-- Detail -->
              <div class="flex flex-col gap-1.5">
                <label class="form-label">جزئیات آدرس <span class="text-error">*</span></label>
                <textarea v-model="form.detail" class="glass-textarea" rows="2" placeholder="پلاک، طبقه، واحد..." maxlength="200" required />
              </div>

              <!-- Postal code -->
              <GlassInput v-model="form.postalCode" label="کد پستی" class="font-fanum" dir="ltr" placeholder="1234567890" maxlength="10" :error="errors.postalCode" required />

              <!-- Default toggle -->
              <label class="flex items-center gap-3 cursor-pointer select-none py-1">
                <div
                  role="switch"
                  :aria-checked="form.isDefault"
                  tabindex="0"
                  @click="form.isDefault = !form.isDefault"
                  @keydown.space.prevent="form.isDefault = !form.isDefault"
                  @keydown.enter.prevent="form.isDefault = !form.isDefault"
                  :class="[
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                    form.isDefault ? 'bg-brand' : 'bg-surface-border',
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      form.isDefault ? 'right-0.5' : 'left-0.5',
                    ]"
                  />
                </div>
                <span class="text-sm text-glass-text-primary">تنظیم به عنوان آدرس پیش‌فرض</span>
              </label>

            </form>

            <!-- Modal footer -->
            <div class="px-6 py-4 border-t border-glass-border flex gap-3 flex-shrink-0">
              <GlassButton variant="primary" :loading="saving" :disabled="saving" block @click="handleSave">
                {{ saving ? 'در حال ذخیره...' : (editTarget ? 'ذخیره تغییرات' : 'افزودن آدرس') }}
              </GlassButton>
              <GlassButton variant="secondary" @click="closeModal">
                انصراف
              </GlassButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="deleteTarget = null"
        @keydown.esc="deleteTarget = null"
      >
        <GlassCard
          padding="lg"
          class="w-full max-w-sm flex flex-col gap-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-addr-title"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-error" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16"/>
              </svg>
            </div>
            <div>
              <p id="delete-addr-title" class="font-bold text-glass-text-primary">حذف آدرس</p>
              <p class="text-sm text-glass-text-secondary mt-0.5">«{{ deleteTarget?.title }}»</p>
            </div>
          </div>
          <p class="text-sm text-glass-text-secondary leading-6">آیا از حذف این آدرس مطمئن هستید؟ این عملیات قابل برگشت نیست.</p>
          <div class="flex gap-3">
            <button
              @click="confirmDelete"
              :disabled="deleting"
              class="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {{ deleting ? 'در حال حذف...' : 'حذف شود' }}
            </button>
            <button
              @click="deleteTarget = null"
              class="flex-1 py-2.5 rounded-xl border border-glass-border text-sm text-glass-text-secondary hover:text-glass-text-primary transition-colors"
            >
              انصراف
            </button>
          </div>
        </GlassCard>
      </div>
    </Teleport>

  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'آدرس‌های من', robots: 'noindex,nofollow' })


import { ref, computed, onMounted } from 'vue'
import { userService }     from '~/services/user.service'
import { useAuthStore }    from '~/stores/auth.store'
import { useUiStore }      from '~/stores/ui.store'
import BaseEmpty           from '~/components/common/BaseEmpty.vue'
import GlassCard            from '~/components/glass/GlassCard.vue'
import GlassButton          from '~/components/glass/GlassButton.vue'
import GlassInput           from '~/components/glass/GlassInput.vue'
import { PROVINCE_NAMES, getCities } from '~/data/iran-cities'

const authStore = useAuthStore()
const ui        = useUiStore()

const addresses      = ref([])
const loading        = ref(true)
const showModal      = ref(false)
const editTarget     = ref(null)
const deleteTarget   = ref(null)
const settingDefaultId = ref(null)
const saving         = ref(false)
const deleting       = ref(false)

const titlePresets = ['خانه', 'محل کار', 'خانه پدری']

const emptyForm = () => ({
  title: '', province: '', city: '', street: '',
  detail: '', postalCode: '', recipientName: '', recipientPhone: '',
  isDefault: false,
})

const form   = ref(emptyForm())
const errors = ref({})

const availableCities = computed(() => getCities(form.value.province))

function onProvinceChange() {
  form.value.city = ''
}

// ── Fetch ──────────────────────────────────────────────────────
async function fetchAddresses() {
  loading.value = true
  try {
    const { data } = await userService.getProfile()
    addresses.value = data.addresses ?? []
    authStore.user  = data
  } catch {
    ui.addToast('خطا در دریافت آدرس‌ها', 'error')
  } finally {
    loading.value = false
  }
}

// ── Modal ──────────────────────────────────────────────────────
function openAdd() {
  editTarget.value = null
  form.value       = emptyForm()
  errors.value     = {}
  showModal.value  = true
}

function openEdit(addr) {
  editTarget.value = addr
  form.value = {
    title:          addr.title,
    province:       addr.province,
    city:           addr.city,
    street:         addr.street,
    detail:         addr.detail,
    postalCode:     addr.postalCode,
    recipientName:  addr.recipientName,
    recipientPhone: addr.recipientPhone,
    isDefault:      addr.isDefault,
  }
  errors.value    = {}
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

// ── Validate ───────────────────────────────────────────────────
function validate() {
  const e = {}
  if (!form.value.title.trim())          e.title = 'عنوان الزامی است'
  if (!form.value.recipientName.trim())  e.recipientName = 'نام گیرنده الزامی است'
  if (!/^(\+98|0)?9\d{9}$/.test(form.value.recipientPhone))
    e.recipientPhone = 'شماره تلفن معتبر نیست (مثال: 09123456789)'
  if (!/^\d{10}$/.test(form.value.postalCode))
    e.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد'
  errors.value = e
  return !Object.keys(e).length
}

// ── Save ───────────────────────────────────────────────────────
async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    let data
    if (editTarget.value) {
      ;({ data } = await userService.updateAddress(editTarget.value._id, form.value))
    } else {
      ;({ data } = await userService.addAddress(form.value))
    }
    addresses.value = data.addresses ?? []
    authStore.user  = data
    closeModal()
    ui.addToast(editTarget.value ? 'آدرس ویرایش شد' : 'آدرس افزوده شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg || 'خطا در ذخیره آدرس'), 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────
function openDelete(addr) {
  deleteTarget.value = addr
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const { data } = await userService.deleteAddress(deleteTarget.value._id)
    addresses.value    = data.addresses ?? []
    authStore.user     = data
    deleteTarget.value = null
    ui.addToast('آدرس حذف شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(msg || 'خطا در حذف آدرس', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Set default ─────────────────────────────────────────────────
async function setDefault(addr) {
  settingDefaultId.value = addr._id
  try {
    const { data } = await userService.setDefault(addr._id)
    addresses.value    = data.addresses ?? []
    authStore.user     = data
    ui.addToast('آدرس پیش‌فرض تغییر کرد', 'success')
  } catch {
    ui.addToast('خطا در تنظیم آدرس پیش‌فرض', 'error')
  } finally {
    settingDefaultId.value = null
  }
}

onMounted(fetchAddresses)
</script>

<style scoped>
.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
}
.dir-ltr { direction: ltr; }

/* select/textarea — matches GlassInput's shallow-blur, high-contrast recipe
   (GlassInput itself only renders <input>, see checkout.vue for the same
   pattern). */
.glass-select, .glass-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.875rem;
  border: 1.5px solid var(--glass-border);
  background: var(--glass);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.glass-select:focus, .glass-textarea:focus {
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px rgb(var(--brand-rgb) / 0.18);
}
.glass-textarea { resize: none; }

.select-wrapper {
  position: relative;
}
.select-wrapper::after {
  content: '';
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--text-secondary);
  pointer-events: none;
}
.glass-select {
  appearance: none;
  -webkit-appearance: none;
  padding-left: 2rem;
  cursor: pointer;
}
.glass-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .w-full,
.modal-leave-active .w-full { transition: transform 0.25s ease; }
.modal-enter-from .w-full { transform: translateY(40px); }
.modal-leave-to .w-full { transform: translateY(40px); }
</style>
