# 13 — Chapter 3 Materials: Research Methodology / System Design

## 13.1 System Architecture

✅ [VERIFIED FROM: app.py:36-40, app.py:400-615] LBAS uses a client-server web architecture. The presentation layer is HTML/CSS/JavaScript under `public/`, `scripts/`, and `services/`. The logic layer is Flask route/middleware/API code in `app.py` and `src/api/`. The data layer is MySQL through `src/core/db.py` and schema DDL in `src/core/models.py`.

## 13.2 System Development Approach

⚠️ [INFERRED] The repository suggests an iterative/prototype approach: dynamic `_ensure_*` helpers add missing columns/tables during handler execution, and compatibility routes duplicate endpoints for legacy paths. Evidence includes dynamic `ALTER TABLE` helpers in `src/api/books.py`, `src/api/transactions.py`, `src/api/users.py`, and route compatibility in `src/api/transaction.py`.

## 13.3 Functional Requirements

- FR-01: The system shall support student registration as evidenced by scripts/main/registration.js; src/api/auth.py:752-869.
- FR-02: The system shall support gmail email confirmation as evidenced by app.py:291-318; src/api/auth.py:71-105.
- FR-03: The system shall support student login as evidenced by src/api/auth.py:1950-2126.
- FR-04: The system shall support admin login as evidenced by src/api/auth.py:1950-2058.
- FR-05: The system shall support account recovery (student) as evidenced by src/api/auth.py:1023-1138.
- FR-07: The system shall support book search and browse as evidenced by src/api/books.py:187-207.
- FR-08: The system shall support book reservation as evidenced by src/api/transactions.py:250-327.
- FR-10: The system shall support book borrowing confirmation as evidenced by src/api/transactions.py:359-440.
- FR-11: The system shall support book return as evidenced by src/api/transactions.py:443-452.
- FR-12: The system shall support force return by admin as evidenced by src/api/transactions.py:455-464.
- FR-13: The system shall support reservation cancellation by student as evidenced by src/api/transactions.py:538-552.
- FR-14: The system shall support bulk book import (csv/xlsx) as evidenced by src/api/books.py:271-355.
- FR-16: The system shall support add/delete book as evidenced by src/api/books.py:208-270.
- FR-17: The system shall support add/delete category as evidenced by src/api/books.py:147-185.
- FR-18: The system shall support admin registration (by existing admin) as evidenced by scripts/admin/users.js:340-451; src/api/auth.py:1812-1930.
- FR-19: The system shall support admin account deletion (double confirmation flow) as evidenced by src/api/admin.py:349-523.
- FR-20: The system shall support student account deletion as evidenced by src/api/users.py:252-309.
- FR-21: The system shall support notification generation and delivery as evidenced by src/api/transactions.py:207-238; src/core/notifications.py:29-88.
- FR-22: The system shall support digital library card generation as evidenced by src/api/users.py:403-510; scripts/user/account.js:132-171.
- FR-23: The system shall support binary security strip generation as evidenced by scripts/user/account.js:1-47.
- FR-24: The system shall support server health check as evidenced by app.py:205-234.
- FR-25: The system shall support security log recording as evidenced by app.py:268-287; src/api/auth.py:1147-1186.
- FR-26: The system shall support admin rule configuration as evidenced by src/api/admin.py:174-239; src/api/transactions.py:130-163.

## 13.4 Non-Functional Requirements

- NFR-01: The system shall hash stored passwords using bcrypt. ✅ [VERIFIED FROM: src/core/security.py:4-16]
- NFR-02: The system shall close MySQL connections after Flask request context teardown. ✅ [VERIFIED FROM: src/core/db.py:18-22; app.py:73]
- NFR-03: The system shall apply baseline security headers to responses. ✅ [VERIFIED FROM: app.py:374-380]
- NFR-04: The system shall log mutating authenticated API actions. ✅ [VERIFIED FROM: app.py:268-287]
- NFR-05: The system shall expose health and metrics endpoints. ✅ [VERIFIED FROM: app.py:200-234]

## 13.5 Input Design

| Form Name | Fields | Validation Rules | Source File |
|---|---|---|---|
| Student registration | ID, LBC, name, address, contact, password, course/year, Gmail | ID/LBC `YYYY-NNNNN`, Gmail `@gmail.com`, contact `09XXXXXXXXX`, password >=8, address >=3. | ✅ [VERIFIED FROM: scripts/main/registration.js:57-105; src/api/auth.py:707-751] |
| Sign in | ID, password | ID `YYYY-NNNNN`, password required. | ✅ [VERIFIED FROM: scripts/main/sign_in.js:18-81] |
| Recovery | ID, LBC/Gmail, code, new password; admin adds recovery key | ID/LBC format; admin mode changes LBC requirement. | ✅ [VERIFIED FROM: scripts/main/recovery.js:60-180] |
| Book import | CSV/XLSX/raw data, mode | Requires Book No, Title, Category headers/order. | ✅ [VERIFIED FROM: src/api/books.py:271-310] |
| Admin rule form | return/expiry/delete/nearest-day fields | Numeric coercion/defaults in API. | ✅ [VERIFIED FROM: src/api/admin.py:188-239] |

## 13.6 Process Design

See `_docs/07_ipo_analysis.md`; every major feature is decomposed into Input, Process, Output, Database Affected, and Files Involved.

## 13.7 Output Design

| Output Name | Type | Content | Trigger | Source File |
|---|---|---|---|---|
| Registration confirmation | Email/HTML | Confirmation link/token. | Gmail confirmation request. | ✅ [VERIFIED FROM: src/api/auth.py:291-347] |
| Recovery email | Email | Numeric recovery code. | Recovery request. | ✅ [VERIFIED FROM: src/api/auth.py:926-1007] |
| SMS ready/overdue alert | SMS | Ready or overdue message. | Borrow/notify/overdue scan. | ✅ [VERIFIED FROM: src/core/notifications.py:29-88] |
| Admin bell | JSON/UI | Notifications and unread count. | Admin page load/poll. | ✅ [VERIFIED FROM: src/api/admin.py:615-656; scripts/admin/shared_init.js:130-226] |
| Student notifications page | JSON/UI | Items, unread, total. | Student notification page load/poll. | ✅ [VERIFIED FROM: src/api/users.py:515-575; scripts/user/notifications.js:197-294] |
| Digital card | JSON/UI/printable card | Profile, status, transaction history, binary strips. | Student opens card. | ✅ [VERIFIED FROM: src/api/users.py:403-510; scripts/user/account.js:132-171] |

## 13.8 Database Design

- Normalization: ✅ [VERIFIED FROM: src/core/models.py:99-142] `categories`, `books`, and `transactions` are separated with FK constraints for category/book relationships.
- Indexing: ✅ [VERIFIED FROM: src/core/models.py:112-140] indexes exist for book category/status and transaction student/book/action fields.
- Soft delete: ✅ [VERIFIED FROM: src/core/models.py:58-91, src/api/books.py:158-185, src/api/books.py:244-270] students/admins/books/categories use `deleted_at`; books/categories also use `delete_expires_at` undo windows.
- Timestamp conventions: ✅ [VERIFIED FROM: src/core/models.py:66-255] many tables use `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, and rules/buckets use update timestamps.

## 13.9 System Constraints

- No native mobile/offline app is implemented; it is web-based. ✅ [VERIFIED FROM: app.py:36-40]
- Google Sheets sync is not wired to an app route. ✅ [VERIFIED FROM: src/api/sheets.py:33-85; app.py:549-615]
- Fines are not computed; digital card returns `fines: 0`. ✅ [VERIFIED FROM: src/api/users.py:493]
- The app requires a running MySQL server. ✅ [VERIFIED FROM: src/core/db.py:8-16]
