/**
 * Books.js - Book Display and Reservation Management
 * Handles book grid loading, filtering, searching, and reservations
 */

const PAGE_SIZE = 15;
let currentPage = 0;
let allLoaded = false;
let isLoading = false;

/**
 * Escapes HTML special characters to prevent XSS
 * @param {*} value - Value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(value) {
  const text = String(value ?? '').trim();
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Creates HTML card for a book
 * @param {Object} book - Book object
 * @returns {string} HTML string for book card
 */
function createBookCard(book) {
  const statusMap = {
    'Available': { className: 'available', label: 'Available' },
    'Reserved': { className: 'reserved', label: 'Reserved' },
    'Borrowed': { className: 'borrowed', label: 'Borrowed' },
    'Due': { className: 'borrowed', label: 'Borrowed' }
  };

  const status = statusMap[book.computed_status] || statusMap.Available;
  const canReserve = book.computed_status === 'Available';
  const reserveAction = canReserve ? `reserveBook(${book.id})` : 'void(0)';

  return `
    <article class="book-card" data-id="${book.id}">
      <div class="book-card-main">
        <div class="availability-badge ${status.className}">${status.label}</div>

        <div class="book-card-copy">
          <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <span class="book-category-pill">${escapeHtml(book.category_name || 'Uncategorized')}</span>
        </div>

        <button
          class="reserve-btn ${canReserve ? '' : 'disabled'}"
          ${canReserve ? '' : 'disabled'}
          onclick="${reserveAction}">
          Reserve
        </button>
      </div>

      <aside class="book-card-spine" aria-label="Book number ${escapeHtml(book.book_no || 'unavailable')}">
        <span class="book-spine-number">${escapeHtml(book.book_no || '—')}</span>
      </aside>
    </article>
  `;
}

/**
 * Loads books from API with pagination and filters
 * @param {boolean} reset - Whether to reset pagination
 */
async function loadBooks(reset = false) {
  if (isLoading || (allLoaded && !reset)) return;
  
  isLoading = true;
  
  if (reset) {
    currentPage = 0;
    allLoaded = false;
    const bookGrid = document.getElementById('book-grid');
    if (bookGrid) bookGrid.innerHTML = '';
  }
  
  try {
    const searchTerm = document.getElementById('book-search')?.value || '';
    const categoryId = document.getElementById('category-filter')?.value || 'all';
    
    const params = new URLSearchParams({
      page: currentPage + 1,
      per_page: PAGE_SIZE,
      search: searchTerm,
      category: categoryId
    });
    
    const response = await fetch(`/api/books?${params.toString()}`);
    const books = await response.json();
    
    // Check if we've loaded all books
    if (books.length < PAGE_SIZE) {
      allLoaded = true;
    }
    
    // Add books to grid
    const bookGrid = document.getElementById('book-grid');
    if (bookGrid) {
      books.forEach(book => {
        bookGrid.insertAdjacentHTML('beforeend', createBookCard(book));
      });
    }
    
    currentPage++;
  } catch (error) {
    console.error('Error loading books:', error);
  } finally {
    isLoading = false;
  }
}

/**
 * Loads all available categories from API
 */
async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    
    const categoryFilter = document.getElementById('category-filter');
    const categoryChips = document.getElementById('category-chips');
    
    if (categoryFilter) {
      const options = '<option value="all">Category</option>' +
        categories
          .map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`)
          .join('');
      categoryFilter.innerHTML = options;
    }
    
    if (categoryChips) {
      const chips = categories
        .map(cat => `<button class="category-chip" data-id="${cat.id}">${escapeHtml(cat.name)}</button>`)
        .join('');
      categoryChips.innerHTML = chips;
      
      // Add click handlers to chips
      categoryChips.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          if (categoryFilter) {
            categoryFilter.value = chip.dataset.id;
          }
          loadBooks(true);
        });
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Reserves a book for the current user
 * @param {number} bookId - ID of the book to reserve
 */
async function reserveBook(bookId) {
  try {
    const response = await fetch('/api/transactions/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Book reserved successfully!');
      loadBooks(true); // Refresh to show updated status
    } else {
      alert(result.error || 'Failed to reserve book.');
    }
  } catch (error) {
    console.error('Error reserving book:', error);
    alert('An error occurred while reserving the book.');
  }
}

/**
 * Initialize the page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const bookSearchInput = document.getElementById('book-search');
  const searchClearBtn = document.getElementById('book-search-clear');
  const categoryFilter = document.getElementById('category-filter');
  const scrollSentinel = document.getElementById('scroll-sentinel');
  
  // Load categories first
  await loadCategories();
  
  // Load initial books
  loadBooks(true);
  
  // Set up event listeners
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (bookSearchInput) {
        bookSearchInput.value = '';
      }
      loadBooks(true);
    });
  }
  
  if (bookSearchInput) {
    bookSearchInput.addEventListener('input', () => {
      loadBooks(true);
    });
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      loadBooks(true);
    });
  }
  
  // Infinite scroll - load more when sentinel is visible
  if (scrollSentinel) {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadBooks();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(scrollSentinel);
  }
});
