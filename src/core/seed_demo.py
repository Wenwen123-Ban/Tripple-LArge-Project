"""Demo seed helpers for local test runs."""

from src.core.db import get_db
from src.core.models import initialize_schema
from src.core.security import hash_password


def seed_demo_data():
    """Insert minimal demo rows so UI can display and retrieve data immediately."""
    initialize_schema()
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO students
            (student_id, lbc_no, full_name, address, contact_no,
             password_hash, course, year_level, gmail, is_verified, account_type)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 'student')
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
        """,
        (
            '2026-0001',
            'LBC-TEST-001',
            'Demo Student',
            'Testing Address',
            '09123456789',
            hash_password('DemoPass123!'),
            'BSIT',
            '3',
            'demo.student@gmail.com',
        ),
    )

    db.commit()
    cursor.close()
