let allBooks = [];
let bookSearch = '';

function statusClass(status) {
  const value = String(status || 'available').toLowerCase();
  if (value.includes('borrow')) return 'status-borrowed';
  if (value.includes('pending') || value.includes('reserved')) return 'status-pending';
  return 'status-available';
}

function renderBooks() {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  const filter = document.getElementById('book-status-filter')?.value || 'all';
  const rows = allBooks.filter((book) => {
    const status = String(book.status || 'available').toLowerCase();
    const matchesStatus = filter === 'all' || status.includes(filter);
    const term = `${book.title || ''} ${book.book_no || ''}`.toLowerCase();
    return matchesStatus && term.includes(bookSearch.toLowerCase());
  });
  tbody.innerHTML = rows.map((book) => `
    <tr>
      <td>${book.book_no || '—'}</td>
      <td>${book.title || '—'}</td>
      <td>${book.category || book.category_name || '—'}</td>
      <td class="${statusClass(book.status)}">${book.status || 'Available'}</td>
    </tr>`).join('');
  if (window.padTableRows) window.padTableRows('books-tbody', 4, 8);
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
  try {
    const res = await fetch('/api/books');
    allBooks = res.ok ? await res.json() : [];
    if (!Array.isArray(allBooks)) allBooks = [];
    renderBooks();
  } catch (error) {
    console.error('Books load error:', error);
    allBooks = [];
    renderBooks();
  }
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

document.addEventListener('DOMContentLoaded', async () => {
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
  const booksSearch = document.getElementById('books-search');
  const booksSearchClear = document.getElementById('books-search-clear');
  if (booksSearch) booksSearch.addEventListener('input', (event) => { bookSearch = event.target.value || ''; renderBooks(); });
  if (booksSearchClear) booksSearchClear.addEventListener('click', () => { if (booksSearch) { booksSearch.value=''; bookSearch=''; renderBooks(); booksSearch.focus(); } });
  await loadCategories();
  await loadBooks();
});
