"""Core data models and database bootstrap helpers."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from src.core.db import get_db


@dataclass(frozen=True)
class User:
    id: Optional[int] = None
    student_id: str = ''
    full_name: str = ''
    gmail: str = ''
    role: str = 'student'
    lbc_no: Optional[str] = None
    contact_no: Optional[str] = None
    course: Optional[str] = None
    year_level: Optional[str] = None
    is_verified: bool = False


@dataclass(frozen=True)
class Book:
    id: Optional[int] = None
    book_no: str = ''
    title: str = ''
    category_id: Optional[int] = None
    status: str = 'Available'
    availability_hint: str = 'Available'
    borrow_count: int = 0
    reserve_count: int = 0


@dataclass(frozen=True)
class Reservation:
    id: Optional[int] = None
    book_id: Optional[int] = None
    book_no: str = ''
    student_id: str = ''
    reserved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    status: str = 'reserved'


@dataclass(frozen=True)
class BorrowRecord:
    id: Optional[int] = None
    book_id: Optional[int] = None
    book_no: str = ''
    student_id: str = ''
    borrowed_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    status: str = 'borrowed'


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
            last_login_ip VARCHAR(80) DEFAULT NULL,
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
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL UNIQUE,
            deleted_at DATETIME DEFAULT NULL,
            delete_expires_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_no VARCHAR(60) NOT NULL,
            title VARCHAR(255) NOT NULL,
            category_id INT NULL,
            status VARCHAR(40) DEFAULT 'Available',
            reserved_count INT DEFAULT 0,
            borrowed_count INT DEFAULT 0,
            borrow_count INT DEFAULT 0,
            reserve_count INT DEFAULT 0,
            availability_hint VARCHAR(20) DEFAULT 'Available',
            deleted_at DATETIME DEFAULT NULL,
            delete_expires_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_books_category (category_id),
            INDEX idx_books_status (status),
            UNIQUE KEY uniq_books_no_category (book_no, category_id),
            CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            book_no VARCHAR(60) NOT NULL,
            student_id VARCHAR(40) NOT NULL,
            action VARCHAR(20) NOT NULL,
            actor_admin_id VARCHAR(40) DEFAULT NULL,
            reserved_at DATETIME DEFAULT NULL,
            borrowed_at DATETIME DEFAULT NULL,
            due_at DATETIME DEFAULT NULL,
            returned_at DATETIME DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_transactions_student (student_id),
            INDEX idx_transactions_book (book_id),
            INDEX idx_transactions_action_created (action, created_at),
            INDEX idx_transactions_student_action (student_id, action),
            CONSTRAINT fk_transactions_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
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
            account_type VARCHAR(20) DEFAULT 'unknown',
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
            is_used TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_recipient_created (recipient_id, created_at)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_rules (
            id INT PRIMARY KEY DEFAULT 1,
            return_days INT DEFAULT 0,
            return_hours INT DEFAULT 0,
            expire_days INT DEFAULT 0,
            expire_hours INT DEFAULT 0,
            expire_mins INT DEFAULT 30,
            book_delete_grace_mins INT DEFAULT 20,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute("INSERT IGNORE INTO admin_rules (id) VALUES (1)")

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
