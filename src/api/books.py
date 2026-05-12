"""Book and category admin API handlers."""

import csv
import io
from datetime import datetime

import mysql.connector
import openpyxl
from flask import jsonify, request

from src.core.db import get_db


def _payload(): return request.get_json(silent=True) or {}


def _pick(row, *keys):
    for key in keys:
        v = row.get(key)
        if v is not None and str(v).strip() != '':
            return str(v).strip()
    return ''

def _ensure_tables(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL UNIQUE,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS books (id INT AUTO_INCREMENT PRIMARY KEY,book_no VARCHAR(60) NOT NULL,title VARCHAR(255) NOT NULL,category_id INT NULL,status VARCHAR(40) DEFAULT 'Available',reserved_count INT DEFAULT 0,borrowed_count INT DEFAULT 0,borrow_count INT DEFAULT 0,reserve_count INT DEFAULT 0,availability_hint VARCHAR(20) DEFAULT 'Available',created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")

    # Backfill columns for legacy databases created before recent schema updates.
    cursor.execute("SHOW COLUMNS FROM books")
    cols = set()
    for row in cursor.fetchall():
        if isinstance(row, dict):
            field_name = row.get('Field') or row.get('field') or next(iter(row.values()), None)
        else:
            field_name = row[0] if row else None
        if field_name:
            cols.add(str(field_name).strip().lower())

    if 'availability_hint' not in cols:
        try:
            cursor.execute("ALTER TABLE books ADD COLUMN availability_hint VARCHAR(20) DEFAULT 'Available'")
        except mysql.connector.ProgrammingError as err:
            if err.errno != 1060:
                raise
        cursor.execute("UPDATE books SET availability_hint = COALESCE(status, 'Available') WHERE availability_hint IS NULL")
    if 'deleted_at' not in cols:
        cursor.execute("ALTER TABLE books ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL")
    if 'delete_expires_at' not in cols:
        cursor.execute("ALTER TABLE books ADD COLUMN delete_expires_at DATETIME NULL DEFAULT NULL")
    cursor.execute("SHOW COLUMNS FROM categories")
    category_cols = set()
    for row in cursor.fetchall():
        if isinstance(row, dict):
            field_name = row.get('Field') or row.get('field') or next(iter(row.values()), None)
        else:
            field_name = row[0] if row else None
        if field_name:
            category_cols.add(str(field_name).strip().lower())
    if 'deleted_at' not in category_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL")
    if 'delete_expires_at' not in category_cols:
        cursor.execute("ALTER TABLE categories ADD COLUMN delete_expires_at DATETIME NULL DEFAULT NULL")

    try:
        cursor.execute("ALTER TABLE books DROP INDEX book_no")
    except mysql.connector.Error:
        pass
    cursor.execute("SHOW INDEX FROM books")
    idx_rows = cursor.fetchall()
    idx_names = set((r.get('Key_name') if isinstance(r, dict) else r[2]) for r in idx_rows if (r.get('Key_name') if isinstance(r, dict) else r[2]) != 'PRIMARY')
    if 'uniq_books_no_category' not in idx_names:
        cursor.execute("ALTER TABLE books ADD UNIQUE INDEX uniq_books_no_category (book_no, category_id)")



def _normalize_category(value):
    return str(value or '').strip()


def _find_or_create_category(cursor, category_name):
    category_name = _normalize_category(category_name)
    if not category_name:
        return None
    cursor.execute('SELECT id FROM categories WHERE LOWER(name)=LOWER(%s) LIMIT 1', (category_name,))
    cat = cursor.fetchone()
    if cat:
        return cat['id'] if isinstance(cat, dict) else cat[0]
    cursor.execute('INSERT INTO categories (name) VALUES (%s)', (category_name,))
    return cursor.lastrowid


def _book_lookup(cursor, book_no, category_id):
    if category_id is None:
        cursor.execute('SELECT id, availability_hint FROM books WHERE book_no=%s AND category_id IS NULL LIMIT 1', (book_no,))
    else:
        cursor.execute('SELECT id, availability_hint FROM books WHERE book_no=%s AND category_id=%s LIMIT 1', (book_no, category_id))
    return cursor.fetchone()

def _get_delete_grace_minutes(cursor):
    try:
        cursor.execute("SELECT book_delete_grace_mins FROM admin_rules WHERE id=1 LIMIT 1")
        row = cursor.fetchone()
        value = (row.get('book_delete_grace_mins') if isinstance(row, dict) else (row[0] if row else None))
        mins = int(value) if value is not None else 20
        return max(1, mins)
    except Exception:
        return 20

def _purge_expired_deleted_books(cursor):
    cursor.execute("DELETE FROM books WHERE deleted_at IS NOT NULL AND delete_expires_at IS NOT NULL AND delete_expires_at <= NOW()")


def _purge_expired_deleted_categories(cursor):
    cursor.execute("DELETE FROM categories WHERE deleted_at IS NOT NULL AND delete_expires_at IS NOT NULL AND delete_expires_at <= NOW()")

def get_categories():
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_categories(c); c.execute('SELECT id, name FROM categories WHERE deleted_at IS NULL ORDER BY name'); r=c.fetchall(); c.close(); return jsonify(r)

def add_category():
    name=str(_payload().get('name') or '').strip()
    if not name: return jsonify({'error':'Category name is required'}),400
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_books(c)
    try: c.execute('INSERT INTO categories (name) VALUES (%s)',(name,)); db.commit(); return jsonify({'id':c.lastrowid,'name':name}),201
    except mysql.connector.IntegrityError: db.rollback(); return jsonify({'error':'Category already exists'}),409
    finally: c.close()

def delete_category(id):
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_categories(c)
    mins = _get_delete_grace_minutes(c)
    c.execute("UPDATE categories SET deleted_at=NOW(), delete_expires_at=DATE_ADD(NOW(), INTERVAL %s MINUTE) WHERE id=%s AND deleted_at IS NULL", (mins, id))
    if c.rowcount == 0:
        c.close()
        return jsonify({'error': 'Category not found or already deleted'}), 404
    db.commit(); c.close(); return jsonify({'status':'pending_delete','undo_minutes':mins})


def get_recently_deleted_categories():
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_categories(c)
    c.execute("""SELECT id,name,TIMESTAMPDIFF(SECOND,NOW(),delete_expires_at) AS seconds_left
                 FROM categories
                 WHERE deleted_at IS NOT NULL AND delete_expires_at > NOW()
                 ORDER BY deleted_at DESC LIMIT 50""")
    rows=c.fetchall(); c.close()
    for r in rows: r['seconds_left']=max(0,int(r.get('seconds_left') or 0))
    return jsonify(rows)


def restore_deleted_category(id):
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_categories(c)
    c.execute("UPDATE categories SET deleted_at=NULL, delete_expires_at=NULL WHERE id=%s AND deleted_at IS NOT NULL AND delete_expires_at > NOW()", (id,))
    if c.rowcount == 0:
        c.close()
        return jsonify({'error':'Restore window expired or category not found'}),404
    db.commit(); c.close(); return jsonify({'status':'restored'})

def get_books():
    status=request.args.get('status','all'); category=request.args.get('category','all'); sort=request.args.get('sort','title_asc'); search=request.args.get('search','').strip(); page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',50)); off=(page-1)*per_page
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c)
    cond=['1=1']; p=[]
    if search: cond.append('(b.book_no LIKE %s OR b.title LIKE %s OR c.name LIKE %s)'); lk=f'%{search}%'; p += [lk,lk,lk]
    if category!='all': cond.append('b.category_id=%s'); p.append(category)
    order={'title_asc':'b.title ASC','title_desc':'b.title DESC','status':'b.availability_hint ASC','most_borrowed':'b.borrow_count DESC','least_borrowed':'b.borrow_count ASC'}.get(sort,'b.title ASC')
    c.execute(f"""SELECT b.*, c.name AS category_name, b.availability_hint AS computed_status FROM books b LEFT JOIN categories c ON b.category_id=c.id WHERE b.deleted_at IS NULL AND {' AND '.join(cond)} ORDER BY {order} LIMIT %s OFFSET %s""", p+[per_page,off])
    rows=c.fetchall()
    for b in rows:
        if b.get('computed_status')=='Borrowed':
            c.execute("SELECT due_at FROM transactions WHERE book_id=%s AND returned_at IS NULL AND action='borrowed' LIMIT 1", (b['id'],))
            tx=c.fetchone()
            if tx and tx.get('due_at') and datetime.now()>tx['due_at']: b['computed_status']='Due'
    if status!='all':
        wanted=str(status or '').strip().lower()
        rows=[b for b in rows if str(b.get('computed_status') or '').strip().lower()==wanted]
    c.close(); return jsonify(rows)

def add_book():
    d=_payload(); book_no=str(d.get('book_no') or '').strip(); title=str(d.get('title') or '').strip(); category_id=d.get('category_id') or None
    if not book_no or not title: return jsonify({'error':'Book number and title are required'}),400
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c)
    try: c.execute("INSERT INTO books (book_no,title,category_id,status,availability_hint) VALUES (%s,%s,%s,%s,%s)",(book_no,title,category_id,d.get('status') or 'Available',d.get('status') or 'Available')); db.commit(); return jsonify({'id':c.lastrowid,'book_no':book_no,'title':title}),201
    except mysql.connector.IntegrityError: db.rollback(); return jsonify({'error':'Duplicate book number in the same category is not allowed'}),409
    finally: c.close()

def delete_book(id):
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_books(c)
    mins = _get_delete_grace_minutes(c)
    c.execute("UPDATE books SET deleted_at=NOW(), delete_expires_at=DATE_ADD(NOW(), INTERVAL %s MINUTE) WHERE id=%s AND deleted_at IS NULL", (mins, id))
    if c.rowcount == 0:
        c.close()
        return jsonify({'error':'Book not found or already deleted'}),404
    db.commit(); c.close(); return jsonify({'status':'pending_delete','undo_minutes':mins})

def get_recently_deleted_books():
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_books(c)
    c.execute("""SELECT b.id,b.book_no,b.title,cg.name AS category_name,TIMESTAMPDIFF(SECOND,NOW(),b.delete_expires_at) AS seconds_left
                 FROM books b LEFT JOIN categories cg ON b.category_id=cg.id
                 WHERE b.deleted_at IS NOT NULL AND b.delete_expires_at > NOW()
                 ORDER BY b.deleted_at DESC LIMIT 50""")
    rows=c.fetchall(); c.close()
    for r in rows: r['seconds_left']=max(0,int(r.get('seconds_left') or 0))
    return jsonify(rows)

def restore_deleted_book(id):
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); _purge_expired_deleted_books(c)
    c.execute("UPDATE books SET deleted_at=NULL, delete_expires_at=NULL WHERE id=%s AND deleted_at IS NOT NULL AND delete_expires_at > NOW()", (id,))
    if c.rowcount == 0:
        c.close()
        return jsonify({'error':'Restore window expired or book not found'}),404
    db.commit(); c.close(); return jsonify({'status':'restored'})

def _parse_import_text(raw_input):
    rows = []
    for line in str(raw_input or '').splitlines():
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split('/') if p.strip()]
        if len(parts) < 3:
            continue
        rows.append({'book no': parts[0], 'title': parts[1], 'category': parts[2]})
    return rows


def _parse_import_file(file):
    fn=file.filename.lower(); rows=[]
    if fn.endswith('.csv'): rows=[dict(r) for r in csv.DictReader(io.StringIO(file.read().decode('utf-8-sig')))]
    elif fn.endswith(('.xlsx','.xls')):
        wb=openpyxl.load_workbook(io.BytesIO(file.read()), read_only=True); ws=wb.active; hdr=[str(c.value).strip().lower() for c in next(ws.rows)]
        for row in ws.iter_rows(min_row=2, values_only=True): rows.append(dict(zip(hdr,row)))
    return rows


def _validate_import_rows(rows):
    if not rows:
        return 'File is empty.'
    sample = rows[0]
    ordered_headers = [str(k).strip().lower() for k in sample.keys()]
    if len(ordered_headers) < 3:
        return 'Missing required columns. Required order: Book No, Title, Category.'
    if ordered_headers[0] not in {'book no', 'book_no', 'bookno', 'book number'}:
        return 'Column #1 must be Book No.'
    if ordered_headers[1] not in {'title', 'book title', 'book_title'}:
        return 'Column #2 must be Title.'
    if ordered_headers[2] not in {'category'}:
        return 'Column #3 must be Category.'
    title = _pick(sample, 'title', 'Title', 'book_title', 'Book Title')
    book_no = _pick(sample, 'book_no', 'book no', 'Book No', 'BookNo', 'book number', 'Book Number')
    if not title and not book_no:
        return 'Missing required columns. Add headers for both Book No and Title.'
    return None

def import_analyze():
    file=request.files.get('file'); mode=request.form.get('mode','insert'); raw_input=request.form.get('raw_input','')
    rows=_parse_import_file(file) if file else _parse_import_text(raw_input)
    if not rows: return jsonify({'error':'No import data provided'}),400
    err = _validate_import_rows(rows)
    if err: return jsonify({'error': err}),400
    db=get_db(); c=db.cursor(dictionary=True)
    preview=[]; new=dup=skip=0
    for row in rows:
        book_no=_pick(row, 'book_no', 'book no', 'Book No', 'BookNo', 'book number', 'Book Number'); title=_pick(row, 'title', 'Title', 'book_title', 'Book Title')
        if not book_no or not title: continue
        category = _pick(row, 'category', 'Category')
        cat_id = _find_or_create_category(c, category) if category else None
        ex = _book_lookup(c, book_no, cat_id)
        if not ex: action='insert'; new+=1
        elif mode=='upsert' and ex['availability_hint']=='Available': action='update'; dup+=1
        elif mode=='upsert': action='skip'; skip+=1
        else: action='skip'; dup+=1
        preview.append({'book_no':book_no,'title':title,'category':str(row.get('category') or '').strip(),'action':action})
    c.close(); return jsonify({'total':len(preview),'new_count':new,'dup_count':dup,'skipped_count':skip,'preview':preview[:20]})

def import_commit():
    file=request.files.get('file'); mode=request.form.get('mode','insert'); raw_input=request.form.get('raw_input','')
    rows=_parse_import_file(file) if file else _parse_import_text(raw_input)
    if not rows: return jsonify({'error':'No import data provided'}),400
    err = _validate_import_rows(rows)
    if err: return jsonify({'error': err}),400
    db=get_db(); c=db.cursor(dictionary=True); ins=upd=sk=0
    for row in rows:
        book_no=_pick(row, 'book_no', 'book no', 'Book No', 'BookNo', 'book number', 'Book Number'); title=_pick(row, 'title', 'Title', 'book_title', 'Book Title'); category=_pick(row, 'category', 'Category')
        if not book_no or not title: sk+=1; continue
        cat_id = _find_or_create_category(c, category) if category else None
        ex = _book_lookup(c, book_no, cat_id)
        if not ex: c.execute('INSERT INTO books (book_no,title,category_id) VALUES (%s,%s,%s)',(book_no,title,cat_id)); ins+=1
        elif mode=='upsert' and ex['availability_hint']=='Available': c.execute('UPDATE books SET title=%s, category_id=%s WHERE book_no=%s',(title,cat_id,book_no)); upd+=1
        else: sk+=1
    db.commit(); c.close(); return jsonify({'status':'done','inserted':ins,'updated':upd,'skipped':sk})
