/* In a real browser: the board editor (tap and drag), your own tournament's
   planner, a career begun in 1972, and the widget's preview in Settings. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,worldRanking:worldRanking,worldChampion:worldChampion,edFen:edFen};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:false});
const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const H=(fn,a)=>page.evaluate(fn,a);
const txt=()=>page.locator('#app').innerText();
const fen=()=>H(()=>window.__APPHOOK__.edFen());
const center=async sel=>{const bb=await page.locator(sel).boundingBox();return {x:bb.x+bb.width/2,y:bb.y+bb.height/2};};

/* ---- the board editor ---- */
await H(()=>window.__APPHOOK__.go('learn'));await page.waitForTimeout(200);
await page.click('[data-act="nav"][data-val="editor"]');await page.waitForTimeout(300);
ok(/Board editor/.test(await txt())&&await page.locator('.edpc').count()===12,'Learn opens the board editor: twelve pieces in the trays');
await page.click('[data-act="edclear"]');await page.waitForTimeout(150);
ok(/White needs a king/.test(await page.locator('#edstate').innerText()),'cleared: it says what is missing');
await page.click('[data-act="edtool"][data-val="wK"]');await page.click('.board [data-sq="g1"]');
await page.click('[data-act="edtool"][data-val="bK"]');await page.click('.board [data-sq="e8"]');await page.waitForTimeout(150);
ok((await fen()).startsWith('4k3/8/8/8/8/8/8/6K1 w')&&/A legal position/.test(await page.locator('#edstate').innerText()),'tap a piece, tap a square: two kings, and legal');
// drag a rook from the tray onto a1
let from=await center('[data-edpc="wR"]'),to=await center('.board [data-sq="a1"]');
await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(from.x+20,from.y-20,{steps:3});await page.mouse.move(to.x,to.y,{steps:6});await page.mouse.up();await page.waitForTimeout(200);
ok((await fen()).startsWith('4k3/8/8/8/8/8/8/R5K1'),'a rook dragged in from the tray');
// drag it across the board
from=await center('.board [data-sq="a1"]');to=await center('.board [data-sq="a7"]');
await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(from.x+10,from.y-10,{steps:2});await page.mouse.move(to.x,to.y,{steps:6});await page.mouse.up();await page.waitForTimeout(200);
ok((await fen()).startsWith('4k3/R7/8/8/8/8/8/6K1'),'and dragged up the board to a7');
await page.screenshot({path:SP+'/org-1-editor.png'});
await page.click('[data-act="edana"]');await page.waitForTimeout(500);
ok(await H(()=>window.__APPHOOK__.app.view)==='analysis'&&/Position from the editor/.test(await txt()),'“Analyse it” opens the analysis board on it');

/* ---- a career in 1972 ---- */
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(250);
ok(await page.locator('#cr-era').count()===1,'the career setup asks when');
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-fed','ROU');await page.selectOption('#cr-start','master');await page.selectOption('#cr-era','1972');
await page.click('[data-act="careersetup"]');await page.waitForTimeout(600);
ok(await H(()=>{const S=window.__APPHOOK__,c=S.store.career;return c.era==='1972'&&S.worldChampion(c).name==='B. Spassky'&&S.worldRanking(c,'classical').filter(p=>!p.you)[0].name==='R. Fischer';}),'1972: Spassky is champion, Fischer on top of the list');
await page.click('[data-act="careertab"][data-val="world"]');await page.waitForTimeout(400);
ok(/Fischer/.test(await txt())&&/1972/.test(await txt()),'the World tab is 1972’s');
await page.screenshot({path:SP+'/org-2-1972.png'});

/* ---- your own tournament ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.money=200000;c.age=30;S.app.careerTab='life';S.save();S.render();});await page.waitForTimeout(400);
await page.locator('#owncard').scrollIntoViewIfNeeded();
await page.click('#owncard [data-act="ownplan"]');await page.waitForTimeout(300);
ok(await page.locator('#owncard select[data-own="week"]').count()===1&&/The budget/.test(await page.locator('#owncard').innerText()),'the planner: week, format, fund, sponsor and a budget');
await page.selectOption('#owncard select[data-own="fmt"]','rr');await page.waitForTimeout(250);
ok(await page.inputValue('#owncard input[data-own="name"]')==='Bucharest Masters','a round-robin: Bucharest Masters');
await page.locator('#owncard [data-act="owninv"]').first().click();await page.waitForTimeout(250);
ok(await page.locator('#owncard [data-act="ownuninv"]').count()===1,'one player invited');
await page.locator('#owncard').screenshot({path:SP+'/org-3-planner.png'});
await page.click('#owncard [data-act="ownsave"]');await page.waitForTimeout(350);
ok(await H(()=>!!(window.__APPHOOK__.store.career.wx.own))&&/Bucharest Masters/.test(await page.locator('#owncard').innerText())&&/Change the plan/.test(await page.locator('#owncard').innerText()),'founded: the card has its name and the plan');

/* ---- the widget ---- */
await H(()=>window.__APPHOOK__.go('settings'));await page.waitForTimeout(300);
const wg=page.locator('#widgetcard');
ok(await wg.count()===1&&/Ada Marín/.test(await wg.innerText())&&/1972/.test(await wg.innerText()),'Settings: a preview of the home-screen widget');
await wg.screenshot({path:SP+'/org-4-widget.png'});

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ the board editor, another era, your own tournament and the widget in a browser: '+pass+' checks passed');
await b.close(); server.close();
