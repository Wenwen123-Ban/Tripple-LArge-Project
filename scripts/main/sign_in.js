import { saveSession } from '../../services/state/session.js';
import { setCurrentUser } from '../../services/state/store.js';

document.addEventListener('DOMContentLoaded', () => {
  const idInputs = document.querySelectorAll('.js-id-no');
  const passwordInput = document.getElementById('signinPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const signInForm = document.getElementById('signInForm');
  const errorMessage = document.getElementById('errorMessage');
  const loadingMessage = document.getElementById('loadingMessage');
  const signInBtn = document.getElementById('signInBtn');
  const unavailableMessage = document.getElementById('unavailableMessage');

  // Format ID input
  idInputs.forEach((inputEl) => {
    inputEl.setAttribute('maxlength', '10');
    inputEl.setAttribute('placeholder', '0000-00000');
    inputEl.setAttribute('inputmode', 'numeric');
    inputEl.setAttribute('autocomplete', 'off');
    inputEl.setAttribute('spellcheck', 'false');

    inputEl.addEventListener('input', (event) => {
      let val = event.target.value.replace(/\D/g, '');
      if (val.length > 9) val = val.slice(0, 9);
      if (val.length > 4) {
        event.target.value = val.slice(0, 4) + '-' + val.slice(4);
      } else {
        event.target.value = val;
      }

      if (event.target.value.length === 0 || /^\d{4}-\d{5}$/.test(event.target.value)) {
        event.target.setCustomValidity('');
      } else {
        event.target.setCustomValidity('Enter a complete ID No. in 0000-00000 format.');
      }
    });
  });

  // Password visibility toggle (shown only after account is verified)
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      togglePasswordBtn.classList.toggle('active');
    });
  }

  // Handle sign in form submission
  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const studentId = document.getElementById('signinIdNo').value.trim();
      const password = passwordInput.value;

      if (!/^\d{4}-\d{5}$/.test(studentId)) {
        errorMessage.textContent = 'Enter a complete ID No. in 0000-00000 format.';
        errorMessage.style.display = 'block';
        errorMessage.classList.add('show');
        return;
      }

      if (!password) {
        errorMessage.textContent = 'Password is required.';
        errorMessage.style.display = 'block';
        errorMessage.classList.add('show');
        return;
      }

      // Show loading state with animation
      loadingMessage.classList.add('show');
      errorMessage.classList.remove('show');
      errorMessage.style.display = 'none';
      signInBtn.disabled = true;

      try {
        // Call login API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Login successful - show password toggle and handle redirection
        if (togglePasswordBtn) {
          togglePasswordBtn.style.display = 'inline-block';
        }

        loadingMessage.classList.remove('show');

        if (data.status === 'ok') {
          const accountType = data.type || data.account_type;
          const currentUser = data.user || {
            id: studentId,
            student_id: studentId,
            role: accountType,
            account_type: accountType,
          };

          saveSession({ token: data.token || data.session_token, user: currentUser });
          setCurrentUser(currentUser);
          if (accountType === 'admin') {
            // Fade out animation before redirect
            document.body.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => {
              window.location.href = data.redirect || '/admin/dashboard';
            }, 400);
            return;
          }

          if (accountType === 'student') {
            if (data.redirect) {
              // Fade out animation before redirect
              document.body.style.animation = 'fadeOut 0.4s ease-out forwards';
              setTimeout(() => {
                window.location.href = data.redirect;
              }, 400);
              return;
            }
            signInForm.style.display = 'none';
            unavailableMessage.style.display = 'block';
          }
        }
      } catch (err) {
        loadingMessage.classList.remove('show');
        errorMessage.textContent = err.message;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('show');
        signInBtn.disabled = false;
      }
    });
  }
});
