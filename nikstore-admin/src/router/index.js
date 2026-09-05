import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// Plain array of route objects so later work can append new pages here
// without needing to touch how the router itself is built.
const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      { path: '', name: 'login', component: () => import('../views/auth/LoginView.vue') },
    ],
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/dashboard/DashboardView.vue') },

      { path: 'products', name: 'products', component: () => import('../views/products/ProductsView.vue') },
      { path: 'products/new', name: 'product-new', component: () => import('../views/products/ProductFormView.vue') },
      { path: 'products/:id/edit', name: 'product-edit', component: () => import('../views/products/ProductFormView.vue') },
      { path: 'categories', name: 'categories', component: () => import('../views/categories/CategoriesView.vue') },
      { path: 'brands', name: 'brands', component: () => import('../views/brands/BrandsView.vue') },
      { path: 'colors', name: 'colors', component: () => import('../views/colors/ColorsView.vue') },

      { path: 'orders', name: 'orders', component: () => import('../views/orders/OrdersView.vue') },
      { path: 'orders/:id', name: 'order-detail', component: () => import('../views/orders/OrderDetailView.vue') },
      { path: 'discounts', name: 'discounts', component: () => import('../views/discounts/DiscountsView.vue') },
      { path: 'banners', name: 'banners', component: () => import('../views/banners/BannersView.vue') },
      { path: 'popups', name: 'popups', component: () => import('../views/popups/PopupsView.vue') },

      { path: 'blog', name: 'blog', component: () => import('../views/blog/BlogsView.vue') },
      { path: 'blog/create', name: 'blog-create', component: () => import('../views/blog/BlogFormView.vue') },
      { path: 'blog/:id/edit', name: 'blog-edit', component: () => import('../views/blog/BlogFormView.vue') },
      { path: 'blog/comments', name: 'blog-comments', component: () => import('../views/blog/BlogCommentsView.vue') },
      { path: 'pages', name: 'pages', component: () => import('../views/pages/PagesView.vue') },
      { path: 'pages/create', name: 'page-create', component: () => import('../views/pages/PageFormView.vue') },
      { path: 'pages/:id/edit', name: 'page-edit', component: () => import('../views/pages/PageFormView.vue') },
      { path: 'reviews', name: 'reviews', component: () => import('../views/reviews/ReviewsView.vue') },
      { path: 'notifications', name: 'notifications', component: () => import('../views/notifications/NotificationsSendView.vue') },

      { path: 'users', name: 'users', component: () => import('../views/users/UsersView.vue') },
      { path: 'users/admins', name: 'admins', component: () => import('../views/users/AdminsView.vue') },
      { path: 'users/:id', name: 'user-detail', component: () => import('../views/users/UserDetailView.vue') },
      { path: 'settings', name: 'settings', component: () => import('../views/settings/SettingsView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
