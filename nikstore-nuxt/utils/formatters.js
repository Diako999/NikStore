import dayjs from 'dayjs'

/** Format number as Persian Toman — e.g. 1200000 → "۱٬۲۰۰٬۰۰۰ تومان" */
export function formatPrice(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

export function formatNumber(n) {
  return new Intl.NumberFormat('fa-IR').format(n)
}

export function calcDiscount(original, discounted) {
  if (!original || !discounted) return 0
  return Math.round(((original - discounted) / original) * 100)
}

export function truncate(text, length = 60) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(iso))
}
