import('/scripts/user/auth.js');

/**
 * Main.js - Shared User Portal Initialization
 * Handles common functionality like hamburger menu and clock
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Hamburger Menu
  initializeHamburgerMenu();
  
  // Initialize Footer Clock
  initializeFooterClock();
});

/**
 * Initializes the hamburger menu functionality
 */
function initializeHamburgerMenu() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  
  if (!btn || !menu) return;
  
  // Toggle menu on button click
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menu.classList.remove('open');
  });
}

/**
 * Initializes the footer clock that displays current time
 */
function initializeFooterClock() {
  const clock = document.getElementById('footer-clock');
  
  if (!clock) return;
  
  const updateClock = () => {
    const now = new Date();
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    clock.textContent = now.toLocaleString('en-US', options);
  };
  
  // Update immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
}
