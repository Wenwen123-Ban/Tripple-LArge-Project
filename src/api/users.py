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


def _add_column_if_missing(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_card_columns(cursor):
    _add_column_if_missing(cursor, 'students', 'account_gen_no', 'INT DEFAULT 1')
    _add_column_if_missing(cursor, 'students', 'last_login_time', 'DATETIME NULL')
    _add_column_if_missing(cursor, 'students', 'last_login_ip', 'VARCHAR(80) DEFAULT NULL')
    _add_column_if_missing(cursor, 'students', 'last_active', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    _add_column_if_missing(cursor, 'students', 'deleted_at', 'DATETIME DEFAULT NULL')
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            book_no VARCHAR(20) NOT NULL,
            student_id VARCHAR(40) NOT NULL,
            action VARCHAR(20) NOT NULL,
            actor_admin_id VARCHAR(40) DEFAULT NULL,
            reserved_at DATETIME DEFAULT NULL,
            pickup_at DATETIME DEFAULT NULL,
            borrowed_at DATETIME DEFAULT NULL,
            due_at DATETIME DEFAULT NULL,
            expected_return_at DATETIME DEFAULT NULL,
            queue_position INT DEFAULT NULL,
            returned_at DATETIME DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    _add_column_if_missing(cursor, 'transactions', 'pickup_at', 'DATETIME DEFAULT NULL')
    _add_column_if_missing(cursor, 'transactions', 'expected_return_at', 'DATETIME DEFAULT NULL')
    _add_column_if_missing(cursor, 'transactions', 'queue_position', 'INT DEFAULT NULL')


def _format_datetime(value, include_time=False):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.strftime('%m/%d/%Y %I:%M %p' if include_time else '%m/%d/%Y')
    return str(value)


def _active_action(action, returned_at):
    action_text = str(action or '').lower()
    return returned_at is None and action_text in ('reserved', 'borrowed')


def _transaction_status(action, due_at, returned_at):
    action_text = str(action or '').lower()
    if returned_at:
        return 'returned' if action_text in ('borrowed', 'returned') else action_text
    if action_text == 'borrowed' and due_at and datetime.now() > due_at:
        return 'overdue'
    return action_text or 'recorded'


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
    user_type = request.args.get('type', 'admin')
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type(cursor)
    _ensure_admins_table(cursor)
    _ensure_deletion_columns(cursor)

    if user_type == 'admin':
        cursor.execute(
            """
            SELECT admin_id, full_name, lbc_no, gmail, address, created_at
            FROM admins
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            """
        )
    else:
        cursor.execute(
            """
            SELECT student_id, full_name, lbc_no, gmail, address, course, year_level, created_at
            FROM students
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            """
        )

    rows = cursor.fetchall()
    cursor.close()
    for row in rows:
        if row.get('created_at'):
            row['created_at'] = row['created_at'].strftime('%m/%d/%Y')
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

def _ensure_student_state(cursor):
    _ensure_account_type(cursor)
    for ddl in (
        "ALTER TABLE students ADD COLUMN account_state VARCHAR(20) DEFAULT 'active'",
        "ALTER TABLE students ADD COLUMN suspended_at DATETIME NULL",
        "ALTER TABLE students ADD COLUMN suspended_by VARCHAR(40) DEFAULT NULL",
    ):
        try:
            cursor.execute(ddl)
        except mysql.connector.Error as exc:
            if exc.errno != 1060:
                raise


def get_pending_students():
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_student_state(cursor); _ensure_deletion_columns(cursor)
    cursor.execute(
        """
        SELECT student_id, full_name, lbc_no, gmail, course, year_level, address, contact_no, created_at
        FROM students
        WHERE deleted_at IS NULL
          AND is_verified = 0
          AND COALESCE(account_state, 'pending') NOT IN ('suspended', 'rejected')
        ORDER BY created_at ASC
        """
    )
    rows = cursor.fetchall(); cursor.close()
    for row in rows:
        if row.get('created_at'):
            row['created_at'] = row['created_at'].strftime('%m/%d/%Y')
    return jsonify(rows)


def approve_student(student_id):
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_student_state(cursor)
    cursor.execute(
        "UPDATE students SET is_verified=1, account_state='active' WHERE student_id=%s AND deleted_at IS NULL",
        (student_id,),
    )
    db.commit(); ok = cursor.rowcount > 0; cursor.close()
    return jsonify({'status': 'approved' if ok else 'not_found'}), (200 if ok else 404)


def reject_student(student_id):
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_student_state(cursor); _ensure_deletion_columns(cursor)
    cursor.execute(
        "UPDATE students SET account_state='rejected', deleted_at=NOW(), deleted_by=%s WHERE student_id=%s AND deleted_at IS NULL",
        (request.get_json(silent=True) or {}).get('admin_id'), student_id,
    )
    db.commit(); ok = cursor.rowcount > 0; cursor.close()
    return jsonify({'status': 'rejected' if ok else 'not_found'}), (200 if ok else 404)


def suspend_student(student_id):
    data = request.get_json(silent=True) or {}
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_student_state(cursor)
    cursor.execute(
        """
        UPDATE students
        SET is_verified=0, account_state='suspended', suspended_at=NOW(), suspended_by=%s
        WHERE student_id=%s AND deleted_at IS NULL
        """,
        (data.get('admin_id'), student_id),
    )
    db.commit(); ok = cursor.rowcount > 0; cursor.close()
    return jsonify({'status': 'suspended' if ok else 'not_found'}), (200 if ok else 404)


def reset_student_borrow(student_id):
    data = request.get_json(silent=True) or {}
    notes = data.get('notes') or 'Admin reset borrower record'
    db = get_db(); cursor = db.cursor(dictionary=True); _ensure_card_columns(cursor)
    cursor.execute(
        "SELECT DISTINCT book_id FROM transactions WHERE student_id=%s AND returned_at IS NULL AND action IN ('reserved','borrowed')",
        (student_id,),
    )
    book_ids = [row['book_id'] for row in cursor.fetchall()]
    cursor.execute(
        """
        UPDATE transactions
        SET action='force_returned', returned_at=NOW(), notes=%s
        WHERE student_id=%s AND returned_at IS NULL AND action IN ('reserved','borrowed')
        """,
        (notes, student_id),
    )
    affected = cursor.rowcount
    if book_ids:
        placeholders = ','.join(['%s'] * len(book_ids))
        cursor.execute(f"UPDATE books SET status='Available', availability_hint='Available' WHERE id IN ({placeholders})", book_ids)
    db.commit(); cursor.close()
    return jsonify({'status': 'reset', 'records_reset': affected})

def get_user_card():
    student_id = session.get('student_id') or request.args.get('student_id')
    if not student_id:
        return jsonify({'error': 'Not authenticated'}), 401

    db = get_db()
    c = db.cursor(dictionary=True)
    _ensure_card_columns(c)
    c.execute(
        """
        SELECT full_name, student_id, lbc_no, course, year_level, gmail,
               contact_no, address, is_verified, created_at, account_gen_no,
               last_login_time
        FROM students
        WHERE student_id=%s AND deleted_at IS NULL
        LIMIT 1
        """,
        (student_id,),
    )
    row = c.fetchone() or {}
    if not row:
        c.close()
        return jsonify({'error': 'Account not found'}), 404

    c.execute(
        """
        SELECT t.id, t.book_no, t.action, t.reserved_at, t.pickup_at, t.borrowed_at,
               t.due_at, t.expected_return_at, t.queue_position, t.returned_at, t.created_at, b.title
        FROM transactions t
        LEFT JOIN books b ON b.id = t.book_id
        WHERE t.student_id=%s
        ORDER BY COALESCE(t.borrowed_at, t.reserved_at, t.created_at) DESC
        LIMIT 100
        """,
        (student_id,),
    )
    tx_rows = c.fetchall()
    c.close()

    transactions = []
    counters = {'borrowed': 0, 'reserved': 0, 'due_soon': 0, 'overdue': 0, 'records': len(tx_rows)}
    now = datetime.now()
    for tx in tx_rows:
        action = tx.get('action')
        due_at = tx.get('due_at')
        returned_at = tx.get('returned_at')
        status = _transaction_status(action, due_at, returned_at)
        if _active_action(action, returned_at):
            action_text = str(action or '').lower()
            if status == 'overdue':
                counters['overdue'] += 1
            elif action_text == 'borrowed':
                counters['borrowed'] += 1
                if due_at and 0 <= (due_at - now).total_seconds() <= (3 * 24 * 60 * 60):
                    counters['due_soon'] += 1
            elif action_text == 'reserved':
                counters['reserved'] += 1

        active_label = 'Pending'
        if _active_action(action, returned_at):
            if str(action or '').lower() == 'borrowed':
                active_label = _format_datetime(due_at, True) or 'Pending'
            elif str(action or '').lower() == 'reserved':
                active_label = _format_datetime(tx.get('expected_return_at'), True) or 'Pending'
        transactions.append({
            'id': tx.get('id'),
            'date_borrowed': _format_datetime(tx.get('borrowed_at') or tx.get('reserved_at'), True) or '—',
            'reserved_at': _format_datetime(tx.get('reserved_at'), True) or '—',
            'pickup_date': _format_datetime(tx.get('pickup_at')) or '—',
            'borrowed_at': _format_datetime(tx.get('borrowed_at'), True) or '—',
            'book_no': tx.get('book_no') or '—',
            'title': tx.get('title') or '—',
            'accession_no': tx.get('book_no') or '—',
            'date_returned': _format_datetime(returned_at, True) or (active_label if _active_action(action, returned_at) else '—'),
            'returned_at': _format_datetime(returned_at, True) or '—',
            'due_at': _format_datetime(due_at, True) or '—',
            'expected_return_at': _format_datetime(tx.get('expected_return_at'), True) or '—',
            'queue_position': tx.get('queue_position'),
            'status': status,
        })

    issued_at = _format_datetime(row.get('created_at')) or '—'
    is_verified = bool(row.get('is_verified'))
    has_overdue = counters['overdue'] > 0
    account_status = 'Overdue' if has_overdue else ('Good Standing' if is_verified else 'Pending Verification')
    active_borrows = [tx for tx in transactions if tx.get('status') in ('borrowed', 'overdue')]
    active_reservations = [tx for tx in transactions if tx.get('status') == 'reserved']
    borrow_history = [tx for tx in transactions if tx.get('status') not in ('reserved',)]
    payload = {
        **row,
        'issued_at': issued_at,
        'member_since': issued_at,
        'verified_at': issued_at if is_verified else 'Pending',
        'last_login': _format_datetime(row.get('last_login_time'), True) or '—',
        'account_status': account_status,
        'fines': 0,
        'active_borrows': active_borrows,
        'active_reservations': active_reservations,
        'borrow_history': borrow_history,
        'transactions': transactions,
        'counters': counters,
    }
    for key in ('created_at', 'last_login_time'):
        payload.pop(key, None)
    return jsonify(payload)



def get_user_profile():
    return get_user_card()


def get_user_notifications():
    student_id = session.get('student_id') or request.args.get('student_id')
    if not student_id:
        return jsonify({'items': [], 'unread': 0, 'total': 0})
    flt = request.args.get('filter', 'unread')
    db = get_db(); c = db.cursor(dictionary=True)
    where = "recipient_id=%s"
    params = [student_id]
    if flt == 'unread': where += " AND is_read=0"
    c.execute("SHOW TABLES LIKE 'user_notifications'")
    if c.fetchone():
        where = "user_id=%s"
        params = [student_id]
        if flt == 'unread':
            where += " AND is_read=0"
        c.execute(f"SELECT id,type,title,message,is_read,created_at FROM user_notifications WHERE {where} ORDER BY created_at DESC LIMIT 100", params)
        items = c.fetchall()
        c.execute("SELECT SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) unread, COUNT(*) total FROM user_notifications WHERE user_id=%s", (student_id,))
    else:
        c.execute(f"SELECT id,title,message,is_read,created_at FROM notifications WHERE {where} ORDER BY created_at DESC LIMIT 100", params)
        items = c.fetchall()
        c.execute("SELECT SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) unread, COUNT(*) total FROM notifications WHERE recipient_id=%s", (student_id,))
    stats = c.fetchone() or {'unread':0,'total':0}
    c.close()
    for it in items:
        if it.get('created_at'): it['created_at'] = it['created_at'].strftime('%m/%d/%Y %I:%M %p')
    return jsonify({'items': items, 'unread': int(stats.get('unread') or 0), 'total': int(stats.get('total') or 0)})


def clear_user_notifications():
    student_id = session.get('student_id') or request.get_json(silent=True) or {}
    sid = student_id if isinstance(student_id, str) else student_id.get('student_id')
    if not sid: return jsonify({'status': 'ok'})
    db = get_db(); c = db.cursor()
    c.execute("SHOW TABLES LIKE 'user_notifications'")
    if c.fetchone():
        c.execute("DELETE FROM user_notifications WHERE user_id=%s AND is_read=1", (sid,))
    else:
        c.execute("UPDATE notifications SET is_read=1 WHERE recipient_id=%s", (sid,))
    db.commit(); c.close(); return jsonify({'status':'cleared'})


def mark_user_notification_read(notif_id):
    sid = session.get('student_id') or request.args.get('student_id')
    if not sid:
        return jsonify({'error': 'Not authenticated'}), 401
    db = get_db(); c = db.cursor()
    c.execute("SHOW TABLES LIKE 'user_notifications'")
    if c.fetchone():
        c.execute("UPDATE user_notifications SET is_read=1 WHERE id=%s AND user_id=%s", (notif_id, sid))
    else:
        c.execute("UPDATE notifications SET is_read=1 WHERE id=%s AND recipient_id=%s", (notif_id, sid))
    db.commit(); c.close()
    return jsonify({'status': 'read'})
