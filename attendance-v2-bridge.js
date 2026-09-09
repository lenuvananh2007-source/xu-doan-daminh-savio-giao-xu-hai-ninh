(()=>{
window.openAttendanceSession=window.openAttendanceSessionV2;
window.openAttendanceFromOverview=async(name,sid)=>{await catechism(name,'attendance');setTimeout(()=>window.openAttendanceSessionV2(name,sid),80)};
const watch=new MutationObserver(()=>{const sel=document.getElementById('globalAttType');if(sel&&!sel.querySelector('option[value="Chầu Thánh Thể"]')){const o=document.createElement('option');o.textContent='Chầu Thánh Thể';sel.appendChild(o)}});watch.observe(document.body,{childList:true,subtree:true});
})();