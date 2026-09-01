import http from './http.service'
export const dashboardService = {
  getStats:       ()      => http.get('/admin/dashboard'),
  getRevenue:     (params) => http.get('/admin/stats/revenue', { params }),
  getOrderStats:  ()      => http.get('/admin/stats/orders'),
  getRecentOrders:(limit = 10) => http.get('/admin/stats/recent-orders', { params: { limit } }),
  getTopProducts: (limit = 10) => http.get('/admin/products/top-selling', { params: { limit } }),
}
