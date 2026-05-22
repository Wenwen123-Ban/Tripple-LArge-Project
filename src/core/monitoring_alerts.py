import logging
import os
from src.core.db import get_db
from src.core.metrics import notifications_sent

logger = logging.getLogger('lbas.security')


def send_system_alert(alert_type, message, severity='warning'):
    line = f"[SYSTEM ALERT] {alert_type}: {message}"
    if severity == 'critical':
        logger.critical(line)
    else:
        logger.warning(line)
    try:
        db = get_db()
        c = db.cursor(dictionary=True)
        c.execute("SELECT admin_id FROM admins WHERE is_verified=1")
        admins = c.fetchall()
        for admin in admins:
            c.execute(
                "INSERT INTO notifications (recipient_id, type, title, message, data) VALUES (%s, %s, %s, %s, %s)",
                (admin['admin_id'], 'system_alert', f'[{severity.upper()}] {alert_type}', message, '{}'),
            )
            notifications_sent.labels(channel='in_site').inc()
        db.commit()
        c.close()
    except Exception as exc:
        logger.error("failed in-site alert: %s", exc)
    alert_email = os.getenv('ADMIN_ALERT_EMAIL')
    if alert_email:
        notifications_sent.labels(channel='email').inc()
