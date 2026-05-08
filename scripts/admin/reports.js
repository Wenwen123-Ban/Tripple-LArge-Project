const CHECK_COOLDOWN = 60 * 60 * 1000;
let lastCheck = null;

function showInlineNotification(message, type = 'info') {
  if (typeof showNotification === 'function') showNotification(message, type);
  else console.log(`[${type}] ${message}`);
}

async function loadLogs() {
  const res = await fetch('/api/admin/logs');
  const data = res.ok ? await res.json() : [];
  document.getElementById('logs-list').innerHTML = data.map((log) => `
    <div class="log-row">
      <span>${log.student_id || log.user_id || '—'} - ${log.direction || log.action || 'In'}</span>
      <span>${log.timestamp || log.created_at || '—'}</span>
    </div>`).join('') || '<div class="log-row"><span>No logs found.</span></div>';
}

async function loadRules() {
  const res = await fetch('/api/admin/rules');
  if (!res.ok) return;
  const rules = await res.json();
  document.getElementById('nearest-day-rule').checked = rules.nearest_day_rule !== false;
  document.getElementById('return-days').value = rules.return_days || '';
  document.getElementById('return-hours').value = rules.return_hours || '';
  document.getElementById('expire-days').value = rules.expire_days || '';
  document.getElementById('expire-hours').value = rules.expire_hours || '';
  document.getElementById('expire-mins').value = rules.expire_mins || 30;
}

async function saveRules() {
  await fetch('/api/admin/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nearest_day_rule: document.getElementById('nearest-day-rule').checked,
      return_days: document.getElementById('return-days').value || null,
      return_hours: document.getElementById('return-hours').value || null,
      expire_days: document.getElementById('expire-days').value || null,
      expire_hours: document.getElementById('expire-hours').value || null,
      expire_mins: document.getElementById('expire-mins').value || 30,
    }),
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('check-btn').addEventListener('click', async () => {
    const now = Date.now();
    if (lastCheck && (now - lastCheck) < CHECK_COOLDOWN) {
      const remaining = Math.ceil((CHECK_COOLDOWN - (now - lastCheck)) / 60000);
      showInlineNotification(`Please wait ${remaining} more minute(s) before checking again.`, 'info');
      return;
    }
    lastCheck = now;
    const res = await fetch('/api/admin/server-health');
    const data = await res.json();
    document.getElementById('server-load').value = data.load;
    const status = document.getElementById('server-status');
    status.textContent = data.status;
    status.className = `status-badge status-${String(data.status || 'normal').toLowerCase()}`;
  });
  document.querySelectorAll('#nearest-day-rule, #return-days, #return-hours, #expire-days, #expire-hours, #expire-mins')
    .forEach((el) => el.addEventListener('change', saveRules));
  loadLogs();
  loadRules();
});
