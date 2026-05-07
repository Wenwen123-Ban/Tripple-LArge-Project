// ── State switcher ────────────────────────────────────────────
function showState(id) {
  document.querySelectorAll('.state').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('state-' + id);
  if (el) el.classList.add('active');
  // Clicking anywhere on welcome → signin
  const area = document.getElementById('mainArea');
  area.onclick = id === 'welcome' ? (e) => {
    if (e.target === area || e.target.classList.contains('main-area'))
      showState('signin');
  } : null;
}

// Click anywhere on welcome page body → go to signin
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mainArea').addEventListener('click', function(e) {
    const welcome = document.getElementById('state-welcome');
    if (welcome.classList.contains('active') &&
        !e.target.closest('.top-nav-links')) {
      showState('signin');
    }
  });
});

// ── Sign in ───────────────────────────────────────────────────
function attemptSignin() {
  const id  = document.getElementById('signinId').value.trim();
  const pw  = document.getElementById('signinPw').value;
  const msg = document.getElementById('signinMsg');
  msg.className = 'msg';

  if (!id || !pw) {
    msg.textContent = 'Please fill in both ID No. and Password.';
    msg.classList.add('error', 'show'); return;
  }

  if (id === 'admin' && pw === 'admin') {
    msg.textContent = 'Authenticating… redirecting to Admin Portal.';
    msg.classList.add('success', 'show');
    setTimeout(() => { window.location.href = '../admin/adminMain.html'; }, 1000);
    return;
  }
  if (id === '2024-001' && pw === 'pass123') {
    msg.textContent = 'Welcome back! Redirecting to your portal…';
    msg.classList.add('success', 'show');
    setTimeout(() => { window.location.href = '../user/userMain.html'; }, 1000);
    return;
  }
  msg.textContent = 'Invalid ID No. or Password. Please try again.';
  msg.classList.add('error', 'show');
}

// ── Registration: Confirm Gmail ───────────────────────────────
function confirmGmail() {
  const gmail = document.getElementById('regGmail').value.trim();
  const name  = document.getElementById('regName').value.trim();
  const msg   = document.getElementById('regMsg');
  msg.className = 'msg';

  if (!name || !gmail) {
    msg.textContent = 'Please fill in your Name and Gmail before confirming.';
    msg.classList.add('error', 'show'); return;
  }
  if (!gmail.includes('@gmail.com')) {
    msg.textContent = 'Please enter a valid Gmail address (@gmail.com).';
    msg.classList.add('error', 'show'); return;
  }

  msg.textContent = 'Confirmation email sent to ' + gmail + '. Please check your inbox.';
  msg.classList.add('success', 'show');

  setTimeout(() => {
    document.getElementById('regEmailCheck').checked = true;
  }, 2000);
}

// ── Account Recovery ─────────────────────────────────────────
function attemptRecovery() {
  const id    = document.getElementById('recovId').value.trim();
  const lbc   = document.getElementById('recovLbc').value.trim();
  const gmail = document.getElementById('recovGmail').value.trim();
  const pw    = document.getElementById('recovPw').value;
  const code  = document.getElementById('recovCode').value.trim();
  const msg   = document.getElementById('recovMsg');
  msg.className = 'msg';

  if (!id || !lbc || !gmail || !pw || !code) {
    msg.textContent = 'Please fill in all fields before proceeding.';
    msg.classList.add('error', 'show'); return;
  }

  msg.textContent = 'Recovery successful! Signing you in…';
  msg.classList.add('success', 'show');
  setTimeout(() => { window.location.href = '../user/userMain.html'; }, 1500);
}
