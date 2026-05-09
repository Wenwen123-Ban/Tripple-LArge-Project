-- Click & Collect database upgrade for admin registration and recovery flows.
-- Paste into MySQL while using the click_and_collect database.
-- This script is designed to be safe to rerun on MySQL/MariaDB servers that
-- allow stored procedures and INFORMATION_SCHEMA reads.

CREATE DATABASE IF NOT EXISTS click_and_collect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE click_and_collect;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(40) NOT NULL UNIQUE,
    lbc_no VARCHAR(40),
    full_name VARCHAR(160) NOT NULL,
    address VARCHAR(255),
    contact_no VARCHAR(40),
    password_hash VARCHAR(255) NOT NULL,
    course VARCHAR(120),
    year_level VARCHAR(40),
    gmail VARCHAR(255) NOT NULL UNIQUE,
    is_verified TINYINT(1) DEFAULT 0,
    account_type VARCHAR(20) DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(40) NOT NULL UNIQUE,
    lbc_no VARCHAR(40),
    full_name VARCHAR(160) NOT NULL,
    address VARCHAR(255),
    contact_no VARCHAR(40),
    password_hash VARCHAR(255) NOT NULL,
    gmail VARCHAR(255) NOT NULL UNIQUE,
    is_verified TINYINT(1) DEFAULT 0,
    setup_code_hash VARCHAR(255),
    last_login_ip VARCHAR(80),
    last_login_time DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pending_confirmations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    gmail VARCHAR(255) NOT NULL,
    confirmed TINYINT(1) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'student',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pending_gmail (gmail),
    INDEX idx_pending_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recovery_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(40) NOT NULL,
    code VARCHAR(12) NOT NULL,
    used TINYINT(1) DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recovery_student (student_id),
    INDEX idx_recovery_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(40) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    ip_address VARCHAR(80),
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_security_created (created_at),
    INDEX idx_security_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE PROCEDURE cc_add_column_if_missing(
    IN table_name_in VARCHAR(64),
    IN column_name_in VARCHAR(64),
    IN column_definition_in TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_in
          AND COLUMN_NAME = column_name_in
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', table_name_in, '` ADD COLUMN ', column_definition_in);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL cc_add_column_if_missing('students', 'account_type', "`account_type` VARCHAR(20) DEFAULT 'student'");
CALL cc_add_column_if_missing('pending_confirmations', 'confirmed', '`confirmed` TINYINT(1) DEFAULT 0');
CALL cc_add_column_if_missing('pending_confirmations', 'type', "`type` VARCHAR(20) DEFAULT 'student'");
CALL cc_add_column_if_missing('admins', 'setup_code_hash', '`setup_code_hash` VARCHAR(255)');
CALL cc_add_column_if_missing('admins', 'last_login_ip', '`last_login_ip` VARCHAR(80)');
CALL cc_add_column_if_missing('admins', 'last_login_time', '`last_login_time` DATETIME NULL');


-- Account deletion, bell notifications, and auto-management rules.
CALL cc_add_column_if_missing('students', 'deleted_at', '`deleted_at` DATETIME DEFAULT NULL');
CALL cc_add_column_if_missing('students', 'deleted_by', '`deleted_by` VARCHAR(40) DEFAULT NULL');
CALL cc_add_column_if_missing('students', 'last_active', '`last_active` DATETIME DEFAULT CURRENT_TIMESTAMP');
CALL cc_add_column_if_missing('admins', 'deleted_at', '`deleted_at` DATETIME DEFAULT NULL');
CALL cc_add_column_if_missing('admins', 'deleted_by', '`deleted_by` VARCHAR(40) DEFAULT NULL');
CALL cc_add_column_if_missing('admins', 'last_active', '`last_active` DATETIME DEFAULT CURRENT_TIMESTAMP');

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id VARCHAR(40) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT,
    data TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_recipient (recipient_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deletion_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requested_by VARCHAR(40) NOT NULL,
    target_id VARCHAR(40) NOT NULL,
    target_type VARCHAR(10) NOT NULL,
    code VARCHAR(10) NOT NULL,
    confirmed_email TINYINT(1) DEFAULT 0,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_deletion_codes_request (requested_by, target_id, used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_rules (
    id INT PRIMARY KEY,
    nearest_day_rule TINYINT(1) DEFAULT 1,
    return_days INT NULL,
    return_hours INT NULL,
    expire_days INT NULL,
    expire_hours INT NULL,
    expire_mins INT DEFAULT 30,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL cc_add_column_if_missing('admin_rules', 'expiry_enabled', '`expiry_enabled` TINYINT(1) DEFAULT 0');
CALL cc_add_column_if_missing('admin_rules', 'expiry_years', '`expiry_years` INT NULL');
CALL cc_add_column_if_missing('admin_rules', 'inactive_enabled', '`inactive_enabled` TINYINT(1) DEFAULT 0');
CALL cc_add_column_if_missing('admin_rules', 'inactive_days', '`inactive_days` INT NULL');
CALL cc_add_column_if_missing('admin_rules', 'warn_enabled', '`warn_enabled` TINYINT(1) DEFAULT 0');
CALL cc_add_column_if_missing('admin_rules', 'warn_before_days', '`warn_before_days` INT DEFAULT 30');


DROP PROCEDURE cc_add_column_if_missing;

UPDATE students
SET account_type = 'student'
WHERE account_type IS NULL OR account_type = '';

DELETE FROM pending_confirmations
WHERE expires_at <= NOW();
