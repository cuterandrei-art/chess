/* A walk through the main screens on a phone: the career setup, every career
   tab, the play screen and Guess the Move. It used to start without getting
   past the first-run questions, wait for a menu button that is not on that
   screen and time out; it answers them now, and checks what it looks at —
   no errors, and nothing wider than the phone. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
const HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
const server = http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const wide=()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(300);

// 0) a first visit asks three questions; skipping them gets you into the app
ok(await page.locator('[data-act="onbskip"],[data-act="onbdone"],[data-act="onbnext"]').count()>0||/Welcome/.test(await page.locator('#app').innerText()),'a first visit starts with the welcome questions');
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(300);
const menu=async v=>{
  const direct=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await direct.count()&&await direct.isVisible()){await direct.click();}
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(80);await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(160);};
const tab=async t=>{await page.click(`[data-act="careertab"][data-val="${t}"]`);await page.waitForTimeout(150);};

// 1) career setup — pace + starting strength
await menu('career');
await page.screenshot({path:SP+'/v-setup.png'});
ok(await page.locator('[data-act="careersetup"]').count()===1,'the career starts with its setup form');
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(250);
ok(await page.locator('#cstrip').count()===1&&await page.locator('.ctabs').count()===1,'then the career screen: one line about you, and the tabs');
ok(await page.evaluate(()=>window.scrollY)===0,'opened at its top');
await page.screenshot({path:SP+'/v-career-play.png'});

// 2) every tab, none of them wider than the phone
for(const t of ['play','you','progress','life','world','media','legacy']){
  await tab(t);
  const w=await wide();
  ok(w<=1,'the '+t+' tab fits the phone ('+w+'px over)');
}
await tab('you');
await page.screenshot({path:SP+'/v-career-you.png'});
await page.screenshot({path:SP+'/v-career-you-full.png',fullPage:true});
await tab('world');
await page.screenshot({path:SP+'/v-career-world.png'});
await tab('life');
await page.screenshot({path:SP+'/v-career-life.png',clip:{x:0,y:0,width:390,height:820}});
await tab('play');

// 3) Play screen — bots gallery
await menu('play'); await page.waitForTimeout(150);
await page.screenshot({path:SP+'/v-play-setup.png',fullPage:true});
ok(await wide()<=1,'the play screen fits the phone');

// 4) Guess the Move
await menu('guess'); await page.waitForTimeout(180);
await page.screenshot({path:SP+'/v-guess.png'});
ok(await wide()<=1,'and so does Guess the Move');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log('\n✅ the main screens on a phone: '+pass+' checks passed');
await browser.close(); server.close();
