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
const X=new Function(script+'\nreturn {store,app,REV_CLASS,BRIL_VAL,brilliancyAt,brilliancyScan,brilLabel,brilSave,viewBrilliancy,reviewFinish,viewReview};')();

// Greek gift: 1.Bxh7+! — a bishop handed to the king, and White is still better.
const GIFT='r1bq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQ - 0 1';
function review(fen,san,evBefore,evAfter,side){
  const g=new Chess(fen); const m=g.move(san);
  return {status:'analyzing',startFen:fen,fens:[fen,g.fen()],moves:[{san:m.san,from:m.from,to:m.to}],
    evals:[evBefore,evAfter],best:[m.from+m.to,''],meta:{side:side||'w'},classes:[],accW:null,accB:null,pos:0};
}
ok(X.REV_CLASS.brilliant,'"Brilliant" is a move class of its own');

X.app.view='review'; X.app.review=review(GIFT,'Bxh7+',{t:'cp',v:60},{t:'cp',v:-120});
X.reviewFinish();
let R=X.app.review;
ok(R.bril&&R.bril.length===1,'a working piece sacrifice is detected as a brilliancy');
ok(R.bril[0].san==='Bxh7+','the brilliancy names the move you played');
ok(R.classes[0]==='brilliant','the move is re-classified as Brilliant in the move list');
ok(R.bril[0].invest===2,'it records how much material you actually invested');
ok(/Piece sacrifice/.test(X.brilLabel(R.bril[0])),'the sacrifice is described in plain words');
ok(/Brilliancy/.test(X.viewReview()),'the review screen headlines the brilliancy');
ok((X.store.brilliancies||[]).length===1,'the brilliancy is saved to your gallery');

// the same brilliancy is not stored twice
X.app.review=review(GIFT,'Bxh7+',{t:'cp',v:60},{t:'cp',v:-120}); X.reviewFinish();
ok(X.store.brilliancies.length===1,'reviewing the same game again does not duplicate it');

// a sacrifice that simply loses is not brilliant
X.store.brilliancies=[];
X.app.review=review(GIFT,'Bxh7+',{t:'cp',v:60},{t:'cp',v:260});   // after the move Black is +260
X.reviewFinish();
ok(!X.app.review.bril.length,'a sacrifice that just loses material is not a brilliancy');

// a quiet good move is not brilliant
X.app.review=review(GIFT,'O-O',{t:'cp',v:60},{t:'cp',v:-55});
X.reviewFinish();
ok(!X.app.review.bril.length,'a normal strong move is not flagged as a brilliancy');

// nothing is offered: a capture the opponent cannot answer is not a sacrifice
const QUIET='8/8/4k3/8/3B4/8/4K3/8 w - - 0 1';
X.app.review=review(QUIET,'Bc5',{t:'cp',v:40},{t:'cp',v:-40});
X.reviewFinish();
ok(!X.app.review.bril.length,'a move nobody can capture is not a sacrifice');

// mating sacrifices are recognised even when the eval is a mate score
X.app.review=review(GIFT,'Bxh7+',{t:'cp',v:40},{t:'mate',v:-3});
X.reviewFinish();
ok(X.app.review.bril.length===1&&/Mating sacrifice/.test(X.brilLabel(X.app.review.bril[0])),'a sacrifice leading to forced mate is called a mating sacrifice');

// the gallery
X.app.view='brilliancy';
const gv=X.viewBrilliancy();
ok(/Brilliancies/.test(gv)&&/Bxh7/.test(gv),'the gallery lists your saved brilliancies with the move');
ok(/class="board"/.test(gv),'each brilliancy shows the position it happened in');
X.store.brilliancies=[];
ok(/Nothing here yet/.test(X.viewBrilliancy()),'an empty gallery explains how to fill it');
ok(/const nav=\[[^\]]*'brilliancy'/.test(script)&&/LEARN_VIEWS=\[[^\]]*'brilliancy'/.test(script),'Brilliancies is registered in the navigation and the Learn hub');
ok(/\['brilliancy','💎','Brilliancies'/.test(script),'the Learn hub shows a Brilliancies card');
ok(/app\.view==='brilliancy'\)body=viewBrilliancy\(\)/.test(script),'the router opens the gallery');

console.log('\n✅ brilliancy: '+pass+' checks passed');
