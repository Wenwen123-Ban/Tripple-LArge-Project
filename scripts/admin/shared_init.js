document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const hamburgerDropdown = document.querySelector('.hamburger-dropdown');
  if (hamburgerBtn && hamburgerDropdown) {
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); hamburgerDropdown.classList.toggle('open'); });
    document.addEventListener('click', () => hamburgerDropdown.classList.remove('open'));
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
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href)) link.classList.add('active');
  });
  const searchBar = document.querySelector('.search-bar');
  const searchClear = document.querySelector('.search-clear');
  if (searchBar && searchClear) searchClear.addEventListener('click', () => { searchBar.value = ''; searchBar.focus(); });
  const elDate = document.getElementById('footer-date');
  const elDay = document.getElementById('footer-day');
  const elTime = document.getElementById('footer-time');
  const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  function updateClock(){const now=new Date();const m=now.getMonth()+1;const d=String(now.getDate()).padStart(2,'0');const y=now.getFullYear();if(elDate)elDate.textContent=`${m}/${d}/${y}`;if(elDay)elDay.textContent=DAYS[now.getDay()];if(elTime)elTime.textContent=now.toLocaleTimeString('en-US',{hour12:true});}
  updateClock();setInterval(updateClock,1000);
  window.padTableRows = function(tbodyId, colCount, minRows = 7) {
    const tbody = document.getElementById(tbodyId); if (!tbody) return;
    let current = tbody.querySelectorAll('tr').length;
    while (current < minRows) { const tr = document.createElement('tr'); tr.innerHTML = Array(colCount).fill('<td>&nbsp;</td>').join(''); tbody.appendChild(tr); current++; }
  };
});
