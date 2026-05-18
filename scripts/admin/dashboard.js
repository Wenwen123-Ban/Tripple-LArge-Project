function notify(message, type = 'info') {
  if (typeof window.showNotification === 'function') window.showNotification(message, type);
}

function safe(value, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function renderRows(id, rows, columns, emptyText) {
  const tbody = document.getElementById(id);
  if (!tbody) return;
  if (!Array.isArray(rows) || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}">${emptyText}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((row) => `<tr>${columns.map((col) => `<td>${col(row)}</td>`).join('')}</tr>`).join('');
}

async function borrowReservation(bookId, studentId) {
  const res = await fetch('/api/transactions/borrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, student_id: studentId }),
  });
  const data = await res.json().catch(() => ({}));
  notify(res.ok && data.status === 'borrowed' ? 'Reservation approved as borrowed.' : (data.error || 'Unable to approve reservation.'), res.ok ? 'success' : 'error');
  loadDashboardWidgets();
}

async function cancelReservation(transactionId) {
  const res = await fetch('/api/transactions/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId }),
  });
  const data = await res.json().catch(() => ({}));
  notify(res.ok && data.status === 'cancelled' ? 'Reservation rejected.' : (data.error || 'Unable to reject reservation.'), res.ok ? 'success' : 'error');
  loadDashboardWidgets();
}

async function forceReturn(bookId) {
  const notes = window.prompt('Reason for force return/reset:', 'Admin dashboard reset') || 'Admin dashboard reset';
  const res = await fetch('/api/transactions/force-return', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, notes }),
  });
  const data = await res.json().catch(() => ({}));
  notify(res.ok && data.status === 'force_returned' ? 'Borrow record reset.' : (data.error || 'Unable to reset borrow record.'), res.ok ? 'success' : 'error');
  loadDashboardWidgets();
}

async function loadDashboardWidgets() {
  try {
    const response = await fetch('/api/admin/dashboard-stats');
    if (!response.ok) throw new Error(`Dashboard stats request failed: ${response.status}`);

    const stats = await response.json();
    document.getElementById('total-books').textContent = safe(stats.total_books);
    document.getElementById('total-users').textContent = safe(stats.total_users);
    document.getElementById('count-available').textContent = stats.available ?? 0;
    document.getElementById('count-reserved').textContent = stats.pending_reservations_count ?? stats.reserved ?? 0;
    document.getElementById('count-borrowed').textContent = stats.active_borrows_count ?? stats.borrowed ?? 0;
    document.getElementById('count-due').textContent = stats.overdue_count ?? stats.due ?? 0;

    const renderTop = (id, items) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = Array.isArray(items) && items.length
        ? items.slice(0, 3).map((x) => `<li>${safe(x.title)} (${x.count ?? x.cnt ?? 0})</li>`).join('')
        : '<li>—</li><li>—</li><li>—</li>';
    };
    renderTop('top3-reserved', stats.top_reserved || []);
    renderTop('top3-borrowed', stats.top_borrowed || []);

    renderRows('reservations-tbody', stats.pending_reservations, [
      (r) => safe(r.book_no),
      (r) => safe(r.title),
      (r) => `${safe(r.student_id)}<br><small>${safe(r.student_name, '')}</small>`,
      (r) => `<button class="btn-approve" onclick="borrowReservation(${r.book_id}, '${r.student_id}')"><i class="ti ti-check"></i></button><button class="btn-reject" onclick="cancelReservation(${r.id})"><i class="ti ti-x"></i></button>`,
    ], 'No pending reservations.');

    renderRows('loans-tbody', stats.active_borrows, [
      (r) => safe(r.book_no),
      (r) => safe(r.title),
      (r) => safe(r.category_name),
      (r) => `${safe(r.student_id)}<br><small>${safe(r.due_at, 'No due date')}</small>`,
      (r) => `<button class="btn-row-action ${r.is_overdue ? 'btn-force' : ''}" onclick="forceReturn(${r.book_id || r.id})">Reset</button>`,
    ], 'No active borrows.');
  } catch (e) {
    console.error('Dashboard stats failed:', e);
    notify('Unable to load dashboard widgets.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadDashboardWidgets);
