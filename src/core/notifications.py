"""SMS and in-app notification helpers."""

from __future__ import annotations

import json
import os
from datetime import datetime
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

try:
    from src import settings
except Exception:  # pragma: no cover - keeps helpers usable in isolated scripts
    settings = None

SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages'


def _setting(name, default=''):
    return os.getenv(name) or getattr(settings, name, default) if settings else os.getenv(name, default)


def normalize_phone_number(raw_value):
    """Normalize PH mobile numbers for Semaphore's recipient field."""
    digits = ''.join(ch for ch in str(raw_value or '') if ch.isdigit())
    if digits.startswith('09') and len(digits) == 11:
        return '63' + digits[1:]
    if digits.startswith('9') and len(digits) == 10:
        return '63' + digits
    if digits.startswith('639') and len(digits) == 12:
        return digits
    return digits


def send_semaphore_sms(phone_number, message):
    """Send one SMS through Semaphore, returning a structured result."""
    api_key = _setting('SEMAPHORE_API_KEY', '')
    sender_name = _setting('SEMAPHORE_SENDER_NAME', '')
    recipient = normalize_phone_number(phone_number)

    if not api_key:
        return {'sent': False, 'skipped': True, 'reason': 'SEMAPHORE_API_KEY is not configured'}
    if not recipient:
        return {'sent': False, 'skipped': True, 'reason': 'Recipient phone number is missing'}
    if not message:
        return {'sent': False, 'skipped': True, 'reason': 'SMS message is empty'}

    payload = {
        'apikey': api_key,
        'number': recipient,
        'message': str(message)[:1000],
    }
    if sender_name:
        payload['sendername'] = sender_name

    data = urlencode(payload).encode('utf-8')
    request = Request(
        SEMAPHORE_API_URL,
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )

    try:
        with urlopen(request, timeout=15) as response:
            body = response.read().decode('utf-8')
            try:
                parsed = json.loads(body)
            except json.JSONDecodeError:
                parsed = body
            return {'sent': True, 'response': parsed}
    except HTTPError as exc:
        return {'sent': False, 'status': exc.code, 'reason': exc.read().decode('utf-8', errors='ignore')}
    except URLError as exc:
        return {'sent': False, 'reason': str(exc.reason)}


def ready_message(student_name, book_title, book_no):
    title = book_title or 'your reserved book'
    suffix = f' ({book_no})' if book_no else ''
    return f'Hi {student_name or "Student"}, {title}{suffix} is ready for pickup at the library. Please bring your library card.'


def overdue_message(student_name, book_title, book_no, due_at):
    title = book_title or 'a borrowed book'
    suffix = f' ({book_no})' if book_no else ''
    due_text = due_at.strftime('%m/%d/%Y %I:%M %p') if isinstance(due_at, datetime) else str(due_at or 'the due date')
    return f'Hi {student_name or "Student"}, {title}{suffix} was due on {due_text}. Please return it to the library as soon as possible.'


def insert_student_notification(cursor, recipient_id, notif_type, title, message, data=None):
    cursor.execute(
        """
        INSERT INTO notifications (recipient_id, type, title, message, data)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (recipient_id, notif_type, title, message, json.dumps(data or {})),
    )
