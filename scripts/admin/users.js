function showNotification(message, type = 'info') {
  if (window.showNotification) window.showNotification(message, type);
  else console.log(`[${type}] ${message}`);
}


function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function applyIdFormat(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', () => {
    const digits = inputEl.value.replace(/\D/g, '').slice(0, 9);
    inputEl.value = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  });
}

function applyLbcFormat(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', () => {
    const digits = inputEl.value.replace(/\D/g, '').slice(0, 9);
    inputEl.value = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  });
}

function applyContactFormat(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', () => {
    inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 11);
  });
}

const ADMIN_COLUMNS = [
  { key: 'admin_id', label: 'ID No.' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'lbc_no', label: 'LBC No.' },
  { key: 'gmail', label: 'Gmail account' },
  { key: 'address', label: 'Address' },
  { key: 'action', label: 'Action' },
];

const STUDENT_COLUMNS_BASE = [
  { key: 'student_id', label: 'ID No.' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'course', label: 'Course' },
  { key: 'gmail', label: 'Gmail account' },
  { key: 'address', label: 'Address' },
  { key: 'action', label: 'Action' },
];

const YEAR_COLUMN = { key: 'year_level', label: 'Year' };
const LEVEL_COLUMN = { key: 'year_level', label: 'Level' };

let currentSort = 'admin';
let currentSecondary = '';
let currentUsers = [];

let adminConfirmToken = null;
let adminPollInterval = null;
let adminConfirmTimeout = null;
let adminFlowStep = 'idle';


function getYearSuffix(n) { return ({ 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[String(n)] || 'th'); }

function getStudentColumns(users) {
  const cols = [...STUDENT_COLUMNS_BASE];
  const idx = cols.findIndex((c) => c.key === 'course');
  const hasJHS = users.some((u) => !u.course || u.course === 'N/A');
  cols.splice(idx + 1, 0, hasJHS ? LEVEL_COLUMN : YEAR_COLUMN);
  return cols;
}

function buildHeaders(users) {
  const columns = currentSort === 'admin' ? ADMIN_COLUMNS : getStudentColumns(users);
  document.getElementById('users-thead').innerHTML = `<tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr>`;
  return columns;
}

function renderTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const columns = buildHeaders(users);
  let sorted = [...users];
  if (currentSecondary === 'course') sorted.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
  if (currentSecondary === 'year' || currentSecondary === 'level') sorted.sort((a, b) => String(a.year_level || '').localeCompare(String(b.year_level || '')));
  if (!sorted.length) { tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;padding:20px;color:#888;">No records found.</td></tr>`; return; }
  tbody.innerHTML = sorted.map((user) => `<tr>${columns.map((col) => {
    if (col.key === 'action') {
      const id = user.admin_id || user.student_id || '';
      return `<td><button class="btn-delete" type="button" onclick="initiateDelete('${escapeHtml(id)}','${currentSort}','${escapeHtml(user.full_name || '')}','${escapeHtml(user.gmail || '')}')">Delete</button></td>`;
    }
    if (col.key === 'course') { const v = user.course || 'N/A'; return `<td>${v === 'N/A' ? '<span class="badge-jhs">JHS / N/A</span>' : escapeHtml(v)}</td>`; }
    if (col.key === 'year_level') {
      const v = user.year_level || '—'; const isJHS = !user.course || user.course === 'N/A';
      return `<td>${isJHS ? `Grade ${escapeHtml(v)}` : `${escapeHtml(v)}${getYearSuffix(v)} Year`}</td>`;
    }
    return `<td>${escapeHtml(user[col.key] || '—')}</td>`;
  }).join('')}</tr>`).join('');
  if (typeof padTableRows === 'function') padTableRows('users-tbody', columns.length, 8);
}

function applySearch() {
  const q = (document.getElementById('user-search')?.value || '').toLowerCase();
  const filtered = currentUsers.filter((u) => Object.values(u).some((v) => String(v).toLowerCase().includes(q)));
  renderTable(filtered);
}

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = res.ok ? await res.json() : [];
    const courses = Array.isArray(data) ? data : [];
    const select = document.getElementById('course-list-select');
    if (!select) return;

    select.innerHTML = '<option value="">— Select —</option>'
      + courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.name)}</option>`).join('');
  } catch (err) {
    console.error('Failed to load courses:', err);
    const select = document.getElementById('course-list-select');
    if (select) select.innerHTML = '<option value="">— Select —</option>';
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`/api/users?type=${currentSort}`);
    const data = res.ok ? await res.json() : [];
    currentUsers = Array.isArray(data) ? data : [];
    applySearch();
  } catch (err) {
    console.error('Failed to load users:', err);
    currentUsers = [];
    renderTable([]);
  }
}

function setAdminEmailConfirmed(confirmed) {
  const checkbox = document.getElementById('admin-email-confirmed');
  if (checkbox) checkbox.checked = confirmed;
}

function setAdminActionButton(text, bg = '#4B0082', enabled = true) {
  const btn = document.getElementById('admin-confirm-gmail-btn');
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = !enabled;
  btn.style.background = bg;
  btn.style.borderColor = bg;
  btn.style.color = '#fff';
  btn.style.opacity = enabled ? '1' : '0.7';
  btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
}

function showAdminDoneButton(show) {
  const doneBtn = document.getElementById('admin-done-btn');
  if (doneBtn) doneBtn.style.display = show ? 'block' : 'none';
}

function openAdminModal() {
  resetAdminForm();
  const adminName = document.querySelector('.sidebar-profile-name')?.textContent?.trim() || 'Administrator';
  document.getElementById('registering-admin-name').textContent = adminName;
  document.getElementById('admin-modal-overlay').style.display = 'flex';
}

function stopAdminTokenPoll() {
  if (adminPollInterval) clearInterval(adminPollInterval);
  if (adminConfirmTimeout) clearTimeout(adminConfirmTimeout);
  adminPollInterval = null;
  adminConfirmTimeout = null;
}

function resetAdminForm() {
  stopAdminTokenPoll();
  adminConfirmToken = null;
  adminFlowStep = 'idle';
  setAdminEmailConfirmed(false);
  const formSection = document.getElementById('admin-form-section');
  if (formSection) formSection.style.display = 'flex';
  showAdminDoneButton(false);
  ['admin-fullname', 'admin-id-input', 'admin-lbc-input', 'admin-address', 'admin-contact', 'admin-gmail', 'admin-password'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setAdminActionButton('Confirm Gmail', '#4B0082', true);
}

function closeAdminModalAfterDone() {
  document.getElementById('admin-modal-overlay').style.display = 'none';
  resetAdminForm();
  showNotification('Admin account created successfully.', 'success');
}

function startAdminTokenPoll() {
  stopAdminTokenPoll();
  setAdminEmailConfirmed(false);

  adminPollInterval = setInterval(async () => {
    if (!adminConfirmToken) return;

    try {
      const res = await fetch(`/api/auth/check-token?token=${encodeURIComponent(adminConfirmToken)}`);
      const data = res.ok ? await res.json() : {};

      if (data.confirmed) {
        stopAdminTokenPoll();
        adminFlowStep = 'done';
        setAdminEmailConfirmed(true);
        setAdminActionButton('Registration Complete ✓', '#22C55E', false);
        showAdminDoneButton(true);
        showNotification('New admin confirmed Gmail and received their private code.', 'success');
        if (typeof loadUsers === 'function') loadUsers();
      }
    } catch (err) {
      console.error('Admin poll error:', err);
    }
  }, 4000);

  adminConfirmTimeout = setTimeout(() => {
    stopAdminTokenPoll();
    if (adminFlowStep === 'sent') {
      adminConfirmToken = null;
      adminFlowStep = 'idle';
      setAdminEmailConfirmed(false);
      setAdminActionButton('Confirm Gmail', '#4B0082', true);
      showNotification('Confirmation expired. Please retry.', 'error');
    }
  }, 15 * 60 * 1000);
}

async function sendAdminForm() {
  const payload = {
    admin_id: document.getElementById('admin-id-input').value.trim(),
    lbc_no: document.getElementById('admin-lbc-input').value.trim(),
    full_name: document.getElementById('admin-fullname').value.trim(),
    address: document.getElementById('admin-address').value.trim(),
    contact_no: document.getElementById('admin-contact').value.trim(),
    password: document.getElementById('admin-password').value,
    gmail: document.getElementById('admin-gmail').value.trim(),
    registered_by: document.getElementById('registering-admin-name')?.textContent || 'Administrator',
    registered_at: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  };

  if (!payload.full_name || !payload.gmail || !payload.admin_id || !payload.password) {
    showNotification('Please fill in all required fields.', 'error');
    return;
  }

  try {
    setAdminActionButton('Sending...', '#888888', false);

    const res = await fetch('/api/auth/admin-send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.status === 'sent') {
      adminConfirmToken = data.token;
      adminFlowStep = 'sent';
      showAdminDoneButton(false);

      let countdown = 5;
      setAdminActionButton(`Email sent successfully — this form will close in ${countdown} seconds`, '#22C55E', false);
      const countTimer = setInterval(() => {
        countdown -= 1;
        setAdminActionButton(`Email sent successfully — this form will close in ${countdown} seconds`, '#22C55E', false);
        if (countdown <= 0) {
          clearInterval(countTimer);
          document.getElementById('admin-modal-overlay').style.display = 'none';
          resetAdminForm();
          showNotification(
            'Admin registration email sent. New admin will receive their one-time code upon confirmation.',
            'success',
          );
          adminConfirmToken = data.token;
          adminFlowStep = 'sent';
          startAdminTokenPoll();
        }
      }, 1000);
    } else {
      adminFlowStep = 'idle';
      showNotification(data.error || 'Failed to send email.', 'error');
      setAdminActionButton('Confirm Gmail', '#4B0082', true);
    }
  } catch (err) {
    adminFlowStep = 'idle';
    showNotification('Connection error.', 'error');
    setAdminActionButton('Confirm Gmail', '#4B0082', true);
  }
}

async function initiateDelete(id, type, name, gmail) {
  try {
    const meRes = await fetch('/api/admin/me');
    const meData = await meRes.json();
    const myId = meData.admin_id;
    if (id === myId) {
      showNotification('You cannot delete your own account.', 'error');
      return;
    }
  } catch (err) {
    showNotification('Unable to verify admin session.', 'error');
    return;
  }

  if (type === 'student') {
    const confirmed = confirm(
      `Delete student account?\n\nName: ${name}\nID: ${id}\n\nThis will notify the student by email.`,
    );
    if (!confirmed) return;
    await deleteStudentAccount(id, name, gmail);
    return;
  }

  const confirmed = confirm(
    `Request deletion of ADMIN account?\n\nName: ${name}\nID: ${id}\n\n`
      + 'A confirmation email will be sent to this admin.\n'
      + 'You will receive a deletion code via notification after they confirm.',
  );
  if (!confirmed) return;
  await requestAdminDeletion(id, name, gmail);
}

async function deleteStudentAccount(studentId, name) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.status === 'deleted') {
      showNotification(`${name}'s account deleted.`, 'success');
      await loadUsers();
    } else {
      showNotification(data.error || 'Deletion failed.', 'error');
    }
  } catch (err) {
    showNotification('Connection error.', 'error');
  }
}

async function requestAdminDeletion(adminId, name) {
  try {
    const res = await fetch('/api/admin/request-deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id: adminId }),
    });
    const data = await res.json();
    if (data.status === 'email_sent') {
      showNotification(
        `Deletion request sent to ${name}. Check your notifications for the confirmation code.`,
        'info',
      );
      if (typeof window.loadNotifications === 'function') window.loadNotifications();
    } else {
      showNotification(data.error || 'Request failed.', 'error');
    }
  } catch (err) {
    showNotification('Connection error.', 'error');
  }
}

async function finalizeAdminDeletion(targetId, code, notifId) {
  const res = await fetch('/api/admin/finalize-deletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId, code, notif_id: notifId }),
  });
  const data = await res.json();
  if (data.status === 'deleted') {
    showNotification('Admin account deleted.', 'success');
    await loadUsers();
    if (typeof window.markNotificationRead === 'function' && notifId) await window.markNotificationRead(notifId);
    if (typeof window.loadNotifications === 'function') window.loadNotifications();
  } else {
    showNotification(data.error || 'Code invalid.', 'error');
  }
}

window.finalizeAdminDeletion = finalizeAdminDeletion;

function handleAdminAction() {
  if (adminFlowStep === 'idle') {
    sendAdminForm();
  } else if (adminFlowStep === 'sent') {
    showNotification('Waiting for new admin to confirm their Gmail.', 'info');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  applyIdFormat(document.getElementById('admin-id-input'));
  applyLbcFormat(document.getElementById('admin-lbc-input'));
  applyContactFormat(document.getElementById('admin-contact'));

  document.getElementById('add-admin-btn')?.addEventListener('click', openAdminModal);
  document.getElementById('open-admin-registration-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    openAdminModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.getElementById('admin-modal-overlay').style.display = 'none';
    resetAdminForm();
  });

  document.getElementById('admin-email-confirmed')?.addEventListener('click', (event) => {
    event.preventDefault();
    showNotification('This checkbox updates automatically after Gmail confirmation.', 'info');
  });

  document.getElementById('admin-confirm-gmail-btn')?.addEventListener('click', handleAdminAction);

  document.getElementById('admin-done-btn')?.addEventListener('click', closeAdminModalAfterDone);

  document.getElementById('save-course-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('new-course')?.value.trim();
    if (!name) return;
    await fetch('/api/courses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    document.getElementById('new-course').value = '';
    loadCourses();
  });

  document.getElementById('user-search')?.addEventListener('input', applySearch);
  document.getElementById('search-clear')?.addEventListener('click', () => {
    const el = document.getElementById('user-search');
    if (el) el.value = '';
    applySearch();
  });
  document.getElementById('primary-sort')?.addEventListener('change', async (e) => {
    currentSort = e.target.value;
    const sec = document.getElementById('secondary-sort-group');
    if (sec) sec.style.display = currentSort === 'student' ? 'flex' : 'none';
    const secSel = document.getElementById('secondary-sort');
    if (secSel) secSel.value = '';
    currentSecondary = '';
    await loadUsers();
  });
  document.getElementById('secondary-sort')?.addEventListener('change', (e) => {
    currentSecondary = e.target.value;
    applySearch();
  });

  await loadCourses();
  await loadUsers();
});

async function loadPendingRegistrations() {
  const tbody = document.getElementById('pending-users-tbody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/users/pending');
    const rows = res.ok ? await res.json() : [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No pending registration requests.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((u) => `<tr>
      <td>${escapeHtml(u.student_id)}</td>
      <td>${escapeHtml(u.full_name)}<br><span class="badge-pending">Pending</span></td>
      <td>${escapeHtml(u.gmail)}</td>
      <td>${escapeHtml(u.course || 'N/A')} / ${escapeHtml(u.year_level || '—')}</td>
      <td><button class="btn-approve" onclick="approveRegistration('${escapeHtml(u.student_id)}')">Approve</button><button class="btn-reject" onclick="rejectRegistration('${escapeHtml(u.student_id)}')">Reject</button></td>
    </tr>`).join('');
  } catch (err) {
    console.error('Pending registrations failed:', err);
  }
}

async function approveRegistration(studentId) {
  const res = await fetch(`/api/users/${studentId}/approve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  showNotification(res.ok ? 'Registration approved.' : (data.error || 'Approval failed.'), res.ok ? 'success' : 'error');
  await loadPendingRegistrations();
  await loadUsers();
}

async function rejectRegistration(studentId) {
  if (!confirm('Reject this registration request?')) return;
  const res = await fetch(`/api/users/${studentId}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const data = await res.json().catch(() => ({}));
  showNotification(res.ok ? 'Registration rejected.' : (data.error || 'Reject failed.'), res.ok ? 'success' : 'error');
  await loadPendingRegistrations();
}

async function suspendManagedStudent() {
  const studentId = document.getElementById('manage-student-id')?.value.trim();
  if (!studentId) return showNotification('Enter a student ID first.', 'error');
  if (!confirm(`Suspend ${studentId}?`)) return;
  const res = await fetch(`/api/users/${studentId}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const data = await res.json().catch(() => ({}));
  showNotification(res.ok ? 'Student suspended.' : (data.error || 'Suspend failed.'), res.ok ? 'success' : 'error');
  await loadUsers();
}

async function resetManagedBorrow() {
  const studentId = document.getElementById('manage-student-id')?.value.trim();
  if (!studentId) return showNotification('Enter a student ID first.', 'error');
  const notes = prompt('Reset note:', 'Manual admin reset') || 'Manual admin reset';
  const res = await fetch(`/api/users/${studentId}/reset-borrow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
  const data = await res.json().catch(() => ({}));
  showNotification(res.ok ? `Borrow records reset: ${data.records_reset || 0}` : (data.error || 'Reset failed.'), res.ok ? 'success' : 'error');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('suspend-student-btn')?.addEventListener('click', suspendManagedStudent);
  document.getElementById('reset-borrow-btn')?.addEventListener('click', resetManagedBorrow);
  loadPendingRegistrations();
});
