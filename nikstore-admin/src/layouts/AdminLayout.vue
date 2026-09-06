<template>
  <div class="admin-layout">
    <AdminSidebar :open="sidebarOpen" />
    <div v-if="sidebarOpen" class="admin-layout__scrim" @click="sidebarOpen = false" />

    <div class="admin-layout__main">
      <header class="admin-layout__header">
        <button type="button" class="admin-layout__menu-btn" @click="sidebarOpen = !sidebarOpen">
          <AppIcon name="menu" :size="20" />
        </button>

        <div class="admin-layout__header-spacer" />

        <div class="admin-layout__header-actions">
          <ThemeToggle />

          <div class="admin-layout__user">
            <span class="admin-layout__user-name">{{ displayName }}</span>
            <span v-if="auth.isSuperAdmin" class="admin-layout__user-role">مدیر کل</span>
            <span v-else class="admin-layout__user-role">مدیر</span>
          </div>

          <button type="button" class="admin-layout__logout" aria-label="خروج" @click="handleLogout">
            <AppIcon name="logout" :size="18" />
          </button>
        </div>
      </header>

      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '../components/layout/AdminSidebar.vue'
import ThemeToggle from '../components/common/ThemeToggle.vue'
import AppIcon from '../components/icons/AppIcon.vue'
import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

// Without this, a touch-scroll over the scrim/sidebar on mobile has no
// scrollable target of its own to grab, so the gesture falls through to
// the document body — scrolling the page underneath instead of the
// sidebar's own nav list.
watch(sidebarOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
onUnmounted(() => {
  document.body.style.overflow = ''
})

const displayName = computed(() => {
  const user = auth.user
  if (!user) return 'مدیر'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.phone || 'مدیر'
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-layout__scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(9, 15, 12, .5);
}
@media (min-width: 1024px) {
  .admin-layout__scrim {
    display: none;
  }
}

.admin-layout__main {
  margin-inline-start: 264px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
@media (max-width: 1023px) {
  .admin-layout__main {
    margin-inline-start: 0;
  }
}

.admin-layout__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  background: var(--glass);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
}

.admin-layout__menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: var(--text-primary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
@media (max-width: 1023px) {
  .admin-layout__menu-btn {
    display: flex;
  }
}

.admin-layout__header-spacer {
  flex: 1;
}

.admin-layout__header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.admin-layout__user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.4;
}
.admin-layout__user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.admin-layout__user-role {
  font-size: 10.5px;
  color: var(--text-secondary);
}

.admin-layout__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--text-secondary);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  cursor: pointer;
}
.admin-layout__logout:hover {
  color: #D9534F;
  background: var(--glass-strong);
}

.admin-layout__content {
  flex: 1;
  padding: 24px;
  max-width: 100%;
  overflow-x: hidden;
}
@media (max-width: 560px) {
  .admin-layout__content {
    padding: 14px;
  }
  .admin-layout__header {
    padding: 12px 14px;
  }
  .admin-layout__user-name {
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
