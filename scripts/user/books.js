/**
 * Books.js - Book Display and Reservation Management
 * Handles book grid loading, filtering, searching, and reservation entry points.
 */

const MOBILE_PAGE_SIZE = 10;
const TABLET_PAGE_SIZE = 20;
const LAPTOP_PAGE_SIZE = 25;
const DESKTOP_PAGE_SIZE = 40;

let activePageSize = 10;
let currentPage = 0;
let allLoaded = false;
let isLoading = false;
let searchDebounce = null;
let resizeDebounce = null;

function getPageSize() {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;

  if (viewportWidth >= 1536) return DESKTOP_PAGE_SIZE;
  if (viewportWidth >= 1280) return LAPTOP_PAGE_SIZE;
  if (viewportWidth >= 768) return TABLET_PAGE_SIZE;
  return MOBILE_PAGE_SIZE;
}

function escapeHtml(value) {
  const text = String(value ?? '').trim();
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

function normalizeStatus(status) {
  const label = String(status || 'Available').trim();
  if (/reserved/i.test(label)) return { className: 'reserved', label: 'Reserved' };
  if (/borrowed|due|overdue/i.test(label)) return { className: 'borrowed', label: label === 'Due' ? 'Borrowed' : label };
  return { className: 'available', label: 'Available' };
}

function createBookCard(book) {
  const status = normalizeStatus(book.computed_status || book.availability_hint || book.status);
  const canReserve = status.className === 'available';
  const author = book.author || book.author_name || book.writer || 'Unknown author';
  const safeTitle = escapeHtml(book.title || 'Untitled book');
  const safeAuthor = escapeHtml(author);

  return `
    <article class="book-card" data-id="${escapeHtml(book.id)}">
      <div class="book-card-main">
        <div class="availability-badge ${status.className}">${escapeHtml(status.label)}</div>

        <div class="book-card-copy">
          <h3 class="book-title" title="${safeTitle}">${safeTitle}</h3>
          <p class="book-author">by ${safeAuthor}</p>
          <span class="book-category-pill">${escapeHtml(book.category_name || 'Uncategorized')}</span>
        </div>

        <button
          class="reserve-btn ${canReserve ? '' : 'disabled'}"
          type="button"
          data-reserve-book-id="${escapeHtml(book.id)}"
          data-reserve-book-title="${safeTitle}"
          ${canReserve ? '' : 'disabled'}>
          Reserve
        </button>
      </div>

      <aside class="book-card-spine" aria-label="Book number ${escapeHtml(book.book_no || 'unavailable')}">
        <span class="book-spine-number">${escapeHtml(book.book_no || '—')}</span>
      </aside>
    </article>
  `;
}

function setGridMessage(message, className = 'book-grid-message') {
  const bookGrid = document.getElementById('book-grid');
  if (bookGrid) {
    bookGrid.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
  }
}

async function loadBooks(reset = false) {
  if (isLoading || (allLoaded && !reset)) return;

  isLoading = true;

  if (reset) {
    currentPage = 0;
    allLoaded = false;
    const bookGrid = document.getElementById('book-grid');
    if (bookGrid) bookGrid.innerHTML = '<div class="book-grid-message">Loading catalog…</div>';
  }

  try {
    const searchTerm = document.getElementById('book-search')?.value || '';
    const categoryId = document.getElementById('category-filter')?.value || 'all';

    const params = new URLSearchParams({
      page: currentPage + 1,
      per_page: activePageSize,
      search: searchTerm,
      category: categoryId,
    });

    const response = await fetch(`/api/books?${params.toString()}`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Catalog request failed.');
    const books = await response.json();
    const rows = Array.isArray(books) ? books : [];

    if (rows.length < activePageSize) allLoaded = true;

    const bookGrid = document.getElementById('book-grid');
    if (bookGrid) {
      if (reset) bookGrid.innerHTML = '';
      rows.forEach(book => {
        bookGrid.insertAdjacentHTML('beforeend', createBookCard(book));
      });
      if (currentPage === 0 && rows.length === 0) {
        setGridMessage('No books match your search yet.');
      }
    }

    currentPage += 1;
  } catch (error) {
    console.error('Error loading books:', error);
    if (currentPage === 0) setGridMessage('Unable to load the catalog right now.', 'book-grid-message error');
  } finally {
    isLoading = false;
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('Category request failed.');
    const categories = await response.json();
    const rows = Array.isArray(categories) ? categories : [];

    const categoryFilter = document.getElementById('category-filter');
    const categoryChips = document.getElementById('category-chips');

    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="all">All categories</option>'
        + rows.map(cat => `<option value="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</option>`).join('');
    }

    if (categoryChips) {
      categoryChips.innerHTML = '<button class="category-chip active" data-id="all">All</button>'
        + rows.map(cat => `<button class="category-chip" data-id="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</button>`).join('');

      categoryChips.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (event) => {
          event.preventDefault();
          categoryChips.querySelectorAll('.category-chip').forEach(btn => btn.classList.remove('active'));
          chip.classList.add('active');
          if (categoryFilter) categoryFilter.value = chip.dataset.id;
          loadBooks(true);
        });
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

async function loadTrending() {
  const fill = async (targetId, sort) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    try {
      const response = await fetch(`/api/books?sort=${sort}&per_page=3`, { credentials: 'same-origin' });
      const books = response.ok ? await response.json() : [];
      target.innerHTML = (Array.isArray(books) ? books : []).map(book => `
        <article class="trend-card">
          <strong>${escapeHtml(book.title || 'Untitled book')}</strong>
          <span>${escapeHtml(book.book_no || '—')}</span>
        </article>
      `).join('') || '<div class="trend-empty">No trend data yet.</div>';
    } catch (error) {
      target.innerHTML = '<div class="trend-empty">Unavailable.</div>';
    }
  };

  fill('top-borrowed', 'most_borrowed');
  fill('top-reserved', 'status');
}

document.addEventListener('DOMContentLoaded', async () => {
  const bookSearchInput = document.getElementById('book-search');
  const searchClearBtn = document.getElementById('book-search-clear');
  const categoryFilter = document.getElementById('category-filter');
  const bookGrid = document.getElementById('book-grid');
  const scrollSentinel = document.getElementById('scroll-sentinel');

  activePageSize = getPageSize();

  await loadCategories();
  loadBooks(true);
  loadTrending();

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (bookSearchInput) bookSearchInput.value = '';
      loadBooks(true);
    });
  }

  if (bookSearchInput) {
    bookSearchInput.addEventListener('input', () => {
      window.clearTimeout(searchDebounce);
      searchDebounce = window.setTimeout(() => loadBooks(true), 250);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.id === categoryFilter.value);
      });
      loadBooks(true);
    });
  }

  if (bookGrid) {
    bookGrid.addEventListener('click', event => {
      const button = event.target.closest('[data-reserve-book-id]');
      if (!button || button.disabled) return;
      const bookId = button.dataset.reserveBookId;
      const title = button.dataset.reserveBookTitle || 'Selected book';
      if (typeof window.reserveBook === 'function') {
        window.reserveBook(bookId, { title });
      }
    });
  }

  if (scrollSentinel) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadBooks();
    }, { threshold: 0.1 });
    observer.observe(scrollSentinel);
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeDebounce);
    resizeDebounce = window.setTimeout(() => {
      const nextPageSize = getPageSize();
      if (nextPageSize !== activePageSize) {
        activePageSize = nextPageSize;
        loadBooks(true);
      }
    }, 200);
  });
});

window.loadBooks = loadBooks;
