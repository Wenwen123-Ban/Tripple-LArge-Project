"""Book and category admin API handlers."""

import csv
import io
from datetime import datetime

import mysql.connector
import openpyxl
from flask import jsonify, request

from src.core.db import get_db


def _payload(): return request.get_json(silent=True) or {}

def _ensure_tables(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL UNIQUE,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS books (id INT AUTO_INCREMENT PRIMARY KEY,book_no VARCHAR(60) NOT NULL UNIQUE,title VARCHAR(255) NOT NULL,category_id INT NULL,status VARCHAR(40) DEFAULT 'Available',reserved_count INT DEFAULT 0,borrowed_count INT DEFAULT 0,borrow_count INT DEFAULT 0,reserve_count INT DEFAULT 0,availability_hint VARCHAR(20) DEFAULT 'Available',created_at DATETIME DEFAULT CURRENT_TIMESTAMP)""")

    # Backfill columns for legacy databases created before recent schema updates.
    cursor.execute("SHOW COLUMNS FROM books")
    cols = {r[0] for r in cursor.fetchall()}
    if 'availability_hint' not in cols:
        cursor.execute("ALTER TABLE books ADD COLUMN availability_hint VARCHAR(20) DEFAULT 'Available'")
        cursor.execute("UPDATE books SET availability_hint = COALESCE(status, 'Available')")

def get_categories():
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c); c.execute('SELECT id, name FROM categories ORDER BY name'); r=c.fetchall(); c.close(); return jsonify(r)

def add_category():
    name=str(_payload().get('name') or '').strip()
    if not name: return jsonify({'error':'Category name is required'}),400
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c)
    try: c.execute('INSERT INTO categories (name) VALUES (%s)',(name,)); db.commit(); return jsonify({'id':c.lastrowid,'name':name}),201
    except mysql.connector.IntegrityError: db.rollback(); return jsonify({'error':'Category already exists'}),409
    finally: c.close()

def delete_category(id):
    db=get_db(); c=db.cursor(); _ensure_tables(c); c.execute('UPDATE books SET category_id=NULL WHERE category_id=%s',(id,)); c.execute('DELETE FROM categories WHERE id=%s',(id,)); db.commit(); c.close(); return jsonify({'status':'deleted'})

def get_books():
    status=request.args.get('status','all'); category=request.args.get('category','all'); sort=request.args.get('sort','title_asc'); search=request.args.get('search','').strip(); page=int(request.args.get('page',1)); per_page=int(request.args.get('per_page',50)); off=(page-1)*per_page
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c)
    cond=['1=1']; p=[]
    if search: cond.append('(b.book_no LIKE %s OR b.title LIKE %s OR c.name LIKE %s)'); lk=f'%{search}%'; p += [lk,lk,lk]
    if category!='all': cond.append('b.category_id=%s'); p.append(category)
    order={'title_asc':'b.title ASC','title_desc':'b.title DESC','status':'b.availability_hint ASC','most_borrowed':'b.borrow_count DESC','least_borrowed':'b.borrow_count ASC'}.get(sort,'b.title ASC')
    c.execute(f"""SELECT b.*, c.name AS category_name, b.availability_hint AS computed_status FROM books b LEFT JOIN categories c ON b.category_id=c.id WHERE {' AND '.join(cond)} ORDER BY {order} LIMIT %s OFFSET %s""", p+[per_page,off])
    rows=c.fetchall()
    for b in rows:
        if b.get('computed_status')=='Borrowed':
            c.execute("SELECT due_at FROM transactions WHERE book_id=%s AND returned_at IS NULL AND action='borrowed' LIMIT 1", (b['id'],))
            tx=c.fetchone()
            if tx and tx.get('due_at') and datetime.now()>tx['due_at']: b['computed_status']='Due'
    if status!='all': rows=[b for b in rows if b.get('computed_status')==status]
    c.close(); return jsonify(rows)

def add_book():
    d=_payload(); book_no=str(d.get('book_no') or '').strip(); title=str(d.get('title') or '').strip(); category_id=d.get('category_id') or None
    if not book_no or not title: return jsonify({'error':'Book number and title are required'}),400
    db=get_db(); c=db.cursor(dictionary=True); _ensure_tables(c)
    try: c.execute("INSERT INTO books (book_no,title,category_id,status,availability_hint) VALUES (%s,%s,%s,%s,%s)",(book_no,title,category_id,d.get('status') or 'Available',d.get('status') or 'Available')); db.commit(); return jsonify({'id':c.lastrowid,'book_no':book_no,'title':title}),201
    except mysql.connector.IntegrityError: db.rollback(); return jsonify({'error':'Book number already exists'}),409
    finally: c.close()

def delete_book(id):
    db=get_db(); c=db.cursor(); _ensure_tables(c); c.execute('DELETE FROM books WHERE id=%s',(id,)); db.commit(); c.close(); return jsonify({'status':'deleted'})

def _parse_import_file(file):
    fn=file.filename.lower(); rows=[]
    if fn.endswith('.csv'): rows=[dict(r) for r in csv.DictReader(io.StringIO(file.read().decode('utf-8-sig')))]
    elif fn.endswith(('.xlsx','.xls')):
        wb=openpyxl.load_workbook(io.BytesIO(file.read()), read_only=True); ws=wb.active; hdr=[str(c.value).strip().lower() for c in next(ws.rows)]
        for row in ws.iter_rows(min_row=2, values_only=True): rows.append(dict(zip(hdr,row)))
    return rows

def import_analyze():
    file=request.files.get('file'); mode=request.form.get('mode','insert')
    if not file: return jsonify({'error':'No file uploaded'}),400
    rows=_parse_import_file(file); db=get_db(); c=db.cursor(dictionary=True)
    preview=[]; new=dup=skip=0
    for row in rows:
        book_no=str(row.get('book_no') or row.get('Book No') or row.get('BookNo') or '').strip(); title=str(row.get('title') or row.get('Title') or '').strip()
        if not book_no or not title: continue
        c.execute('SELECT id, availability_hint FROM books WHERE book_no=%s',(book_no,)); ex=c.fetchone()
        if not ex: action='insert'; new+=1
        elif mode=='upsert' and ex['availability_hint']=='Available': action='update'; dup+=1
        elif mode=='upsert': action='skip'; skip+=1
        else: action='skip'; dup+=1
        preview.append({'book_no':book_no,'title':title,'category':str(row.get('category') or '').strip(),'action':action})
    c.close(); return jsonify({'total':len(preview),'new_count':new,'dup_count':dup,'skipped_count':skip,'preview':preview[:20]})

def import_commit():
    file=request.files.get('file'); mode=request.form.get('mode','insert')
    if not file: return jsonify({'error':'No file uploaded'}),400
    rows=_parse_import_file(file); db=get_db(); c=db.cursor(dictionary=True); ins=upd=sk=0
    for row in rows:
        book_no=str(row.get('book_no','') or '').strip(); title=str(row.get('title','') or '').strip(); category=str(row.get('category','') or '').strip()
        if not book_no or not title: sk+=1; continue
        cat_id=None
        if category:
            c.execute('SELECT id FROM categories WHERE name=%s',(category,)); cat=c.fetchone()
            if cat: cat_id=cat['id']
            else: c.execute('INSERT INTO categories (name) VALUES (%s)',(category,)); cat_id=c.lastrowid
        c.execute('SELECT id, availability_hint FROM books WHERE book_no=%s',(book_no,)); ex=c.fetchone()
        if not ex: c.execute('INSERT INTO books (book_no,title,category_id) VALUES (%s,%s,%s)',(book_no,title,cat_id)); ins+=1
        elif mode=='upsert' and ex['availability_hint']=='Available': c.execute('UPDATE books SET title=%s, category_id=%s WHERE book_no=%s',(title,cat_id,book_no)); upd+=1
        else: sk+=1
    db.commit(); c.close(); return jsonify({'status':'done','inserted':ins,'updated':upd,'skipped':sk})
