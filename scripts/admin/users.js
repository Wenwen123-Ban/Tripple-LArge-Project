async function verifyAdminSetupCode() {
  const student_id = document.getElementById('id-input')?.value.trim() || '';
  const setup_code = document.getElementById('setup-code-input')?.value.trim() || '';
  try {
    const res = await fetch('/api/auth/verify-admin-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, setup_code }),
    });
    const data = await res.json();
    if (data.status === 'activated') {
      if (window.showNotification) showNotification('Account activated! Redirecting...', 'success');
      setTimeout(() => { window.location.href = data.redirect; }, 2000);
    } else if (window.showNotification) {
      showNotification(data.error || 'Invalid setup code.', 'error');
    }
  } catch (err) {
    if (window.showNotification) showNotification('Connection error. Try again.', 'error');
  }
}

let allUsers = [];
let userSearch = '';

async function loadCourses() {
  const res = await fetch('/api/courses');
  const data = res.ok ? await res.json() : [];
  const courseListSelect = document.getElementById('course-list-select');
  if (courseListSelect) courseListSelect.innerHTML = '<option value="">— Select —</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  const adminCourse = document.getElementById('admin-course');
  if (adminCourse) {
    adminCourse.innerHTML = '<option value="N/A">Course</option>' + data.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
  }
}

async function deleteCourse(id) {
  await fetch(`/api/courses/${id}`, { method: 'DELETE' });
  loadCourses();
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = user
      ? `<td>${user.student_id || user.id || '—'}</td><td>${user.full_name || '—'}</td><td>${user.lbc_no || '—'}</td><td>${user.gmail || '—'}</td><td>${user.address || '—'}</td>`
      : '<td>&nbsp;</td><td></td><td></td><td></td><td></td>';
    if (user) tr.onclick = () => openEditModalById(user.id);
    tbody.appendChild(tr);
  });
  if (window.padTableRows) window.padTableRows('users-tbody', 5, 8);
}


function renderUsers() {
  const type = document.getElementById('user-type-filter').value;
  const rows = allUsers.filter((user) => {
    const accountType = String(user.account_type || 'student').toLowerCase();
    const matchesType = type === 'all' || accountType === type;
    const term = `${user.student_id || ''} ${user.full_name || ''} ${user.lbc_no || ''} ${user.gmail || ''} ${user.address || ''}`.toLowerCase();
    return matchesType && term.includes(userSearch.toLowerCase());
  });
  renderUsersTable(rows);
}

async function loadUsers() {
  const res = await fetch('/api/users');
  allUsers = res.ok ? await res.json() : [];
  renderUsers();
}

function openEditModalById(id) {
  const user = allUsers.find((item) => Number(item.id) === Number(id));
  if (!user) return;
  openEditModal(user);
}

function openEditModal(user) {
  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-name').textContent = `${user.full_name || 'User'} (${user.student_id || user.id})`;
  document.getElementById('edit-lbc-no').value = user.lbc_no || '';
  document.getElementById('edit-user-modal').style.display = 'flex';
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach((modal) => { modal.style.display = 'none'; });
}

document.addEventListener('DOMContentLoaded', () => {
  const addAdminBtn = document.getElementById('add-admin-btn');
  if (addAdminBtn) addAdminBtn.addEventListener('click', () => {
    const modal = document.getElementById('admin-form-modal');
    if (modal) modal.style.display = 'flex';
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeModals));
  document.getElementById('save-course-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-course').value.trim();
    if (!name) return;
    await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    document.getElementById('new-course').value = '';
    loadCourses();
  });
  document.getElementById('user-type-filter').addEventListener('change', renderUsers);
  const usersSearch = document.getElementById('users-search');
  const usersSearchClear = document.getElementById('users-search-clear');
  if (usersSearch) usersSearch.addEventListener('input', (event) => { userSearch = event.target.value || ''; renderUsers(); });
  if (usersSearchClear) usersSearchClear.addEventListener('click', () => { if (usersSearch) { usersSearch.value=''; userSearch=''; renderUsers(); usersSearch.focus(); } });
  const adminRegisterForm = document.getElementById('admin-register-form');
  if (adminRegisterForm) adminRegisterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch('/api/auth/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      const setupDisplay = document.getElementById('setup-code-display');
      const setupValue = document.getElementById('setup-code-value');
      if (setupDisplay && setupValue && payload.setup_code) {
        setupValue.textContent = payload.setup_code;
        setupDisplay.style.display = 'block';
      }
      loadUsers();
    }
  });
  const editUserForm = document.getElementById('edit-user-form');
  if (editUserForm) editUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const lbc_no = document.getElementById('edit-lbc-no').value.trim();
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lbc_no }),
    });
    if (res.ok) {
      closeModals();
      loadUsers();
    }
  });
  loadCourses();
  loadUsers();
});
