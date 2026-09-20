// Guided endgame technique — validate the lesson lines and the walkthrough
// state machine.  Run after touching EG_LESSONS or the eglesson code path:
//   node validate-endgame.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';

const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
globalThis.Chess = Chess; globalThis.confirm = () => true; globalThis.alert = () => {}; globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.AudioContext = globalThis.webkitAudioContext = function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: {} }), createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }), destination: {}, currentTime: 0 }; };
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; globalThis.Worker = class { postMessage() {} terminate() {} addEventListener() {} };
if (!dom.window.matchMedia) dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
dom.window.__PUZZLES = [];

let pass = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); pass++; console.log('  ✓ ' + m); };

const X = new Function(script + '\nreturn {app,ENDGAMES,EG_LESSONS,egMoveInfo,egLessonStart,egStep,egHint,egTry,egAdvanceOpp,turnOf};')();
// Stop the auto-reply timer from firing async; the test drives the opponent by hand.
globalThis.setTimeout = () => 0;

const { app, ENDGAMES, EG_LESSONS, egMoveInfo, egLessonStart, egStep, egHint, egTry, egAdvanceOpp, turnOf } = X;

ok(Object.keys(EG_LESSONS).length >= 6, 'guided lessons defined (' + Object.keys(EG_LESSONS).length + ')');
ok(ENDGAMES.every(e => EG_LESSONS[e.id]), 'every endgame in the trainer has a guided lesson');

// 1) Every lesson line is legal from the start position, and its you/opp flags
//    match whose turn it is (student always plays the side that moves first).
for (const e of ENDGAMES) {
  const L = EG_LESSONS[e.id]; const start = L.start || e.fen;
  const c = new Chess(start); const youSide = c.turn();
  L.line.forEach((step, k) => {
    const turn = c.turn();
    let mv; try { mv = c.move(step.san); } catch (_) { mv = null; }
    ok(!!mv, e.id + ': move ' + (k + 1) + ' (' + step.san + ') is legal');
    ok((turn === youSide) === !!step.you, e.id + ': move ' + (k + 1) + ' you-flag matches side to move');
    ok(!!(step.note && step.note.length), e.id + ': move ' + (k + 1) + ' has coaching text');
  });
  ok(L.line[L.line.length - 1].you, e.id + ': lesson ends on a student move');
  ok(L.line.filter(s => s.you).length >= 3, e.id + ': at least three student moves to practise');
}

// 2) Win lessons finish winning material / promotion or mate; the draw lesson
//    keeps the material balance (defender never loses the rook).
{
  const startOf = id => EG_LESSONS[id].start || ENDGAMES.find(x => x.id === id).fen;
  const kpk = EG_LESSONS.kpk, c = new Chess(startOf('kpk')); kpk.line.forEach(st => c.move(st.san));
  ok(/Q/.test(c.fen().split(' ')[0]), 'kpk: the pawn actually promotes to a queen');
  const countR = f => (f.split(' ')[0].match(/r/gi) || []).length;
  const c2 = new Chess(startOf('philidor')); const before = countR(c2.fen()); EG_LESSONS.philidor.line.forEach(st => c2.move(st.san));
  ok(countR(c2.fen()) === before, 'philidor: defender never loses the rook during the walkthrough');
}

// 3) The walkthrough state machine: hint points at the taught move, wrong moves
//    are rejected without advancing, the taught move advances, and the scripted
//    opponent reply plays automatically until the lesson completes.
for (const e of ENDGAMES) {
  egLessonStart(e.id);
  ok(app.view === 'eglesson' && app.egLesson && app.egLesson.id === e.id, e.id + ': starting the lesson opens the guided view');
  const L = app.egLesson;
  let guard = 0;
  while (!L.done && guard++ < 40) {
    const step = egStep(L);
    if (!step) break;
    if (step.you) {
      const want = egMoveInfo(L.fen, step.san);
      const hint = egHint(L);
      ok(hint && hint.from === want.from && hint.to === want.to, e.id + ': hint points at the taught move ' + step.san);
      // a wrong (but legal) move must be rejected and must not advance
      const legal = new Chess(L.fen).moves({ verbose: true }).find(m => m.from !== want.from || m.to !== want.to);
      if (legal) {
        const i0 = L.i; egTry(legal.from, legal.to);
        ok(L.i === i0 && L.wrong, e.id + ': a wrong move is rejected and does not advance');
      }
      const i1 = L.i; egTry(want.from, want.to);
      ok(L.i === i1 + 1 && !L.wrong, e.id + ': the taught move ' + step.san + ' is accepted and advances');
      egAdvanceOpp(L); // drive the scripted reply (auto-timer is stubbed out)
    } else {
      egAdvanceOpp(L);
    }
  }
  ok(L.done, e.id + ': the walkthrough reaches completion');
}

console.log('\n✅ endgame: ' + pass + ' checks passed');
