/**
 * Reserve.js - Click & Collect reservation workflow.
 * Opens a pickup-date prompt and posts reservations to /api/transaction/reserve.
 */
(function () {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  function getTomorrowIsoDate() {
    const date = new Date(Date.now() + ONE_DAY_MS);
    return date.toISOString().slice(0, 10);
  }

  function getMaxPickupIsoDate() {
    const date = new Date(Date.now() + (14 * ONE_DAY_MS));
    return date.toISOString().slice(0, 10);
  }

  function getStudentId() {
    try {
      const sessionUser = JSON.parse(localStorage.getItem('click_collect.current_user') || '{}');
      return window.currentStudentId
        || sessionStorage.getItem('student_id')
        || sessionUser?.student_id
        || sessionUser?.id
        || '';
    } catch (error) {
      return window.currentStudentId || sessionStorage.getItem('student_id') || '';
    }
  }

  function buildPickupDialog(book) {
    const dialog = document.createElement('dialog');
    dialog.className = 'reserve-dialog';
    const min = getTomorrowIsoDate();
    const max = getMaxPickupIsoDate();
    dialog.innerHTML = `
      <form method="dialog" class="reserve-dialog__panel">
        <button class="reserve-dialog__close" value="cancel" aria-label="Close reservation dialog">×</button>
        <p class="reserve-dialog__eyebrow">Click &amp; Collect</p>
        <h2>Reserve this book</h2>
        <p class="reserve-dialog__book">${book?.title || 'Selected book'}</p>
        <label class="reserve-dialog__field">
          <span>Pickup date</span>
          <input id="reserve-pickup-date" type="date" min="${min}" max="${max}" value="${min}" required>
        </label>
        <p class="reserve-dialog__hint">Reservations are queued by pickup date. The librarian will calculate the return date when the book is released.</p>
        <menu class="reserve-dialog__actions">
          <button value="cancel" class="reserve-dialog__secondary">Cancel</button>
          <button id="reserve-confirm-btn" value="default" class="reserve-dialog__primary">Confirm reservation</button>
        </menu>
      </form>
    `;
    document.body.appendChild(dialog);
    return dialog;
  }

  function promptPickupDate(book) {
    if (typeof HTMLDialogElement === 'undefined') {
      const fallback = window.prompt('Enter pickup date (YYYY-MM-DD):', getTomorrowIsoDate());
      return Promise.resolve(fallback);
    }

    const dialog = buildPickupDialog(book);
    const input = dialog.querySelector('#reserve-pickup-date');
    const confirmBtn = dialog.querySelector('#reserve-confirm-btn');

    return new Promise(resolve => {
      confirmBtn.addEventListener('click', event => {
        event.preventDefault();
        if (!input.reportValidity()) return;
        const value = input.value;
        dialog.close('confirm');
        resolve(value);
      });

      dialog.addEventListener('close', () => {
        if (dialog.returnValue !== 'confirm') resolve(null);
        dialog.remove();
      }, { once: true });

      dialog.showModal();
      input.focus();
    });
  }

  async function postReservation(bookId, pickupDate) {
    const studentId = getStudentId();
    const payload = { book_id: bookId, pickup_date: pickupDate };
    if (studentId) payload.student_id = studentId;

    const response = await fetch('/api/transaction/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Failed to reserve book. Please try again.');
    }

    return result;
  }

  async function reserveBook(bookId, book = {}) {
    if (!bookId) {
      alert('Book information is missing. Please refresh and try again.');
      return;
    }

    const pickupDate = await promptPickupDate(book);
    if (!pickupDate) return;

    try {
      const result = await postReservation(bookId, pickupDate);
      const queueText = result.queue_position ? ` Queue position: ${result.queue_position}.` : '';
      const returnText = result.expected_return_at ? ` Expected return: ${result.expected_return_at}.` : '';
      alert(`Reservation submitted for ${pickupDate}.${queueText}${returnText}`);

      if (typeof window.loadBooks === 'function') {
        window.loadBooks(true);
      }
    } catch (error) {
      console.error('Error reserving book:', error);
      alert(error.message || 'An error occurred while reserving the book.');
    }
  }

  window.reserveBook = reserveBook;
  window.postReservation = postReservation;
})();
