import { getSessionUser, saveSession } from './session.js';

const initialState = Object.freeze({
  currentUser: getSessionUser(),
  role: getSessionUser()?.role || getSessionUser()?.account_type || null,
});

let state = { ...initialState };
const listeners = new Set();

function notify() {
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot));
}

export function getState() {
  return { ...state };
}

export function setState(partialState = {}) {
  state = { ...state, ...partialState };
  notify();
  return getState();
}

export function setCurrentUser(user = null) {
  const role = user?.role || user?.account_type || null;
  saveSession({ user });
  return setState({ currentUser: user, role });
}

export function getCurrentUser() {
  return state.currentUser;
}

export function getRole() {
  return state.role;
}

export function clearStore() {
  state = { currentUser: null, role: null };
  notify();
}

export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('Store subscriber must be a function.');
  }

  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}
