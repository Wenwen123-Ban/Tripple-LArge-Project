CREATE DATABASE IF NOT EXISTS click_and_collect;
USE click_and_collect;

-- Core student table
CREATE TABLE IF NOT EXISTS students (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    student_id       VARCHAR(10)  NOT NULL UNIQUE,  -- format YYYY-NNNNN
    lbc_no           VARCHAR(15),                   -- format XXXX-XXXXX, admin managed
    full_name        VARCHAR(120) NOT NULL,
    address          VARCHAR(255),
    contact_no       VARCHAR(20),
    password_hash    VARCHAR(255) NOT NULL,
    course           VARCHAR(80),                   -- NULL or N/A = high school
    year_level       VARCHAR(10),
    gmail            VARCHAR(120) NOT NULL UNIQUE,
    is_verified      TINYINT(1)   DEFAULT 0,
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- Temp email confirmation tokens (cleared after use)
CREATE TABLE IF NOT EXISTS pending_confirmations (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    token        VARCHAR(120) NOT NULL UNIQUE,
    gmail        VARCHAR(120) NOT NULL,
    confirmed    TINYINT(1) DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME NOT NULL
);

-- Temp recovery codes (cleared after use)
CREATE TABLE IF NOT EXISTS recovery_codes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   VARCHAR(10)  NOT NULL,
    code         VARCHAR(10)  NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME NOT NULL,
    used         TINYINT(1) DEFAULT 0
);

-- Keep existing XAMPP databases compatible if the table was created before confirmed tracking.
ALTER TABLE pending_confirmations
    ADD COLUMN IF NOT EXISTS confirmed TINYINT(1) DEFAULT 0 AFTER gmail;
