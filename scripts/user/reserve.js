/**
 * Reserve.js - Click & Collect reservation workflow.
 * Auto-selects the next pickup day and posts reservations to /api/transaction/reserve.
 */
(function () {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  function getTomorrowIsoDate() {
    const date = new Date(Date.now() + ONE_DAY_MS);
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

    const pickupDate = getTomorrowIsoDate();

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
