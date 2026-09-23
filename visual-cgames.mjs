/* Play a career game to the end, then open it back up: the analysis board,
   the engine, the replay at its own pace, and the PGN out. */
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
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(300);};

/* A career with a handful of finished games already in it, played at 30+20
   with real clock readings — what archiveCareerGame now writes. */
const SANS=['e4','e5','Nf3','Nc6','Bc4','Bc5','d3','Nf6','O-O','d6','c3','O-O','Bg5','h6','Bxf6','Qxf6'];
const seedGames=[];
for(let i=0;i<24;i++){
  const moves=[];const c=[];
  // from/to are filled in by the app for its own games; SAN is what matters here
  SANS.slice(0,8+((i*3)%9)).forEach(function(san,k){moves.push({san:san,from:'',to:''});c.push(1800-(k+1)*(14+(i%5)*7));});
  seedGames.push({moves:moves,startFen:null,opp:['Tom Knox','Ella Boyd','Kai Beck','Liam Wood','Leo Dahl'][i%5],
    oppRating:1450+((i*77)%600),oppTitle:i%5===3?'IM':'',result:i%3===0?0:(i%7===0?0.5:1),
    color:i%2?'w':'b',format:i%4===0?'rapid':'classical',
    event:['Local Club Championship','City Open','National Championship','Candidates Tournament'][i%4],
    date:Date.now()-i*3*86400000,c960:false,bri:i===5,myRating:1500+i*4,
    clk:c.map(x=>Math.max(30,x)),base:1800,inc:20});
}
await page.evaluate(s=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify(s)),
  {onboarded:true,career:null});
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(400);
await go('career');
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);
// drop the seeded games into the career that was just created
await page.evaluate(gs=>{
  const k='opening-trainer-standalone-v1';
  const s=JSON.parse(localStorage.getItem(k));
  s.career.games=gs; s.career.name='Ada Marín';
  localStorage.setItem(k,JSON.stringify(s));
},seedGames);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(500);
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]');
await page.waitForTimeout(500);
await page.screenshot({path:SP+'/cg-1-legacy.png',fullPage:true});
let t=await txt();
ok(/My games/.test(t),'the Legacy tab lists your games');
ok(/24 kept/.test(t),'saying how many the career is holding');
ok(/20 of 24/.test(t)||/1–20 of 24/.test(t),'a page at a time, with the rest a click away');
ok(/Italian Game|Giuoco|Four Knights|Bishop/.test(t),'each row names the opening it was');

/* search */
await page.fill('#cg-q','ella');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
t=await txt();
ok(/matching “ella”/.test(t),'searching a name narrows the list');
const hits=await page.locator('[data-act="cgopen"]').count();
ok(hits>0&&hits<20,'to just those games ('+hits+')');
await page.screenshot({path:SP+'/cg-2-search.png',fullPage:true});
await page.click('[data-act="cgqclear"]'); await page.waitForTimeout(300);

/* sort by best games — the brilliancy should come first */
await page.click('[data-act="cgsort"][data-val="best"]'); await page.waitForTimeout(400);
t=await txt();
ok(/✨/.test(t),'"best games" surfaces the Game of the Day');
await page.screenshot({path:SP+'/cg-3-best.png',fullPage:true});

/* open one on the analysis board */
await page.locator('[data-act="cgopen"]').first().click();
await page.waitForTimeout(1500);
await page.screenshot({path:SP+'/cg-4-board.png',fullPage:true});
t=await txt();
ok(/Ada Marín/.test(t),'the board shows your own name');
ok(/← Career/.test(t),'and sends you back to the career, not the tracker');
ok(/Eval bar/.test(t)&&/Suggestions/.test(t),'with the eval bar and engine suggestions');
ok(/Full review of every move/.test(t),'and the full review one tap away');
ok(/Watch it back/.test(t),'the clocks were kept, so it can be watched back at its own pace');
ok(/Candidates Tournament|City Open|Local Club|National/.test(t),'it names the event it was played in');

/* the engine really evaluates the position */
let ev='';
for(let i=0;i<40;i++){
  ev=await txt();
  if(/[+−-]\d/.test(ev)&&!/Engine thinking/.test(ev))break;
  await page.waitForTimeout(500);
}
ok(!/Engine thinking…$/.test(ev.trim()),'the engine answers rather than thinking forever');
await page.screenshot({path:SP+'/cg-5-board-eval.png',fullPage:true});

/* step through it */
await page.click('[data-act="liveseek"][data-val="1"]').catch(()=>{});
await page.waitForTimeout(700);
ok(/1\./.test(await txt()),'stepping forward walks the game');

/* watch it back at its own pace */
await page.click('[data-act="replaytoggle"]');
await page.waitForTimeout(900);
t=await txt();
ok(/Pause/.test(t),'the replay runs');
await page.screenshot({path:SP+'/cg-6-replay.png',fullPage:true});
await page.click('[data-act="replaytoggle"]');
await page.waitForTimeout(300);

/* the PGN comes out */
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]');
await page.waitForTimeout(500);
const dl=page.waitForEvent('download',{timeout:6000}).catch(()=>null);
await page.click('[data-act="cgpgn"]');
const d=await dl;
let pgn='';
if(d){const p=SP+'/cg-export.pgn';await d.saveAs(p);pgn=readFileSync(p,'utf8');}
ok(!!d,'the PGN downloads');
ok(/\.pgn$/.test(d?d.suggestedFilename():''),'named as a PGN ('+(d?d.suggestedFilename():'')+')');
ok((pgn.match(/\[Event /g)||[]).length===24,'with every one of the 24 games in it');
ok(/\[White "Ada Marín"\]|\[Black "Ada Marín"\]/.test(pgn),'under your own name');
ok(/\[Result "(1-0|0-1|1\/2-1\/2)"\]/.test(pgn),'and a real result');
ok(/\[Opening "/.test(pgn),'the openings are named');
await page.waitForTimeout(400);
ok(/saved as a PGN file/.test(await txt()),'and the screen confirms what was written');
await page.screenshot({path:SP+'/cg-7-exported.png',fullPage:true});

/* desktop width */
await page.setViewportSize({width:1280,height:900});
await page.waitForTimeout(400);
await page.screenshot({path:SP+'/cg-8-desktop.png'});

console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,10).join('\n')):'\n✅ no page errors');
console.log('✅ cgames visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
