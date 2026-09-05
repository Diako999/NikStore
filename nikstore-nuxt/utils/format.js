const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** Convert any run of ASCII digits in a string/number to Persian (Eastern Arabic) digits. */
export function toPersianDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[d])
}

/** Zero-pad to 2 digits and convert to Persian numerals — used by the countdown timer. */
export function toPersianDigits2(n) {
  return toPersianDigits(String(n).padStart(2, '0'))
}

/** Persian thousands-grouped number, e.g. 3250000 -> "۳٬۲۵۰٬۰۰۰" */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return ''
  return new Intl.NumberFormat('fa-IR').format(amount)
}

/** Persian thousands-grouped Toman price, e.g. 3250000 -> "۳٬۲۵۰٬۰۰۰ تومان" */
export function formatPrice(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return ''
  return `${formatNumber(amount)} تومان`
}
