"""Book and category admin API handlers."""

import mysql.connector
from flask import jsonify, request

from src.core.db import get_db


def _payload():
    return request.get_json(silent=True) or {}


def _ensure_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_no VARCHAR(60) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            category_id INT NULL,
            status VARCHAR(40) DEFAULT 'Available',
            reserved_count INT DEFAULT 0,
            borrowed_count INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    _ensure_book_columns(cursor)


def _ensure_book_columns(cursor):
    cursor.execute("SHOW COLUMNS FROM books")
    existing_columns = {row['Field'] for row in cursor.fetchall()}

    if 'status' not in existing_columns:
        cursor.execute("ALTER TABLE books ADD COLUMN status VARCHAR(30) DEFAULT 'Available'")
    if 'category_id' not in existing_columns:
        cursor.execute("ALTER TABLE books ADD COLUMN category_id INT DEFAULT NULL")
    if 'reserved_count' not in existing_columns:
        cursor.execute(
            "ALTER TABLE books ADD COLUMN reserved_count INT DEFAULT 0 AFTER status"
        )
    if 'borrowed_count' not in existing_columns:
        cursor.execute(
            "ALTER TABLE books ADD COLUMN borrowed_count INT DEFAULT 0 AFTER reserved_count"
        )


def get_categories():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    cursor.execute("SELECT id, name FROM categories ORDER BY name")
    rows = cursor.fetchall()
    cursor.close()
    return jsonify(rows)


def add_category():
    name = str(_payload().get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    try:
        cursor.execute("INSERT INTO categories (name) VALUES (%s)", (name,))
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'name': name}), 201
    except mysql.connector.IntegrityError:
        db.rollback()
        return jsonify({'error': 'Category already exists'}), 409
    finally:
        cursor.close()


def delete_category(id):
    db = get_db()
    cursor = db.cursor()
    _ensure_tables(cursor)
    cursor.execute("UPDATE books SET category_id = NULL WHERE category_id = %s", (id,))
    cursor.execute("DELETE FROM categories WHERE id = %s", (id,))
    db.commit()
    cursor.close()
    return jsonify({'status': 'deleted'})


def get_books():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    cursor.execute(
        """
        SELECT b.id, b.book_no, b.title, b.status, b.reserved_count,
               b.borrowed_count, b.category_id, COALESCE(c.name, 'N/A') AS category
        FROM books b
        LEFT JOIN categories c ON c.id = b.category_id
        ORDER BY b.created_at DESC, b.id DESC
        """
    )
    rows = cursor.fetchall()
    cursor.close()
    return jsonify(rows)


def add_book():
    data = _payload()
    book_no = str(data.get('book_no') or '').strip()
    title = str(data.get('title') or '').strip()
    category_id = data.get('category_id') or None
    if not book_no or not title:
        return jsonify({'error': 'Book number and title are required'}), 400
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    try:
        cursor.execute(
            """
            INSERT INTO books (book_no, title, category_id, status)
            VALUES (%s, %s, %s, %s)
            """,
            (book_no, title, category_id, data.get('status') or 'Available'),
        )
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'book_no': book_no, 'title': title}), 201
    except mysql.connector.IntegrityError:
        db.rollback()
        return jsonify({'error': 'Book number already exists'}), 409
    finally:
        cursor.close()


def delete_book(id):
    db = get_db()
    cursor = db.cursor()
    _ensure_tables(cursor)
    cursor.execute("DELETE FROM books WHERE id = %s", (id,))
    db.commit()
    cursor.close()
    return jsonify({'status': 'deleted'})
