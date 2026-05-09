import {
  checkAccountType,
  requestAdminRecoveryCode,
  requestRecoveryCode,
  verifyAdminRecoveryCode,
  verifyRecoveryCode,
} from '../../services/api/auth.js';
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
  inputEl.setAttribute('maxlength', '10');
  inputEl.setAttribute('placeholder', '0000-00000');

  inputEl.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9);
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
  return /^\d{4}-\d{5}$/.test(value);
}

function isAdminRecovery(recoveryKeyRow) {
  return recoveryKeyRow?.dataset.accountType === 'admin';
}

function validateRecoveryIdentity({ idInput, lbcInput, gmailInput, recoveryKeyRow }) {
  let valid = true;
  const adminRecovery = isAdminRecovery(recoveryKeyRow);

  if (idInput && !validateId(idInput.value)) {
    idInput.setCustomValidity('Enter a complete ID No. in YYYY-NNNNN format.');
    valid = false;
  } else if (idInput) {
    idInput.setCustomValidity('');
  }

  if (!adminRecovery && lbcInput && !validateLbc(lbcInput.value)) {
    lbcInput.setCustomValidity('Enter a complete LBC No. in YYYY-NNNNN format.');
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

function setAdminRecoveryMode({ recoveryKeyRow, recoveryKeyInput, lbcInput }, enabled) {
  if (recoveryKeyRow) {
    recoveryKeyRow.style.display = enabled ? 'flex' : 'none';
    recoveryKeyRow.dataset.accountType = enabled ? 'admin' : 'student';
  }

  if (recoveryKeyInput) {
    recoveryKeyInput.required = enabled;
    if (!enabled) recoveryKeyInput.value = '';
  }

  if (lbcInput) {
    lbcInput.required = !enabled;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');
  const recoveryForm = document.getElementById('recoveryForm');
  const idInput = document.getElementById('id-input');
  const lbcInput = document.getElementById('lbc-input');
  const gmailInput = document.getElementById('recoveryGmail');
  const passwordInput = document.getElementById('recoveryPassword');
  const codeInput = document.getElementById('recoveryCode');
  const recoveryKeyRow = document.getElementById('recovery-key-row');
  const recoveryKeyInput = document.getElementById('recovery-key-input');
  const sendCodeButton = document.getElementById('send-recovery-code-btn');

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  applyIdFormat(idInput);
  applyLbcFormat(lbcInput);
  setAdminRecoveryMode({ recoveryKeyRow, recoveryKeyInput, lbcInput }, false);

  if (idInput) {
    idInput.addEventListener('input', () => {
      setAdminRecoveryMode({ recoveryKeyRow, recoveryKeyInput, lbcInput }, false);
    });
  }

  if (sendCodeButton) {
    sendCodeButton.addEventListener('click', async () => {
      if (!idInput?.value.trim() || !validateId(idInput.value)) {
        idInput?.setCustomValidity('Enter a complete ID No. in YYYY-NNNNN format.');
        recoveryForm?.reportValidity();
        return;
      }
      idInput.setCustomValidity('');

      sendCodeButton.disabled = true;
      sendCodeButton.textContent = 'Checking account...';

      try {
        const payload = buildIdentityPayload({ idInput, lbcInput, gmailInput });
        const account = await checkAccountType(payload.student_id);
        const adminRecovery = account.account_type === 'admin';
        setAdminRecoveryMode({ recoveryKeyRow, recoveryKeyInput, lbcInput }, adminRecovery);

        if (!validateRecoveryIdentity({ idInput, lbcInput, gmailInput, recoveryKeyRow })) {
          recoveryForm?.reportValidity();
          return;
        }

        sendCodeButton.textContent = 'Sending...';
        const result = adminRecovery
          ? await requestAdminRecoveryCode({ student_id: payload.student_id, lbc_no: payload.lbc_no, gmail: payload.gmail })
          : await requestRecoveryCode(payload);

        if (result.status === 'sent' || result.status === 'code_sent') {
          if (adminRecovery) {
            showNotification('Admin account detected. Gmail code sent; physical recovery key required.', 'info');
          } else {
            showNotification('Recovery code sent! Check your Gmail inbox.', 'success');
          }
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

      if (!validateRecoveryIdentity({ idInput, lbcInput, gmailInput, recoveryKeyRow })) {
        recoveryForm.reportValidity();
        return;
      }

      if (!recoveryForm.checkValidity()) {
        recoveryForm.reportValidity();
        return;
      }

      try {
        const adminRecovery = isAdminRecovery(recoveryKeyRow);
        const result = adminRecovery
          ? await verifyAdminRecoveryCode({
            student_id: idInput?.value.trim() || '',
            gmail_code: codeInput?.value.trim() || '',
            recovery_key: recoveryKeyInput?.value.trim() || '',
            new_password: passwordInput?.value || '',
          })
          : await verifyRecoveryCode({
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
