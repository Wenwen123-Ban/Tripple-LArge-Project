const SESSION_TOKEN_KEY = 'click_collect.auth_token';
const SESSION_USER_KEY = 'click_collect.current_user';

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch (err) {
    console.warn('Browser storage is unavailable:', err);
    return null;
  }
}

export function saveSession({ token, user } = {}) {
  const storage = safeStorage();
  if (!storage) return;

  if (token) {
    storage.setItem(SESSION_TOKEN_KEY, token);
  }

  if (user) {
    storage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  }
}

export function getAuthToken() {
  return safeStorage()?.getItem(SESSION_TOKEN_KEY) || '';
}

export function getSessionUser() {
  const raw = safeStorage()?.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Stored session user is invalid JSON:', err);
    clearSession();
    return null;
  }
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function clearSession() {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(SESSION_TOKEN_KEY);
  storage.removeItem(SESSION_USER_KEY);
}

export const sessionKeys = {
  token: SESSION_TOKEN_KEY,
  user: SESSION_USER_KEY,
};
