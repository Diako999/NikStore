import http from './http.service'

export const adminService = {
  getDashboard: () => http.get('/admin/dashboard'),
  getRevenueStats: (params) => http.get('/admin/stats/revenue', { params }),
  getOrderStats: (params) => http.get('/admin/stats/orders', { params }),
  getRecentOrders: (params) => http.get('/admin/stats/recent-orders', { params }),
  getLowStockProducts: (params) => http.get('/admin/products/low-stock', { params }),
  getTopSellingProducts: (params) => http.get('/admin/products/top-selling', { params }),

  // ── Admin/manager accounts ───────────────────────────────────
  getAdminUsers: () => http.get('/admin/users/admins'),
  setUserRole: (id, role) => http.patch(`/admin/users/${id}/role`, { role }),
  setUserPermissions: (id, permissions) => http.patch(`/admin/users/${id}/permissions`, { permissions }),
  promoteToAdmin: (id) => http.patch(`/admin/users/${id}/promote`),
  demoteFromAdmin: (id) => http.patch(`/admin/users/${id}/demote`),

  // ── System maintenance ────────────────────────────────────────
  clearCache: () => http.post('/admin/cache/clear'),
  getCacheInfo: () => http.get('/admin/cache/info'),
  getHealth: () => http.get('/admin/health'),
}
