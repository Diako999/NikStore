export const formatPrice = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fa-IR').format(n) + ' تومان'

export const formatNumber = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fa-IR').format(n)

export const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(iso)) : '—'

export const formatDateTime = (iso) =>
  iso ? new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso)) : '—'

export const calcDiscount = (original, price) =>
  !original || !price ? 0
  : Math.round(((original - price) / original) * 100)

export const truncate = (text, len = 50) =>
  !text ? '' : text.length > len ? text.slice(0, len) + '...' : text
