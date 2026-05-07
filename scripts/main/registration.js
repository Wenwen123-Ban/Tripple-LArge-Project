document.addEventListener('DOMContentLoaded', () => {
  const schoolLink = document.querySelector('.school-link');

  if (schoolLink) {
    schoolLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }
});
