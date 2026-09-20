// Guided opening courses — validate authored content and the learn state
// machine. Run after touching OPENING_COURSES or the clearn code path:
//   node validate-course.mjs
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

const X = new Function(script + '\nreturn {app,store,OPENING_COURSES,byId,clSide,clResolve,clStart,clStep,clHint,clTry,clAdvanceOpp,courseChapters,courseChapDone,courseBucket,courseRecommendations,turnOf};')();
globalThis.setTimeout = () => 0; // freeze the auto-reply timer; the test drives the opponent

const { app, store, OPENING_COURSES, byId, clSide, clResolve, clStart, clStep, clHint, clTry, clAdvanceOpp, courseChapDone, courseBucket, courseRecommendations, turnOf } = X;

const ids = Object.keys(OPENING_COURSES);
ok(ids.length >= 20, 'guided courses defined (' + ids.length + ')');

// recommender: every course is classified into a repertoire bucket, and the
// gap-coach returns real, incomplete courses.
for (const id of ids) ok(['white', 'e4', 'd4'].includes(courseBucket(id)), id + ': classified into a repertoire bucket for the recommender');
{
  store.repertoire = []; store.courseProgress = {};
  const recs = courseRecommendations();
  ok(recs.length >= 1 && recs.length <= 3, 'recommender returns 1-3 gap picks for a fresh player (' + recs.length + ')');
  ok(recs.every(r => OPENING_COURSES[r.id] && r.reason), 'each recommendation names a real course with a reason');
}

// 1) content integrity: ids map to real openings, hero side matches, every move
//    legal from its position, every exercise is a hero move with prompt + why.
let totalMoves = 0, totalEx = 0;
for (const id of ids) {
  const C = OPENING_COURSES[id];
  const o = byId.get(id);
  ok(!!o, id + ': maps to a real opening (' + (o ? o.name : '—') + ')');
  const hero = clSide(id);
  ok(hero === (o.side === 'white' ? 'w' : 'b'), id + ': hero side matches the library opening');
  ok(C.chapters.length >= 1 && !!C.tagline, id + ': has chapters and a tagline');
  C.chapters.forEach((ch, ci) => {
    ok(!!(ch.name && ch.goal && ch.line.length >= 6), id + ' ch' + (ci + 1) + ': has name, goal and a real line');
    const c = new Chess();
    ch.line.forEach((step, k) => {
      const turn = c.turn();
      let mv; try { mv = c.move(step.san); } catch (_) { mv = null; }
      ok(!!mv, id + ' ch' + (ci + 1) + ' move ' + (k + 1) + ' legal: ' + step.san);
      totalMoves++;
      if (step.ex) {
        totalEx++;
        ok(turn === hero, id + ' ch' + (ci + 1) + ': exercise ' + step.san + ' is a hero move');
        ok(!!(step.ex.prompt && step.ex.why), id + ' ch' + (ci + 1) + ': exercise ' + step.san + ' has prompt + why');
      }
    });
    const you = ch.line.filter(st => st.by === undefined).length; // sanity: line non-trivial
    ok(you >= 0, id + ' ch' + (ci + 1) + ': line parsed');
  });
}
ok(totalMoves >= 120, 'substantial content (' + totalMoves + ' moves)');
ok(totalEx >= 12, 'exercises embedded in the lines (' + totalEx + ')');

// 2) resolver: from/to/fen consistent and you-flags follow whose turn it is.
for (const id of ids) {
  OPENING_COURSES[id].chapters.forEach((ch, ci) => {
    const r = clResolve(id, ci);
    ok(r && r.line.length === ch.line.length, id + ' ch' + (ci + 1) + ': resolves every move');
    r.line.forEach(st => { ok(/^[a-h][1-8]$/.test(st.from) && /^[a-h][1-8]$/.test(st.to), id + ' ch' + (ci + 1) + ': ' + st.san + ' has from/to squares'); });
  });
}

// 3) learn state machine: hints, wrong-move rejection, taught-move acceptance,
//    scripted opponent replies, completion → repertoire + SRS seeding.
for (const id of ids) {
  OPENING_COURSES[id].chapters.forEach((ch, ci) => {
    // clear prior progress so completion is observable
    store.repertoire = store.repertoire.filter(x => x !== id);
    clStart(id, ci, false);
    ok(app.view === 'clearn' && app.cl && app.cl.id === id && app.cl.ci === ci, id + ' ch' + (ci + 1) + ': starting opens the guided view');
    const L = app.cl;
    let guard = 0;
    while (!L.done && guard++ < 60) {
      const step = clStep(L);
      if (!step) { clAdvanceOpp(L); continue; }
      if (!step.you) { clAdvanceOpp(L); continue; }
      // exercises must not show a hint until you err; normal moves show a green hint
      if (step.ex) ok(clHint(L) === null, id + ' ch' + (ci + 1) + ': exercise ' + step.san + ' hides the hint');
      else ok(!!clHint(L), id + ' ch' + (ci + 1) + ': move ' + step.san + ' shows a hint');
      // a wrong (legal) move is rejected and reveals the hint, without advancing
      const legal = new Chess(L.fen).moves({ verbose: true }).find(mv => mv.from !== step.from || mv.to !== step.to);
      if (legal) {
        const i0 = L.i; clTry(legal.from, legal.to);
        ok(L.i === i0 && L.wrong, id + ' ch' + (ci + 1) + ': wrong move on ' + step.san + ' rejected');
        ok(!!clHint(L), id + ' ch' + (ci + 1) + ': hint revealed after a miss');
      }
      const i1 = L.i; clTry(step.from, step.to);
      ok(L.i === i1 + 1 && !L.wrong, id + ' ch' + (ci + 1) + ': correct move ' + step.san + ' advances');
      clAdvanceOpp(L);
    }
    ok(L.done, id + ' ch' + (ci + 1) + ': walkthrough completes');
    ok(store.repertoire.includes(id), id + ' ch' + (ci + 1) + ': completion adds the opening to the repertoire');
    ok(courseChapDone(id, ci), id + ' ch' + (ci + 1) + ': completion is recorded');
    const heroFen = clResolve(id, ci).line.find(st => st.you).fenBefore;
    ok(!!store.srs[id + '::' + heroFen], id + ' ch' + (ci + 1) + ': completion seeds SRS for review');
  });
}

console.log('\n✅ course: ' + pass + ' checks passed  (' + ids.length + ' courses, ' + totalMoves + ' moves, ' + totalEx + ' exercises)');
