/**
 * Notifications.js - User Notification Management
 * Handles loading, filtering, and clearing user notifications
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {*} value - Value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(value) {
  const text = String(value ?? '');
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
 * Loads and displays notifications based on filter
 */
async function loadNotifications() {
  try {
    const filterElement = document.getElementById('notif-filter');
    const filter = filterElement ? filterElement.value : 'unread';
    
    const response = await fetch(`/api/user/notifications?filter=${encodeURIComponent(filter)}`);
    const data = await response.json();
    
    // Update notification count
    const countElement = document.getElementById('notif-count');
    if (countElement) {
      const unread = data.unread || 0;
      const total = data.total || 0;
      countElement.textContent = `${unread}/${total}`;
    }
    
    // Update notification list
    const listElement = document.getElementById('notif-page-list');
    if (listElement) {
      if (data.items && data.items.length > 0) {
        const notificationHtml = data.items.map(notification => `
          <div class="notif-item ${notification.is_read ? '' : 'unread'}">
            <div class="notif-item-title">${escapeHtml(notification.title || '')}</div>
            <div class="notif-item-message">${escapeHtml(notification.message || '')}</div>
            <div class="notif-item-time">${escapeHtml(notification.created_at || '')}</div>
          </div>
        `).join('');
        listElement.innerHTML = notificationHtml;
      } else {
        listElement.innerHTML = '<div class="notif-empty">No notifications.</div>';
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    const listElement = document.getElementById('notif-page-list');
    if (listElement) {
      listElement.innerHTML = '<div class="notif-empty">Error loading notifications.</div>';
    }
  }
}

/**
 * Clears all notifications
 */
async function clearNotifications() {
  try {
    const response = await fetch('/api/user/notifications/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      loadNotifications(); // Refresh the notification list
    } else {
      console.error('Error clearing notifications');
    }
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Initialize the page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load notifications initially
  loadNotifications();
  
  // Set up event listener for filter changes
  const filterElement = document.getElementById('notif-filter');
  if (filterElement) {
    filterElement.addEventListener('change', loadNotifications);
  }
  
  // Set up event listener for clear button
  const clearButton = document.getElementById('notif-clear');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      if (confirm('Clear all notifications? This cannot be undone.')) {
        await clearNotifications();
      }
    });
  }
  
  // Optionally refresh notifications every 30 seconds
  setInterval(loadNotifications, 30000);
});
