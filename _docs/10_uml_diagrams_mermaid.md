# 10 — UML Diagrams (Mermaid)

## 10.1 Use Case Diagram

```mermaid
graph LR
    Student[Student] --- UC1[Register with Gmail]
    Student --- UC2[Login]
    Student --- UC3[Browse/Search Books]
    Student --- UC4[Reserve Book]
    Student --- UC5[Cancel Reservation]
    Student --- UC6[View Notifications]
    Student --- UC7[View/Print Digital Library Card]
    Admin[Admin/Librarian] --- UC8[Manage Books/Categories]
    Admin --- UC9[Approve/Borrow Reservation]
    Admin --- UC10[Return or Force Return]
    Admin --- UC11[Manage Users/Admins]
    Admin --- UC12[Configure Rules]
    Admin --- UC13[View Security Reports]
    System[System] --- UC14[Send Email/SMS]
    System --- UC15[Record Security Logs]
```

## 10.2 Class Diagram

```mermaid
classDiagram
    class Student { +student_id: string +full_name: string +gmail: string +password_hash: string +is_verified: bool }
    class Admin { +admin_id: string +full_name: string +gmail: string +setup_code_hash: string }
    class Book { +id: int +book_no: string +title: string +status: string +availability_hint: string }
    class Category { +id: int +name: string }
    class Transaction { +id: int +book_id: int +student_id: string +action: string +due_at: datetime +returned_at: datetime }
    class Notification { +id: int +recipient_id: string +type: string +is_read: bool +is_used: bool }
    Category "1" --> "many" Book
    Book "1" --> "many" Transaction
    Student "1" --> "many" Transaction
    Student "1" --> "many" Notification
    Admin "1" --> "many" Notification
```

## 10.3 Sequence Diagram — Book Reservation

```mermaid
sequenceDiagram
    participant Browser
    participant Flask
    participant DB
    participant SMS as Notification/SMS
    Browser->>Flask: POST /api/transactions/reserve
    Flask->>DB: Check effective book status and duplicate reservation
    Flask->>DB: Insert reserved transaction
    Flask->>DB: Update queue/book availability
    Flask->>DB: Insert admin/student notifications
    Flask-->>Browser: {status: reserved, transaction_id, queue_position}
```

## 10.4 Sequence Diagram — Login

```mermaid
sequenceDiagram
    participant Browser
    participant Flask
    participant DB
    participant Session
    Browser->>Flask: POST /api/auth/login
    Flask->>DB: Lookup admin, then student
    Flask->>DB: Verify bcrypt password hash
    Flask->>Session: Set role-specific keys and auth_token
    Flask->>DB: Update last_login and log event
    Flask-->>Browser: redirect and session token
```

## 10.5 Activity Diagram — Full Borrow Lifecycle

```mermaid
flowchart TD
    A[Available Book] --> B[Student reserves]
    B --> C[Reserved transaction]
    C --> D[Admin approves by borrowing]
    D --> E[Borrowed transaction with due date]
    E --> F{Returned before/after due?}
    F --> G[Return endpoint]
    G --> H[Book status synced]
```

## 10.6 Activity Diagram — Admin Notification Flow

```mermaid
flowchart TD
    A[Reservation or deletion event] --> B[Insert notifications/admin_notifications]
    B --> C[Admin bell fetches /admin/notifications/]
    C --> D[Badge uses unread_count]
    D --> E[Admin opens notification]
    E --> F[Mark read or use deletion code]
```

✅ [VERIFIED FROM: src/core/models.py:7-45; src/api/transactions.py:250-440; src/api/auth.py:1950-2126; scripts/admin/shared_init.js:130-226]
