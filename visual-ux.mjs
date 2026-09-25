/* The career screen on a real phone-sized page: how long each tab is, the
   line above the tabs, the tabs pinned while you scroll, nothing running off
   a card, the inbox taking you to the card it names, the folds, the
   tournament filter, the Back button, the game screen's heading, and a save
   that fails out loud. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,lifeInit:lifeInit,stopClockTick:stopClockTick};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const VH=844;
const page=await b.newPage({viewport:{width:390,height:VH},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const tab=async t=>{await page.click(`[data-act="careertab"][data-val="${t}"]`);await page.waitForTimeout(250);};
const H=(fn,arg)=>page.evaluate(fn,arg);

await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);

/* ---- how long each tab is, on a phone ---- */
const heights={};
for(const t of ['play','you','progress','life','world','media','legacy']){
  await tab(t);heights[t]=await H(()=>document.documentElement.scrollHeight);
}
console.log('    screens per tab: '+Object.entries(heights).map(([k,v])=>k+' '+(v/VH).toFixed(1)).join(' · '));
ok(heights.play<=6*VH,'the Play tab of a new career is under six phone screens (it was twelve and a half)');
ok(Object.entries(heights).every(([k,v])=>k==='play'||v<=4.5*VH),'and every other tab is under four and a half');
await tab('play');
const strip=await page.locator('#cstrip').boundingBox();
ok(strip&&strip.height<=56,'the line above the tabs is one line ('+Math.round(strip.height)+'px)');
ok(/\bAda\b/.test(await page.locator('#cstrip').innerText())&&!/Marín/.test(await page.locator('#cstrip').innerText())&&await page.locator('#cstrip .cs-name[title="Ada Marín"]').count()===1&&/💰1,500/.test(await page.locator('#cstrip').innerText()),'with your first name (the whole of it on a long press) and your money in it');
await page.screenshot({path:SP+'/ux-1-play.png'});

/* ---- the tabs stay pinned; a new tab opens at its top ---- */
await H(()=>window.scrollTo(0,1600));await page.waitForTimeout(200);
const topH=await H(()=>document.querySelector('header.top').getBoundingClientRect().bottom);
let barTop=await H(()=>document.querySelector('.ctabs').getBoundingClientRect().top);
ok(Math.abs(barTop-topH)<=2,'scrolled down the Play tab, the tabs are still there, under the top bar');
await page.screenshot({path:SP+'/ux-2-pinned.png'});
await tab('media');
barTop=await H(()=>document.querySelector('.ctabs').getBoundingClientRect().top);
const firstCard=await H(()=>{const bar=document.querySelector('.ctabs').getBoundingClientRect().bottom;const c=[...document.querySelectorAll('#app .card')].find(x=>x.getBoundingClientRect().top>=bar-1);return c?c.getBoundingClientRect().top-bar:999;});
ok(Math.abs(barTop-topH)<=2&&firstCard<40,'tapping another tab from down there opens it at its top, right under the tabs');

/* ---- nothing runs off the side of its card ---- */
const overflow=[];
for(const t of ['play','you','progress','life','world','media','legacy']){
  await tab(t);
  const o=await H(()=>{const out=[];document.querySelectorAll('#app .card').forEach(card=>{const cr=card.getBoundingClientRect();
    card.querySelectorAll('button').forEach(bn=>{const r=bn.getBoundingClientRect();if(r.width&&r.right>cr.right+1)out.push((bn.innerText||'').trim().slice(0,40));});});return out;});
  o.forEach(x=>overflow.push(t+': '+x));
}
ok(overflow.length===0,'no button runs off the edge of its card, on any tab'+(overflow.length?' — '+overflow.slice(0,4).join(' | '):''));

/* ---- the inbox takes you to the card ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.rating=1900;c.provisional=false;c.peak=1900;c.fame=20;
  c.norms=c.norms||[];c.norms.push({type:'IM',event:'Reykjavik Open',tpr:2480,games:9});S.save();S.render();});
await tab('play');
const inbox=await page.locator('#inboxcard').innerText();
ok(/sponsor offer/.test(inbox)&&/New norm: IM norm at Reykjavik Open/.test(inbox),'the inbox lists a sponsor offer and a new norm');
const n=await page.locator('#cstrip .cs-in b').innerText();
ok(+n>=2,'and the line above the tabs counts them ('+n+')');
await page.locator('#inboxcard .inrow:has-text("sponsor offer")').click();await page.waitForTimeout(900);
ok(await page.locator('.ctab.active[data-val="media"]').count()===1,'tapping the offer opens the Media tab');
let box=await page.locator('#sponsorcard').boundingBox();
barTop=await H(()=>document.querySelector('.ctabs').getBoundingClientRect().bottom);
ok(box&&box.y>=barTop-2&&box.y<VH/2,'at the sponsors card, just under the tabs');
ok(await page.locator('#sponsorcard.jumpflash').count()===1,'lit up for a moment, so you see which card it meant');
await page.screenshot({path:SP+'/ux-3-sponsor.png'});
await page.locator('#cstrip .cs-in').click();await page.waitForTimeout(700);
ok(await page.locator('.ctab.active[data-val="play"]').count()===1,'📥 in the line goes back to the inbox');
await page.locator('#inboxcard .inrow:has-text("New norm")').click();await page.waitForTimeout(900);
box=await page.locator('#normscard').boundingBox();
ok(await page.locator('.ctab.active[data-val="progress"]').count()===1&&box&&box.y<VH/2,'and the norm goes to the norms card on the Progress tab');
ok(!/New norm/.test(await H(()=>document.getElementById('inboxcard')?document.getElementById('inboxcard').innerText:'')),'where it stops being news');

/* ---- the line opens to the detail ---- */
await page.locator('#cstrip .cs-tg').click();await page.waitForTimeout(250);
ok(await page.locator('#dashcard').isVisible()&&/Classical/.test(await page.locator('#dashcard').innerText()),'▾ in the line opens every rating, the money and how you are');
await page.locator('#cstrip .cs-tg').click();await page.waitForTimeout(250);
ok(await page.locator('#dashcard').count()===0,'and ▴ folds it away again');

/* ---- folded cards ---- */
await tab('you');
ok(await page.locator('[data-act="avset"]').count()===0,'the avatar editor is folded');
await page.click('[data-act="fold"][data-val="avatar"]');await page.waitForTimeout(250);
ok(await page.locator('[data-act="avset"]').count()>10,'“Edit look” opens it');
await page.click('#avatarcard [data-act="fold"][data-val="avatar"]');await page.waitForTimeout(250);
ok(await page.locator('[data-act="avset"]').count()===0,'and “Done” folds it');

/* ---- the tournament list ---- */
await tab('play');
await page.click('[data-act="lobbyfmt"][data-val="rapid"]');await page.waitForTimeout(250);
let lob=await page.locator('#lobbycard').innerText();
ok(/Rapid · /.test(lob)&&!/Classical · /.test(lob)&&!/Blitz · /.test(lob),'the filter shows one format');
const more=page.locator('[data-act="lobbymore"][data-val="rapid"]');
if(await more.count()){const before=(await page.locator('#lobbycard [id^="tour-"]').count());await more.click();await page.waitForTimeout(250);
  ok(await page.locator('#lobbycard [id^="tour-"]').count()>before,'and “🔒 more” opens what is folded');}
else ok(true,'(nothing folded in rapid for this player)');
await page.click('[data-act="lobbyfmt"][data-val="all"]');await page.waitForTimeout(250);

/* ---- the Back button ---- */
await page.click('[data-act="menutoggle"]');await page.waitForTimeout(150);
ok(await H(()=>window.appBack())===true&&!(await H(()=>window.__APPHOOK__.app.menuOpen)),'Back closes the menu');
await page.click('[data-act="nav"][data-val="puzzles"]:visible');await page.waitForTimeout(300);
await page.goBack();await page.waitForTimeout(400);
ok(await H(()=>window.__APPHOOK__.app.view)==='career','the browser’s own Back goes back a screen inside the app');
await tab('media');
ok(await H(()=>window.appBack())===true&&await page.locator('.ctab.active[data-val="play"]').count()===1,'from another tab, Back goes to the first one');
ok(await H(()=>window.appBack())===true,'on the career screen, the first Back…');
await page.waitForTimeout(150);
ok(/Press Back again to leave/.test(await page.locator('.snack').innerText().catch(()=>'')),'…says to press again to leave');
ok(await H(()=>window.appBack())===false,'and the second lets the app go');

/* ---- the game screen names the game ---- */
await page.click('[data-act="careerjoin"][data-val="club"]');await page.waitForTimeout(700);
box=await page.locator('#tourcard').boundingBox();
ok(box&&box.y<VH/2,'entering an event takes you to it');
await page.click('[data-act="careerplay"]');await page.waitForTimeout(900);
const h1=await page.locator('#app h1').first().innerText();
ok(/Local Club Championship · round 1\/5/.test(h1),'the game screen is called by the event and the round ('+h1+')');
ok(!/Play vs Stockfish/.test(await txt()),'not “Play vs Stockfish”');
ok(await page.locator('[data-act="phint"]').count()===0,'and there is no hint button in it');
await page.screenshot({path:SP+'/ux-4-game.png'});
await page.click('#app [data-act="nav"][data-val="career"]');await page.waitForTimeout(400);
ok(await H(()=>window.__APPHOOK__.app.view)==='career','← goes back to the career, where the game waits');
await H(()=>window.__APPHOOK__.stopClockTick());

/* ---- a save that fails ---- */
await H(()=>{window.__realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){const e=new Error('quota');e.name='QuotaExceededError';throw e;};});
await page.locator('#cstrip .cs-tg').click();await page.waitForTimeout(300);
ok(await page.locator('.savefail').isVisible(),'when the phone will not save, a bar says so');
ok(/not saved/.test(await page.locator('.savefail').innerText())&&await page.locator('[data-act="savebackup"]').count()===1,'and offers a backup file');
await page.screenshot({path:SP+'/ux-5-savefail.png'});
await H(()=>{Storage.prototype.setItem=window.__realSet;});
await page.locator('#cstrip .cs-tg').click();await page.waitForTimeout(300);
ok(await page.locator('.savefail').count()===0,'and it goes when saving works again');

/* ---- what a famous opponent plays ---- */
await H(()=>{const S=window.__APPHOOK__;S.app.playerId='carlsen';S.go('player');});await page.waitForTimeout(400);
const prof=await txt();
ok(/Ruy Lopez[\s\S]{0,60}as White[\s\S]{0,40}known for it/.test(prof)&&/Sveshnikov[\s\S]{0,60}against 1\.e4/.test(prof),'Carlsen’s profile shows the Ruy Lopez and the Sveshnikov — what he is known for');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ the career screen on a phone: '+pass+' checks passed');
await b.close(); server.close();
