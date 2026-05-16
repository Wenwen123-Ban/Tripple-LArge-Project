/**
 * Account.js - Digital Library Card Management
 * Handles rendering of the user's digital library card and transaction history
 */

/**
 * Converts text to binary representation
 * @param {string} text - Text to convert
 * @returns {string} Space-separated binary string
 */
function textToBinary(text) {
  return text
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

/**
 * Generates binary representation from student ID and generation number
 * @param {string} studentId - Student ID
 * @param {number} genNo - Generation number
 * @returns {string} Binary string representation
 */
function generateCardBinary(studentId, genNo) {
  const combined = (studentId || '').replace('-', '') + String(genNo || 0);
  const numericValue = parseInt(combined.replace(/\D/g, ''), 10);
  return Number.isFinite(numericValue) ? numericValue.toString(2) : '0';
}

/**
 * Renders binary decoration on the card
 * @param {string} studentId - Student ID
 * @param {number} genNo - Generation number
 */
function renderBinary(studentId, genNo) {
  const binaryLeft = document.getElementById('binary-left');
  const binaryTop = document.getElementById('binary-top');
  
  if (binaryLeft) {
    binaryLeft.textContent = textToBinary('NMSCST').replace(/ /g, '\n');
  }
  
  if (binaryTop) {
    binaryTop.textContent = generateCardBinary(studentId, genNo);
  }
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {*} value - Value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(value) {
  const text = String(value ?? '');
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Initializes and loads the digital library card
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/user/card');
    const data = await response.json();
    
    // Map of element IDs to user data fields
    const fieldMapping = {
      'c-name': data.full_name,
      'c-id': data.student_id,
      'c-lbc': data.lbc_no,
      'c-course': data.course || 'N/A',
      'c-year': data.year_level || 'N/A',
      'c-verified': data.verified_at || '—',
      'c-issued': data.issued_at || '—'
    };
    
    // Populate card fields
    for (const [elementId, value] of Object.entries(fieldMapping)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value || '—';
      }
    }
    
    // Render binary decorations
    renderBinary(data.student_id, data.account_gen_no || 0);
    
    // Load transaction history if available
    if (data.transactions) {
      loadTransactionHistory(data.transactions);
    }
  } catch (error) {
    console.error('Error loading card data:', error);
  }
});

/**
 * Loads and displays transaction history
 * @param {Array} transactions - Array of transaction objects
 */
function loadTransactionHistory(transactions) {
  const transactionList = document.getElementById('transaction-list');
  if (!transactionList) return;
  
  if (!transactions || transactions.length === 0) {
    transactionList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No transactions.</div>';
    return;
  }
  
  const rows = transactions.map(tx => `
    <div class="transaction-row">
      <span>${escapeHtml(tx.date_borrowed || '—')}</span>
      <span>${escapeHtml(tx.book_no || '—')}</span>
      <span>${escapeHtml(tx.accession_no || '—')}</span>
      <span>${escapeHtml(tx.date_returned || '—')}</span>
    </div>
  `).join('');
  
  transactionList.innerHTML = rows;
}
