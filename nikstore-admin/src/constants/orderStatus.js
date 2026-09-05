// Mirrors nikstore/src/modules/order/entities/order.schema.ts —
// keep this in sync if the backend enum or transition graph changes.

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export const ORDER_STATUS_LABELS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
}

export const ORDER_STATUS_BADGE = {
  pending: 'pending',
  confirmed: 'neutral',
  processing: 'neutral',
  shipped: 'neutral',
  delivered: 'success',
  cancelled: 'danger',
}

// Valid next statuses per current status — mirrors ORDER_TRANSITIONS on the
// backend so the UI never offers a transition the API would reject.
export const ORDER_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}
