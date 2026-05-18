import { sanitizeBookTitle } from './format.js';

export const STUDENT_ID_PATTERN = /^\d{4}-\d{5}$/;
export const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;

export function normalizeStudentId(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 9);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

export function isValidStudentId(value) {
  return STUDENT_ID_PATTERN.test(String(value ?? '').trim());
}

export function validateStudentId(value) {
  const studentId = normalizeStudentId(value);
  return {
    value: studentId,
    valid: isValidStudentId(studentId),
    error: isValidStudentId(studentId) ? '' : 'Enter a complete student ID in 0000-00000 format.',
  };
}

export function isValidGmail(value) {
  return GMAIL_PATTERN.test(String(value ?? '').trim());
}

export function requireFields(payload = {}, fields = []) {
  const missing = fields.filter(field => !String(payload[field] ?? '').trim());
  return {
    valid: missing.length === 0,
    missing,
    error: missing.length ? `Missing required field(s): ${missing.join(', ')}` : '',
  };
}

export function validateBookTitle(value) {
  const title = sanitizeBookTitle(value);
  return {
    value: title,
    valid: title.length > 0,
    error: title ? '' : 'Book title is required.',
  };
}
