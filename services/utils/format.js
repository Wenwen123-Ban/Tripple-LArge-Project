export function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function sanitizeText(value, maxLength = 255) {
  return normalizeWhitespace(value)
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
    .trim();
}

export function sanitizeBookTitle(value) {
  return sanitizeText(value, 255);
}

export function titleCase(value) {
  return normalizeWhitespace(value).toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function formatBookLabel(book = {}) {
  const title = sanitizeBookTitle(book.title || book.book_title || 'Untitled book');
  const bookNo = sanitizeText(book.book_no || book.accession_no || '', 60);
  return bookNo ? `${bookNo} — ${title}` : title;
}

export function formatPhone(value) {
  return normalizeWhitespace(value).replace(/[^\d+]/g, '');
}

export function formatNumber(value, fallback = '0') {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat('en-US').format(number);
}

export function escapeHtml(value) {
  const text = String(value ?? '');
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, char => map[char]);
}
