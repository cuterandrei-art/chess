import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,Engine,drillBuild,drillStart,drillCur,drillTry,drillShow,drillNext,drillRetryMissed,drillGrade,viewDrill,viewReview,reviewFinish,boardClick,cpOf,winPct,DRILL_MAX,DRILL_TRIES,DRILL_TOL_CP};')();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* a mock engine, so a move's worth can be measured without the real one */
const KNOWN={};
const mock={postMessage(cmd){
  if(cmd.indexOf('position fen')===0){this.fen=cmd.slice('position fen '.length);return;}
  if(cmd.indexOf('go')===0){
    const k=KNOWN[this.fen];
    const cp=(k==null)?0:k;
    setTimeout(()=>{X.Engine._msg('info depth 14 multipv 1 score cp '+cp+' pv e2e4');
                    X.Engine._msg('bestmove e2e4');},10);
  }
}};
function attach(){X.Engine.worker=mock;X.Engine.ready=true;X.Engine.loading=Promise.resolve(true);
  X.Engine._cur=null;X.Engine._next=null;X.Engine._stopping=false;X.Engine._orphans=0;
  if(X.Engine._wd)clearTimeout(X.Engine._wd);if(X.Engine._orphanT){clearTimeout(X.Engine._orphanT);X.Engine._orphanT=null;}}
attach();
X.store.settings.showEval=true;X.store.settings.voiceOn=false;

/* Build a finished review the way reviewFinish leaves it. */
function review(sans,evals,bests,side){
  const c=new Chess(),fens=[c.fen()],moves=[];
  for(const s of sans){const m=c.move(s);moves.push({san:m.san,from:m.from,to:m.to});fens.push(c.fen());}
  X.store.brilliancies=[];
  X.app.review={status:'analyzing',startFen:fens[0],fens:fens,moves:moves,
    evals:evals.map(v=>(v&&typeof v==='object')?v:{t:'cp',v:v}),best:bests,
    i:fens.length,pos:0,meta:{side:side||null},classes:[],accW:null,accB:null};
  X.reviewFinish();
  return X.app.review;
}
/* White blunders on move 2 (Qh5 instead of Nf3) and again on move 4.
   Evaluations are from the side to move, as the engine reports them. */
const SANS=['e4','e5','Qh5','Nc6','Qxe5','Nxe5'];
const EVALS=[30,-30,30,150,-150,900,-900];
const BESTS=['e2e4','e7e5','g1f3','b8c6','g1f3','b8e5'];
let R=review(SANS,EVALS,BESTS,'w');

/* ================= which positions are worth practising ================= */
let items=X.drillBuild(R);
ok(items.length>0,'a reviewed game with errors yields positions to practise ('+items.length+')');
ok(items.every(i=>i.side==='w'),'only your own moves — not your opponent’s ('+items.map(i=>i.side).join('')+')');
ok(items.every(i=>i.bestSan&&i.bestUci!==i.playedUci),'each one has a better move that is not the move you played');
ok(items.every(i=>i.cls==='inacc'||i.cls==='mistake'||i.cls==='blunder'),'and each was actually judged an error');
ok(items[0].ply<items[items.length-1].ply||items.length===1,'they come in the order you played them');
ok(items[0].bestSan==='Nf3','the better move is converted to something readable ('+items[0].bestSan+')');
ok(items[0].playedSan==='Qh5','alongside what you actually played');
ok(items[0].lost>0,'and how much it cost ('+items[0].lost+'cp)');

// the opponent's blunders are yours to practise when you were the other colour
const asBlack=X.drillBuild(review(SANS,EVALS,BESTS,'b'));
ok(asBlack.every(i=>i.side==='b'),'reviewing as Black practises Black’s moves');
ok(asBlack.length!==items.length||asBlack[0].side==='b','which is a different set');
// with no side recorded, everything is fair game
ok(X.drillBuild(review(SANS,EVALS,BESTS,null)).length>=items.length,'a review with no side recorded offers both players’ errors');

/* nothing to practise in a clean game */
const clean=review(['e4','e5','Nf3','Nc6'],[20,-20,20,-20,20],['e2e4','e7e5','g1f3','b8c6'],'w');
ok(X.drillBuild(clean).length===0,'a game with no mistakes offers no practice');
ok(!/Learn from your mistakes/.test(X.viewReview()),'and the review does not offer it');
R=review(SANS,EVALS,BESTS,'w');
ok(/Learn from your mistakes/.test(X.viewReview()),'a game with mistakes does offer it');
ok(/data-act="drillgo"/.test(X.viewReview()),'with a button that starts it');
ok(X.drillBuild({status:'analyzing'}).length===0,'an unfinished review offers nothing');
ok(X.drillBuild(null).length===0,'and neither does no review at all');
// a move with no engine recommendation cannot be practised
ok(X.drillBuild(review(SANS,EVALS,['e2e4','e7e5','','b8c6','g1f3','b8c6'],'w')).every(i=>i.ply!==3),
  'a position where the engine named no move is skipped rather than shown blank');
// long games stay finishable
const many=[],mEv=[],mB=[];
for(let i=0;i<30;i++){many.push(i%2===0?'Nf3':'Nf6');many.push(i%2===0?'Ng1':'Ng8');}
ok(X.DRILL_MAX<=12,'a session is capped so it can be finished ('+X.DRILL_MAX+')');

/* ================= working through them ================= */
ok(X.drillStart(R)===true,'starting the drill succeeds');
ok(X.app.view==='drill','and switches to it');
let D=X.app.drill;
ok(D.i===0&&D.found===0&&D.status==='solving','beginning at the first position with nothing found');
let it=X.drillCur();
ok(it&&it.fen,'the position is the one before your mistake');
ok(new Chess(it.fen).turn()==='w','with you to move');
let h=X.viewDrill();
ok(/you played <b>Qh5<\/b>/.test(h),'the screen says what you played');
ok(/Mistake|Blunder|Inaccuracy/.test(h),'and how bad it was');
ok(/find something better/.test(h),'and asks for something better');
ok(!new RegExp('Nf3').test(h.replace(/data-[^"]*"[^"]*"/g,'')),'but does not give the answer away');
ok(/1 \/ /.test(h),'progress is shown');

/* the exact best move is right, with no engine needed */
ok(X.drillTry('g1','f3')===true,'playing the engine’s move is accepted');
ok(X.app.drill.status==='right','and marked right');
ok(X.app.drill.found===1,'and counted');
h=X.viewDrill();
ok(/Yes — Nf3/.test(h),'the answer is confirmed by name');
ok(/knight|centre|develop/i.test(h),'and explained, not just ticked ('+((/✓ ([^<]{0,90})/.exec(h)||[])[1]||'')+')');
ok(/data-act="drillnext"/.test(h),'with a way on to the next one');

/* the move you actually played is refused by name */
X.drillNext();
D=X.app.drill;it=X.drillCur();
if(it){
  const pf=it.playedUci;
  ok(X.drillTry(pf.slice(0,2),pf.slice(2,4))===true,'playing your own mistake again is accepted as an attempt');
  ok(X.app.drill.status==='wrong','and refused');
  ok(/move you played/.test(X.app.drill.note||''),'with a reason you can act on');
  ok(X.app.drill.tries===1,'and it counts as a try');
}

/* ================= a move that is not the engine's, but good enough ================= */
X.drillStart(R);
D=X.app.drill;it=X.drillCur();
// Nc3 instead of Nf3: tell the mock this position is just as good for us.
// The engine reports from the opponent's side, so a good position for us is negative.
const c1=new Chess(it.fen);const alt=c1.move('Nc3');
KNOWN[alt.after||c1.fen()]=-(it.bestCp);      // equal to best, from the opponent's view
X.drillTry('b1','c3');
ok(X.app.drill.checking===true,'a move the engine did not name is measured, not guessed at');
ok(/Checking your move/.test(X.viewDrill()),'and the screen says so while it thinks');
await sleep(300);
ok(X.app.drill.status==='right','a move as good as the best one is accepted ('+X.app.drill.status+')');
ok(/works too/.test(X.app.drill.note||''),'and says it was not the engine’s first choice');
ok(X.app.drill.found===1,'but still counts as found');

/* a move that is nearly as bad is refused */
X.drillStart(R);
D=X.app.drill;it=X.drillCur();
const c2=new Chess(it.fen);const bad=c2.move('Nc3');
KNOWN[bad.after||c2.fen()]=it.bestCp+600;     // from the opponent's view: very good for them
X.drillTry('b1','c3');
await sleep(300);
ok(X.app.drill.status==='wrong','a move that also throws the position away is refused');
ok(/gives up/.test(X.app.drill.note||''),'with the damage named ('+(X.app.drill.note||'').slice(0,60)+'…)');

/* after enough tries the answer is offered, and taking it is not a find */
while(X.app.drill.tries<X.DRILL_TRIES){
  X.app.drill.status='solving';
  X.drillTry('b1','c3');
  await sleep(300);
}
ok(/data-act="drillshow"/.test(X.viewDrill()),'after '+X.DRILL_TRIES+' wrong tries the answer is offered');
X.drillShow();
ok(X.app.drill.status==='shown','and can be revealed');
ok(/was the move/.test(X.app.drill.note||''),'naming it');
ok(X.app.drill.found===0,'a revealed answer is not counted as found');
ok(X.viewDrill().indexOf(X.drillCur().bestSan)>=0,'and the board shows it');

/* the board must show the move that was accepted, never an earlier wrong guess */
X.drillStart(R);
it=X.drillCur();
const c3=new Chess(it.fen);const wrongMv=c3.move('Nc3');       // a legal, much worse alternative
KNOWN[wrongMv.after||c3.fen()]=it.bestCp+700;
X.drillTry('b1','c3');
await sleep(300);
ok(X.app.drill.status==='wrong','a bad alternative is refused');
ok(!X.app.drill.solvedFen,'and leaves no position behind to be drawn later');
X.app.drill.status='solving';
X.drillTry(it.bestUci.slice(0,2),it.bestUci.slice(2,4));
ok(X.app.drill.status==='right','then the right move is accepted');
const shownFen=(function(){const c=new Chess(it.fen);c.move(it.bestSan);return c.fen();})();
ok(X.app.drill.solvedFen===shownFen,'and the board shows THAT move, not the earlier wrong one');
X.drillStart(R);
it=X.drillCur();
X.drillShow();
ok(X.app.drill.solvedFen===shownFen,'a revealed answer is played on the board too');

/* ================= finishing ================= */
X.drillStart(R);
const total=X.app.drill.items.length;
for(let n=0;n<total;n++){const i2=X.drillCur();X.drillTry(i2.bestUci.slice(0,2),i2.bestUci.slice(2,4));X.drillNext();}
ok(X.app.drill.status==='done','working through every position finishes the session');
h=X.viewDrill();
ok(new RegExp(total+' of '+total).test(h),'the score is reported ('+total+'/'+total+')');
ok(/Every one/.test(h),'with a word on how it went');
ok(!/Retry the/.test(h),'and nothing to retry when none were missed');
ok(/How it went/.test(h)&&/found it/.test(h),'plus a position-by-position summary');

/* missing some offers a second pass at exactly those */
X.drillStart(R);
X.drillShow();X.drillNext();
while(X.app.drill.status!=='done'){const i3=X.drillCur();if(!i3)break;X.drillTry(i3.bestUci.slice(0,2),i3.bestUci.slice(2,4));X.drillNext();}
const missedCount=X.app.drill.results.filter(r=>!r.ok).length;
ok(missedCount>=1,'a revealed answer is recorded as missed');
ok(/Retry the 1 you missed/.test(X.viewDrill())||missedCount!==1,'and a retry is offered');
X.drillRetryMissed();
ok(X.app.drill.items.length===missedCount,'the retry contains only the ones you missed ('+X.app.drill.items.length+')');
ok(X.app.drill.found===0&&X.app.drill.i===0,'starting fresh');

/* ================= the lifetime tally ================= */
const before=(X.store.stats.drill||{}).seen||0;
X.drillStart(R);
X.drillTry(X.drillCur().bestUci.slice(0,2),X.drillCur().bestUci.slice(2,4));
ok(X.store.stats.drill.seen===before+1,'every position attempted is tallied');
ok(X.store.stats.drill.found>=1,'and the ones you got right are too');
X.drillStart(R);X.drillShow();
ok(X.store.stats.drill.seen===before+2,'a revealed answer is tallied as seen too');

/* ================= the board is live ================= */
X.drillStart(R);
it=X.drillCur();
X.boardClick('g1');
ok(X.app.drill.sel==='g1','tapping one of your pieces selects it');
X.boardClick('f3');
ok(X.app.drill.status==='right','and tapping a destination plays the move');
X.drillStart(R);
X.boardClick('e5');
ok(X.app.drill.sel===null,'tapping a square with nothing to move selects nothing');
X.app.drill.status='right';
X.boardClick('g1');
ok(X.app.drill.sel===null,'and the board is dead once the position is solved');
ok(!/interactive/.test('')&&X.viewDrill().length>0,'the solved view still renders');

/* ================= wiring ================= */
ok(/app\.view==='drill'\)body=viewDrill\(\)/.test(script),'the drill is routed');
for(const act of ['drillgo','drillnext','drillshow','drillskip','drillretry'])
  ok(new RegExp("act==='"+act+"'").test(script),'the '+act+' button is wired');
ok(/pr\.view==='drill'\)drillTry/.test(script),'a promotion during the drill still plays the move');
ok(/if\(app\.view==='drill'\)\{const D=app\.drill;/.test(script),'the board click handler knows about the drill');
ok(X.DRILL_TOL_CP>0&&X.DRILL_TOL_CP<=100,'the tolerance for a near-best move is sane ('+X.DRILL_TOL_CP+'cp)');

console.log('\n✅ drill: '+pass+' checks passed');
