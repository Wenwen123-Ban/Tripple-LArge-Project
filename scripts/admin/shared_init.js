/* shared_init.js — loaded on every admin page */

document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const hamburgerDropdown = document.querySelector('.hamburger-dropdown');
  if (hamburgerBtn && hamburgerDropdown) {
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); hamburgerDropdown.classList.toggle('open'); });
    document.addEventListener('click', () => { hamburgerDropdown.classList.remove('open'); });
  }

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
