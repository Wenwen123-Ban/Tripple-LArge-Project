"""Generate one-time admin password and physical recovery-key hashes."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
import secrets
import string

from dotenv import load_dotenv

from src.core.security import hash_password

load_dotenv()


def generate_recovery_key():
    """
    Generates a recovery key in format:
    NMSC-ADM-XXXX-XXXX-XXXX-XXXX
    """
    def segment(n):
        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(n))

    return f"NMSC-ADM-{segment(4)}-{segment(4)}-{segment(4)}-{segment(4)}"


print("=== Admin Account Setup ===\n")

# Password
password = input("Enter admin password: ")
confirm = input("Confirm password: ")
if password != confirm:
    print("Passwords do not match.")
    exit()

password_hash = hash_password(password)

# Recovery key
recovery_key = generate_recovery_key()
recovery_key_hash = hash_password(recovery_key)

print(f"""
==========================================
PASSWORD HASH (paste into SQL):
{password_hash}

==========================================
RECOVERY KEY (write this down physically):
{recovery_key}

RECOVERY KEY HASH (paste into SQL):
{recovery_key_hash}

==========================================
IMPORTANT:
- The recovery key is shown ONCE only
- Store it physically — not digitally
- Without it admin account cannot be recovered
- Keep it in a sealed envelope if possible
==========================================
""")
