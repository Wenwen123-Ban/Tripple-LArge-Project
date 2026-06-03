# 06 — API Analysis

## 6.1 Endpoint Inventory

| # | Module | Endpoint | Method | Auth Required | Request Body | Response | Source File |
|---|---|---|---|---|---|---|---|
| 1 | Auth | `/api/auth/send-confirmation` | POST | public | gmail,name | status/token | ✅ [VERIFIED FROM: app.py:291; src/api/auth.py:71] |
| 2 | Auth | `/api/auth/confirm-email` | GET | public | token query | HTML/status | ✅ [VERIFIED FROM: app.py:311; src/api/auth.py:1423] |
| 3 | Auth | `/api/auth/check-token` | GET | public | token query | confirmed/status | ✅ [VERIFIED FROM: app.py:318; src/api/auth.py:1537] |
| 4 | Auth | `/api/auth/register` | POST | public+confirmed token | registration JSON | registered/error | ✅ [VERIFIED FROM: app.py:325; src/api/auth.py:752] |
| 5 | Auth | `/api/auth/prevalidate-registration` | POST | public | registration JSON | ok/error | ✅ [VERIFIED FROM: app.py:331; src/api/auth.py:873] |
| 6 | Auth | `/api/auth/check-registration-conflicts` | POST | public | student/lbc/gmail/contact | conflicts | ✅ [VERIFIED FROM: app.py:337; src/api/auth.py:897] |
| 7 | Auth | `/api/auth/recovery/request` | POST | public | student_id,lbc_no,gmail | sent | ✅ [VERIFIED FROM: app.py:343; src/api/auth.py:1023] |
| 8 | Auth | `/api/auth/recovery/verify` | POST | public | student_id,code,new_password | password_updated | ✅ [VERIFIED FROM: app.py:349; src/api/auth.py:1076] |
| 9 | Auth | `/api/auth/login` | POST | public+rate-limited | student_id,password | session token+redirect | ✅ [VERIFIED FROM: app.py:355; src/api/auth.py:1950] |
| 10 | Auth | `/api/auth/logout` | POST | session if present | none | logged_out | ✅ [VERIFIED FROM: app.py:360; src/api/auth.py:2186] |
| 11 | Auth | `/api/auth/check-type` | POST | public | student_id | account_type | ✅ [VERIFIED FROM: app.py:364; src/api/auth.py:1206] |
| 12 | Auth | `/api/auth/admin-send-confirmation` | POST | admin UI intended | admin registration fields | sent/token | ✅ [VERIFIED FROM: app.py:363; src/api/auth.py:1812] |
| 13 | Auth | `/api/auth/verify-admin-setup` | POST | public | student_id,setup_code | activated | ✅ [VERIFIED FROM: app.py:362; src/api/auth.py:1931] |
| 14 | Auth | `/api/auth/admin/setup-verify` | POST | public | student_id,setup_code | activated | ✅ [VERIFIED FROM: app.py:365; src/api/auth.py:1931] |
| 15 | Books | `/api/books` | GET | role-scoped by middleware | filters | book list | ✅ [VERIFIED FROM: app.py:549; src/api/books.py:187] |
| 16 | Books | `/api/books` | POST | admin | book_no,title,category_id,status | created | ✅ [VERIFIED FROM: app.py:550; src/api/books.py:208] |
| 17 | Books | `/api/books/<id>` | PATCH | admin | book fields | updated | ✅ [VERIFIED FROM: app.py:551; src/api/books.py:217] |
| 18 | Books | `/api/books/<id>` | DELETE | admin | none | pending_delete | ✅ [VERIFIED FROM: app.py:552; src/api/books.py:244] |
| 19 | Books | `/api/books/deleted/recent` | GET | admin | none | recent deleted | ✅ [VERIFIED FROM: app.py:553; src/api/books.py:253] |
| 20 | Books | `/api/books/<id>/restore` | POST | admin | none | restored | ✅ [VERIFIED FROM: app.py:554; src/api/books.py:263] |
| 21 | Books | `/api/categories` | GET | admin/student UI | none | categories | ✅ [VERIFIED FROM: app.py:556; src/api/books.py:147] |
| 22 | Books | `/api/categories` | POST | admin | name | created | ✅ [VERIFIED FROM: app.py:557; src/api/books.py:150] |
| 23 | Books | `/api/categories/<id>` | DELETE | admin | none | pending_delete | ✅ [VERIFIED FROM: app.py:558; src/api/books.py:158] |
| 24 | Books | `/api/categories/deleted/recent` | GET | admin | none | recent deleted | ✅ [VERIFIED FROM: app.py:559; src/api/books.py:168] |
| 25 | Books | `/api/categories/<id>/restore` | POST | admin | none | restored | ✅ [VERIFIED FROM: app.py:560; src/api/books.py:179] |
| 26 | Books | `/api/books/import/analyze` | POST | admin multipart | CSV/XLSX/raw | preview | ✅ [VERIFIED FROM: app.py:605; src/api/books.py:311] |
| 27 | Books | `/api/books/import/commit` | POST | admin multipart | CSV/XLSX/raw | insert/update counts | ✅ [VERIFIED FROM: app.py:606; src/api/books.py:332] |
| 28 | Users | `/api/users` | GET | admin | type | users | ✅ [VERIFIED FROM: app.py:563; src/api/users.py:145] |
| 29 | Users | `/api/users/<id>` | PATCH | admin | student editable fields | updated | ✅ [VERIFIED FROM: app.py:564; src/api/users.py:180] |
| 30 | Users | `/api/users/<student_id>` | DELETE | admin | none | deleted | ✅ [VERIFIED FROM: app.py:565; src/api/users.py:252] |
| 31 | Users | `/api/users/pending` | GET | admin | none | pending students | ✅ [VERIFIED FROM: app.py:566; src/api/users.py:325] |
| 32 | Users | `/api/users/<student_id>/approve` | POST | admin | none | approved | ✅ [VERIFIED FROM: app.py:567; src/api/users.py:344] |
| 33 | Users | `/api/users/<student_id>/reject` | POST | admin | admin_id optional | rejected | ✅ [VERIFIED FROM: app.py:568; src/api/users.py:354] |
| 34 | Users | `/api/users/<student_id>/suspend` | POST | admin | admin_id optional | suspended | ✅ [VERIFIED FROM: app.py:569; src/api/users.py:364] |
| 35 | Users | `/api/users/<student_id>/reset-borrow` | POST | admin | notes | reset | ✅ [VERIFIED FROM: app.py:570; src/api/users.py:379] |
| 36 | Users | `/api/courses` | GET | admin/public registration UI | none | courses | ✅ [VERIFIED FROM: app.py:571; src/api/users.py:201] |
| 37 | Users | `/api/courses` | POST | admin | name | created | ✅ [VERIFIED FROM: app.py:572; src/api/users.py:211] |
| 38 | Users | `/api/courses/<id>` | DELETE | admin | none | deleted | ✅ [VERIFIED FROM: app.py:573; src/api/users.py:229] |
| 39 | Users | `/api/user/card` | GET | student | session or student_id | card/profile JSON | ✅ [VERIFIED FROM: app.py:611; src/api/users.py:403] |
| 40 | Users | `/api/users/profile` | GET | student | session | profile JSON | ✅ [VERIFIED FROM: app.py:612; src/api/users.py:511] |
| 41 | Users | `/api/user/notifications` | GET | student | filter | items/unread/total | ✅ [VERIFIED FROM: app.py:613; src/api/users.py:515] |
| 42 | Users | `/api/user/notifications/read/<id>` | POST | student | none | read | ✅ [VERIFIED FROM: app.py:614; src/api/users.py:557] |
| 43 | Users | `/api/user/notifications/clear` | POST | student | student_id optional | cleared | ✅ [VERIFIED FROM: app.py:615; src/api/users.py:544] |
| 44 | Transactions | `/api/transactions/reserve` | POST | student | book_id,student_id optional | reserved | ✅ [VERIFIED FROM: app.py:596; src/api/transactions.py:250] |
| 45 | Transactions | `/api/reserve` | POST | student | book_id | reserved | ✅ [VERIFIED FROM: app.py:597; src/api/transactions.py:250] |
| 46 | Transactions | `/api/transaction/reserve` | POST | student | book_id | reserved | ✅ [VERIFIED FROM: app.py:598; src/api/transactions.py:250] |
| 47 | Transactions | `/api/transactions/borrow` | POST | admin | book_id,student_id | borrowed | ✅ [VERIFIED FROM: app.py:599; src/api/transactions.py:359] |
| 48 | Transactions | `/api/transactions/return` | POST | admin | book_id | returned | ✅ [VERIFIED FROM: app.py:600; src/api/transactions.py:443] |
| 49 | Transactions | `/api/transactions/force-return` | POST | admin | book_id,notes | force_returned | ✅ [VERIFIED FROM: app.py:601; src/api/transactions.py:455] |
| 50 | Transactions | `/api/books/history` | GET | admin | book_id | history rows | ✅ [VERIFIED FROM: app.py:602; src/api/transactions.py:466] |
| 51 | Transactions | `/api/transactions/notify-borrower` | POST | admin | transaction_id or book_id/student_id | sent/failed | ✅ [VERIFIED FROM: app.py:603; src/api/transactions.py:478] |
| 52 | Transactions | `/api/notifications/overdue/run` | POST | admin | none | overdue results | ✅ [VERIFIED FROM: app.py:604; src/api/transactions.py:535] |
| 53 | Transactions | `/api/transactions/cancel` | POST | student/admin | transaction_id | cancelled/failed | ✅ [VERIFIED FROM: app.py:609; src/api/transactions.py:538] |
| 54 | Transactions | `/api/transactions/manage` | GET | student | session or student_id | reserved/borrowed/history | ✅ [VERIFIED FROM: app.py:610; src/api/transactions.py:554] |
| 55 | Admin | `/api/admin/me` | GET | admin | session | admin profile | ✅ [VERIFIED FROM: app.py:361; src/api/admin.py:146] |
| 56 | Admin | `/api/admin/rules` | GET | admin | none | rules | ✅ [VERIFIED FROM: app.py:575; src/api/admin.py:174] |
| 57 | Admin | `/api/admin/rules` | POST | admin | rules JSON | saved | ✅ [VERIFIED FROM: app.py:576; src/api/admin.py:188] |
| 58 | Admin | `/api/admin/logs` | GET | admin | none | logs | ✅ [VERIFIED FROM: app.py:577; src/api/admin.py:250] |
| 59 | Admin | `/api/admin/logs/clear` | POST | admin | none | cleared | ✅ [VERIFIED FROM: app.py:578; src/api/admin.py:291] |
| 60 | Admin | `/api/admin/reports` | GET | admin | none | security reports | ✅ [VERIFIED FROM: app.py:579; src/api/admin.py:534] |
| 61 | Admin | `/api/admin/request-deletion` | POST | admin | target_id | email_sent | ✅ [VERIFIED FROM: app.py:580; src/api/admin.py:349] |
| 62 | Admin | `/api/admin/confirm-deletion` | GET | admin + target email link | id | HTML confirmation | ✅ [VERIFIED FROM: app.py:581; src/api/admin.py:420] |
| 63 | Admin | `/api/admin/finalize-deletion` | POST | admin | target_id,code,notif_id | deleted | ✅ [VERIFIED FROM: app.py:582; src/api/admin.py:459] |
| 64 | Admin | `/api/admin/notifications` | GET | admin | none | notifications | ✅ [VERIFIED FROM: app.py:583; src/api/admin.py:615] |
| 65 | Admin | `/api/admin/notifications/<id>/read` | POST | admin | none | read | ✅ [VERIFIED FROM: app.py:584; src/api/admin.py:658] |
| 66 | Admin | `/api/admin/notifications/clear` | POST | admin | none | cleared | ✅ [VERIFIED FROM: app.py:585; src/api/admin.py:682] |
| 67 | Admin | `/admin/notifications/` | GET | admin | none | notifications | ✅ [VERIFIED FROM: app.py:587; src/api/admin.py:615] |
| 68 | Admin | `/admin/notifications/mark-read/<id>/` | POST | admin | none | read | ✅ [VERIFIED FROM: app.py:588; src/api/admin.py:658] |
| 69 | Admin | `/admin/notifications/mark-all-read/` | POST | admin | none | success | ✅ [VERIFIED FROM: app.py:589; src/api/admin.py:718] |
| 70 | Admin | `/admin/notifications/clear-all/` | POST | admin | none | cleared | ✅ [VERIFIED FROM: app.py:590; src/api/admin.py:682] |
| 71 | Admin | `/api/admin/health` | GET | admin | none | health | ✅ [VERIFIED FROM: app.py:591; src/api/admin.py:241] |
| 72 | Admin | `/api/admin/server-health` | GET | admin | none | health | ✅ [VERIFIED FROM: app.py:592; src/api/admin.py:241] |
| 73 | Admin | `/api/admin/dashboard-stats` | GET | admin | none | stats | ✅ [VERIFIED FROM: app.py:607; src/api/admin.py:760] |
| 74 | System | `/metrics` | GET | public | none | Prometheus metrics | ✅ [VERIFIED FROM: app.py:200] |
| 75 | System | `/health/` | GET | IP-whitelisted | none | health JSON | ✅ [VERIFIED FROM: app.py:205] |
| 76 | System | `/api/testing/bootstrap` | POST | test key | X-Test-Bootstrap-Key | ready | ✅ [VERIFIED FROM: app.py:523] |
| 77 | System | `/api/health` | GET | public blueprint | none | ok | ✅ [VERIFIED FROM: src/api/urls.py:9] |
| 78 | System | `/api/routes` | GET | public blueprint | none | route index | ✅ [VERIFIED FROM: src/api/urls.py:14] |

## 6.2 Session or Token Requirements

- ✅ [VERIFIED FROM: app.py:238-267] `/api/admin/*` requires an admin-scoped session in the central role-scoped API middleware.
- ✅ [VERIFIED FROM: app.py:250-266] selected `/api/users/*` and `/api/transactions/*` routes are treated as admin-only; other user/transaction API requests require a student session.
- ✅ [VERIFIED FROM: src/api/auth.py:2128-2169] `/api/auth/session` validates the Flask session and optional bearer token against `session['auth_token']`.
- ✅ [VERIFIED FROM: src/api/auth.py:752-869] registration requires a confirmed email token row in `pending_confirmations`.

## 6.3 Database Tables and Side Effects by Module

| Module | Tables Read/Written | Side Effects |
|---|---|---|
| Auth | `students`, `admins`, `pending_confirmations`, `recovery_codes`, `security_logs`, `ip_token_buckets`, `system_load_snapshots` | Sends Gmail/SMTP confirmation and recovery emails; writes security logs; sets Flask session. |
| Books | `books`, `categories`, `admin_rules`, `transactions` | Soft deletes/restores; imports CSV/XLSX rows; may purge expired deleted records. |
| Transactions | `transactions`, `books`, `students`, `admins`, `notifications`, `user_notifications`, `admin_notifications`, `admin_rules` | Creates notifications, sends SMS through Semaphore, updates book status/counters. |
| Users | `students`, `admins`, `courses`, `transactions`, `books`, `user_notifications`, `notifications` | Sends student deletion email; logs student deletion; returns digital card/profile JSON. |
| Admin | `admin_rules`, `admin_logs`, `security_logs`, `admins`, `deletion_codes`, `notifications`, `admin_notifications`, `books`, `students`, `transactions` | Sends admin deletion emails, exposes reports and dashboard stats, marks notifications. |
| System | `books`, `transactions`, `notifications` for health; schema seed tables for bootstrap | Updates Prometheus gauges and may seed demo data. |
