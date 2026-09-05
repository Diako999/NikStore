import http from './http.service'

export const notificationService = {
  sendBroadcast: (payload) => http.post('/notifications/admin/broadcast', payload),
  sendSms: (payload) => http.post('/notifications/admin/sms', payload),
  getBroadcastLogs: (params) => http.get('/notifications/admin/broadcast-logs', { params }),
  getSmsLogs: (params) => http.get('/notifications/admin/sms-logs', { params }),
  deleteBroadcastLog: (id) => http.delete(`/notifications/admin/broadcast-log/${id}`),
}
