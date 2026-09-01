// ─── Sort ────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { label: 'جدیدترین',       value: 'newest'     },
  { label: 'ارزان‌ترین',    value: 'price_asc'  },
  { label: 'گران‌ترین',     value: 'price_desc' },
  { label: 'پرفروش‌ترین',   value: 'bestseller' },
  { label: 'پربازدیدترین',  value: 'mostViewed' },
  { label: 'بیشترین تخفیف', value: 'discount'   },
]

// ─── Product Categories ───────────────────────────────────────────
// Fallback labels for the top-level category slugs (see CategoryBar.vue on
// the homepage for the same women/men/kids slug convention). Used only as a
// display-label lookup when a filter chip needs a human label for a category
// slug that isn't already resolved from the live category tree.
export const PRODUCT_CATEGORIES = [
  { label: 'زنانه',   value: 'women', slug: 'women', icon: '👗' },
  { label: 'مردانه',  value: 'men',   slug: 'men',   icon: '👔' },
  { label: 'بچگانه',  value: 'kids',  slug: 'kids',  icon: '🧸' },
]

// ─── Frame Shapes ─────────────────────────────────────────────────
export const FRAME_SHAPES = [
  { label: 'گرد',        value: 'round'       },
  { label: 'مربعی',      value: 'square'      },
  { label: 'بیضی',       value: 'oval'        },
  { label: 'مستطیلی',    value: 'rectangular' },
  { label: 'پایلوت',     value: 'aviator'     },
  { label: 'گربه‌ای',    value: 'cat-eye'     },
  { label: 'هشت‌ضلعی',   value: 'octagonal'   },
  { label: 'بی‌فریم',    value: 'rimless'     },
]

// ─── Frame Materials ──────────────────────────────────────────────
export const FRAME_MATERIALS = [
  { label: 'استیل',    value: 'steel'    },
  { label: 'تیتانیوم', value: 'titanium' },
  { label: 'استات',    value: 'acetate'  },
  { label: 'TR90',     value: 'tr90'     },
  { label: 'کربن',     value: 'carbon'   },
]

// ─── Gender ───────────────────────────────────────────────────────
export const GENDER_OPTIONS = [
  { label: 'مردانه',  value: 'men'    },
  { label: 'زنانه',   value: 'women'  },
  { label: 'بچگانه',  value: 'kids'   },
  { label: 'یونیسکس', value: 'unisex' },
]

// ─── Order Statuses ───────────────────────────────────────────────
export const ORDER_STATUSES = {
  pending:    { label: 'در انتظار پرداخت', color: 'yellow' },
  paid:       { label: 'پرداخت شده',       color: 'blue'   },
  processing: { label: 'در حال پردازش',    color: 'blue'   },
  shipped:    { label: 'ارسال شده',         color: 'blue'   },
  delivered:  { label: 'تحویل داده شده',   color: 'green'  },
  cancelled:  { label: 'لغو شده',           color: 'red'    },
}

export const PRODUCT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Ccircle cx='100' cy='50' r='6' stroke='%23cbd5e1' stroke-width='3' fill='none'/%3E%3Cline x1='100' y1='56' x2='100' y2='70' stroke='%23cbd5e1' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M100 70 L58 106 M100 70 L142 106' stroke='%23cbd5e1' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M58 106 Q100 122 142 106' stroke='%23cbd5e1' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"
