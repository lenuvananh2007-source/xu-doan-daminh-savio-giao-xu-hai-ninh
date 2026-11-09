(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const CLASS_ROLES={
 'Lớp Khai Tâm':['glv_khai_tam','tro_giang_khai_tam'],
 'Lớp Đến Bàn Tiệc Thánh':['glv_den_ban_tiec_thanh','tro_giang_den_ban_tiec_thanh'],
 'Lớp Thêm Sức':['glv_them_suc','tro_giang_them_suc'],
 'Lớp Sống đạo':['glv_song_dao','tro_giang_song_dao']
};
const globalRoles=['admin','bdh','xu_doan_truong','pho_nghien_huan','pho_noi_vu','thu_ky','truong_ban_giao_ly','giao_ly_vien'];
const roles=()=>window.TNTT?.roles||[];
const canManage=name=>roles().some(r=>globalRoles.includes(r)||(CLASS_ROLES[name]||[]).includes(r));
const termKey=(year,term)=>year+'|'+term;
const parseScore=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(String(v).trim().replace(',','.'));return Number.isFinite(n)?n:NaN};
async function render(name){
 const page=document.getElementById('page');
 if(!page)return;
 setHead('Giáo lý',name+' · Điểm số');
 if(!requireLogin())return;
 const can=canManage(name);
 page.innerHTML=`<div class="class-banner"><div><h2>${esc(name)}</h2><div>Năm học 2026–2028 · Quản lý điểm số</div></div></div>
 <div class="tabs"><button class="tab" onclick="catechism('${esc(name)}','overview')">Tổng quan</button><button class="tab" onclick="catechism('${esc(name)}','schedule')">📅 Lịch học</button><button class="tab" onclick="catechism('${esc(name)}','attendance')">✓ Điểm danh</button><button class="tab active">★ Điểm số</button><button class="tab" onclick="catechism('${esc(name)}','homework')">🔔 Bài tập</button></div>
 <div id="gradeEntryRoot"><div class="panel empty">Đang tải dữ liệu điểm…</div></div>`;
 const root=document.getElementById('gradeEntryRoot');
 const {data:cl,error:ce}=await sb.from('classes').select('id,name').eq('name',name).maybeSingle();
 if(ce){root.innerHTML='<div class="panel">Không tải được dữ liệu lớp: '+esc(ce.message)+'</div>';return}
 if(!cl){root.innerHTML='<div class="panel">Không tìm thấy lớp này trong cơ sở dữ liệu.</div>';return}
 const {data:ms,error:me}=await sb.from('class_members').select('member_id,members(id,full_name,branch,team,status)').eq('class_id',cl.id).eq('status','active');
 if(me){root.innerHTML='<div class="panel">Không tải được danh sách học viên: '+esc(me.message)+'</div>';return}
 const members=(ms||[]).map(x=>x.members).filter(m=>m&&m.status!=='Ngưng sinh hoạt').sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name),'vi'));
 const classMemberIds=new Set(members.map(m=>m.id));
 const [settingRes]=await Promise.all([sb.from('grade_settings').select('regular_weight,midterm_weight,final_weight').eq('class_id',cl.id).eq('academic_year','2026-2027').eq('term','HK1').maybeSingle()]);
 const weights={ 'Thường xuyên':Number(settingRes.data?.regular_weight??0.30), 'Giữa kỳ':Number(settingRes.data?.midterm_weight??0.20), 'Cuối kỳ':Number(settingRes.data?.final_weight??0.30)};
 root.innerHTML=`<div class="panel grade-entry-toolbar">
 <div class="grade-entry-filters"><label>Năm học<select id="geYear" class="select"><option>2026-2027</option><option>2027-2028</option></select></label><label>Học kỳ<select id="geTerm" class="select"><option value="HK1">Học kỳ I</option><option value="HK2">Học kỳ II</option></select></label><button class="secondary" id="geReload">↻ Tải lại</button></div>
 ${can?`<div class="grade-create"><div><b>Thêm đầu điểm</b><span class="muted">Tạo cột điểm mới cho lớp</span></div><input id="geItemName" class="input" placeholder="Tên đầu điểm (VD: Kiểm tra bài cũ)"><select id="geCategory" class="select"><option>Thường xuyên</option><option>Giữa kỳ</option><option>Cuối kỳ</option></select><button class="primary" id="geAddItem">＋ Tạo đầu điểm</button></div>`:'<p class="muted">Bạn đang ở chế độ xem. Chỉ GLV/trợ giảng được phân công lớp này và BĐH có quyền nhập, sửa điểm.</p>'}
 <div class="grade-entry-note">Điểm từ 0 đến 10. Điểm trung bình được tính theo tỷ trọng cấu hình của lớp; chuyên cần và nề nếp được theo dõi riêng.</div>
 </div><div id="geTable"><div class="panel empty">Đang tải…</div></div>`;
 const load=async()=>{
  const year=document.getElementById('geYear').value,term=document.getElementById('geTerm').value,academic=termKey(year,term);
  const {data:items,error:ie}=await sb.from('grade_items').select('id,name,category,weight,max_score,academic_term').eq('class_id',cl.id).eq('academic_term',academic).order('created_at');
  if(ie){document.getElementById('geTable').innerHTML='<div class="panel">Lỗi tải đầu điểm: '+esc(ie.message)+'</div>';return}
  const ids=(items||[]).map(i=>i.id);let grades=[];
  if(ids.length){const {data,error}=await sb.from('student_grades').select('grade_item_id,member_id,score,note').in('grade_item_id',ids);if(error){document.getElementById('geTable').innerHTML='<div class="panel">Lỗi tải điểm: '+esc(error.message)+'</div>';return}grades=data||[]}
  const gmap=new Map(grades.map(g=>[g.grade_item_id+'_'+g.member_id,g]));
  const cfg=year==='2026-2027'&&term==='HK1'?weights:{'Thường xuyên':.30,'Giữa kỳ':.20,'Cuối kỳ':.30};
  const av=(m,cat)=>{const vals=(items||[]).filter(i=>i.category===cat).map(i=>Number(gmap.get(i.id+'_'+m.id)?.score)).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};
  const total=m=>{let sum=0,w=0;Object.keys(cfg).forEach(cat=>{const v=av(m,cat),weight=Number(cfg[cat])||0;if(v!=null&&weight>0){sum+=v*weight;w+=weight}});return w?sum/w:null};
  document.getElementById('geTable').innerHTML=`<div class="panel"><div class="grade-table-head"><div><b>${members.length} đoàn sinh</b><span class="muted"> · ${term==='HK1'?'Học kỳ I':'Học kỳ II'} năm học ${esc(year)}</span></div>${can&&items.length?'<button class="primary" id="geSaveAll">💾 Lưu toàn bộ điểm</button>':''}</div>
  <div class="table-wrap"><table class="table grade-entry-table"><thead><tr><th>STT</th><th>Họ và tên</th>${(items||[]).map(i=>`<th>${esc(i.name)}<small>${esc(i.category)}</small></th>`).join('')}<th>TB học lực</th></tr></thead><tbody>${members.map((m,idx)=>`<tr><td>${idx+1}</td><td><b>${esc(m.full_name)}</b><small>${esc(m.team||m.branch||'')}</small></td>${(items||[]).map(i=>{const g=gmap.get(i.id+'_'+m.id);return `<td>${can?`<input class="input ge-score" type="number" min="0" max="10" step="0.1" inputmode="decimal" data-item="${i.id}" data-member="${m.id}" value="${g?.score??''}" placeholder="—" aria-label="Điểm ${esc(i.name)} của ${esc(m.full_name)}">`:(g?.score??'—')}</td>`}).join('')}<td><strong>${total(m)==null?'—':total(m).toFixed(2)}</strong></td></tr>`).join('')||`<tr><td colspan="${(items||[]).length+3}" class="empty">Lớp chưa có học viên được phân công.</td></tr>`}</tbody></table></div>
  ${items.length?'':'<div class="empty">Chưa có đầu điểm trong học kỳ này. Hãy tạo đầu điểm để bắt đầu nhập điểm.</div>'}
  </div>`;
  if(can&&items.length)document.getElementById('geSaveAll')?.addEventListener('click',async()=>{
   const btn=document.getElementById('geSaveAll');btn.disabled=true;btn.textContent='Đang lưu…';
   try{
    for(const item of items){
     const fields=[...document.querySelectorAll('.ge-score[data-item="'+item.id+'"]')];
     const rows=fields.map(inp=>({grade_item_id:item.id,member_id:inp.dataset.member,score:parseScore(inp.value),updated_at:new Date().toISOString()}));
     const invalid=rows.find(r=>Number.isNaN(r.score)||(r.score!=null&&(r.score<0||r.score>10)));
     if(invalid)throw new Error('Điểm phải nằm trong khoảng 0–10.');
     if(rows.length){const {error}=await sb.from('student_grades').upsert(rows,{onConflict:'grade_item_id,member_id'});if(error)throw error}
    }
    alert('Đã lưu điểm thành công.');await load();
   }catch(e){alert('Không lưu được điểm: '+(e.message||e))}
   finally{const b=document.getElementById('geSaveAll');if(b){b.disabled=false;b.textContent='💾 Lưu toàn bộ điểm'}}
  });
 };
 document.getElementById('geReload').addEventListener('click',load);
 document.getElementById('geYear').addEventListener('change',load);
 document.getElementById('geTerm').addEventListener('change',load);
 document.getElementById('geAddItem')?.addEventListener('click',async()=>{
  const btn=document.getElementById('geAddItem'),itemName=document.getElementById('geItemName').value.trim(),category=document.getElementById('geCategory').value,year=document.getElementById('geYear').value,term=document.getElementById('geTerm').value;
  if(!itemName)return alert('Hãy nhập tên đầu điểm.');
  btn.disabled=true;
  const {error}=await sb.from('grade_items').insert({class_id:cl.id,name:itemName,category,weight:1,max_score:10,academic_term:termKey(year,term)});
  btn.disabled=false;
  if(error)return alert('Không tạo được đầu điểm: '+error.message);
  document.getElementById('geItemName').value='';await load();
 });
 await load();
}
const original=window.catechism;
if(original&&!original.__gradeEntryWrapped){
 const wrapped=async function(name,mode='overview'){
  if(mode==='grades')return render(name);
  return original(name,mode);
 };
 wrapped.__gradeEntryWrapped=true;window.catechism=wrapped;
}
const style=document.createElement('style');
style.textContent=`
.grade-entry-filters{display:flex;align-items:end;gap:12px;flex-wrap:wrap}.grade-entry-filters label,.grade-create{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700}.grade-create{display:grid;grid-template-columns:minmax(160px,1fr) minmax(150px,190px) auto;align-items:end;gap:10px;border-top:1px solid #e7edf5;padding-top:16px;margin-top:16px}.grade-create>div{grid-column:1/-1;display:flex;gap:10px;align-items:baseline}.grade-entry-note{font-size:12px;color:#667085;margin-top:14px}.grade-table-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.grade-entry-table{min-width:760px}.grade-entry-table th small,.grade-entry-table td small{display:block;font-size:11px;color:#667085;font-weight:400;margin-top:4px}.grade-entry-table .ge-score{width:76px;min-width:68px;padding:8px;text-align:center}.grade-entry-toolbar{display:grid;gap:14px}
@media(max-width:640px){.grade-create{grid-template-columns:1fr}.grade-create>div{grid-column:auto}.grade-entry-filters label{flex:1;min-width:120px}.grade-table-head{align-items:flex-start;flex-direction:column}}
`;
document.head.appendChild(style);
})();