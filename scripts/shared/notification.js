/**
 * Shared notification helpers.
 *
 * showNotification(message, type) accepts type: 'success' | 'error' | 'info'.
 * It displays a toast that auto-dismisses after 4 seconds.
 */
function showNotification(message, type = 'info') {
  const existing = document.getElementById('lbas-toast');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#4B0082', border: '#FFD700', icon: '✓' },
    error: { bg: '#A32D2D', border: '#F44336', icon: '✗' },
    info: { bg: '#1A1A6E', border: '#4FC3F7', icon: 'i' },
  };
  const { bg, border, icon } = colors[type] ?? colors.info;

  const toast = document.createElement('div');
  toast.id = 'lbas-toast';
  toast.innerHTML = `<span aria-hidden="true">${icon}</span><span>${message}</span>`;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: bg,
    color: '#ffffff',
    border: `2px solid ${border}`,
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: '9999',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    animation: 'fadeInUp 0.3s ease',
    maxWidth: '340px',
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showLegacyNotification(titleOrMessage, messageOrType, maybeType) {
  const isLegacyCall = typeof maybeType === 'string';
  const message = isLegacyCall ? messageOrType : titleOrMessage;
  const type = isLegacyCall ? maybeType : messageOrType;
  showNotification(message, type || 'info');
}

if (typeof window !== 'undefined') {
  window.showNotification = showLegacyNotification;
}

export { showLegacyNotification, showNotification };
