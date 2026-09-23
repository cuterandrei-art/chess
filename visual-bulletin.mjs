/* Play a tournament round and read the bulletin the hall produces. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,simTourRound:simTourRound,save:save};\n'+HTML.slice(i); }
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
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(400);
await page.locator('[data-act="careerjoin"]').first().click(); await page.waitForTimeout(400);
/* simulate three rounds — the bulletin is about the hall, not about your moves */
for(let i=0;i<3;i++){await page.click('[data-act="simround"]');await page.waitForTimeout(700);}
await page.waitForTimeout(400);
let t=await txt();
ok(/Round 3 bulletin/.test(t),'after three rounds the bulletin is on the tournament screen');
ok(/Board 2/.test(t),'listing the other boards');
ok(/1–0|0–1|½–½/.test(t),'with real results');
const notes=(t.match(/(📉|🪢|👑|🤝|📊|💯|😮)[^\n]+/g)||[]);
ok(notes.length>=1,'and something to say about the state of the event');
console.log('  — the bulletin said:');
notes.forEach(n=>console.log('      '+n.replace(/\s+/g,' ')));
/* the table adds up */
const sums=await page.evaluate(()=>{
  const tr=window.__APPHOOK__.store.career.tour;
  return {total:tr.standings.reduce((a,p)=>a+(p.score||0),0),n:tr.standings.length,round:tr.round};
});
const perRound=Math.floor(sums.n/2)+(sums.n%2?0.5:0);
ok(sums.total===perRound*sums.round,
  sums.round+' rounds of '+sums.n+' players is exactly '+sums.total+' points on the table');
const el=page.locator('.card', {hasText:'bulletin'}).first();
await el.scrollIntoViewIfNeeded().catch(()=>{});
await page.screenshot({path:SP+'/bu-1-bulletin.png',fullPage:true});
await el.screenshot({path:SP+'/bu-2-card.png'}).catch(()=>{});
console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,8).join('\n')):'\n✅ no page errors');
console.log('✅ bulletin visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
