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

function normalizeDate(value, fallback = '—') {
  return value || fallback;
}

/**
 * Creates a generic dashboard table row with four normalized columns.
 * @param {Array} columns - Array of column values
 * @returns {string} HTML string for table row
 */
function createTableRow(columns) {
  const [id, title, date, status] = columns;
  return `
    <div class="panel-row">
      <span class="panel-cell panel-cell--id">${escapeHtml(id || '—')}</span>
      <span class="panel-cell panel-cell--title">${escapeHtml(title || '—')}</span>
      <span class="panel-cell panel-cell--date">${escapeHtml(date || '—')}</span>
      <span class="panel-cell panel-cell--status">${escapeHtml(status || '—')}</span>
    </div>
  `;
}

/**
 * Creates a row for a reserved book with cancel action.
 * @param {Object} reservation - Reservation object
 * @returns {string} HTML string for reserved row
 */
function createReservedRow(reservation) {
  return `
    <div class="panel-row">
      <span class="panel-cell panel-cell--id">${escapeHtml(reservation.book_no || '—')}</span>
      <span class="panel-cell panel-cell--title">${escapeHtml(reservation.title || '—')}</span>
      <span class="panel-cell panel-cell--date">${escapeHtml(normalizeDate(reservation.reserved_at))}</span>
      <span class="panel-cell panel-cell--action">
        <button
          class="cancel-btn"
          type="button"
          data-transaction-id="${escapeHtml(reservation.id)}"
          title="Cancel this reservation">
          Cancel
        </button>
      </span>
    </div>
  `;
}

function createEmptyState(message, iconName) {
  const icons = {
    calendar: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="16" rx="3"></rect>
        <path d="M8 3v4M16 3v4M3 9h18M8 14h.01M12 14h.01M16 14h.01"></path>
      </svg>
    `,
    book: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"></path>
        <path d="M4 5.5v16M8 7h8M8 11h6"></path>
      </svg>
    `,
    alert: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.75 21 19.5H3z"></path>
        <path d="M12 9v4M12 17h.01"></path>
      </svg>
    `,
    folder: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6A2.5 2.5 0 0 1 20.5 10v6.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z"></path>
      </svg>
    `
  };

  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icons[iconName] || icons.folder}</div>
      <p>${escapeHtml(message)}</p>
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
      loadManageData();
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

    if (reservedList) {
      if (data.reserved && data.reserved.length > 0) {
        reservedList.innerHTML = data.reserved.map(createReservedRow).join('');
      } else {
        reservedList.innerHTML = createEmptyState('No reservations.', 'calendar');
      }
    }

    if (borrowedList) {
      if (data.borrowed && data.borrowed.length > 0) {
        borrowedList.innerHTML = data.borrowed.map(book =>
          createTableRow([
            book.book_no || book.accession_no || '—',
            book.title || '—',
            normalizeDate(book.borrowed_at),
            book.due_at ? `Due ${book.due_at}` : 'Active'
          ])
        ).join('');
      } else {
        borrowedList.innerHTML = createEmptyState('No borrowed books.', 'book');
      }
    }

    if (cancelledList) {
      if (data.cancelled && data.cancelled.length > 0) {
        cancelledList.innerHTML = data.cancelled.map(item =>
          createTableRow([
            item.book_no || '—',
            item.title || '—',
            normalizeDate(item.reserved_at || item.pickup_date),
            item.cancel_reason || 'Cancelled'
          ])
        ).join('');
      } else {
        cancelledList.innerHTML = createEmptyState('No cancelled reservations.', 'alert');
      }
    }

    if (historyList) {
      if (data.history && data.history.length > 0) {
        historyList.innerHTML = data.history.map(entry =>
          createTableRow([
            entry.book_no || entry.transaction_id || entry.id || 'LOG',
            entry.title || entry.action || 'Library transaction',
            entry.day || entry.date || '—',
            entry.time || 'Recorded'
          ])
        ).join('');
      } else {
        historyList.innerHTML = createEmptyState('No history.', 'folder');
      }
    }
  } catch (error) {
    console.error('Error loading manage data:', error);
  }
}

/**
 * Initialize the page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  loadManageData();

  document.addEventListener('click', event => {
    const cancelButton = event.target.closest('.cancel-btn');
    if (!cancelButton) {
      return;
    }

    cancelReservation(cancelButton.dataset.transactionId);
  });
});
