let allUsers = [];
let userSearch = '';

function notify(message, type = 'info') {
  if (window.showNotification) {
    window.showNotification(message, type);
    return;
  }
  alert(message);
}

function ensureAdminModal() {
  if (document.getElementById('admin-form-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'admin-form-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-card" style="max-width:640px;width:95%;background:#fff;border-radius:10px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;color:#1A1A6E;">Add Admin</h3>
        <button type="button" data-close-modal style="border:none;background:transparent;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <form id="admin-register-form" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <input name="full_name" placeholder="Name" required />
        <input name="student_id" placeholder="ID (YYYY-NNNNN)" required />
        <input name="lbc_no" placeholder="LBC (YYYY-NNNNN)" required />
        <input name="gmail" type="email" placeholder="Gmail" required />
        <input name="address" placeholder="Address" required />
        <input name="contact_no" placeholder="Contact No (11 digits)" required />
        <input name="password" type="password" placeholder="Password" required />
        <input name="token" placeholder="Confirmed Gmail token" required />
        <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" data-close-modal>Cancel</button>
          <button type="submit">Add Admin</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach((m) => {
    m.style.display = 'none';
  });
}

async function loadCourses() {
  const res = await fetch('/api/courses');
  const data = res.ok ? await res.json() : [];
  const courseListSelect = document.getElementById('course-list-select');
  if (courseListSelect) {
    courseListSelect.innerHTML = '<option value="">— Select —</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

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
  const filterEl = document.getElementById('user-type-filter');
  const type = filterEl ? filterEl.value : 'all';
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

document.addEventListener('DOMContentLoaded', () => {
  ensureAdminModal();

  const addAdminBtn = document.getElementById('add-admin-btn');
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', () => {
      const modal = document.getElementById('admin-form-modal');
      if (modal) modal.style.display = 'flex';
    });
  }

  document.body.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal]')) closeModals();
  });

  const saveCourseBtn = document.getElementById('save-course-btn');
  if (saveCourseBtn) {
    saveCourseBtn.addEventListener('click', async () => {
      const name = document.getElementById('new-course')?.value.trim();
      if (!name) return;
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      document.getElementById('new-course').value = '';
      loadCourses();
    });
  }

  const usersSearch = document.getElementById('users-search');
  if (usersSearch) {
    usersSearch.addEventListener('input', (event) => {
      userSearch = event.target.value || '';
      renderUsers();
    });
  }

  const userTypeFilter = document.getElementById('user-type-filter');
  if (userTypeFilter) userTypeFilter.addEventListener('change', renderUsers);

  const adminRegisterForm = document.getElementById('admin-register-form');
  if (adminRegisterForm) {
    adminRegisterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(payload.error || 'Failed to register admin.', 'error');
        return;
      }

      if (payload.setup_code) {
        const setupDisplay = document.getElementById('setup-code-display');
        const setupValue = document.getElementById('setup-code-value');
        if (setupDisplay && setupValue) {
          setupValue.textContent = payload.setup_code;
          setupDisplay.style.display = 'block';
        }
      }

      notify(payload.message || 'Admin registered. Save setup code now.', 'success');
      closeModals();
      event.currentTarget.reset();
      loadUsers();
    });
  }

  loadCourses();
  loadUsers();
});
