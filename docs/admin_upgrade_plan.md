# Admin-Side Upgrade Plan (Planning Backlog)

## Priority 1 — Lifecycle correctness + sorting/filtering

### A) Must-have foundation (start here)

#### 1) Book lifecycle status engine
- Final status model:
  - `Available`
  - `Reserved`
  - `Borrowed`
  - `Due` (**derived/computed**, not manually persisted as a primary state)
- Treat `Due` as a rule-based overlay on top of an active borrowed transaction.
- Use admin rule settings (return days/hours, nearest-day behavior) as timing inputs to lifecycle calculations.

**Implementation notes**
- Keep catalog books table lightweight (identity + metadata + quick counters).
- Move active circulation truth to transactions and compute effective status in query/service layer.

#### 2) Transaction truth source
- Complete borrow/reserve transaction tracking with:
  - timestamps (`reserved_at`, `borrowed_at`, `due_at`, `returned_at`)
  - state transitions and actor metadata
- Books table remains catalog + counters (`borrow_count`, availability hints), while transaction rows drive real-time state.

#### 3) Status consistency policy
- A single book can only have **one active circulation state** at a time.
- Enforce transition rules:
  - `Available → Reserved`
  - `Reserved → Borrowed` (pickup)
  - `Borrowed → Available` (return)
  - `Borrowed + now > due_at` ⇒ `Due` flag

**Guardrails**
- Use DB constraints or transactional checks to block invalid concurrent transitions.
- Add API-side idempotency checks for repeated admin/user actions.

### B) Manage Books feature upgrades (admin UX)

#### 1) Advanced sorting controls
Add backend + UI support for sorting by:
- title A→Z
- status (`Available`, `Reserved`, `Borrowed`, `Due`)
- category
- most borrowed (high→low)
- least borrowed (low→high)

#### 2) Multi-filter + search
- Keep existing status filter/search controls and expand API query model.
- Global search across: `book_no`, `title`, `category`.
- Stacked filtering:
  - status
  - category
  - borrow-frequency range

#### 3) Category retention with flexibility
- Keep normalized categories table.
- Continue allowing runtime category creation.
- Add optional “auto-create category on import” setting.

#### 4) Book row operational controls
Per-row actions:
- view history
- force return
- manual override (admin-only, audit required)
- notify borrower

Add contextual status reason tooltip, e.g.:
- “Due because `due_at` passed by X hours.”

---

## Priority 2 — Bulk import wizard

### C) Bulk + Google Sheets (adaptive input) — Part 1

#### 1) Bulk import (CSV/XLSX) with mapping wizard
Use a two-phase flow:
1. **Analyze/preview**
2. **Commit/apply**

Wizard requirements:
- header detection
- column mapping confirmation
- required mapped fields:
  - `book_no`
  - `title`
- optional fields:
  - `category`
  - `status` (subject to lifecycle constraints)
  - metadata extras

#### 2) Import conflict strategy
- Upsert key: `book_no` (unique).
- Execution modes:
  - Insert-only
  - Upsert
  - Dry-run preview

**Safety rule**
- Imported data must not blindly override active circulation state.

---

## Priority 3 — Google Sheets sync

### C) Bulk + Google Sheets (adaptive input) — Part 2

#### 1) Google Sheets connector
MVP controls:
- Connect sheet
- Sync now
- Last sync result

Scope:
- one-way sync (Sheet → app catalog) in initial release

#### 2) Lifecycle-safe sync behavior
- Treat Sheets as catalog source, not transaction source.
- Never overwrite active reserve/borrow state from sheet row status alone.
- Record sync diffs and skipped rows with reasons.

---

## Priority 4 — Reports/logs/server load panel hardening

### D) Rules, alerts, and operations (before user-side)

#### 1) Due-date + warning automation
- Use admin rules for due windows + warning lead time.
- Run scheduled checks and queue reminder notifications.

#### 2) Reports + logs activation
Circulation widgets:
- total by status
- due soon
- overdue
- top borrowed

Operational hardening:
- clean up and normalize security logs before dashboard exposure.
- integrate existing server load check endpoint into admin dashboard visuals.

#### 3) Admin-only desktop optimization
- Keep admin surfaces optimized for desktop/laptop workflows.

---

## Delivery staging checklist

### Stage 1 (Priority 1)
- [ ] Lifecycle state machine finalized and documented.
- [ ] Transaction model/source-of-truth complete.
- [ ] Manage Books API query params support new sort/filter/search.
- [ ] Admin book list UI wired to new query options.

### Stage 2 (Priority 2)
- [ ] CSV/XLSX mapping wizard with dry-run preview shipped.
- [ ] Insert-only/upsert modes with clear conflict reporting.

### Stage 3 (Priority 3)
- [ ] Google Sheets connection + manual sync + last-result logs.
- [ ] Lifecycle-safe update guardrails validated.

### Stage 4 (Priority 4)
- [ ] Due/warning scheduler jobs enabled.
- [ ] Reports/widgets and logs cleaned + activated.
- [ ] Server load panel integrated in admin dashboard.
