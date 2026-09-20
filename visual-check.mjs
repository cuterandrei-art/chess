import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
const HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
const server = http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:850}});
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
const menu=async v=>{
  const direct=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await direct.count()&&await direct.isVisible()){await direct.click();}
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(80);await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(140);};
const tab=async t=>{await page.click(`[data-act="careertab"][data-val="${t}"]`);await page.waitForTimeout(120);};

// 1) career setup — pace + starting strength
await menu('career');
await page.screenshot({path:SP+'/v-setup.png'});
// choose Master start + Accelerated, begin
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(150);
await page.screenshot({path:SP+'/v-career-play.png'}); // shows quests + pace tag + daily

// 2) You tab — cosmetic unlocks
await page.click('[data-act="careertab"][data-val="you"]'); await page.waitForTimeout(120);
await page.screenshot({path:SP+'/v-career-you.png'});

// 2a) You tab already captured above; grab the avatar customiser full-page
await page.screenshot({path:SP+'/v-career-you-full.png',fullPage:true});

// 2b) World tab — living feed
await tab('world');
await page.screenshot({path:SP+'/v-career-world.png'});
await tab('play');

// 3) Play screen — bots gallery
await menu('play'); await page.waitForTimeout(120);
await page.screenshot({path:SP+'/v-play-setup.png',fullPage:true});

// 4) Guess the Move
await menu('guess'); await page.waitForTimeout(150);
await page.screenshot({path:SP+'/v-guess.png'});

console.log('page/console errors:',errs.length, errs.slice(0,6));
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
console.log('horizontal overflow px (guess view):',overflow);
await browser.close(); server.close(); console.log('done');
