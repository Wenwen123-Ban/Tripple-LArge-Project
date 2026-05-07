"""Email confirmation helpers and Django-compatible views."""

import json
import os
import secrets
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from urllib.parse import quote

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
    pending_tokens[token] = {
        'gmail': gmail,
        'confirmed': False,
        'created_at': _now(),
    }
    return token


def mark_token_confirmed(token):
    _cleanup_expired_tokens()
    payload = pending_tokens.get(token)
    if not payload:
        return False
    payload['confirmed'] = True
    return True


def is_token_confirmed(token):
    _cleanup_expired_tokens()
    payload = pending_tokens.get(token)
    return bool(payload and payload.get('confirmed'))


def get_site_url():
    return os.getenv('SITE_URL', 'http://127.0.0.1:8000').rstrip('/')


def get_default_from_email():
    return os.getenv(
        'DEFAULT_FROM_EMAIL',
        f"Click & Collect <{os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')}>",
    )


def build_confirm_url(token):
    return f"{get_site_url()}/api/auth/confirm-email?token={quote(token)}"


def send_confirmation_email(gmail, name, confirm_url):
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
           You may now close this tab and return to the
           registration page to continue.</p>
      </div>
    </body>
    </html>
    """


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


def confirm_email(request):
    from django.http import HttpResponse

    token = request.GET.get('token', '')
    if mark_token_confirmed(token):
        return HttpResponse(build_confirm_success_html())
    return HttpResponse('<p>Invalid or expired confirmation link.</p>', status=400)


def check_token(request):
    from django.http import JsonResponse

    token = request.GET.get('token', '')
    return JsonResponse({'confirmed': is_token_confirmed(token)})
