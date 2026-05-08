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

-- Admin account typing (student/admin) for management screens.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'student' AFTER is_verified;

-- Admin recovery hardening and login audit fields.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS recovery_key_hash VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS last_login_time DATETIME DEFAULT NULL;

CREATE TABLE IF NOT EXISTS security_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   VARCHAR(10)  NOT NULL,
    event_type   VARCHAR(50)  NOT NULL,
    ip_address   VARCHAR(45),
    description  VARCHAR(255),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin-managed courses.
CREATE TABLE IF NOT EXISTS courses (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin-managed book categories.
CREATE TABLE IF NOT EXISTS categories (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin-managed books.
CREATE TABLE IF NOT EXISTS books (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    book_no        VARCHAR(60) NOT NULL UNIQUE,
    title          VARCHAR(255) NOT NULL,
    category_id    INT NULL,
    status         VARCHAR(40) DEFAULT 'Available',
    reserved_count INT DEFAULT 0,
    borrowed_count INT DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin rules and audit logs.
CREATE TABLE IF NOT EXISTS admin_rules (
    id               INT PRIMARY KEY,
    nearest_day_rule TINYINT(1) DEFAULT 1,
    return_days      INT NULL,
    return_hours     INT NULL,
    expire_days      INT NULL,
    expire_hours     INT NULL,
    expire_mins      INT DEFAULT 30,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(40),
    direction  VARCHAR(20),
    action     VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
