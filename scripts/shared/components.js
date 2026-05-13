async function loadComponent(selector, url, callback) {
  const el = document.querySelector(selector);
  if (!el) return;

  const res = await fetch(url);
  el.innerHTML = await res.text();

  if (url.includes('/components/navbar.html')) {
    setActiveNav('dashboard');
    initHamburger();
    loadAccountCard();
    initLogout();
  }

  if (typeof callback === 'function') callback();
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-icon-btn[data-page]')
    .forEach((el) => {
      if (el.dataset.page === page) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
}

function setActiveSidebar(page) {
  document.querySelectorAll('.sidebar-item[data-sidebar-page]').forEach((el) => {
    el.classList.toggle('active', el.dataset.sidebarPage === page);
  });
}

function startClock() {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const update = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = String(now.getDate()).padStart(2, '0');
    const y = now.getFullYear();
    const t = now.toLocaleTimeString('en-US', { hour12: true });
    const ed = document.getElementById('footer-date');
    const ew = document.getElementById('footer-day');
    const et = document.getElementById('footer-time');
    if (ed) ed.textContent = `${m}/${d}/${y}`;
    if (ew) ew.textContent = days[now.getDay()];
    if (et) et.textContent = t;
  };
  update();
  setInterval(update, 1000);
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

async function loadAccountCard() {
  try {
    const res = await fetch('/api/admin/me');
    if (!res.ok) return;
    const data = await res.json();

    const name = document.getElementById('acc-name');
    const id = document.getElementById('acc-id');
    const lbc = document.getElementById('acc-lbc');
    const email = document.getElementById('acc-email');
    const joined = document.getElementById('acc-joined');

    if (name) name.textContent = data.full_name || '—';
    if (id) id.textContent = data.admin_id || '—';
    if (lbc) lbc.textContent = data.lbc_no || '—';
    if (email) email.textContent = data.gmail || '—';
    if (joined) joined.textContent = data.created_at || '—';
  } catch (err) {
    console.error('Failed to load account card:', err);
  }
}

function initLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/main/sign_in';
    }
  });
}

function initSidebar(page) {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-toggle');
  const chev = document.getElementById('sidebar-chevron');
  if (!sidebar || !btn) return;
  setActiveSidebar(page);
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (chev) {
      chev.className = sidebar.classList.contains('collapsed')
        ? 'ti ti-chevron-right'
        : 'ti ti-chevron-left';
    }
  });
}

function initNavSearch(onSearch) {
  const input = document.getElementById('nav-search-input');
  const clear = document.getElementById('nav-search-clear');
  if (!input || !clear) return;
  input.addEventListener('input', () => {
    if (typeof onSearch === 'function') onSearch(input.value.trim());
    document.dispatchEvent(new CustomEvent('admin:search', { detail: input.value.trim() }));
  });
  clear.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
  });
}
