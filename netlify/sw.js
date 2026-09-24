/* OpeningTrainer service worker — offline support.
   App shell is precached; the chess engine, Stockfish and piece images
   (loaded from CDNs on first use) are cached at runtime, so after one
   online visit the whole app — including Play vs Stockfish — works offline. */
const CACHE = 'opening-trainer-v82';
// A backup shared to the installed app from another app's share sheet waits
// here until the page picks it up. It is not a version cache, so activating a
// new version must not clear it.
const INBOX = 'opening-trainer-inbox';
// The reminder snapshot the page keeps current, and the day the last reminder
// went out. Like the inbox, it outlives version updates.
const REMIND = 'opening-trainer-remind';
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== INBOX && k !== REMIND).map((k) => caches.delete(k))))
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

/* ---------------------------------------------------------------------------
   Reminders with the app closed. Where the browser offers Periodic Background
   Sync (an installed app in Chrome or Edge), it wakes this worker now and then;
   the page has left a snapshot of when each review and missed puzzle falls due,
   so the worker counts what is due at that moment and, once a day after your
   hour, says so. remindDecide is the page's own function, copied — it has to
   run here without the page — and validate-remind.mjs checks the two agree.
   --------------------------------------------------------------------------- */
function remindCountDue(list, now) { let n = 0; for (let i = 0; i < list.length && list[i] <= now; i++) n++; return n; }
function remindText(rd, pd, streak) {
  const parts = [];
  if (rd) parts.push(rd + ' opening review' + (rd === 1 ? '' : 's'));
  if (pd) parts.push(pd + ' puzzle' + (pd === 1 ? '' : 's') + ' you got wrong');
  if (parts.length) return parts.join(' and ') + (rd + pd === 1 ? ' is' : ' are') + ' due.' + (streak ? ' Keep your ' + streak + '-day streak going.' : '');
  if (streak) return 'Your ' + streak + '-day streak ends at midnight \u2014 one puzzle keeps it.';
  return null;
}
function remindDecide(s, now, sent) {
  if (!s || !s.on) return null;
  const d = new Date(now); if (d.getHours() < s.hour) return null;
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (sent === today) return null;
  const rd = s.reviews ? remindCountDue(s.reviewTimes || [], now) : 0, pd = s.puzzles ? remindCountDue(s.puzzleTimes || [], now) : 0;
  const streak = (s.streak && s.streakDays >= 2 && s.lastActive && s.lastActive !== today) ? s.streakDays : 0;
  const text = remindText(rd, pd, streak);
  return text ? { text, reviews: rd, puzzles: pd, day: today } : null;
}
async function remindCheck(now) {
  const box = await caches.open(REMIND);
  const snapRes = await box.match('./__remind__');
  if (!snapRes) return null;
  const snap = await snapRes.json();
  const sentRes = await box.match('./__remind_sent__');
  const sent = sentRes ? await sentRes.text() : null;
  // with the app on screen, the app says it itself
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (wins.some((w) => w.visibilityState === 'visible')) return null;
  const due = remindDecide(snap, now, sent);
  if (!due) return null;
  await box.put('./__remind_sent__', new Response(due.day));
  try { if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(due.reviews + due.puzzles || 0); } catch (err) {}
  await self.registration.showNotification('Chess Career', {
    body: due.text, tag: 'chess-career-due', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './index.html?due=1' }
  });
  return due;
}
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'due-check') e.waitUntil(remindCheck(Date.now()));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if ('focus' in w) { await w.focus(); w.postMessage({ type: 'open-due' }); return; }
    }
    await self.clients.openWindow(new URL('./index.html?due=1', self.registration.scope).href);
  })());
});
