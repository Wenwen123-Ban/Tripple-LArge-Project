"""Database bootstrap helpers for local testing."""

from src.core.db import get_db


def initialize_schema():
    """Create all tables required by API flows used in testing."""
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
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
            deleted_at DATETIME DEFAULT NULL,
            deleted_by VARCHAR(40) DEFAULT NULL,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pending_confirmations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(255) NOT NULL UNIQUE,
            gmail VARCHAR(255) NOT NULL,
            confirmed TINYINT(1) DEFAULT 0,
            type VARCHAR(20) DEFAULT 'student',
            setup_code_temp VARCHAR(50) DEFAULT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


    cursor.execute(
        """
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
            deleted_at DATETIME DEFAULT NULL,
            deleted_by VARCHAR(40) DEFAULT NULL,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS recovery_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(40) NOT NULL,
            code VARCHAR(12) NOT NULL,
            used TINYINT(1) DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS security_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(40) NOT NULL,
            event_type VARCHAR(80) NOT NULL,
            ip_address VARCHAR(80),
            description VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recipient_id VARCHAR(40) NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(120) NOT NULL,
            message TEXT,
            data TEXT,
            is_read TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS deletion_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            requested_by VARCHAR(40) NOT NULL,
            target_id VARCHAR(40) NOT NULL,
            target_type VARCHAR(10) NOT NULL,
            code VARCHAR(10) NOT NULL,
            confirmed_email TINYINT(1) DEFAULT 0,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    db.commit()
    cursor.close()
