import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guard'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true },
  },
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { layout: 'admin', title: 'داشبورد', permission: 'dashboard' },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductsView.vue'),
    meta: { layout: 'admin', title: 'محصولات', permission: 'products' },
  },
  {
    path: '/products/create',
    name: 'product-create',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'محصول جدید', permission: 'products' },
  },
  {
    path: '/products/:id/edit',
    name: 'product-edit',
    component: () => import('@/views/products/ProductFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش محصول', permission: 'products' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/categories/CategoriesView.vue'),
    meta: { layout: 'admin', title: 'دسته‌بندی‌ها', permission: 'categories' },
  },
  {
    path: '/brands',
    name: 'brands',
    component: () => import('@/views/brands/BrandsView.vue'),
    meta: { layout: 'admin', title: 'برندها', permission: 'brands' },
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('@/views/colors/ColorsView.vue'),
    meta: { layout: 'admin', title: 'رنگ‌ها', permission: 'colors' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/orders/OrdersView.vue'),
    meta: { layout: 'admin', title: 'سفارشات', permission: 'orders' },
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/orders/OrderDetailView.vue'),
    meta: { layout: 'admin', title: 'جزئیات سفارش', permission: 'orders' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { layout: 'admin', title: 'کاربران', permission: 'users' },
  },
  {
    path: '/users/:id',
    name: 'user-detail',
    component: () => import('@/views/users/UserDetailView.vue'),
    meta: { layout: 'admin', title: 'پروفایل کاربر', permission: 'users' },
  },
  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('@/views/reviews/ReviewsView.vue'),
    meta: { layout: 'admin', title: 'نظرات', permission: 'reviews' },
  },
  {
    path: '/discounts',
    name: 'discounts',
    component: () => import('@/views/discounts/DiscountList.vue'),
    meta: { layout: 'admin', title: 'تخفیف‌ها', permission: 'discounts' },
  },
  {
    path: '/discounts/create',
    name: 'discount-create',
    component: () => import('@/views/discounts/DiscountForm.vue'),
    meta: { layout: 'admin', title: 'تخفیف جدید', permission: 'discounts' },
  },
  {
    path: '/discounts/:id/edit',
    name: 'discount-edit',
    component: () => import('@/views/discounts/DiscountForm.vue'),
    meta: { layout: 'admin', title: 'ویرایش تخفیف', permission: 'discounts' },
  },
  {
    path: '/coupon-codes',
    name: 'coupon-codes',
    component: () => import('@/views/discounts/DiscountsView.vue'),
    meta: { layout: 'admin', title: 'کدهای تخفیف', permission: 'discounts' },
  },
  {
    path: '/banners',
    name: 'banners',
    component: () => import('@/views/banners/BannersView.vue'),
    meta: { layout: 'admin', title: 'بنرها', permission: 'banners' },
  },
  {
    path: '/blog',
    name: 'blog',
    component: () => import('@/views/blog/BlogsView.vue'),
    meta: { layout: 'admin', title: 'بلاگ', permission: 'blog' },
  },
  {
    path: '/blog/create',
    name: 'blog-create',
    component: () => import('@/views/blog/BlogFormView.vue'),
    meta: { layout: 'admin', title: 'پست جدید', permission: 'blog' },
  },
  {
    path: '/blog/comments',
    name: 'blog-comments',
    component: () => import('@/views/blog/BlogCommentsView.vue'),
    meta: { layout: 'admin', title: 'نظرات مقالات', permission: 'blog-comments' },
  },
  {
    path: '/blog/:id/edit',
    name: 'blog-edit',
    component: () => import('@/views/blog/BlogFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش پست', permission: 'blog' },
  },
  {
    path: '/pages',
    name: 'pages',
    component: () => import('@/views/pages/PagesView.vue'),
    meta: { layout: 'admin', title: 'صفحات', permission: 'pages' },
  },
  {
    path: '/pages/create',
    name: 'page-create',
    component: () => import('@/views/pages/PageFormView.vue'),
    meta: { layout: 'admin', title: 'صفحه جدید', permission: 'pages' },
  },
  {
    path: '/pages/:id/edit',
    name: 'page-edit',
    component: () => import('@/views/pages/PageFormView.vue'),
    meta: { layout: 'admin', title: 'ویرایش صفحه', permission: 'pages' },
  },
  {
    path: '/popups',
    name: 'popups',
    component: () => import('@/views/popup/PopupView.vue'),
    meta: { layout: 'admin', title: 'پاپ‌آپ سایت', adminOnly: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { layout: 'admin', title: 'تنظیمات سایت', adminOnly: true },
  },
  {
    path: '/theme',
    name: 'theme',
    component: () => import('@/views/settings/ThemeView.vue'),
    meta: { layout: 'admin', title: 'تم سایت', adminOnly: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/views/settings/ChangePasswordView.vue'),
    meta: { layout: 'admin', title: 'تغییر رمز عبور', adminOnly: true },
  },
  {
    path: '/notifications-send',
    name: 'notifications-send',
    component: () => import('@/views/notifications/NotificationsSendView.vue'),
    meta: { layout: 'admin', title: 'ارسال پیام', adminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(authGuard)

export default router
