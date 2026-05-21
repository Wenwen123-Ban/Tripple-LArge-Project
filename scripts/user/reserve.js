/**
 * Reserve.js - Click & Collect reservation workflow.
 * Posts reservations to /api/transaction/reserve for admin approval.
 */
(function () {
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


  async function postReservation(bookId) {
    const studentId = getStudentId();
    const payload = { book_id: bookId };
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

    try {
      const result = await postReservation(bookId);
      const queueText = result.queue_position ? ` Queue position: ${result.queue_position}.` : '';
      alert(`Reservation submitted and awaiting admin approval.${queueText}`);

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
