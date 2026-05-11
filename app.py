from flask import Flask, jsonify, render_template, request, send_from_directory, session
import os
from dotenv import load_dotenv

# Load environment variables from external .env file for security
load_dotenv('C:\\CC-Config\\.env')

from src.api import admin, auth, books, users
from src.api import transactions as tx_api
from src.api.auth import (
    build_confirm_url,
    create_confirmation_token,
    confirm_email_token,
    send_confirmation_email,
    _token_confirmation_status,
)
from src.core.db import close_db
from src.core.models import initialize_schema
from src.core.seed_demo import seed_demo_data


app = Flask(
    __name__,
    template_folder='public/pages',
    static_folder='public'
)
app.secret_key = os.getenv('FLASK_SECRET') or 'dev-fallback-change-this'
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

app.teardown_appcontext(close_db)

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
PAGES_DIR = os.path.join(PUBLIC_DIR, 'pages')


@app.route('/api/auth/send-confirmation', methods=['POST'])
def send_auth_confirmation():
    """Send a Gmail confirmation email for registration testing."""
    data = request.get_json(silent=True) or {}
    gmail = (data.get('gmail') or '').strip()
    name = (data.get('name') or 'Student').strip() or 'Student'

    if not gmail.lower().endswith('@gmail.com'):
        return jsonify({'error': 'Valid Gmail address required'}), 400

    token = create_confirmation_token(gmail)
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


@app.route('/user/account')
def user_account():
    """Serve the user account management page."""
    return send_from_directory(os.path.join(PAGES_DIR, 'user'), 'userManagement.html')


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
app.add_url_rule('/api/books/<int:id>', 'api_delete_book', books.delete_book, methods=['DELETE'])
app.add_url_rule('/api/books/deleted/recent', 'api_recent_deleted_books', books.get_recently_deleted_books, methods=['GET'])
app.add_url_rule('/api/books/<int:id>/restore', 'api_restore_deleted_book', books.restore_deleted_book, methods=['POST'])

app.add_url_rule('/api/categories', 'api_get_categories', books.get_categories, methods=['GET'])
app.add_url_rule('/api/categories', 'api_add_category', books.add_category, methods=['POST'])
app.add_url_rule('/api/categories/<int:id>', 'api_delete_category', books.delete_category, methods=['DELETE'])

app.add_url_rule('/api/users', 'api_get_users', users.get_users, methods=['GET'])
app.add_url_rule('/api/users/<int:id>', 'api_update_user', users.update_user, methods=['PATCH'])
app.add_url_rule('/api/users/<student_id>', 'api_delete_user', users.delete_user, methods=['DELETE'])
app.add_url_rule('/api/courses', 'api_get_courses', users.get_courses, methods=['GET'])
app.add_url_rule('/api/courses', 'api_add_course', users.add_course, methods=['POST'])
app.add_url_rule('/api/courses/<int:id>', 'api_delete_course', users.delete_course, methods=['DELETE'])

app.add_url_rule('/api/admin/rules', 'api_admin_get_rules', admin.get_rules, methods=['GET'])
app.add_url_rule('/api/admin/rules', 'api_admin_save_rules', admin.save_rules, methods=['POST'])
app.add_url_rule('/api/admin/logs', 'api_admin_logs', admin.get_logs, methods=['GET'])
app.add_url_rule('/api/admin/logs/clear', 'api_admin_clear_logs', admin.clear_logs, methods=['POST'])
app.add_url_rule('/api/admin/request-deletion', 'request_admin_deletion', admin.request_admin_deletion, methods=['POST'])
app.add_url_rule('/api/admin/confirm-deletion', 'confirm_admin_deletion', admin.confirm_admin_deletion, methods=['GET'])
app.add_url_rule('/api/admin/finalize-deletion', 'finalize_admin_deletion', admin.finalize_admin_deletion, methods=['POST'])
app.add_url_rule('/api/admin/notifications', 'get_notifications', admin.get_notifications, methods=['GET'])
app.add_url_rule('/api/admin/notifications/<int:notif_id>/read', 'mark_notification_read', admin.mark_notification_read, methods=['POST'])
app.add_url_rule('/api/admin/notifications/clear', 'clear_notifications', admin.clear_notifications, methods=['POST'])
app.add_url_rule('/api/admin/health', 'api_admin_health', admin.server_health, methods=['GET'])
app.add_url_rule('/api/admin/server-health', 'api_admin_server_health', admin.server_health, methods=['GET'])

from src.core.scheduler import start_scheduler

app.add_url_rule('/api/transactions/reserve','reserve_book',tx_api.reserve_book,methods=['POST'])
app.add_url_rule('/api/transactions/borrow','borrow_book',tx_api.borrow_book,methods=['POST'])
app.add_url_rule('/api/transactions/return','return_book',tx_api.return_book,methods=['POST'])
app.add_url_rule('/api/transactions/force-return','force_return',tx_api.force_return,methods=['POST'])
app.add_url_rule('/api/books/history','get_book_history',tx_api.get_book_history,methods=['GET'])
app.add_url_rule('/api/transactions/notify-borrower','notify_borrower',tx_api.notify_borrower,methods=['POST'])
app.add_url_rule('/api/books/import/analyze','import_analyze',books.import_analyze,methods=['POST'])
app.add_url_rule('/api/books/import/commit','import_commit',books.import_commit,methods=['POST'])
app.add_url_rule('/api/admin/dashboard-stats','get_dashboard_stats',admin.get_dashboard_stats,methods=['GET'])

with app.app_context():
    start_scheduler(app)

if __name__ == '__main__':
    print("🚀 Click & Collect - Welcome Page")
    print("📖 Starting development server...")
    print("🔗 Open browser: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
