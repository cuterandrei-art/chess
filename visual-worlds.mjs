/* In a real browser: the rating and norm calculator, the passport's map, a
   career handing its world on to the next generation, and the tours. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,joinTournament:joinTournament,_simRound:_simRound,endOfWeek:endOfWeek,EVENT_WEEK:EVENT_WEEK,retireCareer:retireCareer,tourState:tourState,worldRanking:worldRanking,cycleInit:cycleInit};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
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

/* ---- the calculator ---- */
await H(()=>window.__APPHOOK__.go('learn'));await page.waitForTimeout(200);
await page.click('[data-act="nav"][data-val="calc"]');await page.waitForTimeout(300);
ok(/Rating & norm calculator/.test(await txt())&&await page.locator('.calcrow').count()===9,'the Learn page opens the calculator: nine rounds to fill in');
await page.fill('input[data-calc="rating"]','2000');
const r0=page.locator('input[data-calc="r"][data-idx="0"]');
await r0.click();await r0.type('2100',{delay:20});
ok(await H(()=>document.activeElement&&document.activeElement.dataset.calc==='r'&&document.activeElement.value==='2100'),'typing an opponent’s rating keeps your cursor where it is');
await page.click('[data-act="calcres"][data-idx="0"][data-val="1"]');await page.waitForTimeout(150);
ok(/\+13/.test(await page.locator('#calcout').innerText())&&/2013/.test(await page.locator('#calcout').innerText()),'a win against a 2100: +13, 2013');
await page.screenshot({path:SP+'/worlds-1-calc.png'});

/* ---- a career on the road ---- */
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-fed','ROU');await page.selectOption('#cr-start','master');
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;S.store.settings.roundIntro=false;
  const play=function(id){c.weeks=((c.season||1)-1)*52+S.EVENT_WEEK[id];c.day=0;c.calDone=[];c.energy=100;c.money=Math.max(c.money||0,50000);S.joinTournament(id);while(c.tour)S._simRound(c);};
  ['reykjavik','dubai','cityopen','hastings'].forEach(play);S.app.careerTab='you';S.save();S.render();});
await page.waitForTimeout(400);
const pp=page.locator('#passportcard');
ok(await pp.count()===1,'the You tab has a passport');
const box=await page.locator('#passportcard svg.ppmap').boundingBox();
ok(box&&box.width>300&&box.height>100,'with a map across the card ('+Math.round(box.width)+' × '+Math.round(box.height)+')');
ok(await page.locator('#passportcard .ppstamp').count()===4,'and a stamp for each country: '+(await page.locator('#passportcard .pps-name').allInnerTexts()).join(', '));
await page.locator('#passportcard [data-act="pppin"][data-val="Reykjavik"]').click();await page.waitForTimeout(250);
ok(/Reykjavik Open/.test(await pp.innerText()),'tapping Reykjavik on the map shows what happened there');
await page.click('[data-act="ppzoom"][data-val="europe"]');await page.waitForTimeout(250);
ok(await H(()=>document.querySelector('#passportcard svg.ppmap').getAttribute('viewBox'))==='153 10 78 42','and the map zooms to Europe');
await pp.screenshot({path:SP+'/worlds-2-passport.png'});

/* ---- the tours ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.rating=2790;c.peak=2790;c.ratingRapid=2800;
  c.weeks=((c.season||1)-1)*52+S.EVENT_WEEK.fsweiss;c.day=0;c.calDone=[];S.joinTournament('fsweiss');while(c.tour)S._simRound(c);S.app.careerTab='world';S.save();S.render();});
await page.waitForTimeout(400);
ok(/The tours/.test(await txt())&&/Freestyle Chess Grand Slam Tour/.test(await txt())&&/Champions Chess Tour/.test(await txt()),'the World tab has the tours');
await page.locator('#tourscard').screenshot({path:SP+'/worlds-3-tours.png'});
ok(/The roll of champions/.test(await txt()),'and the roll of champions');

/* ---- the next generation ---- */
// world champion through a whole season (a defence in hand), then retire
await H(()=>{const S=window.__APPHOOK__,c=S.store.career,C=S.cycleInit(c);C.champ=true;C.defended=c.season;c.honors=(c.honors||[]).concat(['World Champion']);
  for(let i=0;i<60&&(c.weeks%52)!==0;i++)S.endOfWeek(c);c.age=45;c.canRetire=true;S.retireCareer();});
await page.waitForTimeout(400);
ok(await page.locator('#nextgencard').count()===1,'retired: the next generation is offered');
await page.click('[data-act="nextgen"][data-val="child"]');await page.waitForTimeout(800);
ok(/The next generation/.test(await txt())&&await page.inputValue('#cr-name')==='Marín','the setup screen: your child, the surname already there');
await page.fill('#cr-name','Bea Marín');await page.click('[data-act="careersetup"]');await page.waitForTimeout(500);
ok(await H(()=>{const c=window.__APPHOOK__.store.career;return c.setup&&c.family&&c.family.parent.name==='Ada Marín'&&Math.floor(c.age)===11;}),'Bea Marín begins at eleven, in the same world');
await page.click('[data-act="careertab"][data-val="world"]');await page.waitForTimeout(400);
ok(/Before you/.test(await txt())&&/Ada Marín/.test(await txt()),'the World tab: “Before you”');
ok(/The roll of champions/.test(await txt())&&/Ada Marín/.test(await page.locator('#rollcard').innerText()),'and the roll of champions has Ada Marín on it');
await page.locator('#lineagecard').screenshot({path:SP+'/worlds-4-lineage.png'});
await page.locator('#rollcard').screenshot({path:SP+'/worlds-5-roll.png'});

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ the calculator, the passport, the tours and the next generation in a browser: '+pass+' checks passed');
await b.close(); server.close();
