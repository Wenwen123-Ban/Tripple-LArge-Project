"""Background account auto-management helpers.

Call ``run_account_auto_management`` from a scheduler/cron process to enforce the
rules stored on the Web Security page.
"""

from datetime import datetime

from src.core.db import get_db


def run_account_auto_management():
    """Apply configured account expiry and inactivity deletion rules.

    The function performs soft deletes so audit columns retain who/what deleted an
    account. It returns counters for observability by whichever background task
    invokes it.
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin_rules WHERE id = 1")
    rules = cursor.fetchone() or {}

    result = {'expired': 0, 'inactive': 0, 'checked_at': datetime.now().isoformat(timespec='seconds')}

    if rules.get('expiry_enabled') and rules.get('expiry_years'):
        cursor.execute(
            """
            UPDATE students
            SET deleted_at = NOW(), deleted_by = 'AUTO_EXPIRY'
            WHERE deleted_at IS NULL
              AND created_at <= DATE_SUB(NOW(), INTERVAL %s YEAR)
            """,
            (int(rules['expiry_years']),),
        )
        result['expired'] = cursor.rowcount

    if rules.get('inactive_enabled') and rules.get('inactive_days'):
        cursor.execute(
            """
            UPDATE students
            SET deleted_at = NOW(), deleted_by = 'AUTO_INACTIVE'
            WHERE deleted_at IS NULL
              AND COALESCE(last_active, created_at) <= DATE_SUB(NOW(), INTERVAL %s DAY)
            """,
            (int(rules['inactive_days']),),
        )
        result['inactive'] = cursor.rowcount

    db.commit()
    cursor.close()
    return result
