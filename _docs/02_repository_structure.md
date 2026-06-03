# 02 — Repository Structure

## 2.1 Full Directory Tree

✅ [VERIFIED FROM: terminal command `rg --files -g '!_docs/**' -g '!__pycache__/**' -g '!*.pyc'`]

```text
root/
├── Click_and_Collect_System_Diagrams.txt — [Existing diagram text artifact]
├── IMPLEMENTATION_CHECKLIST.md — [Existing project documentation]
├── SECURITY_SCALING_STRATEGY.md — [Existing project documentation]
├── app.py — [Flask application factory/route registry, middleware, page serving, health and metrics endpoints]
├── docker-compose.yml — [Repository file]
├── logs/admin_access_blocked.log — [Existing runtime log file]
├── logs/lbas_access.log — [Existing runtime log file]
├── logs/security_events.log — [Existing runtime log file]
├── manage.py — [Empty/placeholder management entry file]
├── monitoring/prometheus.yml — [Prometheus monitoring configuration]
├── public/assets/fonts/fonts.css — [Static image/font/icon asset]
├── public/assets/icons/app.svg — [Static image/font/icon asset]
├── public/assets/icons/book.svg — [Static image/font/icon asset]
├── public/assets/icons/hex-book-1.svg — [Static image/font/icon asset]
├── public/assets/icons/hex-book-2.svg — [Static image/font/icon asset]
├── public/assets/icons/hex-book-3.svg — [Static image/font/icon asset]
├── public/assets/icons/hex-book-4.svg — [Static image/font/icon asset]
├── public/assets/icons/main-book-icon.svg — [Static image/font/icon asset]
├── public/assets/icons/user-nav-card.svg — [Static image/font/icon asset]
├── public/assets/icons/user-nav-home.svg — [Static image/font/icon asset]
├── public/assets/icons/user-nav-manage.svg — [Static image/font/icon asset]
├── public/assets/icons/user-nav-notifications.svg — [Static image/font/icon asset]
├── public/assets/icons/user.svg — [Static image/font/icon asset]
├── public/assets/img/default_avatar.png — [Static image/font/icon asset]
├── public/assets/logo/Book_logo.png — [Static image/font/icon asset]
├── public/assets/logo/NMSC LOGO.jpg — [Static image/font/icon asset]
├── public/assets/resuable/Icons.png — [Static image/font/icon asset]
├── public/components/bookCard.html — [Reusable HTML component fragment]
├── public/components/footer.html — [Reusable HTML component fragment]
├── public/components/header.html — [Reusable HTML component fragment]
├── public/components/modal.html — [Reusable HTML component fragment]
├── public/components/navbar.html — [Reusable HTML component fragment]
├── public/components/sidebar.html — [Reusable HTML component fragment]
├── public/pages/admin/about.html — [HTML page template served statically by Flask]
├── public/pages/admin/adminBookmanagement.html — [HTML page template served statically by Flask]
├── public/pages/admin/adminDashboard.html — [HTML page template served statically by Flask]
├── public/pages/admin/adminSecurityreports.html — [HTML page template served statically by Flask]
├── public/pages/admin/adminusersManagement.html — [HTML page template served statically by Flask]
├── public/pages/admin/manual.html — [HTML page template served statically by Flask]
├── public/pages/main/recovery_form.html — [HTML page template served statically by Flask]
├── public/pages/main/registration_form.html — [HTML page template served statically by Flask]
├── public/pages/main/sign_in.html — [HTML page template served statically by Flask]
├── public/pages/main/welcome.html — [HTML page template served statically by Flask]
├── public/pages/user/about.html — [HTML page template served statically by Flask]
├── public/pages/user/help.html — [HTML page template served statically by Flask]
├── public/pages/user/userBookdisplay.html — [HTML page template served statically by Flask]
├── public/pages/user/userLibraryCard.html — [HTML page template served statically by Flask]
├── public/pages/user/userManagement.html — [HTML page template served statically by Flask]
├── public/pages/user/userNotification.html — [HTML page template served statically by Flask]
├── public/scripts/user/account.js — [Repository file]
├── public/styles/admin/admin_Bookmanagement.css — [CSS stylesheet for UI page/module]
├── public/styles/admin/admin_dashboard.css — [CSS stylesheet for UI page/module]
├── public/styles/admin/admin_management.css — [CSS stylesheet for UI page/module]
├── public/styles/admin/admin_securityreports.css — [CSS stylesheet for UI page/module]
├── public/styles/admin/admin_shared.css — [CSS stylesheet for UI page/module]
├── public/styles/main/about.css — [CSS stylesheet for UI page/module]
├── public/styles/main/help.css — [CSS stylesheet for UI page/module]
├── public/styles/main/recoveryform.css — [CSS stylesheet for UI page/module]
├── public/styles/main/registrationForm.css — [CSS stylesheet for UI page/module]
├── public/styles/main/sign_in.css — [CSS stylesheet for UI page/module]
├── public/styles/main/welcome.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_Management.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_about.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_card.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_dashboard.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_help.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_management.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_notification.css — [CSS stylesheet for UI page/module]
├── public/styles/user/user_shared.css — [CSS stylesheet for UI page/module]
├── requirements.txt — [Python dependency constraints]
├── scripts/admin/auth.js — [Admin portal script]
├── scripts/admin/books.js — [Admin portal script]
├── scripts/admin/dashboard.js — [Admin portal script]
├── scripts/admin/reports.js — [Admin portal script]
├── scripts/admin/search-highlight.js — [Admin portal script]
├── scripts/admin/shared_init.js — [Admin portal script]
├── scripts/admin/users.js — [Admin portal script]
├── scripts/main/recovery.js — [Public/login/registration/recovery page script]
├── scripts/main/registration.js — [Public/login/registration/recovery page script]
├── scripts/main/sign_in.js — [Public/login/registration/recovery page script]
├── scripts/main/welcome.js — [Public/login/registration/recovery page script]
├── scripts/notification/notification.js — [Repository file]
├── scripts/shared/components.js — [Shared frontend component/notification helper]
├── scripts/shared/notification.js — [Shared frontend component/notification helper]
├── scripts/user/account.js — [Student portal script]
├── scripts/user/auth.js — [Student portal script]
├── scripts/user/books.js — [Student portal script]
├── scripts/user/main.js — [Student portal script]
├── scripts/user/manage.js — [Student portal script]
├── scripts/user/notifications.js — [Student portal script]
├── scripts/user/reserve.js — [Student portal script]
├── services/api/_request.js — [Frontend API wrapper module]
├── services/api/auth.js — [Frontend API wrapper module]
├── services/api/books.js — [Frontend API wrapper module]
├── services/api/notification.js — [Frontend API wrapper module]
├── services/api/transaction.js — [Frontend API wrapper module]
├── services/api/users.js — [Frontend API wrapper module]
├── services/state/session.js — [Frontend session/store state helper]
├── services/state/store.js — [Frontend session/store state helper]
├── services/utils/date.js — [Frontend utility helper]
├── services/utils/format.js — [Frontend utility helper]
├── services/utils/storage.js — [Frontend utility helper]
├── services/utils/validate.js — [Frontend utility helper]
├── src/api/admin.py — [Admin rules, reports, deletion confirmation, notifications, health and dashboard handlers]
├── src/api/auth.py — [Authentication, registration, email confirmation, recovery, login/logout handlers]
├── src/api/books.py — [Book/category CRUD and bulk import handlers]
├── src/api/sheets.py — [Google Sheets CSV sync handler (not registered in app.py)]
├── src/api/transaction.py — [Repository file]
├── src/api/transactions.py — [Reservation, borrow, return, force-return, notification lifecycle handlers]
├── src/api/urls.py — [Repository file]
├── src/api/users.py — [User/admin/student management, courses, digital library card, user notifications]
├── src/core/db.py — [MySQL connection helper using Flask request context]
├── src/core/generate_admin_hash.py — [Repository file]
├── src/core/metrics.py — [Prometheus metric definitions]
├── src/core/models.py — [Dataclasses and schema bootstrap DDL]
├── src/core/monitoring_alerts.py — [Repository file]
├── src/core/notifications.py — [Semaphore SMS and in-app notification helpers]
├── src/core/rate_limit_service.py — [Database-backed IP token bucket rate limiting]
├── src/core/scheduler.py — [Scheduler startup for overdue alerts]
├── src/core/security.py — [bcrypt password hashing/verification and admin setup code generator]
├── src/core/seed_demo.py — [Repository file]
├── src/settings.py — [Repository file]
```

## 2.2 Folder Purpose Table

| Folder Path | Purpose | Key Files Inside |
|---|---|---|
| `/` | Flask app root, dependency/config/docs/log artifacts. | `app.py`, `requirements.txt`, `docker-compose.yml`, `Click_and_Collect_System_Diagrams.txt` |
| `src/api/` | Server-side API handlers grouped by domain. | `auth.py`, `books.py`, `transactions.py`, `admin.py`, `users.py`, `sheets.py` |
| `src/core/` | Shared server services: DB, schema, security, notification, metrics, scheduler. | `db.py`, `models.py`, `security.py`, `notifications.py`, `rate_limit_service.py` |
| `scripts/main/` | Browser scripts for welcome, registration, sign-in, account recovery. | `registration.js`, `sign_in.js`, `recovery.js` |
| `scripts/user/` | Student portal browser scripts. | `books.js`, `reserve.js`, `account.js`, `notifications.js`, `manage.js` |
| `scripts/admin/` | Admin portal browser scripts. | `books.js`, `users.js`, `dashboard.js`, `reports.js`, `shared_init.js` |
| `services/api/` | Frontend API wrappers. | `auth.js`, `books.js`, `transaction.js`, `users.js`, `notification.js` |
| `services/state/` | Frontend session/store state utilities. | `session.js`, `store.js` |
| `services/utils/` | Frontend utility helpers. | `validate.js`, `date.js`, `format.js`, `storage.js` |
| `public/pages/` | HTML pages served through Flask routes. | `main/*.html`, `user/*.html`, `admin/*.html` |
| `public/styles/` | CSS for main, user, and admin pages. | `main/*.css`, `user/*.css`, `admin/*.css` |
| `public/assets/` | Static images, icons, logos, fonts. | `logo/*`, `icons/*`, `fonts/fonts.css` |
| `public/components/` | Reusable HTML fragments. | `navbar.html`, `sidebar.html`, `bookCard.html` |
| `monitoring/` | Prometheus configuration. | `prometheus.yml` |
| `logs/` | Checked-in log files. | `security_events.log`, `lbas_access.log`, `admin_access_blocked.log` |

## 2.3 Entry Points

| Type | File/Route | Evidence |
|---|---|---|
| Main Flask app | `app.py` | Flask app is constructed with `template_folder='public/pages'` and `static_folder='public'`. ✅ [VERIFIED FROM: app.py:36-40] |
| Server execution | `python app.py` | `app.run(debug=True, host='0.0.0.0', port=5000)` is under the `__main__` guard. ✅ [VERIFIED FROM: app.py:617-620] |
| Schema initialization | `initialize_schema()` before requests | `ensure_schema_initialized()` calls `initialize_schema()` before first request. ✅ [VERIFIED FROM: app.py:92-102] |
| Environment file | `C:\CC-Config\.env` | dotenv loads this explicit external path. ✅ [VERIFIED FROM: app.py:15-16] |
| Dependency file | `requirements.txt` | Python dependencies are listed there. ✅ [VERIFIED FROM: requirements.txt:1-16] |
| Config file | `src/settings.py` | Email/Semaphore/site settings are read from environment with defaults. ✅ [VERIFIED FROM: src/settings.py:1-18] |
