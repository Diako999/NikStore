export const FRAME_SHAPES = [
  { label: 'گرد',      value: 'round'       },
  { label: 'مربعی',    value: 'square'      },
  { label: 'بیضی',     value: 'oval'        },
  { label: 'مستطیلی',  value: 'rectangular' },
  { label: 'پایلوت',   value: 'aviator'     },
  { label: 'گربه‌ای',  value: 'cat-eye'     },
  { label: 'هشت‌ضلعی', value: 'octagonal'   },
  { label: 'بی‌فریم',  value: 'rimless'     },
]

export const FRAME_MATERIALS = [
  { label: 'استیل',    value: 'steel'    },
  { label: 'تیتانیوم', value: 'titanium' },
  { label: 'استات',    value: 'acetate'  },
  { label: 'TR90',     value: 'tr90'     },
  { label: 'کربن',     value: 'carbon'   },
]

export const ORDER_STATUSES = {
  pending:    { label: 'در انتظار پرداخت', color: 'warning' },
  paid:       { label: 'پرداخت شده',       color: 'info'    },
  processing: { label: 'در حال پردازش',    color: 'info'    },
  shipped:    { label: 'ارسال شده',         color: 'info'    },
  delivered:  { label: 'تحویل داده شده',   color: 'success' },
  cancelled:  { label: 'لغو شده',           color: 'error'   },
  refunded:   { label: 'مسترد شده',         color: 'error'   },
}

export const PRODUCT_STATUSES = {
  active:   { label: 'فعال',     color: 'success' },
  draft:    { label: 'پیش‌نویس', color: 'warning' },
  inactive: { label: 'غیرفعال',  color: 'error'   },
}

export const REVIEW_STATUSES = {
  pending:  { label: 'در انتظار', color: 'warning' },
  approved: { label: 'تأیید شده', color: 'success' },
  rejected: { label: 'رد شده',    color: 'error'   },
}

export const SORT_DIRS   = { asc: 'صعودی', desc: 'نزولی' }
export const ITEMS_PER_PAGE = 20

export const PANEL_PERMISSIONS = [
  // ── عمومی ─────────────────────────────────────────────────────────────────
  { key: 'dashboard',  label: 'داشبورد', icon: '📊', group: 'عمومی' },

  // ── فروشگاه ───────────────────────────────────────────────────────────────
  {
    key: 'products', label: 'محصولات', icon: '📦', group: 'فروشگاه',
    actions: [
      { key: 'view',            label: 'مشاهده'    },
      { key: 'create',          label: 'افزودن'    },
      { key: 'edit',            label: 'ویرایش'   },
      { key: 'delete',          label: 'حذف'       },
      { key: 'view_buy_price',  label: 'قیمت خرید' },
      { key: 'view_sell_price', label: 'قیمت فروش' },
    ],
  },
  { key: 'categories', label: 'دسته‌بندی‌ها', icon: '🏷️', group: 'فروشگاه' },
  { key: 'brands',     label: 'برندها',       icon: '🔖', group: 'فروشگاه' },
  { key: 'colors',     label: 'رنگ‌ها',       icon: '🎨', group: 'فروشگاه' },
  { key: 'banners',    label: 'بنرها',        icon: '🖼',  group: 'فروشگاه' },
  {
    key: 'orders', label: 'سفارشات', icon: '🛒', group: 'فروشگاه',
    actions: [
      { key: 'view',   label: 'مشاهده' },
      { key: 'edit',   label: 'ویرایش' },
      { key: 'delete', label: 'حذف'    },
    ],
  },
  { key: 'discounts', label: 'کدهای تخفیف', icon: '🎟️', group: 'فروشگاه' },

  // ── مدیریت ────────────────────────────────────────────────────────────────
  { key: 'users',   label: 'کاربران',       icon: '👥', group: 'مدیریت' },
  { key: 'reviews', label: 'نظرات محصولات', icon: '⭐', group: 'مدیریت' },

  // ── محتوا ─────────────────────────────────────────────────────────────────
  { key: 'blog',          label: 'بلاگ',          icon: '📝', group: 'محتوا' },
  { key: 'blog-comments', label: 'نظرات مقالات',  icon: '💬', group: 'محتوا' },
  { key: 'pages',         label: 'صفحات',          icon: '📄', group: 'محتوا' },
]
