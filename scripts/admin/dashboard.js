async function loadDashboardWidgets() {
  try {
    const stats = await (await fetch('/api/admin/dashboard-stats')).json();
    document.getElementById('total-books').textContent = stats.total_books ?? '—';
    document.getElementById('total-users').textContent = stats.total_users ?? '—';
    document.getElementById('count-available') && (document.getElementById('count-available').textContent = stats.available ?? 0);
    document.getElementById('count-reserved') && (document.getElementById('count-reserved').textContent = stats.reserved ?? 0);
    document.getElementById('count-borrowed') && (document.getElementById('count-borrowed').textContent = stats.borrowed ?? 0);
    document.getElementById('count-due') && (document.getElementById('count-due').textContent = stats.due ?? 0);
    const render = (id, items) => { const el = document.getElementById(id); if (!el || !items) return; el.innerHTML = items.map((x, i) => `<li>${i + 1}. ${x.title} (${x.count})</li>`).join(''); };
    render('top-reserved', stats.top_reserved || []); render('top-borrowed', stats.top_borrowed || []);
  } catch (e) { console.error('Dashboard stats failed:', e); }
}
document.addEventListener('DOMContentLoaded', loadDashboardWidgets);
