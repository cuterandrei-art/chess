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
const pm = html.match(/window\.__PUZZLES=(\[[\s\S]*?\]);/); dom.window.__PUZZLES = JSON.parse(pm[1]).slice(0,5);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {app,reviewFinish,viewReview,cpOf,winPct};')();

// build a 1-move review where White (me) blunders: eval swings from +30 to -250
const sf="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1";
const c=new Chess(sf); const mv=c.move('Ng5'); const F1=c.fen();
X.app.view='review';
X.app.review={status:'analyzing',startFen:sf,fens:[sf,F1],moves:[{san:mv.san,from:mv.from,to:mv.to}],evals:[{t:'cp',v:30},{t:'cp',v:250}],best:['d2d3',''],meta:{side:'w'},classes:[],accW:null,accB:null,pos:0};
X.reviewFinish();
const R=X.app.review;
ok(R.status==='done','reviewFinish completes without the engine');
ok(R.key,'a key moment (biggest mistake) is identified');
ok(R.key.played==='Ng5','the key moment names the move you actually played');
ok(R.key.better==='d3','the key moment names the better move the engine preferred');
ok(R.key.cls==='blunder'||R.key.cls==='mistake','the key move is classified as a mistake/blunder ('+R.key.cls+')');
const dv=X.viewReview();
ok(/Your biggest mistake/.test(dv)&&/Ng5/.test(dv),'the review view headlines your biggest mistake');

// no key moment when there are no mistakes (a clean game)
const c2=new Chess(sf); const m2=c2.move('d3'); const G1=c2.fen();
X.app.review={status:'analyzing',startFen:sf,fens:[sf,G1],moves:[{san:m2.san,from:m2.from,to:m2.to}],evals:[{t:'cp',v:30},{t:'cp',v:-25}],best:['d2d3',''],meta:{side:'w'},classes:[],accW:null,accB:null,pos:0};
X.reviewFinish();
ok(!X.app.review.key,'a clean game shows no "biggest mistake"');

// source: the play result screen offers a one-tap review for any finished game
ok(/data-act="revplay">🔬 Review game/.test(script),'the result screen offers a one-tap "Review game"');

console.log('\n✅ review: '+pass+' checks passed');
