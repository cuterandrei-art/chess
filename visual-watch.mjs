/* In a real browser: watching two players with the chat running, taking it
   live, the World Cup's 206 on screen, and the World tab reading the monthly
   list. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,lifeInit:lifeInit,wcQualify:wcQualify,EVENT_WEEK:EVENT_WEEK,worldWeek:worldWeek};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const H=(fn,a)=>page.evaluate(fn,a);
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.energy=90;c.subs=200;for(let i=0;i<5;i++)S.worldWeek(c);c.weeks=5;S.save();S.render();});

/* ---- watching, with the chat ---- */
await H(()=>{const S=window.__APPHOOK__;S.app.playerId='carlsen';S.go('player');});await page.waitForTimeout(300);
await page.click('[data-act="specvs"]');await page.waitForTimeout(600);
ok(await page.locator('#specchat .cm').count()>=3,'watching a game opens its chat');
const n0=await page.locator('#specchat .cm').count();
await page.waitForTimeout(9000);
const moves=await H(()=>window.__APPHOOK__.app.spec.moves.length);
ok(moves>=4,'the game is being played ('+moves+' moves)');
const chat=await H(()=>window.__APPHOOK__.app.spec.chat.map(m=>m.t));
ok(chat.length>n0,'and the chat keeps up with it ('+chat.length+' lines)');
ok(chat.some(t=>/Carlsen/.test(t)),'talking about the players by name');
ok(/🍿 [\d,]+ watching/.test(await page.locator('#specstats').innerText()),'with the audience on screen');
await page.screenshot({path:SP+'/watch-1-chat.png'});
await page.click('[data-act="speclive"]');await page.waitForTimeout(500);
ok(/LIVE/.test(await page.locator('#specstats').innerText()),'“Stream it” takes it live on your channel');
const st=await H(()=>{const c=window.__APPHOOK__.store.career;return {e:c.energy,d:c.day};});
ok(st.e===85&&st.d>=1,'for a day and 5 energy');
await page.click('[data-act="specexit"]');await page.waitForTimeout(500);
ok(await H(()=>window.__APPHOOK__.store.career.news.some(n=>/watch-along/.test(n.t))),'leaving ends the stream, and the news counts what it earned');

/* ---- the World tab reads the list ---- */
await page.click('[data-act="careertab"][data-val="world"]');await page.waitForTimeout(300);
ok(/World Ranking · the \w+ \d{4} list/.test(await page.locator('#rankcard').innerText()),'the World tab is the monthly list, and says which');

/* ---- the World Cup ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.rating=2480;c.peak=2480;c.money=50000;c.pub=null;
  S.wcQualify(c,'national champion');c.season=2;c.weeks=52+S.EVENT_WEEK.worldcup;c.day=0;c.calDone=[];S.save();S.render();});
await page.click('[data-act="careertab"][data-val="play"]');await page.waitForTimeout(300);
const btn=page.locator('[data-act="careerjoin"][data-val="worldcup"]');
if(await btn.count()===0){await page.click('[data-act="lobbymore"][data-val="classical"]').catch(()=>{});await page.waitForTimeout(200);}
ok(await page.locator('[data-act="careerjoin"][data-val="worldcup"]').count()>0,'a national champion can enter the World Cup in its week');
await page.locator('[data-act="careerjoin"][data-val="worldcup"]').first().click();await page.waitForTimeout(700);
const t=await page.locator('#app').innerText();
ok(/Knockout · 206 players/.test(t)&&/The top 50 seeds start in round 2/.test(t),'the bracket is 206 players, the top fifty seeds starting in round two');
ok(/seed \d+ of 206/.test(t),'and your seed is out of 206');
ok(/Round 1 · game 1 of 2/.test(t)||/▶ vs/.test(t),'and a 2480 plays round one');
await page.screenshot({path:SP+'/watch-2-worldcup.png'});

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ watching, the list and the World Cup in a browser: '+pass+' checks passed');
await b.close(); server.close();
