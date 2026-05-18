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
    throw new Error(data.error || 'Your session has expired. Please sign in again.');
  }

  return data;
}

export async function requireUserSession() {
  if (guardPromise) return guardPromise;

  guardPromise = (async () => {
    const cachedUser = getSessionUser();
    if (cachedUser?.account_type === 'admin' || cachedUser?.role === 'admin') {
      window.location.replace(ADMIN_HOME);
      return null;
    }

    try {
      const session = await fetchSession();
      const role = session.account_type || session.type || session.user?.account_type || session.user?.role;

      if (role === 'admin') {
        saveSession({ user: session.user });
        window.location.replace(ADMIN_HOME);
        return session;
      }

      if (role !== 'student') {
        throw new Error('Student access is required for this page.');
      }

      saveSession({ user: session.user });
      return session;
    } catch (err) {
      console.warn('User auth guard blocked access:', err);
      clearSession();
      redirectToSignIn();
      return null;
    }
  })();

  return guardPromise;
}

if (typeof window !== 'undefined' && window.location.pathname.startsWith('/user/')) {
  requireUserSession();
}
