(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const admin=()=>window.TNTT?.roles?.includes('admin');
const roleLabels={admin:'Admin',bdh:'BĐH',giao_ly_vien:'Giáo lý viên',hoi_dong_huynh_truong_du_truong:'HĐ Huynh trưởng & Dự trưởng',member:'Đoàn sinh',doan_sinh:'Đoàn sinh',tuyen_uy:'Tuyên úy',xu_doan_truong:'Xứ đoàn trưởng',pho_nghien_huan:'Phó Nghiên huấn',pho_noi_vu:'Phó Nội vụ',thu_ky:'Thư ký',thu_quy:'Thủ quỹ',truong_ban_giao_ly:'Trưởng ban Giáo lý',huynh_truong:'Huynh trưởng',glv_khai_tam:'Giáo lý viên lớp Khai Tâm',tro_giang_khai_tam:'Trợ giảng lớp Khai Tâm',glv_den_ban_tiec_thanh:'Giáo lý viên lớp Đến Bàn Tiệc Thánh',tro_giang_den_ban_tiec_thanh:'Trợ giảng lớp Đến Bàn Tiệc Thánh',glv_them_suc:'Giáo lý viên lớp Thêm Sức',tro_giang_them_suc:'Trợ giảng lớp Thêm Sức',glv_song_dao:'Giáo lý viên lớp Sống Đạo',tro_giang_song_dao:'Trợ giảng lớp Sống Đạo',truong_nganh_chien_con:'Trưởng ngành Chiên Con',pho_nganh_chien_con:'Phó ngành Chiên Con',truong_nganh_au_nhi:'Trưởng ngành Ấu Nhi',pho_nganh_au_nhi:'Phó ngành Ấu Nhi',truong_nganh_thieu_nhi:'Trưởng ngành Thiếu Nhi',pho_nganh_thieu_nhi:'Phó ngành Thiếu Nhi',truong_nganh_nghia_hiep:'Trưởng ngành Nghĩa sĩ & Hiệp sĩ',pho_nganh_nghia_hiep:'Phó ngành Nghĩa sĩ & Hiệp sĩ'};
const scopedGLV=Object.keys(roleLabels).filter(r=>r.startsWith('glv_')||r.startsWith('tro_giang_'));
const canonicalGroups=['TUYEN_UY','BĐH','BAN_GIAO_LY','HD_HT_DT','DOAN_SINH'];
function isStudentGroup(g){return g==='DOAN_SINH'||String(g||'').startsWith('Đoàn sinh ·')}
function matchGroup(a,m,kind){
 const roles=a.roles||[],g=a.account_group||'';
 if(kind==='TK Tuyên úy')return g==='TUYEN_UY'||roles.includes('tuyen_uy');
 if(kind==='Tài khoản BĐH')return g==='BĐH'||roles.includes('bdh')||roles.some(r=>['admin','xu_doan_truong','pho_nghien_huan','pho_noi_vu','thu_ky','thu_quy'].includes(r));
 if(kind==='TK Ban Giáo lý')return g==='BAN_GIAO_LY'||roles.includes('giao_ly_vien')||roles.includes('truong_ban_giao_ly')||roles.some(r=>scopedGLV.includes(r));
 if(kind==='TK Hội đồng Huynh trưởng & Dự trưởng')return g==='HD_HT_DT'||g==='Hội đồng Huynh trưởng & Dự trưởng'||roles.includes('hoi_dong_huynh_truong_du_truong')||roles.includes('huynh_truong');
 if(kind.startsWith('TK Đoàn sinh')){
  if(roles.includes('tuyen_uy')||g==='TUYEN_UY')return false;
  if(!roles.includes('member')&&!roles.includes('doan_sinh')&&!isStudentGroup(g))return false;
  const branch=kind.split('·')[1]?.trim();
  const legacyBranch=String(g).split('·')[1]?.trim();
  const memberBranch=m?.branch||legacyBranch||'';
  return !branch||memberBranch===branch||(branch==='Nghĩa Sĩ'&&memberBranch==='Nghĩa sĩ & Hiệp sĩ')||(branch==='Hiệp Sĩ'&&memberBranch==='Nghĩa sĩ & Hiệp sĩ')||(branch==='Nghĩa sĩ & Hiệp sĩ'&&memberBranch==='Nghĩa sĩ & Hiệp sĩ');
 }
 return true;
}
function slugifyName(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'')}
function suggestedEmail(name){const slug=slugifyName(name);return `${slug||'taikhoan'}@tntt.hn`}
function defaultRoles(group,member){
 if(group==='TUYEN_UY')return ['tuyen_uy'];
 if(group==='BĐH')return ['member','hoi_dong_huynh_truong_du_truong','huynh_truong','bdh'];
 if(group==='BAN_GIAO_LY')return ['member','giao_ly_vien'];
 if(group==='HD_HT_DT')return ['member','hoi_dong_huynh_truong_du_truong','huynh_truong'];
 if(group==='DOAN_SINH')return ['member','doan_sinh'];
 return ['member'];
}
window.accounts=async function(kind='Tài khoản BĐH'){
 setHead('Tài khoản',kind);if(!window.TNTT?.user){document.getElementById('page').innerHTML='<div class="login-card"><h2>🔐 Cần đăng nhập</h2><button class="primary" onclick="authModal(\'login\')">Đăng nhập</button></div>';return}
 const {data,error}=await sb.from('member_accounts').select('member_id,email,account_group,roles,active,auth_user_id,members(id,full_name,branch,member_type,status)').order('email');if(error){document.getElementById('page').innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
 const rows=(data||[]).filter(x=>matchGroup(x,x.members,kind));document.getElementById('page').innerHTML=`<div class="hero"><div><h1>${esc(kind)}</h1><div class="muted">${rows.length} tài khoản · ${admin()?'Admin được phép cấp tài khoản và chỉnh sửa phân quyền':'Chế độ xem'}</div></div>${admin()?'<button class="primary" onclick="newAccountModal()">＋ Cấp tài khoản</button>':''}</div><div class="table-wrap"><table class="table"><thead><tr><th>Họ và tên</th><th>Tài khoản</th><th>Nhóm</th><th>Quyền</th><th>Kích hoạt</th>${admin()?'<th>Thao tác</th>':''}</tr></thead><tbody>${rows.map(a=>`<tr><td><b>${esc(a.members?.full_name||'—')}</b><div class="muted">${esc(a.members?.branch||a.members?.member_type||'')}</div></td><td>${esc(a.email)}</td><td>${esc(a.account_group||'—')}</td><td>${(a.roles||[]).map(r=>`<span class="pill blue">${esc(roleLabels[r]||r)}</span>`).join(' ')}</td><td><span class="pill ${a.auth_user_id?'green':'blue'}">${a.auth_user_id?'Đã kích hoạt':'Chưa kích hoạt'}</span></td>${admin()?`<td><button class="secondary" onclick='editAccountModal(${JSON.stringify(JSON.stringify({member_id:a.member_id,email:a.email,account_group:a.account_group,roles:a.roles,active:a.active,full_name:a.members?.full_name||""}))})'>✏️ Sửa quyền</button></td>`:''}</tr>`).join('')||'<tr><td colspan="6" class="empty">Không có tài khoản trong nhóm này.</td></tr>'}</tbody></table></div>`;
};
window.editAccountModal=function(payload){
 if(!admin())return alert('Chỉ Admin được sửa tài khoản.');
 const a=JSON.parse(payload);
 document.getElementById('accountAdminModal')?.remove();
 const modal=document.createElement('div');modal.id='accountAdminModal';modal.className='auth-modal';
 const roles=Object.keys(roleLabels);
 modal.innerHTML=`<div class="auth-box" style="width:min(900px,96vw);max-height:90vh;overflow:auto;padding:26px 28px"><button class="auth-close" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">×</button><div style="margin-bottom:18px;padding-right:36px"><div style="font-size:13px;font-weight:800;color:#2b64a3;text-transform:uppercase;letter-spacing:.04em">Quản trị tài khoản</div><h2 style="margin:4px 0 0">${esc(a.full_name||'Tài khoản')}</h2><div style="color:#748196;margin-top:5px">Chỉnh sửa tên đăng nhập, nhóm tài khoản và quyền truy cập</div></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px"><label style="display:grid;gap:6px;font-weight:700;color:#26364d">Tên đăng nhập<input id="accEmail" class="input" value="${esc(a.email)}" style="width:100%;box-sizing:border-box"></label><label style="display:grid;gap:6px;font-weight:700;color:#26364d">Nhóm tài khoản<select id="accGroup" class="select" style="width:100%;box-sizing:border-box">${canonicalGroups.map(x=>`<option ${x===a.account_group?'selected':''}>${x}</option>`).join('')}</select></label></div><div style="margin-top:18px"><div style="font-weight:800;color:#26364d;margin-bottom:10px">Quyền truy cập</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px">${roles.map(r=>`<label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e5ebf3;border-radius:10px"><input type="checkbox" name="accRole" value="${r}" ${(a.roles||[]).includes(r)?'checked':''}> ${esc(roleLabels[r])}</label>`).join('')}</div></div><label style="display:flex;align-items:center;gap:9px;margin-top:18px;font-weight:700"><input id="accActive" type="checkbox" ${a.active!==false?'checked':''}> Tài khoản hoạt động</label><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;position:sticky;bottom:-26px;background:#fff;padding:14px 0 4px"><button class="secondary" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">Đóng</button><button class="primary" type="button" onclick="saveAccountAdmin('${a.member_id}')">💾 Lưu thay đổi</button></div><p class="muted" style="margin-top:12px">Một người có thể được cấp nhiều quyền cùng lúc. Quyền theo lớp/ngành chỉ cho phép truy cập đúng phạm vi được phân công.</p></div>`;
 modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
};
window.saveAccountAdmin=async function(memberId){if(!admin())return;const email=document.getElementById('accEmail').value.trim().toLowerCase(),account_group=document.getElementById('accGroup').value,roles=[...document.querySelectorAll('input[name="accRole"]:checked')].map(x=>x.value),active=document.getElementById('accActive').checked;if(!email.endsWith('@tntt.hn'))return alert('Tài khoản phải có đuôi @tntt.hn.');if(account_group==='TUYEN_UY'&&!roles.includes('tuyen_uy'))roles.push('tuyen_uy');if(account_group==='TUYEN_UY'){for(const r of ['member','doan_sinh','bdh','giao_ly_vien','hoi_dong_huynh_truong_du_truong']){const i=roles.indexOf(r);if(i>=0)roles.splice(i,1)}}const {error}=await sb.from('member_accounts').update({email,account_group,roles,active}).eq('member_id',memberId);if(error)return alert(error.message);document.getElementById('accountAdminModal')?.remove();alert('Đã cập nhật tài khoản và phân quyền.');accounts(document.getElementById('pageSubtitle')?.textContent||'Tài khoản BĐH')};
window.newAccountModal=async function(){
 if(!admin())return alert('Chỉ Admin được cấp tài khoản.');
 const [{data:members,error:me},{data:accounts,error:ae}]=await Promise.all([
  sb.from('members').select('id,full_name,branch,member_type,status').order('full_name'),
  sb.from('member_accounts').select('member_id,email')
 ]);
 if(me||ae)return alert(me?.message||ae?.message||'Không tải được dữ liệu.');
 const used=new Set((accounts||[]).map(a=>a.member_id));
 const available=(members||[]).filter(m=>!used.has(m.id)&&m.status!=='Ngừng hoạt động');
 document.getElementById('accountAdminModal')?.remove();
 const modal=document.createElement('div');modal.id='accountAdminModal';modal.className='auth-modal';
 const roles=Object.keys(roleLabels);
 modal.innerHTML=`<div class="auth-box" style="width:min(920px,96vw);max-height:90vh;overflow:auto;padding:26px 28px"><button class="auth-close" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">×</button><div style="margin-bottom:18px;padding-right:36px"><div style="font-size:13px;font-weight:800;color:#2b64a3;text-transform:uppercase;letter-spacing:.04em">Cấp tài khoản mới</div><h2 style="margin:4px 0 0">Chọn thành viên và phân quyền</h2><div style="color:#748196;margin-top:5px">Chỉ hiển thị thành viên chưa có tài khoản.</div></div>${available.length?`<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:14px 18px"><label style="display:grid;gap:6px;font-weight:700">Thành viên<select id="newAccMember" class="select" style="width:100%">${available.map(m=>`<option value="${m.id}" data-name="${esc(m.full_name)}" data-branch="${esc(m.branch||'')}">${esc(m.full_name)}${m.branch?` · ${esc(m.branch)}`:''}</option>`).join('')}</select></label><label style="display:grid;gap:6px;font-weight:700">Tên đăng nhập<input id="newAccEmail" class="input" style="width:100%;box-sizing:border-box"></label><label style="display:grid;gap:6px;font-weight:700">Nhóm tài khoản<select id="newAccGroup" class="select" style="width:100%">${canonicalGroups.map(x=>`<option>${x}</option>`).join('')}</select></label><label style="display:flex;align-items:center;gap:9px;font-weight:700;padding-top:28px"><input id="newAccActive" type="checkbox" checked> Tài khoản hoạt động</label></div><div style="margin-top:18px"><div style="font-weight:800;color:#26364d;margin-bottom:10px">Quyền truy cập</div><div id="newAccRoles" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px">${roles.map(r=>`<label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e5ebf3;border-radius:10px"><input type="checkbox" name="newAccRole" value="${r}"> ${esc(roleLabels[r])}</label>`).join('')}</div></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;position:sticky;bottom:-26px;background:#fff;padding:14px 0 4px"><button class="secondary" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">Đóng</button><button class="primary" type="button" onclick="saveNewAccount()">＋ Cấp tài khoản</button></div><p class="muted" style="margin-top:12px">Sau khi được cấp, người dùng chọn “Kích hoạt tài khoản” ở màn hình đăng nhập và tự đặt mật khẩu.</p>`:'<div class="panel">Tất cả thành viên hiện đã có tài khoản.</div>'}</div>`;
 document.body.appendChild(modal);
 if(!available.length)return;
 const memberSel=document.getElementById('newAccMember'),groupSel=document.getElementById('newAccGroup'),emailInput=document.getElementById('newAccEmail');
 const syncEmail=()=>{const o=memberSel.selectedOptions[0];emailInput.value=suggestedEmail(o?.dataset.name||'')};
 const syncRoles=()=>{const member=available.find(m=>m.id===memberSel.value);const defs=defaultRoles(groupSel.value,member);document.querySelectorAll('input[name="newAccRole"]').forEach(x=>x.checked=defs.includes(x.value))};
 memberSel.onchange=()=>{syncEmail();syncRoles()};groupSel.onchange=syncRoles;syncEmail();syncRoles();
 modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
};
window.saveNewAccount=async function(){
 if(!admin())return;
 const member_id=document.getElementById('newAccMember')?.value,email=document.getElementById('newAccEmail')?.value.trim().toLowerCase(),account_group=document.getElementById('newAccGroup')?.value,roles=[...document.querySelectorAll('input[name="newAccRole"]:checked')].map(x=>x.value),active=document.getElementById('newAccActive')?.checked!==false;
 if(!member_id)return alert('Hãy chọn thành viên.');if(!email?.endsWith('@tntt.hn'))return alert('Tài khoản phải có đuôi @tntt.hn.');
 if(account_group==='TUYEN_UY'&&!roles.includes('tuyen_uy'))roles.push('tuyen_uy');
 const {error}=await sb.from('member_accounts').insert({member_id,email,account_group,roles,active,must_change_password:true});
 if(error)return alert(error.message);
 document.getElementById('accountAdminModal')?.remove();alert('Đã cấp tài khoản và phân quyền. Người dùng có thể kích hoạt tài khoản ngay.');accounts(document.getElementById('pageSubtitle')?.textContent||'Tài khoản BĐH');
};
function mergeBranchMenus(){const memberBtns=[...document.querySelectorAll('[data-route="members"]')];const nghia=memberBtns.find(b=>b.dataset.a==='Nghĩa Sĩ'),hiep=memberBtns.find(b=>b.dataset.a==='Hiệp Sĩ');if(nghia){nghia.textContent='• Nghĩa sĩ & Hiệp sĩ';nghia.dataset.a='Nghĩa sĩ & Hiệp sĩ';}if(hiep)hiep.remove();const accBtns=[...document.querySelectorAll('[data-route="accounts"]')];const an=accBtns.find(b=>b.dataset.a==='TK Đoàn sinh · Nghĩa Sĩ'),ah=accBtns.find(b=>b.dataset.a==='TK Đoàn sinh · Hiệp Sĩ');if(an){an.textContent='• Nghĩa sĩ & Hiệp sĩ';an.dataset.a='TK Đoàn sinh · Nghĩa sĩ & Hiệp sĩ';}if(ah)ah.remove();}
document.addEventListener('DOMContentLoaded',mergeBranchMenus);setTimeout(mergeBranchMenus,250);
})();