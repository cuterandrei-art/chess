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
const X=new Function(script+'\nreturn {matchScoreStrip,makeField,TOURNAMENTS,careerTourView};')();

const wcc=X.TOURNAMENTS.find(t=>t.id==='wcc');
ok(wcc&&wcc.kind==='match'&&wcc.rounds===14,'the World Championship is a 14-game match');
const field=X.makeField(wcc);
ok(field.length===14 && new Set(field.map(f=>f.name)).size===1,'the match field is the same champion for all 14 games');

const mk=(round,results)=>({id:'wcc',emoji:'👑',name:'World Championship Match',rounds:14,round,results,field,kind:'match'});
// mid-match scoreboard: your points + opponent points = games played
let tr=mk(6,[{score:1,rating:2830},{score:0,rating:2830},{score:0.5,rating:2830},{score:1,rating:2830},{score:0.5,rating:2830},{score:0,rating:2830}]);
let strip=X.matchScoreStrip(tr);
ok(/7 \/ 14/.test(strip),'scoreboard shows the current game number (7 / 14)');
ok(strip.includes('3')&&/You/.test(strip),'scoreboard shows your running score'); // you have 3 of 6

// clinch detection: 7.5 wins the crown
let win=mk(14,Array.from({length:14},(_,i)=>({score:i<8?1:0,rating:2830}))); // 8 points
ok(/You win the match/.test(X.matchScoreStrip(win)),'reaching 7.5 declares you champion');
let lose=mk(14,Array.from({length:14},(_,i)=>({score:i<3?1:0,rating:2830}))); // 3 pts, opp 11
ok(/retains the title/.test(X.matchScoreStrip(lose)),'the champion retaining the title is shown');
// match point: 7 points with games left
let mp=mk(13,Array.from({length:13},(_,i)=>({score:i<7?1:0.5,rating:2830}))); // 7 + 3 = 10... adjust: 7 wins + 6 draws not possible in 13; use 7 wins,6 losses
mp=mk(13,Array.from({length:13},(_,i)=>({score:i<7?1:0,rating:2830}))); // exactly 7
ok(/Match point/.test(X.matchScoreStrip(mp)),'match point is flagged when a win clinches it');

ok(/tr\.kind==='match'\?matchScoreStrip\(tr\)/.test(script),'careerTourView shows the strip for match events');

console.log('\n✅ wcmatch: '+pass+' checks passed');
