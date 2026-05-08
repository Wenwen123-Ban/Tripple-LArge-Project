function notify(message, type = 'info') {
  if (typeof showNotification === 'function') showNotification(message, type);
  else console.log(`[${type}] ${message}`);
}

function createReservationRow(book) {
  return `
    <div class="table-row">
      <span>${book.book_no || '—'}</span>
      <span>${book.title || '—'}</span>
      <span>${book.user_id || '—'}</span>
      <div class="control-btns">
        <button class="btn-approve" onclick="approveReservation('${book.id}')"></button>
        <button class="btn-reject" onclick="rejectReservation('${book.id}')"></button>
      </div>
    </div>`;
}

function createBorrowingRow(book) {
  return `
    <div class="table-row">
      <span>${book.book_no || '—'}</span>
      <span>${book.title || '—'}</span>
      <span>${book.category || '—'}</span>
      <span>${book.user_id || '—'}</span>
      <div class="control-btns">
        <button class="btn-approve" onclick="approveReservation('${book.id}')"></button>
        <button class="btn-reject" onclick="rejectReservation('${book.id}')"></button>
      </div>
    </div>`;
}

function renderTopList(id, items) {
  const list = document.getElementById(id);
  if (!list) return;
  const rows = (items && items.length ? items : [{ title: '—' }, { title: '—' }, { title: '—' }]).slice(0, 3);
  list.innerHTML = rows.map((item) => `<li>${item.title || item.name || '—'}</li>`).join('');
}

async function loadDashboard() {
  try {
    const [booksRes, usersRes] = await Promise.all([fetch('/api/books'), fetch('/api/users')]);
    const books = booksRes.ok ? await booksRes.json() : [];
    const users = usersRes.ok ? await usersRes.json() : [];
    document.getElementById('total-books').textContent = books.length;
    document.getElementById('total-users').textContent = users.length;
    renderTopList('top-reserved', [...books].sort((a, b) => (b.reserved_count || 0) - (a.reserved_count || 0)));
    renderTopList('top-borrowed', [...books].sort((a, b) => (b.borrowed_count || 0) - (a.borrowed_count || 0)));
    const reservations = books.filter((book) => ['reserved', 'pending approval'].includes(String(book.status || '').toLowerCase()));
    const borrowings = books.filter((book) => String(book.status || '').toLowerCase() === 'borrowed');
    document.getElementById('reservation-list').innerHTML = reservations.map(createReservationRow).join('') || '<div class="table-row"><span>No reservations yet.</span></div>';
    document.getElementById('borrowing-list').innerHTML = borrowings.map(createBorrowingRow).join('') || '<div class="table-row"><span>No borrowings yet.</span></div>';
  } catch (err) {
    notify('Unable to load dashboard data.', 'warning');
  }
}

function approveReservation(id) { notify(`Reservation ${id} approved.`, 'success'); }
function rejectReservation(id) { notify(`Reservation ${id} rejected.`, 'info'); }

document.addEventListener('DOMContentLoaded', loadDashboard);
