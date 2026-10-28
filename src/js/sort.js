// Client-side sort for table.sortable. Header text becomes a button; aria-sort marks the active column.
document.querySelectorAll('table.sortable').forEach(t=>{const ths=[...t.tHead.rows[0].cells],tb=t.tBodies[0];
 ths.forEach((th,i)=>{const b=document.createElement('button');b.type='button';b.className='sort-b';b.textContent=th.textContent;th.textContent='';th.appendChild(b);
  b.addEventListener('click',()=>{const asc=th.getAttribute('aria-sort')==='descending'||(th.getAttribute('aria-sort')!=='ascending'&&i===0);
   ths.forEach(x=>x.removeAttribute('aria-sort'));th.setAttribute('aria-sort',asc?'ascending':'descending');
   const key=r=>{const c=r.cells[i];return c.dataset.v!=null?parseFloat(c.dataset.v):c.textContent.trim().toLowerCase();};
   [...tb.rows].sort((a,c)=>{const x=key(a),y=key(c),d=typeof x==='number'?x-y:x.localeCompare(y);return asc?d:-d;}).forEach(r=>tb.appendChild(r));});});});
