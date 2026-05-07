"""Development email settings for Click & Collect confirmation testing."""

import os

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').lower() in {'1', 'true', 'yes'}
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'your-system-email@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'your-app-password')
DEFAULT_FROM_EMAIL = os.getenv(
    'DEFAULT_FROM_EMAIL',
    f'Click & Collect <{EMAIL_HOST_USER}>',
)
SITE_URL = os.getenv('SITE_URL', 'http://127.0.0.1:8000')
