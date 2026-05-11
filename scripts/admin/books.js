let bookFilters = { status: 'all', category: 'all', sort: 'title_asc', search: '', page: 1 };
let importData = null;

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = res.ok ? await res.json() : [];
  const sel = document.getElementById('book-category');
  if (sel) sel.innerHTML = '<option value="">Category</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  const filter = document.getElementById('category-filter');
  if (filter) filter.innerHTML = '<option value="all">All Categories</option>' + data.map((c)=>`<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadBooks() {
  const params = new URLSearchParams({ ...bookFilters, per_page: 50 });
  const res = await fetch(`/api/books?${params}`);
  const books = res.ok ? await res.json() : [];
  renderBookTable(Array.isArray(books) ? books : []);
}
function renderBookTable(books) { const tbody = document.getElementById('books-tbody'); if(!tbody) return; tbody.innerHTML = books.map((b)=>`<tr><td>${b.book_no}</td><td>${b.title}</td><td>${b.category_name || '—'}</td><td><span class="status-badge status-${(b.computed_status||'available').toLowerCase()}">${b.computed_status || 'Available'}</span>${b.computed_status==='Due'?'<span class="due-tooltip" title="Past due date">⚠</span>':''}</td><td>${b.borrow_count||0}</td><td><button class="btn-row-action" onclick="viewHistory(${b.id})">History</button>${b.computed_status!=='Available'?`<button class="btn-row-action btn-force" onclick="forceReturn(${b.id})">Force Return</button>`:''}<button class="btn-row-action" onclick="notifyBorrower(${b.id})">Notify</button></td></tr>`).join('') || '<tr><td colspan="6">No books found.</td></tr>'; }

async function addBook(){ const title=document.getElementById('book-title').value.trim(); const category_id=document.getElementById('book-category').value; const book_no=document.getElementById('book-no').value.trim(); if(!title||!book_no) return; await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,category_id,book_no})}); loadBooks(); }
async function viewHistory(bookId){ const res=await fetch(`/api/books/history?book_id=${bookId}`); const rows=await res.json(); alert(rows.map(r=>`${r.action}: ${r.student_name||r.student_id||''}`).join('\n')||'No transaction history.'); }
async function forceReturn(bookId){ const notes=prompt('Reason for force return (optional):')||''; const res=await fetch('/api/transactions/force-return',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book_id:bookId,notes})}); const data=await res.json(); showNotification?.(data.status==='force_returned'?'Book force-returned successfully.':(data.error||'Force return failed.'), data.status==='force_returned'?'success':'error'); loadBooks(); }
async function notifyBorrower(bookId){ const res=await fetch('/api/transactions/notify-borrower',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book_id:bookId})}); const data=await res.json(); showNotification?.(data.status==='sent'?'Borrower notified by email.':(data.error||'Notification failed.'), data.status==='sent'?'success':'error'); }

function showImportPreview(data){ document.getElementById('import-step-1').style.display='none'; document.getElementById('import-step-2').style.display='block'; document.getElementById('import-preview-stats').innerHTML=`<strong>Found:</strong> ${data.total} | <strong>New:</strong> ${data.new_count} | <strong>Duplicate:</strong> ${data.dup_count} | <strong>Skipped (active):</strong> ${data.skipped_count}`; document.getElementById('import-preview-table').innerHTML = `<table class="data-table"><tbody>${(data.preview||[]).map(r=>`<tr><td>${r.book_no}</td><td>${r.title}</td><td>${r.category||'—'}</td><td>${r.action}</td></tr>`).join('')}</tbody></table>`; }
function resetImport(){importData=null; document.getElementById('import-step-1').style.display='block'; document.getElementById('import-step-2').style.display='none';}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('save-book-btn')?.addEventListener('click', addBook);
  document.getElementById('add-book-btn')?.addEventListener('click', addBook);
  ['status-filter','category-filter','sort-select'].forEach((id)=>document.getElementById(id)?.addEventListener('change',(e)=>{const map={'status-filter':'status','category-filter':'category','sort-select':'sort'}; bookFilters[map[id]]=e.target.value; loadBooks();}));
  document.getElementById('book-search')?.addEventListener('input',(e)=>{bookFilters.search=e.target.value; loadBooks();});
  document.getElementById('open-import-btn')?.addEventListener('click',()=>document.getElementById('import-modal').style.display='flex');
  document.getElementById('import-close')?.addEventListener('click',()=>{document.getElementById('import-modal').style.display='none'; resetImport();});
  document.getElementById('import-analyze-btn')?.addEventListener('click', async()=>{ const file=document.getElementById('import-file').files[0]; if(!file){ alert('Please choose a CSV/XLSX file first.'); return; } const mode=document.getElementById('import-mode').value; const fd=new FormData(); fd.append('file', file); fd.append('mode', mode); const res=await fetch('/api/books/import/analyze',{method:'POST',body:fd}); const data=await res.json(); if(!res.ok){ alert(data.error||'Import analyze failed.'); return; } importData=data; showImportPreview(data);});
  document.getElementById('import-commit-btn')?.addEventListener('click', async()=>{const file=document.getElementById('import-file').files[0]; if(!file){ alert('Please choose a CSV/XLSX file first.'); return; } const mode=document.getElementById('import-mode').value; if(mode==='dryrun') return; const fd=new FormData(); fd.append('file',file); fd.append('mode',mode); const res=await fetch('/api/books/import/commit',{method:'POST',body:fd}); const data=await res.json(); document.getElementById('import-result').innerHTML=res.ok?`Inserted: ${data.inserted} | Updated: ${data.updated} | Skipped: ${data.skipped}`:(data.error||'Import failed.'); if(res.ok) loadBooks();});
  await loadCategories(); await loadBooks();
});
