/* OpeningTrainer service worker — offline support.
   App shell is precached; the chess engine, Stockfish and piece images
   (loaded from CDNs on first use) are cached at runtime, so after one
   online visit the whole app — including Play vs Stockfish — works offline. */
const CACHE = 'opening-trainer-v74';
// A backup shared to the installed app from another app's share sheet waits
// here until the page picks it up. It is not a version cache, so activating a
// new version must not clear it.
const INBOX = 'opening-trainer-inbox';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== INBOX).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Web Share Target: the manifest's share_target posts the shared file here.
   Keep it in the inbox and send the page to ?receive=1, where it shows what is
   in the file next to what is on the device before anything is replaced. */
async function receiveShare(req) {
  try {
    const form = await req.formData();
    const file = form.get('backup');
    let text = '';
    if (file && typeof file.text === 'function') text = await file.text();
    else if (form.get('text')) text = String(form.get('text'));
    if (text) {
      const inbox = await caches.open(INBOX);
      await inbox.put('./__inbox__', new Response(text, { headers: { 'content-type': 'application/json' } }));
    }
  } catch (err) {}
  return Response.redirect(new URL('./index.html?receive=1', self.registration.scope).href, 303);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // a page opened with a query (?receive=1) is still the app shell
    const cached = await cache.match(req, { ignoreVary: true, ignoreSearch: req.mode === 'navigate' });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // cache successful same-origin/CORS responses (and opaque CDN responses, best-effort)
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (err) {
      // offline and nothing cached: fall back to the app shell for navigations
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
