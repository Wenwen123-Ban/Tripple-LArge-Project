# 03 — Technology Stack

| Layer | Technology | Version | Evidence File |
|---|---|---|---|
| Backend language | Python | runtime not pinned; Flask>=3.0,<4.0 | ✅ [VERIFIED FROM: requirements.txt:1] |
| Backend framework | Flask | >=3.0,<4.0 | ✅ [VERIFIED FROM: requirements.txt:1; app.py:36-40] |
| Additional framework dependency | Django | >=5.0,<6.0 (email-compatible helpers/settings present, not main app) | ✅ [VERIFIED FROM: requirements.txt:2; src/settings.py:3] |
| Database connector | mysql-connector-python | >=9.0,<10.0 | ✅ [VERIFIED FROM: requirements.txt:4; src/core/db.py:3-16] |
| Database engine | MySQL | server version not pinned | ✅ [VERIFIED FROM: src/core/db.py:8-15] |
| Password hashing | bcrypt | >=4.0,<5.0 | ✅ [VERIFIED FROM: requirements.txt:5; src/core/security.py:1-16] |
| System metrics | prometheus_client | not listed in requirements.txt ⚠️ [INFERRED installed externally] | ✅ [VERIFIED FROM: app.py:10, app.py:200-202] |
| System metrics collection | psutil | unbounded in requirements.txt | ✅ [VERIFIED FROM: requirements.txt:6; app.py:218-220] |
| Excel import | openpyxl | unbounded in requirements.txt | ✅ [VERIFIED FROM: requirements.txt:8; src/api/books.py:6] |
| Email SMTP | smtplib / Django SMTP settings | stdlib / Django settings | ✅ [VERIFIED FROM: src/api/auth.py:8; src/settings.py:3-11] |
| SMS provider | Semaphore API | external API URL constant | ✅ [VERIFIED FROM: src/core/notifications.py:12] |
| Frontend language | JavaScript ES modules | browser-native | ✅ [VERIFIED FROM: scripts/main/registration.js:1-7] |
| CSS | Custom CSS | no CSS framework dependency file found | ✅ [VERIFIED FROM: public/styles/admin/admin_dashboard.css; public/styles/user/user_card.css] |
| Monitoring config | Prometheus | image/version not pinned | ✅ [VERIFIED FROM: monitoring/prometheus.yml] |

## Separately Identified Components

- Backend language/framework: ✅ [VERIFIED FROM: app.py:1, app.py:36-40] Python + Flask.
- Frontend language/framework: ✅ [VERIFIED FROM: scripts/main/registration.js:1-7] Browser JavaScript modules; no React/Vue/Angular package file was found.
- Database engine/connector: ✅ [VERIFIED FROM: src/core/db.py:8-16] MySQL through `mysql.connector.connect()`.
- Email/SMTP: ✅ [VERIFIED FROM: src/api/auth.py:167-185; src/settings.py:3-11] `smtplib.SMTP` and Gmail-compatible SMTP defaults.
- SMS provider: ✅ [VERIFIED FROM: src/core/notifications.py:12-64] Semaphore API endpoint and request payload.
- Authentication libraries: ✅ [VERIFIED FROM: src/core/security.py:1-16] bcrypt for password/setup-code verification; Flask sessions in `app.py`/`auth.py`.
- External APIs/services: ✅ [VERIFIED FROM: src/api/sheets.py:19-31] Google Sheets CSV export via public URL; ✅ [VERIFIED FROM: src/core/notifications.py:12] Semaphore SMS; ✅ [VERIFIED FROM: monitoring/prometheus.yml] Prometheus config.
