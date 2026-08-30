(()=>{
  const originalHasRole=window.hasRole;
  window.hasRole=function(role){
    const roles=window.TNTT?.roles||[];
    return roles.includes('admin') || (originalHasRole?originalHasRole(role):roles.includes(role));
  };
  window.isAdmin=()=>window.TNTT?.roles?.includes('admin');

  if (!document.querySelector('script[data-pwa-loader]')) {
    const pwaScript=document.createElement('script');
    pwaScript.src='/pwa.js';
    pwaScript.defer=true;
    pwaScript.dataset.pwaLoader='true';
    document.head.appendChild(pwaScript);
  }
})();
