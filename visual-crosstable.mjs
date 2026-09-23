/* Play a whole tournament in a real browser and read its crosstable. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go};\n'+HTML.slice(i); }
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
await page.locator('[data-act="careerjoin"]').first().click(); await page.waitForTimeout(500);

/* one round, simulated, so there is a crosstable with something in it */
await page.click('[data-act="simround"]'); await page.waitForTimeout(700);
ok(/Crosstable/.test(await txt()),'the tournament screen offers a crosstable after a round');
ok(/game(s)? played in the hall/.test(await txt()),'saying how many games are behind it');
await page.click('[data-act="xttog"]'); await page.waitForTimeout(400);
ok(await page.locator('table.xt').count()===1,'and opening it draws a real table');
let grid=await page.evaluate(()=>{
  const t=document.querySelector('table.xt');
  return {rows:t.querySelectorAll('tbody tr').length,
    cols:t.querySelectorAll('thead th').length,
    you:t.querySelectorAll('tr.xtyou').length,
    results:t.querySelectorAll('td.xtw,td.xtl,td.xtd').length,
    blanks:t.querySelectorAll('td.xtnone').length,
    rowHeads:t.querySelectorAll('tbody th[scope="row"]').length};
});
ok(grid.rows===grid.cols-4,'one row per player, one column per player ('+grid.rows+' × '+grid.rows+')');
ok(grid.you===1,'with your own row marked, exactly once');
ok(grid.rowHeads===grid.rows,'every name is a row header, so a screen reader can say whose row it is');
ok(grid.results>=4,'a played round fills in its games ('+grid.results+' cells)');
ok(grid.blanks>grid.results,'and everything else is still blank');
await page.locator('.xtwrap').first().screenshot({path:SP+'/xt-1-round1.png'});

/* the table scrolls sideways on a phone rather than pushing the page wide */
const overflow=await page.evaluate(()=>{
  const w=document.querySelector('.xtwrap');
  return {scrollable:w.scrollWidth>w.clientWidth+2,
    page:document.documentElement.scrollWidth<=document.documentElement.clientWidth+2};
});
ok(overflow.page,'the page itself never scrolls sideways at 430px');
const sticky=await page.evaluate(()=>{
  const w=document.querySelector('.xtwrap'),n=w.querySelector('tbody th.xtn');
  const before=n.getBoundingClientRect().left;
  w.scrollLeft=w.scrollWidth;
  const after=n.getBoundingClientRect().left;
  const bg=getComputedStyle(n).backgroundColor;
  return {moved:Math.abs(after-before),bg:bg};
});
ok(sticky.moved<3,'and the names stay pinned when it is scrolled ('+sticky.moved.toFixed(1)+'px)');
ok(!/rgba\(0, 0, 0, 0\)/.test(sticky.bg),'with something opaque behind them, so the grid does not show through');

/* the rest of the event */
await page.click('[data-act="simtour"]'); await page.waitForTimeout(2500);
let t=await txt();
ok(/finished/.test(t),'the event finishes');
ok(/See the final crosstable/.test(t),'and the finish banner offers the final grid');
await page.click('[data-act="xtfin"]'); await page.waitForTimeout(400);
ok(await page.locator('table.xt').count()>=1,'which opens');
const fin=await page.evaluate(()=>{
  const t=document.querySelector('table.xt');
  const rows=[...t.querySelectorAll('tbody tr')];
  const you=t.querySelector('tr.xtyou');
  const cells=[...you.querySelectorAll('td.xtw,td.xtl,td.xtd')].map(td=>td.textContent.trim());
  const pts=[...you.querySelectorAll('td.xtp')].map(td=>td.textContent.trim())[0];
  const order=rows.map(r=>parseFloat(r.querySelector('td.xtp').textContent.replace('½','.5'))||0);
  return {cells:cells,pts:pts,order:order,blanks:t.querySelectorAll('td.xtnone').length,
    results:t.querySelectorAll('td.xtw,td.xtl,td.xtd').length};
});
ok(fin.results>fin.blanks,'a finished event is mostly filled in');
ok(/^[0-9½]/.test(fin.pts),'your row ends in a score: '+fin.pts);
/* the row really adds up — the whole point of a crosstable */
const mySum=fin.cells.filter(c=>/^[01½]$/.test(c)).reduce((s,c)=>s+(c==='1'?1:c==='½'?0.5:0),0);
const myPts=parseFloat(String(fin.pts).replace('½','.5'))||0;
ok(Math.abs(mySum-myPts)<0.01,'and the symbols in it add up to that score: '+mySum+' = '+fin.pts);
let sorted=true;for(let i=1;i<fin.order.length;i++)if(fin.order[i]>fin.order[i-1]+1e-9)sorted=false;
ok(sorted,'the table is in order, best score first');
await page.locator('.xtwrap').first().screenshot({path:SP+'/xt-2-final.png'});

/* and it is still there afterwards */
await page.click('[data-act="careerdismiss"]'); await page.waitForTimeout(300);
await page.click('[data-act="careertab"][data-val="legacy"]'); await page.waitForTimeout(600);
t=await txt();
ok(/crosstable kept/.test(t),'the history says it kept the grid');
await page.locator('[data-act="xthist"]').first().click(); await page.waitForTimeout(400);
ok(await page.locator('table.xt').count()>=1,'and a finished event opens its crosstable from the history');
const hist=await page.evaluate(()=>{
  const t=document.querySelector('table.xt');
  return {you:t.querySelectorAll('tr.xtyou').length,
    results:t.querySelectorAll('td.xtw,td.xtl,td.xtd').length,
    title:(t.querySelector('td.xtw,td.xtl,td.xtd')||{}).title||''};
});
ok(hist.you===1,'still knowing which row was yours');
ok(hist.results>0,'with the results intact after the tournament object is gone');
ok(/round \d|over \d games/.test(hist.title),'and each cell still says which round it was: “'+hist.title+'”');
await page.locator('.xtwrap').first().screenshot({path:SP+'/xt-3-history.png'});

/* survives a reload — it lives in the save, not in memory */
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(700);
await go('career');
await page.click('[data-act="careertab"][data-val="legacy"]'); await page.waitForTimeout(600);
ok(/crosstable kept/.test(await txt()),'and it is still there after a reload');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ crosstable in a browser: '+pass+' checks passed');
await b.close(); server.close();
