document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  document.body.addEventListener('click', () => {
    window.location.href = '/main/sign_in';
  });
});
