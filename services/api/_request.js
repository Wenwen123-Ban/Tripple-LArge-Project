import { getAuthHeaders } from '../state/session.js';

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.pathname + url.search;
}

export async function apiRequest(path, { method = 'GET', body, params, headers = {}, credentials = 'same-origin' } = {}) {
  const requestHeaders = {
    ...getAuthHeaders(),
    ...headers,
  };

  const options = { method, headers: requestHeaders, credentials };

  if (body !== undefined) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json', ...requestHeaders };
    }
  }

  const response = await fetch(buildUrl(path, params), options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
