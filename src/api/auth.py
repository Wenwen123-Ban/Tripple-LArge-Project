"""Email confirmation helpers and Django-compatible views."""

import json
import os
import random
import re
import secrets
import smtplib
import string
import time
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from urllib.parse import quote

import mysql.connector
from flask import jsonify, request, session

from src.core.db import get_db
from src.core.security import generate_setup_code, hash_password, verify_password

TOKEN_TTL_SECONDS = 15 * 60
pending_tokens = {}


def _now():
    return time.time()


def _cleanup_expired_tokens():
    cutoff = _now() - TOKEN_TTL_SECONDS
    expired = [
        token
        for token, payload in pending_tokens.items()
        if payload.get('created_at', 0) < cutoff
    ]
    for token in expired:
        pending_tokens.pop(token, None)


def create_confirmation_token(gmail):
    _cleanup_expired_tokens()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(seconds=TOKEN_TTL_SECONDS)

    db = get_db()
    cursor = db.cursor()
    _ensure_pending_confirmation_columns(cursor)
    cursor.execute(
        "DELETE FROM pending_confirmations WHERE gmail = %s OR expires_at <= NOW()",
        (gmail,),
    )
    cursor.execute(
        """
        INSERT INTO pending_confirmations (token, gmail, type, expires_at)
        VALUES (%s, %s, 'student', %s)
        """,
        (token, gmail, expires_at),
    )
    db.commit()
    cursor.close()
    return token


def mark_token_confirmed(token):
    _cleanup_expired_tokens()
    db = get_db()
    cursor = db.cursor()
    _ensure_pending_confirmation_confirmed_column(cursor)
    cursor.execute(
        """
        UPDATE pending_confirmations
        SET confirmed = 1
        WHERE token = %s
          AND expires_at > NOW()
        """,
        (token,),
    )
    db.commit()
    confirmed = cursor.rowcount > 0
    cursor.close()
    return confirmed


def is_token_confirmed(token):
    _cleanup_expired_tokens()
    return _token_confirmation_status(token).get('confirmed', False)


def get_confirmation_type(token):
    """Return pending confirmation type for rendering the right success page."""
    _cleanup_expired_tokens()
    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_pending_confirmation_columns(cursor)
    cursor.execute(
        """
        SELECT COALESCE(type, 'student') AS confirmation_type
        FROM pending_confirmations
        WHERE token = %s
          AND expires_at > NOW()
        """,
        (token,),
    )
    payload = cursor.fetchone()
    cursor.close()
    if not payload:
        return 'student'
    return payload.get('confirmation_type') or 'student'


def get_site_url():
    return os.getenv('SITE_URL', 'http://127.0.0.1:5000').rstrip('/')


def get_default_from_email():
    return os.getenv(
        'DEFAULT_FROM_EMAIL',
        f"Click & Collect <{os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')}>",
    )


def build_confirm_url(token):
    return f"{get_site_url()}/api/auth/confirm-email?token={quote(token)}"


def send_confirmation_email(gmail, name, confirm_url):
    try:
        host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        port = int(os.getenv('EMAIL_PORT', '587'))
        username = os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')
        password = os.getenv('EMAIL_HOST_PASSWORD', 'your-app-password')
        use_tls = os.getenv('EMAIL_USE_TLS', 'true').lower() in {'1', 'true', 'yes'}

        message = MIMEMultipart('alternative')
        message['Subject'] = 'Click & Collect — Confirm Your Email'
        message['From'] = get_default_from_email()
        message['To'] = gmail
        message.attach(MIMEText(
            f"Dear {name},\n\nPlease confirm your Click & Collect email address: {confirm_url}\n\n"
            'This link expires in 15 minutes.',
            'plain',
            'utf-8',
        ))
        message.attach(MIMEText(build_email_html(name, confirm_url), 'html', 'utf-8'))

        with smtplib.SMTP(host, port) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
        
        print(f"✓ Email sent successfully to {gmail}")
    except smtplib.SMTPAuthenticationError:
        print(f"✗ Email error: Invalid Gmail credentials. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env")
        raise
    except smtplib.SMTPException as e:
        print(f"✗ Email error: {str(e)}")
        raise
    except Exception as e:
        print(f"✗ Unexpected error sending email: {str(e)}")
        raise


def send_confirmation_email_django(gmail, name, confirm_url):
    from django.conf import settings
    from django.core.mail import send_mail

    send_mail(
        subject='Click & Collect — Confirm Your Email',
        message=(
            f'Dear {name},\n\n'
            f'Please confirm your Click & Collect email address: {confirm_url}\n\n'
            'This link expires in 15 minutes.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[gmail],
        html_message=build_email_html(name, confirm_url),
        fail_silently=False,
    )


def build_email_html(name, confirm_url):
    safe_name = escape(name or 'Student')
    safe_confirm_url = escape(confirm_url, quote=True)
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f4f4f8;padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;
                        border:2px solid #1A1A6E;overflow:hidden;">
            <tr>
              <td style="background:#4B0082;padding:24px 32px;text-align:center;">
                <p style="margin:0;color:#FFD700;font-size:11px;
                           letter-spacing:0.1em;text-transform:uppercase;">
                  North Western Mindanao State College of Science and Technology
                </p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;
                            font-weight:900;letter-spacing:0.02em;">
                  Click &amp; Collect
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 24px;">
                <p style="margin:0 0 8px;font-size:16px;
                           color:#1A1A6E;font-weight:700;">
                  Dear {safe_name},
                </p>
                <p style="margin:0 0 20px;font-size:14px;
                           color:#333333;line-height:1.6;">
                  Thank you for registering with the
                  <strong>Click &amp; Collect Library Borrowing System</strong>.
                  To complete your registration, please confirm your email address
                  by clicking the button below.
                </p>
                <p style="margin:0 0 8px;font-size:13px;
                           color:#555555;line-height:1.5;">
                  Once confirmed, return to the registration page — your form will
                  automatically recognize the confirmation and allow you to proceed.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;text-align:center;">
                <a href="{safe_confirm_url}"
                   style="display:inline-block;padding:12px 48px;
                          background:#4B0082;color:#ffffff;
                          font-size:15px;font-weight:700;
                          text-decoration:none;border-radius:999px;
                          border:2px solid #4B0082;">
                  Confirm My Email
                </a>
                <p style="margin:16px 0 0;font-size:11px;color:#999999;">
                  This link expires in 15 minutes. If you did not register,
                  please ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f4f4f8;padding:16px 40px;
                          border-top:1px solid #e0e0e0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#aaaaaa;">
                  Click &amp; Collect &mdash; NMSC Library System &bull;
                  This is an automated message, please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
      <script>setTimeout(() => window.location.href = "/main/registration?confirmed=1", 1500);</script>
    </body>
    </html>
    """


def build_confirm_success_html():
    return """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Email Confirmed — Click & Collect</title>
      <style>
        body { margin:0; font-family: Arial, sans-serif;
               background:#f4f4f8; display:flex;
               align-items:center; justify-content:center;
               min-height:100vh; }
        .card { background:#fff; border:2px solid #1A1A6E;
                border-radius:14px; padding:48px 56px;
                text-align:center; max-width:420px; }
        .check { font-size:56px; color:#4B0082; margin-bottom:16px; }
        h2 { color:#1A1A6E; margin:0 0 12px; font-size:22px; }
        p  { color:#555; font-size:14px; line-height:1.6; margin:0; }
        .brand { color:#4B0082; font-weight:900; font-size:20px;
                 margin-bottom:24px; display:block; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="brand">Click &amp; Collect</span>
        <div class="check">&#10003;</div>
        <h2>Email Confirmed!</h2>
        <p>Your email address has been successfully verified.
           You are being redirected back to registration.</p>
      </div>
      <script>setTimeout(() => window.location.href = "/main/registration?confirmed=1", 1500);</script>
    </body>
    </html>
    """


def build_admin_confirm_page(setup_code):
    safe_setup_code = escape(setup_code or '')
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Account Confirmed — Click & Collect</title>
      <style>
        * {{ box-sizing:border-box;margin:0;padding:0; }}
        body {{
          font-family:Arial,sans-serif;
          background:#f4f4f8;
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:100vh;
          padding:20px;
        }}
        .card {{
          background:#fff;
          border:2px solid #1A1A6E;
          border-radius:14px;
          padding:40px 48px;
          text-align:center;
          max-width:480px;
          width:100%;
        }}
        .brand {{
          color:#4B0082;
          font-weight:900;
          font-size:22px;
          display:block;
          margin-bottom:6px;
        }}
        .school {{
          font-size:11px;
          color:#888;
          margin-bottom:28px;
          line-height:1.5;
        }}
        .check {{ font-size:48px;color:#22C55E;margin-bottom:12px; }}
        h2 {{ color:#1A1A6E;font-size:20px;margin-bottom:8px; }}
        .subtitle {{
          font-size:13px;
          color:#555;
          margin-bottom:28px;
          line-height:1.6;
        }}
        .code-box {{
          background:#f4f4f8;
          border:2px dashed #4B0082;
          border-radius:10px;
          padding:24px;
          margin-bottom:20px;
        }}
        .code-label {{
          font-size:12px;
          font-weight:700;
          color:#4B0082;
          text-transform:uppercase;
          letter-spacing:0.08em;
          margin-bottom:12px;
        }}
        .code-value {{
          font-size:26px;
          font-weight:900;
          letter-spacing:0.15em;
          color:#1A1A6E;
          margin-bottom:14px;
          word-break:break-all;
        }}
        .code-warning {{ font-size:12px;color:#e53e3e;line-height:1.7; }}
        .security-note {{
          background:#fff3cd;
          border:1.5px solid #FFD700;
          border-radius:8px;
          padding:14px 18px;
          font-size:12px;
          color:#856404;
          line-height:1.7;
          text-align:left;
          margin-bottom:24px;
        }}
        .close-note {{ font-size:13px;color:#555;line-height:1.6; }}
        .footer {{ margin-top:28px;font-size:11px;color:#aaa; }}
      </style>
    </head>
    <body>
      <div class="card">
        <span class="brand">Click &amp; Collect</span>
        <p class="school">
          North Western Mindanao State College<br>
          of Science and Technology
        </p>
        <div class="check">&#10003;</div>
        <h2>Gmail Confirmed!</h2>
        <p class="subtitle">
          Your administrator account has been activated.<br>
          Below is your <strong>one-time recovery code</strong>.
        </p>

        <div class="code-box">
          <p class="code-label">Your One-Time Recovery Code</p>
          <p class="code-value">{safe_setup_code}</p>
          <p class="code-warning">
            ⚠ Write this down physically right now.<br>
            <strong>Do NOT save it digitally.</strong><br>
            <strong>Do NOT share it with anyone</strong>
            including the admin who registered you.<br>
            This code will <strong>never be shown again</strong>.
          </p>
        </div>

        <div class="security-note">
          <strong>What is this code for?</strong><br>
          This is your personal recovery key. If you ever forget
          your password, you will need this code along with your
          Gmail verification to reset it. Without this code,
          account recovery will require manual administrator
          intervention.
        </div>

        <p class="close-note">
          You may now <strong>close this tab</strong>.<br>
          Go to the login page and sign in with your
          Admin ID and password.
        </p>

        <div class="footer">
          Click &amp; Collect &mdash; NMSC Library System &bull;
          This page is private to you only.
        </div>
      </div>
    </body>
    </html>
    """


def build_admin_confirm_success_html():
    return """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin Gmail Confirmed — Click & Collect</title>
      <style>
        body { margin:0; font-family: Arial, sans-serif;
               background:#f4f4f8; display:flex;
               align-items:center; justify-content:center;
               min-height:100vh; }
        .card { background:#fff; border:2px solid #1A1A6E;
                border-radius:14px; padding:44px 52px;
                text-align:center; max-width:460px; }
        .check { font-size:56px; color:#4B0082; margin-bottom:16px; }
        h2 { color:#1A1A6E; margin:0 0 12px; font-size:22px; }
        p  { color:#555; font-size:14px; line-height:1.6; margin:0 0 16px; }
        .brand { color:#4B0082; font-weight:900; font-size:20px;
                 margin-bottom:24px; display:block; }
        .button { display:inline-block; padding:12px 30px; border-radius:999px;
                  background:#4B0082; color:#fff; text-decoration:none; font-weight:700; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="brand">Click &amp; Collect</span>
        <div class="check">&#10003;</div>
        <h2>Admin Gmail Confirmed!</h2>
        <p>The admin registration form can now show the checked confirmation box and enable <strong>view your private one-time recovery code</strong>.</p>
        <a class="button" href="/admin/users">Return to Admin Users</a>
      </div>
    </body>
    </html>
    """


def _json_payload():
    return request.get_json(silent=True) or {}


def _clean(value, default=''):
    if value is None:
        return default
    return str(value).strip()


def validate_registration_fields(data, is_admin=False):
    """Returns list of validation errors for registration payloads."""
    errors = []

    id_field = _clean(data.get('admin_id' if is_admin else 'student_id'))
    if not re.match(r'^\d{4}-\d{5}$', id_field):
        errors.append('ID must be in format YYYY-NNNNN (4 digits, hyphen, 5 digits)')
    if not re.match(r'^\d{4}-\d{5}$', _clean(data.get('lbc_no'))):
        errors.append('LBC No must be in format XXXX-XXXXX (4 digits, hyphen, 5 digits)')
    if not re.match(r'^\d{11}$', _clean(data.get('contact_no'))):
        errors.append('Contact No must be exactly 11 digits')
    if not re.match(r'^[^\s@]+@gmail\.com$', _clean(data.get('gmail')), re.IGNORECASE):
        errors.append('Gmail must be a valid @gmail.com address')
    if len(data.get('password') or '') < 8:
        errors.append('Password must be at least 8 characters')

    return errors


def register_student():
    data = _json_payload()
    errors = validate_registration_fields(data, is_admin=False)
    if errors:
        return jsonify({'error': errors[0]}), 400
    student_id = _clean(data.get('student_id') or data.get('admin_id'))
    lbc_no = _clean(data.get('lbc_no'))
    full_name = _clean(data.get('full_name'))
    address = _clean(data.get('address'))
    contact_no = _clean(data.get('contact_no'))
    password = data.get('password') or ''
    course = _clean(data.get('course'), 'N/A') or 'N/A'
    year_level = _clean(data.get('year_level'))
    gmail = _clean(data.get('gmail'))
    token = _clean(data.get('token'))

    if not all([student_id, full_name, password, gmail, token]):
        return jsonify({'error': 'Missing required registration fields'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT *
        FROM pending_confirmations
        WHERE token = %s
          AND gmail = %s
          AND confirmed = 1
          AND expires_at > NOW()
        """,
        (token, gmail),
    )
    confirmation = cursor.fetchone()

    if not confirmation:
        cursor.close()
        return jsonify({'error': 'Email not confirmed'}), 403

    password_hash = hash_password(password)

    try:
        cursor.execute(
            """
            INSERT INTO students
                (student_id, lbc_no, full_name, address,
                 contact_no, password_hash, course,
                 year_level, gmail, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
            """,
            (
                student_id, lbc_no, full_name, address,
                contact_no, password_hash, course,
                year_level, gmail,
            ),
        )
        cursor.execute(
            "DELETE FROM pending_confirmations WHERE token = %s",
            (token,),
        )
        db.commit()
        return jsonify({'status': 'registered'})
    except mysql.connector.IntegrityError:
        db.rollback()
        return jsonify({'error': 'Student ID or Gmail already exists'}), 409
    finally:
        cursor.close()


def build_recovery_email(name, code, expires_minutes=15):
    safe_name = escape(name or 'Student')
    safe_code = escape(code or '')
    return f"""
    <!DOCTYPE html><html>
    <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f4f4f8;padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
                 style="background:#fff;border-radius:12px;
                        border:2px solid #1A1A6E;overflow:hidden;">
            <tr>
              <td style="background:#4B0082;padding:24px 32px;text-align:center;">
                <p style="margin:0;color:#FFD700;font-size:11px;
                           letter-spacing:0.1em;text-transform:uppercase;">
                  North Western Mindanao State College of Science and Technology
                </p>
                <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:900;">
                  Click &amp; Collect
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 16px;">
                <p style="margin:0 0 8px;font-size:16px;
                           color:#1A1A6E;font-weight:700;">
                  Dear {safe_name},
                </p>
                <p style="margin:0 0 20px;font-size:14px;
                           color:#333;line-height:1.6;">
                  We received a request to recover your
                  <strong>Click &amp; Collect</strong> account.
                  Use the code below to reset your password.
                  This code expires in <strong>{expires_minutes} minutes</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;text-align:center;">
                <div style="display:inline-block;padding:18px 56px;
                             background:#f4f4f8;border-radius:10px;
                             border:2px dashed #4B0082;">
                  <span style="font-size:36px;font-weight:900;
                               letter-spacing:0.2em;color:#4B0082;">
                    {safe_code}
                  </span>
                </div>
                <p style="margin:16px 0 0;font-size:11px;color:#999;">
                  Enter this code in the recovery form.
                  If you did not request this, ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f4f4f8;padding:16px 40px;
                          border-top:1px solid #e0e0e0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#aaa;">
                  Click &amp; Collect &mdash; NMSC Library System &bull;
                  Do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
      <script>setTimeout(() => window.location.href = "/main/registration?confirmed=1", 1500);</script>
    </body></html>
    """


def send_recovery_email(gmail, name, code, expires_minutes=15):
    host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    port = int(os.getenv('EMAIL_PORT', '587'))
    username = os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')
    password = os.getenv('EMAIL_HOST_PASSWORD', 'your-app-password')
    use_tls = os.getenv('EMAIL_USE_TLS', 'true').lower() in {'1', 'true', 'yes'}

    message = MIMEMultipart('alternative')
    message['Subject'] = 'Click & Collect — Account Recovery Code'
    message['From'] = get_default_from_email()
    message['To'] = gmail
    message.attach(MIMEText(
        f"Dear {name},\n\nUse this Click & Collect recovery code to reset your password: {code}\n\n"
        f'This code expires in {expires_minutes} minutes.',
        'plain',
        'utf-8',
    ))
    message.attach(MIMEText(build_recovery_email(name, code, expires_minutes), 'html', 'utf-8'))

    with smtplib.SMTP(host, port) as smtp:
        if use_tls:
            smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)


def recovery_request():
    data = _json_payload()
    student_id = _clean(data.get('admin_id') or data.get('student_id'))
    lbc_no = _clean(data.get('lbc_no'))
    gmail = _clean(data.get('gmail'))

    if not student_id or not lbc_no or not gmail:
        return jsonify({'error': 'Student ID, LBC No, and Gmail are required.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type_column(cursor)
    cursor.execute(
        """
        SELECT * FROM students
        WHERE student_id = %s
          AND lbc_no = %s
          AND gmail = %s
          AND is_verified = 1
          AND COALESCE(account_type, 'student') <> 'admin'
        """,
        (student_id, lbc_no, gmail),
    )
    student = cursor.fetchone()

    if not student:
        cursor.close()
        return jsonify({
            'error': 'No matching account found. Check your ID, LBC No, and Gmail.',
        }), 404

    code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.now() + timedelta(minutes=15)

    cursor.execute(
        "DELETE FROM recovery_codes WHERE student_id = %s",
        (student_id,),
    )
    cursor.execute(
        """
        INSERT INTO recovery_codes (student_id, code, expires_at)
        VALUES (%s, %s, %s)
        """,
        (student_id, code, expires_at),
    )
    db.commit()
    cursor.close()

    send_recovery_email(gmail, student['full_name'], code)

    return jsonify({'status': 'sent'})


def recovery_verify():
    data = _json_payload()
    student_id = _clean(data.get('student_id'))
    code = _clean(data.get('code'))
    new_pass = data.get('new_password') or ''

    if not student_id or not code or not new_pass:
        return jsonify({'error': 'Student ID, recovery code, and new password are required.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type_column(cursor)
    cursor.execute(
        """
        SELECT COALESCE(account_type, 'student') AS account_type
        FROM students
        WHERE student_id = %s
        """,
        (student_id,),
    )
    account = cursor.fetchone()
    if account and account.get('account_type') == 'admin':
        cursor.close()
        log_security_event(
            student_id=student_id,
            event_type='ADMIN_RECOVERY_LEGACY_BLOCK',
            ip_address=_client_ip(),
            description='Admin recovery attempted through student endpoint',
        )
        return jsonify({'error': 'Use secure admin recovery for admin accounts.'}), 403

    cursor.execute(
        """
        SELECT * FROM recovery_codes
        WHERE student_id = %s
          AND code = %s
          AND used = 0
          AND expires_at > NOW()
        """,
        (student_id, code),
    )
    record = cursor.fetchone()

    if not record:
        cursor.close()
        return jsonify({'error': 'Invalid or expired code'}), 400

    new_hash = hash_password(new_pass)

    cursor.execute(
        "UPDATE students SET password_hash = %s WHERE student_id = %s",
        (new_hash, student_id),
    )
    cursor.execute(
        "UPDATE recovery_codes SET used = 1 WHERE id = %s",
        (record['id'],),
    )
    db.commit()
    cursor.close()

    return jsonify({'status': 'password_updated'})



def _client_ip():
    forwarded_for = request.headers.get('X-Forwarded-For', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.remote_addr


def log_security_event(student_id, event_type, ip_address, description):
    """Reusable logger that writes recovery events to the security_logs table."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO security_logs
                (student_id, event_type, ip_address, description)
            VALUES (%s, %s, %s, %s)
            """,
            (student_id or 'UNKNOWN', event_type, ip_address, description[:255]),
        )
        db.commit()
        cursor.close()
    except Exception as exc:
        print(f"Security log error: {exc}")


def _admin_recovery_window_allows(now=None):
    now = now or datetime.now()
    start_str = os.getenv('ADMIN_RECOVERY_START', '08:00')
    end_str = os.getenv('ADMIN_RECOVERY_END', '17:00')
    days_str = os.getenv('ADMIN_RECOVERY_DAYS', 'Mon,Tue,Wed,Thu,Fri')

    start_h, start_m = map(int, start_str.split(':'))
    end_h, end_m = map(int, end_str.split(':'))

    allowed_days = [day.strip() for day in days_str.split(',') if day.strip()]
    current_day = now.strftime('%a')
    current_mins = now.hour * 60 + now.minute
    window_start = start_h * 60 + start_m
    window_end = end_h * 60 + end_m

    return current_day in allowed_days and window_start <= current_mins <= window_end


def check_account_type():
    """Return whether an account is a student or admin for recovery routing."""
    data = _json_payload()
    student_id = _clean(data.get('student_id'))

    if not student_id:
        return jsonify({'error': 'Student ID is required.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type_column(cursor)
    _ensure_admins_table(cursor)
    cursor.execute(
        """
        SELECT 'admin' AS account_type
        FROM admins
        WHERE admin_id = %s
        """,
        (student_id,),
    )
    account = cursor.fetchone()

    if not account:
        cursor.execute(
            """
            SELECT COALESCE(account_type, 'student') AS account_type
            FROM students
            WHERE student_id = %s
            """,
            (student_id,),
        )
        account = cursor.fetchone()

    cursor.close()

    if not account:
        return jsonify({'error': 'No matching account found.'}), 404

    return jsonify({'account_type': account['account_type'] or 'student'})


def admin_recovery_request():
    """Step 1: verify the admin recovery time window and send a Gmail code."""
    now = datetime.now()
    ip_address = _client_ip()

    if not _admin_recovery_window_allows(now):
        log_security_event(
            student_id='ADMIN',
            event_type='ADMIN_RECOVERY_TIME_BLOCK',
            ip_address=ip_address,
            description=f'Recovery attempted outside window at {now}',
        )
        return jsonify({
            'error': 'Admin recovery is only available Mon-Fri 8AM-5PM.',
        }), 403

    data = _json_payload()
    student_id = _clean(data.get('student_id'))
    lbc_no = _clean(data.get('lbc_no'))
    gmail = _clean(data.get('gmail'))

    if not student_id or not lbc_no or not gmail:
        return jsonify({'error': 'Admin ID, LBC, and Gmail are required.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_account_type_column(cursor)
    cursor.execute(
        """
        SELECT * FROM students
        WHERE student_id = %s
          AND lbc_no = %s
          AND gmail = %s
          AND account_type = 'admin'
          AND is_verified = 1
        """,
        (student_id, lbc_no, gmail),
    )
    admin = cursor.fetchone()

    if not admin:
        cursor.close()
        log_security_event(
            student_id=student_id or 'UNKNOWN',
            event_type='ADMIN_RECOVERY_FAIL',
            ip_address=ip_address,
            description='Invalid admin credentials on recovery attempt',
        )
        return jsonify({'error': 'No matching admin account found.'}), 404

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    expires_at = datetime.now() + timedelta(minutes=5)

    cursor.execute("DELETE FROM recovery_codes WHERE student_id = %s", (student_id,))
    cursor.execute(
        """
        INSERT INTO recovery_codes (student_id, code, expires_at)
        VALUES (%s, %s, %s)
        """,
        (student_id, code, expires_at),
    )
    db.commit()
    cursor.close()

    send_recovery_email(gmail, admin['full_name'], code, expires_minutes=5)

    log_security_event(
        student_id=student_id,
        event_type='ADMIN_RECOVERY_CODE_SENT',
        ip_address=ip_address,
        description='Recovery code sent to admin Gmail',
    )

    return jsonify({'status': 'code_sent'})


def admin_recovery_verify():
    """Step 2: verify Gmail code plus physical key and update admin password."""
    data = _json_payload()
    student_id = _clean(data.get('student_id'))
    gmail_code = _clean(data.get('gmail_code') or data.get('code'))
    recovery_key = _clean(data.get('recovery_key'))
    new_password = data.get('new_password') or ''
    ip_address = _client_ip()

    if not student_id or not gmail_code or not recovery_key or not new_password:
        return jsonify({
            'error': 'Admin ID, Gmail code, recovery key, and new password are required.',
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT * FROM recovery_codes
        WHERE student_id = %s
          AND code = %s
          AND used = 0
          AND expires_at > NOW()
        """,
        (student_id, gmail_code),
    )
    code_record = cursor.fetchone()

    if not code_record:
        cursor.close()
        log_security_event(
            student_id=student_id,
            event_type='ADMIN_RECOVERY_WRONG_CODE',
            ip_address=ip_address,
            description='Wrong or expired Gmail code on admin recovery',
        )
        return jsonify({'error': 'Invalid or expired code.'}), 400

    cursor.execute(
        """
        SELECT recovery_key_hash FROM students
        WHERE student_id = %s AND account_type = 'admin'
        """,
        (student_id,),
    )
    admin = cursor.fetchone()

    if not admin or not verify_password(recovery_key, admin.get('recovery_key_hash')):
        cursor.close()
        log_security_event(
            student_id=student_id,
            event_type='ADMIN_RECOVERY_WRONG_KEY',
            ip_address=ip_address,
            description='Wrong physical recovery key on admin recovery',
        )
        return jsonify({'error': 'Invalid recovery key.'}), 400

    new_hash = hash_password(new_password)
    cursor.execute(
        """
        UPDATE students SET password_hash = %s
        WHERE student_id = %s AND account_type = 'admin'
        """,
        (new_hash, student_id),
    )
    cursor.execute(
        "UPDATE recovery_codes SET used = 1 WHERE student_id = %s",
        (student_id,),
    )
    db.commit()
    cursor.close()

    log_security_event(
        student_id=student_id,
        event_type='ADMIN_RECOVERY_SUCCESS',
        ip_address=ip_address,
        description='Admin password successfully recovered',
    )

    return jsonify({'status': 'password_updated'})

def send_confirmation(request):
    from django.http import JsonResponse

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    data = json.loads(request.body or '{}')
    gmail = (data.get('gmail') or '').strip()
    name = (data.get('name') or 'Student').strip() or 'Student'

    if not gmail.lower().endswith('@gmail.com'):
        return JsonResponse({'error': 'Valid Gmail address required'}, status=400)

    token = create_confirmation_token(gmail)
    send_confirmation_email_django(gmail, name, build_confirm_url(token))
    return JsonResponse({'status': 'sent', 'token': token})


def confirm_email_token(token):
    if not token:
        return '<p>Invalid link.</p>', 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_pending_confirmation_columns(cursor)
    _ensure_admins_table(cursor)

    cursor.execute(
        """
        SELECT *
        FROM pending_confirmations
        WHERE token = %s
          AND expires_at > NOW()
        """,
        (token,),
    )
    record = cursor.fetchone()

    if not record:
        cursor.close()
        return '<p>Invalid or expired confirmation link.</p>', 400

    is_admin = (record.get('type') or 'student') == 'admin'
    setup_code = record.get('setup_code_temp')

    cursor.execute(
        """
        UPDATE pending_confirmations
        SET confirmed = 1
        WHERE token = %s
        """,
        (token,),
    )

    if is_admin:
        cursor.execute(
            """
            UPDATE admins
            SET is_verified = 1
            WHERE gmail = %s
            """,
            (record.get('gmail'),),
        )

    cursor.execute(
        """
        UPDATE pending_confirmations
        SET setup_code_temp = NULL
        WHERE token = %s
        """,
        (token,),
    )
    db.commit()
    cursor.close()

    if is_admin and setup_code:
        return build_admin_confirm_page(setup_code), 200
    return build_confirm_success_html(), 200


def confirm_email(request):
    from django.http import HttpResponse

    html, status = confirm_email_token(request.GET.get('token', ''))
    return HttpResponse(html, status=status)


def check_token(request):
    from django.http import JsonResponse

    token = request.GET.get('token', '')
    return JsonResponse(_token_confirmation_status(token))


def _ensure_account_type_column(cursor):
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN account_type VARCHAR(20) DEFAULT 'student'")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_pending_confirmation_type_column(cursor):
    try:
        cursor.execute("ALTER TABLE pending_confirmations ADD COLUMN type VARCHAR(20) DEFAULT 'student'")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise


def _ensure_pending_confirmation_confirmed_column(cursor):
    try:
        cursor.execute("ALTER TABLE pending_confirmations ADD COLUMN confirmed TINYINT(1) DEFAULT 0")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise



def _ensure_pending_confirmation_setup_code_column(cursor):
    try:
        cursor.execute("ALTER TABLE pending_confirmations ADD COLUMN setup_code_temp VARCHAR(50) DEFAULT NULL")
    except mysql.connector.Error as exc:
        if exc.errno != 1060:
            raise

def _ensure_pending_confirmation_columns(cursor):
    _ensure_pending_confirmation_confirmed_column(cursor)
    _ensure_pending_confirmation_type_column(cursor)
    _ensure_pending_confirmation_setup_code_column(cursor)


def _token_confirmation_status(token):
    if not token:
        return {'confirmed': False}

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_pending_confirmation_confirmed_column(cursor)
    cursor.execute(
        """
        SELECT confirmed
        FROM pending_confirmations
        WHERE token = %s
          AND expires_at > NOW()
        """,
        (token,),
    )
    record = cursor.fetchone()
    cursor.close()

    if not record:
        return {'confirmed': False, 'expired': True}

    return {'confirmed': bool(record.get('confirmed'))}


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


def build_admin_confirm_button_html(confirm_url):
    """Build admin Gmail confirmation button HTML without nested triple strings."""
    if not confirm_url:
        return ''

    return ''.join([
        '<p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.7;">',
        'Click the button below to confirm this Gmail address and receive your ',
        'private one-time recovery code.</p>',
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" ',
        'style="margin:0 0 18px;"><tr><td align="center">',
        f'<a href="{confirm_url}" target="_blank" rel="noopener" ',
        'style="display:inline-block;padding:13px 36px;background:#4B0082;',
        'color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;',
        'border:2px solid #4B0082;">Confirm Admin Gmail</a>',
        '</td></tr></table>',
        '<p style="margin:0 0 20px;font-size:12px;color:#555;line-height:1.6;',
        'word-break:break-all;">If the button is not visible or does not open, ',
        'copy and paste this confirmation link into your browser:<br>',
        f'<a href="{confirm_url}" target="_blank" rel="noopener" ',
        f'style="color:#4B0082;">{confirm_url}</a></p>',
    ])


def build_admin_invite_email(name, registered_by, registered_at, confirm_url=None, expires_minutes=15):
    safe_name = escape(name or 'Administrator')
    safe_registered_by = escape(registered_by or 'System')
    safe_registered_at = escape(registered_at or 'N/A')
    safe_confirm_url = escape(confirm_url or '', quote=True)
    confirm_button = ''
    next_step_text = 'Your administrator account has been created. Confirm your Gmail to receive your private one-time recovery code, then keep that code written down in a safe physical place.'
    security_text = '<strong>Do not save or share your one-time code.</strong> It is your physical recovery key.'
    if safe_confirm_url:
        next_step_text = 'To complete your account setup, click the confirmation button. Your private one-time recovery code will be shown on the confirmation page and must be <strong>written down immediately</strong>.'
        security_text = f'This confirmation link expires in <strong>{expires_minutes} minutes</strong>.<br><strong>Do not save or share your one-time code.</strong> It is your physical recovery key.'
        confirm_button = build_admin_confirm_button_html(safe_confirm_url)
    return ''.join([
        '<!DOCTYPE html><html>',
        '<body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" '
        'style="background:#f4f4f8;padding:40px 0;">',
        '<tr><td align="center">',
        '<table width="520" cellpadding="0" cellspacing="0" '
        'style="background:#fff;border-radius:12px;border:2px solid #1A1A6E;overflow:hidden;">',
        '<tr><td style="background:#4B0082;padding:24px 32px;text-align:center;">',
        '<p style="margin:0;color:#FFD700;font-size:11px;letter-spacing:0.1em;'
        'text-transform:uppercase;">',
        'North Western Mindanao State College of Science and Technology',
        '</p>',
        '<h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:900;">'
        'Click &amp; Collect</h1>',
        '<p style="margin:6px 0 0;color:#FFD700;font-size:13px;font-weight:700;'
        'letter-spacing:0.05em;">ADMINISTRATOR ACCOUNT NOTICE</p>',
        '</td></tr>',
        '<tr><td style="padding:32px 40px 16px;">',
        f'<p style="margin:0 0 12px;font-size:16px;color:#1A1A6E;font-weight:700;">'
        f'Dear {safe_name},</p>',
        '<p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.7;">'
        'You have been granted <strong>Administrator access</strong> to the '
        '<strong>Click &amp; Collect Library Borrowing System</strong> at NMSC-ST.</p>',
        '<div style="background:#f4f4f8;border-left:4px solid #4B0082;border-radius:6px;'
        'padding:14px 20px;margin:0 0 20px;">',
        '<p style="margin:0;font-size:13px;color:#555;line-height:1.8;">',
        f'<strong>Registered by:</strong> {safe_registered_by}<br>',
        f'<strong>Registered at:</strong> {safe_registered_at}',
        '</p>',
        '</div>',
        confirm_button,
        f'<p style="margin:0 0 12px;font-size:14px;color:#333;line-height:1.7;">'
        f'{next_step_text}</p>',
        '<div style="background:#fff3cd;border:1.5px solid #FFD700;border-radius:8px;'
        'padding:14px 20px;margin:0 0 20px;">',
        '<p style="margin:0;font-size:13px;color:#856404;line-height:1.7;">',
        '<strong>⚠ Security Notice:</strong><br>',
        f'{security_text}<br><br>',
        'If this was not your email or you did not request this account — '
        '<strong>disregard this email</strong>.',
        '</p>',
        '</div>',
        f'<p style="margin:0;font-size:14px;color:#1A1A6E;font-weight:700;">'
        f'Good luck, Librarian {safe_name}! 📚</p>',
        '</td></tr>',
        '<tr><td style="background:#f4f4f8;padding:16px 40px;border-top:1px solid #e0e0e0;'
        'text-align:center;">',
        '<p style="margin:0;font-size:11px;color:#aaa;">'
        'Click &amp; Collect &mdash; NMSC Library System &bull; Do not reply to this email.</p>',
        '</td></tr>',
        '</table>',
        '</td></tr>',
        '</table>',
        '</body></html>',
    ])


def send_admin_invite_email(gmail, name, registered_by, registered_at, confirm_url=None):
    """Send admin registration notice without setup code in email."""
    subject = 'Click & Collect — Admin Registration Notice'
    host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    port = int(os.getenv('EMAIL_PORT', '587'))
    username = os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')
    password = os.getenv('EMAIL_HOST_PASSWORD', 'your-app-password')
    use_tls = os.getenv('EMAIL_USE_TLS', 'true').lower() in {'1', 'true', 'yes'}
    if confirm_url:
        subject = 'Click & Collect — Confirm Admin Gmail'
    message = MIMEMultipart('alternative')
    message['Subject'] = subject
    message['From'] = get_default_from_email()
    message['To'] = gmail
    plain_message = (
        f'Dear {name or "Administrator"},\n\n'
        'You have been granted administrator access to Click & Collect.\n'
        f'Registered by: {registered_by or "System"}\n'
        f'Registered at: {registered_at or "N/A"}\n\n'
    )
    if confirm_url:
        plain_message += (
            'Confirm your admin Gmail using this link, then return to the admin registration form '
            f'to get the one-time setup code:\n{confirm_url}\n\n'
        )
    plain_message += 'If you did not request this account, ignore this email.'
    message.attach(MIMEText(plain_message, 'plain', 'utf-8'))
    message.attach(MIMEText(
        build_admin_invite_email(name, registered_by, registered_at, confirm_url),
        'html',
        'utf-8',
    ))
    with smtplib.SMTP(host, port) as smtp:
        if use_tls:
            smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)


def register_admin():
    """Register admin account with one-time setup code and confirmed email token."""
    data = _json_payload()
    errors = validate_registration_fields(data, is_admin=True)
    if errors:
        return jsonify({'error': errors[0]}), 400

    student_id = _clean(data.get('admin_id') or data.get('student_id'))
    lbc_no = _clean(data.get('lbc_no'))
    full_name = _clean(data.get('full_name'))
    address = _clean(data.get('address', ''))
    contact_no = _clean(data.get('contact_no'))
    password = data.get('password', '')
    gmail = _clean(data.get('gmail'))
    token = _clean(data.get('token'))

    if not all([student_id, full_name, password, gmail, token]):
        return jsonify({'error': 'Missing required fields'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    _ensure_admins_table(cursor)
    _ensure_pending_confirmation_type_column(cursor)

    cursor.execute(
        """
        SELECT * FROM pending_confirmations
        WHERE token = %s
          AND gmail = %s
          AND expires_at > NOW()
        """,
        (token, gmail),
    )

    confirmation = cursor.fetchone()
    if not confirmation:
        cursor.close()
        return jsonify({'error': 'Email not confirmed or token expired'}), 403

    setup_code = generate_setup_code()
    setup_code_hash = hash_password(setup_code)
    password_hash = hash_password(password)

    try:
        cursor.execute(
            """
            INSERT INTO admins (
                admin_id, lbc_no, full_name, address,
                contact_no, password_hash, gmail,
                is_verified, setup_code_hash
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                1, %s
            )
            """,
            (
                student_id, lbc_no, full_name, address,
                contact_no, password_hash, gmail,
                setup_code_hash,
            ),
        )

        cursor.execute(
            "DELETE FROM pending_confirmations WHERE token = %s",
            (token,),
        )
        db.commit()

        send_admin_invite_email(
            gmail,
            full_name,
            data.get('registered_by', 'System'),
            data.get('registered_at', 'N/A'),
        )

        return jsonify({
            'status': 'registered',
            'setup_code': setup_code,
            'message': 'Save this code. It will not be shown again.',
        }), 201

    except mysql.connector.IntegrityError:
        db.rollback()
        return jsonify({'error': 'Admin ID or Gmail already exists'}), 409
    finally:
        cursor.close()


def admin_send_confirmation():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405

    data = _json_payload()
    errors = validate_registration_fields(data, is_admin=True)
    if errors:
        return jsonify({'error': errors[0]}), 400

    admin_id = _clean(data.get('admin_id') or data.get('student_id'))
    lbc_no = _clean(data.get('lbc_no', ''))
    full_name = _clean(data.get('full_name') or data.get('name'))
    address = _clean(data.get('address', ''))
    contact_no = _clean(data.get('contact_no'))
    password = data.get('password', '')
    gmail = _clean(data.get('gmail'))
    registered_by = _clean(data.get('registered_by', 'Administrator')) or 'Administrator'
    registered_at = _clean(data.get('registered_at', 'N/A')) or 'N/A'

    if not all([admin_id, full_name, password, gmail]):
        return jsonify({'error': 'Missing required fields'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_admins_table(cursor)
    _ensure_pending_confirmation_columns(cursor)

    cursor.execute(
        """
        SELECT id
        FROM admins
        WHERE admin_id = %s OR gmail = %s
        """,
        (admin_id, gmail),
    )
    if cursor.fetchone():
        cursor.close()
        return jsonify({'error': 'Admin ID or Gmail already exists'}), 409

    setup_code = generate_setup_code()
    setup_code_hash = hash_password(setup_code)
    password_hash = hash_password(password)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(seconds=TOKEN_TTL_SECONDS)

    try:
        cursor.execute(
            """
            INSERT INTO admins (
                admin_id, lbc_no, full_name, address,
                contact_no, password_hash, gmail,
                is_verified, setup_code_hash
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                0, %s
            )
            """,
            (
                admin_id, lbc_no, full_name, address,
                contact_no, password_hash, gmail,
                setup_code_hash,
            ),
        )
        cursor.execute(
            "DELETE FROM pending_confirmations WHERE gmail = %s OR expires_at <= NOW()",
            (gmail,),
        )
        cursor.execute(
            """
            INSERT INTO pending_confirmations
                (token, gmail, type, expires_at, confirmed, setup_code_temp)
            VALUES (%s, %s, 'admin', %s, 0, %s)
            """,
            (token, gmail, expires_at, setup_code),
        )
        db.commit()
    except mysql.connector.IntegrityError:
        db.rollback()
        cursor.close()
        return jsonify({'error': 'Admin ID or Gmail already exists'}), 409
    except Exception:
        db.rollback()
        cursor.close()
        raise

    try:
        send_admin_invite_email(
            gmail,
            full_name,
            registered_by,
            registered_at,
            build_confirm_url(token),
        )
    except Exception:
        db.rollback()
        # Keep the unverified account and token out of the database if the email cannot be sent.
        cleanup_cursor = db.cursor()
        cleanup_cursor.execute("DELETE FROM pending_confirmations WHERE token = %s", (token,))
        cleanup_cursor.execute("DELETE FROM admins WHERE admin_id = %s AND is_verified = 0", (admin_id,))
        db.commit()
        cleanup_cursor.close()
        cursor.close()
        raise

    cursor.close()
    return jsonify({'status': 'sent', 'token': token})


def verify_admin_setup_code():
    data = _json_payload()
    student_id = _clean(data.get('student_id'))
    setup_code = _clean(data.get('setup_code'))
    if not student_id or not setup_code:
        return jsonify({'error':'Student ID and setup code are required'}),400
    db=get_db(); cursor=db.cursor(dictionary=True)
    _ensure_admins_table(cursor)
    cursor.execute("SELECT setup_code_hash FROM admins WHERE admin_id=%s",(student_id,))
    admin = cursor.fetchone()
    if not admin:
        cursor.close(); return jsonify({'error':'Admin account not found'}),404
    if not verify_password(setup_code, admin.get('setup_code_hash')):
        log_security_event(student_id,'ADMIN_SETUP_WRONG_CODE',_client_ip(),'Wrong setup code entered during admin activation')
        cursor.close(); return jsonify({'error':'Invalid setup code'}),400
    cursor.execute("UPDATE admins SET setup_code_hash=NULL WHERE admin_id=%s",(student_id,)); db.commit(); cursor.close()
    return jsonify({'status':'activated','redirect':'/admin/dashboard'})


def login():
    """Login endpoint for both admins and students."""
    data = _json_payload()
    student_id = _clean(data.get('student_id'))
    password = data.get('password') or ''

    if not student_id or not password:
        return jsonify({'error': 'Student ID and password are required.'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    _ensure_admins_table(cursor)
    cursor.execute(
        """
        SELECT *, 'admin' AS account_type FROM admins
        WHERE admin_id = %s AND is_verified = 1
        """,
        (student_id,),
    )
    user = cursor.fetchone()

    if not user:
        cursor.execute(
            """
            SELECT *, 'student' AS account_type FROM students
            WHERE student_id = %s AND is_verified = 1
            """,
            (student_id,),
        )
        user = cursor.fetchone()

    if not user:
        cursor.close()
        return jsonify({'error': 'Account not found'}), 404

    if not verify_password(password, user['password_hash']):
        log_security_event(student_id, 'LOGIN_FAIL', _client_ip(), 'Wrong password on login attempt')
        cursor.close()
        return jsonify({'error': 'Incorrect password'}), 401

    if user['account_type'] == 'admin':
        session['admin_id'] = student_id
        session['admin_name'] = user['full_name']
        session['account_type'] = 'admin'

        cursor.execute(
            """
            UPDATE admins
            SET last_login_ip   = %s,
                last_login_time = NOW()
            WHERE admin_id = %s
            """,
            (_client_ip(), student_id),
        )
        db.commit()
        cursor.close()
        return jsonify({'status': 'ok', 'redirect': '/admin/dashboard', 'type': 'admin', 'account_type': 'admin'})

    cursor.close()
    return jsonify({'status': 'ok', 'redirect': '/user/books', 'type': 'student', 'account_type': 'student'})


def logout():
    session.clear()
    return jsonify({'status': 'logged_out', 'redirect': '/main/sign_in'})
