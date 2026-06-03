# 01 — System Overview

## 1.1 Project Identity

| Item | Verified Documentation |
|---|---|
| Official system name | ✅ [VERIFIED FROM: app.py:617-618] `Click & Collect` is printed when the Flask development server starts, and this audit uses the requested full name: **Click & Collect — Library Borrowing and Assistance System (LBAS)**. |
| Institution | ✅ [VERIFIED FROM: public/pages/user/help.html:167-168] The help page names **North Western Mindanao State College of Science and Technology** as the support/library institution. |
| Version | ⚠️ [INFERRED] No `package.json`, version constant, git tag file, or Python package metadata with an application version was found in the analyzed file list. `requirements.txt` constrains dependencies but does not identify an application version. |
| System type | ✅ [VERIFIED FROM: app.py:36-40, app.py:400-542] A Flask web application serves HTML pages and static assets, so it is web-based. |
| Target users | ✅ [VERIFIED FROM: app.py:400-542, app.py:563-615] Main public pages, student pages, admin pages, student APIs, and admin APIs identify Students and Admin/Librarians as primary users. |

## 1.2 Purpose and Scope

✅ [VERIFIED FROM: src/api/books.py:187-270; src/api/transactions.py:250-554; src/api/users.py:145-557] The system implements a library web portal for catalog browsing, reservation, librarian/admin borrowing actions, returns, student/admin account management, digital library card viewing, and notifications.

### Implemented Scope

| Scope Area | Status | Evidence |
|---|---:|---|
| Student registration with Gmail confirmation | ✅ COMPLETE | `register_student()` requires a confirmed token before inserting into `students`. ✅ [VERIFIED FROM: src/api/auth.py:752-869] |
| Login/role redirect | ✅ COMPLETE | `login()` checks `admins` first, then `students`, sets role-specific session keys, and returns `/admin/dashboard` or `/user/books`. ✅ [VERIFIED FROM: src/api/auth.py:1950-2126] |
| Book/category CRUD | ✅ COMPLETE | `get_books`, `add_book`, `update_book`, `delete_book`, restore and category handlers exist. ✅ [VERIFIED FROM: src/api/books.py:147-270] |
| Reservation lifecycle | ✅ COMPLETE/PARTIAL | Reservation, borrow, return, force-return, cancel, queue refresh, status sync exist; admin approval is implemented as converting reserved transaction to borrowed. ✅ [VERIFIED FROM: src/api/transactions.py:250-554] |
| Google Sheets sync | 🔶 PARTIAL | `sync_sheet()` exists but no route registration was found in `app.py`; frontend calls `/api/sheets/sync`. ✅ [VERIFIED FROM: src/api/sheets.py:33-85; scripts/admin/books.js:84] |
| Digital card | ✅ COMPLETE | Student card/profile JSON and frontend binary rendering exist. ✅ [VERIFIED FROM: src/api/users.py:403-510; scripts/user/account.js:1-47] |
| Security logging | ✅ COMPLETE | Auth events and authenticated mutating API actions call `log_security_event`. ✅ [VERIFIED FROM: app.py:268-287; src/api/auth.py:1147-1186] |
| Testing/bootstrap | ✅ COMPLETE | `/api/testing/bootstrap` initializes schema and seeds demo data behind a header key. ✅ [VERIFIED FROM: app.py:523-531] |

## 1.3 System Modules

| Module | Responsibility | Primary Files | Tables Interacted With | Routes |
|---|---|---|---|---|
| Authentication Module | Registration, Gmail confirmation, login/logout, recovery, admin setup code. | `src/api/auth.py`, `src/core/security.py`, `scripts/main/registration.js`, `scripts/main/sign_in.js`, `scripts/main/recovery.js` | `students`, `admins`, `pending_confirmations`, `recovery_codes`, `security_logs`, `ip_token_buckets` | `/api/auth/*` ✅ [VERIFIED FROM: app.py:291-365] |
| Book Management Module | CRUD for books/categories, soft-delete restore window, import preview/commit, status repair. | `src/api/books.py`, `scripts/admin/books.js` | `books`, `categories`, `admin_rules`, `transactions` | `/api/books*`, `/api/categories*` ✅ [VERIFIED FROM: app.py:549-560, app.py:605-606] |
| Reservation Module | Student reservation creation, duplicate prevention, queue position, admin notifications. | `src/api/transactions.py`, `scripts/user/reserve.js`, `scripts/admin/dashboard.js` | `transactions`, `books`, `notifications`, `user_notifications`, `admin_notifications`, `students`, `admins` | `/api/transactions/reserve`, `/api/reserve`, `/api/transaction/reserve` ✅ [VERIFIED FROM: app.py:596-598] |
| Borrowing and Return Module | Convert reserved records to borrowed, set due dates, return/force-return records, update book status. | `src/api/transactions.py`, `scripts/admin/dashboard.js`, `scripts/admin/books.js` | `transactions`, `books`, `admin_rules`, `user_notifications`, `admin_notifications` | `/api/transactions/borrow`, `/api/transactions/return`, `/api/transactions/force-return` ✅ [VERIFIED FROM: app.py:599-601] |
| User Management Module | List/update/delete students/admins, pending approval, suspend/reject/reset borrow, course CRUD. | `src/api/users.py`, `scripts/admin/users.js` | `students`, `admins`, `courses`, `transactions`, `books`, `security_logs` | `/api/users*`, `/api/courses*` ✅ [VERIFIED FROM: app.py:563-573] |
| Admin Dashboard Module | Dashboard statistics, pending reservations and active borrows, top books. | `src/api/admin.py`, `scripts/admin/dashboard.js` | `books`, `students`, `transactions`, `categories` | `/api/admin/dashboard-stats` ✅ [VERIFIED FROM: app.py:607] |
| Notification Module | In-app admin/student notifications, SMS ready/overdue alerts, email notices. | `src/core/notifications.py`, `src/api/transactions.py`, `src/api/admin.py`, `src/api/users.py`, `scripts/admin/shared_init.js`, `scripts/user/notifications.js` | `notifications`, `user_notifications`, `admin_notifications`, `transactions`, `students` | `/api/user/notifications*`, `/api/admin/notifications*`, `/api/notifications/overdue/run` ✅ [VERIFIED FROM: app.py:583-590, app.py:604, app.py:613-615] |
| Digital Library Card Module | Returns profile/card data and renders printable card fields with binary strips. | `src/api/users.py`, `scripts/user/account.js`, `public/pages/user/userLibraryCard.html` | `students`, `transactions`, `books` | `/api/user/card`, `/api/users/profile` ✅ [VERIFIED FROM: app.py:611-612] |
| Security and Logging Module | Security headers, IP whitelist, rate limits, security events, admin reports/log clearing. | `app.py`, `src/api/auth.py`, `src/api/admin.py`, `src/core/rate_limit_service.py`, `src/core/security.py` | `security_logs`, `ip_token_buckets`, `system_load_snapshots` | `/api/admin/reports`, `/api/admin/logs`, mutating `/api/*` audit hook ✅ [VERIFIED FROM: app.py:115-153, app.py:268-287, app.py:374-380] |
| Rule Configuration Module | Return deadlines, reservation expiry, nearest-day rule, book delete grace window. | `src/api/admin.py`, `src/api/transactions.py`, `src/api/books.py` | `admin_rules`, `transactions`, `books`, `categories` | `/api/admin/rules` ✅ [VERIFIED FROM: app.py:575-576] |
