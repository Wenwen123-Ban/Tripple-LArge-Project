"""MySQL connection helper for Flask request contexts."""

import mysql.connector
from flask import g

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'click_and_collect',
}


def get_db():
    """Return a per-request MySQL connection."""
    if 'db' not in g:
        g.db = mysql.connector.connect(**DB_CONFIG)
    return g.db


def close_db(e=None):
    """Close the per-request MySQL connection, if one was opened."""
    db = g.pop('db', None)
    if db is not None:
        db.close()
