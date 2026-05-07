document.addEventListener('DOMContentLoaded', () => {
  const idInputs = document.querySelectorAll('.js-id-no');
  const lbcInputs = document.querySelectorAll('.js-lbc-no');

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

  lbcInputs.forEach((inputEl) => {
    inputEl.setAttribute('maxlength', '14');
    inputEl.setAttribute('placeholder', '0000-00000');
    inputEl.setAttribute('inputmode', 'numeric');
    inputEl.setAttribute('autocomplete', 'off');
    inputEl.setAttribute('spellcheck', 'false');

    inputEl.addEventListener('input', (event) => {
      let val = event.target.value.replace(/\D/g, '');
      if (val.length > 13) val = val.slice(0, 13);
      if (val.length > 4) {
        event.target.value = val.slice(0, 4) + '-' + val.slice(4);
      } else {
        event.target.value = val;
      }

      if (event.target.value.length === 0 || /^\d{4}-\d{1,9}$/.test(event.target.value)) {
        event.target.setCustomValidity('');
      } else {
        event.target.setCustomValidity('Enter an LBC No. with 4 digits, a hyphen, and at least 1 digit after it.');
      }
    });
  });
});
