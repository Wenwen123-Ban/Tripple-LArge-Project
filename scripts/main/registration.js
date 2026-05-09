import { sendConfirmationEmail, checkConfirmationToken, saveStudentRegistration } from '../../services/api/auth.js';
import { showNotification } from '../shared/notification.js';

const COLLEGE_YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

const HS_LEVELS = [
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
];

// Backend endpoints needed:
// GET /api/courses — returns the admin-managed list of available courses.
// PATCH /api/users/:id/lbc — lets admins assign or update a student's LBC number.
async function loadCourses() {
  try {
    const res = await fetch('/api/courses');

    if (!res.ok) {
      throw new Error(`Course request failed with status ${res.status}`);
    }

    const courses = await res.json();
    const select = document.getElementById('course-select');

    if (!select || !Array.isArray(courses)) return;

    courses.forEach((course) => {
      const opt = document.createElement('option');
      opt.value = course.id;
      opt.textContent = course.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load courses:', err);
  }
}

function updateYearOptions(isHighSchool) {
  const yearSelect = document.getElementById('year-select');
  if (!yearSelect) return;

  yearSelect.innerHTML = '<option value="">Year</option>';
  const options = isHighSchool ? HS_LEVELS : COLLEGE_YEARS;

  options.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    yearSelect.appendChild(opt);
  });
}

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

function applyContactFormat(inputEl) {
  if (!inputEl) return;
  inputEl.setAttribute('maxlength', '11');
  inputEl.setAttribute('placeholder', '09XXXXXXXXX');
  inputEl.setAttribute('inputmode', 'numeric');
  inputEl.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.setCustomValidity('');
  });
}


let confirmationToken = null;
let pollInterval = null;
let pollTimeout = null;

function validateGmail(value) {
  return /^[^\s@]+@gmail\.com$/i.test(value);
}

function stopPolling() {
  if (pollInterval) clearInterval(pollInterval);
  if (pollTimeout) clearTimeout(pollTimeout);
  pollInterval = null;
  pollTimeout = null;
}

function startPolling(checkboxEl) {
  stopPolling();

  pollInterval = setInterval(async () => {
    if (!confirmationToken) return;

    try {
      const data = await checkConfirmationToken(confirmationToken);

      if (data.confirmed) {
        stopPolling();
        checkboxEl.checked = true;
        checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
        showNotification('Email confirmed! Saving registration...', 'success');
        await saveRegistration();
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 4000);

  pollTimeout = setTimeout(() => {
    stopPolling();
    if (!checkboxEl.checked) {
      confirmationToken = null;
      showNotification('Confirmation link expired. Please resend.', 'error');
    }
  }, 15 * 60 * 1000);
}


async function saveRegistration() {
  const getVal = (id, fallback = '') => document.getElementById(id)?.value?.trim?.() ?? fallback;
  const getRaw = (id, fallback = '') => document.getElementById(id)?.value ?? fallback;

  const payload = {
    student_id: getVal('id-input'),
    lbc_no: getVal('lbc-input'),
    full_name: getVal('name-input') || getVal('registrationName'),
    address: getVal('address-input') || getVal('registrationAddress'),
    contact_no: getVal('contact-input') || getVal('registrationContactNo'),
    password: getRaw('password-input') || getRaw('registrationPassword'),
    course: getRaw('course-select', 'N/A') || 'N/A',
    year_level: getRaw('year-select') || '',
    gmail: getVal('gmail-input') || getVal('registrationGmail'),
    token: confirmationToken,
  };

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.status === 'registered') {
      showNotification('Registration complete! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/main/sign_in';
      }, 2000);
    } else {
      showNotification(result.error || 'Registration failed.', 'error');
    }
  } catch (err) {
    showNotification('Could not save registration. Try again.', 'error');
  }
}

async function handleGmailConfirmation({ gmailInput, nameInput, checkboxEl, buttonEl }) {
  const gmail = gmailInput.value.trim();
  const name = nameInput.value.trim() || 'Student';

  if (!validateGmail(gmail)) {
    showNotification('Please enter a valid Gmail address.', 'error');
    gmailInput.focus();
    return;
  }

  buttonEl.disabled = true;
  buttonEl.textContent = 'Sending...';

  try {
    const data = await sendConfirmationEmail({ gmail, name });

    if (data.status === 'sent') {
      confirmationToken = data.token;
      checkboxEl.checked = false;
      showNotification('Confirmation email sent! Check your Gmail inbox.', 'success');
      startPolling(checkboxEl);
    } else {
      showNotification('Failed to send confirmation. Try again.', 'error');
    }
  } catch (err) {
    console.error('Failed to send confirmation:', err);
    showNotification(err.message || 'Failed to send confirmation. Try again.', 'error');
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = 'Confirm gmail';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');
  const registrationForm = document.getElementById('registrationForm');
  const courseSelect = document.getElementById('course-select');
  const idInput = document.getElementById('id-input');
  const lbcInput = document.getElementById('lbc-input');
  const contactInput = document.getElementById('contact-input') || document.getElementById('registrationContactNo');
  const nameInput = document.getElementById('registrationName');
  const gmailInput = document.getElementById('registrationGmail');
  const confirmationCheckbox = document.getElementById('registrationAgreement');
  const confirmGmailButton = document.getElementById('confirm-gmail-btn');

  const params = new URLSearchParams(window.location.search);
  if (params.get('confirmed') === '1') {
    const checkbox = document.getElementById('registrationAgreement');
    if (checkbox) {
      checkbox.checked = true;
    }
    showNotification('Email confirmation successful. You can continue registration.', 'success');
    window.history.replaceState({}, document.title, '/main/registration');
  }

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  if (courseSelect) {
    courseSelect.addEventListener('change', (e) => {
      const isHighSchool = e.target.value === 'NA';
      updateYearOptions(isHighSchool);
    });
  }

  if (confirmationCheckbox) {
    confirmationCheckbox.addEventListener('click', (event) => {
      if (!confirmationCheckbox.checked) return;
      event.preventDefault();
      showNotification('Please confirm your Gmail from the email link first.', 'info');
    });
  }

  if (confirmGmailButton && gmailInput && nameInput && confirmationCheckbox) {
    confirmGmailButton.addEventListener('click', () => {
      handleGmailConfirmation({
        gmailInput,
        nameInput,
        checkboxEl: confirmationCheckbox,
        buttonEl: confirmGmailButton,
      });
    });
  }

  applyIdFormat(idInput);
  applyLbcFormat(lbcInput);
  applyContactFormat(contactInput);
  updateYearOptions(true);
  loadCourses();

  if (registrationForm) {
    registrationForm.addEventListener('submit', (event) => {
      if (idInput && !validateId(idInput.value)) {
        idInput.setCustomValidity('Enter a complete ID No. in YYYY-NNNNN format.');
      } else if (idInput) {
        idInput.setCustomValidity('');
      }

      if (lbcInput && !validateLbc(lbcInput.value)) {
        lbcInput.setCustomValidity('Enter a complete LBC No. in YYYY-NNNNN format.');
      } else if (lbcInput) {
        lbcInput.setCustomValidity('');
      }

      if (!registrationForm.checkValidity()) {
        event.preventDefault();
        registrationForm.reportValidity();
      }
    });
  }
});
