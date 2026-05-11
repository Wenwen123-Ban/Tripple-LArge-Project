async function loadDashboardWidgets() {
  try {
    const response = await fetch('/api/admin/dashboard-stats');
    if (!response.ok) throw new Error(`Dashboard stats request failed: ${response.status}`);

    const stats = await response.json();
    document.getElementById('total-books').textContent = stats.total_books ?? '—';
    document.getElementById('total-users').textContent = stats.total_users ?? '—';

    if (document.getElementById('count-available')) document.getElementById('count-available').textContent = stats.available ?? 0;
    if (document.getElementById('count-reserved')) document.getElementById('count-reserved').textContent = stats.reserved ?? 0;
    if (document.getElementById('count-borrowed')) document.getElementById('count-borrowed').textContent = stats.borrowed ?? 0;
    if (document.getElementById('count-due')) document.getElementById('count-due').textContent = stats.due ?? 0;

    const render = (id, items) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!Array.isArray(items) || items.length === 0) {
        el.innerHTML = '<li>—</li><li>—</li><li>—</li>';
        return;
      }
      el.innerHTML = items.slice(0, 3).map((x) => {
        const metric = x.count ?? x.cnt ?? 0;
        return `<li>${x.title} (${metric})</li>`;
      }).join('');
    };

    render('top3-reserved', stats.top_reserved || []);
    render('top3-borrowed', stats.top_borrowed || []);
  } catch (e) {
    console.error('Dashboard stats failed:', e);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboardWidgets);
