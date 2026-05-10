function notify(message, type = 'info') {
  if (typeof showNotification === 'function') showNotification(message, type);
}

function ensureMinRows(tbodyId, colCount, minRows = 7) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  let current = tbody.querySelectorAll('tr').length;
  while (current < minRows) {
    const tr = document.createElement('tr');
    tr.innerHTML = Array(colCount).fill('<td>&nbsp;</td>').join('');
    tbody.appendChild(tr);
    current += 1;
  }
}

function renderTopList(id, items) {
  const list = document.getElementById(id);
  if (!list) return;
  const rows = (Array.isArray(items) ? items : []).slice(0, 3);
  while (rows.length < 3) rows.push({ title: '—' });
  list.innerHTML = rows.map((x) => `<li>— ${x.title || x.name || '—'}</li>`).join('');
}

function renderReservations(data) {
  const tbody = document.getElementById('reservations-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.book_no || '&nbsp;'}</td>
      <td>${item.title || '&nbsp;'}</td>
      <td>${item.user_id || '&nbsp;'}</td>
      <td><button class="btn-approve"><i class="ti ti-check"></i></button><button class="btn-reject"><i class="ti ti-x"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  if (typeof padTableRows === 'function') padTableRows('reservations-tbody', 4, 7);
  else ensureMinRows('reservations-tbody', 4, 7);
}

function renderLoans(data) {
  const tbody = document.getElementById('loans-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.book_no || '&nbsp;'}</td>
      <td>${item.title || '&nbsp;'}</td>
      <td>${item.category || '&nbsp;'}</td>
      <td>${item.user_id || '&nbsp;'}</td>
      <td><button class="btn-approve"><i class="ti ti-check"></i></button><button class="btn-reject"><i class="ti ti-x"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  if (typeof padTableRows === 'function') padTableRows('loans-tbody', 5, 7);
  else ensureMinRows('loans-tbody', 5, 7);
}

let allReservations = [];
let allLoans = [];

async function loadDashboard() {
  try {
    const [booksRes, usersRes] = await Promise.all([fetch('/api/books'), fetch('/api/users')]);
    const books = booksRes.ok ? await booksRes.json() : [];
    const users = usersRes.ok ? await usersRes.json() : [];

    document.getElementById('total-books').textContent = books.length || '—';
    document.getElementById('total-users').textContent = users.length || '—';

    renderTopList('top3-reserved', [...books].sort((a, b) => (b.reserved_count || 0) - (a.reserved_count || 0)));
    renderTopList('top3-borrowed', [...books].sort((a, b) => (b.borrowed_count || 0) - (a.borrowed_count || 0)));

    allReservations = books.filter((x) => ['reserved', 'pending approval'].includes(String(x.status || '').toLowerCase()));
    allLoans = books.filter((x) => String(x.status || '').toLowerCase() === 'borrowed');

    renderReservations(allReservations);
    renderLoans(allLoans);
  } catch (error) {
    notify('Unable to load dashboard data.', 'warning');
    allReservations = [];
    allLoans = [];
    renderReservations(allReservations);
    renderLoans(allLoans);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
