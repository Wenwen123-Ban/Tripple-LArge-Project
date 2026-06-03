# 12 — Feature Inventory

| # | Feature | Status | Evidence | Notes |
|---|---|---|---|---|
| 1 | Student Registration | ✅ COMPLETE | ✅ [VERIFIED FROM: scripts/main/registration.js; src/api/auth.py:752-869] | Implemented and wired by source evidence. |
| 2 | Gmail Email Confirmation | ✅ COMPLETE | ✅ [VERIFIED FROM: app.py:291-318; src/api/auth.py:71-105] | Implemented and wired by source evidence. |
| 3 | Student Login | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/auth.py:1950-2126] | Implemented and wired by source evidence. |
| 4 | Admin Login | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/auth.py:1950-2058] | Implemented and wired by source evidence. |
| 5 | Account Recovery (Student) | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/auth.py:1023-1138] | Implemented and wired by source evidence. |
| 6 | Account Recovery (Admin) | 🔶 PARTIAL | ✅ [VERIFIED FROM: src/api/auth.py:1188-1403] | Route/UI mismatch or schema mismatch noted. |
| 7 | Book Search and Browse | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/books.py:187-207] | Implemented and wired by source evidence. |
| 8 | Book Reservation | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:250-327] | Implemented and wired by source evidence. |
| 9 | Reservation Approval by Admin | 🔶 PARTIAL | ✅ [VERIFIED FROM: scripts/admin/dashboard.js:18-27; src/api/transactions.py:359-440] | Route/UI mismatch or schema mismatch noted. |
| 10 | Book Borrowing Confirmation | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:359-440] | Implemented and wired by source evidence. |
| 11 | Book Return | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:443-452] | Implemented and wired by source evidence. |
| 12 | Force Return by Admin | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:455-464] | Implemented and wired by source evidence. |
| 13 | Reservation Cancellation by Student | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:538-552] | Implemented and wired by source evidence. |
| 14 | Bulk Book Import (CSV/XLSX) | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/books.py:271-355] | Implemented and wired by source evidence. |
| 15 | Google Sheets Sync | 🔶 PARTIAL | ✅ [VERIFIED FROM: src/api/sheets.py:19-85] | Route/UI mismatch or schema mismatch noted. |
| 16 | Add/Delete Book | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/books.py:208-270] | Implemented and wired by source evidence. |
| 17 | Add/Delete Category | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/books.py:147-185] | Implemented and wired by source evidence. |
| 18 | Admin Registration (by existing admin) | ✅ COMPLETE | ✅ [VERIFIED FROM: scripts/admin/users.js:340-451; src/api/auth.py:1812-1930] | Implemented and wired by source evidence. |
| 19 | Admin Account Deletion (double confirmation flow) | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/admin.py:349-523] | Implemented and wired by source evidence. |
| 20 | Student Account Deletion | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/users.py:252-309] | Implemented and wired by source evidence. |
| 21 | Notification Generation and Delivery | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/transactions.py:207-238; src/core/notifications.py:29-88] | Implemented and wired by source evidence. |
| 22 | Digital Library Card Generation | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/users.py:403-510; scripts/user/account.js:132-171] | Implemented and wired by source evidence. |
| 23 | Binary Security Strip Generation | ✅ COMPLETE | ✅ [VERIFIED FROM: scripts/user/account.js:1-47] | Implemented and wired by source evidence. |
| 24 | Server Health Check | ✅ COMPLETE | ✅ [VERIFIED FROM: app.py:205-234] | Implemented and wired by source evidence. |
| 25 | Security Log Recording | ✅ COMPLETE | ✅ [VERIFIED FROM: app.py:268-287; src/api/auth.py:1147-1186] | Implemented and wired by source evidence. |
| 26 | Admin Rule Configuration | ✅ COMPLETE | ✅ [VERIFIED FROM: src/api/admin.py:174-239; src/api/transactions.py:130-163] | Implemented and wired by source evidence. |

## Missing/Planned Items Observed

| Feature Mention | Status | Evidence | Notes |
|---|---|---|---|
| `/api/user/notifications/mark-read` mark-all route | ❌ MISSING | ✅ [VERIFIED FROM: scripts/user/notifications.js:253-270] | Frontend calls a mark-all URL that is not registered in `app.py`; only read-by-id and clear routes exist. |
| Google Sheets registered endpoint | ❌ MISSING/PARTIAL | ✅ [VERIFIED FROM: scripts/admin/books.js:84; src/api/sheets.py:33-85] | Function exists but `app.py` does not register `/api/sheets/sync`. |
| Fines computation | 📋 PLANNED/PARTIAL | ✅ [VERIFIED FROM: src/api/users.py:493] | Card payload hardcodes `fines: 0`. |
