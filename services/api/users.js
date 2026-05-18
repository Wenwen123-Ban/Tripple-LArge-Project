import { apiRequest } from './_request.js';

export function getUsers(type = 'admin') {
  return apiRequest('/api/users', { params: { type } });
}

export function updateUser(id, payload) {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
}

export function deleteUser(studentId) {
  return apiRequest(`/api/users/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
}

export function getPendingStudents() {
  return apiRequest('/api/users/pending');
}

export function approveStudent(studentId) {
  return apiRequest(`/api/users/${encodeURIComponent(studentId)}/approve`, { method: 'POST' });
}

export function rejectStudent(studentId, payload = {}) {
  return apiRequest(`/api/users/${encodeURIComponent(studentId)}/reject`, { method: 'POST', body: payload });
}

export function suspendStudent(studentId, payload = {}) {
  return apiRequest(`/api/users/${encodeURIComponent(studentId)}/suspend`, { method: 'POST', body: payload });
}

export function resetStudentBorrow(studentId, payload = {}) {
  return apiRequest(`/api/users/${encodeURIComponent(studentId)}/reset-borrow`, { method: 'POST', body: payload });
}

export function getCourses() {
  return apiRequest('/api/courses');
}

export function addCourse(payload) {
  return apiRequest('/api/courses', { method: 'POST', body: payload });
}

export function deleteCourse(id) {
  return apiRequest(`/api/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getUserCard(params = {}) {
  return apiRequest('/api/user/card', { params });
}

export function getUserProfile() {
  return apiRequest('/api/users/profile');
}
