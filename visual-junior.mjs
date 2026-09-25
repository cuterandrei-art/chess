/* In a real browser: a junior career from the setup screen — school, home,
   the national youth championship — and a career on the women's track, with
   its championship, the women's list and the road to the women's title. */
import http from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,Chess:Chess,joinTournament:joinTournament,careerResult:careerResult,stopClockTick:stopClockTick,_simRound:_simRound,EVENT_WEEK:EVENT_WEEK,heldThisSeason:heldThisSeason};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
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
const saveImg=async(file)=>{const u=await page.locator('#cardimg').getAttribute('src');writeFileSync(SP+'/'+file,Buffer.from(u.split(',')[1],'base64'));return u.length;};

/* ---- a junior ---- */
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-fed','ROU');await page.selectOption('#cr-start','junior');
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);
let st=await H(()=>{const c=window.__APPHOOK__.store.career;return {age:c.age,junior:c.junior,money:c.money};});
ok(st.age===11&&st.junior&&st.money<=200,'“Junior” starts you at eleven, at school, with pocket money');
await page.click('[data-act="careertab"][data-val="life"]');await page.waitForTimeout(300);
let t=await txt();
ok(/School and home/.test(t)&&/Grades/.test(t)&&/At home with your parents/.test(t),'the Life tab: school, the chess budget from home, living at home');
await page.click('[data-act="study"]');await page.waitForTimeout(300);
ok(/A day of homework/.test(await txt()),'a day of homework');
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.weeks=14;c.day=0;S.app.careerTab='play';S.save();S.render();});
await page.waitForTimeout(300);
t=await txt();
ok(/National Youth Championship U12/.test(t),'at Easter the national youth championship is on — the under-12s');
await page.click('[data-act="careerjoin"][data-val="natyouth"]');await page.waitForTimeout(500);
ok(/National Youth Championship U12/.test(await page.locator('#tourcard').innerText()),'entered');
await page.click('[data-act="careerplay"]');await page.waitForTimeout(500);
t=await txt();
ok(await page.locator('.hallcard').count()===1&&/school sports hall|community hall|hall/.test(t),'the hall: '+(t.match(/You walk into ([^.]*)/)||['',''])[1]);
await page.screenshot({path:SP+'/junior-1-hall.png'});
await H(()=>{window.__APPHOOK__.app.roundIntro=null;window.__APPHOOK__.go('career');});

/* ---- the women's track ---- */
await H(()=>{localStorage.removeItem('opening-trainer-standalone-v1');});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(400);
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ana Popa');await page.selectOption('#cr-fed','ROU');await page.selectOption('#cr-gender','women');await page.selectOption('#cr-start','master');
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.weeks=19;c.day=0;c.money=20000;S.app.careerTab='play';S.save();S.render();});await page.waitForTimeout(300);
ok(/National Women’s Championship/.test(await txt()),'on the women’s track the National Women’s Championship is on in May');
await page.click('[data-act="careerjoin"][data-val="natwch"]');await page.waitForTimeout(500);
ok(/National Women’s Championship/.test(await page.locator('#tourcard').innerText()),'entered');
const fieldW=await H(()=>{const tr=window.__APPHOOK__.store.career.tour;return (tr.hall||tr.field).every(o=>o.fed==='ROU');});
ok(fieldW,'against Romania’s women');
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.tour=null;S.save();S.render();});
await page.click('[data-act="careertab"][data-val="world"]');await page.waitForTimeout(300);
await page.click('[data-act="rankwomen"]');await page.waitForTimeout(300);
t=await page.locator('#rankcard').innerText();
ok(/Hou Yifan/.test(t)&&/among the women on the list/.test(t),'the World tab’s women’s list');
await page.screenshot({path:SP+'/junior-2-women-list.png'});
await page.click('[data-act="careertab"][data-val="progress"]');await page.waitForTimeout(300);
ok(/Road to the Women’s World Championship/.test(await txt())&&/Ju Wenjun/.test(await page.locator('#wroadcard').innerText()),'the Progress tab’s road to the women’s title, Ju Wenjun the champion');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ a junior and the women’s track in a browser: '+pass+' checks passed');
await b.close(); server.close();
