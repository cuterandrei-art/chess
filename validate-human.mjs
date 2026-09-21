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
const X=new Function(script+'\nreturn {store,app,oppTraits,playMaterialCp,playCp,oppLowOnTime,oppAfterMove,oppDrawAccept,oppDrawDecline,offerDrawHuman,oppDrawPanel,openingReport,viewReport,buildSession,lifeInit,detectOpening};')();

/* ================= temperament ================= */
const a=X.oppTraits({id:'f7',name:'S. Frost',style:'grinder'});
const b=X.oppTraits({id:'f7',name:'S. Frost',style:'grinder'});
ok(JSON.stringify(a)===JSON.stringify(b),'the same opponent always has the same temperament');
ok(JSON.stringify(a)!==JSON.stringify(X.oppTraits({id:'f8',name:'K. Vale',style:'grinder'})),'different opponents differ');
ok([a.drawish,a.stubborn,a.nerve].every(v=>v>=0&&v<=1),'every trait stays inside 0–1');
ok(X.oppTraits({id:'x',name:'x',style:'grinder'}).stubborn > X.oppTraits({id:'x',name:'x',style:'aggressive'}).stubborn,'a grinder is more stubborn than an attacker');
ok(X.oppTraits({id:'y',name:'y',style:'solid'}).drawish > X.oppTraits({id:'y',name:'y',style:'gambiteer'}).drawish,'a solid player is more drawish than a gambiteer');
ok(X.oppTraits(null).name==='Your opponent','a missing opponent still yields safe defaults');

/* ================= reading the position with no engine ================= */
const START=new Chess().fen();
ok(X.playMaterialCp(START,'w')===0,'the material read is level at the start');
const downAQueen='rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
ok(X.playMaterialCp(downAQueen,'w')===900,'and sees a missing queen as nine pawns');
X.app.playFen=START; X.app.playEval=null;
ok(X.playCp('w')===0,'with no engine it falls back to material');
X.app.playEval={t:'cp',v:300,stm:'w'};
ok(X.playCp('w')===300&&X.playCp('b')===-300,'with an engine it uses the eval, from the right side');
X.app.playEval={t:'mate',v:2,stm:'b'};
ok(X.playCp('b')>3000,'a mate score reads as decisive');
X.app.clock=null; X.app.tc=null;
ok(X.oppLowOnTime()===0,'no clock means no time pressure');
X.app.playSide='w'; X.app.tc={base:300,inc:0}; X.app.clock={w:300000,b:300000};
ok(X.oppLowOnTime()===0,'a full clock is not time pressure');
X.app.clock={w:300000,b:9000};
ok(X.oppLowOnTime()>0.7,'nine seconds of a five-minute game is severe time pressure');

/* ================= resignation ================= */
const c=X.store.career; c.setup=true; X.lifeInit(c);
function setup(cp,ply,style){
  X.app.playStatus='play'; X.app.playSide='w'; X.app.careerOpp='oneoff'; X.app.careerOneoff='classical';
  X.app.careerRoundOpp={id:'f9',name:'T. Marek',rating:2000,style:style||'universal'};
  X.app.careerScored=false; X.app.oppDraw=null; X.app.oppSaid=null; X.app._oppLost=0; X.app._drawCd=0;
  X.app.playMoves=new Array(ply).fill({san:'e4'}); X.app.playFen=START;
  X.app.playEval={t:'cp',v:cp,stm:'b'};   // cp from Black's (their) point of view
  X.app.clock=null; X.app.tc=null;
}
setup(-1200,40);
for(let i=0;i<12&&X.app.playStatus!=='over';i++)X.oppAfterMove();
ok(X.app.playStatus==='over','a hopelessly lost opponent eventually resigns');
ok(/resigns/.test(X.app.playResult)&&/you won/i.test(X.app.playResult),'and the game is recorded as your win');
ok(typeof X.app.oppSaid==='string'&&X.app.oppSaid.length>4,'they say something on the way out');

setup(-1200,10);
for(let i=0;i<12;i++)X.oppAfterMove();
ok(X.app.playStatus!=='over','nobody resigns in the first few moves, however bad it looks');

setup(-100,40);
for(let i=0;i<12;i++)X.oppAfterMove();
ok(X.app.playStatus!=='over','a slightly worse opponent plays on');

/* ================= their draw offers ================= */
setup(0,60,'solid');
let offered=false;
for(let i=0;i<200&&!offered;i++){X.app.oppDraw=null;X.app._drawCd=0;X.oppAfterMove();if(X.app.oppDraw)offered=true;}
ok(offered,'in a dead level position they will eventually offer a draw');
ok(/draw/i.test(X.app.oppDraw.line),'the offer is phrased as an offer');
ok(/oppdrawyes/.test(X.oppDrawPanel())&&/oppdrawno/.test(X.oppDrawPanel()),'you can accept it or play on');
X.oppDrawAccept();
ok(X.app.playStatus==='over'&&/Draw agreed/.test(X.app.playResult),'accepting ends the game as a draw');

setup(0,60,'solid'); X.app.oppDraw={name:'T. Marek',line:'Draw?'};
X.oppDrawDecline();
ok(!X.app.oppDraw&&X.app._drawCd>60,'declining clears the offer and stops them pestering you');

setup(0,10,'solid');
for(let i=0;i<60;i++){X.app._drawCd=0;X.oppAfterMove();}
ok(!X.app.oppDraw,'they do not offer a draw on move five');

/* ================= your draw offers ================= */
setup(-400,50,'solid');                 // they are losing badly
ok(X.offerDrawHuman()===true&&X.app.playStatus==='over','a losing opponent takes the draw you offer');
setup(400,50,'aggressive');             // they are winning
X.app.drawMsg=null; X.offerDrawHuman();
ok(X.app.playStatus!=='over','a winning opponent refuses');
ok(typeof X.app.drawMsg==='string'&&/T\. Marek/.test(X.app.drawMsg),'and says so in their own name');
setup(0,5,'solid');
X.offerDrawHuman();
ok(X.app.playStatus!=='over','offering a draw on move three is turned down');
X.app.careerOpp=null;
ok(X.offerDrawHuman()===false,'outside a career game the old behaviour is left alone');

/* ================= opening report card ================= */
X.store.career.games=[];
ok(X.openingReport().rows.length===0,'no games means an empty report');
ok(/No games on file/.test(X.viewReport()),'and the view says so rather than looking broken');
const italian=['e4','e5','Nf3','Nc6','Bc4','Bc5','c3','Nf6'].map(san=>({san}));
const french=['e4','e6','d4','d5'].map(san=>({san}));
X.store.career.games=[
  {moves:italian,result:1,color:'w',date:3},{moves:italian,result:1,color:'w',date:4},
  {moves:italian,result:0.5,color:'w',date:5},
  {moves:french,result:0,color:'w',date:6},{moves:french,result:0,color:'w',date:7},{moves:french,result:0,color:'w',date:8},
];
const R=X.openingReport();
ok(R.rows.length>=2,'games are grouped by the opening actually played ('+R.rows.length+')');
const it=R.rows.find(r=>/Italian/.test(r.name));
ok(it&&it.n===3&&it.w===2&&it.d===1&&it.pct===83,'a line you score well in is measured correctly ('+(it&&it.pct)+'%)');
ok(R.weak&&/French/.test(R.weak.name)&&R.weak.pct===0,'the line that keeps losing is singled out to fix first');
ok(R.best&&/Italian/.test(R.best.name),'and the one that earns its keep is praised');
const rv=X.viewReport();
ok(/Fix this first/.test(rv)&&/French/.test(rv),'the report leads with the weak line');
ok(/data-act="train"/.test(rv),'and offers to drill it');
ok(/app\.view==='report'\)body=viewReport\(\)/.test(script),'the report card is routed');
ok(/\['report','📊','Opening report'/.test(script),'and reachable from the Learn hub');
ok(/id:o\.id\};\}/.test(script),'detectOpening reports which opening matched, so the report can link to it');

/* ================= per-move review scheduling ================= */
ok(/const first=nodes\.findIndex/.test(script),'review lines start at the first move that is actually due');
ok(/if\(first>2\)startAt=first-2/.test(script),'with a ply or two of run-up for context');
ok(/srsSkip/.test(script)&&/data-setting="srsSkip"/.test(script),'and it can be switched off in Settings');
ok(/app\.nodePos=at;app\.fen=l\.nodes\[at\]\.fenBefore/.test(script),'loading a line honours that starting point');

console.log('\n✅ human+report: '+pass+' checks passed');
