/**
 * Reserve.js - Book Reservation Functionality
 * Handles the book reservation process
 */

/**
 * Reserves a book for the current student
 * @param {number} bookId - ID of the book to reserve
 */
async function reserveBook(bookId) {
  try {
    // Get student ID from window variable or session storage
    const studentId = window.currentStudentId || 
                     sessionStorage.getItem('student_id') || '';
    
    if (!studentId) {
      alert('Student ID not found. Please log in again.');
      return;
    }
    
    // Make reservation request
    const response = await fetch('/api/transactions/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: bookId,
        student_id: studentId
      })
    });
    
    const result = await response.json();
    
    // Handle response
    if (result.status === 'reserved') {
      alert('Book reserved successfully!');
      
      // Refresh book list if function exists
      if (typeof window.loadBooks === 'function') {
        window.loadBooks(true);
      }
    } else {
      alert(result.error || 'Failed to reserve book. Please try again.');
    }
  } catch (error) {
    console.error('Error reserving book:', error);
    alert('An error occurred while reserving the book.');
  }
}
