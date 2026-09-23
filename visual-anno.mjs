/* Read the write-up of a game, in a browser, on both screens that print it. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,'+
    'magPublish:magPublish,lifeInit:lifeInit};\n'+HTML.slice(i); }
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

/* two games in the archive: Légal's mate, and a long Sicilian draw */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;
  H.lifeInit(c); c.name='Ada Marín';
  const mk=(sans,o)=>Object.assign({moves:sans.split(' ').map(s=>({san:s})),startFen:null,
    opp:'Rowan Brunswick',oppRating:2400,oppTitle:'IM',myRating:2280,result:1,color:'w',
    format:'classical',event:'Reykjavík Open',date:Date.now(),bri:false,
    clk:null,base:0,inc:0},o||{});
  c.games=[
    mk('e4 e5 Nf3 Nc6 Bc4 d6 Nc3 Bg4 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#',{result:1,bri:true}),
    mk('e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e6 f3 b5 Qd2 Nbd7 O-O-O Bb7 g4 Be7 h4 O-O g5 Nh5 Kb1',
       {result:0.5,opp:'Tom Knox',oppRating:2260,oppTitle:'FM',event:'City Open',
        date:Date.now()-86400000})];
  H.save(); H.render();
});
await page.click('[data-act="careertab"][data-val="legacy"]'); await page.waitForTimeout(600);
ok(/My games/.test(await txt()),'the archive is on the Legacy tab');

/* ---- the column on the analysis board ---- */
await page.locator('[data-act="cgopen"]').first().click(); await page.waitForTimeout(900);
let t=await txt();
ok(/The game, written up/.test(t),'opening a game brings the write-up with it');
ok(/Reykjavík Open|Sicilian|Philidor|A game that left the book/.test(t),
   'which opens by saying what kind of game it was');
const col=page.locator('.card', {hasText:'The game, written up'}).first();
const notes=await col.locator('[data-act="liveto"]').count();
ok(notes>=3&&notes<=9,'with one button per note, and no more than a column holds ('+notes+')');
await page.screenshot({path:SP+'/an-1-start.png',fullPage:false});

/* step to the queen sacrifice through the column's own button */
const sac=page.locator('button', {hasText:'5. Nxe5'}).first();
ok(await sac.count()>0,'the sacrifice has a button of its own');
await sac.click(); await page.waitForTimeout(600);
t=await txt();
ok(/gave up the queen/.test(t),'clicking it prints the note about the queen');
ok(/You gave up the queen/.test(t),'and credits you, because you were White');
ok(/It worked/.test(t),'and knows it came off, because you won');
const board=await page.evaluate(()=>{
  const sq=[...document.querySelectorAll('.board [data-sq]')];
  const at=s=>{const el=sq.filter(x=>x.dataset.sq===s)[0];return el?(el.getAttribute('aria-label')||''):'';};
  return {e5:at('e5'),d1:at('d1'),pos:document.body.innerText.indexOf('5… Bxd1')};
});
ok(/white knight/.test(board.e5),'and the board is at the position the note is about');
await page.waitForTimeout(600);   // let the piece finish sliding before the shot
await page.locator('.card', {hasText:'The game, written up'}).first()
  .screenshot({path:SP+'/an-2-sac.png'}).catch(()=>{});

/* a move with nothing to say says nothing rather than repeating itself */
await page.locator('[data-act="liveseek"][data-val="-1"]').first().click(); await page.waitForTimeout(500);
t=await txt();
ok(/Nothing to say about this move/.test(t),'a quiet move says so');
ok(!/gave up the queen/.test(t.split('The game, written up')[1].split('Speed')[0]||''),
   'rather than leaving the last note up');

/* the mate is the last word */
await page.locator('[data-act="liveto"]').last().click(); await page.waitForTimeout(500);
t=await txt();
ok(/Mate, 7\. Nd5#/.test(t),'the last note is the mate');
ok(/worth keeping/.test(t),'and the verdict sits under the whole thing');

/* back where it came from */
await page.locator('button', {hasText:'← Career'}).first().click(); await page.waitForTimeout(600);
ok(/My games/.test(await txt()),'the back button returns to the archive it came from');

/* the drawn Sicilian gets a different column, not the same one */
await page.locator('[data-act="cgopen"]').nth(1).click(); await page.waitForTimeout(900);
t=await txt();
ok(/The game, written up/.test(t),'the other game is written up too');
ok(!/Mate/.test(t)||!/gave up the queen/.test(t),'and not with the other game’s notes');
await page.locator('[data-act="liveto"]').last().click(); await page.waitForTimeout(500);
t=await txt();
ok(/opposite wings|Drawn after|first piece/.test(t),'with notes that belong to this game');
await page.locator('button', {hasText:'← Career'}).first().click(); await page.waitForTimeout(600);

/* ---- the column in the magazine ---- */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;
  H.magPublish(c,{season:1,games:31,won:16,drawn:9,lost:6,ratingFrom:2150,ratingTo:2255,
    peakFrom:2150,peakTo:2260,money:4100,fame:6,titles:0,honors:0,norms:2,events:5,bril:1,
    best:{name:'City Open',emoji:'🏙️',place:2,score:6.5,rounds:9}});
  H.save(); H.render();
});
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]'); await page.waitForTimeout(500);
await page.click('[data-act="nav"][data-val="magazine"]'); await page.waitForTimeout(700);
t=await txt();
ok(/Game of the issue/.test(t),'the issue prints a game');
ok(/game of the day/.test(t),'flagged as the one that won a prize');
ok(/Ada Marín – IM Rowan Brunswick/.test(t),'headed the way a game is headed');
ok(/1–0/.test(t),'with the result');
ok(await page.locator('.board').count()===1,'and a board to play it out on');
ok(/Step through it/.test(t),'the notes waiting behind the moves');
await page.screenshot({path:SP+'/an-3-magazine.png',fullPage:false});

/* the stepper works, and the notes appear as you reach them */
const step=page.locator('[data-act="magply"]');
ok(await step.count()>=5,'with a stepper and a button per note');
await page.locator('button', {hasText:'5. Nxe5'}).first().click(); await page.waitForTimeout(500);
t=await txt();
ok(/gave up the queen/.test(t),'reaching the sacrifice prints its note');
ok(!/Step through it/.test(t),'and the placeholder gets out of the way');
const magBoard=await page.evaluate(()=>{
  const sq=[...document.querySelectorAll('.board [data-sq]')];
  const at=s=>{const el=sq.filter(x=>x.dataset.sq===s)[0];return el?(el.getAttribute('aria-label')||''):'';};
  return {e5:at('e5'),last:document.querySelectorAll('.board .lastmove,.board .last').length};
});
ok(/white knight/.test(magBoard.e5),'with the board on the right move');
await page.waitForTimeout(600);
await page.locator('.card', {hasText:'Game of the issue'}).first()
  .screenshot({path:SP+'/an-4-column.png'}).catch(()=>{});

/* and out to the full board, and back to the issue */
await page.click('[data-act="magopen"]'); await page.waitForTimeout(900);
t=await txt();
ok(/The game, written up/.test(t),'the issue hands the game to the analysis board');
ok(/Eval bar/.test(t),'with the engine available, which the magazine page is not');
ok(/← Sixty-Four/.test(t),'and a way back to the issue rather than to the career');
await page.locator('button', {hasText:'← Sixty-Four'}).first().click(); await page.waitForTimeout(700);
ok(/Game of the issue/.test(await txt()),'which really goes back to the issue');

/* it all survives a reload — the issue keeps its own copy of the game */
await page.evaluate(()=>{window.__APPHOOK__.store.career.games=[];window.__APPHOOK__.save();});
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(800);
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]'); await page.waitForTimeout(500);
await page.click('[data-act="nav"][data-val="magazine"]'); await page.waitForTimeout(700);
t=await txt();
ok(/Game of the issue/.test(t),'the issue still prints its game after the archive is emptied');
ok(/Ada Marín – IM Rowan Brunswick/.test(t),'the same game, in full');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ annotated games in a browser: '+pass+' checks passed');
await b.close(); server.close();
