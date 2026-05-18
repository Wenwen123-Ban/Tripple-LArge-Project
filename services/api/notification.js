import { apiRequest } from './_request.js';

export function getUserNotifications(filter = 'unread') {
  return apiRequest('/api/user/notifications', { params: { filter } });
}

export function clearUserNotifications(payload) {
  return apiRequest('/api/user/notifications/clear', { method: 'POST', body: payload });
}

export function getAdminNotifications() {
  return apiRequest('/api/admin/notifications');
}

export function markAdminNotificationRead(notificationId) {
  return apiRequest(`/api/admin/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'POST' });
}

export function clearAdminNotifications() {
  return apiRequest('/api/admin/notifications/clear', { method: 'POST' });
}

export function sendReadyAlert(payload) {
  return apiRequest('/api/transactions/notify-borrower', { method: 'POST', body: { ...payload, type: 'ready' } });
}

export function sendOverdueAlerts() {
  return apiRequest('/api/notifications/overdue/run', { method: 'POST' });
}
