function showNotification(message, type = 'info') {
  if (window.showNotification) window.showNotification(message, type);
  else console.log(`[${type}] ${message}`);
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
let isAwaitingOneTimeCode = false;
let adminPollInterval = null;
let adminConfirmTimeout = null;

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${user.student_id || user.admin_id || user.id || '—'}</td><td>${user.full_name || '—'}</td><td>${user.lbc_no || '—'}</td><td>${user.gmail || '—'}</td><td>${user.address || '—'}</td>`;
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

function openAdminModal() {
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

function setAdminEmailConfirmed(confirmed) {
  const checkbox = document.getElementById('admin-email-confirmed');
  if (checkbox) checkbox.checked = confirmed;
}

function resetAdminForm() {
  stopAdminTokenPoll();
  adminConfirmToken = null;
  isAwaitingOneTimeCode = false;
  setAdminEmailConfirmed(false);
  document.getElementById('admin-form-section').style.display = 'flex';
  document.getElementById('admin-code-section').style.display = 'none';
  document.getElementById('admin-one-time-code').textContent = '—';
  ['admin-fullname', 'admin-id-input', 'admin-lbc-input', 'admin-address', 'admin-contact', 'admin-gmail', 'admin-password'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const btn = document.getElementById('admin-confirm-gmail-btn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Confirm Gmail';
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
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
        isAwaitingOneTimeCode = true;
        setAdminEmailConfirmed(true);

        const btn = document.getElementById('admin-confirm-gmail-btn');
        if (btn) {
          btn.textContent = 'Get One-Time Code';
          btn.style.background = '#22C55E';
          btn.style.color = '#fff';
          btn.style.borderColor = '#22C55E';
        }

        showNotification('Gmail confirmed! Click Get One-Time Code to finish.', 'success');
      }
    } catch (err) {
      console.error('Admin poll error:', err);
    }
  }, 4000);

  adminConfirmTimeout = setTimeout(() => {
    stopAdminTokenPoll();
    adminConfirmToken = null;
    isAwaitingOneTimeCode = false;
    setAdminEmailConfirmed(false);

    const btn = document.getElementById('admin-confirm-gmail-btn');
    if (btn) btn.textContent = 'Confirm Gmail';

    showNotification('Confirmation link expired. Please resend the admin Gmail confirmation.', 'error');
  }, 15 * 60 * 1000);
}

async function confirmGmail() {
  const gmail = document.getElementById('admin-gmail').value.trim();
  const name = document.getElementById('admin-fullname').value.trim();

  if (!gmail || !name) {
    showNotification('Fill in name and Gmail first.', 'error');
    return;
  }

  const registeredBy = document.getElementById('registering-admin-name').textContent;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  try {
    const res = await fetch('/api/auth/admin-send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gmail,
        name,
        registered_by: registeredBy,
        registered_at: timeStr,
      }),
    });
    const data = await res.json();
    if (data.status === 'sent') {
      adminConfirmToken = data.token;
      isAwaitingOneTimeCode = false;
      setAdminEmailConfirmed(false);

      const btn = document.getElementById('admin-confirm-gmail-btn');
      if (btn) btn.textContent = 'Get One-Time Code';

      startAdminTokenPoll();
      showNotification('Confirmation email sent. Waiting for new admin to confirm...', 'success');
    } else {
      showNotification(data.error || 'Failed to send email.', 'error');
    }
  } catch (err) {
    showNotification('Connection error.', 'error');
  }
}

async function getOneTimeCode() {
  if (!adminConfirmToken) {
    showNotification('Confirm Gmail first.', 'error');
    return;
  }

  if (!isAwaitingOneTimeCode) {
    showNotification('Please wait until the new admin clicks the Gmail confirmation link.', 'info');
    return;
  }

  const payload = {
    admin_id: document.getElementById('admin-id-input').value.trim(),
    lbc_no: document.getElementById('admin-lbc-input').value.trim(),
    full_name: document.getElementById('admin-fullname').value.trim(),
    address: document.getElementById('admin-address').value.trim(),
    contact_no: document.getElementById('admin-contact').value.trim(),
    password: document.getElementById('admin-password').value,
    gmail: document.getElementById('admin-gmail').value.trim(),
    token: adminConfirmToken,
    registered_by: document.getElementById('registering-admin-name')?.textContent || 'Administrator',
    registered_at: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  };

  try {
    const res = await fetch('/api/auth/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.status === 'registered' && data.setup_code) {
      document.getElementById('admin-form-section').style.display = 'none';
      document.getElementById('admin-code-section').style.display = 'flex';
      document.getElementById('admin-one-time-code').textContent = data.setup_code;
      showNotification('Admin registered. Write down the code now.', 'success');
      loadUsers();
    } else {
      showNotification(data.error || 'Registration failed.', 'error');
    }
  } catch (err) {
    showNotification('Connection error. Try again.', 'error');
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
    if (!isAwaitingOneTimeCode) {
      showNotification('Please wait until the new admin clicks the Gmail confirmation link.', 'info');
    }
  });

  document.getElementById('admin-confirm-gmail-btn')?.addEventListener('click', () => {
    if (adminConfirmToken) getOneTimeCode();
    else confirmGmail();
  });

  document.getElementById('admin-done-btn')?.addEventListener('click', () => {
    document.getElementById('admin-modal-overlay').style.display = 'none';
    resetAdminForm();
    showNotification('Admin account created successfully.', 'success');
  });

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
