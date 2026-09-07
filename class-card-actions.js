(()=>{
  function getClassName(){
    return document.querySelector('.class-banner h2')?.textContent?.trim()||'';
  }

  function actionFor(label){
    if(label==='Buổi điểm danh')return 'attendance';
    if(label==='Bài tập')return 'homework';
    if(label==='Năm học')return 'schedule';
    if(label==='Học viên')return 'students';
    return '';
  }

  function runAction(card){
    const action=card.dataset.classAction;
    const name=getClassName();
    if(!action||!name)return;
    if(action==='students'){
      const panel=[...document.querySelectorAll('#classBody .panel')].find(x=>x.querySelector('h2')?.textContent?.trim()==='Danh sách lớp');
      if(panel){
        panel.scrollIntoView({behavior:'smooth',block:'start'});
        panel.classList.remove('class-list-focus');
        requestAnimationFrame(()=>panel.classList.add('class-list-focus'));
        setTimeout(()=>panel.classList.remove('class-list-focus'),1300);
      }
      return;
    }
    if(typeof window.catechism==='function')window.catechism(name,action);
  }

  function decorate(){
    document.querySelectorAll('#classBody .cards > .card').forEach(card=>{
      const label=card.querySelector('.metric-label')?.textContent?.trim()||'';
      const action=actionFor(label);
      if(!action)return;
      card.dataset.classAction=action;
      card.classList.add('class-action-card');
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`Mở ${label}`);
      if(!card.querySelector('.class-card-arrow')){
        const arrow=document.createElement('span');
        arrow.className='class-card-arrow';
        arrow.textContent='→';
        card.appendChild(arrow);
      }
    });
  }

  document.addEventListener('click',e=>{
    const card=e.target.closest('.class-action-card');
    if(card)runAction(card);
  });
  document.addEventListener('keydown',e=>{
    const card=e.target.closest?.('.class-action-card');
    if(!card||!(e.key==='Enter'||e.key===' '))return;
    e.preventDefault();runAction(card);
  });

  const observer=new MutationObserver(decorate);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate);else decorate();
})();