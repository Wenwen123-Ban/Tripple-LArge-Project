"""Admin user and course API handlers."""

import mysql.connector
from flask import jsonify, request

try:
    from src.core.db import get_db
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from src.core.db import get_db


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
    cursor.execute(
        """
        SELECT id, student_id, NULL AS admin_id, lbc_no, full_name, address,
               contact_no, course, year_level, gmail,
               COALESCE(account_type, 'student') AS account_type,
               created_at
        FROM students
        UNION ALL
        SELECT id, NULL AS student_id, admin_id, lbc_no, full_name, address,
               contact_no, NULL AS course, NULL AS year_level, gmail,
               'admin' AS account_type, created_at
        FROM admins
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
