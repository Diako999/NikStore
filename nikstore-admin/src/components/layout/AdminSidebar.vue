<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': open }">
    <RouterLink to="/" class="admin-sidebar__brand">
      <span class="admin-sidebar__ring">NK</span>
      <div>
        <p class="admin-sidebar__name">نیک</p>
        <p class="admin-sidebar__tag">پنل مدیریت</p>
      </div>
    </RouterLink>

    <nav class="admin-sidebar__nav">
      <RouterLink to="/" class="admin-sidebar__item" :class="{ 'admin-sidebar__item--active': isActive('/') }">
        <AppIcon name="grid" :size="18" />
        <span>داشبورد</span>
      </RouterLink>

      <div v-for="group in groups" :key="group.label" class="admin-sidebar__group">
        <p class="admin-sidebar__group-label">{{ group.label }}</p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="admin-sidebar__item"
          :class="{ 'admin-sidebar__item--active': isActive(item.to) }"
        >
          <AppIcon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const route = useRoute()

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const groups = [
  {
    label: 'کاتالوگ',
    items: [
      { label: 'محصولات', to: '/products', icon: 'box' },
      { label: 'دسته‌بندی‌ها', to: '/categories', icon: 'tag' },
      { label: 'برندها', to: '/brands', icon: 'tag' },
      { label: 'رنگ‌ها', to: '/colors', icon: 'palette' },
    ],
  },
  {
    label: 'فروش',
    items: [
      { label: 'سفارش‌ها', to: '/orders', icon: 'receipt' },
      { label: 'تخفیف‌ها', to: '/discounts', icon: 'bag' },
    ],
  },
  {
    label: 'محتوا',
    items: [
      { label: 'بنرها', to: '/banners', icon: 'image' },
      { label: 'پاپ‌آپ‌ها', to: '/popups', icon: 'layout' },
      { label: 'وبلاگ', to: '/blog', icon: 'file-text' },
      { label: 'صفحات', to: '/pages', icon: 'file-text' },
      { label: 'نظرات', to: '/reviews', icon: 'star' },
    ],
  },
  {
    label: 'سیستم',
    items: [
      { label: 'اعلان‌ها', to: '/notifications', icon: 'bell' },
      { label: 'کاربران', to: '/users', icon: 'users' },
      { label: 'تنظیمات', to: '/settings', icon: 'settings' },
    ],
  },
]
</script>

<style scoped>
.admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 264px;
  flex-shrink: 0;
  height: 100vh;
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 40;
  padding: 22px 16px;
  overflow-y: auto;
  background: var(--glass);
  border-inline-end: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  transition: transform .2s ease;
}

.admin-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-inline: 6px;
}
.admin-sidebar__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #E7C878, #FBEFC8, #E7C878);
  color: #16241C;
  font-weight: 800;
  font-size: 12px;
}
.admin-sidebar__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.admin-sidebar__tag {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.admin-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-sidebar__group {
  margin-top: 14px;
}
.admin-sidebar__group-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .4px;
  color: var(--text-disabled);
  padding: 0 12px 6px;
}

.admin-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: background .15s ease, color .15s ease;
}
.admin-sidebar__item:hover {
  background: var(--glass-strong);
  color: var(--text-primary);
}
.admin-sidebar__item--active {
  color: #fff;
  background: linear-gradient(135deg, #6EB082 0%, #3D8B52 65%, #2D6B3E 100%);
}
[data-theme='light'] .admin-sidebar__item--active {
  color: #fff;
}

@media (max-width: 1023px) {
  .admin-sidebar {
    /* Sidebar sits at the RTL inline-start (physical right) edge, so
       translating along +X pushes it off that same edge to hide it. */
    transform: translateX(100%);
    box-shadow: -20px 0 40px rgba(0, 0, 0, .25);
  }
  .admin-sidebar--open {
    transform: translateX(0);
  }
}
</style>
