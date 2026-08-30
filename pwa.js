(() => {
  const ensureHeadTag = (selector, tagName, attrs) => {
    if (document.head.querySelector(selector)) return;
    const el = document.createElement(tagName);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    document.head.appendChild(el);
  };

  ensureHeadTag('link[rel="manifest"]', 'link', { rel: 'manifest', href: '/manifest.webmanifest' });
  ensureHeadTag('link[rel="icon"]', 'link', { rel: 'icon', href: '/app-icon.svg', type: 'image/svg+xml' });
  ensureHeadTag('meta[name="theme-color"]', 'meta', { name: 'theme-color', content: '#8a641f' });
  ensureHeadTag('meta[name="mobile-web-app-capable"]', 'meta', { name: 'mobile-web-app-capable', content: 'yes' });
  ensureHeadTag('meta[name="apple-mobile-web-app-capable"]', 'meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  ensureHeadTag('meta[name="apple-mobile-web-app-status-bar-style"]', 'meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
  ensureHeadTag('meta[name="apple-mobile-web-app-title"]', 'meta', { name: 'apple-mobile-web-app-title', content: 'Đaminh Savio' });

  if ('serviceWorker' in navigator) {
    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('Không thể đăng ký service worker:', error);
      });
    };
    if (document.readyState === 'complete') registerServiceWorker();
    else window.addEventListener('load', registerServiceWorker, { once: true });
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
