const CHECK_COOLDOWN = 60 * 60 * 1000;
let lastCheck = null;

function showInlineNotification(message, type = 'info') {
  if (typeof showNotification === 'function') showNotification(message, type);
  else console.log(`[${type}] ${message}`);
}

async function loadLogs() {
  try {
    const res = await fetch('/api/admin/logs');
    const logs = await res.json();
    const list = document.getElementById('logs-list');
    if (!logs.length) {
      list.innerHTML = '<p class="no-logs">No logs yet.</p>';
      return;
    }
    list.innerHTML = logs.map((log) => `
      <div class="log-entry">
        <span class="log-id">${log.account_id}</span>
        <span class="log-type">${log.event_type}</span>
        <span class="log-time">${log.created_at}</span>
        <span class="log-desc">${log.description || ''}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load logs:', err);
  }
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
  document.getElementById('expiry-enabled').checked = Boolean(rules.expiry_enabled);
  document.getElementById('expiry-years').value = rules.expiry_years || '';
  document.getElementById('inactive-enabled').checked = Boolean(rules.inactive_enabled);
  document.getElementById('inactive-days').value = rules.inactive_days || '';
  document.getElementById('warn-enabled').checked = Boolean(rules.warn_enabled);
  document.getElementById('warn-days').value = rules.warn_before_days || 30;
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
      expiry_enabled: document.getElementById('expiry-enabled').checked,
      expiry_years: document.getElementById('expiry-years').value || null,
      inactive_enabled: document.getElementById('inactive-enabled').checked,
      inactive_days: document.getElementById('inactive-days').value || null,
      warn_enabled: document.getElementById('warn-enabled').checked,
      warn_before_days: document.getElementById('warn-days').value || 30,
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
    document.getElementById('server-load').value = `CPU: ${data.cpu}% | RAM: ${data.ram}%`;
    const status = document.getElementById('server-status');
    status.textContent = data.status;
    status.style.background =
      data.status === 'Normal' ? '#22C55E'
        : data.status === 'Moderate' ? '#F59E0B' : '#EF4444';
    showInlineNotification(`Server status: ${data.status}`, 'info');
  });
  document.querySelectorAll('#nearest-day-rule, #return-days, #return-hours, #expire-days, #expire-hours, #expire-mins, #expiry-enabled, #expiry-years, #inactive-enabled, #inactive-days, #warn-enabled, #warn-days')
    .forEach((el) => el.addEventListener('change', saveRules));
  loadLogs();
  loadRules();
});
