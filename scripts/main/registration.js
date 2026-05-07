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
  const registrationForm = document.getElementById('registrationForm');
  const courseSelect = document.getElementById('course-select');
  const idInput = document.getElementById('id-input');
  const lbcInput = document.getElementById('lbc-input');

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

  applyIdFormat(idInput);
  applyLbcFormat(lbcInput);
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
        lbcInput.setCustomValidity('Enter an LBC No. with 4 digits, a hyphen, and at least 1 digit after it.');
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
