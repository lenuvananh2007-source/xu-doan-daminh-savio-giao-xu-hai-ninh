const SUPABASE_URL='https://shrtwmzylcfobaratvkz.supabase.co';
const SUPABASE_KEY='sb_publishable_4d3LCb6_UmuF4HgpiHVFHg_ubhsE2L-';
window.sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
window.TNTT={user:null,profile:null,account:null,roles:[]};

function authModal(mode='login'){
  document.getElementById('authModal')?.remove();
  const isLogin=mode==='login';
  const wrap=document.createElement('div'); wrap.id='authModal'; wrap.className='auth-modal';
  wrap.innerHTML=`<div class="auth-box"><button class="auth-close" onclick="document.getElementById('authModal').remove()">×</button><div class="auth-logo">DS</div><h2>${isLogin?'Đăng nhập':'Kích hoạt tài khoản'}</h2><p class="muted">Sử dụng tài khoản Xứ đoàn dạng <b>hoten@tntt.hn</b>.</p><form id="authForm" class="auth-form"><input id="authEmail" class="input" type="email" autocomplete="username" placeholder="hoten@tntt.hn" required><input id="authPassword" class="input" type="password" autocomplete="${isLogin?'current-password':'new-password'}" minlength="8" placeholder="Mật khẩu (tối thiểu 8 ký tự)" required>${!isLogin?'<input id="authPassword2" class="input" type="password" minlength="8" placeholder="Nhập lại mật khẩu" required>':''}<button class="primary" type="submit">${isLogin?'Đăng nhập':'Kích hoạt'}</button><div id="authMsg" class="auth-msg"></div></form><button class="auth-switch" onclick="authModal('${isLogin?'signup':'login'}')">${isLogin?'Chưa kích hoạt tài khoản? Kích hoạt tại đây':'Đã kích hoạt? Đăng nhập'}</button></div>`;
  document.body.appendChild(wrap);
  document.getElementById('authForm').onsubmit=async e=>{e.preventDefault();const email=document.getElementById('authEmail').value.trim().toLowerCase(),password=document.getElementById('authPassword').value,msg=document.getElementById('authMsg');msg.textContent='Đang xử lý…';
    if(!email.endsWith('@tntt.hn')){msg.textContent='Chỉ dùng tài khoản @tntt.hn đã được Xứ đoàn cấp.';return}
    if(!isLogin&&password!==document.getElementById('authPassword2').value){msg.textContent='Hai mật khẩu chưa trùng nhau.';return}
    const {data,error}=isLogin?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});
    if(error){msg.textContent=error.message;return}
    if(!isLogin&&!data.session){msg.textContent='Tài khoản đã được tạo nhưng hệ thống đang yêu cầu xác nhận email. BĐH cần tắt xác nhận email trong Supabase để tài khoản @tntt.hn dùng ngay.';return}
    document.getElementById('authModal')?.remove();await loadAuthState();dashboard();
  };
}
window.authModal=authModal;

async function loadAuthState(){
  const {data:{session}}=await sb.auth.getSession();
  TNTT.user=session?.user||null; TNTT.profile=null; TNTT.account=null; TNTT.roles=[];
  if(session){
    const [{data:p},{data:a}]=await Promise.all([
      sb.from('profiles').select('full_name,role,email').eq('id',session.user.id).maybeSingle(),
      sb.from('member_accounts').select('member_id,email,account_group,roles,must_change_password').eq('auth_user_id',session.user.id).maybeSingle()
    ]);
    TNTT.profile=p||null; TNTT.account=a||null; TNTT.roles=a?.roles||[];
  }
  renderUserChip();
  window.dispatchEvent(new CustomEvent('tntt-auth-changed'));
}
window.loadAuthState=loadAuthState;

function renderUserChip(){
  const chip=document.querySelector('.user-chip'); if(!chip)return;
  if(!TNTT.user){chip.innerHTML='<span class="dot offline"></span><span>Đăng nhập</span>';chip.onclick=()=>authModal('login');chip.title='Đăng nhập hệ thống';return}
  const name=TNTT.profile?.full_name||TNTT.user.email;chip.innerHTML=`<span class="dot"></span><span>${name}</span><span class="logout-mini" title="Đăng xuất">↪</span>`;chip.onclick=async()=>{if(confirm('Đăng xuất khỏi hệ thống?')){await sb.auth.signOut();await loadAuthState();dashboard()}};
}
window.hasRole=r=>TNTT.roles.includes(r);
window.requireLogin=()=>{if(!TNTT.user){authModal('login');return false}return true};

function loadExtraScript(src,id){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=src;s.defer=true;document.head.appendChild(s)}
document.addEventListener('DOMContentLoaded',()=>{
  loadExtraScript('/admin-tools.js','admin-tools-js');
  loadExtraScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','xlsx-js');
  loadExtraScript('https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js','docx-js');
  setTimeout(()=>loadExtraScript('/export-tools.js','export-tools-js'),500);
});

sb.auth.onAuthStateChange(()=>setTimeout(loadAuthState,0));
document.addEventListener('DOMContentLoaded',loadAuthState);
