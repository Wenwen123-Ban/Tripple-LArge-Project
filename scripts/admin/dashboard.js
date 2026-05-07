/* Admin Dashboard Scripts */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize admin dashboard
  console.log('Admin dashboard loaded');
  
  // Handle action buttons
  const actionButtons = document.querySelectorAll('.btn-primary');
  actionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.textContent.trim();
      showNotification('Action', `${action} feature coming soon`, 'info');
    });
  });
});
