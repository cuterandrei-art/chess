/* In a real browser: a trip to Reykjavik — the travel row, the walk into the
   hall, the other boards beside yours, the post-mortem with the engine
   running for real, the coach's homework, and your people on the Life tab. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,Chess:Chess,joinTournament:joinTournament,careerResult:careerResult,stopClockTick:stopClockTick,pplOf:pplOf,pplWeek:pplWeek,weekOfSeason:weekOfSeason,Hall:Hall};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const H=(fn,a)=>page.evaluate(fn,a);
const txt=()=>page.locator('#app').innerText();
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-start','master').catch(()=>{});
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);

/* ---- the trip ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.fed='IND';c.flag='🇮🇳';c.money=20000;c.energy=90;c.rating=Math.max(c.rating||0,2000);
  c.weeks=15;c.day=0;S.joinTournament('reykjavik');S.app.careerTab='play';S.save();S.render();});
await page.waitForTimeout(300);
let tr=await page.locator('#travelrow').innerText();
ok(/Reykjavik/.test(tr)&&/Players’ hotel/.test(tr)&&/Budget hostel/.test(tr),'the event is a trip: Reykjavik, and a choice of beds');
await page.click('[data-act="hotelpick"][data-val="players"]');await page.waitForTimeout(250);
ok(await page.locator('[data-act="hotelpick"][data-val="players"].primary').count()===1,'the players’ hotel, booked');
ok(/Fly out a day early/.test(await page.locator('#travelrow').innerText()),'thirteen hours from India: the first rounds would be jet-lagged');
await page.click('[data-act="travelearly"]');await page.waitForTimeout(300);
ok(/A day early in Reykjavik/.test(await txt()),'so you fly out a day early');
await page.screenshot({path:SP+'/imm-1-trip.png'});

/* ---- into the hall ---- */
await page.click('[data-act="careerplay"]');await page.waitForTimeout(500);
let t=await txt();
ok(await page.locator('.hallcard').count()===1&&/You walk into/.test(t)&&/Reykjavik/.test(t),'“Play the round” walks you into the hall in Reykjavik');
ok(/You are on board \d+/.test(t)&&/Players, you may start the clocks/.test(t),'your board, and the arbiter');
ok(/On board one, the top seeds/.test(t)||/You are on board 1\./.test(t),'round one: board one is the top seeds, not “the leaders”');
ok(await page.locator('.botnav button.active[data-val="career"]').count()===1,'and the tab bar still says Career');
await page.screenshot({path:SP+'/imm-2-hall.png'});
await page.click('[data-act="hallsound"]');await page.waitForTimeout(200);
ok(/Hall sounds off/.test(await txt()),'the hall’s sounds can be switched off from there');
await page.click('[data-act="hallsound"]');await page.waitForTimeout(200);
await page.click('[data-act="hallstart"]');await page.waitForTimeout(900);
ok(await H(()=>window.__APPHOOK__.app.view)==='play','and “Start the game” sits you at the board');
ok(/the other boards/.test(await page.locator('#liveboards').innerText()),'beside it, the rest of the round');
ok(await H(()=>window.__APPHOOK__.Hall.on)===true,'with the hall murmuring around you');
await page.screenshot({path:SP+'/imm-3-board.png',fullPage:true});

/* ---- the game ends; the post-mortem ---- */
const sans='e4 e5 Qh5 Nc6 Qxf7+ Kxf7 Bc4+ d5 Bxd5+ Qxd5 Nc3 Qd8 Nf3 Nf6 d3 Bc5 O-O Rf8 Be3 Bxe3 fxe3 Kg8'.split(' ');
await H((sans)=>{const S=window.__APPHOOK__,a=S.app;S.stopClockTick();
  const g=new S.Chess();a.playSide='w';a.playStack=[g.fen()];a.playMoves=[];
  for(const x of sans){const m=g.move(x);a.playMoves.push({san:m.san,from:m.from,to:m.to});a.playStack.push(g.fen());}
  a.playFen=g.fen();a.playView=a.playStack.length-1;a.playStatus='over';a.playResult='Draw agreed. 🤝';S.careerResult(0.5);S.render();},sans);
await page.waitForTimeout(300);
ok(await H(()=>window.__APPHOOK__.Hall.on)===false,'the game over, the hall goes quiet');
ok(/Post-mortem with/.test(await page.locator('#postmortem').innerText()),'the post-mortem begins beside the result');
let pm='';
for(let i=0;i<180;i++){pm=await page.locator('#postmortem').innerText().catch(()=>'');if(/💬/.test(pm))break;await page.waitForTimeout(500);}
ok(/💬/.test(pm),'the engine has been through it, and your opponent talks: “'+(pm.split('“')[1]||'').split('”')[0]+'”');
ok(/mistake/.test(pm),'counting the mistakes each side made');
ok(/Show me/.test(pm),'with the moment to look at');
ok(/homework you have|in the next 3 weeks/.test(pm)&&/Train 20 moves of your openings/.test(pm),'and the coach’s word: the opening, and twenty moves of homework');
await page.screenshot({path:SP+'/imm-4-postmortem.png',fullPage:true});
await page.click('[data-act="pmshow"]');await page.waitForTimeout(500);
ok(await H(()=>window.__APPHOOK__.app.view)==='analysis'&&/Post-mortem/.test(await txt()),'“Show me” opens it on the analysis board');

/* ---- back at the career ---- */
await H(()=>{const S=window.__APPHOOK__;S.app.careerTab='play';S.go('career');});await page.waitForTimeout(400);
const db=await page.locator('#debriefcard').innerText().catch(()=>'');
ok(/Homework from/.test(db)&&/0 of 20/.test(db),'the homework waits on the Play tab: 0 of 20');
ok(await page.locator('#inboxcard .inrow',{hasText:'homework'}).count()===1,'and in the inbox');

/* ---- your people ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career,f=S.pplOf(c,'friend');f.bday=S.weekOfSeason(c);f.bdayS=null;S.pplWeek(c);S.save();S.render();});
await page.waitForTimeout(200);
const inb=page.locator('#inboxcard .inrow',{hasText:'waiting for an answer'});
ok(await inb.count()===1,'a birthday message waits in the inbox');
await inb.click();await page.waitForTimeout(700);
ok(await H(()=>window.__APPHOOK__.app.careerTab)==='life'&&await page.locator('#peoplecard').count()===1,'which takes you to your people on the Life tab');
const pc=await page.locator('#peoplecard').innerText();
ok(/(Mum|Dad)/.test(pc)&&/Coach /.test(pc),'a parent, a friend and your first coach');
await page.screenshot({path:SP+'/imm-5-people.png',fullPage:false});
await page.locator('#peoplecard [data-act="pplreply"]').first().click();await page.waitForTimeout(300);
ok(/you: Called for an hour/.test(await page.locator('#peoplecard').innerText()),'you call them for an hour');
await page.locator('#peoplecard [data-act="pplcall"][data-val="parent"]').click();await page.waitForTimeout(300);
ok(/📞/.test(await txt())&&await page.locator('#peoplecard [data-act="pplcall"][data-val="parent"][disabled]').count()===1,'and phone home — once a week');

/* ---- the settings ---- */
await H(()=>window.__APPHOOK__.go('settings'));await page.waitForTimeout(300);
t=await txt();
ok(/Tournament hall sounds/.test(t)&&/Arbiter’s voice/.test(t)&&/Round scenes/.test(t),'Settings: hall sounds, the arbiter’s voice and the round scenes');
await page.click('input[data-setting="roundIntro"]');await page.waitForTimeout(200);
ok(await H(()=>window.__APPHOOK__.store.settings.roundIntro)===false,'the scenes can be switched off there');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ a trip, the hall, the post-mortem, the homework and your people in a browser: '+pass+' checks passed');
await b.close(); server.close();
