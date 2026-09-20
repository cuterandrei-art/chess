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
const X=new Function(script+'\nreturn {store,RIVAL_STAGES,RIVAL_TAUNTS,rivalStage,rivalTaunt,rivalStoryTick,careerRivalryPanel,startRivalFinale,lifeInit};')();

ok([1,2,3,4].every(s=>X.RIVAL_STAGES[s]&&X.RIVAL_STAGES[s].n),'four rivalry stages defined (Simmering→Legendary)');
const c=X.store.career; c.setup=true; X.lifeInit(c);
c.rival={id:'r1',name:'S. Frost',flag:'🏴',rating:2050,since:2,intensity:1};
c.h2h={'S. Frost':{w:0,l:0,d:0}};
ok(X.rivalStage(c)===1,'a new rivalry starts Simmering (stage 1)');
c.h2h['S. Frost']={w:2,l:3,d:1}; // 6 games
ok(X.rivalStage(c)>=3,'many encounters escalate the rivalry ('+X.rivalStage(c)+')');
c.rival.intensity=8; c.h2h['S. Frost']={w:5,l:5,d:2};
ok(X.rivalStage(c)===4,'high intensity + a long history reaches Legendary');

// taunt reflects the head-to-head
c.h2h['S. Frost']={w:0,l:4,d:0}; // you trail
ok(X.RIVAL_TAUNTS.youTrail.includes(X.rivalTaunt(c)),'when you trail, the rival talks cocky');
c.h2h['S. Frost']={w:5,l:0,d:0}; // you lead
ok(X.RIVAL_TAUNTS.youLead.includes(X.rivalTaunt(c)),'when you lead, the rival is defiant');

// story tick fires a beat once per new stage
c.news=[]; c.rival.stageSeen=1; c.rival.intensity=8; c.h2h['S. Frost']={w:5,l:5,d:2};
X.rivalStoryTick(c);
ok(c.news.length>0 && c.rival.stageSeen===4,'crossing into a new stage pushes a news beat, once');
const n0=c.news.length; X.rivalStoryTick(c);
ok(c.news.length===n0,'the same stage does not fire the beat again');

// panel shows stage, taunt, clap-back
const panel=X.careerRivalryPanel(c);
ok(/Legendary/.test(panel)&&/💬/.test(panel)&&/data-act="rivalclapback"/.test(panel),'rivalry panel shows the stage, a taunt and a clap-back action');

// finale sets up a 6-game match vs the rival
c.tour=null; c.money=5000; X.startRivalFinale();
ok(c.tour&&c.tour.kind==='match'&&c.tour.rounds===6&&c.tour.field.every(f=>f.name==='S. Frost'),'the finale is a 6-game match vs the rival (uses the match scoreboard)');
ok(/rivalStoryTick\(c\)/.test(script)&&/rivalfinale/.test(script)&&/rivalclapback/.test(script),'story hooks + finale + clap-back handlers are wired');

console.log('\n✅ rivalry: '+pass+' checks passed');
