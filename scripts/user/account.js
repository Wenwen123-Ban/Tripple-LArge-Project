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
      'member-since': data.issued_at || '—',
      'c-status': data.account_status || 'Good Standing',
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
