# 07 — Input-Process-Output Analysis

## Feature: Student Registration

| Component | Description |
|---|---|
| INPUT | Form fields: student ID, LBC, name, address, contact, password, course/year, Gmail, token. |
| PROCESS | Frontend validates/requests Gmail confirmation, then `register_student()` validates and inserts `students`. |
| OUTPUT | `students` row with `is_verified=1`; pending token deleted. |
| DATABASE AFFECTED | `students,pending_confirmations` |
| FILES INVOLVED | ✅ [VERIFIED FROM: scripts/main/registration.js; src/api/auth.py:752-869] |

## Feature: Gmail Email Confirmation

| Component | Description |
|---|---|
| INPUT | Gmail and name. |
| PROCESS | `create_confirmation_token_with_cooldown()` stores token and `send_confirmation_email()` sends link. |
| OUTPUT | Confirmation email and token status. |
| DATABASE AFFECTED | `pending_confirmations` |
| FILES INVOLVED | ✅ [VERIFIED FROM: app.py:291-318; src/api/auth.py:71-105] |

## Feature: Student Login

| Component | Description |
|---|---|
| INPUT | student_id,password |
| PROCESS | `login()` finds verified student, verifies bcrypt, sets student session. |
| OUTPUT | JSON redirect `/user/books`. |
| DATABASE AFFECTED | `students,security_logs,ip_token_buckets` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/auth.py:1950-2126] |

## Feature: Admin Login

| Component | Description |
|---|---|
| INPUT | admin_id,password |
| PROCESS | `login()` checks `admins` first, verifies bcrypt, sets admin session. |
| OUTPUT | JSON redirect `/admin/dashboard`. |
| DATABASE AFFECTED | `admins,security_logs,ip_token_buckets` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/auth.py:1950-2058] |

## Feature: Account Recovery (Student)

| Component | Description |
|---|---|
| INPUT | student_id,lbc_no,gmail,code,new_password |
| PROCESS | Request sends code; verify checks unused unexpired code and updates hash. |
| OUTPUT | Password updated. |
| DATABASE AFFECTED | `students,recovery_codes` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/auth.py:1023-1138] |

## Feature: Account Recovery (Admin)

| Component | Description |
|---|---|
| INPUT | admin ID, Gmail code, recovery key, new password |
| PROCESS | Window check, Gmail code, recovery-key bcrypt verification; updates password. |
| OUTPUT | Password updated or blocked. |
| DATABASE AFFECTED | `students,recovery_codes,security_logs` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/auth.py:1188-1403] |

## Feature: Book Search and Browse

| Component | Description |
|---|---|
| INPUT | status/category/sort/search/page/per_page |
| PROCESS | `get_books()` builds filters, status repair, due computation. |
| OUTPUT | Filtered JSON book list. |
| DATABASE AFFECTED | `books,categories,transactions` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/books.py:187-207] |

## Feature: Book Reservation

| Component | Description |
|---|---|
| INPUT | book_id, optional student_id |
| PROCESS | Prevents borrowed/due and duplicate reservation; inserts reserved transaction; queues; notifies. |
| OUTPUT | reserved JSON with transaction_id/queue_position. |
| DATABASE AFFECTED | `transactions,books,notifications,user_notifications,admin_notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:250-327] |

## Feature: Reservation Approval by Admin

| Component | Description |
|---|---|
| INPUT | book_id,student_id |
| PROCESS | Dashboard calls borrow endpoint; reserved transaction becomes borrowed. |
| OUTPUT | Borrowed JSON and notifications. |
| DATABASE AFFECTED | `transactions,books,user_notifications,admin_notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: scripts/admin/dashboard.js:18-27; src/api/transactions.py:359-440] |

## Feature: Book Borrowing Confirmation

| Component | Description |
|---|---|
| INPUT | book_id,student_id |
| PROCESS | `borrow_book()` computes due_at and inserts borrower/admin notifications. |
| OUTPUT | Borrowed state and SMS result. |
| DATABASE AFFECTED | `transactions,books,user_notifications,admin_notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:359-440] |

## Feature: Book Return

| Component | Description |
|---|---|
| INPUT | book_id |
| PROCESS | `return_book()` marks active borrowed/reserved records returned and syncs book status. |
| OUTPUT | returned JSON. |
| DATABASE AFFECTED | `transactions,books` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:443-452] |

## Feature: Force Return by Admin

| Component | Description |
|---|---|
| INPUT | book_id,notes |
| PROCESS | `force_return()` marks all active records force_returned with admin ID and notes. |
| OUTPUT | force_returned JSON. |
| DATABASE AFFECTED | `transactions,books` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:455-464] |

## Feature: Reservation Cancellation by Student

| Component | Description |
|---|---|
| INPUT | transaction_id |
| PROCESS | `cancel_reservation()` marks reserved active row cancelled, refreshes queue/status. |
| OUTPUT | cancelled/failed. |
| DATABASE AFFECTED | `transactions,books` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:538-552] |

## Feature: Bulk Book Import (CSV/XLSX)

| Component | Description |
|---|---|
| INPUT | multipart file or raw_input, mode |
| PROCESS | Analyze validates headers and previews; commit inserts/updates/skips. |
| OUTPUT | Counts/preview. |
| DATABASE AFFECTED | `books,categories` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/books.py:271-355] |

## Feature: Google Sheets Sync

| Component | Description |
|---|---|
| INPUT | sheet_url |
| PROCESS | Fetches CSV export, validates Book No/Title, inserts/updates available books. |
| OUTPUT | Inserted/updated/skipped counts; sync notification. |
| DATABASE AFFECTED | `books,notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/sheets.py:19-85] |

## Feature: Add/Delete Book

| Component | Description |
|---|---|
| INPUT | book_no,title,author,category,status or id |
| PROCESS | CRUD handlers insert/update/soft-delete/restore. |
| OUTPUT | Book JSON or pending_delete/restored. |
| DATABASE AFFECTED | `books,admin_rules` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/books.py:208-270] |

## Feature: Add/Delete Category

| Component | Description |
|---|---|
| INPUT | name or id |
| PROCESS | CRUD handlers insert/soft-delete/restore categories. |
| OUTPUT | Category JSON or pending_delete/restored. |
| DATABASE AFFECTED | `categories,admin_rules` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/books.py:147-185] |

## Feature: Admin Registration (by existing admin)

| Component | Description |
|---|---|
| INPUT | admin fields |
| PROCESS | Frontend sends admin confirmation; backend creates unverified admin/token and email. |
| OUTPUT | Email sent; token polled; setup code path. |
| DATABASE AFFECTED | `admins,pending_confirmations` |
| FILES INVOLVED | ✅ [VERIFIED FROM: scripts/admin/users.js:340-451; src/api/auth.py:1812-1930] |

## Feature: Admin Account Deletion (double confirmation flow)

| Component | Description |
|---|---|
| INPUT | target_id, email confirmation id, code |
| PROCESS | Request email; target confirms link; requester receives code notification; finalize soft-deletes admin. |
| OUTPUT | Admin deleted and email confirmation sent. |
| DATABASE AFFECTED | `admins,deletion_codes,notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/admin.py:349-523] |

## Feature: Student Account Deletion

| Component | Description |
|---|---|
| INPUT | student_id |
| PROCESS | Admin soft-deletes student and emails student. |
| OUTPUT | deleted JSON. |
| DATABASE AFFECTED | `students,security_logs` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/users.py:252-309] |

## Feature: Notification Generation and Delivery

| Component | Description |
|---|---|
| INPUT | events |
| PROCESS | Inserts generic/user/admin notifications and optionally sends SMS/email. |
| OUTPUT | Bell/user list notification. |
| DATABASE AFFECTED | `notifications,user_notifications,admin_notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/transactions.py:207-238; src/core/notifications.py:29-88] |

## Feature: Digital Library Card Generation

| Component | Description |
|---|---|
| INPUT | session student_id |
| PROCESS | `get_user_card()` returns student and transaction summary; JS renders card. |
| OUTPUT | Card/profile JSON and DOM card. |
| DATABASE AFFECTED | `students,transactions,books` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/users.py:403-510; scripts/user/account.js:132-171] |

## Feature: Binary Security Strip Generation

| Component | Description |
|---|---|
| INPUT | student ID, issue date, generation number |
| PROCESS | JS creates binary identity/fingerprint strings. |
| OUTPUT | Binary strips in card DOM. |
| DATABASE AFFECTED | `none` |
| FILES INVOLVED | ✅ [VERIFIED FROM: scripts/user/account.js:1-47] |

## Feature: Server Health Check

| Component | Description |
|---|---|
| INPUT | none |
| PROCESS | DB SELECT 1, psutil CPU/memory/disk, LBAS counts. |
| OUTPUT | health JSON 200/503. |
| DATABASE AFFECTED | `books,transactions,notifications` |
| FILES INVOLVED | ✅ [VERIFIED FROM: app.py:205-234] |

## Feature: Security Log Recording

| Component | Description |
|---|---|
| INPUT | mutating authenticated API request |
| PROCESS | before_request hook calls `log_security_event()`. |
| OUTPUT | security_logs row. |
| DATABASE AFFECTED | `security_logs` |
| FILES INVOLVED | ✅ [VERIFIED FROM: app.py:268-287; src/api/auth.py:1147-1186] |

## Feature: Admin Rule Configuration

| Component | Description |
|---|---|
| INPUT | return/expiry/delete/nearest-day fields |
| PROCESS | `save_rules()` upserts rules; transaction/book code reads them. |
| OUTPUT | saved rules used in future transactions/deletes. |
| DATABASE AFFECTED | `admin_rules` |
| FILES INVOLVED | ✅ [VERIFIED FROM: src/api/admin.py:174-239; src/api/transactions.py:130-163] |
