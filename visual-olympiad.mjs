/* Play an Olympiad in a browser and watch the country's table move. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,'+
    'lifeInit:lifeInit,publishRating:publishRating};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:430,height:960},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(300);};

await go('career');
await page.fill('#cr-name','Ada Marín').catch(()=>{});
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);

/* a rating that gets you picked for the national team */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;
  H.lifeInit(c);
  c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';c.season=1;c.weeks=37;c.day=0;   // an Olympiad year, in September
  c.rating=2610;c.ratingRapid=2570;c.ratingBlitz=2555;c.provisional=false;
  c.played=80;c.won=40;c.drawn=25;c.lost=15;c.titles=['CM','FM','IM','GM'];
  H.save();H.render();
});
await go('career');
await page.click('[data-act="careertab"][data-val="play"]').catch(()=>{});
await page.waitForTimeout(500);
const join=page.locator('[data-act="careerjoin"][data-val="olympiad"]');
ok(await join.count()>0,'the Olympiad is open to you once your federation picks you');
await join.first().click(); await page.waitForTimeout(700);
let t=await txt();
ok(/Chess Olympiad/.test(t),'you are in it');
ok(/the team sheet/.test(t),'and there is a team sheet, which there never was before');
ok(/ROU/.test(t),'for your own federation');
ok(/YOU/.test(t),'with you on it');
ok(/🌍 Nations/.test(t),'plus a table of the nations');
ok(/Nothing played yet/.test(t),'which starts empty rather than looking wrong');
ok(/Boards two to four/.test(t),'and the team sheet explains itself');

/* your round-one opponent is somebody's board one */
const r1=await page.evaluate(()=>{
  const tr=window.__APPHOOK__.store.career.tour;
  const o=tr.field[0],n=(tr.oly.nations||[]).filter(x=>x.id===o.nat)[0];
  return {opp:o.name,fed:o.fed,flag:o.flag,nat:o.nat,myBoard:tr.oly.myBoard,
    theirSameBoard:n&&n.squad[tr.oly.myBoard-1].name,nationFed:n&&n.c,
    nations:tr.oly.nations.length,mates:tr.oly.mates.length,
    distinct:new Set(tr.field.map(x=>x.nat)).size};
});
ok(r1.nations===12,'twelve nations are in the hall');
ok(r1.mates===3,'you have three team-mates');
ok(r1.distinct===9,'and nine different countries to play');
ok(r1.myBoard>=1&&r1.myBoard<=4,'a captain put you on a board ('+r1.myBoard+')');
ok(r1.opp===r1.theirSameBoard,'and your first opponent is the player on that same board for their country');
ok(r1.fed===r1.nationFed,'and the flag beside them is their country’s');

await page.screenshot({path:SP+'/oly-1-start.png',fullPage:false});

/* play a round */
await page.click('[data-act="simround"]'); await page.waitForTimeout(900);
t=await txt();
ok(/· the match/.test(t),'a round produces a match, not just your own result');
ok(/You (beat|drew with|lost to)/.test(t),'saying what happened to the team');
ok(/Elsewhere/.test(t),'with a word about the other matches');
const board=await page.evaluate(()=>{
  const tr=window.__APPHOOK__.store.career.tour,M=tr.oly.matches[0];
  const N=tr.oly.nations;
  const mine=M.boards.filter(b=>b.you)[0];
  return {boards:M.boards.length,you:!!mine,mine:mine&&mine.score,order:M.boards.map(b=>b.board).join(),
    us:M.us,them:M.them,others:(M.others||[]).length,
    mp:N.reduce((s,n)=>s+(n.mp||0),0),gp:N.reduce((s,n)=>s+(n.gp||0),0),
    byes:(M.others||[]).filter(o=>o.bye).length};
});
ok(board.boards===4,'four boards were played');
ok(board.order==='1,2,3,4','one to four, in order');
ok(board.you&&[0,0.5,1].indexOf(board.mine)>=0,'your own board being the game you played');
ok(Math.abs(board.us+board.them-4)<1e-9,'and the match adds to four points');
const matches=1+board.others-board.byes;
ok(board.mp===matches*2+board.byes*2,'every match handed out exactly two match points');
ok(Math.abs(board.gp-(matches*4+board.byes*2))<1e-9,'and four game points');
ok(/\d\s*$|½/.test(t),'the table has numbers in it now');
const roundNews=await page.evaluate(()=>(window.__APPHOOK__.store.career.news||[]).map(n=>n.t||''));
await page.screenshot({path:SP+'/oly-2-round1.png',fullPage:false});

/* the rest of the event */
await page.click('[data-act="simtour"]'); await page.waitForTimeout(4000);
t=await txt();
ok(/finished/.test(t),'the Olympiad finishes');
ok(/nations/.test(t),'and the banner reports the country as well as you');
const fin=await page.evaluate(()=>window.__APPHOOK__.app.careerOly);
ok(fin&&fin.place>=1&&fin.place<=12,'your team placed somewhere real ('+(fin&&fin.place)+' of '+(fin&&fin.of)+')');
ok(fin.boardRank>=1&&fin.boardRank<=fin.boardOf,'and your board one was ranked against the other board ones');
ok(fin.boardPct>=0&&fin.boardPct<=1,'on a percentage between nought and one');
ok((fin.place<=3)===(fin.team!==null),'a team medal is exactly the top three');
ok((fin.boardRank<=3)===(fin.board!==null),'and a board medal exactly the top three board ones');
const honors=await page.evaluate(()=>window.__APPHOOK__.store.career.honors||[]);
if(fin.team)ok(honors.some(h=>h==='Olympiad Team '+fin.team),'the team medal went into your honours');
else ok(!honors.some(h=>/Olympiad Team/.test(h)),'no medal, no honour — it is not handed out');
if(fin.board)ok(honors.some(h=>h==='Olympiad Board '+fin.board),'and so did the board medal');
else ok(!honors.some(h=>/Olympiad Board [GSB]/.test(h)),'and a board medal is not handed out either');
await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(250);
await page.screenshot({path:SP+'/oly-3-finish.png',fullPage:false});

/* the news remembers how the country finished, not only how you did */
const feed=await page.evaluate(()=>(window.__APPHOOK__.store.career.feed||[]).map(n=>n.t||''));
ok(feed.some(n=>/Olympiad|board ones/.test(n)),
  'the feed says how the country finished — the eight-item news list is full by then');
ok(roundNews.some(n=>/ROU/.test(n)&&/(beat|drew with|lost to)/.test(n)),
  'and carried the match result after every round, not only your own game');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ olympiad in a browser: '+pass+' checks passed');
await b.close(); server.close();
