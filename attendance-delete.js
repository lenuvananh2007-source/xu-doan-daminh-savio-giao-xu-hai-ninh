(()=>{
function canDeleteAttendance(){try{return typeof roleWrite==='function'?roleWrite():(typeof hasRole==='function'&&(hasRole('bdh')||hasRole('giao_ly_vien')))}catch(e){return false}}
function enhanceAttendanceDelete(){
 if(!canDeleteAttendance())return;
 document.querySelectorAll('button').forEach(btn=>{
  const text=btn.textContent.trim();
  if((text!=='Kiểm tra / sửa'&&text!=='Xem')||btn.dataset.deleteEnhanced)return;
  const onclick=btn.getAttribute('onclick')||'';
  let m=onclick.match(/openAttendanceSession(?:V2)?\('([^']*)','([^']*)'\)/);
  if(!m)return;
  btn.dataset.deleteEnhanced='1';
  const del=document.createElement('button');
  del.className='secondary';del.textContent='🗑 Xoá';del.style.marginLeft='6px';del.style.color='#b42318';
  del.onclick=()=>window.deleteAttendanceSession(m[1],m[2]);
  btn.insertAdjacentElement('afterend',del);
 });
}
window.deleteAttendanceSession=async function(name,sid){
 if(!canDeleteAttendance())return alert('Bạn không có quyền xoá buổi điểm danh.');
 if(!confirm('Xoá buổi điểm danh này? Toàn bộ dữ liệu điểm danh, nề nếp và ghi chú của buổi này cũng sẽ bị xoá.'))return;
 const rec=await sb.from('attendance_records').delete().eq('session_id',sid);
 if(rec.error)return alert('Không thể xoá dữ liệu điểm danh: '+rec.error.message);
 const sess=await sb.from('attendance_sessions').delete().eq('id',sid);
 if(sess.error)return alert('Không thể xoá buổi điểm danh: '+sess.error.message);
 alert('Đã xoá buổi điểm danh.');
 if(typeof catechism==='function')catechism(name,'attendance');
};
const obs=new MutationObserver(()=>enhanceAttendanceDelete());
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',enhanceAttendanceDelete);
})();