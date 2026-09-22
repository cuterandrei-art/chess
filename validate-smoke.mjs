// Regression smoke test: parse, boot in jsdom, exercise career + play + puzzles.
// Run after every change: node validate-smoke.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';

const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length;
const e = html.indexOf('</script>', s);
let script = html.slice(s, e);
if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');

let pass = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); pass++; console.log('  ✓ ' + m); };

new Function(script); // 1) syntax parse
ok(true, 'module parses');

// 1b) catch module-scope duplicate top-level declarations (a SyntaxError in a
// <script type="module"> but NOT inside new Function, so the parse above misses it).
{
  const names = {}; const dups = [];
  for (const m of script.matchAll(/^(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/gm)) {
    const n = m[1]; names[n] = (names[n] || 0) + 1; if (names[n] === 2) dups.push(n);
  }
  ok(dups.length === 0, 'no duplicate top-level declarations' + (dups.length ? ' — ' + dups.join(', ') : ''));


// Every click handler must re-render: the dispatcher has no fallthrough, so a
// handler that changes state without calling render() leaves a dead control on
// screen — a whole tab bar failed this way once.
const RENDERS=/render\(\)|go\(|startPlay|runImport|doDay|dailyAnswer|startSimul|startParkGame|profileOpen|startSpectate|uiConfirm|arcChoose|clStart|egLessonStart|startChallenge|joinTournament|newCareer|guessStart|reviewStart|openStudy|startRivalFinale|careerRest|careerSabbatical|playSeekTo|startTraining|pzNext|Voice\.say|return/;
const dead=[];
for (const m of script.matchAll(/else if\(act==='([a-zA-Z0-9_]+)'\)(\{[^\n]*\}|[^\n;]*;)/g)) {
  if (!/\bapp\.|\bstore\./.test(m[0])) continue;
  if (RENDERS.test(m[0])) continue;
  dead.push(m[1]);
}
ok(dead.length === 0, 'every state-changing click handler re-renders' + (dead.length ? ' — dead: ' + dead.join(', ') : ''));}

const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
globalThis.Chess = Chess; globalThis.confirm = () => true; globalThis.alert = () => {};
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
globalThis.AudioContext = globalThis.webkitAudioContext = function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: {} }), createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }), destination: {}, currentTime: 0 }; };
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.Worker = class { constructor(){} postMessage(){} terminate(){} addEventListener(){} };
if (!dom.window.matchMedia) dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });

const pm = html.match(/window\.__PUZZLES=(\[[\s\S]*?\]);/);
const PUZZLES = JSON.parse(pm[1]);
dom.window.__PUZZLES = PUZZLES;
ok(PUZZLES.length >= 20000, 'puzzle set present (' + PUZZLES.length + ')');

const X = new Function(script + '\nreturn {store,DEF,restoreBackup};')(); // 2) boots without throwing
ok(true, 'app boots');

// A fresh visitor now lands on the first-run questions, so dismiss them before
// driving the rest — and check that the skip really does get you out.
{
  const skip = document.querySelector('[data-act="onbskip"]');
  ok(!!skip, 'a first-time visitor is met with the setup questions');
  skip.click();
  ok(!document.querySelector('[data-act="onbskip"]'), 'and skipping them gets you into the app');
}

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const txt = () => document.getElementById('app').textContent;
const clickAct = (a, val) => { const b = $$('[data-act="'+a+'"]').find(b => val==null || b.dataset.val===val); if(!b) throw new Error('no button '+a+(val?('='+val):'')); b.click(); };
const nav = (v) => { let b = $$('[data-act="nav"]').find(b => b.dataset.val === v); if (!b) { const mt = $('[data-act="menutoggle"]'); if (mt) mt.click(); b = $$('[data-act="nav"]').find(b => b.dataset.val === v); } b.click(); };

// 3) career: boot + set up a profile
nav('career');
ok(/Career/i.test(txt()), 'career view renders');
clickAct('careersetup');
ok(/♟️ Play|🧑 You|📈 Progress|🧬 Life/.test(txt()), 'career tabs render after setup');

// 4) every career tab renders without throwing
for (const t of ['play','you','progress','life','media','legacy']) { clickAct('careertab', t); ok(true, 'career tab "'+t+'" renders'); }
clickAct('careertab', 'play');

// 5) puzzles: legality + solve a sample through the real code path
let illegal = 0;
for (let i = 0; i < PUZZLES.length; i += 2500) {
  const [fen, mv] = PUZZLES[i]; const c = new Chess(fen);
  for (const u of mv.split(' ')) { let r; try { r = c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u.length>4?u[4]:undefined}); } catch(e){ r=null; } if(!r){ illegal++; break; } }
}
ok(illegal === 0, 'sampled puzzles are legal');


/* ---- a backup has to actually be a backup ----
   Export writes the whole store. Import used to read back four fields of it and
   silently drop the rest, which looks fine on the machine you exported from
   (those fields still hold their old values) and loses your whole career on a
   new one. This app has no account, so the file is the only way across. */
{
  const { store, DEF, restoreBackup } = X;
  store.career.setup = true; store.career.name = 'Backup Test'; store.career.rating = 2412;
  store.career.titles = ['CM','FM']; store.career.money = 31000; store.career.weeks = 64;
  store.puzzle.rating = 1975; store.brilliancies = [{ id: 1 }]; store.studies = [{ name: 's' }];
  store.myGames = [{ id: 'g' }]; store.repertoire = ['italian']; store.onboarded = true;
  const file = JSON.stringify(Object.assign({ _app: 'chess-career' }, store));

  // wipe it all, exactly as a new device would have it
  store.career = JSON.parse(JSON.stringify(DEF.career));
  store.puzzle = JSON.parse(JSON.stringify(DEF.puzzle));
  store.brilliancies = []; store.studies = []; store.myGames = []; store.repertoire = [];
  store.onboarded = false;

  const r = restoreBackup(file);
  ok(r.ok, 'a backup file is accepted');
  ok(store.career.rating === 2412 && store.career.name === 'Backup Test', 'the career comes back — the thing you would actually mind losing');
  ok((store.career.titles || []).length === 2 && store.career.money === 31000 && store.career.weeks === 64, 'with its titles, money and weeks');
  ok(store.puzzle.rating === 1975, 'the puzzle rating comes back');
  ok(store.brilliancies.length === 1 && store.studies.length === 1 && store.myGames.length === 1, 'brilliancies, studies and imported games come back');
  ok(store.repertoire.length === 1 && store.onboarded === true, 'and so do the repertoire and the setup flag');
  ok(/Backup Test/.test(r.summary), 'and it reports what it restored rather than just claiming success');

  const before = store.career.rating;
  ok(!restoreBackup('not json').ok && !restoreBackup('{}').ok && !restoreBackup('[1,2]').ok && !restoreBackup('{"other":1}').ok,
     'a file that is not one of ours is refused');
  ok(store.career.rating === before, 'and a refused file leaves what you already had alone');
}

console.log('\n✅ smoke: ' + pass + ' checks passed');
