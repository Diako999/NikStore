<template>
  <div class="container-main py-8 min-h-[70vh]">

    <!-- Sticky mobile total bar (UXID-016) -->
    <div v-if="checkoutItems.length" class="sticky top-14 z-10 lg:hidden bg-card border-b border-surface-border px-4 py-2.5 flex justify-between items-center text-sm shadow-sm -mx-4 mb-4">
      <span class="text-text-secondary">مبلغ قابل پرداخت</span>
      <span class="font-fanum font-black text-brand text-base">{{ formatPrice(checkoutTotal) }}</span>
    </div>

    <!-- Stepper -->
    <ol class="flex items-center justify-center gap-0 mb-10 select-none list-none p-0 m-0" aria-label="مراحل تکمیل خرید">
      <template v-for="(s, i) in steps" :key="s.key">
        <li class="flex flex-col items-center gap-1.5" :aria-current="currentStep === i ? 'step' : undefined">
          <div :class="[
            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
            currentStep > i ? 'bg-brand text-white'
              : currentStep === i ? 'bg-brand text-white ring-4 ring-brand/20'
              : 'bg-surface-border text-text-disabled',
          ]" aria-hidden="true">
            <svg v-if="currentStep > i" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span :class="['text-xs font-medium whitespace-nowrap', currentStep >= i ? 'text-text-primary' : 'text-text-disabled']">{{ s.label }}</span>
        </li>
        <li v-if="i < steps.length - 1" :class="['h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-all duration-300', currentStep > i ? 'bg-brand' : 'bg-surface-border']" aria-hidden="true" />
      </template>
    </ol>

    <!-- Empty cart guard -->
    <div v-if="!checkoutItems.length && !placing" class="text-center py-20">
      <div class="text-5xl mb-4">🛒</div>
      <p class="text-text-secondary mb-4">سبد خرید شما خالی است</p>
      <NuxtLink to="/products" class="btn-brand px-6 py-2.5 text-sm">مشاهده محصولات</NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      <!-- Main content -->
      <div class="lg:col-span-2 space-y-5">

        <!-- STEP 0: آدرس تحویل -->
        <div v-show="currentStep === 0" :inert="currentStep !== 0">
          <div class="rounded-2xl border border-surface-border p-5 space-y-4 bg-card">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">۱</span>
              آدرس تحویل
            </h2>

            <div v-if="loadingAddresses" class="space-y-3">
              <div v-for="i in 2" :key="i" class="h-24 rounded-xl skeleton" />
            </div>

            <div v-else-if="addresses.length" class="space-y-3">
              <div
                role="radiogroup"
                aria-labelledby="addr-group-label"
              >
                <span id="addr-group-label" class="sr-only">انتخاب آدرس تحویل</span>
                <div
                  v-for="addr in addresses" :key="addr._id"
                  role="radio"
                  :aria-checked="selectedAddressId === addr._id"
                  tabindex="0"
                  @click="selectedAddressId = addr._id"
                  @keydown.enter.prevent="selectedAddressId = addr._id"
                  @keydown.space.prevent="selectedAddressId = addr._id"
                  :class="['flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedAddressId === addr._id ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1']"
                >
                  <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                    selectedAddressId === addr._id ? 'border-brand' : 'border-surface-border']" aria-hidden="true">
                    <div v-if="selectedAddressId === addr._id" class="w-2.5 h-2.5 rounded-full bg-brand" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-text-primary text-sm">{{ addr.title }}</span>
                      <span v-if="addr.isDefault" class="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">پیش‌فرض</span>
                    </div>
                    <p class="text-text-primary text-sm mt-1">{{ addr.recipientName }}</p>
                    <p class="text-text-secondary text-xs mt-0.5 leading-5">{{ addr.province }}، {{ addr.city }}، {{ addr.street }}، {{ addr.detail }}</p>
                    <p class="text-text-disabled text-xs font-fanum mt-0.5">{{ addr.recipientPhone }} · کد پستی: {{ addr.postalCode }}</p>
                  </div>
                </div>
              </div>

              <button @click="showAddressForm = !showAddressForm"
                class="w-full py-3 rounded-xl border-2 border-dashed border-surface-border text-sm text-text-secondary hover:border-brand/40 hover:text-brand transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                {{ showAddressForm ? 'بستن فرم' : 'افزودن آدرس جدید' }}
              </button>
            </div>

            <div v-else-if="!loadingAddresses && !showAddressForm" class="py-6 text-center">
              <p class="text-text-secondary text-sm mb-3">آدرسی ثبت نشده است</p>
              <button @click="showAddressForm = true" class="btn-brand text-sm px-4 py-2">افزودن آدرس</button>
            </div>

            <Transition name="expand">
              <form v-if="showAddressForm" class="border-t border-surface-border pt-5 space-y-5" @submit.prevent="saveNewAddress" novalidate>

                <!-- عنوان آدرس — full width with chip presets -->
                <div class="flex flex-col gap-2">
                  <label for="addr-title" class="form-label">عنوان آدرس <span class="text-error" aria-hidden="true">*</span></label>
                  <div class="flex gap-2" role="group" aria-label="انتخاب سریع عنوان">
                    <button
                      v-for="p in ['خانه', 'محل کار', 'خانه پدری']" :key="p"
                      type="button"
                      @click="addrForm.title = p"
                      :class="[
                        'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150',
                        addrForm.title === p
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-surface-border text-text-secondary hover:border-brand/40 hover:text-brand',
                      ]"
                    >{{ p }}</button>
                  </div>
                  <input id="addr-title" v-model="addrForm.title" class="form-input" placeholder="یا عنوان دلخواه بنویس..." maxlength="30" :aria-required="true" />
                  <p v-if="addrErrors.title" role="alert" class="text-error text-xs">{{ addrErrors.title }}</p>
                </div>

                <!-- نام + تلفن -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-name" class="form-label">نام گیرنده <span class="text-error" aria-hidden="true">*</span></label>
                    <input id="addr-name" v-model="addrForm.recipientName" class="form-input" placeholder="نام و نام خانوادگی" :aria-required="true" />
                    <p v-if="addrErrors.recipientName" role="alert" class="text-error text-xs">{{ addrErrors.recipientName }}</p>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-phone" class="form-label">تلفن گیرنده <span class="text-error" aria-hidden="true">*</span></label>
                    <input id="addr-phone" v-model="addrForm.recipientPhone" class="form-input font-fanum" dir="ltr" placeholder="09xxxxxxxxx" type="tel" :aria-required="true" />
                    <button
                      v-if="auth.user?.phone && addrForm.recipientPhone !== auth.user.phone"
                      type="button"
                      @click="addrForm.recipientPhone = auth.user.phone"
                      class="flex items-center gap-1 text-xs text-brand hover:text-brand/70 transition-colors self-start"
                    >
                      <svg class="w-3 h-3 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/>
                      </svg>
                      استفاده از شماره خودم ({{ auth.user.phone }})
                    </button>
                    <p v-if="addrErrors.recipientPhone" role="alert" class="text-error text-xs">{{ addrErrors.recipientPhone }}</p>
                  </div>
                </div>

                <!-- استان + شهر -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-province" class="form-label">استان <span class="text-error" aria-hidden="true">*</span></label>
                    <div class="select-wrapper">
                      <select id="addr-province" v-model="addrForm.province" class="form-input form-select" @change="addrForm.city = ''" :aria-required="true">
                        <option value="" disabled>انتخاب استان</option>
                        <option v-for="p in PROVINCE_NAMES" :key="p" :value="p">{{ p }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-city" class="form-label">شهر <span class="text-error" aria-hidden="true">*</span></label>
                    <div class="select-wrapper">
                      <select id="addr-city" v-model="addrForm.city" class="form-input form-select" :disabled="!addrForm.province" :aria-required="true">
                        <option value="" disabled>{{ addrForm.province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید' }}</option>
                        <option v-for="c in addrCities" :key="c" :value="c">{{ c }}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- خیابان + کد پستی -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-street" class="form-label">خیابان / کوچه <span class="text-error" aria-hidden="true">*</span></label>
                    <input id="addr-street" v-model="addrForm.street" class="form-input" placeholder="خیابان ولیعصر، کوچه بهار" :aria-required="true" />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="addr-postal" class="form-label">کد پستی <span class="text-error" aria-hidden="true">*</span></label>
                    <input id="addr-postal" v-model="addrForm.postalCode" class="form-input font-fanum" dir="ltr" placeholder="1234567890" maxlength="10" :aria-required="true" />
                    <p v-if="addrErrors.postalCode" role="alert" class="text-error text-xs">{{ addrErrors.postalCode }}</p>
                  </div>
                </div>

                <!-- جزئیات -->
                <div class="flex flex-col gap-1.5">
                  <label for="addr-detail" class="form-label">جزئیات آدرس (پلاک، طبقه، واحد) <span class="text-error" aria-hidden="true">*</span></label>
                  <textarea id="addr-detail" v-model="addrForm.detail" class="form-input resize-none" rows="2" placeholder="مثال: پلاک ۱۲، طبقه سوم، واحد ۷" :aria-required="true" />
                </div>

                <button type="submit" :disabled="savingAddress" class="btn-brand text-sm px-6 py-3 flex items-center gap-2 disabled:opacity-50 w-full justify-center sm:w-auto">
                  <svg v-if="savingAddress" class="w-4 h-4 animate-spin" aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  <svg v-else class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M5 13l4 4L19 7"/></svg>
                  {{ savingAddress ? 'در حال ذخیره...' : 'ذخیره و استفاده از این آدرس' }}
                </button>

              </form>
            </Transition>
          </div>

          <div class="flex justify-end mt-4">
            <button @click="goToStep(1)" :disabled="!selectedAddressId" class="btn-brand px-8 py-3 flex items-center gap-2 disabled:opacity-40">
              ادامه — بررسی سفارش
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
          </div>
        </div>

        <!-- STEP 1: بررسی سفارش -->
        <div v-show="currentStep === 1" :inert="currentStep !== 1">
          <div class="rounded-2xl border border-surface-border p-5 space-y-4 bg-card">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">۲</span>
              بررسی سفارش
            </h2>
            <div class="space-y-3">
              <div v-for="item in checkoutItems" :key="`${item.productId}-${item.variantId}`"
                class="flex items-center gap-3 py-3 border-b border-surface-border last:border-0">
                <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-14 h-14 object-cover rounded-lg flex-shrink-0" @error="e => e.target.src = PLACEHOLDER" />
                <div class="flex-1 min-w-0">
                  <p class="text-text-primary text-sm font-medium line-clamp-1">{{ item.name }}</p>
                  <div v-if="item.attributes?.length" class="flex gap-1 mt-1 flex-wrap">
                    <span v-for="a in item.attributes" :key="a.key" class="text-[11px] text-text-disabled bg-surface px-1.5 py-0.5 rounded">{{ a.key }}: {{ a.value }}</span>
                  </div>
                </div>
                <div class="text-left flex-shrink-0 text-sm">
                  <p class="font-fanum text-text-secondary">× {{ formatNumber(item.quantity) }}</p>
                  <p class="font-fanum font-bold text-text-primary mt-0.5">{{ formatPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <label class="form-label">کد تخفیف</label>
              <div class="flex gap-2">
                <input v-model="couponCode" class="form-input flex-1 uppercase tracking-widest" dir="ltr" placeholder="کد تخفیف (اختیاری)"
                  :disabled="couponApplied || checkingCoupon" @keydown.enter="applyCoupon" @input="couponMessage = ''; couponError = false" />
                <button v-if="!couponApplied" @click="applyCoupon" :disabled="!couponCode.trim() || checkingCoupon"
                  class="px-4 py-2.5 rounded-xl border border-brand text-brand text-sm font-medium hover:bg-brand hover:text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0">
                  <svg v-if="checkingCoupon" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  {{ checkingCoupon ? 'بررسی...' : 'اعمال' }}
                </button>
                <button v-else @click="removeCoupon" class="px-4 py-2.5 rounded-xl border border-error text-error text-sm font-medium hover:bg-error hover:text-white transition-colors">حذف</button>
              </div>
              <p v-if="couponMessage" :class="['text-xs font-medium flex items-center gap-1', couponError ? 'text-error' : 'text-success']">
                <span v-if="couponError">✕</span>{{ couponMessage }}
              </p>
            </div>
            <div class="space-y-2">
              <label class="form-label">یادداشت برای سفارش (اختیاری)</label>
              <textarea v-model="orderNote" class="form-input resize-none" rows="2" placeholder="اگر توضیح خاصی برای سفارش دارید بنویسید..." maxlength="300" />
              <p class="text-xs text-text-disabled font-fanum text-left">{{ orderNote.length }}/۳۰۰</p>
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button @click="goToStep(0)" class="px-5 py-2.5 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
              بازگشت
            </button>
            <button @click="goToStep(2)" class="btn-brand px-8 py-3 flex items-center gap-2">
              ادامه — پرداخت
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
          </div>
        </div>

        <!-- STEP 2: روش پرداخت -->
        <div v-show="currentStep === 2" :inert="currentStep !== 2">
          <div class="rounded-2xl border border-surface-border p-5 space-y-5 bg-card">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">۳</span>
              روش پرداخت
            </h2>
            <div class="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <div class="flex items-center gap-2 text-sm text-text-secondary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                موجودی کیف پول
              </div>
              <span class="font-fanum font-bold text-text-primary">{{ loadingWallet ? '...' : formatPrice(walletBalance) }}</span>
            </div>
            <div class="space-y-3">
              <label :class="['flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', paymentMethod === 'gateway' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30']">
                <input type="radio" value="gateway" v-model="paymentMethod" class="sr-only" />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'gateway' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'gateway'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div>
                  <p class="font-semibold text-text-primary text-sm">پرداخت آنلاین (درگاه بانکی)</p>
                  <p class="text-text-secondary text-xs mt-0.5">پرداخت کامل از طریق درگاه بانکی امن</p>
                </div>
              </label>
              <label :class="['flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                walletBalance < checkoutTotal ? 'border-surface-border opacity-50 cursor-not-allowed'
                  : paymentMethod === 'wallet' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30']">
                <input type="radio" value="wallet" v-model="paymentMethod" class="sr-only" :disabled="walletBalance < checkoutTotal" />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'wallet' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'wallet'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div>
                  <p class="font-semibold text-text-primary text-sm">پرداخت از کیف پول</p>
                  <p class="text-text-secondary text-xs mt-0.5">{{ walletBalance < checkoutTotal ? `موجودی کافی نیست (کمبود: ${formatPrice(checkoutTotal - walletBalance)})` : 'پرداخت فوری بدون نیاز به درگاه' }}</p>
                </div>
                <span class="mr-auto text-xs font-fanum text-brand font-bold flex-shrink-0">{{ formatPrice(walletBalance) }}</span>
              </label>
              <label v-if="walletBalance > 0 && walletBalance < checkoutTotal" :class="['flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', paymentMethod === 'mixed' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30']">
                <input type="radio" value="mixed" v-model="paymentMethod" class="sr-only" />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'mixed' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'mixed'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-text-primary text-sm">ترکیبی (کیف پول + درگاه)</p>
                  <p class="text-text-secondary text-xs mt-0.5">بخشی از کیف پول، مابقی از درگاه</p>
                  <Transition name="expand">
                    <div v-if="paymentMethod === 'mixed'" class="mt-3 space-y-2">
                      <label for="wallet-amount-input" class="form-label text-xs">مبلغ از کیف پول (تومان)</label>
                      <div class="flex items-center gap-2">
                        <button type="button" @click="walletAmount = Math.max(1, walletAmount - 10000)"
                          class="w-9 h-9 rounded-lg border border-surface-border flex items-center justify-center text-text-primary hover:bg-surface transition-colors flex-shrink-0"
                          aria-label="کاهش مبلغ کیف پول">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M20 12H4"/></svg>
                        </button>
                        <input
                          id="wallet-amount-input"
                          type="number"
                          v-model.number="walletAmount"
                          :min="1"
                          :max="walletBalance"
                          :step="10000"
                          class="form-input flex-1 text-center font-fanum font-bold"
                          dir="ltr"
                          :aria-label="`مبلغ از کیف پول، حداکثر ${formatPrice(walletBalance)}`"
                          :aria-valuenow="walletAmount"
                          :aria-valuemin="1"
                          :aria-valuemax="walletBalance"
                          @change="walletAmount = Math.min(walletBalance, Math.max(1, walletAmount))"
                        />
                        <button type="button" @click="walletAmount = Math.min(walletBalance, walletAmount + 10000)"
                          class="w-9 h-9 rounded-lg border border-surface-border flex items-center justify-center text-text-primary hover:bg-surface transition-colors flex-shrink-0"
                          aria-label="افزایش مبلغ کیف پول">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                      <p class="text-xs text-text-secondary font-fanum">مابقی از درگاه: <strong class="text-text-primary">{{ formatPrice(checkoutTotal - walletAmount) }}</strong></p>
                    </div>
                  </Transition>
                </div>
              </label>
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button @click="goToStep(1)" class="px-5 py-2.5 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
              بازگشت
            </button>
            <button @click="placeOrder" :disabled="placing" class="btn-brand px-8 py-3 flex items-center gap-2 disabled:opacity-50">
              <svg v-if="placing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              {{ placing ? 'در حال پردازش...' : 'تأیید و پرداخت' }}
            </button>
          </div>
        </div>

      </div>

      <!-- Sticky order summary -->
      <div class="rounded-2xl border border-surface-border p-5 flex flex-col gap-4 lg:sticky lg:top-24 bg-card">
        <h2 class="font-bold text-text-primary text-sm border-b border-surface-border pb-3">خلاصه سبد خرید</h2>
        <div class="space-y-2 max-h-52 overflow-y-auto">
          <div v-for="item in checkoutItems" :key="`${item.productId}-${item.variantId}`" class="flex items-center gap-2">
            <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" @error="e => e.target.src = PLACEHOLDER" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-primary line-clamp-1">{{ item.name }}</p>
              <p class="text-xs text-text-disabled font-fanum">× {{ formatNumber(item.quantity) }}</p>
            </div>
            <span class="text-xs font-fanum font-medium text-text-primary flex-shrink-0">{{ formatPrice(item.price * item.quantity) }}</span>
          </div>
        </div>
        <div class="space-y-2 text-sm border-t border-surface-border pt-3">
          <div class="flex justify-between text-text-secondary"><span>جمع کالاها</span><span class="font-fanum">{{ formatPrice(subtotal) }}</span></div>
          <div v-if="savings > 0" class="flex justify-between text-success"><span>تخفیف</span><span class="font-fanum">− {{ formatPrice(savings) }}</span></div>
          <div v-if="couponApplied" class="flex justify-between text-success text-xs">
            <span>کد تخفیف «{{ couponCode }}»</span>
            <span class="font-fanum">{{ discountAmount > 0 ? `− ${formatPrice(discountAmount)}` : 'اعمال شد ✓' }}</span>
          </div>
          <div class="flex justify-between text-text-secondary"><span>هزینه ارسال</span><span class="text-success font-medium">رایگان</span></div>
        </div>
        <div class="border-t border-surface-border pt-3">
          <div class="flex justify-between items-center">
            <span class="font-bold text-text-primary">مبلغ قابل پرداخت</span>
            <span class="text-brand text-lg font-black font-fanum">{{ formatPrice(checkoutTotal) }}</span>
          </div>
          <p v-if="savings > 0" class="text-success text-xs font-fanum text-left mt-1">{{ formatPrice(savings) }} صرفه‌جویی</p>
        </div>
        <div v-if="selectedAddress && currentStep > 0" class="border-t border-surface-border pt-3 text-xs text-text-secondary space-y-0.5">
          <p class="font-semibold text-text-primary flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-brand flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            آدرس تحویل:
          </p>
          <p>{{ selectedAddress.recipientName }}</p>
          <p>{{ selectedAddress.city }}، {{ selectedAddress.street }}</p>
        </div>
        <div class="border-t border-surface-border pt-3 grid grid-cols-2 gap-2">
          <div v-for="t in trustBadges" :key="t.label" class="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <component :is="t.icon" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ t.label }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { formatPrice, formatNumber } from '~/utils/formatters'
import { userService }     from '~/services/user.service'
import { orderService }    from '~/services/order.service'
import { paymentService }  from '~/services/payment.service'
import { discountService } from '~/services/discount.service'
import { PROVINCE_NAMES, getCities } from '~/data/iran-cities'

definePageMeta({ layout: 'default', middleware: ['auth'] })
useSeoMeta({ title: 'تکمیل خرید', robots: 'noindex' })

const router    = useRouter()
const cartStore = useCartStore()
const auth      = useAuthStore()
const ui        = useUiStore()

const checkoutItems = computed(() => cartStore.items)
const checkoutTotal = computed(() => cartStore.totalPrice)

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="%23e2e8f0"%3E%3Crect width="56" height="56"/%3E%3C/svg%3E'

const steps = [
  { key: 'address', label: 'آدرس' },
  { key: 'review',  label: 'بررسی' },
  { key: 'payment', label: 'پرداخت' },
]
const currentStep = ref(0)
function goToStep(n) { currentStep.value = n; if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' }) }

const addresses         = ref([])
const loadingAddresses  = ref(true)
const selectedAddressId = ref(null)
const showAddressForm   = ref(false)
const savingAddress     = ref(false)
const selectedAddress   = computed(() => addresses.value.find(a => a._id === selectedAddressId.value) ?? null)

const addrForm   = ref({ title: '', recipientName: '', recipientPhone: '', postalCode: '', province: '', city: '', street: '', detail: '' })
const addrCities = computed(() => getCities(addrForm.value.province))
const addrErrors = ref({})

async function fetchAddresses() {
  loadingAddresses.value = true
  try {
    const { data } = await userService.getProfile()
    addresses.value = data.addresses ?? []
    const def = addresses.value.find(a => a.isDefault) ?? addresses.value[0]
    if (def) selectedAddressId.value = def._id
    if (!addresses.value.length) showAddressForm.value = true
  } catch { ui.addToast('خطا در دریافت آدرس‌ها', 'error') }
  finally { loadingAddresses.value = false }
}

function validateAddrForm() {
  const e = {}
  if (!addrForm.value.title.trim())         e.title = 'الزامی است'
  if (!addrForm.value.recipientName.trim()) e.recipientName = 'الزامی است'
  if (!/^0?9\d{9}$/.test(addrForm.value.recipientPhone)) e.recipientPhone = 'شماره معتبر نیست'
  if (!/^\d{10}$/.test(addrForm.value.postalCode))        e.postalCode = 'باید ۱۰ رقم باشد'
  addrErrors.value = e
  return !Object.keys(e).length
}

async function saveNewAddress() {
  if (!validateAddrForm()) return
  savingAddress.value = true
  try {
    const { data } = await userService.addAddress(addrForm.value)
    addresses.value = data.addresses ?? []
    auth.user = data
    const newest = addresses.value[addresses.value.length - 1]
    if (newest) selectedAddressId.value = newest._id
    showAddressForm.value = false
    addrForm.value = { title: '', recipientName: '', recipientPhone: '', postalCode: '', province: '', city: '', street: '', detail: '' }
    ui.addToast('آدرس ذخیره شد', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ذخیره آدرس'), 'error')
  } finally { savingAddress.value = false }
}

const couponCode     = ref('')
const couponApplied  = ref(false)
const couponMessage  = ref('')
const couponError    = ref(false)
const checkingCoupon = ref(false)
const discountAmount = ref(0)

async function applyCoupon() {
  const code = couponCode.value.trim().toUpperCase()
  if (!code) return
  checkingCoupon.value = true; couponMessage.value = ''; couponError.value = false
  try {
    const { data } = await discountService.validate(code, checkoutTotal.value)
    if (data.isValid) {
      couponApplied.value = true; couponError.value = false
      discountAmount.value = data.discountAmount ?? 0
      couponMessage.value = data.discountAmount ? `${formatPrice(data.discountAmount)} تخفیف اعمال شد ✓` : 'کد تخفیف اعمال شد ✓'
    } else {
      couponApplied.value = false; couponError.value = true; discountAmount.value = 0
      couponMessage.value = data.message || 'کد تخفیف وجود ندارد'
    }
  } catch (err) {
    couponApplied.value = false; couponError.value = true; discountAmount.value = 0
    const msg = err?.response?.data?.message
    couponMessage.value = Array.isArray(msg) ? msg[0] : (msg || 'کد تخفیف معتبر نیست')
  } finally { checkingCoupon.value = false }
}

function removeCoupon() { couponCode.value = ''; couponApplied.value = false; couponMessage.value = ''; couponError.value = false; discountAmount.value = 0 }

const orderNote     = ref('')
const walletBalance = ref(0)
const loadingWallet = ref(false)
const paymentMethod = ref('gateway')
const walletAmount  = ref(0)


const subtotal = computed(() => checkoutItems.value.reduce((s, i) => s + (i.comparePrice > i.price ? i.comparePrice : i.price) * i.quantity, 0))
const savings  = computed(() => subtotal.value - checkoutTotal.value)

const placing = ref(false)

async function placeOrder() {
  if (!selectedAddressId.value) { ui.addToast('آدرس تحویل را انتخاب کنید', 'error'); return }
  placing.value = true
  try {
    const orderDto = {
      addressId: selectedAddressId.value,
      ...(orderNote.value.trim() ? { note: orderNote.value.trim() } : {}),
      ...(couponApplied.value && couponCode.value ? { couponCode: couponCode.value.trim() } : {}),
    }
    const { data: order } = await orderService.createOrder(orderDto)
    const payDto = {
      orderId: order._id,
      method:  paymentMethod.value,
      callbackUrl: `${window.location.origin}/payment/result?orderId=${order._id}`,
      ...(paymentMethod.value === 'mixed' ? { walletAmount: walletAmount.value } : {}),
    }
    const { data: payment } = await paymentService.payOrder(payDto)
    if (payment.success) {
      await cartStore.fetchCart()
      router.push({ path: '/payment/result', query: { status: 'success', orderId: order._id } })
    } else if (payment.gatewayUrl) {
      window.location.href = payment.gatewayUrl
    }
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ثبت سفارش'), 'error')
  } finally { placing.value = false }
}

const IconLock    = { template: `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>` }
const IconReturn  = { template: `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>` }
const IconShield  = { template: `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>` }
const IconTruck   = { template: `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>` }

const trustBadges = [
  { icon: IconLock,   label: 'پرداخت امن' },
  { icon: IconReturn, label: 'ضمانت بازگشت' },
  { icon: IconShield, label: 'اصالت کالا' },
  { icon: IconTruck,  label: 'ارسال رایگان' },
]

onMounted(async () => {
  await cartStore.fetchCart()
  loadingWallet.value = true
  await Promise.all([
    fetchAddresses(),
    paymentService.getBalance().then(({ data }) => {
      walletBalance.value = data.balance ?? 0
      walletAmount.value  = Math.min(walletBalance.value, checkoutTotal.value - 1)
    }).catch(() => {}).finally(() => { loadingWallet.value = false }),
  ])
})
</script>

<style scoped>
.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-primary); }
.form-input {
  width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem;
  border: 1px solid var(--color-border, var(--color-surface-border));
  background-color: var(--color-bg, var(--color-surface));
  color: var(--color-text-primary); font-size: 0.875rem; outline: none;
  transition: border-color 0.15s; font-family: inherit;
}
.form-input:focus { border-color: var(--color-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent); }
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 600px; opacity: 1; }
.select-wrapper { position: relative; }
.select-wrapper::after {
  content: '';
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--color-text-secondary);
  pointer-events: none;
}
.form-select { appearance: none; -webkit-appearance: none; padding-left: 2rem; cursor: pointer; }
.form-select:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
