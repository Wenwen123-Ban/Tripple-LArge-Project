let allUsers = [];
let userSearch = '';

async function loadCourses() {
  const res = await fetch('/api/courses');
  const data = res.ok ? await res.json() : [];
  document.getElementById('course-list').innerHTML = data.map((c) => `
    <div class="list-item"><span>${c.name}</span><button onclick="deleteCourse(${c.id})">✕</button></div>
  `).join('');
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
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const minRows = 8;
  const rows = users.length > minRows ? users : [...users, ...Array(minRows - users.length).fill(null)];
  rows.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = user
      ? `<td>${user.student_id || user.id || '—'}</td><td>${user.full_name || '—'}</td><td>${user.lbc_no || '—'}</td><td>${user.gmail || '—'}</td><td>${user.address || '—'}</td>`
      : '<td>&nbsp;</td><td></td><td></td><td></td><td></td>';
    if (user) tr.onclick = () => openEditModalById(user.id);
    tbody.appendChild(tr);
  });
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
  document.querySelector('.add-admin-btn').addEventListener('click', () => {
    document.getElementById('admin-form-modal').style.display = 'flex';
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
  document.addEventListener('admin:search', (event) => { userSearch = event.detail || ''; renderUsers(); });
  document.getElementById('admin-register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch('/api/auth/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      event.currentTarget.reset();
      closeModals();
      loadUsers();
    }
  });
  document.getElementById('edit-user-form').addEventListener('submit', async (event) => {
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
