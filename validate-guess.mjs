import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage;
globalThis.Chess = Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {app,store,guessStart,guessBuildQ,guessView,guessPool};')();

const pool=X.guessPool();
ok(pool.length>50,'guess pool built from classics + master games ('+pool.length+' games)');

// start 25 sessions: the correct move must always be legal and among the options
let checked=0;
for(let t=0;t<25;t++){
  X.guessStart(); const G=X.app.guess;
  ok(G&&G.q,'session '+t+' has a question') && pass--; // count once below
  const q=G.q;
  // correct move is legal at the shown position
  const c=new Chess(q.fen); let legal=false; try{legal=!!c.move(q.correct);}catch(e){legal=false;}
  if(!legal) throw new Error('FAIL: correct move '+q.correct+' illegal at '+q.fen);
  if(!q.options.includes(q.correct)) throw new Error('FAIL: correct move not among options');
  if(q.options.length<2||q.options.length>4) throw new Error('FAIL: bad option count '+q.options.length);
  if(new Set(q.options).size!==q.options.length) throw new Error('FAIL: duplicate options');
  checked++;
}
ok(checked===25,'25 sessions: correct move is always legal and present, options are 2-4 unique');

// render sanity
X.guessStart(); const v=X.guessView();
ok(/data-act="guessans"/.test(v)&&/Guess the Move/.test(v)&&(/<svg|data-sq/.test(v)),'guess view renders a board + answer buttons');

// scoring: answering correctly should advance and award points; wrong resets streak
X.guessStart(); const G=X.app.guess; const correct=G.q.correct;
G.answered=true; G.choice=correct; G.total=1; G.lastPts=10; G.score=10; G.streak=1;
ok(/✓ Correct/.test(X.guessView()),'correct answer shows positive feedback');
G.answered=true; G.choice='__wrong__';
ok(/The move was/.test(X.guessView()),'wrong answer reveals the real move');

console.log('\n✅ guess: '+pass+' checks passed');
