import {
  clearSession,
  getAuthHeaders,
  getSessionUser,
  saveSession,
} from '../../services/state/session.js';

const SIGN_IN_PATH = '/main/sign_in';
const USER_HOME = '/user/books';
const ADMIN_HOME = '/admin/dashboard';
let guardPromise = null;

function redirectToSignIn() {
  const next = `${window.location.pathname}${window.location.search}`;
  const target = `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`;
  window.location.replace(target);
}

async function fetchSession() {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.authenticated) {
    // Check if this is a session conflict error
    if (data.session_conflict) {
      const message = data.error || 'Your session has expired. Please sign in again.';
      console.warn('Session conflict detected:', message);
      // Store the message for display after redirect
      sessionStorage.setItem('sessionConflictMessage', message);
    }
    throw new Error(data.error || 'Your session has expired. Please sign in again.');
  }

  return data;
}

export async function logoutAdmin() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));
  clearSession();
  if (!response.ok) throw new Error(data.error || 'Logout failed');
  window.location.href = data.redirect || SIGN_IN_PATH;
}

export async function requireAdminSession() {
  if (guardPromise) return guardPromise;

  guardPromise = (async () => {
    const cachedUser = getSessionUser();
    if (cachedUser?.account_type === 'student' || cachedUser?.role === 'student') {
      window.location.replace(USER_HOME);
      return null;
    }

    try {
      const session = await fetchSession();
      const role = session.account_type || session.type || session.user?.account_type || session.user?.role;

      if (role === 'student') {
        saveSession({ user: session.user });
        window.location.replace(USER_HOME);
        return session;
      }

      if (role !== 'admin') {
        throw new Error('Admin access is required for this page.');
      }

      saveSession({ user: session.user });
      return session;
    } catch (err) {
      console.warn('Admin auth guard blocked access:', err);
      clearSession();
      redirectToSignIn();
      return null;
    }
  })();

  return guardPromise;
}

function bindAdminLogout() {
  document.querySelectorAll('#logoutBtn, #logout-btn, .logout-btn').forEach((button) => {
    if (button.dataset.authLogoutBound === '1') return;
    button.dataset.authLogoutBound = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      logoutAdmin().catch((err) => window.alert(err.message));
    });
  });
}

if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/')) {
  requireAdminSession();
  document.addEventListener('DOMContentLoaded', bindAdminLogout);
  document.addEventListener('click', () => bindAdminLogout());
}
