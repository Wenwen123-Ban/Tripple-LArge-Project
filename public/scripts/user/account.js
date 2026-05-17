/**
 * Account Page - Digital Library Card & Account Management
 * Handles UI interactions and data display for user account page
 */

// NMSCST in 8-bit ASCII binary (security strip)
const INSTITUTION_BINARY = [
  '01001110',  // N
  '01001101',  // M
  '01010011',  // S
  '01000011',  // C
  '01010011',  // S
  '01010100'   // T
];

/**
 * Generate identity-linked binary for card top strip
 * Encodes: first 4 digits (year) + last 5 digits (entry) + account generation number
 * Example: Student ID "2026-00001", Gen# 1 → "202600001" + "1" → binary string
 */
function generateIdentityBinary(studentId, generationNumber = 1) {
  // Extract year (first 4 digits) and entry (last 5 digits)
  // Assuming format like "2026-00001"
  const cleanId = studentId.replace(/[^0-9]/g, ''); // Remove non-digits
  const year = cleanId.substring(0, 4) || '2026';
  const entry = cleanId.substring(cleanId.length - 5) || '00001';
  
  // Combine: year + entry + generation
  const combined = year + entry + generationNumber;
  
  // Convert to binary
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    const num = parseInt(combined[i]);
    binary += num.toString(2).padStart(4, '0'); // 4-bit binary per digit
  }
  
  // Add spacing for readability (8 bits per group)
  let spacedBinary = '';
  for (let i = 0; i < binary.length; i += 8) {
    if (i > 0) spacedBinary += ' ';
    spacedBinary += binary.substring(i, i + 8);
  }
  
  return spacedBinary;
}

/**
 * Generate institution-linked binary (always NMSCST)
 * Returns formatted 8-bit ASCII binary for each letter
 */
function generateInstitutionBinary() {
  return INSTITUTION_BINARY.map(b => b).join('\n');
}

/**
 * Initialize binary decorations on the library card
 * @param {string} studentId - Student ID for identity-linked binary
 * @param {number} generationNumber - Account generation number
 */
function initializeBinaryDecorations(studentId = 'XXXX-XXXXX', generationNumber = 1) {
  const binaryTop = document.getElementById('binary-top');
  const binaryLeft = document.getElementById('binary-left');
  
  if (binaryTop) {
    binaryTop.textContent = generateIdentityBinary(studentId, generationNumber);
    binaryTop.title = `Identity encoded: ${studentId} | Gen: ${generationNumber}`;
  }
  
  if (binaryLeft) {
    binaryLeft.textContent = generateInstitutionBinary();
    binaryLeft.title = 'Institution code: NMSCST';
  }
}

// Initialize stat cards with placeholder data
function initializeStats() {
  // These will be replaced with actual API data
  const stats = {
    borrowed: document.getElementById('stat-borrowed'),
    reserved: document.getElementById('stat-reserved'),
    due: document.getElementById('stat-due'),
    overdue: document.getElementById('stat-overdue')
  };

  if (stats.borrowed) stats.borrowed.textContent = '0';
  if (stats.reserved) stats.reserved.textContent = '0';
  if (stats.due) stats.due.textContent = '0';
  if (stats.overdue) stats.overdue.textContent = '0';
}

// Initialize account info fields (currently disabled)
function initializeAccountFields() {
  const fields = {
    email: document.getElementById('email-field'),
    phone: document.getElementById('phone-field'),
    department: document.getElementById('department-field'),
    yearLevel: document.getElementById('year-level-field'),
    address: document.getElementById('address-field')
  };

  // Set all fields to disabled initially
  Object.values(fields).forEach(field => {
    if (field) field.disabled = true;
  });
}

// Toggle edit mode for account information
function setupEditButton() {
  const editBtn = document.getElementById('edit-account-btn');
  if (!editBtn) return;

  let isEditMode = false;

  editBtn.addEventListener('click', function() {
    isEditMode = !isEditMode;
    toggleEditMode(isEditMode);
  });
}

// Toggle edit mode for all account fields
function toggleEditMode(enabled) {
  const fields = {
    email: document.getElementById('email-field'),
    phone: document.getElementById('phone-field'),
    department: document.getElementById('department-field'),
    yearLevel: document.getElementById('year-level-field'),
    address: document.getElementById('address-field')
  };

  Object.values(fields).forEach(field => {
    if (field) {
      field.disabled = !enabled;
      if (enabled) {
        field.style.background = '#fff';
        field.style.cursor = 'text';
      } else {
        field.style.background = '#f0f4f9';
        field.style.cursor = 'not-allowed';
      }
    }
  });

  const editBtn = document.getElementById('edit-account-btn');
  if (editBtn) {
    editBtn.textContent = enabled ? '💾' : '✏️';
    editBtn.title = enabled ? 'Save Changes' : 'Edit Account';
  }
}

// Format transaction date
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Display transactions in the transaction list
function displayTransactions(transactions = []) {
  const transactionList = document.getElementById('transaction-list');
  if (!transactionList) return;

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
        No transactions yet
      </div>
    `;
    return;
  }

  const html = transactions.map(tx => `
    <div class="transaction-row">
      <span>${formatDate(tx.dateBorrowed)}</span>
      <span>${tx.bookNo || '—'}</span>
      <span>${tx.accessionNo || '—'}</span>
      <span>${formatDate(tx.dateReturned)}</span>
    </div>
  `).join('');

  transactionList.innerHTML = html;
}

// Populate card information
function populateCardInfo(cardData = {}) {
  const cardFields = {
    'c-name': cardData.name || '—',
    'c-id': cardData.id || '—',
    'c-lbc': cardData.lbc || '—',
    'c-course': cardData.course || '—',
    'c-year': cardData.year || '—',
    'c-verified': cardData.verified || '—',
    'c-issued': cardData.issued || '—'
  };

  Object.entries(cardFields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });

  // Update binary encoding if we have student ID
  if (cardData.id) {
    initializeBinaryDecorations(cardData.id, cardData.generationNumber || 1);
  }
}

// Populate account information (placeholder)
function populateAccountInfo(accountData = {}) {
  const fields = {
    'email-field': accountData.email,
    'phone-field': accountData.phone,
    'department-field': accountData.department,
    'year-level-field': accountData.yearLevel,
    'address-field': accountData.address
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) {
      element.value = value;
    }
  });
}

// Populate account status info
function populateStatusInfo(statusData = {}) {
  const statusFields = {
    'member-since': statusData.memberSince ? formatDate(statusData.memberSince) : '—',
    'last-login': statusData.lastLogin ? formatDate(statusData.lastLogin) : '—',
    'fines-status': statusData.fines ? `₱${statusData.fines.toFixed(2)}` : '₱0.00'
  };

  Object.entries(statusFields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  initializeStats();
  initializeAccountFields();
  setupEditButton();

  // Initialize with default placeholder binary encoding
  // This will be replaced with actual student data from API
  initializeBinaryDecorations('2026-00001', 1);

  // TODO: Connect to actual API endpoints to fetch:
  // - Card information (includes student ID, generation number)
  // - Account information
  // - Account status
  // - Recent transactions
  
  // Example of how it will be used:
  // const cardData = {
  //   name: 'John Doe',
  //   id: '2026-00001',
  //   generationNumber: 1,
  //   lbc: 'LBC123456',
  //   course: 'BS Computer Science',
  //   year: '3rd Year',
  //   verified: 'Active',
  //   issued: '2026-01-15'
  // };
  // populateCardInfo(cardData);
});
