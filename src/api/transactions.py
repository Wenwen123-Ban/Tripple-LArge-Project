from datetime import datetime, timedelta

from flask import jsonify, request, session

from src.core.db import get_db


def _ensure_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            book_no VARCHAR(20) NOT NULL,
            student_id VARCHAR(10) NOT NULL,
            action VARCHAR(20) NOT NULL,
            actor_admin_id VARCHAR(10) DEFAULT NULL,
            reserved_at DATETIME DEFAULT NULL,
            borrowed_at DATETIME DEFAULT NULL,
            due_at DATETIME DEFAULT NULL,
            returned_at DATETIME DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )
        """
    )


def get_book_effective_status(cursor, book_id):
    cursor.execute(
        """
        SELECT action, due_at
        FROM transactions
        WHERE book_id = %s
          AND returned_at IS NULL
          AND action IN ('reserved', 'borrowed')
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (book_id,),
    )
    row = cursor.fetchone()
    if not row:
        return 'Available'
    if row['action'] == 'reserved':
        return 'Reserved'
    if row['action'] == 'borrowed':
        if row.get('due_at') and datetime.now() > row['due_at']:
            return 'Due'
        return 'Borrowed'
    return 'Available'


def get_admin_rules(cursor):
    cursor.execute(
        """
        SELECT return_days, return_hours, expire_days, expire_hours, expire_mins
        FROM admin_rules ORDER BY id DESC LIMIT 1
        """
    )
    return cursor.fetchone() or {}


def calculate_due_at(rules):
    days = int(rules.get('return_days') or 0)
    hours = int(rules.get('return_hours') or 0)
    return None if not days and not hours else datetime.now() + timedelta(days=days, hours=hours)


def reserve_book():
    data = request.get_json(silent=True) or {}
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    book_id = data.get('book_id')
    student_id = data.get('student_id')
    status = get_book_effective_status(cursor, book_id)
    if status != 'Available':
        cursor.close()
        return jsonify({'error': f'Book is currently {status} and cannot be reserved.'}), 409
    rules = get_admin_rules(cursor)
    expires = datetime.now() + timedelta(days=int(rules.get('expire_days') or 0), hours=int(rules.get('expire_hours') or 0), minutes=int(rules.get('expire_mins') or 30))
    cursor.execute(
        """
        INSERT INTO transactions (book_id, book_no, student_id, action, actor_admin_id, reserved_at, due_at)
        SELECT id, book_no, %s, 'reserved', %s, NOW(), %s FROM books WHERE id = %s
        """,
        (student_id, session.get('admin_id'), expires, book_id),
    )
    cursor.execute("UPDATE books SET availability_hint='Reserved', reserve_count=reserve_count+1 WHERE id=%s", (book_id,))
    db.commit(); cursor.close()
    return jsonify({'status': 'reserved'})


def borrow_book():
    data = request.get_json(silent=True) or {}
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_tables(cursor)
    book_id = data.get('book_id'); student_id = data.get('student_id')
    if get_book_effective_status(cursor, book_id) != 'Reserved':
        cursor.close(); return jsonify({'error': 'Book must be Reserved before it can be Borrowed.'}), 409
    due_at = calculate_due_at(get_admin_rules(cursor))
    cursor.execute("""UPDATE transactions SET action='borrowed', borrowed_at=NOW(), due_at=%s WHERE book_id=%s AND student_id=%s AND action='reserved' AND returned_at IS NULL""", (due_at, book_id, student_id))
    cursor.execute("UPDATE books SET availability_hint='Borrowed', borrow_count=borrow_count+1 WHERE id=%s", (book_id,))
    db.commit(); cursor.close()
    return jsonify({'status': 'borrowed'})


def return_book():
    data = request.get_json(silent=True) or {}
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_tables(cursor)
    book_id = data.get('book_id')
    cursor.execute("""UPDATE transactions SET action='returned', returned_at=NOW() WHERE book_id=%s AND returned_at IS NULL AND action IN ('borrowed','reserved')""", (book_id,))
    cursor.execute("UPDATE books SET availability_hint='Available' WHERE id=%s", (book_id,))
    db.commit(); cursor.close()
    return jsonify({'status': 'returned'})


def force_return():
    data = request.get_json(silent=True) or {}
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_tables(cursor)
    book_id = data.get('book_id')
    cursor.execute("""UPDATE transactions SET action='force_returned', returned_at=NOW(), actor_admin_id=%s, notes=%s WHERE book_id=%s AND returned_at IS NULL""", (session.get('admin_id'), data.get('notes', 'Admin force return'), book_id))
    cursor.execute("UPDATE books SET availability_hint='Available' WHERE id=%s", (book_id,))
    db.commit(); cursor.close()
    return jsonify({'status': 'force_returned'})


def get_book_history():
    book_id = request.args.get('book_id')
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_tables(cursor)
    cursor.execute("""SELECT t.*, s.full_name AS student_name FROM transactions t LEFT JOIN students s ON t.student_id=s.student_id WHERE t.book_id=%s ORDER BY t.created_at DESC""", (book_id,))
    rows = cursor.fetchall(); cursor.close()
    for r in rows:
        for col in ('reserved_at', 'borrowed_at', 'due_at', 'returned_at', 'created_at'):
            if r.get(col):
                r[col] = r[col].strftime('%m/%d/%Y %I:%M %p')
    return jsonify(rows)


def notify_borrower():
    return jsonify({'status': 'sent'})
