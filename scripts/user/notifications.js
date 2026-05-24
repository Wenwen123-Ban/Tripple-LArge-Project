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
 * Get icon and color type based on notification type or content
 * @param {Object} notification - Notification object
 * @returns {Object} Icon and type
 */
function getNotificationIcon(notification) {
  const type = (notification.notification_type || '').toLowerCase();
  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();

  // Map notification types to icons and colors
  const iconMap = {
    'ready': { icon: '📚', type: 'success' },
    'pickup': { icon: '📚', type: 'success' },
    'available': { icon: '✓', type: 'success' },
    'reminder': { icon: '⏰', type: 'warning' },
    'due': { icon: '⏰', type: 'warning' },
    'overdue': { icon: '⚠️', type: 'error' },
    'fine': { icon: '💳', type: 'error' },
    'system': { icon: '📢', type: 'info' },
    'announcement': { icon: '📢', type: 'info' },
    'update': { icon: '🔔', type: 'info' },
    'default': { icon: '🔔', type: 'info' }
  };

  // Check type field
  if (iconMap[type]) return iconMap[type];

  // Check title keywords
  for (const key in iconMap) {
    if (key !== 'default' && title.includes(key)) {
      return iconMap[key];
    }
  }

  // Check message keywords
  for (const key in iconMap) {
    if (key !== 'default' && message.includes(key)) {
      return iconMap[key];
    }
  }

  return iconMap['default'];
}

/**
 * Format time relative to now (e.g., "2 mins ago")
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} Relative time string
 */
function getRelativeTime(isoString) {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min${Math.floor(seconds / 60) > 1 ? 's' : ''} ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;

    // Format date: "Oct 25, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Determine if a notification is "new" (created within last 24 hours)
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {boolean}
 */
function isNewNotification(isoString) {
  if (!isoString) return false;
  try {
    const date = new Date(isoString);
    const now = new Date();
    const hoursDiff = (now - date) / (1000 * 60 * 60);
    return hoursDiff < 24;
  } catch (e) {
    return false;
  }
}

/**
 * Create a notification card HTML element
 * @param {Object} notification - Notification object
 * @returns {string} HTML string for the card
 */
function createNotificationCard(notification) {
  const { icon, type } = getNotificationIcon(notification);
  const timeStr = getRelativeTime(notification.created_at);
  const isRead = notification.is_read ? 'read' : 'unread';
  const title = escapeHtml(notification.title || 'Notification');
  const message = escapeHtml(notification.message || '');

  let html = `
    <div class="notif-item type-${type} ${isRead}">
      <div class="notif-icon">${icon}</div>
      <div class="notif-content">
        <div class="notif-header">
          <h3 class="notif-item-title">${title}</h3>
          <span class="notif-item-time">${timeStr}</span>
        </div>
        <p class="notif-item-message">${message}</p>
  `;

  // Add action buttons if available
  if (notification.action_button_label && notification.action_button_url) {
    html += `
        <div class="notif-actions">
          <a href="${escapeHtml(notification.action_button_url)}" class="notif-action-btn notif-action-primary">
            ${escapeHtml(notification.action_button_label)}
          </a>
        </div>
    `;
  }

  // Add badge if available (e.g., fine amount)
  if (notification.badge_text) {
    const badgeClass = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'info');
    html += `<span class="notif-badge ${badgeClass}">${escapeHtml(notification.badge_text)}</span>`;
  }

  html += `</div></div>`;

  return html;
}

/**
 * Group notifications by "New" and "Earlier"
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Grouped notifications
 */
function groupNotifications(notifications) {
  const newNotifs = [];
  const earlierNotifs = [];

  notifications.forEach(notif => {
    if (isNewNotification(notif.created_at)) {
      newNotifs.push(notif);
    } else {
      earlierNotifs.push(notif);
    }
  });

  return { newNotifs, earlierNotifs };
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
    if (!listElement) return;

    if (data.items && data.items.length > 0) {
      const { newNotifs, earlierNotifs } = groupNotifications(data.items);
      let html = '';

      // New Notifications Section
      if (newNotifs.length > 0) {
        html += '<div class="notif-section">';
        html += '<h2 class="notif-section-title">New Notifications</h2>';
        newNotifs.forEach(notif => {
          html += createNotificationCard(notif);
        });
        html += '</div>';
      }

      // Earlier Notifications Section
      if (earlierNotifs.length > 0) {
        html += '<div class="notif-section">';
        html += '<h2 class="notif-section-title">Earlier this week</h2>';
        earlierNotifs.forEach(notif => {
          html += createNotificationCard(notif);
        });
        html += '</div>';
      }

      listElement.innerHTML = html;
    } else {
      // Empty state
      listElement.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">🔔</div>
          <h3 class="notif-empty-title">All caught up!</h3>
          <p class="notif-empty-text">Check back later for new library updates.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    const listElement = document.getElementById('notif-page-list');
    if (listElement) {
      listElement.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">⚠️</div>
          <h3 class="notif-empty-title">Error</h3>
          <p class="notif-empty-text">Unable to load notifications. Please try again later.</p>
        </div>
      `;
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
 * Mark all notifications as read
 */
async function markAllAsRead() {
  try {
    const response = await fetch('/api/user/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      loadNotifications(); // Refresh the notification list
    } else {
      console.error('Error marking notifications as read');
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
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

  // Optional: Set up mark all as read button if it exists
  const markReadBtn = document.getElementById('mark-read');
  if (markReadBtn) {
    markReadBtn.addEventListener('click', markAllAsRead);
  }

  // Refresh notifications every 30 seconds
  setInterval(loadNotifications, 30000);
});
