/* The championship cycle in a browser: qualify, win the Candidates, play for
   the title, and see the road panel turn into a reign. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,'+
    'lifeInit:lifeInit,cycleQualify:cycleQualify,cycleInit:cycleInit,'+
    // the simulated result, forced, so that every branch can be walked in a browser
    'setSim:function(v){_simScore=function(){return v;};}};\n'+HTML.slice(i); }
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
const playTab=async()=>{await go('career');
  await page.click('[data-act="careertab"][data-val="play"]').catch(()=>{});await page.waitForTimeout(400);};

await go('career');
await page.fill('#cr-name','Ada Marín').catch(()=>{});
await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);

/* a strong grandmaster, outside the world top three, with no place yet */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;
  H.lifeInit(c);
  c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';c.season=3;c.weeks=2*52+10;c.day=0;c.money=80000;
  c.rating=2720;c.ratingRapid=2700;c.ratingBlitz=2690;c.provisional=false;c.peak=2720;
  c.played=300;c.won=120;c.drawn=130;c.lost=50;c.titles=['CM','FM','IM','GM'];
  H.save();H.render();
});
await playTab();
let t=await txt();
ok(/Candidates Tournament/.test(t),'the Candidates is in the lobby');
ok(await page.locator('[data-act="careerjoin"][data-val="candidates"]').count()===0,'but a 2720 without a place cannot enter it');
ok(/Locked · no place yet/.test(t),'the lock says so in three words');
ok(/qualify: World Cup final, Grand Swiss top two, Grand Circuit winner or world top 3/.test(t),'and the event says how a place is earned, not a rating floor');

/* the road panel */
const road=async()=>{await go('career');
  await page.click('[data-act="careertab"][data-val="progress"]');await page.waitForTimeout(300);
  return page.evaluate(()=>{const el=[...document.querySelectorAll('.card')].find(x=>/Road to the World Championship|Your reign/.test(x.innerText));return el?el.innerText:'';});};
let r=await road();
ok(/Road to the World Championship/.test(r),'the road to the title is on the career page');
ok(/World Cup: .*in on rating/.test(r),'showing the World Cup is open on rating');

/* qualify, and win the Candidates */
await page.evaluate(()=>{const H=window.__APPHOOK__;H.cycleQualify(H.store.career,'reaching the final of the World Cup');H.save();H.render();});
await playTab();
t=await txt();
ok(/Locked · opens week 13/.test(t),'with a place, the Candidates is open to you — in its week, which is week 13');
ok(/Season 3 · 2028/.test(t),'the calendar shows the season and the year');
const goto13=page.locator('[data-act="calwait"][data-val="13"]');
ok(await goto13.count()>0,'and offers to go there');
await goto13.first().click();await page.waitForTimeout(700);
ok(await page.evaluate(()=>window.__APPHOOK__.store.career.weeks%52)===13,'three weeks of your life later, it is week 13');
ok(await page.locator('[data-act="careerjoin"][data-val="candidates"]').count()>0,'and the Candidates can be entered');
await page.click('[data-act="careerjoin"][data-val="candidates"]');await page.waitForTimeout(600);
ok(await page.evaluate(()=>window.__APPHOOK__.store.career.cycle.cand===null),'and entering it uses the place up');
/* force the result: every game won */
await page.evaluate(()=>window.__APPHOOK__.setSim(1));
await page.click('[data-act="simtour"]');await page.waitForTimeout(3000);
const cand=await page.evaluate(()=>{const c=window.__APPHOOK__.store.career;return {chall:c.cycle.chall,place:c.history[0]&&c.history[0].place};});
ok(cand.place===1&&cand.chall===3,'a Candidates won makes you the challenger (place '+cand.place+')');
await page.screenshot({path:SP+'/cycle-1-candidates.png',fullPage:false});

/* the title match, in November */
await playTab();
t=await txt();
ok(/Locked · opens week 47/.test(t),'the title match is the challenger’s — in week 47');
await page.locator('[data-act="calwait"][data-val="47"]').first().click();await page.waitForTimeout(1500);
ok(await page.locator('[data-act="careerjoin"][data-val="wcc"]').count()>0,'the title match is open to the challenger');
await page.click('[data-act="careerjoin"][data-val="wcc"]');await page.waitForTimeout(600);
t=await txt();
ok(/World Championship Match/.test(t),'the match begins');
ok(/Your team of seconds/.test(t),'with the team to pick first');
const m0=await page.evaluate(()=>window.__APPHOOK__.store.career.money);
await page.click('[data-act="wmhire"][data-val="opening"]');await page.waitForTimeout(300);
ok(await page.evaluate(()=>window.__APPHOOK__.store.career.money)===m0-60000,'an opening specialist, paid for');
await page.click('[data-act="wmstart"]');await page.waitForTimeout(300);
await page.click('[data-act="simround"]');await page.waitForTimeout(900);
t=await txt();
ok(/Press conference after game 1/.test(t),'a press conference after the first game');
ok(/The match so far/.test(t)&&/You strike first/.test(t),'and the story of the match begins');
await page.click('[data-act="wmpress"][data-val="confident"]');await page.waitForTimeout(300);
await page.click('[data-act="simround"]');await page.waitForTimeout(900);
t=await txt();
ok(/Rest day/.test(t),'after two games, a rest day');
await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);
await page.screenshot({path:SP+'/cycle-2a-match.png',fullPage:false});
await page.click('[data-act="wmrest"][data-val="prep"]');await page.waitForTimeout(300);
await page.click('[data-act="simtour"]');await page.waitForTimeout(3000);
t=await txt();
const wcc=await page.evaluate(()=>{const c=window.__APPHOOK__.store.career,h=c.history[0];return {champ:c.cycle.champ,games:h.rounds,place:h.place};});
ok(wcc.champ&&wcc.place===1,'winning it makes you World Champion');
ok(wcc.games<14,'and it stopped when it was decided — '+wcc.games+' games, not fourteen');
ok(/Match won/.test(t)&&/to spare/.test(t),'the banner says it was decided with games to spare');
await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);
await page.screenshot({path:SP+'/cycle-2-champion.png',fullPage:false});

/* the reign */
await playTab();
t=await txt();
ok(/you are the champion/.test(t),'the champion does not play the Candidates');
ok(/next defence in season 5/.test(t),'and the title match waits two seasons');
r=await road();
await page.screenshot({path:SP+'/cycle-3-reign.png',fullPage:false});
ok(/Your reign/.test(r)&&/World Champion/.test(r),'the road panel is now your reign');
ok(/next in season 5/.test(r),'with the next defence on it');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ the championship cycle in a browser: '+pass+' checks passed');
await b.close(); server.close();
