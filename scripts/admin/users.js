document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('adminRegisterModal');
  const openBtn = document.getElementById('openAddAdminModal');
  const closeBtn = document.getElementById('closeAddAdminModal');
  const cancelBtn = document.getElementById('cancelAddAdmin');
  const form = document.getElementById('adminRegistrationForm');

  const openModal = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    form?.querySelector('input, select')?.focus();
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

  document.querySelectorAll('.pass-toggle').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const targetId = toggleBtn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      toggleBtn.textContent = hidden ? 'Hide' : 'Show';
    });
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
        document.querySelectorAll('.pass-toggle').forEach((btn) => {
          btn.textContent = 'Show';
        });
        closeModal();
      }, 700);
    }, 900);
  });
});
