/* User Account Page Scripts */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize user account page
  console.log('User account page loaded');
  
  // Example: Handle edit profile button
  const editButtons = document.querySelectorAll('.btn-outline');
  editButtons.forEach(btn => {
    if (btn.textContent.includes('Edit')) {
      btn.addEventListener('click', () => {
        showNotification('Edit Profile', 'Edit profile feature coming soon', 'info');
      });
    }
  });
});
