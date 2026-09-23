/* Print an issue and read it. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,magPublish:magPublish,lifeInit:lifeInit,save:save,go:go};\n'+HTML.slice(i); }
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
/* two seasons' worth of issues, from real review payloads */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;
  H.lifeInit(c);
  c.name='Ada Marín';c.titles=['CM','FM'];c.rival={name:'Ella Boyd',id:'x'};
  c.h2h={'Ella Boyd':{w:3,l:1,d:2}};c.youngGun={name:'Kai Beck'};c.reputation=74;c.fame=52;
  c.books=[{id:'b',title:'A book'}];c.weeksAtNo1=3;
  H.magPublish(c,{season:1,games:31,won:16,drawn:9,lost:6,ratingFrom:2150,ratingTo:2255,
    peakFrom:2150,peakTo:2260,money:4100,fame:6,titles:0,honors:0,norms:2,events:5,bril:2,
    best:{name:'City Open',emoji:'🏙️',place:2,score:6.5,rounds:9}});
  H.magPublish(c,{season:2,games:44,won:24,drawn:13,lost:7,ratingFrom:2255,ratingTo:2402,
    peakFrom:2260,peakTo:2410,money:9800,fame:11,titles:1,honors:1,norms:3,events:7,bril:3,
    best:{name:'National Championship',emoji:'🏆',place:1,score:8,rounds:11}});
  c.titles=['CM','FM','IM'];
  H.save();
});
/* the way in is the shelf on the Legacy tab, or the season banner */
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]');
await page.waitForTimeout(500);
ok(/Sixty-Four/.test(await txt()),'the shelf is on the Legacy tab');
ok(/2 issues/.test(await txt()),'counting the issues on it');
await page.screenshot({path:SP+'/mg-3-shelf.png',fullPage:true});
await page.click('[data-act="nav"][data-val="magazine"]');
await page.waitForTimeout(500);
let t=await txt();
ok(/Sixty-Four/.test(t),'the magazine has a masthead');
ok(/Issue 2 · Season 2/.test(t),'the issue is numbered by the season it covers');
ok(!/brilliancyies/.test(t),'and the plurals are right');
ok(/International Master/.test(t),'the front page leads on the title just earned');
ok(/The interview/.test(t)&&/Boyd/.test(t),'the interview asks about your rival by name');
ok(/Around the world/.test(t),'there is a world report');
ok(/Letters/.test(t),'a letters page');
ok(/Next season/.test(t),'and a look ahead');
ok(!/\{[a-z]+\}/.test(t),'with no unfilled blanks anywhere on the page');
console.log('\n  ——— the issue, as printed ———');
console.log(t.split('\n').filter(l=>l.trim().length>1).slice(0,54).map(l=>'  '+l).join('\n'));
await page.screenshot({path:SP+'/mg-1-issue.png',fullPage:true});
/* back issues */
await page.click('[data-act="magissue"][data-val="1"]');
await page.waitForTimeout(400);
t=await txt();
ok(/Season 1/.test(t),'a back issue opens');
ok(/City Open/.test(t),'with that season’s own story in it');
await page.screenshot({path:SP+'/mg-2-back.png',fullPage:true});
/* desktop */
await page.setViewportSize({width:1100,height:1000});
await page.waitForTimeout(300);
await page.screenshot({path:SP+'/mg-4-desktop.png',fullPage:true});
console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,8).join('\n')):'\n✅ no page errors');
console.log('✅ magazine visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
