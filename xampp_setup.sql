CREATE TABLE IF NOT EXISTS transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    book_id         INT          NOT NULL,
    book_no         VARCHAR(20)  NOT NULL,
    student_id      VARCHAR(10)  NOT NULL,
    action          VARCHAR(20)  NOT NULL,
    actor_admin_id  VARCHAR(10)  DEFAULT NULL,
    reserved_at     DATETIME     DEFAULT NULL,
    borrowed_at     DATETIME     DEFAULT NULL,
    due_at          DATETIME     DEFAULT NULL,
    returned_at     DATETIME     DEFAULT NULL,
    notes           TEXT         DEFAULT NULL,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS borrow_count      INT      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserve_count     INT      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_hint VARCHAR(20) DEFAULT 'Available';

CREATE INDEX IF NOT EXISTS idx_transactions_book
  ON transactions(book_id, action, returned_at);

CREATE INDEX IF NOT EXISTS idx_transactions_student
  ON transactions(student_id, action);
