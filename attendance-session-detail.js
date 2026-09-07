(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let detailRows=[],detailMeta=null;
async function getClassMembers(name){
 const {data:cls,error:ce}=await sb.from('classes').select('id').eq('name',name).maybeSingle();
 if(ce||!cls)return[];
 const {data,error}=await sb.from('class_members').select('member_id,members(id,full_name,branch,team,team_role,status)').eq('class_id',cls.id).eq('status','active');
 if(error)return[];
 return (data||[]).map(x=>x.members).filter(Boolean).sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name),'vi'));
}
function renderRows(filter='all',q=''){
 const tbody=document.getElementById('attendanceDetailBody');if(!tbody)return;
 const needle=String(q||'').trim().toLocaleLowerCase('vi');
 const rows=detailRows.filter(r=>(filter==='all'||r.state===filter)&&(!needle||String(r.full_name).toLocaleLowerCase('vi').includes(needle)));
 tbody.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.full_name)}</b><div class="att-sub">${esc(r.team||r.branch||'')}</div></td><td>${r.state==='present'?'<span class="att-pill present">✓ Có mặt</span>':r.state==='absent'?'<span class="att-pill absent">✕ Vắng</span>':'<span class="att-pill pending">… Chưa ghi nhận</span>'}</td><td>${esc(r.conduct||'—')}</td><td>${esc(r.note||'—')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Không có học viên phù hợp.</td></tr>';
 const c=document.getElementById('attendanceFilteredCount');if(c)c.textContent=`${rows.length} học viên`;
}
window.filterAttendanceDetail=function(filter){
 document.querySelectorAll('.att-filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
 renderRows(filter,document.getElementById('attendanceDetailSearch')?.value||'');
};
window.searchAttendanceDetail=function(){
 const active=document.querySelector('.att-filter.active')?.dataset.filter||'all';
 renderRows(active,document.getElementById('attendanceDetailSearch')?.value||'');
};
window.exportAttendanceDetail=function(){
 if(!detailMeta||!detailRows.length)return alert('Chưa có dữ liệu để xuất.');
 const data=detailRows.map((r,i)=>({'STT':i+1,'Họ và tên':r.full_name,'Ngành':r.branch||'','Đội':r.team||'','Trạng thái':r.state==='present'?'Có mặt':r.state==='absent'?'Vắng':'Chưa ghi nhận','Nề nếp':r.conduct||'','Ghi chú':r.note||''}));
 const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(data);XLSX.utils.book_append_sheet(wb,ws,'Điểm danh');
 const safe=String(detailMeta.className||'Lop').replace(/[\\/:*?"<>|]/g,'-');XLSX.writeFile(wb,`Diem danh - ${safe} - ${detailMeta.date}.xlsx`);
};
window.exportAttendanceAbsent=function(){
 if(!detailMeta)return;const absent=detailRows.filter(r=>r.state==='absent');if(!absent.length)return alert('Buổi này không có học viên vắng.');
 const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(absent.map((r,i)=>({'STT':i+1,'Họ và tên':r.full_name,'Ngành':r.branch||'','Đội':r.team||'','Ghi chú':r.note||''})));XLSX.utils.book_append_sheet(wb,ws,'Vắng');
 const safe=String(detailMeta.className||'Lop').replace(/[\\/:*?"<>|]/g,'-');XLSX.writeFile(wb,`Danh sach vang - ${safe} - ${detailMeta.date}.xlsx`);
};
window.openAttendanceSession=async function(name,sid){
 const target=document.getElementById('attendanceWork')||document.getElementById('classBody');if(!target)return;
 target.innerHTML='<div class="panel"><div class="empty">Đang tải chi tiết buổi điểm danh…</div></div>';
 const ms=await getClassMembers(name);
 const [{data:sess,error:se},{data:records,error:re}]=await Promise.all([sb.from('attendance_sessions').select('id,session_date,session_type,title').eq('id',sid).single(),sb.from('attendance_records').select('member_id,present,conduct,note').eq('session_id',sid)]);
 if(se||re){target.innerHTML=`<div class="panel"><div class="note">${esc((se||re).message)}</div></div>`;return}
 const map=new Map((records||[]).map(r=>[r.member_id,r]));detailRows=ms.map(m=>{const r=map.get(m.id);return{...m,present:r?.present,conduct:r?.conduct||'',note:r?.note||'',state:r===undefined?'pending':r.present?'present':'absent'}});detailMeta={className:name,date:sess.session_date,type:sess.session_type,title:sess.title};
 const present=detailRows.filter(r=>r.state==='present').length,absent=detailRows.filter(r=>r.state==='absent').length,pending=detailRows.filter(r=>r.state==='pending').length;
 target.innerHTML=`<section class="att-detail panel"><div class="att-detail-head"><div><span class="section-kicker">CHI TIẾT ĐIỂM DANH</span><h2>${esc(name)}</h2><div class="muted">${new Date(sess.session_date+'T00:00').toLocaleDateString('vi-VN')} · ${esc(sess.session_type||'')} · ${esc(sess.title||'')}</div></div><div class="att-export-actions"><button class="secondary" onclick="exportAttendanceAbsent()">Xuất danh sách vắng</button><button class="primary" onclick="exportAttendanceDetail()">⬇ Xuất Excel</button></div></div><div class="att-summary"><div><strong>${detailRows.length}</strong><span>Sĩ số</span></div><div class="ok"><strong>${present}</strong><span>Có mặt</span></div><div class="bad"><strong>${absent}</strong><span>Vắng</span></div><div class="warn"><strong>${pending}</strong><span>Chưa ghi nhận</span></div></div><div class="att-detail-tools"><div class="att-filters"><button class="att-filter active" data-filter="all" onclick="filterAttendanceDetail('all')">Tất cả</button><button class="att-filter" data-filter="present" onclick="filterAttendanceDetail('present')">✓ Có mặt</button><button class="att-filter" data-filter="absent" onclick="filterAttendanceDetail('absent')">✕ Vắng</button><button class="att-filter" data-filter="pending" onclick="filterAttendanceDetail('pending')">… Chưa ghi nhận</button></div><input id="attendanceDetailSearch" class="input" placeholder="Tìm học viên…" oninput="searchAttendanceDetail()"><span id="attendanceFilteredCount" class="muted"></span></div><div class="table-wrap"><table class="table att-detail-table"><thead><tr><th>STT</th><th>Học viên</th><th>Trạng thái</th><th>Nề nếp</th><th>Ghi chú</th></tr></thead><tbody id="attendanceDetailBody"></tbody></table></div></section>`;
 renderRows();target.scrollIntoView({behavior:'smooth',block:'start'});
};
window.openAttendanceFromOverview=async function(name,sid){await catechism(name,'attendance');setTimeout(()=>openAttendanceSession(name,sid),60)};
document.addEventListener('click',e=>{const tr=e.target.closest('table tbody tr');if(!tr||e.target.closest('button,a,input,select,textarea'))return;const btn=tr.querySelector('button[onclick*="openAttendanceSession"]');if(btn)btn.click();});
})();