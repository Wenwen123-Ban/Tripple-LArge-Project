document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.logout-btn');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/main/sign_in';
    }
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
