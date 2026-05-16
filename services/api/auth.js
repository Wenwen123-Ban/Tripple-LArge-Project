const AUTH_BASE_URL = '/api/auth';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function sendConfirmationEmail({ gmail, name }) {
  const response = await fetch(`${AUTH_BASE_URL}/send-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gmail, name }),
  });

  return parseJsonResponse(response);
}

export async function checkConfirmationToken(token) {
  const response = await fetch(
    `${AUTH_BASE_URL}/check-token?token=${encodeURIComponent(token)}`,
  );

  return parseJsonResponse(response);
}

export async function saveStudentRegistration(payload) {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
}

export async function prevalidateStudentRegistration(payload) {
  const response = await fetch(`${AUTH_BASE_URL}/prevalidate-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
}

export async function checkRegistrationConflicts(payload) {
  const response = await fetch(`${AUTH_BASE_URL}/check-registration-conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
}

export async function requestRecoveryCode({ student_id, lbc_no, gmail }) {
  const response = await fetch(`${AUTH_BASE_URL}/recovery/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, lbc_no, gmail }),
  });

  return parseJsonResponse(response);
}

export async function verifyRecoveryCode({ student_id, code, new_password }) {
  const response = await fetch(`${AUTH_BASE_URL}/recovery/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, code, new_password }),
  });

  return parseJsonResponse(response);
}


export async function checkAccountType(student_id) {
  const response = await fetch(`${AUTH_BASE_URL}/check-type`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id }),
  });

  return parseJsonResponse(response);
}

export async function requestAdminRecoveryCode({ student_id, lbc_no, gmail }) {
  const response = await fetch(`${AUTH_BASE_URL}/admin-recovery/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, lbc_no, gmail }),
  });

  return parseJsonResponse(response);
}

export async function verifyAdminRecoveryCode({ student_id, gmail_code, recovery_key, new_password }) {
  const response = await fetch(`${AUTH_BASE_URL}/admin-recovery/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, gmail_code, recovery_key, new_password }),
  });

  return parseJsonResponse(response);
}
