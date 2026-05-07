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
  return value === '' || /^\d{4}-\d+$/.test(value);
}

document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');
  const recoveryForm = document.getElementById('recoveryForm');
  const idInput = document.getElementById('id-input');
  const lbcInput = document.getElementById('lbc-input');

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  applyIdFormat(idInput);
  applyLbcFormat(lbcInput);

  if (recoveryForm) {
    recoveryForm.addEventListener('submit', (event) => {
      if (idInput && !validateId(idInput.value)) {
        idInput.setCustomValidity('Enter a complete ID No. in YYYY-NNNNN format.');
      } else if (idInput) {
        idInput.setCustomValidity('');
      }

      if (lbcInput && !validateLbc(lbcInput.value)) {
        lbcInput.setCustomValidity('Enter an LBC No. with 4 digits, a hyphen, and at least 1 digit after it.');
      } else if (lbcInput) {
        lbcInput.setCustomValidity('');
      }

      if (!recoveryForm.checkValidity()) {
        event.preventDefault();
        recoveryForm.reportValidity();
      }
    });
  }
});
