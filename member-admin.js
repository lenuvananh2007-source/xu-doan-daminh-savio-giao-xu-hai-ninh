(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isAdmin=()=>!!(window.TNTT?.roles||[]).includes('admin');
const field=(m,label,key,type='text')=>`<label style="display:grid;gap:6px;font-weight:700;color:#26364d">${label}<input class="input" data-member-field="${key}" type="${type}" value="${esc(m[key]||'')}" ${isAdmin()?'':'disabled'} style="width:100%;box-sizing:border-box"></label>`;
window.openMemberProfile=async id=>{
  if(!window.sb)return;
  const {data:m,error}=await sb.from('members').select('*').eq('id',id).single();
  if(error)return alert(error.message);
  document.getElementById('memberAdminModal')?.remove();
  const modal=document.createElement('div');
  modal.id='memberAdminModal';
  modal.className='auth-modal';
  modal.innerHTML=`<div class="auth-box" style="width:min(860px,96vw);max-height:90vh;overflow:auto;padding:26px 28px">
    <button class="auth-close" type="button" onclick="document.getElementById('memberAdminModal')?.remove()">×</button>
    <div style="margin-bottom:18px;padding-right:36px">
      <div style="font-size:13px;font-weight:800;color:#2b64a3;text-transform:uppercase;letter-spacing:.04em">Hồ sơ thành viên</div>
      <h2 style="margin:4px 0 0">${esc(m.full_name||'')}</h2>
      <div style="color:#748196;margin-top:5px">Xem và cập nhật thông tin đoàn sinh</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px">
      ${field(m,'Tên thánh','saint_name')}
      ${field(m,'Họ và tên','full_name')}
      ${field(m,'Ngày sinh','dob','date')}
      ${field(m,'Giới tính','gender')}
      ${field(m,'SĐT đoàn sinh','phone')}
      ${field(m,'Tên phụ huynh / người giám hộ','parent_name')}
      ${field(m,'SĐT phụ huynh','parent_phone')}
      ${field(m,'Ngành','branch')}
      ${field(m,'Đội','team')}
      ${field(m,'Vai trò','team_role')}
      ${field(m,'Lớp giáo lý','catechism_class')}
      ${field(m,'Trạng thái','status')}
    </div>
    <label style="display:grid;gap:6px;font-weight:700;color:#26364d;margin-top:14px">Ghi chú<textarea class="input" data-member-field="note" rows="3" ${isAdmin()?'':'disabled'} style="width:100%;box-sizing:border-box;resize:vertical">${esc(m.note||'')}</textarea></label>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;position:sticky;bottom:-26px;background:#fff;padding:14px 0 4px">
      <button class="secondary" type="button" onclick="document.getElementById('memberAdminModal')?.remove()">Đóng</button>
      ${isAdmin()?`<button class="primary" type="button" onclick="saveMemberProfile('${id}')">💾 Lưu cập nhật</button>`:''}
    </div>
  </div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
  document.body.appendChild(modal);
};
window.saveMemberProfile=async id=>{
  if(!isAdmin())return alert('Chỉ Admin được sửa hồ sơ.');
  const patch={};
  document.querySelectorAll('#memberAdminModal [data-member-field]').forEach(x=>patch[x.dataset.memberField]=x.value.trim()||null);
  const {error}=await sb.from('members').update(patch).eq('id',id);
  if(error)return alert(error.message);
  document.getElementById('memberAdminModal')?.remove();
  alert('Đã lưu cập nhật hồ sơ.');
  const active=document.querySelector('[data-route="members"].active');
  if(active)active.click();else if(window.members)members('Tất cả thành viên');
};
async function enhance(){
  const page=document.getElementById('page');
  if(!page||document.getElementById('pageTitle')?.textContent!=='Thành viên')return;
  const table=page.querySelector('.table');
  if(!table||table.dataset.memberEnhanced)return;
  table.dataset.memberEnhanced='1';
  const head=table.querySelector('thead tr');if(!head)return;
  ['Tên phụ huynh','SĐT phụ huynh','Thao tác'].forEach(t=>{const th=document.createElement('th');th.textContent=t;head.appendChild(th)});
  const names=[...table.querySelectorAll('tbody tr td:first-child b')].map(x=>x.textContent.trim()).filter(Boolean);if(!names.length)return;
  const {data,error}=await sb.from('members').select('id,full_name,parent_name,parent_phone').in('full_name',names);if(error)return;
  const buckets={};(data||[]).forEach(x=>(buckets[x.full_name]??=[]).push(x));
  [...table.querySelectorAll('tbody tr')].forEach(r=>{const name=r.querySelector('td:first-child b')?.textContent.trim();const m=buckets[name]?.shift();if(!m)return;const p=document.createElement('td');p.textContent=m.parent_name||'Chưa cập nhật';const ph=document.createElement('td');ph.textContent=m.parent_phone||'Chưa cập nhật';const a=document.createElement('td');a.innerHTML=`<button class="secondary" onclick="openMemberProfile('${m.id}')">${isAdmin()?'✏️ Sửa':'👁 Xem'}</button>`;r.append(p,ph,a)});
}
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(enhance,120)};
document.addEventListener('DOMContentLoaded',()=>{const p=document.getElementById('page');if(p)new MutationObserver(schedule).observe(p,{childList:true,subtree:true});schedule()});
window.addEventListener('tntt-auth-changed',schedule);
})();