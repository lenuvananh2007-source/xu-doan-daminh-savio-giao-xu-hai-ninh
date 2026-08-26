(()=>{
const slug=s=>(s||'du-lieu').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
const pageTitle=()=>document.getElementById('pageTitle')?.textContent?.trim()||'Xứ đoàn Đaminh Savio';
const pageSub=()=>document.getElementById('pageSubtitle')?.textContent?.trim()||'';
function visible(el){return !!(el&&el.offsetParent!==null)}
function cloneVisibleTable(){
 const table=[...document.querySelectorAll('#page table')].find(visible); if(!table)return null;
 const c=table.cloneNode(true);
 c.querySelectorAll('input,select,textarea').forEach(el=>{const span=document.createElement('span');span.textContent=el.tagName==='SELECT'?el.options[el.selectedIndex]?.text||'':el.value||'';el.replaceWith(span)});
 c.querySelectorAll('button').forEach(b=>b.remove());
 return c;
}
function fallbackRows(){
 const rows=[['Nội dung','Thông tin']];
 document.querySelectorAll('#page .row').forEach(r=>{if(!visible(r))return;const cells=[...r.children].map(x=>x.innerText.trim()).filter(Boolean);if(cells.length)rows.push([cells[0]||'',cells.slice(1).join(' · ')])});
 if(rows.length===1){document.querySelectorAll('#page .card,#page .panel').forEach(x=>{if(!visible(x))return;const t=x.innerText.trim().replace(/\n+/g,' · ');if(t)rows.push(['',t])})}
 return rows;
}
function addToolbar(){
 const page=document.getElementById('page'); if(!page||!window.TNTT?.user)return;
 if(page.querySelector('.export-toolbar'))return;
 const bar=document.createElement('div');bar.className='export-toolbar';bar.innerHTML='<span class="export-label">Xuất dữ liệu:</span><button class="secondary" onclick="exportCurrentExcel()">📊 Excel</button><button class="secondary" onclick="exportCurrentDocx()">📝 Word</button>';
 const anchor=page.querySelector('.hero,.class-banner,.toolbar,.panel,.cards');
 if(anchor)anchor.insertAdjacentElement('afterend',bar);else page.prepend(bar);
}
window.exportCurrentExcel=function(){
 if(!window.XLSX){alert('Chưa tải được bộ xuất Excel. Hãy tải lại trang.');return}
 const table=cloneVisibleTable(); let wb;
 if(table){wb=XLSX.utils.book_new();const ws=XLSX.utils.table_to_sheet(table,{raw:true});XLSX.utils.book_append_sheet(wb,ws,'Dữ liệu')}
 else {const ws=XLSX.utils.aoa_to_sheet(fallbackRows());wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Dữ liệu')}
 XLSX.writeFile(wb,`${slug(pageTitle()+'-'+pageSub())||'du-lieu'}.xlsx`);
};
window.exportCurrentDocx=async function(){
 if(!window.docx){alert('Chưa tải được bộ xuất Word. Hãy tải lại trang.');return}
 const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,HeadingLevel,WidthType}=window.docx;
 const children=[new Paragraph({text:'XỨ ĐOÀN ĐAMINH SAVIO – GIÁO XỨ HẢI NINH',heading:HeadingLevel.HEADING_1}),new Paragraph({children:[new TextRun({text:pageTitle(),bold:true,size:30})]}),new Paragraph({text:pageSub()}),new Paragraph({text:`Xuất ngày: ${new Date().toLocaleString('vi-VN')}`})];
 const table=cloneVisibleTable();
 if(table){
   const trs=[...table.querySelectorAll('tr')];
   if(trs.length){children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:trs.map((tr,ri)=>new TableRow({children:[...tr.querySelectorAll('th,td')].map(td=>new TableCell({children:[new Paragraph({children:[new TextRun({text:td.innerText.trim(),bold:ri===0})]})]}))}))}))}
 }else{
   const text=document.getElementById('page')?.innerText||'';
   text.split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,500).forEach(t=>children.push(new Paragraph({text:t})));
 }
 const blob=await Packer.toBlob(new Document({sections:[{children}]}));
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${slug(pageTitle()+'-'+pageSub())||'du-lieu'}.docx`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
};
const mo=new MutationObserver(()=>setTimeout(addToolbar,30));
document.addEventListener('DOMContentLoaded',()=>{const p=document.getElementById('page');if(p)mo.observe(p,{childList:true,subtree:true});setTimeout(addToolbar,200)});
window.addEventListener('tntt-auth-changed',()=>setTimeout(addToolbar,100));
})();
