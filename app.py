from flask import Flask, jsonify, render_template, request, send_from_directory
import os

from src.api import auth
from src.api.auth import (
    build_confirm_success_html,
    build_confirm_url,
    create_confirmation_token,
    is_token_confirmed,
    mark_token_confirmed,
    send_confirmation_email,
)
from src.core.db import close_db


app = Flask(
    __name__,
    template_folder='public/pages',
    static_folder='public'
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
    """Mark a token confirmed after the student clicks the email button."""
    token = request.args.get('token', '')
    if mark_token_confirmed(token):
        return build_confirm_success_html()
    return '<p>Invalid or expired confirmation link.</p>', 400


@app.route('/api/auth/check-token')
def check_auth_token():
    """Report whether a pending confirmation token has been confirmed."""
    token = request.args.get('token', '')
    return jsonify({'confirmed': is_token_confirmed(token)})



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
    'login_student',
    auth.login_student,
    methods=['POST'],
)

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
@app.route('/api/books', methods=['GET'])
def get_books():
    """Fetch all books from the database."""
    return jsonify({'books': [], 'message': 'Books API endpoint'}), 200


@app.route('/api/users', methods=['GET'])
def get_users():
    """Fetch all users from the database."""
    return jsonify({'users': [], 'message': 'Users API endpoint'}), 200


if __name__ == '__main__':
    print("🚀 Click & Collect - Welcome Page")
    print("📖 Starting development server...")
    print("🔗 Open browser: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
