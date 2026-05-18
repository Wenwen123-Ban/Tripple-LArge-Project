const DEFAULT_DATE_FORMAT = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

const DEFAULT_DATE_TIME_FORMAT = {
  ...DEFAULT_DATE_FORMAT,
  hour: '2-digit',
  minute: '2-digit',
};

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value, fallback = '—', options = DEFAULT_DATE_FORMAT) {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatDateTime(value, fallback = '—', options = DEFAULT_DATE_TIME_FORMAT) {
  return formatDate(value, fallback, options);
}

export function formatDueDate(value, fallback = 'No due date') {
  return formatDateTime(value, fallback);
}

export function toIsoDate(value = new Date()) {
  const date = toDate(value);
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

export function addDays(value, days = 0) {
  const date = toDate(value) || new Date();
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

export function daysUntil(value, now = new Date()) {
  const date = toDate(value);
  const base = toDate(now) || new Date();
  if (!date) return null;
  return Math.ceil((date.getTime() - base.getTime()) / (24 * 60 * 60 * 1000));
}

export function isPastDue(value, now = new Date()) {
  const date = toDate(value);
  const base = toDate(now) || new Date();
  return Boolean(date && date.getTime() < base.getTime());
}
