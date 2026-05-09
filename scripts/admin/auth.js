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
  });
});
