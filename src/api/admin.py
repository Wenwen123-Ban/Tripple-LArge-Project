"""Admin reports, rules, and server health handlers."""

import json
import os
import random
import string
from datetime import datetime, timedelta

import mysql.connector
import psutil

from flask import jsonify, request, session

from src.core.db import get_db
from src.api.auth import (
    build_deletion_confirmed_html,
    send_admin_deleted_confirmation_email,
    send_admin_deletion_email,
)


DEFAULT_RULES = {
    'nearest_day_rule': True,
    'return_days': None,
    'return_hours': None,
    'expire_days': None,
    'expire_hours': None,
    'expire_mins': 30,
    'expiry_enabled': False,
    'expiry_years': None,
    'inactive_enabled': False,
    'inactive_days': None,
    'warn_enabled': False,
    'warn_before_days': 30,
}


def _ensure_tables(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_rules (
            id INT PRIMARY KEY,
            nearest_day_rule TINYINT(1) DEFAULT 1,
            return_days INT NULL,
            return_hours INT NULL,
            expire_days INT NULL,
            expire_hours INT NULL,
            expire_mins INT DEFAULT 30,
            expiry_enabled TINYINT(1) DEFAULT 0,
            expiry_years INT NULL,
            inactive_enabled TINYINT(1) DEFAULT 0,
            inactive_days INT NULL,
            warn_enabled TINYINT(1) DEFAULT 0,
            warn_before_days INT DEFAULT 30,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(40),
            direction VARCHAR(20),
            action VARCHAR(120),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    for column_def in (
        'expiry_enabled TINYINT(1) DEFAULT 0',
        'expiry_years INT NULL',
        'inactive_enabled TINYINT(1) DEFAULT 0',
        'inactive_days INT NULL',
        'warn_enabled TINYINT(1) DEFAULT 0',
        'warn_before_days INT DEFAULT 30',
    ):
        try:
            cursor.execute(f"ALTER TABLE admin_rules ADD COLUMN {column_def}")
        except mysql.connector.Error as exc:
            if exc.errno != 1060:
                raise



def get_me():
    """Return current logged-in admin details."""
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'error': 'Not logged in'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT admin_id, full_name, lbc_no, gmail, created_at
        FROM admins
        WHERE admin_id = %s
        """,
        (admin_id,),
    )
    admin = cursor.fetchone()
    cursor.close()

    if not admin:
        return jsonify({'error': 'Admin not found'}), 404

    if admin.get('created_at'):
        admin['created_at'] = admin['created_at'].strftime('%m/%d/%Y')

    return jsonify(admin)

def get_rules():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    cursor.execute("SELECT * FROM admin_rules WHERE id = 1")
    row = cursor.fetchone() or DEFAULT_RULES.copy()
    cursor.close()
    for key in ('nearest_day_rule', 'expiry_enabled', 'inactive_enabled', 'warn_enabled'):
        if key in row:
            row[key] = bool(row[key])
    return jsonify(row)


def save_rules():
    data = request.get_json(silent=True) or {}
    db = get_db()
    cursor = db.cursor()
    _ensure_tables(cursor)
    values = {
        'nearest_day_rule': 1 if data.get('nearest_day_rule', True) else 0,
        'return_days': data.get('return_days'),
        'return_hours': data.get('return_hours'),
        'expire_days': data.get('expire_days'),
        'expire_hours': data.get('expire_hours'),
        'expire_mins': data.get('expire_mins') or 30,
        'expiry_enabled': 1 if data.get('expiry_enabled') else 0,
        'expiry_years': data.get('expiry_years'),
        'inactive_enabled': 1 if data.get('inactive_enabled') else 0,
        'inactive_days': data.get('inactive_days'),
        'warn_enabled': 1 if data.get('warn_enabled') else 0,
        'warn_before_days': data.get('warn_before_days') or 30,
    }
    cursor.execute(
        """
        INSERT INTO admin_rules
            (id, nearest_day_rule, return_days, return_hours, expire_days, expire_hours,
             expire_mins, expiry_enabled, expiry_years, inactive_enabled, inactive_days,
             warn_enabled, warn_before_days)
        VALUES (1, %(nearest_day_rule)s, %(return_days)s, %(return_hours)s,
                %(expire_days)s, %(expire_hours)s, %(expire_mins)s,
                %(expiry_enabled)s, %(expiry_years)s, %(inactive_enabled)s,
                %(inactive_days)s, %(warn_enabled)s, %(warn_before_days)s)
        ON DUPLICATE KEY UPDATE
            nearest_day_rule = VALUES(nearest_day_rule),
            return_days = VALUES(return_days),
            return_hours = VALUES(return_hours),
            expire_days = VALUES(expire_days),
            expire_hours = VALUES(expire_hours),
            expire_mins = VALUES(expire_mins),
            expiry_enabled = VALUES(expiry_enabled),
            expiry_years = VALUES(expiry_years),
            inactive_enabled = VALUES(inactive_enabled),
            inactive_days = VALUES(inactive_days),
            warn_enabled = VALUES(warn_enabled),
            warn_before_days = VALUES(warn_before_days)
        """,
        values,
    )
    db.commit()
    cursor.close()
    return jsonify({'status': 'saved'})


def server_health():
    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory().percent
    load = round((cpu + ram) / 2, 1)
    status = 'Normal' if load < 60 else 'Moderate' if load < 80 else 'High Load'
    return jsonify({'cpu': cpu, 'ram': ram, 'load': load, 'status': status})


def get_logs():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT student_id AS account_id, event_type, ip_address, description, created_at
        FROM security_logs
        ORDER BY created_at DESC
        LIMIT 100
        """
    )
    rows = cursor.fetchall()
    for row in rows:
        if row.get('created_at'):
            row['created_at'] = row['created_at'].strftime('%m/%d/%Y %I:%M:%S %p')
    cursor.close()
    return jsonify(rows)

def _add_column_if_missing(cursor, table, column_def):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_deletion_and_notification_tables(cursor):
    _ensure_tables(cursor)
    for table in ('students', 'admins'):
        _add_column_if_missing(cursor, table, 'deleted_at DATETIME DEFAULT NULL')
        _add_column_if_missing(cursor, table, 'deleted_by VARCHAR(40) DEFAULT NULL')
        _add_column_if_missing(cursor, table, 'last_active DATETIME DEFAULT CURRENT_TIMESTAMP')
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


def request_admin_deletion():
    data = request.get_json(silent=True) or {}
    target_id = str(data.get('target_id') or '').strip()
    requester = session.get('admin_id')
    if not requester:
        return jsonify({'error': 'Admin login required'}), 401
    if not target_id:
        return jsonify({'error': 'Target admin is required'}), 400
    if target_id == requester:
        return jsonify({'error': 'You cannot delete your own account.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_deletion_and_notification_tables(cursor)
    cursor.execute(
        """
        SELECT admin_id, full_name, gmail
        FROM admins
        WHERE admin_id = %s
          AND deleted_at IS NULL
        """,
        (target_id,),
    )
    target_admin = cursor.fetchone()
    if not target_admin:
        cursor.close()
        return jsonify({'error': 'Admin not found'}), 404

    cursor.execute(
        "SELECT full_name, gmail FROM admins WHERE admin_id = %s",
        (requester,),
    )
    requester_data = cursor.fetchone() or {'full_name': requester, 'gmail': ''}

    code = ''.join(random.choices(string.digits, k=8))
    expires_at = datetime.now() + timedelta(minutes=30)
    cursor.execute(
        """
        INSERT INTO deletion_codes
            (requested_by, target_id, target_type, code, expires_at)
        VALUES (%s, %s, 'admin', %s, %s)
        """,
        (requester, target_id, code, expires_at),
    )
    deletion_id = cursor.lastrowid
    db.commit()
    cursor.close()

    confirm_url = f"{os.getenv('SITE_URL', 'http://127.0.0.1:5000').rstrip('/')}/api/admin/confirm-deletion?id={deletion_id}"
    try:
        send_admin_deletion_email(
            target_admin['gmail'],
            target_admin['full_name'],
            requester_data.get('full_name') or requester,
            requester_data.get('gmail') or '',
            confirm_url,
        )
    except Exception as exc:
        print(f"Admin deletion email error: {exc}")

    return jsonify({'status': 'email_sent'})


def confirm_admin_deletion():
    deletion_id = request.args.get('id')
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_deletion_and_notification_tables(cursor)
    cursor.execute(
        """
        SELECT * FROM deletion_codes
        WHERE id = %s AND used = 0 AND expires_at > NOW()
        """,
        (deletion_id,),
    )
    deletion = cursor.fetchone()
    if not deletion:
        cursor.close()
        return '<p>Invalid or expired deletion request.</p>', 400

    cursor.execute(
        "UPDATE deletion_codes SET confirmed_email = 1 WHERE id = %s",
        (deletion_id,),
    )
    cursor.execute(
        """
        INSERT INTO notifications (recipient_id, type, title, message, data)
        VALUES (%s, 'deletion_code', %s, %s, %s)
        """,
        (
            deletion['requested_by'],
            'Admin Deletion Confirmed',
            f'Enter this code to complete deletion: {deletion["code"]}',
            json.dumps({'code': deletion['code'], 'target_id': deletion['target_id']}),
        ),
    )
    db.commit()
    cursor.close()
    return build_deletion_confirmed_html()


def finalize_admin_deletion():
    data = request.get_json(silent=True) or {}
    target_id = str(data.get('target_id') or '').strip()
    code = str(data.get('code') or '').strip()
    requester = session.get('admin_id')
    if not requester:
        return jsonify({'error': 'Admin login required'}), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_deletion_and_notification_tables(cursor)
    cursor.execute(
        """
        SELECT * FROM deletion_codes
        WHERE requested_by = %s AND target_id = %s AND target_type = 'admin'
          AND code = %s AND confirmed_email = 1 AND used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (requester, target_id, code),
    )
    deletion = cursor.fetchone()
    if not deletion:
        cursor.close()
        return jsonify({'error': 'Invalid, unconfirmed, or expired deletion code.'}), 400

    cursor.execute(
        "SELECT full_name, gmail FROM admins WHERE admin_id = %s AND deleted_at IS NULL",
        (target_id,),
    )
    target_admin = cursor.fetchone()
    if not target_admin:
        cursor.close()
        return jsonify({'error': 'Admin not found'}), 404

    deleted_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute(
        "UPDATE admins SET deleted_at = NOW(), deleted_by = %s WHERE admin_id = %s",
        (requester, target_id),
    )
    cursor.execute("UPDATE deletion_codes SET used = 1 WHERE id = %s", (deletion['id'],))
    cursor.execute(
        """
        UPDATE notifications
        SET is_read = 1
        WHERE recipient_id = %s AND type = 'deletion_code'
          AND JSON_EXTRACT(data, '$.target_id') = %s
        """,
        (requester, json.dumps(target_id)),
    )
    db.commit()
    cursor.close()

    try:
        send_admin_deleted_confirmation_email(target_admin['gmail'], target_admin['full_name'], deleted_at)
    except Exception as exc:
        print(f"Admin deletion confirmation email error: {exc}")

    return jsonify({'status': 'deleted'})


def get_notifications():
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify([])
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_deletion_and_notification_tables(cursor)
    cursor.execute(
        """
        SELECT id, recipient_id, type, title, message, data, is_read, created_at
        FROM notifications
        WHERE recipient_id = %s
        ORDER BY created_at DESC
        LIMIT 30
        """,
        (admin_id,),
    )
    rows = cursor.fetchall()
    cursor.close()
    for row in rows:
        row['is_read'] = bool(row.get('is_read'))
        if row.get('created_at'):
            row['created_at'] = row['created_at'].strftime('%m/%d/%Y %I:%M:%S %p')
    return jsonify(rows)
