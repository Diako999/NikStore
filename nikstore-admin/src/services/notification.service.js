import http from './http.service'

export const notificationService = {
  broadcast:           (data)   => http.post('/notifications/admin/broadcast',         data),
  sendSms:             (data)   => http.post('/notifications/admin/sms',               data),
  getBroadcastLogs:    (params) => http.get('/notifications/admin/broadcast-logs',      { params }),
  getSmsLogs:          (params) => http.get('/notifications/admin/sms-logs',            { params }),
  deleteBroadcastLog:  (id)     => http.delete(`/notifications/admin/broadcast-log/${id}`),
}
