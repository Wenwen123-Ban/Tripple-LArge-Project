"""Password and recovery-key hashing helpers."""

import bcrypt


def hash_password(secret):
    """Return a bcrypt hash for a password or recovery secret."""
    return bcrypt.hashpw(secret.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(secret, secret_hash):
    """Verify a plaintext password or recovery secret against a bcrypt hash."""
    if not secret or not secret_hash:
        return False
    return bcrypt.checkpw(secret.encode('utf-8'), secret_hash.encode('utf-8'))
