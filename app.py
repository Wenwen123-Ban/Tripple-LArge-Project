from flask import Flask, jsonify, render_template, request, send_from_directory, session, Response
from functools import wraps
from time import time
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import os
from dotenv import load_dotenv
import psutil
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from external .env file for security
load_dotenv('C:\\CC-Config\\.env')

from src.api import admin, auth, books, users, urls
from src.api import transaction as tx_api
from src.api.auth import (
    build_confirm_url,
    create_confirmation_token_with_cooldown,
    confirm_email_token,
    send_confirmation_email,
    _token_confirmation_status,
)
from src.core.db import close_db
from src.core.models import initialize_schema
from src.core.seed_demo import seed_demo_data
from src.core.metrics import admin_ip_blocks, rate_limit_hits, view_response_time, session_conflicts, available_books_gauge, overdue_books_gauge, unread_notifications_gauge
from src.core.monitoring_alerts import send_system_alert
from src.core.db import get_db
from src.core.rate_limit_service import consume_token


app = Flask(
    __name__,
    template_folder='public/pages',
    static_folder='public'
)
app.secret_key = os.getenv('FLASK_SECRET') or 'dev-fallback-change-this'
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SEMAPHORE_API_KEY=os.getenv('SEMAPHORE_API_KEY', ''),
    SEMAPHORE_SENDER_NAME=os.getenv('SEMAPHORE_SENDER_NAME', ''),
)

app.config.update(
    SESSION_COOKIE_SECURE=False,
    PERMANENT_SESSION_LIFETIME=3600,
    SESSION_REFRESH_EACH_REQUEST=True,
)

ADMIN_WHITELIST_IPS = [ip.strip() for ip in os.getenv('ADMIN_WHITELIST_IPS', '127.0.0.1,172.28.234.190').split(',') if ip.strip()]
LOG_DIR = Path(BASE_DIR if 'BASE_DIR' in globals() else os.getcwd()) / 'logs'
LOG_DIR.mkdir(exist_ok=True)

def _build_file_logger(name, filename):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = RotatingFileHandler(LOG_DIR / filename, maxBytes=5 * 1024 * 1024, backupCount=5)
        handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
        logger.addHandler(handler)
    return logger

access_logger = _build_file_logger('lbas_access', 'lbas_access.log')
security_logger = _build_file_logger('lbas_security', 'security_events.log')
blocked_logger = _build_file_logger('admin_access_blocked', 'admin_access_blocked.log')


app.teardown_appcontext(close_db)


def register_api_blueprints(flask_app):
    """Register API blueprints while preserving legacy direct route bindings."""
    for blueprint in (
        getattr(auth, 'auth_bp', None),
        getattr(books, 'books_bp', None),
        getattr(tx_api, 'transaction_bp', None),
        getattr(urls, 'api_urls_bp', None),
    ):
        if blueprint and blueprint.name not in flask_app.blueprints:
            flask_app.register_blueprint(blueprint)


PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
PAGES_DIR = os.path.join(PUBLIC_DIR, 'pages')
register_api_blueprints(app)

_rate_window = {}

def _check_rate_limit(key, limit, period):
    now = time()
    bucket = [ts for ts in _rate_window.get(key, []) if now - ts < period]
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    _rate_window[key] = bucket
    return True

@app.before_request
def enforce_admin_ip_whitelist():
    if request.path.startswith('/admin/') or request.path.startswith('/health/'):
        ip = request.remote_addr or ''
        if ip not in ADMIN_WHITELIST_IPS:
            admin_ip_blocks.inc()
            send_system_alert('admin_ip_block', f'Blocked admin/health access from IP {ip} to {request.path}', 'warning')
            blocked_logger.warning('blocked ip=%s path=%s', ip, request.path)
            return ('Admin access is restricted to authorized network addresses.', 403)

@app.before_request
def enforce_rate_limits():
    ip = request.remote_addr or 'unknown'
    if request.path == '/api/auth/login' and not _check_rate_limit(f'login:{ip}', 10, 600):
        rate_limit_hits.labels(endpoint='login').inc()
        send_system_alert('rate_limit_hit', f'Login rate limit hit for IP {ip}', 'warning')
        security_logger.warning('rate_limit login ip=%s', ip)
        return ('Too many requests. Please wait before trying again.', 429)
    if request.path.startswith('/admin/'):
        uid = session.get('user_id') or ip
        if not _check_rate_limit(f'admin:{uid}', 100, 60):
            rate_limit_hits.labels(endpoint='admin').inc()
            security_logger.warning('rate_limit admin uid=%s ip=%s', uid, ip)
            return ('Too many requests. Please wait before trying again.', 429)

@app.before_request
def enforce_blocked_ips_on_login():
    if request.path in ['/main/sign_in', '/admin/login']:
        ip = request.remote_addr or '0.0.0.0'
        db = get_db(); c = db.cursor(dictionary=True)
        try:
            c.execute("SELECT is_blocked, blocked_until FROM ip_token_buckets WHERE ip_address=%s", (ip,))
            row = c.fetchone()
        finally:
            c.close()
        if row and row.get('is_blocked') and row.get('blocked_until'):
            from datetime import datetime
            if datetime.now() < row['blocked_until']:
                if session.get('saw_timeout'):
                    return ('Access Denied. This page is not available from your current connection.', 403)
                session['saw_timeout'] = True
                session['blocked_until'] = str(row['blocked_until'])
                return ('Access Temporarily Suspended', 429)
    if request.path.startswith('/user/') or request.path.startswith('/api/users/'):
        if not _check_rate_limit(f'student:{ip}', 50, 60):
            rate_limit_hits.labels(endpoint='student').inc()
            security_logger.warning('rate_limit student ip=%s', ip)
            return ('Too many requests. Please wait before trying again.', 429)

@app.before_request
def track_access_start():
    request._start_time = time()

@app.after_request
def log_access(response):
    elapsed = int((time() - getattr(request, '_start_time', time())) * 1000)
    view_response_time.labels(view_name=request.endpoint or 'unknown').observe(elapsed / 1000.0)
    uid = session.get('user_id', 'anon')
    access_logger.info('method=%s path=%s status=%s ms=%s user_id=%s', request.method, request.path, response.status_code, elapsed, uid)
    return response





def _session_conflict_response(expected_role):
    session_conflicts.inc()
    role = (session.get('account_type') or session.get('user_role') or 'unknown').strip().lower()
    if expected_role == 'admin':
        if role == 'student':
            message = 'Your librarian session was replaced by a student login in another tab. Please log in again as Librarian to continue.'
        else:
            message = 'Your librarian session has expired. Please log in again as Librarian to continue.'
        return jsonify({'error': message, 'session_conflict': True, 'redirect': '/main/sign_in'}), 401

    if role == 'admin':
        message = 'Your student session was replaced by an admin login in another tab. Please log in again to continue.'
    else:
        message = 'Your student session has expired. Please log in again to continue.'
    return jsonify({'error': message, 'session_conflict': True, 'redirect': '/main/sign_in'}), 401


@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


@app.route('/health/')
def health_check():
    from datetime import datetime
    health = {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat(), 'components': {}}
    try:
        db = get_db()
        c = db.cursor()
        c.execute("SELECT 1")
        c.fetchone()
        health['components']['database'] = {'status': 'ok'}
    except Exception as exc:
        health['status'] = 'degraded'
        health['components']['database'] = {'status': 'error', 'message': str(exc)}
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    health['components']['system'] = {'status': 'ok' if cpu < 90 else 'warning', 'cpu_percent': cpu, 'memory_percent': mem.percent, 'disk_percent': disk.percent}
    try:
        c = db.cursor(dictionary=True)
        c.execute("SELECT COUNT(*) c FROM books WHERE UPPER(COALESCE(availability_hint,status))='AVAILABLE'")
        available = (c.fetchone() or {}).get('c', 0)
        c.execute("SELECT COUNT(*) c FROM transactions WHERE action='borrowed' AND returned_at IS NULL AND due_at < NOW()")
        overdue = (c.fetchone() or {}).get('c', 0)
        c.execute("SELECT COUNT(*) c FROM notifications WHERE is_read=0")
        unread = (c.fetchone() or {}).get('c', 0)
        available_books_gauge.set(available); overdue_books_gauge.set(overdue); unread_notifications_gauge.set(unread)
        health['components']['lbas'] = {'status': 'ok', 'available_books': available, 'overdue_books': overdue, 'unread_notifications': unread}
        c.close()
    except Exception as exc:
        health['status'] = 'degraded'
        health['components']['lbas'] = {'status': 'error', 'message': str(exc)}
    return jsonify(health), (200 if health['status'] == 'healthy' else 503)


@app.before_request
def enforce_role_scoped_api_sessions():
    """Reject requests when the active session role doesn't match the API scope."""
    if not request.path.startswith('/api/') or request.path.startswith('/api/auth/'):
        return

    account_type = (session.get('account_type') or '').strip().lower()
    session_role = (session.get('user_role') or '').strip().lower()

    if request.path.startswith('/api/admin/'):
        if not session.get('admin_id'):
            return _session_conflict_response('admin')
        if account_type != 'admin' or session_role != 'admin':
            return _session_conflict_response('admin')
        return

    if request.path.startswith('/api/users/') or request.path.startswith('/api/transactions/'):
        admin_only_paths = (
            '/api/users/pending',
            '/api/users/',
            '/api/transactions/borrow',
            '/api/transactions/return',
            '/api/transactions/force-return',
            '/api/transactions/notify-borrower',
            '/api/transactions/manage',
        )
        needs_admin = request.path.startswith(admin_only_paths)
        expected_role = 'admin' if needs_admin else 'student'

        if expected_role == 'admin':
            if not session.get('admin_id') or account_type != 'admin' or session_role != 'admin':
                return _session_conflict_response('admin')
            return

        if not session.get('student_id') or account_type != 'student' or session_role != 'student':
            return _session_conflict_response('student')

@app.before_request
def audit_authenticated_api_actions():
    """Audit admin/student API activity for anomaly investigations."""
    if not request.path.startswith('/api/'):
        return
    if request.path.startswith('/api/admin/logs'):
        return
    if request.path in ('/api/auth/login', '/api/auth/logout'):
        return
    if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
        return

    account_id = session.get('admin_id') or session.get('student_id')
    account_type = session.get('account_type') or 'unknown'
    if not account_id:
        return

    auth.log_security_event(
        student_id=account_id,
        event_type=f"API_{request.method}",
        ip_address=request.remote_addr,
        description=f"{request.method} {request.path}",
        account_type=account_type,
    )


@app.route('/api/auth/send-confirmation', methods=['POST'])
def send_auth_confirmation():
    """Send a Gmail confirmation email for registration testing."""
    data = request.get_json(silent=True) or {}
    gmail = (data.get('gmail') or '').strip()
    name = (data.get('name') or 'Student').strip() or 'Student'

    if not gmail.lower().endswith('@gmail.com'):
        return jsonify({'error': 'Valid Gmail address required'}), 400

    token, retry_after = create_confirmation_token_with_cooldown(gmail)
    if retry_after > 0:
        return jsonify({
            'error': f'Please wait {retry_after} seconds before requesting another confirmation email.',
            'retry_after_seconds': retry_after,
        }), 429
    send_confirmation_email(gmail, name, build_confirm_url(token))
    return jsonify({'status': 'sent', 'token': token})


@app.route('/api/auth/confirm-email')
def confirm_auth_email():
    """Mark a token confirmed and render the right confirmation page."""
    html, status = confirm_email_token(request.args.get('token', ''))
    return html, status


@app.route('/api/auth/check-token')
def check_auth_token():
    """Report whether a pending confirmation token has been confirmed."""
    token = request.args.get('token', '')
    return jsonify(_token_confirmation_status(token))



app.add_url_rule(
    '/api/auth/register',
    'register_student',
    auth.register_student,
    methods=['POST'],
)
app.add_url_rule(
    '/api/auth/prevalidate-registration',
    'prevalidate_student_registration',
    auth.prevalidate_student_registration,
    methods=['POST'],
)
app.add_url_rule(
    '/api/auth/check-registration-conflicts',
    'check_registration_conflicts',
    auth.check_registration_conflicts,
    methods=['POST'],
)
app.add_url_rule(
    '/api/auth/recovery/request',
    'recovery_request',
    auth.recovery_request,
    methods=['POST'],
)
app.add_url_rule(
    '/api/auth/recovery/verify',
    'recovery_verify',
    auth.recovery_verify,
    methods=['POST'],
)
app.add_url_rule(
    '/api/auth/login',
    'login',
    auth.login,
    methods=['POST'],
)
app.add_url_rule('/api/auth/logout', 'logout', auth.logout, methods=['POST'])
app.add_url_rule('/api/admin/me', 'admin_get_me', admin.get_me, methods=['GET'])
app.add_url_rule('/api/auth/verify-admin-setup', 'verify_admin_setup_code', auth.verify_admin_setup_code, methods=['POST'])
app.add_url_rule('/api/auth/admin-send-confirmation', 'admin_send_confirmation', auth.admin_send_confirmation, methods=['POST'])
app.add_url_rule('/api/auth/check-type', 'check_account_type', auth.check_account_type, methods=['POST'])
app.add_url_rule('/api/auth/admin/setup-verify', 'verify_admin_setup_code', auth.verify_admin_setup_code, methods=['POST'])



@app.after_request
def apply_security_headers(response):
    """Apply baseline security headers for local testing environments."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Cache-Control'] = 'no-store'
    return response





@app.after_request
def apply_security_headers(response):
    """Apply baseline security headers for local testing environments."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.route('/api/testing/bootstrap', methods=['POST'])
def bootstrap_testing_data():
    """Create required schema and seed demo data for UI/API testing."""
    admin_key = os.getenv('TEST_BOOTSTRAP_KEY', 'dev-bootstrap-key')
    provided = request.headers.get('X-Test-Bootstrap-Key', '')
    if provided != admin_key:
        return jsonify({'error': 'Unauthorized bootstrap request'}), 401

    initialize_schema()
    seed_demo_data()
    return jsonify({'status': 'ready'})
# ─── Main pages ───────────────────────────────────────────
@app.route('/')
def welcome():
    """Serve the welcome page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'welcome.html')


@app.route('/main/sign_in')
def sign_in():
    """Serve the sign-in page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'sign_in.html')


@app.route('/main/registration')
def registration():
    """Serve the registration page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'registration_form.html')


@app.route('/main/recovery')
def recovery():
    """Serve the account recovery page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'recovery_form.html')


@app.route('/main/about')
def about():
    """Serve the about page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'about.html')


@app.route('/main/help')
def help_page():
    """Serve the help page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'help.html')


# ─── User pages ───────────────────────────────────────────
@app.route('/user/books')
def user_books():
    """Serve the user book display page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'user'), 'userBookdisplay.html')


@app.route('/user/manage')
def user_manage():
    """Serve the user manage page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'user'), 'userManagement.html')


@app.route('/user/card')
def user_card():
    """Serve the user digital card page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'user'), 'userLibraryCard.html')


@app.route('/user/notifications')
def user_notifications():
    """Serve the user notifications page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'user'), 'userNotification.html')


# ─── Admin pages ──────────────────────────────────────────
@app.route('/admin/dashboard')
def admin_dashboard():
    """Serve the admin dashboard page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'admin'), 'adminDashboard.html')


@app.route('/admin/books')
def admin_books():
    """Serve the admin book management page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'admin'), 'adminBookmanagement.html')


@app.route('/admin/users')
def admin_users():
    """Serve the admin user management page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'admin'), 'adminusersManagement.html')


@app.route('/admin/reports')
@app.route('/admin/security')
@app.route('/admin/security.html')
def admin_reports():
    """Serve the admin security reports page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'admin'), 'adminSecurityreports.html')


@app.route('/admin/about')
def admin_about():
    return send_from_directory('public/pages/admin', 'about.html')


@app.route('/admin/manual')
def admin_manual():
    return send_from_directory('public/pages/admin', 'manual.html')


@app.route('/pages/<path:filename>')
def serve_pages(filename):
    """Serve pages from public/pages directory"""
    return send_from_directory(PAGES_DIR, filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from public/assets directory"""
    return send_from_directory(os.path.join(PUBLIC_DIR, 'assets'), filename)

@app.route('/styles/<path:filename>')
def serve_styles(filename):
    """Serve stylesheets from public/styles directory."""
    return send_from_directory(os.path.join(PUBLIC_DIR, 'styles'), filename)


@app.route('/scripts/<path:filename>')
def serve_scripts(filename):
    """Serve frontend scripts from the scripts directory."""
    return send_from_directory(os.path.join(BASE_DIR, 'scripts'), filename)


@app.route('/services/<path:filename>')
def serve_services(filename):
    """Serve frontend service modules from the services directory."""
    return send_from_directory(os.path.join(BASE_DIR, 'services'), filename)


@app.route('/components/<path:filename>')
def serve_components(filename):
    """Serve component HTML files from public/components directory."""
    return send_from_directory(os.path.join(PUBLIC_DIR, 'components'), filename)


# ─── API Endpoints ────────────────────────────────────────
app.add_url_rule('/api/books', 'api_get_books', books.get_books, methods=['GET'])
app.add_url_rule('/api/books', 'api_add_book', books.add_book, methods=['POST'])
app.add_url_rule('/api/books/<int:id>', 'api_update_book', books.update_book, methods=['PATCH'])
app.add_url_rule('/api/books/<int:id>', 'api_delete_book', books.delete_book, methods=['DELETE'])
app.add_url_rule('/api/books/deleted/recent', 'api_recent_deleted_books', books.get_recently_deleted_books, methods=['GET'])
app.add_url_rule('/api/books/<int:id>/restore', 'api_restore_deleted_book', books.restore_deleted_book, methods=['POST'])

app.add_url_rule('/api/categories', 'api_get_categories', books.get_categories, methods=['GET'])
app.add_url_rule('/api/categories', 'api_add_category', books.add_category, methods=['POST'])
app.add_url_rule('/api/categories/<int:id>', 'api_delete_category', books.delete_category, methods=['DELETE'])
app.add_url_rule('/api/categories/deleted/recent', 'api_recent_deleted_categories', books.get_recently_deleted_categories, methods=['GET'])
app.add_url_rule('/api/categories/<int:id>/restore', 'api_restore_deleted_category', books.restore_deleted_category, methods=['POST'])

app.add_url_rule('/api/users', 'api_get_users', users.get_users, methods=['GET'])
app.add_url_rule('/api/users/<int:id>', 'api_update_user', users.update_user, methods=['PATCH'])
app.add_url_rule('/api/users/<student_id>', 'api_delete_user', users.delete_user, methods=['DELETE'])
app.add_url_rule('/api/users/pending', 'api_pending_students', users.get_pending_students, methods=['GET'])
app.add_url_rule('/api/users/<student_id>/approve', 'api_approve_student', users.approve_student, methods=['POST'])
app.add_url_rule('/api/users/<student_id>/reject', 'api_reject_student', users.reject_student, methods=['POST'])
app.add_url_rule('/api/users/<student_id>/suspend', 'api_suspend_student', users.suspend_student, methods=['POST'])
app.add_url_rule('/api/users/<student_id>/reset-borrow', 'api_reset_borrow', users.reset_student_borrow, methods=['POST'])
app.add_url_rule('/api/courses', 'api_get_courses', users.get_courses, methods=['GET'])
app.add_url_rule('/api/courses', 'api_add_course', users.add_course, methods=['POST'])
app.add_url_rule('/api/courses/<int:id>', 'api_delete_course', users.delete_course, methods=['DELETE'])

app.add_url_rule('/api/admin/rules', 'api_admin_get_rules', admin.get_rules, methods=['GET'])
app.add_url_rule('/api/admin/rules', 'api_admin_save_rules', admin.save_rules, methods=['POST'])
app.add_url_rule('/api/admin/logs', 'api_admin_logs', admin.get_logs, methods=['GET'])
app.add_url_rule('/api/admin/logs/clear', 'api_admin_clear_logs', admin.clear_logs, methods=['POST'])
app.add_url_rule('/api/admin/reports', 'api_admin_reports', admin.get_security_reports, methods=['GET'])
app.add_url_rule('/api/admin/request-deletion', 'request_admin_deletion', admin.request_admin_deletion, methods=['POST'])
app.add_url_rule('/api/admin/confirm-deletion', 'confirm_admin_deletion', admin.confirm_admin_deletion, methods=['GET'])
app.add_url_rule('/api/admin/finalize-deletion', 'finalize_admin_deletion', admin.finalize_admin_deletion, methods=['POST'])
app.add_url_rule('/api/admin/notifications', 'get_notifications', admin.get_notifications, methods=['GET'])
app.add_url_rule('/api/admin/notifications/<int:notif_id>/read', 'mark_notification_read', admin.mark_notification_read, methods=['POST'])
app.add_url_rule('/api/admin/notifications/clear', 'clear_notifications', admin.clear_notifications, methods=['POST'])
app.add_url_rule('/admin/notifications', 'admin_get_notifications_v2', admin.get_notifications, methods=['GET'])
app.add_url_rule('/admin/notifications/mark-read/<int:notif_id>/', 'admin_mark_notification_read_v2', admin.mark_notification_read, methods=['POST'])
app.add_url_rule('/admin/notifications/mark-all-read/', 'admin_mark_all_notifications_read_v2', admin.mark_all_notifications_read, methods=['POST'])
app.add_url_rule('/admin/notifications/clear-all/', 'admin_clear_notifications_v2', admin.clear_notifications, methods=['POST'])
app.add_url_rule('/api/admin/health', 'api_admin_health', admin.server_health, methods=['GET'])
app.add_url_rule('/api/admin/server-health', 'api_admin_server_health', admin.server_health, methods=['GET'])

from src.core.scheduler import start_scheduler

app.add_url_rule('/api/transactions/reserve','reserve_book',tx_api.reserve_book,methods=['POST'])
app.add_url_rule('/api/transaction/reserve','reserve_book_singular',tx_api.reserve_book,methods=['POST'])
app.add_url_rule('/api/transactions/borrow','borrow_book',tx_api.borrow_book,methods=['POST'])
app.add_url_rule('/api/transactions/return','return_book',tx_api.return_book,methods=['POST'])
app.add_url_rule('/api/transactions/force-return','force_return',tx_api.force_return,methods=['POST'])
app.add_url_rule('/api/books/history','get_book_history',tx_api.get_book_history,methods=['GET'])
app.add_url_rule('/api/transactions/notify-borrower','notify_borrower',tx_api.notify_borrower,methods=['POST'])
app.add_url_rule('/api/notifications/overdue/run','run_overdue_notifications',tx_api.run_overdue_notifications,methods=['POST'])
app.add_url_rule('/api/books/import/analyze','import_analyze',books.import_analyze,methods=['POST'])
app.add_url_rule('/api/books/import/commit','import_commit',books.import_commit,methods=['POST'])
app.add_url_rule('/api/admin/dashboard-stats','get_dashboard_stats',admin.get_dashboard_stats,methods=['GET'])

app.add_url_rule('/api/transactions/cancel','cancel_reservation',tx_api.cancel_reservation,methods=['POST'])
app.add_url_rule('/api/transactions/manage','get_manage_transactions',tx_api.get_manage_transactions,methods=['GET'])
app.add_url_rule('/api/user/card','get_user_card',users.get_user_card,methods=['GET'])
app.add_url_rule('/api/users/profile','get_user_profile',users.get_user_profile,methods=['GET'])
app.add_url_rule('/api/user/notifications','get_user_notifications',users.get_user_notifications,methods=['GET'])
app.add_url_rule('/api/user/notifications/clear','clear_user_notifications',users.clear_user_notifications,methods=['POST'])

with app.app_context():
    start_scheduler(app)

if __name__ == '__main__':
    print("🚀 Click & Collect - Welcome Page")
    print("📖 Starting development server...")
    print("🔗 Open browser: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
