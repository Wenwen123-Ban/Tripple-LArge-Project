/**
 * Manage.js - User Reservations and Borrowing Management
 * Handles display of reserved books, borrowed books, and borrowing history
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {*} value - Value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(value) {
  const text = String(value ?? '');
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Creates a generic table row with given columns
 * @param {Array} columns - Array of column values
 * @returns {string} HTML string for table row
 */
function createTableRow(columns) {
  const cells = columns.map(col => `<span>${escapeHtml(col)}</span>`).join('');
  return `<div class="panel-row">${cells}</div>`;
}

/**
 * Creates a row for a reserved book with cancel action
 * @param {Object} reservation - Reservation object
 * @returns {string} HTML string for reserved row
 */
function createReservedRow(reservation) {
  return `
    <div class="panel-row">
      <span>${escapeHtml(reservation.book_no || '—')}</span>
      <span>${escapeHtml(reservation.title || '—')}</span>
      <span>${escapeHtml(reservation.reserved_at || '—')}</span>
      <span>${escapeHtml(reservation.pickup_date || 'Pending')}</span>
      <button 
        class="cancel-btn" 
        onclick="cancelReservation('${escapeHtml(reservation.id)}')"
        title="Cancel this reservation">
        Cancel
      </button>
    </div>
  `;
}

/**
 * Cancels a reservation
 * @param {string} transactionId - ID of the transaction to cancel
 */
async function cancelReservation(transactionId) {
  if (!confirm('Cancel this reservation? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch('/api/transactions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId })
    });
    
    const result = await response.json();
    
    if (response.ok && result.status === 'cancelled') {
      alert('Reservation cancelled successfully.');
      loadManageData(); // Refresh the data
    } else {
      alert(result.error || 'Failed to cancel reservation.');
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    alert('An error occurred while cancelling the reservation.');
  }
}

/**
 * Loads all management data (reservations, borrowings, history) from API
 */
async function loadManageData() {
  try {
    const response = await fetch('/api/transactions/manage');
    const data = await response.json();
    
    const reservedList = document.getElementById('reserved-list');
    const borrowedList = document.getElementById('borrowed-list');
    const cancelledList = document.getElementById('cancelled-list');
    const historyList = document.getElementById('history-list');
    
    // Load reserved books
    if (reservedList) {
      if (data.reserved && data.reserved.length > 0) {
        reservedList.innerHTML = data.reserved.map(createReservedRow).join('');
      } else {
        reservedList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No reservations.</div>';
      }
    }
    
    // Load borrowed books
    if (borrowedList) {
      if (data.borrowed && data.borrowed.length > 0) {
        borrowedList.innerHTML = data.borrowed.map(book =>
          createTableRow([
            book.book_no || '—',
            book.title || '—',
            book.accession_no || '—',
            book.borrowed_at || '—',
            book.due_at || '—'
          ])
        ).join('');
      } else {
        borrowedList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No borrowed books.</div>';
      }
    }
    
    // Load cancelled/failed pickups
    if (cancelledList) {
      if (data.cancelled && data.cancelled.length > 0) {
        cancelledList.innerHTML = data.cancelled.map(item =>
          createTableRow([
            item.book_no || '—',
            item.title || '—',
            item.reserved_at || '—',
            item.pickup_date || '—',
            item.cancel_reason || 'Cancelled'
          ])
        ).join('');
      } else {
        cancelledList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No cancelled reservations.</div>';
      }
    }
    
    // Load history
    if (historyList) {
      if (data.history && data.history.length > 0) {
        historyList.innerHTML = data.history.map(entry =>
          createTableRow([
            entry.time || '—',
            entry.day || '—',
            entry.action || '—'
          ])
        ).join('');
      } else {
        historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No history.</div>';
      }
    }
  } catch (error) {
    console.error('Error loading manage data:', error);
  }
}

/**
 * Initialize the page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', loadManageData);
