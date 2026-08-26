(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const staffRoles=['admin','bdh','giao_ly_vien','truong_ban_giao_ly','xu_doan_truong','pho_nghien_huan','pho_noi_vu','thu_ky','thu_quy','huynh_truong','hoi_dong_huynh_truong_du_truong'];
const isScopedStaff=()=> (window.TNTT?.roles||[]).some(r=>r.startsWith('glv_')||r.startsWith('tro_giang_')||r.startsWith('truong_nganh_')||r.startsWith('pho_nganh_'));
const isStudent=()=> (window.TNTT?.roles||[]).includes('member') && !(window.TNTT?.roles||[]).some(r=>staffRoles.includes(r)) && !isScopedStaff();
let myClassesCache=null;
async function myClasses(force=false){
 if(!isStudent()||!window.TNTT?.account?.member_id)return[];
 if(myClassesCache&&!force)return myClassesCache;
 const {data,error}=await sb.from('class_members').select('class_id,status,classes(name)').eq('member_id',TNTT.account.member_id).eq('status','active');
 if(error){console.warn(error);return[]}
 myClassesCache=(data||[]).map(x=>x.classes?.name).filter(Boolean);
 return myClassesCache;
}
async function restrictClassMenus(){
 const allowed=await myClasses(); if(!isStudent())return;
 document.querySelectorAll('.nested').forEach(n=>{
   const b=n.querySelector('[data-route="class"]'); if(!b)return;
   const name=b.dataset.a; n.style.display=allowed.includes(name)?'':'none';
 });
}
async function studentHomework(name){
 const body=document.getElementById('classBody'); if(!body)return;
 const {data:cls}=await sb.from('classes').select('id').eq('name',name).maybeSingle();
 if(!cls?.id){body.innerHTML='<div class="panel empty">Không tìm thấy lớp.</div>';return}
 const {data:items,error}=await sb.from('homework_assignments').select('id,title,content,due_date,created_at').eq('class_id',cls.id).eq('published',true).order('created_at',{ascending:false});
 if(error){body.innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
 const ids=(items||[]).map(x=>x.id);let subs=[];
 if(ids.length){const {data}=await sb.from('homework_submissions').select('homework_id,content,attachment_url,submitted_at,updated_at').in('homework_id',ids).eq('member_id',TNTT.account.member_id);subs=data||[]}
 body.innerHTML=`<div class="panel"><h2>Bài tập của ${esc(name)}</h2><div class="muted">Bạn chỉ xem và nộp bài của lớp mình đang học.</div></div><div class="assignment-list">${(items||[]).map(h=>{const s=subs.find(x=>x.homework_id===h.id);return `<div class="assignment-card" style="display:block"><div><span class="pill blue">🔔 Bài tập</span><h3>${esc(h.title)}</h3><div style="margin-bottom:10px">${esc(h.content||'')}</div><div class="muted">Hạn nộp: ${h.due_date?new Date(h.due_date+'T00:00').toLocaleDateString('vi-VN'):'Không đặt'}</div></div><div style="margin-top:14px;padding-top:14px;border-top:1px solid #e7edf5"><textarea class="input" id="subContent_${h.id}" rows="4" style="width:100%;box-sizing:border-box" placeholder="Nhập nội dung bài làm hoặc ghi chú...">${esc(s?.content||'')}</textarea><input class="input" id="subLink_${h.id}" style="width:100%;box-sizing:border-box;margin-top:8px" placeholder="Link bài làm / Google Drive (nếu có)" value="${esc(s?.attachment_url||'')}"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px"><span class="muted">${s?.submitted_at?'Đã nộp: '+new Date(s.submitted_at).toLocaleString('vi-VN'):'Chưa nộp'}</span><button class="primary" onclick="saveStudentSubmission('${h.id}')">${s?'💾 Cập nhật bài nộp':'📤 Nộp bài'}</button></div></div></div>`}).join('')||'<div class="panel empty">Lớp chưa có bài tập.</div>'}</div>`;
}
window.saveStudentSubmission=async function(homeworkId){
 if(!isStudent()||!TNTT.account?.member_id)return alert('Tài khoản này không phải tài khoản đoàn sinh.');
 const content=document.getElementById(`subContent_${homeworkId}`)?.value.trim()||null;
 const attachment_url=document.getElementById(`subLink_${homeworkId}`)?.value.trim()||null;
 if(!content&&!attachment_url)return alert('Hãy nhập bài làm hoặc dán link bài làm.');
 const payload={homework_id:homeworkId,member_id:TNTT.account.member_id,content,attachment_url,updated_at:new Date().toISOString()};
 const {error}=await sb.from('homework_submissions').upsert(payload,{onConflict:'homework_id,member_id'});
 if(error)return alert(error.message);
 alert('Đã nộp bài thành công.');
 const cls=document.getElementById('pageSubtitle')?.textContent?.split(' · ')[0]; if(cls)studentHomework(cls);
};
function deny(name){setHead('Giáo lý',name);document.getElementById('page').innerHTML='<div class="panel"><h2>Không có quyền truy cập lớp này</h2><div class="muted">Tài khoản đoàn sinh chỉ được vào đúng lớp đang được phân công.</div></div>'}
function install(){
 if(!window.catechism||window.catechism.__studentWrapped)return;
 const original=window.catechism;
 const wrapped=async function(name,mode='overview'){
   if(isStudent()){
     const allowed=await myClasses(); if(!allowed.includes(name))return deny(name);
     if(mode==='homework'){setHead('Giáo lý',`${name} · Bài tập`);document.getElementById('page').innerHTML=`<div class="class-banner"><div><h2>${esc(name)}</h2><div>Năm học 2026–2028 · lớp của bạn</div></div></div><div class="tabs"><button class="tab" onclick="catechism('${name}','overview')">Tổng quan</button><button class="tab" onclick="catechism('${name}','schedule')">📅 Lịch học</button><button class="tab" onclick="catechism('${name}','attendance')">Điểm danh</button><button class="tab" onclick="catechism('${name}','grades')">Điểm số</button><button class="tab active" onclick="catechism('${name}','homework')">🔔 Bài tập & Nộp bài</button></div><div id="classBody"></div>`;return studentHomework(name)}
   }
   return original(name,mode);
 };
 wrapped.__studentWrapped=true;window.catechism=wrapped;
}
window.addEventListener('tntt-auth-changed',()=>{myClassesCache=null;setTimeout(()=>{install();restrictClassMenus()},120)});
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{install();restrictClassMenus()},300));
})();