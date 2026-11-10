// Payment is handled manually: after ordering, the customer chats with the shop
// admin and pays there. The same ID is used on both messengers.
export const DEFAULT_ADMIN_ID = 's_nikstore'

// Accept only plain usernames — settings come from the API, but this value ends
// up inside a URL, so never trust it blindly.
function cleanId(value) {
  const id = String(value || '').replace(/^@/, '').trim()
  return /^[A-Za-z0-9_]{3,64}$/.test(id) ? id : DEFAULT_ADMIN_ID
}

export function resolveAdminIds(orderContact) {
  return {
    telegram: cleanId(orderContact?.telegram),
    rubika: cleanId(orderContact?.rubika),
  }
}

// The order number travels with the redirect so the admin immediately knows
// which order the customer is paying for.
export function buildPaymentMessage({ orderNumber, total }) {
  const amount = Number(total || 0).toLocaleString('en-US')
  return `سلام، سفارش من با شماره ${orderNumber} ثبت شد و می‌خواهم پرداخت را انجام دهم. مبلغ: ${amount} تومان`
}

export function telegramLink(id, text) {
  return `https://t.me/${id}?text=${encodeURIComponent(text)}`
}

// Rubika has no documented way to pre-fill a message, so the text is copied to
// the clipboard before redirecting and the customer just pastes it.
export function rubikaLink(id) {
  return `https://rubika.ir/${id}`
}
