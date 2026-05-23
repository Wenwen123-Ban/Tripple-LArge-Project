import('/scripts/admin/auth.js');

/* shared_init.js — loaded on every admin page */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  body.classList.add('page-enter');
  requestAnimationFrame(() => body.classList.remove('page-enter'));


  function currentTopPage() {
    const path = window.location.pathname;
    if (path.startsWith('/admin/about')) return 'about';
    if (path.startsWith('/admin/manual')) return 'manual';
    return 'dashboard';
  }

  function syncTopNav() {
    const navIcons = document.querySelector('.nav-icons');
    const items = Array.from(document.querySelectorAll('.nav-icon-btn[data-page]'));
    if (!navIcons || !items.length) return;

    let pill = navIcons.querySelector('.nav-active-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'nav-active-pill';
      navIcons.prepend(pill);
    }

    const activePage = currentTopPage();
    items.forEach((el) => el.classList.toggle('active', el.dataset.page === activePage));
    const activeEl = items.find((el) => el.classList.contains('active'));
    if (!activeEl) return;
    const x = activeEl.offsetLeft - 2;
    pill.style.transform = `translateX(${x}px)`;
    navIcons.classList.add('has-active-pill');

    items.forEach((el) => {
      el.addEventListener('click', (event) => {
        if (el.dataset.page === activePage) return;
        event.preventDefault();
        body.classList.add('page-exit');
        setTimeout(() => { window.location.href = el.href; }, 170);
      });
    });
  }
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const hamburgerDropdown = document.querySelector('.hamburger-dropdown');

  async function loadAdminAccountCard() {
    try {
      const res = await fetch('/api/admin/me');
      if (!res.ok) return;
      const data = await res.json();
      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '—';
      };
      setText('acc-name', data.full_name);
      setText('acc-id', data.admin_id);
      setText('acc-lbc', data.lbc_no);
      setText('acc-email', data.gmail);
      setText('acc-joined', data.created_at);
    } catch (err) {
      console.error('Failed to load account card:', err);
    }
  }

  function ensureAccountDropdown() {
    if (!hamburgerDropdown || document.getElementById('account-card')) return;

    hamburgerDropdown.innerHTML = `
      <div class="account-card" id="account-card">
        <div class="account-card-header">My Account</div>
        <div class="account-detail"><span class="detail-label">Name</span><span class="detail-value" id="acc-name">—</span></div>
        <div class="account-detail"><span class="detail-label">ID</span><span class="detail-value" id="acc-id">—</span></div>
        <div class="account-detail"><span class="detail-label">LBC No</span><span class="detail-value" id="acc-lbc">—</span></div>
        <div class="account-detail"><span class="detail-label">Email</span><span class="detail-value" id="acc-email">—</span></div>
        <div class="account-detail"><span class="detail-label">Joined</span><span class="detail-value" id="acc-joined">—</span></div>
      </div>
      <div class="hamburger-divider"></div>
      <a href="#" class="logout-btn" id="logout-btn">Log Out →</a>
    `;
  }

  function initLogout() {
    document.getElementById('logout-btn')?.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        window.location.href = '/main/sign_in';
      }
    });
  }

  syncTopNav();

  if (hamburgerBtn && hamburgerDropdown) {
    ensureAccountDropdown();
    loadAdminAccountCard();
    initLogout();
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); hamburgerDropdown.classList.toggle('open'); });
    hamburgerDropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => { hamburgerDropdown.classList.remove('open'); });
  }


  function ensureNotificationDropdown() {
    const bellIcon = document.querySelector('.ti-bell');
    const bellBtn = bellIcon?.closest('button');
    if (!bellBtn) return;
    bellBtn.id = 'notif-btn';
    bellBtn.type = 'button';
    bellBtn.setAttribute('aria-label', 'Notifications');

    if (document.getElementById('notif-dropdown')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'notif-wrapper';
    bellBtn.parentNode.insertBefore(wrapper, bellBtn);
    wrapper.appendChild(bellBtn);
    const dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.className = 'notif-dropdown';
    dropdown.innerHTML = '<div class="notif-header"><span class="notif-heading">Notifications</span><div class="notif-actions"><button id="notif-mark-all-btn" class="notif-mark-btn" type="button">Mark all read</button><button id="notif-clear-btn" class="notif-clear-btn" type="button">Clear All</button></div></div><div id="notif-list" class="notif-list"><div class="notif-empty">No notifications</div></div>';
    wrapper.appendChild(dropdown);

    bellBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      dropdown.classList.toggle('open');
      window.loadNotifications();
    });
    dropdown.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  window.loadNotifications = async function loadNotifications() {
    try {
      const res = await fetch('/admin/notifications/');
      if (!res.ok) return;
      const data = await res.json();
      const notifs = data.notifications || [];
      const bell = document.getElementById('notif-btn');
      const unread = data.unread_count || 0;
      if (bell) {
        if (unread > 0) {
          bell.setAttribute('data-badge', unread);
          bell.classList.add('has-badge');
        } else {
          bell.removeAttribute('data-badge');
          bell.classList.remove('has-badge');
        }
      }

      const list = document.getElementById('notif-list');
      if (!list) return;
      list.innerHTML = notifs.length
        ? notifs.map((n) => {
            const used = !!n.is_used;
            const unreadClass = (!n.is_read && !used) ? 'unread' : 'read';
            return `
            <div class="notif-item ${unreadClass} ${used ? 'used' : ''}" data-notif='${JSON.stringify(n).replace(/'/g, '&#39;')}'>
              <div class="notif-item-head">
                <div class="notif-title">${n.title || ''}${used ? ' <span class="notif-used-badge">Used</span>' : ''}</div>
                ${(!n.is_read && !used) ? '<button class="notif-item-btn" data-mark-read="1" type="button">Mark read</button>' : ''}
              </div>
              <div class="notif-msg">${n.message || ''}</div>
              <div class="notif-time">${n.created_at || ''}</div>
            </div>`;
          }).join('')
        : '<div class="notif-empty">No notifications</div>';
      const unreadIds = notifs.filter((n) => !n.is_read && !n.is_used).map((n) => n.id);
      if (document.getElementById('notif-dropdown')?.classList.contains('open') && unreadIds.length) {
        await markManyNotificationsRead(unreadIds);
      }
      list.querySelectorAll('.notif-item').forEach((item) => {
        item.addEventListener('click', (event) => {
          if (event.target?.matches('[data-mark-read]')) {
            event.stopPropagation();
            const notif = JSON.parse(item.dataset.notif || '{}');
            window.markNotificationRead(notif.id).then(() => window.loadNotifications());
            return;
          }
          const notif = JSON.parse(item.dataset.notif || '{}');
          window.handleNotification(notif);
        });
      });
    } catch (err) {
      console.error('Notification load error:', err);
    }
  };

  window.handleNotification = function handleNotification(notif) {
    if (notif.type === 'deletion_code') {
      window.markNotificationRead(notif.id);
      const parsed = JSON.parse(notif.data || '{}');
      if (notif.is_used) {
        if (typeof showNotification === 'function') showNotification('This deletion code has already been used.', 'info');
        return;
      }
      const code = prompt(
        `Deletion confirmation code received:\n${parsed.code}\n\n`
          + `Enter the code below to confirm deletion of admin ${parsed.target_id}:`,
      );
      if (code === parsed.code) {
        if (typeof window.finalizeAdminDeletion === 'function') {
          window.finalizeAdminDeletion(parsed.target_id, code, notif.id);
        } else {
          fetch('/api/admin/finalize-deletion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_id: parsed.target_id, code }),
          }).then(() => window.loadNotifications());
        }
      } else if (code !== null) {
        if (typeof showNotification === 'function') showNotification('Wrong code entered.', 'error');
      }
    }
  };

  document.addEventListener('click', (event) => {
    if (event.target?.id === 'notif-clear-btn') {
      event.stopPropagation();
      clearNotifications();
    }
    if (event.target?.id === 'notif-mark-all-btn') {
      event.stopPropagation();
      markAllNotificationsRead();
    }
  });

  window.markNotificationRead = async function markNotificationRead(notifId) {
    if (!notifId) return;
    try {
      await fetch(`/admin/notifications/mark-read/${notifId}/`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  async function markManyNotificationsRead(notifIds = []) {
    const jobs = notifIds.filter(Boolean).map((id) => fetch(`/admin/notifications/mark-read/${id}/`, { method: 'POST' }));
    if (jobs.length) await Promise.all(jobs);
    window.loadNotifications();
  }

  async function markAllNotificationsRead() {
    await fetch('/admin/notifications/mark-all-read/', { method: 'POST' });
    window.loadNotifications();
  }

  async function clearNotifications() {
    await fetch('/admin/notifications/clear-all/', { method: 'POST' });
    window.loadNotifications();
  }
  ensureNotificationDropdown();
  window.loadNotifications();
  setInterval(window.loadNotifications, 30000);

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const chevron = document.getElementById('sidebarChevron');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (chevron) chevron.className = sidebar.classList.contains('collapsed') ? 'ti ti-chevron-right' : 'ti ti-chevron-left';
    });
  }

  const path = window.location.pathname;
  const linkMap = { dashboard: 'nav-dashboard', books: 'nav-books', users: 'nav-users', security: 'nav-security' };
  Object.entries(linkMap).forEach(([key, id]) => { if (path.includes(key)) { const el = document.getElementById(id); if (el) el.classList.add('active'); } });

  const searchBar = document.querySelector('.search-bar');
  const searchClear = document.querySelector('.search-clear');
  if (searchBar && searchClear) searchClear.addEventListener('click', () => { searchBar.value = ''; searchBar.focus(); });

  const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const eDate = document.getElementById('footer-date'); const eDay = document.getElementById('footer-day'); const eTime = document.getElementById('footer-time');
  function tick(){const now=new Date();const m=now.getMonth()+1;const d=String(now.getDate()).padStart(2,'0');const y=now.getFullYear();if(eDate)eDate.textContent=`${m}/${d}/${y}`;if(eDay)eDay.textContent=DAYS[now.getDay()];if(eTime)eTime.textContent=now.toLocaleTimeString('en-US',{hour12:true});}
  tick(); setInterval(tick,1000);

  window.padTableRows = function(tbodyId, colCount, minRows = 7) {
    const tbody = document.getElementById(tbodyId); if (!tbody) return;
    let n = tbody.querySelectorAll('tr').length;
    while (n < minRows) { const tr = document.createElement('tr'); tr.innerHTML = Array(colCount).fill('<td>&nbsp;</td>').join(''); tbody.appendChild(tr); n++; }
  };

  window.renderReservationRow = function(tbodyId, data) {
    const tbody = document.getElementById(tbodyId); if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${data.bookNo}</td><td>${data.bookTitle}</td><td>${data.userId}</td><td><button class="btn-approve" title="Approve"><i class="ti ti-check"></i></button><button class="btn-reject" title="Reject"><i class="ti ti-x"></i></button></td>`;
    tr.querySelector('.btn-approve').addEventListener('click', data.onApprove);
    tr.querySelector('.btn-reject').addEventListener('click', data.onReject);
    tbody.appendChild(tr);
  };

  window.renderLoanRow = function(tbodyId, data) {
    const tbody = document.getElementById(tbodyId); if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${data.bookNo}</td><td>${data.bookTitle}</td><td>${data.category}</td><td>${data.userId}</td><td>${data.control || '—'}</td>`;
    tbody.appendChild(tr);
  };
});
