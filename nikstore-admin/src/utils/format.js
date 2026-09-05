// Persian number/price/date formatting shared across admin pages.

/** Persian thousands-grouped number, e.g. 3250000 -> "۳٬۲۵۰٬۰۰۰" */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('fa-IR').format(amount)
}

/** Persian thousands-grouped Toman price, e.g. 3250000 -> "۳٬۲۵۰٬۰۰۰ تومان" */
export function formatPrice(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  return `${formatNumber(amount)} تومان`
}

/** Persian calendar date, e.g. "۱۴۰۳/۰۶/۱۵" */
export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date)
}

/** Persian calendar date + time, e.g. "۱۴۰۳/۰۶/۱۵، ۱۴:۳۰" */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
