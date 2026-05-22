"""Prometheus metrics for LBAS monitoring."""

from prometheus_client import Counter, Gauge, Histogram

failed_login_attempts = Counter('lbas_failed_login_attempts_total', 'Total failed login attempts', ['role'])
successful_logins = Counter('lbas_successful_logins_total', 'Total successful logins', ['role'])
session_conflicts = Counter('lbas_session_conflicts_total', 'Total session role mismatch redirects detected')
reservations_created = Counter('lbas_reservations_created_total', 'Total reservations created by students')
reservations_cancelled = Counter('lbas_reservations_cancelled_total', 'Total reservations cancelled', ['cancelled_by'])
reservations_rejected = Counter('lbas_reservations_rejected_total', 'Total reservations rejected by admin')
books_borrowed = Counter('lbas_books_borrowed_total', 'Total borrow transactions completed')
books_returned = Counter('lbas_books_returned_total', 'Total books returned')
overdue_books_gauge = Gauge('lbas_overdue_books_current', 'Current number of overdue books')
available_books_gauge = Gauge('lbas_available_books_current', 'Current number of available books')
notifications_sent = Counter('lbas_notifications_sent_total', 'Total in-site and email notifications sent', ['channel'])
unread_notifications_gauge = Gauge('lbas_unread_notifications_current', 'Current unread notifications')
rate_limit_hits = Counter('lbas_rate_limit_hits_total', 'Total number of rate limit rejections', ['endpoint'])
admin_ip_blocks = Counter('lbas_admin_ip_blocks_total', 'Total number of admin IP blocks')
view_response_time = Histogram(
    'lbas_view_response_seconds',
    'Response time for key LBAS views',
    ['view_name'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)
