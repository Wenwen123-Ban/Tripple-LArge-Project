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
