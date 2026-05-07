/* User Books Page Scripts */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize books page
  console.log('Books page loaded');
  
  // Handle reserve button clicks
  const reserveButtons = document.querySelectorAll('.btn-primary');
  reserveButtons.forEach(btn => {
    if (btn.textContent.includes('Reserve')) {
      btn.addEventListener('click', (e) => {
        if (!btn.hasAttribute('disabled')) {
          showNotification('Success', 'Book reserved successfully!', 'success');
        }
      });
    }
  });

  // Handle search
  const searchInput = document.getElementById('book-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const bookCards = document.querySelectorAll('.book-card');
      bookCards.forEach(card => {
        const title = card.querySelector('.book-title').textContent.toLowerCase();
        const author = card.querySelector('.book-author').textContent.toLowerCase();
        const isbn = card.querySelector('.book-isbn').textContent.toLowerCase();
        
        if (title.includes(query) || author.includes(query) || isbn.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});
