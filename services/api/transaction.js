import { apiRequest } from './_request.js';

export function reserveBook(payload) {
  return apiRequest('/api/transaction/reserve', { method: 'POST', body: payload });
}

export function borrowBook(payload) {
  return apiRequest('/api/transactions/borrow', { method: 'POST', body: payload });
}

export function returnBook(payload) {
  return apiRequest('/api/transactions/return', { method: 'POST', body: payload });
}

export function forceReturn(payload) {
  return apiRequest('/api/transactions/force-return', { method: 'POST', body: payload });
}

export function cancelReservation(transactionId) {
  return apiRequest('/api/transactions/cancel', { method: 'POST', body: { transaction_id: transactionId } });
}

export function getManageTransactions(params = {}) {
  return apiRequest('/api/transactions/manage', { params });
}

export function notifyBorrower(payload) {
  return apiRequest('/api/transactions/notify-borrower', { method: 'POST', body: payload });
}
