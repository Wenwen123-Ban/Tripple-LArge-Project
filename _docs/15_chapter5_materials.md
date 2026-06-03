# 15 — Chapter 5 Materials: Summary, Conclusions, and Recommendations

## 15.1 Summary of the Study

✅ [VERIFIED FROM: app.py:291-615] The repository implements a Flask/MySQL web-based Click & Collect LBAS for student registration/login, catalog management, reservation/borrowing/return workflows, user/admin management, notifications, digital library cards, security logging, health checks, and admin-configurable rules.

## 15.2 Conclusions

- Conclusion 1: The system successfully implements student Gmail-confirmed registration as evidenced by `register_student()` requiring a confirmed token and inserting a student record. ✅ [VERIFIED FROM: src/api/auth.py:752-869]
- Conclusion 2: The system successfully implements role-based login redirects for admins and students. ✅ [VERIFIED FROM: src/api/auth.py:1950-2126]
- Conclusion 3: The system successfully implements book/category administration and bulk import. ✅ [VERIFIED FROM: src/api/books.py:147-355]
- Conclusion 4: The system successfully implements reservation-to-borrow-to-return lifecycle records through `transactions.action`. ✅ [VERIFIED FROM: src/api/transactions.py:250-554]
- Conclusion 5: The system successfully implements in-app notifications and SMS helper delivery. ✅ [VERIFIED FROM: src/api/transactions.py:207-238; src/core/notifications.py:29-88]
- Conclusion 6: The system successfully implements digital library-card data and binary strip rendering. ✅ [VERIFIED FROM: src/api/users.py:403-510; scripts/user/account.js:1-47]

## 15.3 Recommendations

- Recommendation 1: Register and protect `/api/sheets/sync`, or remove the frontend button, because the sync function exists but is not route-wired. ✅ [VERIFIED FROM: src/api/sheets.py:33-85; scripts/admin/books.js:84]
- Recommendation 2: Hash recovery/deletion codes or store only digests because they are currently inserted as plaintext. ✅ [VERIFIED FROM: src/api/auth.py:1048-1066; src/api/admin.py:386-406]
- Recommendation 3: Add an explicit approval/ready-for-pickup state if the research requirement distinguishes approval from borrowing; current approval button calls borrow. ✅ [VERIFIED FROM: scripts/admin/dashboard.js:18-27; src/api/transactions.py:359-440]
- Recommendation 4: Implement fine calculation if fines are required; card payload currently returns zero. ✅ [VERIFIED FROM: src/api/users.py:493]
- Recommendation 5: Fix duplicate `snapshot_date` in schema bootstrap before deployment. ✅ [VERIFIED FROM: src/core/models.py:209-218]

## 15.4 System Limitations

- Limitation 1: Requires server and MySQL connectivity; no offline mode is present. ✅ [VERIFIED FROM: src/core/db.py:8-16]
- Limitation 2: No mobile-native packaging is present. ✅ [VERIFIED FROM: repository structure in `_docs/02_repository_structure.md`]
- Limitation 3: Some production security values have insecure development fallbacks if environment variables are absent. ✅ [VERIFIED FROM: app.py:41-52]
- Limitation 4: Google Sheets sync is partially implemented but not registered. ✅ [VERIFIED FROM: src/api/sheets.py:33-85]

## 15.5 Future Enhancements

- Enhancement 1: Add PWA/mobile install support for student card access.
- Enhancement 2: Add hashed/expiring one-time code storage for recovery and admin deletion.
- Enhancement 3: Add a distinct `approved`/`ready_for_pickup` transaction action if needed by policy.
- Enhancement 4: Add fine/penalty computation and payment tracking.
- Enhancement 5: Add automated tests and migrations instead of runtime schema mutation.
