(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const admin=()=>window.TNTT?.roles?.includes('admin');
const roleLabels={admin:'Admin',bdh:'BĐH',giao_ly_vien:'Giáo lý viên',hoi_dong_huynh_truong_du_truong:'HĐ Huynh trưởng & Dự trưởng',member:'Đoàn sinh',tuyen_uy:'Tuyên úy',xu_doan_truong:'Xứ đoàn trưởng',pho_nghien_huan:'Phó Nghiên huấn',pho_noi_vu:'Phó Nội vụ',thu_ky:'Thư ký',thu_quy:'Thủ quỹ',truong_ban_giao_ly:'Trưởng ban Giáo lý',huynh_truong:'Huynh trưởng'};
function matchGroup(a,m,kind){const roles=a.roles||[],g=a.account_group||'';if(kind==='TK Tuyên úy')return g==='TUYEN_UY'||roles.includes('tuyen_uy');if(kind==='Tài khoản BĐH')return g==='BĐH'||roles.includes('bdh')||roles.some(r=>['admin','xu_doan_truong','pho_nghien_huan','pho_noi_vu','thu_ky','thu_quy'].includes(r));if(kind==='TK Ban Giáo lý')return g==='BAN_GIAO_LY'||roles.includes('giao_ly_vien')||roles.includes('truong_ban_giao_ly');if(kind==='TK Hội đồng Huynh trưởng & Dự trưởng')return g==='HD_HT_DT'||roles.includes('hoi_dong_huynh_truong_du_truong')||roles.includes('huynh_truong');if(kind.startsWith('TK Đoàn sinh')){if(roles.includes('tuyen_uy')||g==='TUYEN_UY')return false;if(!roles.includes('member')&&g!=='DOAN_SINH')return false;const branch=kind.split('·')[1]?.trim();return !branch||m?.branch===branch||(branch==='Nghĩa Sĩ'&&m?.branch==='Nghĩa sĩ & Hiệp sĩ')||(branch==='Hiệp Sĩ'&&m?.branch==='Nghĩa sĩ & Hiệp sĩ')}return true}
window.accounts=async function(kind='Tài khoản BĐH'){
 setHead('Tài khoản',kind);if(!window.TNTT?.user){document.getElementById('page').innerHTML='<div class="login-card"><h2>🔐 Cần đăng nhập</h2><button class="primary" onclick="authModal(\'login\')">Đăng nhập</button></div>';return}
 const {data,error}=await sb.from('member_accounts').select('member_id,email,account_group,roles,active,auth_user_id,members(id,full_name,branch,member_type,status)').order('email');if(error){document.getElementById('page').innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
 const rows=(data||[]).filter(x=>matchGroup(x,x.members,kind));document.getElementById('page').innerHTML=`<div class="hero"><div><h1>${esc(kind)}</h1><div class="muted">${rows.length} tài khoản · ${admin()?'Admin được phép chỉnh sửa':'Chế độ xem'}</div></div>${admin()?'<button class="primary" onclick="newAccountModal()">＋ Thêm tài khoản</button>':''}</div><div class="table-wrap"><table class="table"><thead><tr><th>Họ và tên</th><th>Tài khoản</th><th>Nhóm</th><th>Quyền</th><th>Kích hoạt</th>${admin()?'<th>Thao tác</th>':''}</tr></thead><tbody>${rows.map(a=>`<tr><td><b>${esc(a.members?.full_name||'—')}</b><div class="muted">${esc(a.members?.branch||a.members?.member_type||'')}</div></td><td>${esc(a.email)}</td><td>${esc(a.account_group||'—')}</td><td>${(a.roles||[]).map(r=>`<span class="pill blue">${esc(roleLabels[r]||r)}</span>`).join(' ')}</td><td><span class="pill ${a.auth_user_id?'green':'blue'}">${a.auth_user_id?'Đã kích hoạt':'Chưa kích hoạt'}</span></td>${admin()?`<td><button class="secondary" onclick='editAccountModal(${JSON.stringify(JSON.stringify({member_id:a.member_id,email:a.email,account_group:a.account_group,roles:a.roles,active:a.active,full_name:a.members?.full_name||""}))})'>✏️ Sửa</button></td>`:''}</tr>`).join('')||'<tr><td colspan="6" class="empty">Không có tài khoản trong nhóm này.</td></tr>'}</tbody></table></div>`;
};
window.editAccountModal=function(payload){
 if(!admin())return alert('Chỉ Admin được sửa tài khoản.');
 const a=JSON.parse(payload);
 document.getElementById('accountAdminModal')?.remove();
 const modal=document.createElement('div');
 modal.id='accountAdminModal';
 modal.className='auth-modal';
 const opts=['TUYEN_UY','BĐH','BAN_GIAO_LY','HD_HT_DT','DOAN_SINH'];
 const roles=Object.keys(roleLabels);
 modal.innerHTML=`<div class="auth-box" style="width:min(820px,96vw);max-height:90vh;overflow:auto;padding:26px 28px">
   <button class="auth-close" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">×</button>
   <div style="margin-bottom:18px;padding-right:36px"><div style="font-size:13px;font-weight:800;color:#2b64a3;text-transform:uppercase;letter-spacing:.04em">Quản trị tài khoản</div><h2 style="margin:4px 0 0">${esc(a.full_name||'Tài khoản')}</h2><div style="color:#748196;margin-top:5px">Chỉnh sửa tên đăng nhập, nhóm tài khoản và quyền truy cập</div></div>
   <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px"><label style="display:grid;gap:6px;font-weight:700;color:#26364d">Tên đăng nhập<input id="accEmail" class="input" value="${esc(a.email)}" style="width:100%;box-sizing:border-box"></label><label style="display:grid;gap:6px;font-weight:700;color:#26364d">Nhóm tài khoản<select id="accGroup" class="select" style="width:100%;box-sizing:border-box">${opts.map(x=>`<option ${x===a.account_group?'selected':''}>${x}</option>`).join('')}</select></label></div>
   <div style="margin-top:18px"><div style="font-weight:800;color:#26364d;margin-bottom:10px">Quyền truy cập</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px">${roles.map(r=>`<label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e5ebf3;border-radius:10px"><input type="checkbox" name="accRole" value="${r}" ${(a.roles||[]).includes(r)?'checked':''}> ${esc(roleLabels[r])}</label>`).join('')}</div></div>
   <label style="display:flex;align-items:center;gap:9px;margin-top:18px;font-weight:700"><input id="accActive" type="checkbox" ${a.active!==false?'checked':''}> Tài khoản hoạt động</label>
   <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;position:sticky;bottom:-26px;background:#fff;padding:14px 0 4px"><button class="secondary" type="button" onclick="document.getElementById('accountAdminModal')?.remove()">Đóng</button><button class="primary" type="button" onclick="saveAccountAdmin('${a.member_id}')">💾 Lưu thay đổi</button></div>
   <p class="muted" style="margin-top:12px">Nếu tài khoản đã kích hoạt, đổi tên đăng nhập ở đây không đổi email đăng nhập trong Supabase Auth. Nhóm và quyền truy cập được cập nhật ngay.</p>
 </div>`;
 modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
};
window.saveAccountAdmin=async function(memberId){if(!admin())return;const email=document.getElementById('accEmail').value.trim().toLowerCase(),account_group=document.getElementById('accGroup').value,roles=[...document.querySelectorAll('input[name="accRole"]:checked')].map(x=>x.value),active=document.getElementById('accActive').checked;if(account_group==='TUYEN_UY'&&!roles.includes('tuyen_uy'))roles.push('tuyen_uy');if(account_group==='TUYEN_UY'){for(const r of ['member','bdh','giao_ly_vien','hoi_dong_huynh_truong_du_truong']){const i=roles.indexOf(r);if(i>=0)roles.splice(i,1)}}const {error}=await sb.from('member_accounts').update({email,account_group,roles,active}).eq('member_id',memberId);if(error)return alert(error.message);document.getElementById('accountAdminModal')?.remove();alert('Đã cập nhật tài khoản và phân quyền.');accounts(document.getElementById('pageSubtitle')?.textContent||'Tài khoản BĐH')};
window.newAccountModal=()=>alert('Để tránh tạo tài khoản trùng hồ sơ, hãy thêm người ở mục Thành viên trước rồi cấp tài khoản cho hồ sơ đó.');
function mergeBranchMenus(){
 const memberBtns=[...document.querySelectorAll('[data-route="members"]')];
 const nghia=memberBtns.find(b=>b.dataset.a==='Nghĩa Sĩ'),hiep=memberBtns.find(b=>b.dataset.a==='Hiệp Sĩ');
 if(nghia){nghia.textContent='• Nghĩa sĩ & Hiệp sĩ';nghia.dataset.a='Nghĩa Sĩ';} if(hiep)hiep.remove();
 const accBtns=[...document.querySelectorAll('[data-route="accounts"]')];
 const an=accBtns.find(b=>b.dataset.a==='TK Đoàn sinh · Nghĩa Sĩ'),ah=accBtns.find(b=>b.dataset.a==='TK Đoàn sinh · Hiệp Sĩ');
 if(an){an.textContent='• Nghĩa sĩ & Hiệp sĩ';an.dataset.a='TK Đoàn sinh · Nghĩa Sĩ';} if(ah)ah.remove();
}
document.addEventListener('DOMContentLoaded',mergeBranchMenus);setTimeout(mergeBranchMenus,250);
})();