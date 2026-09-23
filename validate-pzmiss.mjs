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
/* a small stand-in puzzle set: [fen, uciMoves, rating, themes, lastMove] */
dom.window.__PUZZLES=[
  ['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7',1200,['mate'],'e7e5'],
  ['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1','g1f3',1400,[],'e7e5'],
  ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1','e2e4',1600,[],null],
  ['8/8/8/8/8/5k2/6q1/7K w - - 0 1','h1h2',1800,['mate'],null],
  ['8/8/8/8/8/4k3/4q3/4K3 b - - 0 1','e2e1',2000,['mate'],null]
];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,render,PZ_BOXES,PZ_INJECT_EVERY,pzMissStore,pzMissDueAt,pzMissAdd,'+
  'pzMissPass,pzMissDue,pzMissCount,pzMissNext,pzMissValid,pzMissPrune,pzMissAgo,pzMissCard,pzReviewChip,'+
  'pzNext,pzGrade,viewPuzzles,PUZZLES,freshCareer};')();
const DAY=86400000;
const reset=()=>{X.store.puzzle={rating:1500,solved:0,failed:0,streak:0,best:0,rush:0,last:null,miss:{}};
  X.app.pzFilter={type:'auto'};X.app.pzReview=null;X.app.pzGraduated=null;X.app.pzMissDone=false;
  X.app._pzCount=0;X.app.pzSeen=new Set();X.app.pz=null;};
ok(X.PUZZLES.length===5,'the test set loaded ('+X.PUZZLES.length+' puzzles)');

/* ================= A FAILED PUZZLE IS REMEMBERED ================= */
reset();
ok(X.pzMissCount()===0,'nothing is waiting to begin with');
X.pzMissAdd(2);
ok(X.pzMissCount()===1,'getting one wrong puts it in the queue');
let q=X.pzMissStore()['2'];
ok(q.box===0,'in the bottom box');
ok(q.due<=Date.now()+1,'due straight away');
ok(q.wrong===1,'with the number of times you have missed it');
X.pzMissAdd(2);
ok(X.pzMissCount()===1,'missing the same one again does not add a second entry');
ok(X.pzMissStore()['2'].wrong===2,'but the count goes up');
ok(X.pzMissStore()['2'].box===0,'and it drops back to the bottom box');
ok(X.pzMissAdd(null)===null&&X.pzMissAdd(-1)===null,'a puzzle with no index is not queued');

/* ================= SOLVING IT MOVES IT UP ================= */
reset();
X.pzMissAdd(1);
let r=X.pzMissPass(1);
ok(r&&r.box===1,'solving it cleanly moves it up a box');
const due1=X.pzMissStore()['1'].due-Date.now();
ok(Math.abs(due1-X.PZ_BOXES[1]*DAY)<5000,'and it comes back in '+X.PZ_BOXES[1]+' day(s)');
X.pzMissPass(1);
ok(X.pzMissStore()['1'].box===2,'again and it is box three');
const due2=X.pzMissStore()['1'].due-Date.now();
ok(due2>due1,'each box waits longer than the last');
X.pzMissPass(1);X.pzMissPass(1);
ok(X.pzMissCount()===1,'still in the queue at the top box');
r=X.pzMissPass(1);
ok(r&&r.graduated===true,'clearing the top box graduates it');
ok(X.pzMissCount()===0,'and it leaves the queue for good');
ok(X.pzMissPass(1)===null,'passing a puzzle that is not queued does nothing');
/* miss it again after progress and it starts over */
reset();
X.pzMissAdd(1);X.pzMissPass(1);X.pzMissPass(1);
ok(X.pzMissStore()['1'].box===2,'two boxes up');
X.pzMissAdd(1);
ok(X.pzMissStore()['1'].box===0,'and one more mistake sends it back to the bottom');
ok(X.pzMissStore()['1'].wrong===2,'with both mistakes on the record');

/* ================= WHAT IS DUE ================= */
reset();
X.pzMissAdd(0);X.pzMissAdd(1);X.pzMissAdd(2);
ok(X.pzMissDue().length===3,'a fresh mistake is due at once');
X.pzMissPass(0);X.pzMissPass(1);
ok(X.pzMissDue().length===1,'the ones just solved are not due again yet');
ok(X.pzMissDue()[0]===2,'only the one still in the bottom box');
ok(X.pzMissDue(Date.now()+30*DAY).length===3,'a month later they all are');
ok(X.pzMissNext()===2,'the next review is the one waiting longest');
X.store.puzzle.miss['0'].due=Date.now()-99*DAY;
ok(X.pzMissNext()===0,'and a long-overdue one goes first, so nothing rots at the back');
reset();
ok(X.pzMissNext()===null,'with nothing due there is nothing to review');

/* ================= A QUEUE THAT OUTLIVES THE PUZZLE SET ================= */
reset();
X.pzMissAdd(1);
X.store.puzzle.miss['99999']={box:0,due:Date.now(),wrong:1,seen:0,at:Date.now()};
ok(X.pzMissCount()===2,'an index from a bigger set can be in there');
ok(X.pzMissValid(1)===true&&X.pzMissValid(99999)===false,'and it can be told apart from a real one');
X.pzMissPrune();
ok(X.pzMissCount()===1,'pruning drops what the set no longer contains');
ok(X.pzMissStore()['1'],'and keeps what it does');
/* a corrupted queue does not take the puzzles down with it */
X.store.puzzle.miss=null;
ok(X.pzMissCount()===0&&X.pzMissDue().length===0,'a missing queue reads as empty');
X.store.puzzle.miss=[1,2,3];
ok(X.pzMissCount()===0,'and so does one of the wrong shape');
ok(typeof X.pzMissStore()==='object'&&!Array.isArray(X.store.puzzle.miss),'which is then repaired');

/* ================= HOW LONG AGO ================= */
ok(X.pzMissAgo({at:Date.now()})==='earlier today','a mistake from today says so');
ok(X.pzMissAgo({at:Date.now()-DAY})==='yesterday','yesterday is yesterday');
ok(/5 days ago/.test(X.pzMissAgo({at:Date.now()-5*DAY})),'then days');
ok(/months? ago/.test(X.pzMissAgo({at:Date.now()-70*DAY})),'then months');
ok(X.pzMissAgo(null)===''&&X.pzMissAgo({})==='','and nothing at all formats to nothing');

/* ================= IT IS SERVED BACK TO YOU ================= */
reset();
X.pzMissAdd(3);
X.app.pzFilter={type:'miss'};
X.pzNext();
ok(X.app.pz&&X.app.pz.idx===3,'review mode serves the puzzle you got wrong');
ok(X.app.pzReview&&X.app.pzReview.box===0,'and marks it as a review');
ok(/A mistake from before/.test(X.pzReviewChip()),'with a note above the board');
ok(/Box 1 of/.test(X.pzReviewChip()),'saying which box it is in');
/* solving it in review mode moves it on and the queue empties */
X.app.pz.clean=true;
X.pzGrade(true);
ok(X.pzMissStore()['3'].box===1,'solving it there counts');
X.pzNext();
ok(X.app.pzFilter.type==='auto','with nothing left due, review mode hands back to fresh puzzles');
ok(X.app.pzMissDone===true,'and says so');
/* a failure in normal play gets queued */
reset();
X.app.pzFilter={type:'auto'};
X.pzNext();
const first=X.app.pz.idx;
X.app.pz.clean=true;
X.pzGrade(false);
ok(X.pzMissStore()[String(first)],'failing a puzzle in ordinary play queues it');
ok(X.pzMissStore()[String(first)].wrong===1,'once');
/* the injection: one review every few puzzles */
reset();
X.pzMissAdd(4);
X.app.pzFilter={type:'auto'};
let served=[],reviews=0;
for(let i=0;i<X.PZ_INJECT_EVERY*3;i++){X.pzNext();served.push(X.app.pz.idx);if(X.app.pzReview)reviews++;}
ok(reviews>=1,'a due mistake is slipped into ordinary solving ('+reviews+' times in '+served.length+')');
ok(reviews<=served.length/2,'but not so often that it takes the session over');
ok(served.filter(i=>i===4).length>=1,'and it really is the one you got wrong');
/* the chip only appears for a review */
reset();
X.app.pzFilter={type:'auto'};
X.pzNext();
ok(X.app.pzReview===null||X.pzReviewChip()==='','a fresh puzzle carries no review note');

/* ================= ON THE PUZZLES SCREEN ================= */
reset();
ok(X.pzMissCard()==='','with no mistakes there is no card');
X.pzMissAdd(0);X.pzMissAdd(1);
let card=X.pzMissCard();
ok(/Your mistakes/.test(card),'once there are some, the card appears');
ok(/2 puzzles you have got wrong/.test(card),'counting them');
ok(/2 due now/.test(card),'and how many are due');
ok(/data-act="pzmiss"/.test(card),'with a button to drill exactly those');
X.pzMissPass(0);X.pzMissPass(1);
card=X.pzMissCard();
ok(/none due yet/.test(card),'when none are due it says so');
ok(!/data-act="pzmiss"/.test(card),'and does not offer a review with nothing in it');
X.app.pzFilter={type:'miss'};
X.pzMissAdd(0);
ok(/Reviewing…/.test(X.pzMissCard()),'while reviewing, the button says so');
ok(/Back to fresh puzzles/.test(X.pzMissCard()),'with a way out');
X.app.pzFilter={type:'auto'};
X.app.pz=null;
let v=X.viewPuzzles();
ok(/Your mistakes/.test(v),'the card is on the puzzles screen');
X.app.pzMissDone=true;
ok(/every mistake that was due/.test(X.viewPuzzles()),'and clearing the queue is acknowledged');
X.app.pzMissDone=false;
X.app.pzFilter={type:'miss'};
X.pzNext();
v=X.viewPuzzles();
ok(/A mistake from before/.test(v),'a review says what it is above the board');
X.app.pzGraduated={graduated:true};
ok(/left the review queue for good/.test(X.viewPuzzles()),'and graduating one is worth saying');

/* ================= WIRED IN ================= */
ok(/if\(success\)app\.pzGraduated=pzMissPass\(P\.idx\);/.test(script),'a clean solve advances the box');
ok(/else \{pzMissAdd\(P\.idx\);/.test(script),'and a failure queues the puzzle');
ok(/app\.pzFilter&&app\.pzFilter\.type==='miss'/.test(script),'review mode picks from the queue');
ok(/app\._pzCount%PZ_INJECT_EVERY===0/.test(script),'ordinary solving slips one in now and then');
ok(/h\+=pzMissCard\(\);/.test(script),'the card is rendered');
ok(/h\+=pzReviewChip\(\);/.test(script),'so is the note above the board');
ok(/act==='pzmiss'/.test(script),'the review button is connected');
ok(/miss:\{\}/.test(script),'and the queue has a default, so an old save gains one quietly');

console.log('\n✅ pzmiss: '+pass+' checks passed');
