CREATE DATABASE IF NOT EXISTS click_and_collect;
USE click_and_collect;

DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS pending_confirmations;
DROP TABLE IF EXISTS recovery_codes;
DROP TABLE IF EXISTS security_logs;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS admin_rules;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS courses;

CREATE TABLE students (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    student_id       VARCHAR(10)  NOT NULL UNIQUE,
    lbc_no           VARCHAR(10)  NOT NULL,
    full_name        VARCHAR(120) NOT NULL,
    address          VARCHAR(255),
    contact_no       CHAR(11)     NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    course           VARCHAR(80),
    year_level       VARCHAR(10),
    gmail            VARCHAR(120) NOT NULL UNIQUE,
    is_verified      TINYINT(1)   DEFAULT 0,
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    admin_id          VARCHAR(10)  NOT NULL UNIQUE,
    lbc_no            VARCHAR(10)  NOT NULL,
    full_name         VARCHAR(120) NOT NULL,
    address           VARCHAR(255),
    contact_no        CHAR(11)     NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    gmail             VARCHAR(120) NOT NULL UNIQUE,
    is_verified       TINYINT(1)   DEFAULT 0,
    setup_code_hash   VARCHAR(255) DEFAULT NULL,
    last_login_ip     VARCHAR(45)  DEFAULT NULL,
    last_login_time   DATETIME     DEFAULT NULL,
    recovery_key_hash VARCHAR(255) DEFAULT NULL,
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE categories (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE books (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    book_no     VARCHAR(20)  NOT NULL UNIQUE,
    title       VARCHAR(200) NOT NULL,
    category_id INT,
    status      VARCHAR(30)  DEFAULT 'Available',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL
);

CREATE TABLE pending_confirmations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(120) NOT NULL UNIQUE,
    gmail      VARCHAR(120) NOT NULL,
    type       VARCHAR(10)  DEFAULT 'student',
    confirmed  TINYINT(1)   DEFAULT 0,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME     NOT NULL
);

CREATE TABLE recovery_codes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    account_id   VARCHAR(10)  NOT NULL,
    account_type VARCHAR(10)  DEFAULT 'student',
    code         VARCHAR(10)  NOT NULL,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    expires_at   DATETIME     NOT NULL,
    used         TINYINT(1)   DEFAULT 0
);

CREATE TABLE security_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    account_id   VARCHAR(10)  NOT NULL,
    account_type VARCHAR(10)  DEFAULT 'student',
    event_type   VARCHAR(50)  NOT NULL,
    ip_address   VARCHAR(45),
    description  VARCHAR(255),
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_rules (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    nearest_day_rule  TINYINT(1) DEFAULT 1,
    return_days       INT        DEFAULT NULL,
    return_hours      INT        DEFAULT NULL,
    expire_days       INT        DEFAULT NULL,
    expire_hours      INT        DEFAULT NULL,
    expire_mins       INT        DEFAULT 30,
    updated_at        DATETIME   DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO admin_rules (nearest_day_rule, expire_mins)
VALUES (1, 30);

INSERT INTO admins (
    admin_id,
    lbc_no,
    full_name,
    address,
    contact_no,
    password_hash,
    gmail,
    is_verified
) VALUES (
    '2026-00001',
    '0000-00001',
    'System Administrator',
    'NMSC-ST Library',
    '00000000000',
    'PASTE_PASSWORD_HASH_HERE',
    'admin@clickandcollect.local',
    1
);
