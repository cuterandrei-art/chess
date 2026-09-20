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
const X=new Function(script+'\nreturn {store,UNLOCKS,isUnlocked,selOpt,careerUnlockPanel,lifeInit,PIECE_SETS,THEMES};')();

ok(Object.keys(X.UNLOCKS).length>=10,'a catalog of prestige unlocks exists ('+Object.keys(X.UNLOCKS).length+')');
// every unlock references a real cosmetic option key
const cats={pieces:X.PIECE_SETS,theme:X.THEMES};
ok(Object.keys(X.UNLOCKS).every(k=>{const[set,key]=k.split(':');return set==='pieces'?!!X.PIECE_SETS[key]:set==='theme'?!!X.THEMES[key]:true;}),'unlock keys map to real piece sets / themes');

const c=X.store.career; c.setup=true; X.lifeInit(c);
// with a fresh career, prestige cosmetics are locked; free ones are open
ok(X.isUnlocked('pieces','staunty')===true,'default piece set is always available');
ok(X.isUnlocked('pieces','monarchy')===false,'GM-gated piece set is locked for a new career');
ok(X.isUnlocked('appTheme','ember')===false,'World-Champion background is locked initially');

// selOpt marks locked options disabled + 🔒, free ones normal
const sel=X.selOpt('pieces',X.PIECE_SETS);
ok(/value="monarchy"[^>]*disabled/.test(sel)&&/Monarchy 🔒/.test(sel),'locked option renders disabled with a lock');
ok(/value="staunty"(?![^>]*disabled)/.test(sel),'unlocked option renders selectable');

// earning the GM title unlocks the GM-gated cosmetics
c.titles=['CM','FM','IM','GM'];
ok(X.isUnlocked('pieces','monarchy')===true && X.isUnlocked('appTheme','royal')===true,'GM title unlocks its cosmetics');
// World Championship unlocks the top tier
c.honors=['World Champion'];
ok(X.isUnlocked('pieces','horsey')===true && X.isUnlocked('appTheme','ember')===true,'World Champion unlocks the top-tier cosmetics');
// peak rating gate
c.titles=[]; c.honors=[]; c.peak=2450;
ok(X.isUnlocked('theme','ice')===true && X.isUnlocked('accent','emerald')===true,'a 2400 peak unlocks its cosmetics');

// panel renders both states
c.peak=1200;
const panel=X.careerUnlockPanel(c);
ok(/Cosmetic unlocks/.test(panel)&&/🔒/.test(panel)&&/unlocked/.test(panel),'unlock panel renders progress with locked entries');

// guard exists in the settings handler (locked values are rejected)
ok(/isUnlocked\(ds,e\.target\.value\)/.test(script),'settings handler rejects selecting a locked cosmetic');

console.log('\n✅ unlocks: '+pass+' checks passed');
