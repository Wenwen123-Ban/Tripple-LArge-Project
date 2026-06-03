# 14 — Chapter 4 Materials: Results and Discussion / System Implementation

## 14.1 Implemented Features Summary

See `_docs/12_feature_inventory.md`. The implemented features include registration, login, book/category management, reservation/borrow/return, admin/user management, notifications, digital card, health, and rules. ✅ [VERIFIED FROM: app.py:291-615]

## 14.2 Module-by-Module Results

| Module | What Was Built | How It Works | Output | Known Issues/Limitations |
|---|---|---|---|---|
| Auth | Email confirmation, registration, login, recovery. | Flask handlers validate data, bcrypt passwords, session keys. | JSON status/redirects and emails. | Admin recovery references `students.account_type='admin'` while current admin accounts are in `admins`, so behavior is schema-mismatched. |
| Books | CRUD, soft delete/restore, import. | MySQL rows are filtered, inserted, updated, soft-deleted, restored. | Book/category JSON. | Google Sheets sync not registered. |
| Transactions | Reserve, borrow, return, force return, cancel. | `transactions.action` represents lifecycle state. | Transaction JSON and notifications. | Admin approval is implemented as immediate borrowing, not a separate approved/pickup state. |
| Users | User/admin listings, delete, approve/reject/suspend/reset, courses, card. | Admin APIs query/update account tables; card API aggregates transactions. | JSON tables and card/profile JSON. | Fines hardcoded to zero. |
| Notifications | Generic, user, and admin notification tables plus SMS/email helpers. | Events insert rows; frontend polls/fetches and updates badge. | Bell badges, notification pages, SMS/email. | Student mark-all frontend route missing. |
| Security/Monitoring | Headers, logs, rate limits, health, metrics. | Middleware and helpers log, restrict, and report. | Logs, health JSON, Prometheus metrics. | Development defaults weaken production security if env is absent. |

## 14.3 Screen/Page Inventory

| Page | Route | Purpose | User Type | Screenshot Note |
|---|---|---|---|---|
| `welcome.html` | `/` | Landing page | Public | Static page served by Flask. |
| `sign_in.html` | `/main/sign_in` | Login page | Public | Uses `scripts/main/sign_in.js`. |
| `registration_form.html` | `/main/registration` | Student registration | Public | Uses `scripts/main/registration.js`. |
| `recovery_form.html` | `/main/recovery` | Account recovery | Public | Uses `scripts/main/recovery.js`. |
| `userBookdisplay.html` | `/user/books` | Student catalog | Student | Book browsing/reservation. |
| `userManagement.html` | `/user/manage` | Student transaction management | Student | Reservation/borrow management. |
| `userLibraryCard.html` | `/user/card` | Digital library card | Student | Printable card/binary strips. |
| `userNotification.html` | `/user/notifications` | Student notification list | Student | Notification filter/clear. |
| `adminDashboard.html` | `/admin/dashboard` | Admin dashboard | Admin | Stats/reservation approval. |
| `adminBookmanagement.html` | `/admin/books` | Book/category/import admin | Admin | Import/Google Sheets UI. |
| `adminusersManagement.html` | `/admin/users` | User/admin management | Admin | Admin registration/deletion. |
| `adminSecurityreports.html` | `/admin/reports`, `/admin/security` | Security reports | Admin | Logs/reports. |
| `manual.html` | `/admin/manual` | Admin manual | Admin | Static manual. |

✅ [VERIFIED FROM: app.py:400-542]

## 14.4 Database Implementation Result

The code defines at least 17 tables across bootstrap and dynamic helpers. See `_docs/04_database_analysis.md` and `_docs/05_data_dictionary.md`.

## 14.5 API Implementation Result

This audit documents 78 route entries, including direct Flask routes, registered API endpoints, compatibility aliases, health/metrics, and blueprint endpoints. ✅ [VERIFIED FROM: app.py:200-615; src/api/urls.py:9-14]

## 14.6 Notable Implementation Decisions

- Transaction lifecycle is encoded in `transactions.action`. ✅ [VERIFIED FROM: src/api/transactions.py:28-48]
- Book due status can be computed from active borrowed transaction due dates. ✅ [VERIFIED FROM: src/api/books.py:198-205]
- Digital card binary strips are generated in the browser from student identity data. ✅ [VERIFIED FROM: scripts/user/account.js:1-47]
- Admin deletion uses target email confirmation plus requester notification code. ✅ [VERIFIED FROM: src/api/admin.py:349-523]
- Admin rules control return deadlines, reservation expiry, nearest pickup day, and delete undo window. ✅ [VERIFIED FROM: src/api/admin.py:35-61; src/api/transactions.py:130-163; src/api/books.py:105-114]

## 14.7 Testing Evidence Preparation

| Feature | Test Input | Expected Output | Actual Result (leave blank) |
|---|---|---|---|
| Student Registration | Valid and invalid sample data for Student Registration. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Gmail Email Confirmation | Valid and invalid sample data for Gmail Email Confirmation. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Student Login | Valid and invalid sample data for Student Login. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Admin Login | Valid and invalid sample data for Admin Login. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Account Recovery (Student) | Valid and invalid sample data for Account Recovery (Student). | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Account Recovery (Admin) | Valid and invalid sample data for Account Recovery (Admin). | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Book Search and Browse | Valid and invalid sample data for Book Search and Browse. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Book Reservation | Valid and invalid sample data for Book Reservation. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Reservation Approval by Admin | Valid and invalid sample data for Reservation Approval by Admin. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Book Borrowing Confirmation | Valid and invalid sample data for Book Borrowing Confirmation. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Book Return | Valid and invalid sample data for Book Return. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Force Return by Admin | Valid and invalid sample data for Force Return by Admin. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Reservation Cancellation by Student | Valid and invalid sample data for Reservation Cancellation by Student. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Bulk Book Import (CSV/XLSX) | Valid and invalid sample data for Bulk Book Import (CSV/XLSX). | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Google Sheets Sync | Valid and invalid sample data for Google Sheets Sync. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Add/Delete Book | Valid and invalid sample data for Add/Delete Book. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Add/Delete Category | Valid and invalid sample data for Add/Delete Category. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Admin Registration (by existing admin) | Valid and invalid sample data for Admin Registration (by existing admin). | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Admin Account Deletion (double confirmation flow) | Valid and invalid sample data for Admin Account Deletion (double confirmation flow). | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Student Account Deletion | Valid and invalid sample data for Student Account Deletion. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Notification Generation and Delivery | Valid and invalid sample data for Notification Generation and Delivery. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Digital Library Card Generation | Valid and invalid sample data for Digital Library Card Generation. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Binary Security Strip Generation | Valid and invalid sample data for Binary Security Strip Generation. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Server Health Check | Valid and invalid sample data for Server Health Check. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Security Log Recording | Valid and invalid sample data for Security Log Recording. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
| Admin Rule Configuration | Valid and invalid sample data for Admin Rule Configuration. | Behavior described in `_docs/07_ipo_analysis.md`. |  |
