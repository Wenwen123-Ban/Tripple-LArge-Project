export async function logoutAdmin() {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Logout failed');
  window.location.href = data.redirect || '/main/sign_in';
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', (e) => {
    e.preventDefault();
    logoutAdmin().catch((err) => alert(err.message));
  });
});
