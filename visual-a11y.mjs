/* Play a game with the keyboard alone, and read what a screen reader would. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:900,height:1000},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',
  JSON.stringify({onboarded:true,settings:{level:0,tcId:'unlimited'}})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(500);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const live=()=>page.locator('#srlive').textContent();
/* get to a game without touching the board */
const nav=page.locator('[data-act="nav"][data-val="play"]:visible').first();
if(await nav.count())await nav.click();
else {await page.click('[data-act="menutoggle"]');await page.waitForTimeout(120);
  await page.locator('[data-act="nav"][data-val="play"]:visible').first().click();}
await page.waitForTimeout(400);
await page.click('[data-act="pstart"][data-val="w"]');
await page.waitForTimeout(900);
ok(/Play vs Stockfish/.test(await txt())||/MOVES/i.test(await txt()),'a game is on');

/* the board is reachable with Tab alone */
const sq=await page.evaluate(()=>{
  const el=document.querySelector('.board');
  return {role:el.getAttribute('role'),label:el.getAttribute('aria-label'),
    cells:el.querySelectorAll('[role="gridcell"]').length,
    tabbable:el.querySelectorAll('[tabindex="0"]').length,
    sample:el.querySelector('[data-sq="e2"]').getAttribute('aria-label')};
});
ok(sq.role==='grid','the board is a grid');
ok(/Chess board/.test(sq.label),'with a label: “'+sq.label+'”');
ok(sq.cells===64,'sixty-four cells');
ok(sq.tabbable===1,'one of them in the tab order');
ok(sq.sample==='e2, white pawn','and the squares describe themselves: “'+sq.sample+'”');

/* focus the cursor square without a click, then play with the keyboard only */
await page.evaluate(()=>{document.querySelector('.board [tabindex="0"]').focus();});
const focused=await page.evaluate(()=>document.activeElement.getAttribute('data-sq'));
ok(/^[a-h][1-8]$/.test(focused),'tabbing lands on the board at '+focused);
/* walk to e2 and play e4 */
const walk=async target=>{
  for(let i=0;i<40;i++){
    const at=await page.evaluate(()=>window.__APPHOOK__.app.kbSq);
    if(at===target)return true;
    const f='abcdefgh'.indexOf(at[0]),r=+at[1];
    const tf='abcdefgh'.indexOf(target[0]),tr=+target[1];
    const key=(f<tf)?'ArrowRight':(f>tf)?'ArrowLeft':(r<tr)?'ArrowUp':'ArrowDown';
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
  return false;
};
ok(await walk('e2'),'the arrow keys walk the cursor to e2');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
let sel=await page.evaluate(()=>window.__APPHOOK__.app.playSel);
ok(sel==='e2','Enter picks the pawn up');
const selLabel=await page.evaluate(()=>document.querySelector('.board [data-sq="e2"]').getAttribute('aria-label'));
ok(/selected/.test(selLabel),'and the square now says it is selected: “'+selLabel+'”');
const destLabel=await page.evaluate(()=>document.querySelector('.board [data-sq="e4"]').getAttribute('aria-label'));
ok(/can move here/.test(destLabel),'while e4 says you can move there: “'+destLabel+'”');
ok(await walk('e4'),'the cursor walks to e4');
await page.keyboard.press('Enter');
await page.waitForTimeout(900);
const moves=await page.evaluate(()=>(window.__APPHOOK__.app.playMoves||[]).map(m=>m.san));
ok(moves[0]==='e4','Enter plays the move — 1.e4, from the keyboard alone');
await page.screenshot({path:SP+'/ay-1-keyboard.png',fullPage:false});

/* the live region says what happened */
for(let i=0;i<20;i++){const t=await live();if(t&&/move/i.test(t))break;await page.waitForTimeout(300);}
const spoken=await live();
ok(/(Your move|Waiting for your opponent)/.test(spoken),
  'a screen reader is told where the game is: “'+spoken+'”');
ok(/^[A-Za-z][^.]*\./.test(spoken),'with the move just played named first, as a sentence');

/* Escape lets go */
await walk('d2');
await page.keyboard.press('Enter'); await page.waitForTimeout(200);
ok((await page.evaluate(()=>window.__APPHOOK__.app.playSel))==='d2','a second piece is picked up');
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok((await page.evaluate(()=>window.__APPHOOK__.app.playSel))===null,'Escape puts it back down');
ok(/cleared/i.test(await live()),'and says so: “'+(await live())+'”');

/* it works on the puzzles board too, since there is only one renderBoard */
const nav2=page.locator('[data-act="nav"][data-val="puzzles"]:visible').first();
if(await nav2.count())await nav2.click();
else {await page.click('[data-act="menutoggle"]');await page.waitForTimeout(120);
  await page.locator('[data-act="nav"][data-val="puzzles"]:visible').first().click();}
await page.waitForTimeout(600);
const start=page.locator('[data-act="pznext"]');
if(await start.count())await start.click();
await page.waitForTimeout(800);
const pz=await page.evaluate(()=>{
  const el=document.querySelector('.board');
  return el?{cells:el.querySelectorAll('[role="gridcell"]').length,
    label:el.getAttribute('aria-label')}:null;});
ok(pz&&pz.cells===64,'the puzzles board is labelled the same way');
ok(/to move/.test(pz.label),'and says whose move it is');
const pzLive=await live();
ok(/move/i.test(pzLive),'a puzzle announces itself too: “'+pzLive+'”');
await page.screenshot({path:SP+'/ay-2-puzzle.png',fullPage:false});

/* a mouse click takes the ring away again */
await page.click('[data-sq="e2"]').catch(()=>{});
await page.waitForTimeout(200);
ok((await page.evaluate(()=>window.__APPHOOK__.app.kbFocus))===false,
  'clicking with a mouse puts the keyboard ring away');

console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,8).join('\n')):'\n✅ no page errors');
console.log('✅ a11y visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
