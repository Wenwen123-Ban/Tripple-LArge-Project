import csv
import io
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from flask import jsonify, request, session

from src.core.db import get_db


def _pick(row, *keys):
    for key in keys:
        val = row.get(key)
        if val is not None and str(val).strip() != '':
            return str(val).strip()
    return ''


def _fetch_sheet_rows(sheet_url):
    if 'spreadsheets/d/' in sheet_url:
        sid = sheet_url.split('/d/')[1].split('/')[0]
        sheet_url = f'https://docs.google.com/spreadsheets/d/{sid}/export?format=csv'

    try:
        with urlopen(sheet_url, timeout=10) as response:
            payload = response.read().decode('utf-8-sig')
    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(f'Unable to fetch sheet URL: {exc}') from exc

    return [dict(r) for r in csv.DictReader(io.StringIO(payload))]


def sync_sheet():
    data = request.get_json(silent=True) or {}
    url = (data.get('sheet_url') or '').strip()
    if not url:
        return jsonify({'error': 'Sheet URL required'}), 400
    try:
        rows = _fetch_sheet_rows(url)
    except Exception as e:
        return jsonify({'error': f'Could not fetch sheet: {e}'}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)
    inserted = updated = skipped = 0
    diff_log = []

    if not rows:
        return jsonify({'error': 'Sheet has no rows.'}), 400

    sample = rows[0]
    if not _pick(sample, 'book_no', 'Book No', 'BookNo', 'book number', 'Book Number') or not _pick(sample, 'title', 'Title', 'book_title', 'Book Title'):
        return jsonify({'error': 'Sheet must include both Book No and Title columns.'}), 400

    for row in rows:
        book_no = _pick(row, 'book_no', 'Book No', 'BookNo', 'book number', 'Book Number')
        title = _pick(row, 'title', 'Title', 'book_title', 'Book Title')

        if not book_no or not title:
            skipped += 1
            diff_log.append({'book_no': book_no or '?', 'result': 'skipped — missing required fields'})
            continue

        cur.execute('SELECT id, availability_hint FROM books WHERE book_no=%s', (book_no,))
        ex = cur.fetchone()

        if not ex:
            cur.execute('INSERT INTO books (book_no,title) VALUES (%s,%s)', (book_no, title))
            inserted += 1
            diff_log.append({'book_no': book_no, 'result': 'inserted'})
        elif ex['availability_hint'] == 'Available':
            cur.execute('UPDATE books SET title=%s WHERE book_no=%s', (title, book_no))
            updated += 1
            diff_log.append({'book_no': book_no, 'result': 'updated'})
        else:
            skipped += 1
            diff_log.append({'book_no': book_no, 'result': f"skipped — status is {ex['availability_hint']}"})

    db.commit()
    cur.execute(
        "INSERT INTO notifications (recipient_id, type, title, message) VALUES (%s,'sheet_sync',%s,%s)",
        (
            session.get('admin_id') or 'admin',
            'Google Sheets Sync Complete',
            f'Inserted: {inserted} | Updated: {updated} | Skipped: {skipped}',
        ),
    )
    db.commit()
    cur.close()

    return jsonify({'status': 'done', 'inserted': inserted, 'updated': updated, 'skipped': skipped, 'log': diff_log})
