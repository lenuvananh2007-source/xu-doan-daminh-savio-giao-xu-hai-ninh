(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=d=>d?new Date(d+'T00:00').toLocaleDateString('vi-VN'):'—';
const branchOrder=['Chiên Con','Ấu Nhi','Thiếu Nhi','Nghĩa sĩ & Hiệp sĩ','HT-GLV'];
const branchLabel={'HT-GLV':'Huynh trưởng · GLV'};
async function stats(){
 const out={members:0,branches:0,classes:0,homework:0,branchCounts:{},schedule:[]};
 if(!window.TNTT?.user||!window.sb)return out;
 try{
  const [{data:members},{count:classes},{count:homework},{data:schedule}]=await Promise.all([
   sb.from('members').select('branch,status'),
   sb.from('classes').select('*',{count:'exact',head:true}),
   sb.from('homework_assignments').select('*',{count:'exact',head:true}).eq('published',true),
   sb.from('catechism_schedule').select('session_date,liturgical_day,common_activity,lesson,class_name').gte('session_date',new Date().toISOString().slice(0,10)).order('session_date').limit(4)
  ]);
  const active=(members||[]).filter(m=>!m.status||String(m.status).toLowerCase()!=='inactive');
  out.members=active.length;out.classes=classes||0;out.homework=homework||0;
  active.forEach(m=>{const b=m.branch||'Chưa phân ngành';out.branchCounts[b]=(out.branchCounts[b]||0)+1});
  out.branches=Object.keys(out.branchCounts).filter(x=>x!=='Chưa phân ngành').length;out.schedule=schedule||[];
 }catch(e){console.warn('Dashboard stats:',e)}
 return out;
}
function publicHero(){return `<section class="dash-hero public"><div class="dash-hero-copy"><span class="eyebrow">XỨ ĐOÀN ĐAMINH SAVIO · GIÁO XỨ HẢI NINH</span><h1>Hệ thống quản lý Xứ đoàn</h1><p>Quản lý thành viên, giáo lý, điểm danh, điểm số, bài tập, chương trình và tài chính trên một hệ thống thống nhất.</p><div class="hero-actions"><button class="hero-primary" onclick="authModal('login')">🔐 Đăng nhập hệ thống</button><button class="hero-secondary" onclick="authModal('signup')">Kích hoạt tài khoản</button></div></div><div class="dash-hero-symbol"><div class="symbol-ring"><span>DS</span><small>HẢI NINH</small></div></div></section><section class="public-features"><article><span>👥</span><b>Quản lý thành viên</b><small>Hồ sơ, ngành, đội và quá trình sinh hoạt</small></article><article><span>📖</span><b>Quản lý giáo lý</b><small>Lịch học, điểm danh, điểm số và bài tập</small></article><article><span>🔐</span><b>Phân quyền rõ ràng</b><small>Mỗi tài khoản chỉ truy cập đúng phạm vi được giao</small></article></section>`}
window.dashboard=async function(){
 setHead('Tổng quan Xứ đoàn','Năm hoạt động 2026–2028');
 const page=document.getElementById('page');if(!page)return;
 if(!window.TNTT?.user){page.innerHTML=publicHero();return}
 page.innerHTML='<div class="dash-loading"><div class="loader"></div><b>Đang tổng hợp dữ liệu Xứ đoàn…</b></div>';
 const s=await stats(),max=Math.max(1,...Object.values(s.branchCounts));
 const schedule=s.schedule.length?s.schedule.map((r,i)=>`<div class="timeline-item ${i===0?'featured':''}"><div class="date-box"><b>${String(new Date(r.session_date+'T00:00').getDate()).padStart(2,'0')}</b><span>THÁNG ${new Date(r.session_date+'T00:00').getMonth()+1}</span></div><div class="timeline-copy"><span class="tag">${esc(r.class_name||'Giáo lý')}</span><h3>${esc(r.liturgical_day||r.lesson||'Buổi học giáo lý')}</h3><p>${esc(r.lesson||r.common_activity||'Theo chương trình lớp')}</p></div></div>`).join(''):'<div class="empty-state"><span>📅</span><b>Chưa có lịch học sắp tới</b><small>Lịch mới sẽ hiển thị tại đây.</small></div>';
 const bars=branchOrder.filter(b=>s.branchCounts[b]).map((b,i)=>`<div class="branch-bar-row"><div class="branch-name"><span>${esc(branchLabel[b]||b)}</span><b>${s.branchCounts[b]}</b></div><div class="bar-track"><div class="bar-fill bar-${i+1}" style="width:${Math.round(s.branchCounts[b]/max*100)}%"></div></div></div>`).join('')||'<div class="empty-state compact">Chưa có dữ liệu ngành.</div>';
 page.innerHTML=`<section class="dash-hero"><div class="dash-hero-copy"><span class="eyebrow">XỨ ĐOÀN ĐAMINH SAVIO · GIÁO XỨ HẢI NINH</span><h1>Trung tâm điều hành Xứ đoàn</h1><p>Dữ liệu được tổng hợp trực tiếp từ hệ thống. Chọn một tác vụ để bắt đầu.</p><div class="hero-actions"><button class="hero-primary" onclick="catechism('Lớp Khai Tâm','schedule')">📅 Lịch giáo lý</button><button class="hero-secondary" onclick="document.getElementById('notificationBtn')?.click()">🔔 Thông báo</button></div></div><div class="dash-hero-symbol"><div class="symbol-ring"><span>DS</span><small>2026–2028</small></div></div></section>
 <section class="dash-metrics"><article class="metric-card mc-blue"><div class="metric-icon">👥</div><div><span>Thành viên</span><strong>${s.members}</strong><small>Hồ sơ đang quản lý</small></div></article><article class="metric-card mc-green"><div class="metric-icon">🕊️</div><div><span>Ngành / nhóm</span><strong>${s.branches}</strong><small>Đang có dữ liệu</small></div></article><article class="metric-card mc-gold"><div class="metric-icon">📖</div><div><span>Lớp giáo lý</span><strong>${s.classes}</strong><small>Trên hệ thống</small></div></article><article class="metric-card mc-purple"><div class="metric-icon">🔔</div><div><span>Bài tập</span><strong>${s.homework}</strong><small>Đang được công bố</small></div></article></section>
 <section class="dash-layout"><div class="dash-main-col"><article class="dash-panel"><div class="panel-head"><div><span class="section-kicker">GIÁO LÝ</span><h2>Lịch học sắp tới</h2></div><button class="link-btn" onclick="catechism('Lớp Khai Tâm','schedule')">Xem lịch →</button></div><div class="timeline-list">${schedule}</div></article><article class="dash-panel"><div class="panel-head"><div><span class="section-kicker">THÀNH VIÊN</span><h2>Quy mô theo ngành</h2></div><button class="link-btn" onclick="members('Tất cả thành viên')">Danh sách →</button></div><div class="branch-bars">${bars}</div></article></div>
 <div class="dash-side-col"><article class="dash-panel quick-panel"><div class="panel-head"><div><span class="section-kicker">TRUY CẬP NHANH</span><h2>Công việc thường dùng</h2></div></div><div class="quick-grid"><button onclick="members('Tất cả thành viên')"><span>👥</span><b>Thành viên</b></button><button onclick="catechism('Lớp Thêm Sức','attendance')"><span>✓</span><b>Điểm danh</b></button><button onclick="catechism('Lớp Đến Bàn Tiệc Thánh','grades')"><span>★</span><b>Điểm số</b></button><button onclick="catechism('Lớp Khai Tâm','homework')"><span>🔔</span><b>Bài tập</b></button><button onclick="finance()"><span>₫</span><b>Tài chính</b></button><button onclick="accounts('Tài khoản BĐH')"><span>◉</span><b>Tài khoản</b></button></div></article><article class="dash-panel system-card"><div class="system-status"><span class="status-dot"></span><div><b>Hệ thống đang hoạt động</b><small>Dữ liệu đồng bộ qua Supabase</small></div></div><div class="system-row"><span>Tài khoản</span><b>${esc(window.TNTT?.account?.email||window.TNTT?.user?.email||'Đã đăng nhập')}</b></div><div class="system-row"><span>Vai trò</span><b>${esc((window.TNTT?.roles||[]).join(', ')||'Thành viên')}</b></div></article></div></section>`;
};
setTimeout(()=>{if(typeof dashboard==='function')dashboard()},0);
})();