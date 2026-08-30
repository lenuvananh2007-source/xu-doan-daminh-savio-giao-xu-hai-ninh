(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('Không thể đăng ký service worker:', error);
      });
    });
  }

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    document.documentElement.classList.add('pwa-installable');
  });

  window.installXuDoanApp = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.documentElement.classList.remove('pwa-installable');
    return choice.outcome === 'accepted';
  };

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.documentElement.classList.remove('pwa-installable');
  });
})();
