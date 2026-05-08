let allBooks = [];
let bookSearch = '';

function statusClass(status) {
  const value = String(status || 'available').toLowerCase();
  if (value.includes('borrow')) return 'status-borrowed';
  if (value.includes('pending') || value.includes('reserved')) return 'status-pending';
  return 'status-available';
}

function renderBooks() {
  const table = document.getElementById('books-table');
  const filter = document.getElementById('book-status-filter').value;
  const rows = allBooks.filter((book) => {
    const status = String(book.status || 'available').toLowerCase();
    const matchesStatus = filter === 'all' || status.includes(filter);
    const term = `${book.title || ''} ${book.book_no || ''}`.toLowerCase();
    return matchesStatus && term.includes(bookSearch.toLowerCase());
  });
  table.innerHTML = rows.map((book) => `
    <div class="table-row">
      <span>${book.book_no || '—'}</span>
      <span>${book.title || '—'}</span>
      <span>${book.category || book.category_name || '—'}</span>
      <span><span class="status-badge ${statusClass(book.status)}">${book.status || 'Available'}</span></span>
      <button class="delete-book-btn" onclick="deleteBook(${book.id})">✕</button>
    </div>`).join('') || '<div class="table-row"><span>No books found.</span></div>';
}

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = res.ok ? await res.json() : [];
  const list = document.getElementById('category-list');
  list.innerHTML = data.map((c) => `
    <div class="list-item">
      <span>${c.name}</span>
      <button onclick="deleteCategory(${c.id})">✕</button>
    </div>`).join('');
  const sel = document.getElementById('book-category');
  sel.innerHTML = '<option value="">Category</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadBooks() {
  const res = await fetch('/api/books');
  allBooks = res.ok ? await res.json() : [];
  renderBooks();
}

async function deleteCategory(id) {
  await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  await loadCategories();
}

async function deleteBook(id) {
  await fetch(`/api/books/${id}`, { method: 'DELETE' });
  await loadBooks();
}

async function addBook() {
  const title = document.getElementById('book-title').value.trim();
  const category_id = document.getElementById('book-category').value;
  const book_no = document.getElementById('book-no').value.trim();
  if (!title || !book_no) return;
  await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category_id, book_no }),
  });
  document.getElementById('book-title').value = '';
  document.getElementById('book-no').value = '';
  await loadBooks();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-category-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-category').value.trim();
    if (!name) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    document.getElementById('new-category').value = '';
    loadCategories();
  });
  document.getElementById('add-book-btn').addEventListener('click', addBook);
  document.getElementById('save-book-btn').addEventListener('click', addBook);
  document.getElementById('book-status-filter').addEventListener('change', renderBooks);
  document.addEventListener('admin:search', (event) => { bookSearch = event.detail || ''; renderBooks(); });
  loadCategories();
  loadBooks();
});
