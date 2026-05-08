import { requestRecoveryCode, verifyRecoveryCode } from '../../services/api/auth.js';
import { showNotification } from '../shared/notification.js';

function applyIdFormat(inputEl) {
  if (!inputEl) return;

  inputEl.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9);
    e.target.value = val.length > 4
      ? `${val.slice(0, 4)}-${val.slice(4)}`
      : val;
    e.target.setCustomValidity('');
  });
}

function applyLbcFormat(inputEl) {
  if (!inputEl) return;

  inputEl.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    e.target.value = val.length > 4
      ? `${val.slice(0, 4)}-${val.slice(4)}`
      : val;
    e.target.setCustomValidity('');
  });
}

function validateId(value) {
  return /^\d{4}-\d{5}$/.test(value);
}

function validateLbc(value) {
  return /^\d{4}-\d+$/.test(value);
}

function validateRecoveryIdentity({ idInput, lbcInput, gmailInput }) {
  let valid = true;

  if (idInput && !validateId(idInput.value)) {
    idInput.setCustomValidity('Enter a complete ID No. in YYYY-NNNNN format.');
    valid = false;
  } else if (idInput) {
    idInput.setCustomValidity('');
  }

  if (lbcInput && !validateLbc(lbcInput.value)) {
    lbcInput.setCustomValidity('Enter an LBC No. with 4 digits, a hyphen, and at least 1 digit after it.');
    valid = false;
  } else if (lbcInput) {
    lbcInput.setCustomValidity('');
  }

  if (gmailInput && !gmailInput.checkValidity()) {
    valid = false;
  }

  return valid;
}

function buildIdentityPayload({ idInput, lbcInput, gmailInput }) {
  return {
    student_id: idInput?.value.trim() || '',
    lbc_no: lbcInput?.value.trim() || '',
    gmail: gmailInput?.value.trim() || '',
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');
  const recoveryForm = document.getElementById('recoveryForm');
  const idInput = document.getElementById('id-input');
  const lbcInput = document.getElementById('lbc-input');
  const gmailInput = document.getElementById('recoveryGmail');
  const passwordInput = document.getElementById('recoveryPassword');
  const codeInput = document.getElementById('recoveryCode');
  const sendCodeButton = document.getElementById('send-recovery-code-btn');

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  applyIdFormat(idInput);
  applyLbcFormat(lbcInput);

  if (sendCodeButton) {
    sendCodeButton.addEventListener('click', async () => {
      if (!validateRecoveryIdentity({ idInput, lbcInput, gmailInput })) {
        recoveryForm?.reportValidity();
        return;
      }

      sendCodeButton.disabled = true;
      sendCodeButton.textContent = 'Sending...';

      try {
        const result = await requestRecoveryCode(buildIdentityPayload({ idInput, lbcInput, gmailInput }));

        if (result.status === 'sent') {
          showNotification('Recovery code sent! Check your Gmail inbox.', 'success');
          codeInput?.focus();
        } else {
          showNotification(result.error || 'Could not send recovery code.', 'error');
        }
      } catch (err) {
        console.error('Recovery request failed:', err);
        showNotification(err.message || 'Could not send recovery code.', 'error');
      } finally {
        sendCodeButton.disabled = false;
        sendCodeButton.textContent = 'Send recovery code';
      }
    });
  }

  if (recoveryForm) {
    recoveryForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!validateRecoveryIdentity({ idInput, lbcInput, gmailInput })) {
        recoveryForm.reportValidity();
        return;
      }

      if (!recoveryForm.checkValidity()) {
        recoveryForm.reportValidity();
        return;
      }

      try {
        const result = await verifyRecoveryCode({
          student_id: idInput?.value.trim() || '',
          code: codeInput?.value.trim() || '',
          new_password: passwordInput?.value || '',
        });

        if (result.status === 'password_updated') {
          showNotification('Password updated! Redirecting to sign in...', 'success');
          window.setTimeout(() => {
            window.location.href = '/main/sign_in';
          }, 1200);
        } else {
          showNotification(result.error || 'Password reset failed.', 'error');
        }
      } catch (err) {
        console.error('Recovery verification failed:', err);
        showNotification(err.message || 'Password reset failed.', 'error');
      }
    });
  }
});
