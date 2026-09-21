/* Checks the engine against positions whose truth we know independently.
   Unlike validate-engine.mjs (which mocks the worker so it can run anywhere),
   this downloads the real Stockfish build and drives the real app in a real
   browser. Needs a network on first run; caches the engine in the scratch dir.

   Usage: node engine-check.mjs */
import http from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { chromium } from 'playwright-core';

const CACHE='.cache/stockfish.js';
if(!existsSync(CACHE)){
  mkdirSync('.cache',{recursive:true});
  process.stdout.write('downloading Stockfish… ');
  const r=await fetch('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
  if(!r.ok){console.error('could not fetch the engine ('+r.status+')');process.exit(1);}
  writeFileSync(CACHE,await r.text());
  console.log('ok');
}
const SF=readFileSync(CACHE,'utf8');
const SRC=existsSync('ChessCareer-standalone.html')?'ChessCareer-standalone.html':'work/openingtrainer.html';
let HTML=readFileSync(SRC,'utf8');
// a test-only hook, added to the served copy; the shipped app has none
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,evalLabel:evalLabel,evalPct:evalPct,reviewStart:reviewStart};\n'+HTML.slice(i); }

const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const exe=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser=await chromium.launch(existsSync(exe)?{executablePath:exe,args:['--no-sandbox']}:{args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:900,height:900}});
const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(400);
let bad=0;
const sgn=e=>e?(e.v*(e.stm==='w'?1:-1)):null;      // from White's side

async function evalOf(fen,waitMs){
  await page.evaluate((fen)=>{
    const app=window.__APPHOOK__.app;
    app.view='livegame';
    app.live={kind:'game',idx:-1,url:'',white:'W',black:'B',side:'w',flip:false,
      fens:[fen],moves:[],pos:0,follow:false,turn:fen.split(' ')[1],moveBy:0,
      lastActivity:0,tc:'',event:'',rated:true,result:null,err:null,polling:false};
    app._liveKey=null;app.liveEv=null;app.liveBest=null;app.liveLines=[];app.liveEngErr=false;
    window.__APPHOOK__.render();
  },fen);
  for(let i=0;i<Math.ceil(waitMs/500);i++){
    const st=await page.evaluate(()=>{const a=window.__APPHOOK__.app;
      return {ev:a.liveEv,best:a.liveBest,n:(a.liveLines||[]).length,err:a.liveEngErr};});
    if(st.ev)return st;
    await page.waitForTimeout(500);
  }
  return {ev:null,best:null,n:0,err:true};
}
console.log('--- positions with a known answer');
for(const [name,fen,want] of [
  ['starting position',        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',      'level'],
  ['White a queen up',         'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',      'white'],
  ['Black a queen up',         'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',      'black'],
  ['mate in one for White',    '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',                             'mateW'],
  ['mate in one for Black',    'r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1',                             'mateB'],
  ['White already checkmated', 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', 'over'],
  ['stalemate',                '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',                                'over'],
]){
  const st=await evalOf(fen,25000),ev=st.ev,v=sgn(ev);
  const label=await page.evaluate(()=>window.__APPHOOK__.evalLabel(window.__APPHOOK__.app.liveEv));
  const okk = !ev ? false
    : want==='level' ? (ev.t==='cp'&&Math.abs(ev.v)<=80)
    : want==='white' ? (ev.t==='mate'?v>0:v>=600)
    : want==='black' ? (ev.t==='mate'?v<0:v<=-600)
    : want==='mateW' ? (ev.t==='mate'&&v>0)
    : want==='mateB' ? (ev.t==='mate'&&v<0)
    : /* over */       (!!ev.over&&!st.err&&st.n===0);
  if(!okk)bad++;
  console.log((okk?'  ok  ':'  !!  ')+name.padEnd(26)+String(label).padEnd(24)+
    ' d'+String(ev&&ev.d).padEnd(3)+' best '+((st.best&&st.best.san)||'—'));
}

console.log('--- stepping faster than the engine can answer');
for(const f of ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1']){
  await page.evaluate((fen)=>{const a=window.__APPHOOK__.app;
    a.live.fens=[fen];a.live.pos=0;a.live.turn=fen.split(' ')[1];
    a._liveKey=null;a.liveEv=null;a.liveBest=null;a.liveLines=[];
    window.__APPHOOK__.render();},f);
  await page.waitForTimeout(250);
}
let fin=null;
for(let i=0;i<60;i++){
  fin=await page.evaluate(()=>{const a=window.__APPHOOK__.app;return a.liveEv||null;});
  if(fin)break;await page.waitForTimeout(500);
}
const v=sgn(fin), okStep = v!==null&&v<=-600;
if(!okStep)bad++;
console.log((okStep?'  ok  ':'  !!  ')+'the evaluation belongs to the position on screen (Black a queen up): '+v);

console.log('--- Game Review on a game with one known blunder');
await page.evaluate(()=>{window.__APPHOOK__.reviewStart(
  ['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','d5','exd5','Nxd5'].map(s=>({san:s})),null,
  {side:'b',opp:'W',event:'check'});});
let R=null;
for(let i=0;i<240;i++){
  R=await page.evaluate(()=>{const r=window.__APPHOOK__.app.review;
    return r?{status:r.status,classes:r.classes,accW:r.accW,accB:r.accB,key:r.key}:null;});
  if(R&&(R.status==='done'||R.status==='error'))break;
  await page.waitForTimeout(1000);
}
if(!R||R.status!=='done'){bad++;console.log('  !!  the review did not finish ('+(R&&R.status)+')');}
else{
  const nxd5=R.classes[9], theory=R.classes.slice(0,9).every(c=>c==='book'||c==='best'||c==='good');
  const okB=(nxd5==='mistake'||nxd5==='blunder'), okT=theory;
  if(!okB)bad++; if(!okT)bad++;
  console.log((okB?'  ok  ':'  !!  ')+'5...Nxd5, which loses a piece, is a '+nxd5);
  console.log((okT?'  ok  ':'  !!  ')+'and the theory before it is not accused: '+R.classes.slice(0,9).join(' '));
  console.log('      key moment: '+JSON.stringify(R.key)+'   accuracy W '+R.accW+'% / B '+R.accB+'%');
}
console.log('\n'+(bad?'❌ '+bad+' engine check(s) failed':'✅ engine checks passed')+
  (errs.length?'  ('+errs.length+' page errors: '+errs.slice(0,2).join(' | ')+')':''));
await browser.close();server.close();
process.exit(bad||errs.length?1:0);
