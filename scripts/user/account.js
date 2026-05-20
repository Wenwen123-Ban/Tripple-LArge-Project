/**
 * Account.js - Digital Library Card Management
 */

function generateDynamicBinary(seed = '') {
  const base = (seed || '01011001').replace(/\D/g, '') || '01011001';
  let out = '';
  while (out.length < 360) out += `${base}${Math.random().toString(2).slice(2, 12)}`;
  return out.slice(0, 360);
}

function formatVerticalBinary(binary = '') {
  const digits = String(binary).replace(/\D/g, '');
  const chunks = digits.match(/.{1,8}/g) || ['01011001'];
  return chunks.slice(0, 28).join('\n');
}

function toBinaryString(input = '') {
  return Array.from(String(input)).map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function computeStudentFingerprint(studentId = '', registrationDate = '') {
  const seed = `${studentId}|${registrationDate}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  const normalized = Math.abs(hash).toString(2);
  return generateDynamicBinary(normalized);
}

function renderBinary(studentId, registrationDate, generationNumber = '1') {
  const binaryLeft = document.getElementById('binary-left');
  const binaryRight = document.getElementById('binary-right');

  const studentDigits = String(studentId || '').replace(/\D/g, '');
  const year = studentDigits.slice(0, 4) || '2026';
  const entry = studentDigits.slice(-5) || '00000';
  const generation = String(generationNumber || (registrationDate || '').replace(/\D/g, '').slice(-1) || '1').replace(/\D/g, '') || '1';
  const identitySeed = `${year}${entry}${generation}`;
  const identityBinary = toBinaryString(identitySeed);
  const repeatedIdentityBinary = Array(10).fill(identityBinary).join('');

  if (binaryLeft) binaryLeft.textContent = formatVerticalBinary(`${toBinaryString('NMSCST')}${repeatedIdentityBinary}`);
  if (binaryRight) binaryRight.textContent = formatVerticalBinary(computeStudentFingerprint(studentId, registrationDate));
}

function escapeHtml(value) {
  const text = String(value ?? '');
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, char => map[char]);
}


function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '—';
}

async function fetchAccountProfile() {
  const response = await fetch('/api/users/profile', { credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to load account profile.');
  return data;
}

function statusClass(status) {
  const text = String(status || '').toLowerCase();
  if (text.includes('overdue')) return 'overdue';
  if (text.includes('return')) return 'returned';
  if (text.includes('reserv')) return 'reserved';
  return 'borrowed';
}

function renderRows(targetId, rows, emptyText, columns) {
  const target = document.getElementById(targetId);
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    return;
  }
  target.innerHTML = rows.map(row => `
    <div class="account-row">
      ${columns.map(column => column(row)).join('')}
    </div>
  `).join('');
}

function renderProfilePage(data) {
  setText('profile-student-id', data.student_id);
  setText('profile-name', data.full_name);
  setText('profile-lbc', data.lbc_no || '—');
  setText('profile-course-year', [data.course, data.year_level].filter(Boolean).join(' / ') || '—');
  setText('profile-email', data.gmail || '—');
  setText('profile-member-since', data.issued_at || data.member_since || '—');

  const status = data.account_status || 'Good Standing';
  const statusEl = document.getElementById('profile-status');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.classList.toggle('overdue', /overdue|restrict/i.test(status));
  }

  const activeBorrows = data.active_borrows || [];
  const activeReservations = data.active_reservations || [];
  const history = data.borrow_history || [];
  const cancelledReservations = data.cancelled_reservations || history.filter(row => /cancel|failed|no\s*-?show|missed\s*pickup/i.test(String(row.status || '')));
  const counters = data.counters || {};

  setText('profile-active-borrows-count', counters.borrowed ?? activeBorrows.length);
  setText('profile-reserved-count', counters.reserved ?? activeReservations.length);
  setText('profile-history-count', counters.records ?? history.length);

  renderRows('active-borrows-list', activeBorrows, 'No active borrowed books.', [
    row => `<span>${escapeHtml(row.book_no || '—')}</span>`,
    row => `<span class="account-row__title">${escapeHtml(row.title || '—')}</span>`,
    row => `<span>${escapeHtml(row.accession_no || '—')}</span>`,
    row => `<span>${escapeHtml(row.borrowed_at || row.date_borrowed || '—')}</span>`,
    row => `<span>${escapeHtml(row.return_date || row.due_at || row.date_returned || '—')}</span>`,
  ]);

  renderRows('reservations-list', activeReservations, 'No active reservations.', [
    row => `<span>${escapeHtml(row.book_no || '—')}</span>`,
    row => `<span class="account-row__title">${escapeHtml(row.title || '—')}</span>`,
    row => `<span>${escapeHtml(row.reserved_at || row.date_reserved || '—')}</span>`,
    row => `<span>${escapeHtml(row.pickup_date || row.pick_up_date || '—')}</span>`,
    row => `<span><span class="status-pill reserved">${escapeHtml(row.action || (row.queue_position ? `Queue #${row.queue_position}` : (row.status || 'Pending')))}</span></span>`,
  ]);

  renderRows('cancelled-list', cancelledReservations, 'No cancelled or failed reservations.', [
    row => `<span>${escapeHtml(row.book_no || '—')}</span>`,
    row => `<span class="account-row__title">${escapeHtml(row.title || row.book_title || '—')}</span>`,
    row => `<span>${escapeHtml(row.reserved_at || row.date_reserved || '—')}</span>`,
    row => `<span>${escapeHtml(row.pickup_date || row.pick_up_date || '—')}</span>`,
    row => `<span><span class="status-pill overdue">${escapeHtml(row.status || 'Cancelled')}</span></span>`,
  ]);
}

function renderCardPage(data) {
  const fieldMapping = {
    'c-name': data.full_name || '—',
    'c-id': data.student_id || '—',
    'c-lbc': data.lbc_no || '—',
    'c-course': data.course || 'N/A',
    'c-year': data.year_level || 'N/A',
    'c-verified': data.verified_at || '—',
    'c-issued': data.issued_at || '—',
    'member-since': data.issued_at || '—',
    'last-login': data.last_login || '—',
    'fines': formatCurrency(data.fines || 0),
    'c-status': data.account_status || 'Good Standing',
  };

  Object.entries(fieldMapping).forEach(([id, val]) => setText(id, val));
  renderBinary(data.student_id || '', data.issued_at || '', data.account_gen_no || '1');

  const statusText = (data.account_status || 'Good Standing').toLowerCase();
  const statusEl = document.getElementById('c-status');
  if (statusEl) {
    if (statusText.includes('due')) statusEl.style.background = '#b45309';
    else if (statusText.includes('restrict')) statusEl.style.background = '#b91c1c';
    else statusEl.style.background = '#166534';
  }

  const tx = Array.isArray(data.transactions) ? data.transactions : [];
  loadTransactionHistory(tx);
  updateKpis(tx, data.counters || {});
}

document.addEventListener('DOMContentLoaded', async () => {
  const isProfilePage = Boolean(document.querySelector('[data-account-page="profile"]'));
  const isCardPage = Boolean(document.getElementById('c-id') || document.getElementById('transaction-list'));
  if (!isProfilePage && !isCardPage) return;

  try {
    const data = await fetchAccountProfile();
    if (isProfilePage) renderProfilePage(data);
    if (isCardPage) renderCardPage(data);
  } catch (error) {
    console.error('Error loading account data:', error);
    if (isProfilePage) {
      const main = document.querySelector('[data-account-page="profile"]');
      if (main) main.insertAdjacentHTML('afterbegin', `<div class="empty-state">${escapeHtml(error.message)}</div>`);
    }
  }
});
function formatCurrency(amount) {
  const numericAmount = Number(amount) || 0;
  return `₱${numericAmount.toFixed(2)}`;
}

function updateKpis(transactions, counters = {}) {
  const borrowed = counters.borrowed ?? transactions.filter(t => (t.status || '').toLowerCase() === 'borrowed').length;
  const reserved = counters.reserved ?? transactions.filter(t => (t.status || '').toLowerCase() === 'reserved').length;
  const dueSoon = counters.due_soon ?? 0;
  const overdue = counters.overdue ?? transactions.filter(t => (t.status || '').toLowerCase() === 'overdue').length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = Number(v) || 0; };
  set('kpi-borrowed', borrowed);
  set('kpi-reserved', reserved);
  set('kpi-due', dueSoon);
  set('kpi-overdue', overdue);
}

function loadTransactionHistory(transactions) {
  const transactionList = document.getElementById('transaction-list');
  if (!transactionList) return;
  if (!transactions.length) {
    transactionList.innerHTML = '<div class="transaction-empty">No transactions.</div>';
    return;
  }
  transactionList.innerHTML = transactions.map(tx => `
    <div class="transaction-row">
      <span>${escapeHtml(tx.date_borrowed || '—')}</span>
      <span>${escapeHtml(tx.book_no || '—')}</span>
      <span>${escapeHtml(tx.accession_no || '—')}</span>
      <span>${escapeHtml(tx.date_returned || '—')}</span>
    </div>
  `).join('');
}
