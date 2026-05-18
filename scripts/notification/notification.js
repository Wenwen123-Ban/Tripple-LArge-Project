import { sendOverdueAlerts, sendReadyAlert } from '../../services/api/notification.js';

export async function notifyReservationReady({ book_id, student_id, transaction_id } = {}) {
  return sendReadyAlert({ book_id, student_id, transaction_id });
}

export async function notifyOverdueBorrowers() {
  return sendOverdueAlerts();
}

window.ClickCollectNotifications = {
  notifyReservationReady,
  notifyOverdueBorrowers,
};
