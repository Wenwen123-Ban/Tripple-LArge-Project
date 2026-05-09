"""Admin reports, rules, and server health handlers."""

import os
from datetime import datetime
import psutil

from flask import jsonify, request

from src.core.db import get_db


DEFAULT_RULES = {
    'nearest_day_rule': True,
    'return_days': None,
    'return_hours': None,
    'expire_days': None,
    'expire_hours': None,
    'expire_mins': 30,
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


def get_rules():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_tables(cursor)
    cursor.execute("SELECT * FROM admin_rules WHERE id = 1")
    row = cursor.fetchone() or DEFAULT_RULES.copy()
    cursor.close()
    if 'nearest_day_rule' in row:
        row['nearest_day_rule'] = bool(row['nearest_day_rule'])
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
    }
    cursor.execute(
        """
        INSERT INTO admin_rules
            (id, nearest_day_rule, return_days, return_hours, expire_days, expire_hours, expire_mins)
        VALUES (1, %(nearest_day_rule)s, %(return_days)s, %(return_hours)s,
                %(expire_days)s, %(expire_hours)s, %(expire_mins)s)
        ON DUPLICATE KEY UPDATE
            nearest_day_rule = VALUES(nearest_day_rule),
            return_days = VALUES(return_days),
            return_hours = VALUES(return_hours),
            expire_days = VALUES(expire_days),
            expire_hours = VALUES(expire_hours),
            expire_mins = VALUES(expire_mins)
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
        SELECT account_id, event_type, ip_address, description, created_at
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
