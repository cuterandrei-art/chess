/* In a real browser: a junior career's generation on the World tab, the
   same names at the nationals, the seasons going by with the youth and
   women's events played without you, and the biography's contemporaries. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,joinTournament:joinTournament,_simRound:_simRound,endOfWeek:endOfWeek,EVENT_WEEK:EVENT_WEEK,genPlayers:genPlayers,wxInit:wxInit};\n'+HTML.slice(i); }
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

/* ---- a junior, and the people their age ---- */
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-fed','ROU');await page.selectOption('#cr-start','junior');
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);
await H(()=>{const S=window.__APPHOOK__;S.endOfWeek(S.store.career);S.save();S.render();});
await page.click('[data-act="careertab"][data-val="world"]');await page.waitForTimeout(300);
const card=page.locator('#gencard');
ok(await card.count()===1,'the World tab has “Your generation”');
let t=await card.innerText();
ok(/Your generation/.test(t)&&/born 2015±1/.test(t)&&/YOU/.test(t),'born around 2015, and you are in it');
const rows=await card.locator('[data-act="profile"]').count();
ok(rows>=7,'the top of it by rating, each one a name you can open ('+rows+' shown)');
await card.locator('[data-act="genall"]').click();await page.waitForTimeout(200);
ok(await page.locator('#gencard [data-act="profile"]').count()===20,'“All” shows every one of the twenty');
await page.locator('#gencard').screenshot({path:SP+'/gen-1-card.png'});
await page.locator('#gencard [data-act="profile"]').first().click();await page.waitForTimeout(300);
ok(await H(()=>window.__APPHOOK__.app.view)==='player','a name opens their profile');
await page.goBack().catch(()=>{});await H(()=>{const S=window.__APPHOOK__;S.go('career');});await page.waitForTimeout(300);

/* ---- the nationals: the same faces ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.weeks=S.EVENT_WEEK.natyouth;c.day=0;S.app.careerTab='play';S.store.settings.roundIntro=false;S.joinTournament('natyouth');S.save();S.render();});
await page.waitForTimeout(400);
const inHall=await H(()=>{const S=window.__APPHOOK__,c=S.store.career,ids=new Set(c.gen.ids);return c.tour.hall.filter(o=>ids.has(o.wid)).map(o=>o.name);});
ok(inHall.length>=4,'the national U12 hall has '+inHall.length+' of your generation in it');

/* ---- two seasons go by ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;while(c.tour)S._simRound(c);for(let i=0;i<100;i++)S.endOfWeek(c);S.app.careerTab='world';S.save();S.render();});
await page.waitForTimeout(400);
t=await txt();
ok(/Around the world/.test(t)&&/Women’s World Champion/.test(t),'the World tab’s season has the women’s world in it');
ok(await H(()=>{const S=window.__APPHOOK__,R=S.wxInit(S.store.career).results||[];return ['natwch','natyouth','contyouth','worldyouth','worldjunior'].every(id=>R.some(r=>r.id===id));}),
  'and the women’s nationals and the youth championships were played without you');
await page.locator('#gencard').screenshot({path:SP+'/gen-2-later.png'});

/* ---- the biography ---- */
await page.click('[data-act="careertab"][data-val="legacy"]');await page.waitForTimeout(300);
await page.click('[data-act="bioopen"]');await page.waitForTimeout(400);
t=await txt();
ok(/Contemporaries/.test(t)&&/grew up with a generation of players born around 2015/.test(t),'the biography has a paragraph on the people you grew up with');
await page.screenshot({path:SP+'/gen-3-bio.png',fullPage:true});

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ your generation in a browser: '+pass+' checks passed');
await b.close(); server.close();
