(()=>{
const CLASS_ROLES={
 'Lớp Khai Tâm':['glv_khai_tam','tro_giang_khai_tam'],
 'Lớp Đến Bàn Tiệc Thánh':['glv_den_ban_tiec_thanh','tro_giang_den_ban_tiec_thanh'],
 'Lớp Thêm Sức':['glv_them_suc','tro_giang_them_suc'],
 'Lớp Sống đạo':['glv_song_dao','tro_giang_song_dao']
};
const BRANCH_ROLES={
 'Chiên Con':['truong_nganh_chien_con','pho_nganh_chien_con'],
 'Ấu Nhi':['truong_nganh_au_nhi','pho_nganh_au_nhi'],
 'Thiếu Nhi':['truong_nganh_thieu_nhi','pho_nganh_thieu_nhi'],
 'Nghĩa sĩ & Hiệp sĩ':['truong_nganh_nghia_hiep','pho_nganh_nghia_hiep']
};
const roles=()=>window.TNTT?.roles||[];
const broad=()=>roles().some(r=>['admin','bdh','xu_doan_truong','pho_nghien_huan','pho_noi_vu','thu_ky','truong_ban_giao_ly'].includes(r));
const assignedClass=name=>broad()||(CLASS_ROLES[name]||[]).some(r=>roles().includes(r));
const assignedBranch=name=>broad()||(BRANCH_ROLES[name]||[]).some(r=>roles().includes(r));
const isScopedClass=()=>Object.values(CLASS_ROLES).flat().some(r=>roles().includes(r));
const isScopedBranch=()=>Object.values(BRANCH_ROLES).flat().some(r=>roles().includes(r));
const deny=msg=>{const p=document.getElementById('page');if(p)p.innerHTML=`<div class="panel"><h2>Không có quyền truy cập</h2><p class="muted">${msg}</p></div>`;};

const originalHasRole=window.hasRole;
window.hasRole=function(r){
 if(r==='giao_ly_vien'&&window.__scopeClass&&['attendance','grades'].includes(window.__scopeMode)&&assignedClass(window.__scopeClass))return true;
 return originalHasRole?originalHasRole(r):roles().includes(r);
};

const originalCatechism=window.catechism;
if(originalCatechism)window.catechism=async function(name,mode='overview'){
 if(isScopedClass()&&!broad()&&!assignedClass(name)){setHead('Giáo lý',name);deny('Tài khoản này chỉ được truy cập lớp giáo lý đã được phân công.');return;}
 if(isScopedClass()&&!broad()&&mode==='homework'){setHead('Giáo lý',`${name} · Bài tập`);deny('Quyền Giáo lý viên/Trợ giảng theo lớp hiện chỉ gồm danh sách lớp, điểm danh và điểm.');return;}
 window.__scopeClass=name;window.__scopeMode=mode;
 try{return await originalCatechism(name,mode)}finally{setTimeout(()=>{window.__scopeClass=null;window.__scopeMode=null},0)}
};

const originalMembers=window.members;
if(originalMembers)window.members=async function(kind='Tất cả thành viên'){
 if(isScopedBranch()&&!broad()){
   if(kind==='Tất cả thành viên'||!assignedBranch(kind)){setHead('Thành viên',kind);deny('Trưởng/Phó ngành chỉ được xem và cập nhật đoàn sinh thuộc đúng ngành mình phụ trách.');return;}
 }
 return originalMembers(kind);
};

const originalOpen=window.openMemberProfile;
window.openMemberProfile=async function(id){
 if(!isScopedBranch()||broad())return originalOpen(id);
 const {data:m,error}=await sb.from('members').select('*').eq('id',id).single();if(error)return alert(error.message);
 if(!assignedBranch(m.branch))return alert('Bạn không có quyền cập nhật thành viên thuộc ngành này.');
 document.getElementById('memberAdminModal')?.remove();
 const modal=document.createElement('div');modal.id='memberAdminModal';modal.className='auth-modal';
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const f=(label,key)=>`<label style="display:grid;gap:6px;font-weight:700">${label}<input class="input" data-scope-member="${key}" value="${esc(m[key]||'')}"></label>`;
 modal.innerHTML=`<div class="auth-box" style="width:min(820px,96vw);max-height:90vh;overflow:auto"><button class="auth-close" onclick="memberAdminModal.remove()">×</button><h2>${esc(m.full_name||'Hồ sơ thành viên')}</h2><p class="muted">Cập nhật thông tin trong phạm vi ngành ${esc(m.branch||'')}</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">${f('Họ và tên','full_name')}${f('Tên thánh','saint_name')}${f('SĐT','phone')}${f('Tên phụ huynh','parent_name')}${f('SĐT phụ huynh','parent_phone')}${f('Đội','team')}${f('Vai trò trong đội/ngành','team_role')}${f('Trạng thái','status')}</div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px"><button class="secondary" onclick="memberAdminModal.remove()">Đóng</button><button class="primary" onclick="saveScopedMember('${id}','${esc(m.branch||'')}')">💾 Lưu cập nhật</button></div></div>`;
 modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
};
window.saveScopedMember=async function(id,branch){if(!assignedBranch(branch)||broad())return;const patch={};document.querySelectorAll('[data-scope-member]').forEach(x=>patch[x.dataset.scopeMember]=x.value.trim()||null);const {error}=await sb.from('members').update(patch).eq('id',id).eq('branch',branch);if(error)return alert(error.message);document.getElementById('memberAdminModal')?.remove();alert('Đã cập nhật thành viên trong ngành.');members(branch)};

function tidyMenu(){
 if(isScopedClass()&&!broad())document.querySelectorAll('[data-route="class"]').forEach(b=>{const n=b.dataset.a;if(n&&CLASS_ROLES[n]&&!assignedClass(n))b.style.display='none';if(b.dataset.b==='homework')b.style.display='none'});
 if(isScopedBranch()&&!broad())document.querySelectorAll('[data-route="members"]').forEach(b=>{const n=b.dataset.a;if(n==='Tất cả thành viên'||(BRANCH_ROLES[n]&&!assignedBranch(n)))b.style.display='none'});
}
window.addEventListener('tntt-auth-changed',()=>setTimeout(tidyMenu,100));document.addEventListener('DOMContentLoaded',()=>setTimeout(tidyMenu,300));
})();