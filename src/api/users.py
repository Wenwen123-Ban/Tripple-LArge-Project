"""Admin user and course API handlers."""

from datetime import datetime

import mysql.connector
from flask import jsonify, request, session

try:
    from src.core.db import get_db
    from src.api.auth import log_security_event, send_deletion_email_student
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from src.core.db import get_db
    from src.api.auth import log_security_event, send_deletion_email_student


def _payload():
    return request.get_json(silent=True) or {}


def _ensure_course_table(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS courses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def _ensure_account_type(cursor):
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN account_type VARCHAR(20) DEFAULT 'student'")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_admins_table(cursor):
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def get_users():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type(cursor)
    _ensure_admins_table(cursor)
    _ensure_deletion_columns(cursor)
    cursor.execute(
        """
        SELECT id, student_id, NULL AS admin_id, lbc_no, full_name, address,
               contact_no, course, year_level, gmail,
               COALESCE(account_type, 'student') AS account_type,
               created_at
        FROM students
        WHERE deleted_at IS NULL
        UNION ALL
        SELECT id, NULL AS student_id, admin_id, lbc_no, full_name, address,
               contact_no, NULL AS course, NULL AS year_level, gmail,
               'admin' AS account_type, created_at
        FROM admins
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
        """
    )
    rows = cursor.fetchall()
    cursor.close()
    return jsonify(rows)


def update_user(id):
    data = _payload()
    db = get_db()
    cursor = db.cursor()
    _ensure_account_type(cursor)
    fields = []
    values = []
    for field in ('lbc_no', 'address', 'contact_no', 'course', 'year_level'):
        if field in data:
            fields.append(f"{field} = %s")
            values.append(data.get(field))
    if not fields:
        cursor.close()
        return jsonify({'error': 'No supported fields supplied'}), 400
    values.append(id)
    cursor.execute(f"UPDATE students SET {', '.join(fields)} WHERE id = %s", values)
    db.commit()
    cursor.close()
    return jsonify({'status': 'updated'})


def get_courses():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_course_table(cursor)
    cursor.execute("SELECT id, name FROM courses ORDER BY name")
    rows = cursor.fetchall()
    cursor.close()
    return jsonify(rows)


def add_course():
    name = str(_payload().get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Course name is required'}), 400
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_course_table(cursor)
    try:
        cursor.execute("INSERT INTO courses (name) VALUES (%s)", (name,))
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'name': name}), 201
    except mysql.connector.IntegrityError:
        db.rollback()
        return jsonify({'error': 'Course already exists'}), 409
    finally:
        cursor.close()


def delete_course(id):
    db = get_db()
    cursor = db.cursor()
    _ensure_course_table(cursor)
    cursor.execute("DELETE FROM courses WHERE id = %s", (id,))
    db.commit()
    cursor.close()
    return jsonify({'status': 'deleted'})

def _ensure_deletion_columns(cursor):
    for table, id_col in (('students', 'deleted_by'), ('admins', 'deleted_by')):
        for ddl in (
            f"ALTER TABLE {table} ADD COLUMN deleted_at DATETIME DEFAULT NULL",
            f"ALTER TABLE {table} ADD COLUMN {id_col} VARCHAR(40) DEFAULT NULL",
            f"ALTER TABLE {table} ADD COLUMN last_active DATETIME DEFAULT CURRENT_TIMESTAMP",
        ):
            try:
                cursor.execute(ddl)
            except mysql.connector.Error as exc:
                if exc.errno != 1060:
                    raise


def delete_user(student_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type(cursor)
    _ensure_deletion_columns(cursor)

    cursor.execute(
        """
        SELECT student_id, full_name, gmail
        FROM students
        WHERE student_id = %s
          AND deleted_at IS NULL
        """,
        (student_id,),
    )
    student = cursor.fetchone()
    if not student:
        cursor.close()
        return jsonify({'error': 'Student not found'}), 404

    admin_id = session.get('admin_id') or 'System'
    admin_gmail = session.get('admin_gmail') or ''
    if not admin_gmail and admin_id != 'System':
        cursor.execute("SELECT gmail FROM admins WHERE admin_id = %s", (admin_id,))
        admin_row = cursor.fetchone() or {}
        admin_gmail = admin_row.get('gmail') or ''

    deleted_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute(
        """
        UPDATE students
        SET deleted_at = NOW(), deleted_by = %s
        WHERE student_id = %s
        """,
        (admin_id, student_id),
    )
    db.commit()
    cursor.close()

    try:
        send_deletion_email_student(
            student['gmail'],
            student['full_name'],
            admin_id,
            admin_gmail,
            deleted_at,
        )
    except Exception as exc:
        print(f"Student deletion email error: {exc}")

    log_security_event(
        admin_id,
        'STUDENT_DELETED',
        request.remote_addr,
        f'Deleted student {student_id}',
    )

    return jsonify({'status': 'deleted'})
