ALTER TABLE students
  ADD COLUMN setup_code_hash VARCHAR(255) DEFAULT NULL;

ALTER TABLE students
  ADD COLUMN account_type VARCHAR(10) NOT NULL DEFAULT 'student';
