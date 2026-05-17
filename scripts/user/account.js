/**
 * Account.js - Digital Library Card Management
 */

function generateDynamicBinary(seed = '') {
  const base = (seed || '01011001').replace(/\D/g, '') || '01011001';
  let out = '';
  while (out.length < 360) out += `${base}${Math.random().toString(2).slice(2, 12)}`;
  return out.slice(0, 360);
}

function renderBinary(studentId) {
  const binaryLeft = document.getElementById('binary-left');
  const binaryTop = document.getElementById('binary-top');
  if (binaryLeft) binaryLeft.textContent = '01001110 01001101 01010011 01000011 01010011 01010100';
  if (binaryTop) binaryTop.textContent = generateDynamicBinary(studentId);
}

function escapeHtml(value) {
  const text = String(value ?? '');
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, char => map[char]);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/user/card');
    const data = await response.json();

    const fieldMapping = {
      'c-name': data.full_name || '—',
      'c-id': data.student_id || '—',
      'c-lbc': data.lbc_no || '—',
      'c-course': data.course || 'N/A',
      'c-year': data.year_level || 'N/A',
      'c-verified': data.verified_at || '—',
      'c-issued': data.issued_at || '—',
      'member-since': data.issued_at || '—'
    };

    Object.entries(fieldMapping).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    const now = new Date();
    const lastLogin = now.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const ll = document.getElementById('last-login');
    if (ll) ll.textContent = lastLogin;

    renderBinary(data.student_id || '');

    const tx = Array.isArray(data.transactions) ? data.transactions : [];
    loadTransactionHistory(tx);
    updateKpis(tx);
  } catch (error) {
    console.error('Error loading card data:', error);
  }
});

function updateKpis(transactions) {
  const borrowed = transactions.filter(t => (t.status || '').toLowerCase() === 'borrowed').length;
  const reserved = transactions.filter(t => (t.status || '').toLowerCase() === 'reserved').length;
  const dueSoon = 0;
  const overdue = transactions.filter(t => (t.status || '').toLowerCase() === 'overdue').length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('kpi-borrowed', borrowed || 0); set('kpi-reserved', reserved || 0); set('kpi-due', dueSoon); set('kpi-overdue', overdue || 0);
}

function loadTransactionHistory(transactions) {
  const transactionList = document.getElementById('transaction-list');
  if (!transactionList) return;
  if (!transactions.length) {
    transactionList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No transactions.</div>';
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
