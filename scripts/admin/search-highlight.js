/**
 * Smart Search & Highlight System for Admin Dashboard
 * Searches through dashboard sections and highlights/scrolls to matches
 */

class DashboardSearch {
  constructor() {
    this.searchInput = document.getElementById('nav-search-input');
    this.searchClear = document.getElementById('nav-search-clear');
    this.currentHighlight = null;
    this.searchResults = [];
    this.currentResultIndex = -1;

    // Define searchable sections with keywords and element references
    this.sections = [
      {
        id: 'overview-card',
        title: 'Overview',
        keywords: ['overview', 'total', 'books', 'users', 'stats'],
        selector: '.stat-card:first-child',
        description: 'Overview - Total books and users count'
      },
      {
        id: 'reserved-card',
        title: 'Top 3 Most Reserved',
        keywords: ['reserved', 'top reserved', 'most reserved', 'reserve'],
        selector: '.stat-card:nth-child(2)',
        description: 'Most reserved books list'
      },
      {
        id: 'borrowed-card',
        title: 'Top 3 Most Borrowed',
        keywords: ['borrowed', 'top borrowed', 'most borrowed', 'borrow'],
        selector: '.stat-card:nth-child(3)',
        description: 'Most borrowed books list'
      },
      {
        id: 'reservation-panel',
        title: 'Reservation & Borrowing Area',
        keywords: ['reservation', 'borrowing', 'reservations table', 'loans', 'pending', 'borrowed items'],
        selector: '.reservation-panel',
        description: 'Reservation and borrowing tables'
      }
    ];

    this.init();
  }

  init() {
    if (!this.searchInput) return;

    // Search input event
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Clear button
    if (this.searchClear) {
      this.searchClear.addEventListener('click', () => this.clearSearch());
    }

    // Click outside to close results
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search') && this.searchResults.length > 0) {
        this.closeResults();
      }
    });
  }

  handleSearch(query) {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      this.clearSearch();
      return;
    }

    // Find matching sections
    this.searchResults = this.sections.filter(section => {
      const matches = section.keywords.some(keyword => keyword.includes(trimmedQuery));
      const titleMatch = section.title.toLowerCase().includes(trimmedQuery);
      return matches || titleMatch;
    });

    if (this.searchResults.length > 0) {
      this.showResults();
    } else {
      this.showNoResults();
    }
  }

  handleKeyboard(e) {
    if (this.searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.currentResultIndex = Math.min(this.currentResultIndex + 1, this.searchResults.length - 1);
        this.updateResultsDisplay();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.currentResultIndex = Math.max(this.currentResultIndex - 1, -1);
        this.updateResultsDisplay();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.currentResultIndex >= 0) {
          this.highlightAndScroll(this.searchResults[this.currentResultIndex]);
          this.clearSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.clearSearch();
        break;
    }
  }

  showResults() {
    let resultsHTML = this.searchResults.map((result, index) => 
      `<div class="search-result-item ${index === this.currentResultIndex ? 'active' : ''}" 
            data-index="${index}" 
            onclick="dashboardSearch.selectResult(${index})">
        <div class="result-title">${result.title}</div>
        <div class="result-description">${result.description}</div>
      </div>`
    ).join('');

    let resultsContainer = document.getElementById('search-results-dropdown');
    
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'search-results-dropdown';
      resultsContainer.className = 'search-results-dropdown';
      this.searchInput.parentElement.appendChild(resultsContainer);
    }

    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.style.display = 'block';

    // Add click handlers to result items
    document.querySelectorAll('.search-result-item').forEach((item, index) => {
      item.addEventListener('click', () => this.selectResult(index));
    });
  }

  showNoResults() {
    let resultsContainer = document.getElementById('search-results-dropdown');
    
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'search-results-dropdown';
      resultsContainer.className = 'search-results-dropdown';
      this.searchInput.parentElement.appendChild(resultsContainer);
    }

    resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
    resultsContainer.style.display = 'block';
  }

  updateResultsDisplay() {
    document.querySelectorAll('.search-result-item').forEach((item, index) => {
      item.classList.toggle('active', index === this.currentResultIndex);
    });
  }

  selectResult(index) {
    if (index < 0 || index >= this.searchResults.length) return;
    this.highlightAndScroll(this.searchResults[index]);
    this.clearSearch();
  }

  highlightAndScroll(section) {
    // Remove previous highlight
    if (this.currentHighlight) {
      this.currentHighlight.classList.remove('search-highlighted');
    }

    // Find and highlight the element
    const element = document.querySelector(section.selector);
    if (!element) return;

    this.currentHighlight = element;
    element.classList.add('search-highlighted');

    // Smooth scroll to element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after 4 seconds
    setTimeout(() => {
      if (this.currentHighlight === element) {
        element.classList.remove('search-highlighted');
        this.currentHighlight = null;
      }
    }, 4000);
  }

  closeResults() {
    const resultsContainer = document.getElementById('search-results-dropdown');
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
  }

  clearSearch() {
    this.searchInput.value = '';
    this.searchResults = [];
    this.currentResultIndex = -1;
    const resultsContainer = document.getElementById('search-results-dropdown');
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
let dashboardSearch;
document.addEventListener('DOMContentLoaded', () => {
  dashboardSearch = new DashboardSearch();
});
