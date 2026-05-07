/* Shared Notification Utilities */

class Notification {
  constructor(title = '', message = '', type = 'info') {
    this.title = title;
    this.message = message;
    this.type = type;
  }

  show() {
    const notification = document.getElementById('notification');
    if (!notification) return;

    // Set content
    document.getElementById('notification-icon').textContent = this.getIcon();
    document.querySelector('.notification-title').textContent = this.title;
    document.querySelector('.notification-message').textContent = this.message;

    // Set type class
    notification.classList.remove('success', 'error', 'warning', 'info');
    notification.classList.add(this.type, 'active');

    // Auto hide after 5 seconds
    setTimeout(() => this.hide(), 5000);
  }

  hide() {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.classList.remove('active');
    }
  }

  getIcon() {
    const icons = {
      'success': '✓',
      'error': '✕',
      'warning': '⚠',
      'info': 'ℹ'
    };
    return icons[this.type] || 'ℹ';
  }
}

// Global notification helper
window.showNotification = (title, message, type = 'info') => {
  const notif = new Notification(title, message, type);
  notif.show();
};

// Close notification handler
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('notification').classList.remove('active');
    });
  }
});
}

/**
 * Render notifications in dropdown
 * @param {Array} notifications
 */
function renderNotifications(notifications) {
  const notifList = document.getElementById('notifList');
  if (!notifList) return;

  notifList.innerHTML = '';

  if (notifications.length === 0) {
    notifList.innerHTML = '<li style="padding: 12px 16px; text-align: center; color: #666;">No notifications</li>';
    return;
  }

  notifications.forEach(notif => {
    const li = document.createElement('li');
    li.className = notif.read ? 'notification-item read' : 'notification-item';
    li.innerHTML = `
      <div style="display: flex; gap: 12px;">
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 14px;">${notif.message}</p>
          <small style="color: #999; font-size: 12px;">${formatNotificationTime(notif.created_at)}</small>
        </div>
        <button class="close-notif" data-id="${notif.id}" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
      </div>
    `;
    
    const closeBtn = li.querySelector('.close-notif');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        li.remove();
      });
    }

    notifList.appendChild(li);
  });
}

/**
 * Update badge count
 * @param {Array} notifications
 */
function updateBadge(notifications) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;

  const unreadCount = notifications.filter(n => !n.read).length;
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

/**
 * Toggle notification dropdown
 */
function toggleDropdown() {
  const notifDropdown = document.getElementById('notifDropdown');
  if (!notifDropdown) return;

  notificationDropdownOpen = !notificationDropdownOpen;
  if (notificationDropdownOpen) {
    notifDropdown.classList.remove('hidden');
    loadNotifications();
  } else {
    notifDropdown.classList.add('hidden');
  }
}

/**
 * Mark all notifications as read
 */
async function markAllRead() {
  try {
    await notificationAPI.markAllRead();
    loadNotifications();
    showToast('All notifications marked as read', 'success');
  } catch (err) {
    console.error('Error marking all as read:', err);
    showToast('Error marking notifications as read', 'error');
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.animation = 'slideInRight 0.3s ease-out';

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Format notification timestamp
 * @param {string} timestamp
 * @returns {string}
 */
function formatNotificationTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export { init, showToast, markAllRead, toggleDropdown, loadNotifications };
