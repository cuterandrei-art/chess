/* A career game must survive the app being closed. Play some moves, reload,
   and check the position, the clocks and the move list all come back. */
import http from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { chromium } from 'playwright-core';
const HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
/* The bot needs a real engine, and the bundled Chromium cannot reach the CDN
   through this sandbox's proxy — so Node fetches it and the page is served it. */
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
const server = http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:430,height:920}});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};

const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(250);};
const txt=()=>page.locator('#app').innerText();
const state=()=>page.evaluate(()=>{
  const raw=localStorage.getItem('chess-career-resume-v1');
  return raw?JSON.parse(raw):null;});

/* ---- start a career and a tournament round ---- */
await go('career');
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(400);
await page.locator('[data-act="careerjoin"]').first().click(); await page.waitForTimeout(400);
await page.click('[data-act="careerplay"]'); await page.waitForTimeout(1200);

/* Wait until it is our move — the bot's classical thinking time is real. */
const ourTurn=async()=>{
  for(let i=0;i<120;i++){
    const g=await state();
    if(g&&g.fen.split(' ')[1]===g.side)return g;
    await page.waitForTimeout(500);
  }
  return null;
};
const mv=async (a,z)=>{await page.click(`[data-sq="${a}"]`).catch(()=>{});await page.waitForTimeout(140);
  await page.click(`[data-sq="${z}"]`).catch(()=>{});await page.waitForTimeout(400);};
let s0=await ourTurn();
ok(!!s0,'the game starts and hands us the move');
// two sound moves for whichever colour we were drawn
const asW=s0.side==='w';
await mv(asW?'e2':'e7',asW?'e4':'e5');
await ourTurn();
await mv(asW?'g1':'b8',asW?'f3':'c6');
await page.waitForTimeout(600);
let s=await state();
ok(s&&s.v===1,'the game is written down while it is being played');
ok(s.moves.length>=2,'with the moves played so far ('+s.moves.length+')');
ok(!!s.fen&&s.fen!==s.startFen,'and the position they led to');
ok(!!s.clock&&s.clock.w>0&&s.clock.b>0,'both clocks are kept ('+Math.round(s.clock.w/1000)+'s / '+Math.round(s.clock.b/1000)+'s)');
ok(s.career&&s.career.tour===true,'it knows this is a tournament round');
ok(s.career.tourId&&s.career.round===0,'and which round of which event');
const beforeMoves=s.moves.map(m=>m.san).join(' ');
const beforeFen=s.fen, beforeClock=s.clock.w;
const beforeScreen=await txt();
await page.screenshot({path:SP+'/re-1-midgame.png',fullPage:true});
console.log('  · before: '+beforeMoves);

/* ---- the app goes away ---- */
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(800);
await page.screenshot({path:SP+'/re-2-offer.png',fullPage:true});
let after=await txt();
ok(/You have a game in progress/.test(after),'after a reload the career offers the game back');
ok(/Resume the game/.test(after),'with a button to pick it up');
ok(/move \d/.test(after),'saying where it stopped');

/* the tournament round offers Resume rather than a fresh game */
ok(/Resume ▸/.test(after),'and the round itself says Resume, not Play');
ok(!/Play ▸/.test(after),'so a half-played round cannot be silently restarted');

/* ---- resume it ---- */
await page.click('[data-act="presume"]');
await page.waitForTimeout(1200);
await page.screenshot({path:SP+'/re-3-resumed.png',fullPage:true});
const back=await page.evaluate(()=>({fen:window.__F?window.__F():null}));
s=await state();
ok(s.fen===beforeFen||s.moves.length>=beforeMoves.split(' ').length,'the game comes back where it was');
const resumed=await txt();
beforeMoves.split(' ').forEach(function(san){
  ok(resumed.indexOf(san)>=0,'the move list still has '+san);
});
ok(/\d+:\d\d/.test(resumed),'the clocks are running again');
const clockNow=(await state()).clock.w;
ok(Math.abs(clockNow-beforeClock)<120000,'and they did not reset to the full time ('+Math.round(clockNow/1000)+'s vs '+Math.round(beforeClock/1000)+'s)');

/* ---- every entry point into the round must resume, not restart ---- */
await go('career');
await page.waitForTimeout(400);
const mgr=page.locator('[data-act="careerplay"]');
if(await mgr.count()){
  const n0=(await state()).moves.length;
  await mgr.first().click();
  await page.waitForTimeout(1200);
  const n1=(await state()).moves.length;
  ok(n1>=n0,'the manager panel\u2019s own Play button resumes the game rather than restarting it ('+n0+' \u2192 '+n1+' moves)');
}else ok(true,'no second entry point to check');

/* ---- play on, and finish the game: the save must not outlive it ---- */
await page.click('[data-act="presign"]').catch(()=>{});
await page.waitForTimeout(300);
const yes=page.locator('[data-act="confirmyes"]');
if(await yes.count())await yes.click();
await page.waitForTimeout(900);
s=await state();
ok(s===null,'resigning clears the saved game — a finished game is never offered back');
await page.screenshot({path:SP+'/re-4-after-resign.png',fullPage:true});
await go('career');
await page.waitForTimeout(400);
const careerNow=await txt();
ok(!/You have a game in progress/.test(careerNow),'and the career screen stops offering it');

/* ---- discarding ---- */
await page.locator('[data-act="careerplay"]').first().click().catch(()=>{});
await page.waitForTimeout(1200);
const s2=await ourTurn();
await mv(s2.side==='w'?'e2':'e7',s2.side==='w'?'e4':'e5');
await page.waitForTimeout(500);
ok((await state())!==null,'a new round is saved in its turn');
await go('career');
await page.waitForTimeout(400);
ok(/You have a game in progress/.test(await txt()),'and offered back from the career screen');
await page.click('[data-act="presumediscard"]');
await page.waitForTimeout(250);
await page.click('[data-act="confirmyes"]');
await page.waitForTimeout(400);
ok((await state())===null,'discarding it throws it away');
ok(!/You have a game in progress/.test(await txt()),'and the offer goes with it');
await page.screenshot({path:SP+'/re-5-discarded.png',fullPage:true});

/* ---- a free game against the engine resumes too ---- */
await go('play');
await page.waitForTimeout(300);
const white=page.locator('[data-act="pstart"][data-val="w"]');
if(await white.count())await white.click();
else await page.locator('[data-act="pstart"]').first().click();
await page.waitForTimeout(900);
await ourTurn();
await mv('d2','d4');
await page.waitForTimeout(500);
ok((await state())!==null,'a free game against the engine is kept as well');
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(700);
await go('play');
await page.waitForTimeout(300);
const playScreen=await txt();
ok(/You have a game in progress/.test(playScreen),'and offered back on the Play screen');
await page.screenshot({path:SP+'/re-6-free-offer.png',fullPage:true});
await page.click('[data-act="presume"]');
await page.waitForTimeout(900);
ok(/d4/.test(await txt()),'resuming a free game brings its moves back');
await page.screenshot({path:SP+'/re-7-free-resumed.png',fullPage:true});

console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,10).join('\n')):'\n✅ no page errors');
console.log('✅ resume: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
