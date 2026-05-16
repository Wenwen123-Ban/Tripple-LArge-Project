"""MySQL connection helper for Flask request contexts."""

import os

import mysql.connector
from flask import g


def _load_db_config():
    """Build DB config from environment with sensible local defaults."""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'click_and_collect'),
        'port': int(os.getenv('DB_PORT', '3306')),
    }


def get_db():
    """Return a per-request MySQL connection."""
    if 'db' not in g:
        g.db = mysql.connector.connect(**_load_db_config())
    return g.db


def close_db(e=None):
    """Close the per-request MySQL connection, if one was opened."""
    db = g.pop('db', None)
    if db is not None:
        db.close()
