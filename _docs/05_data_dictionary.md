# 05 — Data Dictionary

✅ [VERIFIED FROM: src/core/models.py:50-255; src/api/books.py:24-80; src/api/transactions.py:28-103; src/api/users.py:24-80; src/api/admin.py:85-145] The following dictionary combines bootstrap DDL and dynamic schema-extension helpers.

| Table | Field | Data Type | Size | Nullable | Default | Description |
|---|---|---|---|---|---|---|
| `students` | id | INT | — | NO | AUTO_INCREMENT | Internal numeric primary key |
| `students` | student_id | VARCHAR(40) | 40 | NO | none | Student login/identity number |
| `students` | lbc_no | VARCHAR(40) | 40 | YES | NULL | Library card number |
| `students` | full_name | VARCHAR(160) | 160 | NO | none | Student full name |
| `students` | address | VARCHAR(255) | 255 | YES | NULL | Postal/home address |
| `students` | contact_no | VARCHAR(40) | 40 | YES | NULL | Phone contact used for SMS |
| `students` | password_hash | VARCHAR(255) | 255 | NO | none | bcrypt hash |
| `students` | course | VARCHAR(120) | 120 | YES | NULL | Course; N/A for JHS |
| `students` | year_level | VARCHAR(40) | 40 | YES | NULL | Year/grade level |
| `students` | gmail | VARCHAR(255) | 255 | NO | none | Gmail account |
| `students` | is_verified | TINYINT(1) | — | YES | 0 | Verified/approved flag |
| `students` | account_type | VARCHAR(20) | 20 | YES | student | Role marker |
| `students` | last_login_ip | VARCHAR(80) | 80 | YES | NULL | Last login IP |
| `students` | last_login_time | DATETIME | — | YES | NULL | Last login time |
| `students` | deleted_at | DATETIME | — | YES | NULL | Soft delete timestamp |
| `students` | deleted_by | VARCHAR(40) | 40 | YES | NULL | Admin/system that deleted |
| `students` | last_active | DATETIME | — | YES | CURRENT_TIMESTAMP | Activity timestamp |
| `students` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `students` | account_gen_no | INT | — | YES | 1 | Digital-card generation number added dynamically |
| `students` | account_state | VARCHAR(20) | 20 | YES | active | Pending/active/suspended/rejected dynamic state |
| `students` | suspended_at | DATETIME | — | YES | NULL | Suspension timestamp |
| `students` | suspended_by | VARCHAR(40) | 40 | YES | NULL | Suspending admin |
| `admins` | id | INT | — | NO | AUTO_INCREMENT | Internal numeric primary key |
| `admins` | admin_id | VARCHAR(40) | 40 | NO | none | Admin login/identity number |
| `admins` | lbc_no | VARCHAR(40) | 40 | YES | NULL | Library card number |
| `admins` | full_name | VARCHAR(160) | 160 | NO | none | Admin full name |
| `admins` | address | VARCHAR(255) | 255 | YES | NULL | Address |
| `admins` | contact_no | VARCHAR(40) | 40 | YES | NULL | Contact number |
| `admins` | password_hash | VARCHAR(255) | 255 | NO | none | bcrypt hash |
| `admins` | gmail | VARCHAR(255) | 255 | NO | none | Gmail address |
| `admins` | is_verified | TINYINT(1) | — | YES | 0 | Email/activation flag |
| `admins` | setup_code_hash | VARCHAR(255) | 255 | YES | NULL | bcrypt hash of one-time admin setup code |
| `admins` | last_login_ip | VARCHAR(80) | 80 | YES | NULL | Last login IP |
| `admins` | last_login_time | DATETIME | — | YES | NULL | Last login time |
| `admins` | deleted_at | DATETIME | — | YES | NULL | Soft delete timestamp |
| `admins` | deleted_by | VARCHAR(40) | 40 | YES | NULL | Deleting admin |
| `admins` | last_active | DATETIME | — | YES | CURRENT_TIMESTAMP | Activity timestamp |
| `admins` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `categories` | id | INT | — | NO | AUTO_INCREMENT | Category key |
| `categories` | name | VARCHAR(120) | 120 | NO | none | Category name |
| `categories` | deleted_at | DATETIME | — | YES | NULL | Soft delete timestamp |
| `categories` | delete_expires_at | DATETIME | — | YES | NULL | Undo-window expiry |
| `categories` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `books` | id | INT | — | NO | AUTO_INCREMENT | Book row key |
| `books` | book_no | VARCHAR(60) | 60 | NO | none | Book number |
| `books` | title | VARCHAR(255) | 255 | NO | none | Book title |
| `books` | author | VARCHAR(160) | 160 | YES | NULL | Dynamic author column in books API |
| `books` | category_id | INT | — | YES | NULL | References categories.id |
| `books` | status | VARCHAR(40) | 40 | YES | Available | Stored status |
| `books` | reserved_count | INT | — | YES | 0 | Reservation counter |
| `books` | borrowed_count | INT | — | YES | 0 | Borrow counter legacy |
| `books` | borrow_count | INT | — | YES | 0 | Borrow counter used for sorting |
| `books` | reserve_count | INT | — | YES | 0 | Reservation counter alternate |
| `books` | availability_hint | VARCHAR(20) | 20 | YES | Available | Effective availability hint |
| `books` | deleted_at | DATETIME | — | YES | NULL | Soft delete timestamp |
| `books` | delete_expires_at | DATETIME | — | YES | NULL | Undo-window expiry |
| `books` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `transactions` | id | INT | — | NO | AUTO_INCREMENT | Transaction key |
| `transactions` | book_id | INT | — | NO | none | References books.id |
| `transactions` | book_no | VARCHAR(60/20) | 60/20 | NO | none | Book number snapshot |
| `transactions` | student_id | VARCHAR(40) | 40 | NO | none | Borrower/reserver ID |
| `transactions` | action | VARCHAR(20) | 20 | NO | none | reserved/borrowed/returned/cancelled/force_returned |
| `transactions` | actor_admin_id | VARCHAR(40) | 40 | YES | NULL | Admin actor |
| `transactions` | reserved_at | DATETIME | — | YES | NULL | Reservation timestamp |
| `transactions` | pickup_at | DATETIME | — | YES | NULL | Pickup date |
| `transactions` | borrowed_at | DATETIME | — | YES | NULL | Borrow timestamp |
| `transactions` | due_at | DATETIME | — | YES | NULL | Due deadline |
| `transactions` | expected_return_at | DATETIME | — | YES | NULL | Expected return date |
| `transactions` | queue_position | INT | — | YES | NULL | Reservation queue rank |
| `transactions` | returned_at | DATETIME | — | YES | NULL | Completion/cancel timestamp |
| `transactions` | ready_sms_sent_at | DATETIME | — | YES | NULL | Ready SMS sent marker |
| `transactions` | overdue_sms_sent_at | DATETIME | — | YES | NULL | Overdue SMS sent marker |
| `transactions` | notes | TEXT | — | YES | NULL | Notes/reason |
| `transactions` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Record creation |
| `pending_confirmations` | id | INT | — | NO | AUTO_INCREMENT | Confirmation key |
| `pending_confirmations` | token | VARCHAR(255) | 255 | NO | none | Email token |
| `pending_confirmations` | gmail | VARCHAR(255) | 255 | NO | none | Gmail being confirmed |
| `pending_confirmations` | confirmed | TINYINT(1) | — | YES | 0 | Confirmed flag |
| `pending_confirmations` | type | VARCHAR(20) | 20 | YES | student | student/admin token type |
| `pending_confirmations` | setup_code_temp | VARCHAR(50) | 50 | YES | NULL | Temporary admin setup code |
| `pending_confirmations` | expires_at | DATETIME | — | NO | none | Token expiry |
| `pending_confirmations` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `recovery_codes` | id | INT | — | NO | AUTO_INCREMENT | Recovery key |
| `recovery_codes` | student_id | VARCHAR(40) | 40 | NO | none | Account ID |
| `recovery_codes` | code | VARCHAR(12) | 12 | NO | none | Email recovery code (stored plaintext) |
| `recovery_codes` | used | TINYINT(1) | — | YES | 0 | Used flag |
| `recovery_codes` | expires_at | DATETIME | — | NO | none | Expiry |
| `recovery_codes` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `security_logs` | id | INT | — | NO | AUTO_INCREMENT | Security log key |
| `security_logs` | student_id | VARCHAR(40) | 40 | NO | none | Legacy account ID |
| `security_logs` | account_id | VARCHAR(40) | 40 | YES | NULL | Dynamic account ID |
| `security_logs` | account_type | VARCHAR(20) | 20 | YES | unknown | Role |
| `security_logs` | event_type | VARCHAR(80) | 80 | NO | none | Event name |
| `security_logs` | ip_address | VARCHAR(80) | 80 | YES | NULL | Client IP |
| `security_logs` | description | VARCHAR(255) | 255 | YES | NULL | Description |
| `security_logs` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Timestamp |
| `notifications` | id | INT | — | NO | AUTO_INCREMENT | Notification key |
| `notifications` | recipient_id | VARCHAR(40) | 40 | NO | none | Admin/student recipient ID |
| `notifications` | type | VARCHAR(50) | 50 | NO | none | Type |
| `notifications` | notification_type | VARCHAR(50) | 50 | YES | general | Display type |
| `notifications` | title | VARCHAR(120) | 120 | NO | none | Title |
| `notifications` | message | TEXT | — | YES | NULL | Body |
| `notifications` | data | TEXT | — | YES | NULL | JSON text payload |
| `notifications` | is_read | TINYINT(1) | — | YES | 0 | Read flag |
| `notifications` | is_used | TINYINT(1) | — | YES | 0 | Consumed code/action flag |
| `notifications` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `user_notifications` | id | INT | — | NO | AUTO_INCREMENT | Student notification key |
| `user_notifications` | user_id | VARCHAR(40) | 40 | NO | none | Student recipient |
| `user_notifications` | type | VARCHAR(60) | 60 | NO | none | Type |
| `user_notifications` | title | VARCHAR(120) | 120 | NO | none | Title |
| `user_notifications` | message | TEXT | — | NO | none | Body |
| `user_notifications` | reservation_id | INT | — | YES | NULL | Reservation link |
| `user_notifications` | loan_id | INT | — | YES | NULL | Loan link |
| `user_notifications` | book_id | INT | — | YES | NULL | Book link |
| `user_notifications` | is_read | TINYINT(1) | — | YES | 0 | Read flag |
| `user_notifications` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `admin_notifications` | id | INT | — | NO | AUTO_INCREMENT | Admin notification key |
| `admin_notifications` | type | VARCHAR(60) | 60 | NO | none | Type |
| `admin_notifications` | title | VARCHAR(120) | 120 | NO | none | Title |
| `admin_notifications` | message | TEXT | — | NO | none | Body |
| `admin_notifications` | reservation_id | INT | — | YES | NULL | Reservation link |
| `admin_notifications` | loan_id | INT | — | YES | NULL | Loan link |
| `admin_notifications` | student_id | VARCHAR(40) | 40 | YES | NULL | Student link |
| `admin_notifications` | book_id | INT | — | YES | NULL | Book link |
| `admin_notifications` | is_read | TINYINT(1) | — | YES | 0 | Read flag |
| `admin_notifications` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Creation timestamp |
| `ip_token_buckets` | id | INT | — | NO | AUTO_INCREMENT | Bucket key |
| `ip_token_buckets` | ip_address | VARCHAR(64) | 64 | NO | none | Client IP |
| `ip_token_buckets` | tokens | FLOAT | — | YES | 10.0 | Remaining tokens |
| `ip_token_buckets` | max_tokens | FLOAT | — | YES | 10.0 | Maximum tokens |
| `ip_token_buckets` | replenish_hours | FLOAT | — | YES | 1.0 | Replenish interval |
| `ip_token_buckets` | last_replenish | DATETIME | — | YES | CURRENT_TIMESTAMP | Last refill |
| `ip_token_buckets` | is_blocked | TINYINT(1) | — | YES | 0 | Blocked flag |
| `ip_token_buckets` | blocked_until | DATETIME | — | YES | NULL | Block expiry |
| `ip_token_buckets` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Created |
| `ip_token_buckets` | updated_at | DATETIME | — | YES | CURRENT_TIMESTAMP ON UPDATE | Updated |
| `system_load_snapshots` | id | INT | — | NO | AUTO_INCREMENT | Snapshot key |
| `system_load_snapshots` | simultaneous_login_attempts | INT | — | YES | 0 | Login pressure |
| `system_load_snapshots` | simultaneous_active_users | INT | — | YES | 0 | Active users |
| `system_load_snapshots` | total_daily_users | INT | — | YES | 0 | Daily users |
| `system_load_snapshots` | load_tier | VARCHAR(20) | 20 | YES | normal | normal/elevated/high |
| `system_load_snapshots` | snapshot_date | DATE | — | NO | none | Date |
| `system_load_snapshots` | updated_at | DATETIME | — | YES | CURRENT_TIMESTAMP ON UPDATE | Update time |
| `admin_rules` | id | INT | — | NO | 1 | Singleton rules row |
| `admin_rules` | nearest_day_rule | TINYINT(1) | — | YES | 1 | Skip Sunday pickup rule |
| `admin_rules` | return_days | INT | — | YES | NULL/0 | Return days |
| `admin_rules` | return_hours | INT | — | YES | NULL/0 | Return hours |
| `admin_rules` | expire_days | INT | — | YES | NULL/0 | Reservation expiry days |
| `admin_rules` | expire_hours | INT | — | YES | NULL/0 | Reservation expiry hours |
| `admin_rules` | expire_mins | INT | — | YES | 30 | Reservation expiry minutes |
| `admin_rules` | expiry_enabled | TINYINT(1) | — | YES | 0 | Account expiry flag |
| `admin_rules` | expiry_years | INT | — | YES | NULL | Account expiry years |
| `admin_rules` | inactive_enabled | TINYINT(1) | — | YES | 0 | Inactive-account rule flag |
| `admin_rules` | inactive_days | INT | — | YES | NULL | Inactive days |
| `admin_rules` | warn_enabled | TINYINT(1) | — | YES | 0 | Warning flag |
| `admin_rules` | warn_before_days | INT | — | YES | 30 | Warning lead time |
| `admin_rules` | book_delete_grace_mins | INT | — | YES | 20 | Undo window for deleted books/categories |
| `admin_rules` | updated_at | DATETIME | — | YES | CURRENT_TIMESTAMP ON UPDATE | Updated |
| `deletion_codes` | id | INT | — | NO | AUTO_INCREMENT | Deletion code key |
| `deletion_codes` | requested_by | VARCHAR(40) | 40 | NO | none | Requester admin |
| `deletion_codes` | target_id | VARCHAR(40) | 40 | NO | none | Target account |
| `deletion_codes` | target_type | VARCHAR(10) | 10 | NO | none | admin/student |
| `deletion_codes` | code | VARCHAR(10) | 10 | NO | none | Email-confirmed deletion code (stored plaintext) |
| `deletion_codes` | confirmed_email | TINYINT(1) | — | YES | 0 | Target confirmed email |
| `deletion_codes` | expires_at | DATETIME | — | NO | none | Expiry |
| `deletion_codes` | used | TINYINT(1) | — | YES | 0 | Used flag |
| `deletion_codes` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Created |
| `courses` | id | INT | — | NO | AUTO_INCREMENT | Course key |
| `courses` | name | VARCHAR(120) | 120 | NO | none | Course name |
| `courses` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Created |
| `admin_logs` | id | INT | — | NO | AUTO_INCREMENT | Admin log key |
| `admin_logs` | student_id | VARCHAR(40) | 40 | YES | NULL | Related account |
| `admin_logs` | direction | VARCHAR(20) | 20 | YES | NULL | Direction |
| `admin_logs` | action | VARCHAR(120) | 120 | YES | NULL | Action |
| `admin_logs` | created_at | DATETIME | — | YES | CURRENT_TIMESTAMP | Created |

## Sensitive Fields

| Field | Handling |
|---|---|
| `students.password_hash` | bcrypt hash produced by `hash_password()`. ✅ [VERIFIED FROM: src/core/security.py:4-6] |
| `admins.password_hash` | bcrypt hash produced during admin creation and login verification. ✅ [VERIFIED FROM: src/api/auth.py:1717-1786; src/core/security.py:4-16] |
| `admins.setup_code_hash` | bcrypt hash of generated setup code; cleared after setup verification. ✅ [VERIFIED FROM: src/api/auth.py:1931-1948] |
| `pending_confirmations.token` | Random URL-safe token with 15-minute TTL in code. ✅ [VERIFIED FROM: src/api/auth.py:23-24, src/api/auth.py:47-69] |
| `recovery_codes.code` | ⚠️ [INFERRED SECURITY CONCERN] Stored as plaintext numeric code; no hashing is shown before insert. ✅ [VERIFIED FROM: src/api/auth.py:1048-1066] |
| `deletion_codes.code` | ⚠️ [INFERRED SECURITY CONCERN] Stored as plaintext 8-digit code for admin deletion flow. ✅ [VERIFIED FROM: src/api/admin.py:386-406] |
