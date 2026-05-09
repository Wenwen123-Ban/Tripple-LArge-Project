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

let allUsers = [];
let userSearch = '';
let adminConfirmToken = null;
let adminPollInterval = null;
let adminConfirmTimeout = null;
let adminFlowStep = 'idle';

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  users.forEach((user) => {
    const tr = document.createElement('tr');
    const idNo = user.student_id || user.admin_id || user.id || '';
    const accountType = String(user.account_type || 'student').toLowerCase();
    tr.innerHTML = `
      <td>${escapeHtml(idNo || '—')}</td>
      <td>${escapeHtml(user.full_name || '—')}</td>
      <td>${escapeHtml(user.lbc_no || '—')}</td>
      <td>${escapeHtml(user.gmail || '—')}</td>
      <td>${escapeHtml(user.address || '—')}</td>
      <td>
        <button class="btn-delete" type="button"
                data-id="${escapeHtml(idNo)}"
                data-type="${escapeHtml(accountType)}"
                data-name="${escapeHtml(user.full_name || '')}"
                data-gmail="${escapeHtml(user.gmail || '')}">
          Delete
        </button>
      </td>`;
    tr.querySelector('.btn-delete')?.addEventListener('click', (event) => {
      const btn = event.currentTarget;
      initiateDelete(btn.dataset.id, btn.dataset.type, btn.dataset.name, btn.dataset.gmail);
    });
    tbody.appendChild(tr);
  });
}

function renderUsers() {
  const type = document.getElementById('user-type-filter')?.value || 'all';
  const rows = allUsers.filter((user) => {
    const accountType = String(user.account_type || 'student').toLowerCase();
    const matchesType = type === 'all' || accountType === type;
    const term = `${user.student_id || ''} ${user.admin_id || ''} ${user.full_name || ''} ${user.lbc_no || ''} ${user.gmail || ''} ${user.address || ''}`.toLowerCase();
    return matchesType && term.includes(userSearch.toLowerCase());
  });
  renderUsersTable(rows);
}

async function loadUsers() {
  const res = await fetch('/api/users');
  allUsers = res.ok ? await res.json() : [];
  renderUsers();
}

async function loadCourses() {
  const res = await fetch('/api/courses');
  const data = res.ok ? await res.json() : [];
  const courseListSelect = document.getElementById('course-list-select');
  if (courseListSelect) {
    courseListSelect.innerHTML = '<option value="">— Select —</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
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
      loadUsers();
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

async function finalizeAdminDeletion(targetId, code) {
  const res = await fetch('/api/admin/finalize-deletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId, code }),
  });
  const data = await res.json();
  if (data.status === 'deleted') {
    showNotification('Admin account deleted.', 'success');
    loadUsers();
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

document.addEventListener('DOMContentLoaded', () => {
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

  document.getElementById('users-search')?.addEventListener('input', (event) => {
    userSearch = event.target.value || '';
    renderUsers();
  });
  document.getElementById('user-type-filter')?.addEventListener('change', renderUsers);

  loadCourses();
  loadUsers();
});
