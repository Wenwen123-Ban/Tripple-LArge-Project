from flask import Flask, send_from_directory
import os

app = Flask(__name__, 
            static_folder='public/assets',
            static_url_path='/assets')

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
PAGES_DIR = os.path.join(PUBLIC_DIR, 'pages')

@app.route('/')
def welcome():
    """Serve the welcome page"""
    return send_from_directory(os.path.join(PAGES_DIR, 'main'), 'welcome.html')

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    """Serve pages from public/pages directory"""
    return send_from_directory(PAGES_DIR, filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from public/assets directory"""
    return send_from_directory(os.path.join(PUBLIC_DIR, 'assets'), filename)

if __name__ == '__main__':
    print("🚀 Click & Collect - Welcome Page")
    print("📖 Starting development server...")
    print("🔗 Open browser: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
