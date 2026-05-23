from datetime import datetime, timedelta
from src.core.db import get_db

TIER_NORMAL_MAX_TOKENS = 10.0
TIER_ELEVATED_MAX_TOKENS = 5.0
TIER_HIGH_MAX_TOKENS = 3.0
TIER_NORMAL_REPLENISH_HOURS = 1.0
TIER_ELEVATED_REPLENISH_HOURS = 2.0
TIER_HIGH_REPLENISH_HOURS = 3.0
SIMULTANEOUS_LOGIN_THRESHOLD = 300
DAILY_USER_THRESHOLD = 5000
BLOCK_REDIRECT_HOURS = 10


def get_current_load_tier():
    db = get_db(); c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM system_load_snapshots ORDER BY updated_at DESC LIMIT 1")
    row = c.fetchone(); c.close()
    if not row:
        return 'normal'
    if (row.get('total_daily_users') or 0) >= DAILY_USER_THRESHOLD:
        return 'high'
    if (row.get('simultaneous_login_attempts') or 0) >= SIMULTANEOUS_LOGIN_THRESHOLD:
        return 'elevated'
    return 'normal'


def get_tier_settings(tier):
    if tier == 'high':
        return TIER_HIGH_MAX_TOKENS, TIER_HIGH_REPLENISH_HOURS
    if tier == 'elevated':
        return TIER_ELEVATED_MAX_TOKENS, TIER_ELEVATED_REPLENISH_HOURS
    return TIER_NORMAL_MAX_TOKENS, TIER_NORMAL_REPLENISH_HOURS


def replenish_tokens(bucket):
    elapsed = (datetime.now() - (bucket.get('last_replenish') or datetime.now())).total_seconds() / 3600
    add = int(elapsed / (bucket.get('replenish_hours') or 1.0))
    if add >= 1:
        bucket['tokens'] = min((bucket.get('tokens') or 0) + add, bucket.get('max_tokens') or 10)
        db = get_db(); c = db.cursor()
        c.execute(
            "UPDATE ip_token_buckets SET tokens=%s,last_replenish=NOW(),max_tokens=%s,replenish_hours=%s WHERE ip_address=%s",
            (bucket['tokens'], bucket['max_tokens'], bucket['replenish_hours'], bucket['ip_address'])
        )
        db.commit(); c.close()
    return bucket


def get_or_create_bucket(ip_address):
    tier = get_current_load_tier()
    max_tokens, replenish_hours = get_tier_settings(tier)
    db = get_db(); c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM ip_token_buckets WHERE ip_address=%s", (ip_address,))
    bucket = c.fetchone()
    if not bucket:
        c.close(); c = db.cursor()
        c.execute("INSERT INTO ip_token_buckets (ip_address,tokens,max_tokens,replenish_hours) VALUES (%s,%s,%s,%s)", (ip_address, max_tokens, max_tokens, replenish_hours))
        db.commit(); c.close()
        return {'ip_address': ip_address, 'tokens': max_tokens, 'max_tokens': max_tokens, 'replenish_hours': replenish_hours, 'is_blocked': 0, 'blocked_until': None}
    c.close()
    bucket['max_tokens'] = max_tokens
    bucket['replenish_hours'] = replenish_hours
    return replenish_tokens(bucket)


def consume_token(ip_address):
    now = datetime.now()
    bucket = get_or_create_bucket(ip_address)
    if bucket.get('is_blocked') and bucket.get('blocked_until') and now < bucket['blocked_until']:
        return {'allowed': False, 'tokens_remaining': 0, 'is_blocked': True, 'blocked_until': bucket['blocked_until'], 'replenish_hours': bucket['replenish_hours']}
    if (bucket.get('tokens') or 0) < 1.0:
        blocked_until = now + timedelta(hours=BLOCK_REDIRECT_HOURS)
        db = get_db(); c = db.cursor()
        c.execute("UPDATE ip_token_buckets SET is_blocked=1, blocked_until=%s WHERE ip_address=%s", (blocked_until, ip_address))
        db.commit(); c.close()
        return {'allowed': False, 'tokens_remaining': 0, 'is_blocked': True, 'blocked_until': blocked_until, 'replenish_hours': bucket['replenish_hours']}
    tokens = max(0.0, (bucket.get('tokens') or 0) - 1.0)
    db = get_db(); c = db.cursor()
    c.execute("UPDATE ip_token_buckets SET tokens=%s, is_blocked=0, blocked_until=NULL WHERE ip_address=%s", (tokens, ip_address))
    db.commit(); c.close()
    return {'allowed': True, 'tokens_remaining': int(tokens), 'is_blocked': False, 'blocked_until': None, 'replenish_hours': bucket['replenish_hours']}


def reset_tokens_on_success(ip_address):
    db = get_db(); c = db.cursor()
    c.execute("UPDATE ip_token_buckets SET tokens=max_tokens, is_blocked=0, blocked_until=NULL WHERE ip_address=%s", (ip_address,))
    db.commit(); c.close()


def update_load_snapshot(simultaneous_logins=None, active_users=None):
    db = get_db(); c = db.cursor(dictionary=True)
    c.execute("SELECT CURDATE() AS today")
    today = c.fetchone()['today']
    c.execute("SELECT * FROM system_load_snapshots WHERE snapshot_date=%s", (today,))
    row = c.fetchone()
    if not row:
        c.close(); c = db.cursor(); c.execute("INSERT INTO system_load_snapshots (snapshot_date) VALUES (CURDATE())"); db.commit(); c.close()
        return update_load_snapshot(simultaneous_logins, active_users)
    sim = simultaneous_logins if simultaneous_logins is not None else row.get('simultaneous_login_attempts', 0)
    act = active_users if active_users is not None else row.get('simultaneous_active_users', 0)
    total = max(row.get('total_daily_users', 0), act or 0)
    tier = 'high' if total >= DAILY_USER_THRESHOLD else ('elevated' if sim >= SIMULTANEOUS_LOGIN_THRESHOLD else 'normal')
    c.close(); c = db.cursor()
    c.execute("UPDATE system_load_snapshots SET simultaneous_login_attempts=%s, simultaneous_active_users=%s, total_daily_users=%s, load_tier=%s WHERE snapshot_date=CURDATE()", (sim, act, total, tier))
    db.commit(); c.close()
