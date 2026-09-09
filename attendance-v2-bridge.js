(()=>{
window.openAttendanceSession=window.openAttendanceSessionV2;
window.openAttendanceFromOverview=async(name,sid)=>{await catechism(name,'attendance');setTimeout(()=>window.openAttendanceSessionV2(name,sid),80)};
function enhanceAttendanceTypeSelect(){
 const sel=document.getElementById('attTypeFilter');
 if(sel&&!sel.querySelector('option[value="Chầu Thánh Thể"]')){
  const o=document.createElement('option');o.value='Chầu Thánh Thể';o.textContent='Chầu Thánh Thể';sel.appendChild(o)
 }
 if(sel&&!document.getElementById('attCreateType')){
  const createBtn=[...document.querySelectorAll('#classBody button')].find(b=>b.textContent.includes('Tạo buổi điểm danh'));
  if(createBtn){
   const createSel=document.createElement('select');createSel.id='attCreateType';createSel.className='select';createSel.style.marginLeft='8px';createSel.innerHTML='<option value="Học giáo lý">Học giáo lý</option><option value="Chầu Thánh Thể">Chầu Thánh Thể</option><option value="Thánh lễ">Thánh lễ</option><option value="Sinh hoạt đoàn">Sinh hoạt đoàn</option><option value="Học hát">Học hát</option><option value="Khác">Khác</option>';
   createBtn.parentNode.insertBefore(createSel,createBtn);
  }
 }
}
window.createAttendanceSessionV2=async function(name){
 if(typeof canClass==='function'&&!canClass(name))return alert('Bạn không có quyền tạo buổi điểm danh.');
 const date=prompt('Ngày điểm danh (YYYY-MM-DD):',new Date().toISOString().slice(0,10));if(!date)return;
 const type=document.getElementById('attCreateType')?.value||'Học giáo lý';
 const title=prompt('Nội dung / chủ đề:',type);if(title===null)return;
 const cid=await (async()=>{const {data}=await sb.from('classes').select('id').eq('name',name).maybeSingle();return data?.id||null})();
 const {error}=await sb.from('attendance_sessions').insert({class_id:cid,session_date:date,session_type:type,title:title||type}).select('id').single();
 if(error)return alert(error.message);
 alert('Đã tạo buổi điểm danh.');catechism(name,'attendance');
};
const watch=new MutationObserver(enhanceAttendanceTypeSelect);
watch.observe(document.body,{childList:true,subtree:true});
window.addEventListener('load',enhanceAttendanceTypeSelect);
})();