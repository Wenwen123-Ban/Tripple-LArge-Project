/**
 * loadComponent(selector, url, callback?)
 * Fetches an HTML component and injects it into the matching element.
 */
async function loadComponent(selector, url, callback) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(url);
    const html = await res.text();
    el.innerHTML = html;
    if (typeof callback === 'function') callback();
  } catch (err) {
    console.error(`Failed to load component: ${url}`, err);
  }
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-icon[data-page]').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

function setActiveSidebar(page) {
  document.querySelectorAll('.sidebar-item[data-sidebar-page]').forEach((el) => {
    el.classList.toggle('active', el.dataset.sidebarPage === page);
  });
}

function setPortalLabel(text) {
  const el = document.getElementById('portal-label');
  if (el) el.textContent = text;
}

function startClock() {
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function tick() {
    const now = new Date();
    const date = `${now.getMonth() + 1}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    const day = DAYS[now.getDay()];
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${ampm}`;
    const el = document.getElementById('footer-datetime');
    if (el) el.textContent = `${date} ${day} ${time}`;
  }
  tick();
  setInterval(tick, 1000);
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
    btn.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.classList.remove('open');
  });
}

function initSidebar(page) {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-toggle');
  if (!sidebar || !btn) return;
  setActiveSidebar(page);
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    btn.textContent = btn.textContent === '‹' ? '›' : '‹';
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
