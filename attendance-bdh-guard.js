(()=>{
const BDH_ROLES=new Set(['bdh','xu_doan_truong','pho_nghien_huan','pho_noi_vu','pho_ngoai_vu','thu_ky','thu_quy']);
const roles=()=>Array.isArray(window.TNTT?.roles)?window.TNTT.roles:[];
const isBDH=()=>roles().some(r=>BDH_ROLES.has(String(r)));
const deny=()=>{
  if(typeof setHead==='function')setHead('Kiểm tra điểm danh','Chỉ dành cho Ban Điều Hành');
  const p=document.getElementById('page');
  if(p)p.innerHTML='<div class="panel"><h2>Không có quyền truy cập</h2><p class="muted">Phần kiểm tra điểm danh toàn Xứ đoàn chỉ dành cho tài khoản thuộc Ban Điều Hành.</p></div>';
  return false;
};
const protect=name=>{
  const original=window[name];
  if(typeof original!=='function'||original.__bdhGuarded)return;
  const wrapped=async function(...args){if(!isBDH())return deny();return await original.apply(this,args)};
  wrapped.__bdhGuarded=true;wrapped.__original=original;window[name]=wrapped;
};
function applyGuard(){
  document.querySelectorAll('[data-att-overview]').forEach(el=>{el.style.display=isBDH()?'':'none'});
  document.querySelectorAll('[data-global-att-schedule],[data-daily-att-report]').forEach(el=>{el.style.display=isBDH()?'':'none'});
  ['attendanceOverview','openGlobalAttendanceScheduler','saveGlobalAttendanceSchedule','exportDailyAttendanceReport','copyMissingAttendance','exportAttendanceOverview','openAttendanceFromOverview'].forEach(protect);
}
const observer=new MutationObserver(()=>applyGuard());
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('tntt-auth-changed',()=>setTimeout(applyGuard,0));
document.addEventListener('DOMContentLoaded',()=>setTimeout(applyGuard,0));
setTimeout(applyGuard,300);
})();