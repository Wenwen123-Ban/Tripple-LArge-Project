import threading
import time


def start_scheduler(app):
    def run():
        while True:
            try:
                with app.app_context():
                    check_due_books()
            except Exception as e:
                print(f'[Scheduler] Error: {e}')
            time.sleep(3600)

    threading.Thread(target=run, daemon=True).start()


def check_due_books():
    from src.api.transactions import send_due_overdue_alerts
    from src.core.db import get_db

    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute("""SELECT t.*, b.title, b.book_no, s.full_name FROM transactions t JOIN books b ON t.book_id=b.id JOIN students s ON t.student_id=s.student_id WHERE t.action='borrowed' AND t.returned_at IS NULL AND t.due_at IS NOT NULL AND t.due_at < NOW()""")
    overdue = cur.fetchall()
    for row in overdue:
        cur.execute('SELECT admin_id FROM admins WHERE is_verified=1')
        for a in cur.fetchall():
            cur.execute("""INSERT INTO notifications (recipient_id,type,title,message) VALUES (%s,'due_alert',%s,%s)""", (a['admin_id'], f"Overdue: {row['title']}", f"{row['full_name']} — due {row['due_at']}"))
    db.commit(); cur.close()
    send_due_overdue_alerts()
