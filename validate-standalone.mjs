// Proves ChessCareer-standalone.html really is standalone: static checks on the
// built file, then a real Chromium run from file:// with every network request
// aborted. If anything were still load-bearing, the board would come up empty.
import { readFileSync, existsSync } from 'fs';

const OUT = process.argv[2] || 'ChessCareer-standalone.html';
let pass = 0;
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); pass++; console.log('  ✓ ' + m); };

ok(existsSync(OUT), 'the standalone file was built');
const html = readFileSync(OUT, 'utf8');

/* ---- static: nothing the page needs comes over the wire ---- */
const resources = [
  ...[...html.matchAll(/<(?:script|img|iframe|source|audio|video)\b[^>]*\bsrc="(https?:\/\/[^"]+)"/gi)].map(m => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref="(https?:\/\/[^"]+)"/gi)].map(m => m[1]),
];
ok(resources.length === 0, 'no stylesheet, script, font or image is loaded from the network');
ok(!/fonts\.googleapis|fonts\.gstatic/.test(html), 'the Google Fonts links are gone');

const pd = html.match(/const PIECE_DATA=(\{.*?\});/s);
ok(pd, 'the piece set is inlined as PIECE_DATA');
const pieces = JSON.parse(pd[1]);
ok(Object.keys(pieces).length === 12, 'all twelve pieces are bundled (' + Object.keys(pieces).length + ')');
ok(Object.values(pieces).every(v => v.startsWith('data:image/svg+xml;base64,')), 'each one is an inline data URI');
ok(Object.values(pieces).every(v => Buffer.from(v.split(',')[1], 'base64').toString().includes('<svg')), 'each decodes back to real SVG');
ok(/pieces:'bundled'/.test(html), 'the bundled set is the default, so it works before you touch settings');
ok(/bundled:\{label:'Classic \(bundled/.test(html), 'it is also offered by name in Settings');
ok(/chess\.js/i.test(html) || /class Chess/.test(html), 'the rules engine is bundled (it always was)');
ok(/window\.__PUZZLES=/.test(html), 'the puzzle set is bundled too');

/* ---- live: boot from file:// with the network cut ----
   Needs a real browser. Where one isn't installed (CI runners), the static
   guarantees above still hold and this part reports itself as skipped rather
   than failing the suite. */
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let chromium = null;
if (existsSync(CHROME)) { try { ({ chromium } = await import('playwright-core')); } catch {} }
if (!chromium) {
  console.log('  — skipping the live offline boot: no browser available here');
  console.log('\n✅ standalone: ' + pass + ' checks passed (static only)');
  process.exit(0);
}
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, offline: true });
const attempted = [];
await ctx.route('**/*', route => {
  const url = route.request().url();
  if (url.startsWith('file://') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
  attempted.push(url);
  return route.abort();
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });

await page.goto('file://' + process.cwd() + '/' + OUT, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);

ok(errs.length === 0, 'it boots with no script errors, entirely offline' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
ok(attempted.length === 0, 'it makes no network requests at all' + (attempted.length ? ' — tried ' + attempted.slice(0, 3).join(', ') : ''));

const hasApp = await page.evaluate(() => !!document.querySelector('#app') && document.querySelector('#app').innerHTML.length > 500);
ok(hasApp, 'the app renders its interface');

// drive to an actual board and confirm the pieces are real, decoded images
const click = async (sel) => { await page.evaluate(s => {
  const b = [...document.querySelectorAll(s)].find(x => x.offsetParent !== null); if (b) b.click();
}, sel); await page.waitForTimeout(700); };
await click('[data-act="nav"][data-val="puzzles"]');
await click('[data-act="pznext"]');

const board = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img.pc')];
  return {
    squares: document.querySelectorAll('.board .square').length,
    imgs: imgs.length,
    allData: imgs.every(i => i.src.startsWith('data:')),
    decoded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
    glyphFallbacks: document.querySelectorAll('span.piece').length,
  };
});
ok(board.squares === 64, 'a full 64-square board is drawn (' + board.squares + ')');
ok(board.imgs > 0, 'the pieces are rendered as images (' + board.imgs + ')');
ok(board.allData, 'every piece image is an inline data URI, not a URL');
ok(board.decoded === board.imgs, 'every piece image actually decoded — the board is not blank (' + board.decoded + '/' + board.imgs + ')');
ok(board.glyphFallbacks === 0, 'nothing fell back to a Unicode glyph, so the real set is in use');

await browser.close();
console.log('\n✅ standalone: ' + pass + ' checks passed');
