# 16 — Testing Documentation

## 16.1 Unit Test Cases

| Test ID | Function/Endpoint | Input | Expected Output | Pass Criteria |
|---|---|---|---|---|
| UT-001 | /api/auth/send-confirmation `POST` | gmail,name | status/token | HTTP status and DB/side effect match documented response. |
| UT-002 | /api/auth/confirm-email `GET` | token query | HTML/status | HTTP status and DB/side effect match documented response. |
| UT-003 | /api/auth/check-token `GET` | token query | confirmed/status | HTTP status and DB/side effect match documented response. |
| UT-004 | /api/auth/register `POST` | registration JSON | registered/error | HTTP status and DB/side effect match documented response. |
| UT-005 | /api/auth/prevalidate-registration `POST` | registration JSON | ok/error | HTTP status and DB/side effect match documented response. |
| UT-006 | /api/auth/check-registration-conflicts `POST` | student/lbc/gmail/contact | conflicts | HTTP status and DB/side effect match documented response. |
| UT-007 | /api/auth/recovery/request `POST` | student_id,lbc_no,gmail | sent | HTTP status and DB/side effect match documented response. |
| UT-008 | /api/auth/recovery/verify `POST` | student_id,code,new_password | password_updated | HTTP status and DB/side effect match documented response. |
| UT-009 | /api/auth/login `POST` | student_id,password | session token+redirect | HTTP status and DB/side effect match documented response. |
| UT-010 | /api/auth/logout `POST` | none | logged_out | HTTP status and DB/side effect match documented response. |
| UT-011 | /api/auth/check-type `POST` | student_id | account_type | HTTP status and DB/side effect match documented response. |
| UT-012 | /api/auth/admin-send-confirmation `POST` | admin registration fields | sent/token | HTTP status and DB/side effect match documented response. |
| UT-013 | /api/auth/verify-admin-setup `POST` | student_id,setup_code | activated | HTTP status and DB/side effect match documented response. |
| UT-014 | /api/auth/admin/setup-verify `POST` | student_id,setup_code | activated | HTTP status and DB/side effect match documented response. |
| UT-015 | /api/books `GET` | filters | book list | HTTP status and DB/side effect match documented response. |
| UT-016 | /api/books `POST` | book_no,title,category_id,status | created | HTTP status and DB/side effect match documented response. |
| UT-017 | /api/books/<id> `PATCH` | book fields | updated | HTTP status and DB/side effect match documented response. |
| UT-018 | /api/books/<id> `DELETE` | none | pending_delete | HTTP status and DB/side effect match documented response. |
| UT-019 | /api/books/deleted/recent `GET` | none | recent deleted | HTTP status and DB/side effect match documented response. |
| UT-020 | /api/books/<id>/restore `POST` | none | restored | HTTP status and DB/side effect match documented response. |
| UT-021 | /api/categories `GET` | none | categories | HTTP status and DB/side effect match documented response. |
| UT-022 | /api/categories `POST` | name | created | HTTP status and DB/side effect match documented response. |
| UT-023 | /api/categories/<id> `DELETE` | none | pending_delete | HTTP status and DB/side effect match documented response. |
| UT-024 | /api/categories/deleted/recent `GET` | none | recent deleted | HTTP status and DB/side effect match documented response. |
| UT-025 | /api/categories/<id>/restore `POST` | none | restored | HTTP status and DB/side effect match documented response. |
| UT-026 | /api/books/import/analyze `POST` | CSV/XLSX/raw | preview | HTTP status and DB/side effect match documented response. |
| UT-027 | /api/books/import/commit `POST` | CSV/XLSX/raw | insert/update counts | HTTP status and DB/side effect match documented response. |
| UT-028 | /api/users `GET` | type | users | HTTP status and DB/side effect match documented response. |
| UT-029 | /api/users/<id> `PATCH` | student editable fields | updated | HTTP status and DB/side effect match documented response. |
| UT-030 | /api/users/<student_id> `DELETE` | none | deleted | HTTP status and DB/side effect match documented response. |
| UT-031 | /api/users/pending `GET` | none | pending students | HTTP status and DB/side effect match documented response. |
| UT-032 | /api/users/<student_id>/approve `POST` | none | approved | HTTP status and DB/side effect match documented response. |
| UT-033 | /api/users/<student_id>/reject `POST` | admin_id optional | rejected | HTTP status and DB/side effect match documented response. |
| UT-034 | /api/users/<student_id>/suspend `POST` | admin_id optional | suspended | HTTP status and DB/side effect match documented response. |
| UT-035 | /api/users/<student_id>/reset-borrow `POST` | notes | reset | HTTP status and DB/side effect match documented response. |
| UT-036 | /api/courses `GET` | none | courses | HTTP status and DB/side effect match documented response. |
| UT-037 | /api/courses `POST` | name | created | HTTP status and DB/side effect match documented response. |
| UT-038 | /api/courses/<id> `DELETE` | none | deleted | HTTP status and DB/side effect match documented response. |
| UT-039 | /api/user/card `GET` | session or student_id | card/profile JSON | HTTP status and DB/side effect match documented response. |
| UT-040 | /api/users/profile `GET` | session | profile JSON | HTTP status and DB/side effect match documented response. |
| UT-041 | /api/user/notifications `GET` | filter | items/unread/total | HTTP status and DB/side effect match documented response. |
| UT-042 | /api/user/notifications/read/<id> `POST` | none | read | HTTP status and DB/side effect match documented response. |
| UT-043 | /api/user/notifications/clear `POST` | student_id optional | cleared | HTTP status and DB/side effect match documented response. |
| UT-044 | /api/transactions/reserve `POST` | book_id,student_id optional | reserved | HTTP status and DB/side effect match documented response. |
| UT-045 | /api/reserve `POST` | book_id | reserved | HTTP status and DB/side effect match documented response. |
| UT-046 | /api/transaction/reserve `POST` | book_id | reserved | HTTP status and DB/side effect match documented response. |
| UT-047 | /api/transactions/borrow `POST` | book_id,student_id | borrowed | HTTP status and DB/side effect match documented response. |
| UT-048 | /api/transactions/return `POST` | book_id | returned | HTTP status and DB/side effect match documented response. |
| UT-049 | /api/transactions/force-return `POST` | book_id,notes | force_returned | HTTP status and DB/side effect match documented response. |
| UT-050 | /api/books/history `GET` | book_id | history rows | HTTP status and DB/side effect match documented response. |
| UT-051 | /api/transactions/notify-borrower `POST` | transaction_id or book_id/student_id | sent/failed | HTTP status and DB/side effect match documented response. |
| UT-052 | /api/notifications/overdue/run `POST` | none | overdue results | HTTP status and DB/side effect match documented response. |
| UT-053 | /api/transactions/cancel `POST` | transaction_id | cancelled/failed | HTTP status and DB/side effect match documented response. |
| UT-054 | /api/transactions/manage `GET` | session or student_id | reserved/borrowed/history | HTTP status and DB/side effect match documented response. |
| UT-055 | /api/admin/me `GET` | session | admin profile | HTTP status and DB/side effect match documented response. |
| UT-056 | /api/admin/rules `GET` | none | rules | HTTP status and DB/side effect match documented response. |
| UT-057 | /api/admin/rules `POST` | rules JSON | saved | HTTP status and DB/side effect match documented response. |
| UT-058 | /api/admin/logs `GET` | none | logs | HTTP status and DB/side effect match documented response. |
| UT-059 | /api/admin/logs/clear `POST` | none | cleared | HTTP status and DB/side effect match documented response. |
| UT-060 | /api/admin/reports `GET` | none | security reports | HTTP status and DB/side effect match documented response. |
| UT-061 | /api/admin/request-deletion `POST` | target_id | email_sent | HTTP status and DB/side effect match documented response. |
| UT-062 | /api/admin/confirm-deletion `GET` | id | HTML confirmation | HTTP status and DB/side effect match documented response. |
| UT-063 | /api/admin/finalize-deletion `POST` | target_id,code,notif_id | deleted | HTTP status and DB/side effect match documented response. |
| UT-064 | /api/admin/notifications `GET` | none | notifications | HTTP status and DB/side effect match documented response. |
| UT-065 | /api/admin/notifications/<id>/read `POST` | none | read | HTTP status and DB/side effect match documented response. |
| UT-066 | /api/admin/notifications/clear `POST` | none | cleared | HTTP status and DB/side effect match documented response. |
| UT-067 | /admin/notifications/ `GET` | none | notifications | HTTP status and DB/side effect match documented response. |
| UT-068 | /admin/notifications/mark-read/<id>/ `POST` | none | read | HTTP status and DB/side effect match documented response. |
| UT-069 | /admin/notifications/mark-all-read/ `POST` | none | success | HTTP status and DB/side effect match documented response. |
| UT-070 | /admin/notifications/clear-all/ `POST` | none | cleared | HTTP status and DB/side effect match documented response. |
| UT-071 | /api/admin/health `GET` | none | health | HTTP status and DB/side effect match documented response. |
| UT-072 | /api/admin/server-health `GET` | none | health | HTTP status and DB/side effect match documented response. |
| UT-073 | /api/admin/dashboard-stats `GET` | none | stats | HTTP status and DB/side effect match documented response. |
| UT-074 | /metrics `GET` | none | Prometheus metrics | HTTP status and DB/side effect match documented response. |
| UT-075 | /health/ `GET` | none | health JSON | HTTP status and DB/side effect match documented response. |
| UT-076 | /api/testing/bootstrap `POST` | X-Test-Bootstrap-Key | ready | HTTP status and DB/side effect match documented response. |
| UT-077 | /api/health `GET` | none | ok | HTTP status and DB/side effect match documented response. |
| UT-078 | /api/routes `GET` | none | route index | HTTP status and DB/side effect match documented response. |

## 16.2 Integration Test Cases

| Test ID | Workflow | Steps | Expected Result |
|---|---|---|---|
| IT-01 | Student Registration | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-02 | Gmail Email Confirmation | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-03 | Student Login | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-04 | Admin Login | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-05 | Account Recovery (Student) | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-06 | Account Recovery (Admin) | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-07 | Book Search and Browse | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-08 | Book Reservation | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-09 | Reservation Approval by Admin | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-10 | Book Borrowing Confirmation | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-11 | Book Return | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-12 | Force Return by Admin | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-13 | Reservation Cancellation by Student | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-14 | Bulk Book Import (CSV/XLSX) | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-15 | Google Sheets Sync | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-16 | Add/Delete Book | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-17 | Add/Delete Category | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-18 | Admin Registration (by existing admin) | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-19 | Admin Account Deletion (double confirmation flow) | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-20 | Student Account Deletion | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-21 | Notification Generation and Delivery | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-22 | Digital Library Card Generation | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-23 | Binary Security Strip Generation | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-24 | Server Health Check | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-25 | Security Log Recording | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |
| IT-26 | Admin Rule Configuration | Follow IPO steps in `_docs/07_ipo_analysis.md`. | Expected output in IPO table. |

## 16.3 User Acceptance Test Cases (UAT)

| Test ID | Feature | User Action | System Response | Acceptable? |
|---|---|---|---|---|
| UAT-01 | Student Registration | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-02 | Gmail Email Confirmation | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-03 | Student Login | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-04 | Admin Login | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-05 | Account Recovery (Student) | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-06 | Account Recovery (Admin) | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-07 | Book Search and Browse | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-08 | Book Reservation | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-09 | Reservation Approval by Admin | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-10 | Book Borrowing Confirmation | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-11 | Book Return | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-12 | Force Return by Admin | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-13 | Reservation Cancellation by Student | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-14 | Bulk Book Import (CSV/XLSX) | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-15 | Google Sheets Sync | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-16 | Add/Delete Book | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-17 | Add/Delete Category | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-18 | Admin Registration (by existing admin) | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-19 | Admin Account Deletion (double confirmation flow) | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-20 | Student Account Deletion | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-21 | Notification Generation and Delivery | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-22 | Digital Library Card Generation | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-23 | Binary Security Strip Generation | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-24 | Server Health Check | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-25 | Security Log Recording | User performs documented workflow. | System returns documented output. | Yes/No |
| UAT-26 | Admin Rule Configuration | User performs documented workflow. | System returns documented output. | Yes/No |

## 16.4 Edge Case Tests

### Student Registration
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Gmail Email Confirmation
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Student Login
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Admin Login
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Account Recovery (Student)
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Account Recovery (Admin)
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Book Search and Browse
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Book Reservation
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Reservation Approval by Admin
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Book Borrowing Confirmation
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Book Return
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Force Return by Admin
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Reservation Cancellation by Student
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Bulk Book Import (CSV/XLSX)
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Google Sheets Sync
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Add/Delete Book
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Add/Delete Category
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Admin Registration (by existing admin)
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Admin Account Deletion (double confirmation flow)
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Student Account Deletion
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Notification Generation and Delivery
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Digital Library Card Generation
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Binary Security Strip Generation
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Server Health Check
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Security Log Recording
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.

### Admin Rule Configuration
- Empty required input should fail.
- Duplicate or invalid state should fail where applicable.
- Unauthorized role/session should fail for protected actions.


## 16.5 Testing Checklist

- [ ] Student Registration works according to `_docs/07_ipo_analysis.md`.
- [ ] Gmail Email Confirmation works according to `_docs/07_ipo_analysis.md`.
- [ ] Student Login works according to `_docs/07_ipo_analysis.md`.
- [ ] Admin Login works according to `_docs/07_ipo_analysis.md`.
- [ ] Account Recovery (Student) works according to `_docs/07_ipo_analysis.md`.
- [ ] Account Recovery (Admin) works according to `_docs/07_ipo_analysis.md`.
- [ ] Book Search and Browse works according to `_docs/07_ipo_analysis.md`.
- [ ] Book Reservation works according to `_docs/07_ipo_analysis.md`.
- [ ] Reservation Approval by Admin works according to `_docs/07_ipo_analysis.md`.
- [ ] Book Borrowing Confirmation works according to `_docs/07_ipo_analysis.md`.
- [ ] Book Return works according to `_docs/07_ipo_analysis.md`.
- [ ] Force Return by Admin works according to `_docs/07_ipo_analysis.md`.
- [ ] Reservation Cancellation by Student works according to `_docs/07_ipo_analysis.md`.
- [ ] Bulk Book Import (CSV/XLSX) works according to `_docs/07_ipo_analysis.md`.
- [ ] Google Sheets Sync works according to `_docs/07_ipo_analysis.md`.
- [ ] Add/Delete Book works according to `_docs/07_ipo_analysis.md`.
- [ ] Add/Delete Category works according to `_docs/07_ipo_analysis.md`.
- [ ] Admin Registration (by existing admin) works according to `_docs/07_ipo_analysis.md`.
- [ ] Admin Account Deletion (double confirmation flow) works according to `_docs/07_ipo_analysis.md`.
- [ ] Student Account Deletion works according to `_docs/07_ipo_analysis.md`.
- [ ] Notification Generation and Delivery works according to `_docs/07_ipo_analysis.md`.
- [ ] Digital Library Card Generation works according to `_docs/07_ipo_analysis.md`.
- [ ] Binary Security Strip Generation works according to `_docs/07_ipo_analysis.md`.
- [ ] Server Health Check works according to `_docs/07_ipo_analysis.md`.
- [ ] Security Log Recording works according to `_docs/07_ipo_analysis.md`.
- [ ] Admin Rule Configuration works according to `_docs/07_ipo_analysis.md`.
