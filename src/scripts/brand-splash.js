// Inline progressive enhancement. Content remains usable without this script.
(() => {
  const splash = document.querySelector('[data-brand-splash]');
  if (!splash) return;
  let timer;
  let events;
  const finish = () => {
    splash.hidden = true;
    clearTimeout(timer);
    events?.abort();
  };
  const start = () => { try {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const navigation = performance.getEntriesByType('navigation')[0];
    const reloading = navigation?.type === 'reload';
    const home = ['/', '/index.html', '/en/', '/en/index.html'].includes(location.pathname);
    const internal = document.referrer && new URL(document.referrer).origin === location.origin;
    if (!home || (location.hash && !reloading) || (internal && !reloading) || reduced.matches
      || document.documentElement.dataset.languageRedirect === 'true'
      || (navigation && !['navigate', 'reload'].includes(navigation.type))) return;

    // If storage is unavailable, omit the intro rather than repeating it.
    const key = splash.dataset.sessionKey;
    const seen = sessionStorage.getItem(key);
    // Normal and cache-bypassing reloads share the same navigation type.
    if (seen && !reloading) return;
    sessionStorage.setItem(key, 'seen');
    events = new AbortController();
    const options = { signal: events.signal, capture: true, passive: true };
    for (const name of ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin']) {
      document.addEventListener(name, finish, options);
    }
    window.addEventListener('pagehide', finish, options);
    window.addEventListener('pageshow', event => { if (event.persisted) finish(); }, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
    reduced.addEventListener('change', () => { if (reduced.matches) finish(); }, options);
    for (const image of splash.querySelectorAll('img')) {
      if (image.complete && image.naturalWidth === 0) { finish(); return; }
      image.addEventListener('error', finish, options);
    }
    // Timer and CSS expiry are independent. Never lock scrolling or move focus.
    timer = setTimeout(finish, Number(splash.dataset.duration) + 50);
    splash.hidden = false;
  } catch {
    finish();
  }};
  // A newly opened background tab should play on its first foreground visit.
  if (document.visibilityState === 'hidden') {
    const cancel = () => {
      document.removeEventListener('visibilitychange', reveal);
      window.removeEventListener('pagehide', cancel);
    };
    const reveal = () => {
      if (document.visibilityState !== 'hidden') { cancel(); start(); }
    };
    document.addEventListener('visibilitychange', reveal);
    window.addEventListener('pagehide', cancel, { once: true });
  } else start();
})();
