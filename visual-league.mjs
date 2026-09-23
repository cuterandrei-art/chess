/* Sign for a club, play a board, and watch the table move. */
import http from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { chromium } from 'playwright-core';
const HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
const CACHE='.cache/stockfish.js';
if(!existsSync(CACHE)){
  mkdirSync('.cache',{recursive:true});
  process.stdout.write('downloading Stockfish… ');
  const r=await fetch('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
  if(!r.ok){console.error('could not fetch the engine ('+r.status+')');process.exit(1);}
  writeFileSync(CACHE,await r.text()); console.log('ok');
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
const txt=()=>page.locator('#app').innerText();
const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(300);};
const club=()=>page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('opening-trainer-standalone-v1'));
  return s.career?s.career.club:null;});

await go('career');
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);
await page.click('[data-act="careertab"][data-val="life"]'); await page.waitForTimeout(500);
await page.screenshot({path:SP+'/lg-1-nojoin.png',fullPage:true});
let t=await txt();
ok(/Club league/.test(t),'the Life tab offers the club league');
ok(/four boards a match/.test(t),'explaining what a season is');
await page.click('[data-act="joinclub"]'); await page.waitForTimeout(600);
await page.screenshot({path:SP+'/lg-2-joined.png',fullPage:true});
t=await txt();
ok(/Division 1/.test(t),'a master signs for a Division 1 club, not the bottom one');
ok(/Round 1 of 5/.test(t),'with five matches to play');
ok(/Play board one/.test(t),'and your board waiting');
ok(/pts/i.test(t)&&/boards/i.test(t),'the league table is there');
ok(/home to|away at/.test(t),'the fixture says where it is played');
let L=await club();
ok(L.clubs.length===6,'six clubs in the division');
ok(L.team.length===3,'and three team-mates behind you');
ok(L.team.every(m=>t.indexOf(m.name)>=0),'all of them named on the team sheet');

/* play your board and resign it — the match still resolves around you */
await page.click('[data-act="careerleague"]');
await page.waitForTimeout(1400);
t=await txt();
ok(/board 1/.test(t),'playing starts a real game on board one');
ok(L.name&&t.indexOf(L.name)>=0,'for your club');
/* play a move before resigning, so there is a game to archive */
const ourTurn=async()=>{
  for(let i=0;i<120;i++){
    const g=await page.evaluate(()=>{const r=localStorage.getItem('chess-career-resume-v1');return r?JSON.parse(r):null;});
    if(g&&g.fen.split(' ')[1]===g.side)return g;
    await page.waitForTimeout(500);
  }
  return null;
};
const g0=await ourTurn();
ok(!!g0,'the game hands us the move');
const asW=g0.side==='w';
await page.click(`[data-sq="${asW?'e2':'e7'}"]`); await page.waitForTimeout(160);
await page.click(`[data-sq="${asW?'e4':'e5'}"]`); await page.waitForTimeout(700);
await page.screenshot({path:SP+'/lg-3-game.png',fullPage:true});
await page.click('[data-act="presign"]');
await page.waitForTimeout(300);
const yes=page.locator('[data-act="confirmyes"]');
if(await yes.count())await yes.click();
await page.waitForTimeout(1200);
await page.screenshot({path:SP+'/lg-4-after.png',fullPage:true});
await go('career');
await page.click('[data-act="careertab"][data-val="life"]'); await page.waitForTimeout(600);
await page.screenshot({path:SP+'/lg-5-table.png',fullPage:true});
t=await txt();
L=await club();
ok(L.round===1,'the round is done');
ok(L.fixtures[0].mine===0,'your loss is on board one');
ok(L.fixtures[0].boards.length===4,'and the other three boards were played');
ok(/Round 2 of 5/.test(t),'the panel moves to the next round');
ok(/Last match, board by board/.test(t),'showing the match board by board');
ok(/Elsewhere in the round/.test(t),'and what happened in the other matches');
const pts=Object.keys(L.table).reduce((a,k)=>a+L.table[k].pts,0);
ok(pts===6,'six match points were handed out across the division');
ok(/✅|🤝|❌/.test(t),'the result of your match is called what it was');

/* the game is archived as a club match, not as a one-off */
const games=await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('opening-trainer-standalone-v1'));
  return (s.career&&s.career.games)||[];});
ok(games.length>=1,'the game went into your archive');
ok(/Div \d/.test(games[0].event)&&games[0].event.indexOf(L.name)>=0,
  'filed under the club match it was ('+games[0].event+')');
ok(games[0].clk&&games[0].clk.length>0,'with the clock readings it was played on');

/* miss a round */
await page.click('[data-act="leagueskip"]');
await page.waitForTimeout(250);
await page.click('[data-act="confirmyes"]');
await page.waitForTimeout(700);
t=await txt();
L=await club();
ok(L.round===2,'missing a round still resolves the match');
ok(L.fixtures[1].missed===true,'and marks it as missed');
ok(/reserve/.test(t)||/Round 3 of 5/.test(t),'a reserve took your board and the season moved on');
await page.screenshot({path:SP+'/lg-6-missed.png',fullPage:true});

/* run the season out by simulating the rest, then check promotion/relegation ran */
for(let i=0;i<3;i++){
  const skip=page.locator('[data-act="leagueskip"]');
  if(!await skip.count())break;
  await skip.click(); await page.waitForTimeout(200);
  await page.click('[data-act="confirmyes"]'); await page.waitForTimeout(600);
}
t=await txt();
L=await club();
ok(L.season===2,'five rounds later a new season has started');
ok(L.history.length===1,'with the last one written down');
ok(/Seasons/.test(t),'and shown on the panel');
ok(/Season 1 · Division 1/.test(t),'naming the season and the division');
await page.screenshot({path:SP+'/lg-7-season2.png',fullPage:true});

/* desktop */
await page.setViewportSize({width:1280,height:900});
await page.waitForTimeout(400);
await page.screenshot({path:SP+'/lg-8-desktop.png'});

console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,10).join('\n')):'\n✅ no page errors');
console.log('✅ league visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
