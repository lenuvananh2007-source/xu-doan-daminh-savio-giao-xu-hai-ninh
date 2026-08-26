(()=>{
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
function addSearch(){
 const title=document.getElementById('pageTitle')?.textContent?.trim();
 if(!['Thành viên','Tài khoản'].includes(title)) return;
 const page=document.getElementById('page'); if(!page||page.querySelector('.name-search-box')) return;
 const table=page.querySelector('table.table'); if(!table) return;
 const wrap=table.closest('.table-wrap')||table.parentElement;
 const box=document.createElement('div'); box.className='toolbar name-search-box';
 box.innerHTML='<div style="position:relative;max-width:420px;width:100%"><span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);z-index:1">🔎</span><input class="input" id="nameSearchInput" style="width:100%;padding-left:40px" placeholder="Tìm theo họ và tên..."></div><span class="muted" id="nameSearchCount"></span>';
 wrap.parentNode.insertBefore(box,wrap);
 const input=box.querySelector('#nameSearchInput'),count=box.querySelector('#nameSearchCount');
 const rows=[...table.querySelectorAll('tbody tr')].filter(r=>!r.classList.contains('empty'));
 const run=()=>{const q=norm(input.value);let shown=0;rows.forEach(r=>{const name=norm(r.querySelector('td:first-child')?.textContent);const ok=!q||name.includes(q);r.style.display=ok?'':'none';if(ok)shown++});count.textContent=q?`${shown} kết quả`:''};
 input.addEventListener('input',run); input.focus();
}
let t;const schedule=()=>{clearTimeout(t);t=setTimeout(addSearch,160)};
document.addEventListener('DOMContentLoaded',()=>{const page=document.getElementById('page');if(page)new MutationObserver(schedule).observe(page,{childList:true,subtree:true});schedule()});
})();