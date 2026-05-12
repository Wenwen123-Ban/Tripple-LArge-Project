let bookFilters = { status: 'all', category: 'all', sort: 'title_asc', search: '', page: 1 };
let importData = null;

async function loadCategories() {
  const res = await fetch('/api/categories');
  const data = res.ok ? await res.json() : [];
  const sel = document.getElementById('book-category');
  if (sel) sel.innerHTML = '<option value="">Category</option>' + data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  const filter = document.getElementById('category-filter');
  if (filter) filter.innerHTML = '<option value="all">All Categories</option>' + data.map((c)=>`<option value="${c.id}">${c.name}</option>`).join('');
  renderCategoryList(data);
}
function renderCategoryList(categories) {
  const holder = document.getElementById('category-list');
  if (!holder) return;
  holder.innerHTML = (categories || []).map((c) => `<span class="category-pill"><button class="category-pill-x" title="Delete category" onclick="deleteCategory(${c.id})">✕</button><span>${c.name}</span><button class="category-pill-x" title="Delete category" onclick="deleteCategory(${c.id})">✕</button></span>`).join('') || '<span style="font-size:12px;color:#666;">No categories yet.</span>';
}

async function loadBooks() {
  const params = new URLSearchParams({ ...bookFilters, per_page: 50 });
  const res = await fetch(`/api/books?${params}`);
  const books = res.ok ? await res.json() : [];
  renderBookTable(Array.isArray(books) ? books : []);
}
function renderBookTable(books) { const tbody = document.getElementById('books-tbody'); if(!tbody) return; tbody.innerHTML = books.map((b)=>`<tr><td>${b.book_no}</td><td>${b.title}</td><td>${b.category_name || '—'}</td><td><span class="status-badge status-${(b.computed_status||'available').toLowerCase()}">${b.computed_status || 'Available'}</span>${b.computed_status==='Due'?'<span class="due-tooltip" title="Past due date">⚠</span>':''}</td><td>${b.borrow_count||0}</td><td><button class="btn-row-action" onclick="viewHistory(${b.id})">History</button>${b.computed_status!=='Available'?`<button class="btn-row-action btn-force" onclick="forceReturn(${b.id})">Force Return</button>`:''}<button class="btn-row-action" onclick="notifyBorrower(${b.id})">Notify</button><button class="btn-row-action btn-force" onclick="deleteBook(${b.id})">Delete</button></td></tr>`).join('') || '<tr><td colspan="6">No books found.</td></tr>'; }

async function addBook(){ const title=document.getElementById('book-title').value.trim(); const category_id=document.getElementById('book-category').value; const book_no=document.getElementById('book-no').value.trim(); if(!title||!book_no){ alert('Book title and book number are required.'); return; } const res=await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,category_id,book_no})}); const data=await res.json().catch(()=>({})); if(!res.ok){ alert(data.error||'Failed to add book.'); return; } document.getElementById('book-title').value=''; document.getElementById('book-no').value=''; document.getElementById('book-category').value=''; await loadBooks(); }
async function addCategory(){ const name=document.getElementById('new-category')?.value.trim(); if(!name){ alert('Category name is required.'); return; } const res=await fetch('/api/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})}); const data=await res.json().catch(()=>({})); if(!res.ok){ alert(data.error||'Failed to add category.'); return; } document.getElementById('new-category').value=''; await loadCategories(); }
async function viewHistory(bookId){ const res=await fetch(`/api/books/history?book_id=${bookId}`); const rows=await res.json(); alert(rows.map(r=>`${r.action}: ${r.student_name||r.student_id||''}`).join('\n')||'No transaction history.'); }
async function forceReturn(bookId){ const notes=prompt('Reason for force return (optional):')||''; const res=await fetch('/api/transactions/force-return',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book_id:bookId,notes})}); const data=await res.json(); showNotification?.(data.status==='force_returned'?'Book force-returned successfully.':(data.error||'Force return failed.'), data.status==='force_returned'?'success':'error'); loadBooks(); }
async function notifyBorrower(bookId){ const res=await fetch('/api/transactions/notify-borrower',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book_id:bookId})}); const data=await res.json(); showNotification?.(data.status==='sent'?'Borrower notified by email.':(data.error||'Notification failed.'), data.status==='sent'?'success':'error'); }
async function deleteBook(bookId){ if(!confirm('Delete this book? You can revert before the grace period ends.')) return; const res=await fetch(`/api/books/${bookId}`,{method:'DELETE'}); const data=await res.json(); if(!res.ok){ alert(data.error||'Delete failed.'); return; } await loadBooks(); await loadDeletedCache(); }
async function restoreDeletedBook(bookId){ const res=await fetch(`/api/books/${bookId}/restore`,{method:'POST'}); const data=await res.json(); if(!res.ok){ alert(data.error||'Restore failed.'); return; } await loadBooks(); await loadDeletedCache(); }
async function loadDeletedCache(){ const holder=document.getElementById('deleted-cache-list'); if(!holder) return; const res=await fetch('/api/books/deleted/recent'); const rows=res.ok?await res.json():[]; if(!rows.length){ holder.innerHTML=''; return; } holder.innerHTML=`<strong>Recently deleted (revert before expiry):</strong> ${rows.map(r=>`<span style="margin-left:8px;">${r.book_no} — ${r.title} (${Math.ceil((r.seconds_left||0)/60)}m left) <button class="btn-row-action" onclick="restoreDeletedBook(${r.id})">Revert delete</button></span>`).join('')}`; }
async function deleteCategory(categoryId){ if(!confirm('Delete this category? You can revert before the grace period ends.')) return; const res=await fetch(`/api/categories/${categoryId}`,{method:'DELETE'}); const data=await res.json(); if(!res.ok){ alert(data.error||'Delete failed.'); return; } await loadCategories(); await loadDeletedCategoryCache(); await loadBooks(); }
async function restoreDeletedCategory(categoryId){ const res=await fetch(`/api/categories/${categoryId}/restore`,{method:'POST'}); const data=await res.json(); if(!res.ok){ alert(data.error||'Restore failed.'); return; } await loadCategories(); await loadDeletedCategoryCache(); }
async function loadDeletedCategoryCache(){ const holder=document.getElementById('deleted-category-cache-list'); if(!holder) return; const res=await fetch('/api/categories/deleted/recent'); const rows=res.ok?await res.json():[]; if(!rows.length){ holder.innerHTML=''; return; } holder.innerHTML=`<strong>Recently deleted categories:</strong> ${rows.map(r=>`<span style="margin-left:8px;">${r.name} (${Math.ceil((r.seconds_left||0)/60)}m left) <button class="btn-row-action" onclick="restoreDeletedCategory(${r.id})">Revert delete</button></span>`).join('')}`; }

function showImportPreview(data){ document.getElementById('import-step-1').style.display='none'; document.getElementById('import-step-2').style.display='block'; document.getElementById('import-preview-stats').innerHTML=`<strong>Found:</strong> ${data.total} | <strong>New:</strong> ${data.new_count} | <strong>Duplicate:</strong> ${data.dup_count} | <strong>Skipped (active):</strong> ${data.skipped_count}`; document.getElementById('import-preview-table').innerHTML = `<table class="data-table"><tbody>${(data.preview||[]).map(r=>`<tr><td>${r.book_no}</td><td>${r.title}</td><td>${r.category||'—'}</td><td>${r.action}</td></tr>`).join('')}</tbody></table>`; }
function resetImport(){importData=null; document.getElementById('import-step-1').style.display='block'; document.getElementById('import-step-2').style.display='none'; document.getElementById('import-result').innerHTML='';}

function buildImportFormData(){
  const file=document.getElementById('import-file').files[0];
  const raw=(document.getElementById('import-raw')?.value||'').trim();
  if(!file && !raw){ alert('Choose a file or paste import rows first.'); return null; }
  const fd=new FormData();
  if(file) fd.append('file', file);
  if(raw) fd.append('raw_input', raw);
  fd.append('mode', document.getElementById('import-mode').value);
  return fd;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('save-book-btn')?.addEventListener('click', addBook);
  document.getElementById('add-book-btn')?.addEventListener('click', addBook);
  document.getElementById('save-category-btn')?.addEventListener('click', addCategory);
  ['book-title','book-no'].forEach((id)=>document.getElementById(id)?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault(); addBook();}}));
  document.getElementById('new-category')?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault(); addCategory();}});
  ['status-filter','category-filter','sort-select'].forEach((id)=>document.getElementById(id)?.addEventListener('change',(e)=>{const map={'status-filter':'status','category-filter':'category','sort-select':'sort'}; bookFilters[map[id]]=e.target.value; loadBooks();}));
  document.getElementById('book-search')?.addEventListener('input',(e)=>{bookFilters.search=e.target.value; loadBooks();});
  document.getElementById('open-import-btn')?.addEventListener('click',()=>document.getElementById('import-modal').style.display='flex');
  document.getElementById('import-close')?.addEventListener('click',()=>{document.getElementById('import-modal').style.display='none'; resetImport();});
  document.getElementById('import-analyze-btn')?.addEventListener('click', async()=>{ const fd=buildImportFormData(); if(!fd) return; const res=await fetch('/api/books/import/analyze',{method:'POST',body:fd}); const data=await res.json(); if(!res.ok){ alert(data.error||'Import analyze failed.'); return; } importData=data; showImportPreview(data);});
  document.getElementById('import-commit-btn')?.addEventListener('click', async()=>{const fd=buildImportFormData(); if(!fd) return; const mode=document.getElementById('import-mode').value; if(mode==='dryrun') return; const res=await fetch('/api/books/import/commit',{method:'POST',body:fd}); const data=await res.json(); document.getElementById('import-result').innerHTML=res.ok?`Inserted: ${data.inserted} | Updated: ${data.updated} | Skipped: ${data.skipped}`:(data.error||'Import failed.'); if(res.ok){ bookFilters.status='all'; const sf=document.getElementById('status-filter'); if(sf) sf.value='all'; await loadCategories(); loadBooks(); setTimeout(()=>{document.getElementById('import-modal').style.display='none'; resetImport(); document.getElementById('import-file').value=''; document.getElementById('import-raw').value='';},900); }});
  document.getElementById('open-sheets-btn')?.addEventListener('click',()=>document.getElementById('sheets-modal').style.display='flex');
  document.getElementById('sheets-close')?.addEventListener('click',()=>document.getElementById('sheets-modal').style.display='none');
  document.getElementById('sheets-sync-btn')?.addEventListener('click', async()=>{let url=document.getElementById('sheets-url').value.trim(); if(!url){ url=prompt('No Google Sheet connected yet. Paste the sheet URL to connect and sync:','')?.trim()||''; if(!url) return; document.getElementById('sheets-url').value=url; } const res=await fetch('/api/sheets/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sheet_url:url})}); const data=await res.json(); document.getElementById('sheets-result').innerHTML=data.error?data.error:`Inserted: ${data.inserted} | Updated: ${data.updated} | Skipped: ${data.skipped}`; if(res.ok) loadBooks();});
  await loadCategories(); await loadBooks(); await loadDeletedCache(); await loadDeletedCategoryCache();
  setInterval(()=>{ loadDeletedCache(); loadDeletedCategoryCache(); }, 30000);
});
