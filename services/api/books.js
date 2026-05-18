import { apiRequest } from './_request.js';

export function getBooks(params = {}) {
  return apiRequest('/api/books', { params });
}

export function addBook(payload) {
  return apiRequest('/api/books', { method: 'POST', body: payload });
}

export function updateBook(id, payload) {
  return apiRequest(`/api/books/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
}

export function deleteBook(id) {
  return apiRequest(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getRecentlyDeletedBooks() {
  return apiRequest('/api/books/deleted/recent');
}

export function restoreBook(id) {
  return apiRequest(`/api/books/${encodeURIComponent(id)}/restore`, { method: 'POST' });
}

export function getBookHistory(bookId) {
  return apiRequest('/api/books/history', { params: { book_id: bookId } });
}

export function importAnalyze(formData) {
  return apiRequest('/api/books/import/analyze', { method: 'POST', body: formData });
}

export function importCommit(payload) {
  return apiRequest('/api/books/import/commit', { method: 'POST', body: payload });
}

export function getCategories() {
  return apiRequest('/api/categories');
}

export function addCategory(payload) {
  return apiRequest('/api/categories', { method: 'POST', body: payload });
}

export function deleteCategory(id) {
  return apiRequest(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getRecentlyDeletedCategories() {
  return apiRequest('/api/categories/deleted/recent');
}

export function restoreCategory(id) {
  return apiRequest(`/api/categories/${encodeURIComponent(id)}/restore`, { method: 'POST' });
}
