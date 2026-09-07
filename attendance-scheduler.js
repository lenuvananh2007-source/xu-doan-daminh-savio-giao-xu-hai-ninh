(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=d=>d?new Date(d+'T00:00').toLocaleDateString('vi-VN'):'—';
const canManage=()=>typeof hasRole==='function'&&(hasRole('admin')||hasRole('bdh')||hasRole('truong_ban_giao_ly')||hasRole('giao_ly_vien'));

function injectActions(){
 const head=document.querySelector('.att-head-actions');if(!head||head.querySelector('[data-global-att-schedule]'))return;
 const schedule=document.createElement('button');schedule.className='secondary';schedule.dataset.globalAttSchedule='1';schedule.textContent='📅 Đặt lịch điểm danh';schedule.onclick=()=>openGlobalAttendanceScheduler();
 const report=document.createElement('button');report.className='primary';report.dataset.dailyAttReport='1';report.textContent='⬇ Báo cáo ngày';report.onclick=()=>exportDailyAttendanceReport();
 head.prepend(schedule);head.append(report);
}
const baseOverview=window.attendanceOverview;
if(baseOverview){window.attendanceOverview=async function(...args){const r=await baseOverview(...args);setTimeout(injectActions,0);return r}}

async function getClasses(){const {data,error}=await sb.from('classes').select('id,name,academic_year,active').eq('active',true).order('name');if(error)throw error;return data||[]}

window.openGlobalAttendanceScheduler=async function(){
 if(!canManage())return alert('Tài khoản của bạn chưa có quyền đặt lịch điểm danh toàn Xứ đoàn.');
 let classes=[];try{classes=await getClasses()}catch(e){return alert(e.message||e)}
 document.getElementById('globalAttendanceScheduler')?.remove();
 const today=document.getElementById('attDate')?.value||new Date().toISOString().slice(0,10);
 const wrap=document.createElement('div');wrap.id='globalAttendanceScheduler';wrap.className='att-modal-backdrop';
 wrap.innerHTML=`<div class="att-modal"><div class="att-modal-head"><div><span class="section-kicker">ĐIỂM DANH TOÀN XỨ ĐOÀN</span><h2>Đặt lịch điểm danh</h2><p>Tạo trước cùng một buổi điểm danh cho nhiều lớp. Buổi đã tồn tại sẽ không bị tạo trùng.</p></div><button class="att-modal-close" onclick="document.getElementById('globalAttendanceScheduler')?.remove()">×</button></div>
 <div class="att-form-grid"><label>Ngày điểm danh<input id="globalAttDate" class="input" type="date" value="${today}"></label><label>Loại buổi<select id="globalAttType" class="select"><option>Học giáo lý</option><option>Thánh lễ</option><option>Sinh hoạt đoàn</option><option>Học hát</option><option>Khác</option></select></label></div>
 <label class="att-full-label">Tiêu đề / nội dung<input id="globalAttTitle" class="input" placeholder="Ví dụ: Học giáo lý Chủ nhật 13/09/2026"></label>
 <div class="att-class-picker-head"><b>Áp dụng cho lớp</b><div><button class="link-btn" onclick="toggleGlobalAttendanceClasses(true)">Chọn tất cả</button><button class="link-btn" onclick="toggleGlobalAttendanceClasses(false)">Bỏ chọn</button></div></div>
 <div class="att-class-picker">${classes.map(c=>`<label><input type="checkbox" class="global-att-class" value="${c.id}" checked><span><b>${esc(c.name)}</b><small>${esc(c.academic_year||'')}</small></span></label>`).join('')}</div>
 <div class="att-modal-actions"><button class="secondary" onclick="document.getElementById('globalAttendanceScheduler')?.remove()">Hủy</button><button id="globalAttSave" class="primary" onclick="saveGlobalAttendanceSchedule()">Tạo lịch điểm danh</button></div></div>`;
 document.body.appendChild(wrap);
};
window.toggleGlobalAttendanceClasses=function(v){document.querySelectorAll('.global-att-class').forEach(x=>x.checked=v)};

window.saveGlobalAttendanceSchedule=async function(){
 const date=document.getElementById('globalAttDate')?.value,type=document.getElementById('globalAttType')?.value,titleRaw=document.getElementById('globalAttTitle')?.value.trim(),ids=[...document.querySelectorAll('.global-att-class:checked')].map(x=>x.value);
 if(!date)return alert('Chọn ngày điểm danh.');if(!ids.length)return alert('Chọn ít nhất một lớp.');
 const title=titleRaw||`${type} ${fmt(date)}`;const btn=document.getElementById('globalAttSave');if(btn){btn.disabled=true;btn.textContent='Đang tạo…'}
 try{
  const {data:existing,error:ee}=await sb.from('attendance_sessions').select('class_id').in('class_id',ids).eq('session_date',date).eq('session_type',type);if(ee)throw ee;
  const exists=new Set((existing||[]).map(x=>x.class_id));const missing=ids.filter(id=>!exists.has(id));
  if(missing.length){const {error}=await sb.from('attendance_sessions').insert(missing.map(class_id=>({class_id,session_date:date,session_type:type,title})));if(error)throw error}
  document.getElementById('globalAttendanceScheduler')?.remove();alert(`Đã đặt lịch cho ${ids.length} lớp. ${missing.length} buổi mới được tạo, ${ids.length-missing.length} buổi đã tồn tại.`);
  if(typeof attendanceOverview==='function')attendanceOverview(date,type);
 }catch(e){alert(e.message||e)}finally{if(btn){btn.disabled=false;btn.textContent='Tạo lịch điểm danh'}}
};

window.exportDailyAttendanceReport=async function(){
 const date=document.getElementById('attDate')?.value||new Date().toISOString().slice(0,10);
 let classes=[];try{classes=await getClasses()}catch(e){return alert(e.message||e)}
 const classIds=classes.map(c=>c.id);
 const [{data:sessions,error:se},{data:cms,error:ce}]=await Promise.all([
  sb.from('attendance_sessions').select('id,class_id,session_date,session_type,title').in('class_id',classIds).eq('session_date',date).order('session_type'),
  sb.from('class_members').select('class_id,member_id,status,members(id,full_name,branch,team)').in('class_id',classIds).eq('status','active')
 ]);if(se||ce)return alert((se||ce).message);
 const sessIds=(sessions||[]).map(s=>s.id);let records=[];
 if(sessIds.length){const {data,error}=await sb.from('attendance_records').select('session_id,member_id,present,conduct,note').in('session_id',sessIds);if(error)return alert(error.message);records=data||[]}
 const summary=[],detail=[],absentRows=[];
 for(const c of classes){
  const members=(cms||[]).filter(x=>x.class_id===c.id).map(x=>x.members).filter(Boolean);const memberMap=new Map(members.map(m=>[m.id,m]));
  const cs=(sessions||[]).filter(s=>s.class_id===c.id);
  if(!cs.length){summary.push({'Lớp':c.name,'Loại buổi':'Chưa tạo','Tiêu đề':'','Sĩ số':members.length,'Đã nhập':0,'Có mặt':0,'Vắng':0,'Chưa ghi nhận':members.length,'Tỷ lệ chuyên cần':'0%'});continue}
  for(const s of cs){const rs=records.filter(r=>r.session_id===s.id),map=new Map(rs.map(r=>[r.member_id,r])),present=rs.filter(r=>r.present).length,absent=rs.filter(r=>r.present===false).length,pending=Math.max(0,members.length-rs.length),rate=members.length?Math.round(present/members.length*100):0;
   summary.push({'Lớp':c.name,'Loại buổi':s.session_type,'Tiêu đề':s.title||'','Sĩ số':members.length,'Đã nhập':rs.length,'Có mặt':present,'Vắng':absent,'Chưa ghi nhận':pending,'Tỷ lệ chuyên cần':rate+'%'});
   members.forEach((m,i)=>{const r=map.get(m.id),state=!r?'Chưa ghi nhận':r.present?'Có mặt':'Vắng';const row={'Lớp':c.name,'Loại buổi':s.session_type,'STT':i+1,'Họ và tên':m.full_name,'Ngành':m.branch||'','Đội':m.team||'','Trạng thái':state,'Nề nếp':r?.conduct||'','Ghi chú':r?.note||''};detail.push(row);if(state==='Vắng')absentRows.push(row)})
  }
 }
 const wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),'Tổng hợp');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(detail),'Chi tiết');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(absentRows.length?absentRows:[{'Thông tin':'Không có học viên vắng trong các buổi đã ghi nhận.'}]),'Danh sách vắng');
 XLSX.writeFile(wb,`Bao cao diem danh Xứ đoàn - ${date}.xlsx`);
};

setTimeout(injectActions,700);
})();