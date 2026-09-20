import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {resultKind,confetti};')();

ok(X.resultKind('Checkmate — you won! 🎉')==='win','win result classified');
ok(X.resultKind('Checkmate — you lost.')==='loss','loss result classified');
ok(X.resultKind('You resigned — Stockfish wins.')==='loss','resign classified as loss');
ok(X.resultKind('Draw by threefold repetition.')==='draw','draw result classified');

// confetti spawns then cleans up, and never throws
const n0=document.querySelectorAll('.confetti').length;
X.confetti(20);
const spawned=document.querySelectorAll('.confetti').length;
ok(spawned===n0+1,'confetti() adds an overlay to the DOM');
ok(document.querySelectorAll('.confetti i').length>=20,'confetti spawns pieces');

// source wiring
ok(/app\.playStatus==='over'&&resultKind\(app\.playResult\)==='win'.*confetti\(\)/.test(script),'a win fires confetti in render');
ok(/_cf\.newTitles.*_cf\.honors.*confetti\(130\)/.test(script.replace(/\n/g,' ')),'a new title/honor/norm fires confetti');
ok(/data-act="prematch"/.test(script),'result screen offers a rematch');
ok(/\.confetti\{position:fixed/.test(html)&&/@keyframes conffall/.test(html),'confetti CSS is present');
ok(/— check!/.test(script),'in-check indicator present in the play status');

console.log('\n✅ polish: '+pass+' checks passed');
