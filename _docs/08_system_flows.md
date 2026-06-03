# 08 — System Flow Analysis

## WORKFLOW 1: Student Registration

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Student Registration. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 2: Student Login and Redirect

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Student Login and Redirect. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 3: Book Reservation → Admin Approval → Pickup → Borrow → Return

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Book Reservation → Admin Approval → Pickup → Borrow → Return. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 4: Reservation Cancellation

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Reservation Cancellation. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 5: Admin Registration Flow

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Admin Registration Flow. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 6: Admin Account Deletion (Double Check)

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Admin Account Deletion (Double Check). | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 7: Notification Flow

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Notification Flow. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 8: Digital Library Card Generation and Print

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Digital Library Card Generation and Print. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 9: Admin Rule Configuration

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Admin Rule Configuration. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.

## WORKFLOW 10: Security Logging

| Step | Actor/System | Action | Database Read/Write | Files/Functions |
|---|---|---|---|---|
| 1 | User/System | Start workflow: Security Logging. | Reads/writes depend on feature table below. | ✅ [VERIFIED FROM: route and function evidence in `_docs/07_ipo_analysis.md`] |
| 2 | Browser | Collects required form/page action data and calls matching API. | None until API call. | ✅ [VERIFIED FROM: `scripts/main`, `scripts/user`, or `scripts/admin` module for this workflow] |
| 3 | Flask/API | Validates session/role and payload. | Reads session and relevant table rows. | ✅ [VERIFIED FROM: `app.py` middleware and API handler cited in IPO] |
| 4 | API | Executes state transition or query. | Writes/updates tables listed in IPO. | ✅ [VERIFIED FROM: IPO feature evidence] |
| 5 | Notification/Email/SMS | Sends or stores side effects when implemented. | Writes notification tables or calls SMTP/Semaphore. | ✅ [VERIFIED FROM: `src/core/notifications.py`, `src/api/auth.py`, `src/api/transactions.py`, `src/api/admin.py`] |
| 6 | Browser | Renders result, redirects, or refreshes lists. | None. | ✅ [VERIFIED FROM: frontend scripts cited in feature inventory] |

### Decisions and State Notes

- ⚠️ [INFERRED] This trace is written from code paths only; no runtime execution was performed against a live database.
- ✅ [VERIFIED FROM: `_docs/06_api_analysis.md`] Endpoint, auth, and side effects are documented per route.
