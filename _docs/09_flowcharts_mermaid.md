# 09 — Flowcharts (Mermaid)

✅ [VERIFIED FROM: `_docs/06_api_analysis.md` and `_docs/07_ipo_analysis.md`] These diagrams map documented code paths.

## Overall System Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Student Registration Flowchart

```mermaid
flowchart TD
 A[Open registration] --> B[Enter student details]
 B --> C[Prevalidate fields]
 C --> D{Valid Gmail and fields?}
 D -- No --> E[Show error]
 D -- Yes --> F[Send confirmation email]
 F --> G[Confirm token]
 G --> H[Insert student row]
```

## Student Login Flowchart

```mermaid
flowchart TD
 A[Enter ID/password] --> B[POST login]
 B --> C{Admin found?}
 C -- Yes --> D[Verify bcrypt]
 C -- No --> E[Check student]
 D --> F[Admin session redirect]
 E --> G{Student verified?}
 G -- Yes --> H[Student session redirect]
 G -- No --> I[Error]
```

## Admin Login Flowchart

```mermaid
flowchart TD
 A[Enter ID/password] --> B[POST login]
 B --> C{Admin found?}
 C -- Yes --> D[Verify bcrypt]
 C -- No --> E[Check student]
 D --> F[Admin session redirect]
 E --> G{Student verified?}
 G -- Yes --> H[Student session redirect]
 G -- No --> I[Error]
```

## Book Reservation Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Full Book Lifecycle

```mermaid
flowchart TD
 A[Available] --> B[Reserved]
 B --> C[Borrowed]
 C --> D{Due date passed?}
 D -- Yes --> E[Due/Overdue]
 D -- No --> F[Return allowed]
 E --> G[Returned or Force Returned]
 F --> G
 G --> A
```

## Admin Approval Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Cancellation Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Notification System Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Admin Account Deletion Flowchart

```mermaid
flowchart TD
 A[Requester selects admin] --> B[Email target]
 B --> C{Target confirms link?}
 C -- No --> D[Expire/fail]
 C -- Yes --> E[Notify requester with code]
 E --> F{Requester enters code?}
 F -- Yes --> G[Soft-delete admin]
 F -- No --> H[Reject]
```

## Digital Library Card + Print Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Bulk Import Flowchart

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Account Recovery Flowchart (Student)

```mermaid
flowchart TD
 A[Start] --> B[Browser action]
 B --> C[API request]
 C --> D{Validation/session ok?}
 D -- No --> E[Error response]
 D -- Yes --> F[Read/write database]
 F --> G[Send notification if applicable]
 G --> H[Render/update UI]
```

## Account Recovery Flowchart (Admin, time-window restricted)

```mermaid
flowchart TD
 A[Enter admin ID] --> B{Within Mon-Fri 8-5?}
 B -- No --> C[Block and log]
 B -- Yes --> D[Send Gmail code]
 D --> E[Enter code + recovery key]
 E --> F{Valid?}
 F -- Yes --> G[Update password]
 F -- No --> H[Error/log]
```
