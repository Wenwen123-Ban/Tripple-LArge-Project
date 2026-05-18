from datetime import datetime, timedelta

import json

import mysql.connector

from flask import jsonify, request, session

from src.core.db import get_db


def _add_column_if_missing(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_tables(cursor):
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )
        """
    )
    _add_column_if_missing(cursor, 'transactions', 'pickup_at', 'DATETIME DEFAULT NULL')
    _add_column_if_missing(cursor, 'transactions', 'expected_return_at', 'DATETIME DEFAULT NULL')
    _add_column_if_missing(cursor, 'transactions', 'queue_position', 'INT DEFAULT NULL')
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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


def _parse_pickup_date(raw_value):
    if not raw_value:
        return datetime.now() + timedelta(days=1)
    try:
        return datetime.strptime(str(raw_value), '%Y-%m-%d')
    except ValueError:
        return None


def _calculate_expected_return_at(pickup_at, rules):
    days = int(rules.get('return_days') or 0)
    hours = int(rules.get('return_hours') or 0)
    if not days and not hours:
        days = 7
    return pickup_at + timedelta(days=days, hours=hours)


def _refresh_reservation_queue(cursor, book_id):
    cursor.execute(
        """
        SELECT id
        FROM transactions
        WHERE book_id=%s AND returned_at IS NULL AND action='reserved'
        ORDER BY COALESCE(pickup_at, reserved_at, created_at) ASC, reserved_at ASC, id ASC
        """,
        (book_id,),
    )
    rows = cursor.fetchall()
    for index, row in enumerate(rows, start=1):
        cursor.execute(
            "UPDATE transactions SET queue_position=%s WHERE id=%s",
            (index, row['id']),
        )
    return {row['id']: index for index, row in enumerate(rows, start=1)}


def _notify_admins_of_reservation(cursor, reservation_id, student_id, book_no, title, pickup_at, queue_position):
    try:
        cursor.execute("SELECT admin_id FROM admins WHERE deleted_at IS NULL")
    except mysql.connector.Error:
        cursor.execute("SELECT admin_id FROM admins")
    admins = cursor.fetchall()
    payload = json.dumps({
        'transaction_id': reservation_id,
        'student_id': student_id,
        'book_no': book_no,
        'pickup_date': pickup_at.strftime('%Y-%m-%d') if pickup_at else None,
        'queue_position': queue_position,
    })
    for admin in admins:
        cursor.execute(
            """
            INSERT INTO notifications (recipient_id, type, title, message, data)
            VALUES (%s, 'reservation', %s, %s, %s)
            """,
            (
                admin['admin_id'],
                'New Click & Collect Reservation',
                f'{student_id} reserved {book_no} — {title or "Untitled book"} for pickup on {pickup_at.strftime("%m/%d/%Y")}. Queue #{queue_position}.',
                payload,
            ),
        )


def reserve_book():
    data = request.get_json(silent=True) or {}
    book_id = data.get('book_id')
    student_id = data.get('student_id') or session.get('student_id')
    pickup_at = _parse_pickup_date(data.get('pickup_date'))

    if not book_id:
        return jsonify({'error': 'Book is required.'}), 400
    if not student_id:
        return jsonify({'error': 'Student login is required to reserve a book.'}), 401
    if pickup_at is None:
        return jsonify({'error': 'Pickup date must use YYYY-MM-DD format.'}), 400
    if pickup_at.date() < datetime.now().date():
        return jsonify({'error': 'Pickup date cannot be in the past.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    status = get_book_effective_status(cursor, book_id)
    if status in ('Borrowed', 'Due'):
        cursor.close()
        return jsonify({'error': f'Book is currently {status} and cannot be reserved.'}), 409

    cursor.execute(
        """
        SELECT id FROM transactions
        WHERE book_id=%s AND student_id=%s AND action='reserved' AND returned_at IS NULL
        LIMIT 1
        """,
        (book_id, student_id),
    )
    if cursor.fetchone():
        cursor.close()
        return jsonify({'error': 'You already have an active reservation for this book.'}), 409

    rules = get_admin_rules(cursor)
    expected_return_at = _calculate_expected_return_at(pickup_at, rules)
    cursor.execute(
        """
        INSERT INTO transactions
            (book_id, book_no, student_id, action, actor_admin_id, reserved_at, pickup_at, due_at, expected_return_at)
        SELECT id, book_no, %s, 'reserved', %s, NOW(), %s, %s, %s FROM books WHERE id = %s
        """,
        (student_id, session.get('admin_id'), pickup_at, expected_return_at, expected_return_at, book_id),
    )
    reservation_id = cursor.lastrowid
    if not reservation_id:
        db.rollback(); cursor.close()
        return jsonify({'error': 'Book not found.'}), 404

    queue_positions = _refresh_reservation_queue(cursor, book_id)
    queue_position = queue_positions.get(reservation_id, 1)
    cursor.execute("UPDATE books SET availability_hint='Reserved', reserve_count=reserve_count+1 WHERE id=%s", (book_id,))
    cursor.execute("SELECT book_no, title FROM books WHERE id=%s", (book_id,))
    book = cursor.fetchone() or {}
    _notify_admins_of_reservation(cursor, reservation_id, student_id, book.get('book_no'), book.get('title'), pickup_at, queue_position)
    db.commit(); cursor.close()
    return jsonify({
        'status': 'reserved',
        'transaction_id': reservation_id,
        'pickup_date': pickup_at.strftime('%Y-%m-%d'),
        'queue_position': queue_position,
        'expected_return_at': expected_return_at.strftime('%m/%d/%Y %I:%M %p'),
    })


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

def cancel_reservation():
    data = request.get_json(silent=True) or {}
    txid = data.get('transaction_id')
    db = get_db(); c = db.cursor(dictionary=True); _ensure_tables(c)
    c.execute("UPDATE transactions SET action='cancelled', notes='cancelled', returned_at=NOW() WHERE id=%s AND action='reserved' AND returned_at IS NULL", (txid,))
    db.commit(); c.close();
    return jsonify({'status':'cancelled' if c.rowcount else 'failed'})


def get_manage_transactions():
    sid = session.get('student_id') or request.args.get('student_id')
    if not sid: return jsonify({'reserved':[], 'borrowed':[], 'cancelled':[], 'history':[]})
    db = get_db(); c = db.cursor(dictionary=True); _ensure_tables(c)
    c.execute("SELECT id, book_no, action, reserved_at, borrowed_at, due_at, notes FROM transactions WHERE student_id=%s ORDER BY created_at DESC", (sid,)); rows = c.fetchall(); c.close()
    out={'reserved':[],'borrowed':[],'cancelled':[],'history':[]}
    for r in rows:
        if r.get('reserved_at'): r['reserved_at']=r['reserved_at'].strftime('%m/%d/%Y')
        if r.get('borrowed_at'): r['borrowed_at']=r['borrowed_at'].strftime('%m/%d/%Y')
        if r.get('due_at'): r['due_at']=r['due_at'].strftime('%m/%d/%Y')
        if r['action']=='reserved': out['reserved'].append({'id':r['id'],'book_no':r['book_no'],'title':'—','reserved_at':r.get('reserved_at'),'pickup_date':'Pending'})
        elif r['action']=='borrowed': out['borrowed'].append({'book_no':r['book_no'],'title':'—','accession_no':'—','borrowed_at':r.get('borrowed_at'),'due_at':r.get('due_at')})
        elif r['action']=='cancelled': out['cancelled'].append({'book_no':r['book_no'],'title':'—','reserved_at':r.get('reserved_at'),'pickup_date':'—','cancel_reason':'cancelled'})
        out['history'].append({'time':r.get('reserved_at') or r.get('borrowed_at') or '—','day':'—','action':r['action'].title()})
    return jsonify(out)
