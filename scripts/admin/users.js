document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('adminRegisterModal');
  const openBtn = document.getElementById('openAddAdminModal');
  const closeBtn = document.getElementById('closeAddAdminModal');
  const cancelBtn = document.getElementById('cancelAddAdmin');
  const form = document.getElementById('adminRegistrationForm');

  const openModal = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    setTimeout(() => {
      submitBtn.textContent = 'Registered!';
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.reset();
        closeModal();
      }, 700);
    }, 900);
  });
});
