/* The board gives nothing away while a game is on; Media & drama, the
   streaming shows and the sponsors do something you can see; and an event
   has rest days instead of a week off. In a browser. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,lifeInit:lifeInit,startChallenge:startChallenge,'+
    'playMove:playMove,startPlay:startPlay,stopClockTick:stopClockTick,joinTournament:joinTournament,careerRest:careerRest,tourRestLeft:tourRestLeft};\n'+HTML.slice(i); }
const SF=readFileSync('.cache/stockfish.js','utf8');
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:430,height:960},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(0,4).join(' | ')));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT|net::|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
await page.route('**/stockfish.js**',r=>r.fulfill({status:200,contentType:'text/javascript',body:SF}));
await page.route('**/tablebase.lichess.ovh/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({category:'win',dtz:5,dtm:9,moves:[{uci:'e1e2',san:'Ke2',category:'loss',dtz:-4}]})}));
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const H=(f,a)=>page.evaluate(f,a);
const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(300);};
const tab=async t=>{await go('career');await page.click(`[data-act="careertab"][data-val="${t}"]`);await page.waitForTimeout(300);};

await go('career');
await page.fill('#cr-name','Ada Marín').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);
await H(()=>{const A=window.__APPHOOK__,c=A.store.career;A.lifeInit(c);
  c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';c.rating=1420;c.provisional=false;c.peak=1420;c.money=20000;c.fame=3;c.subs=400;c.fans=900;
  c.social.followers=2600;A.store.settings.showEval=true;A.store.settings.newsFab=false;A.save();A.render();});

/* ---- nothing given away while a game is on ---- */
// a king-and-pawn ending, your move, in a career game: no tablebase, no evaluation
await H(()=>{const A=window.__APPHOOK__;A.app.chalFormat='classical';A.startChallenge('nakamura');A.stopClockTick();
  const fen='8/8/4k3/8/4P3/8/8/4K3 w - - 0 1';
  A.app.playFen=fen;A.app._playStartFen=fen;A.app.playStack=[fen];A.app.playMoves=[];A.app.playView=0;A.app.playSide='w';A.app.playStatus='play';
  A.app.playEval={t:'cp',v:350,stm:'w'};A.render();});
await page.waitForTimeout(800);
let t=await txt();
ok(!/Tablebase|tablebase/.test(t),'a five-man ending in a career game: no tablebase while you play it');
ok(!/Evaluation/.test(t),'and no evaluation, though the engine has one');
ok(await page.locator('[data-act="toggleeval"][disabled]').count()===1&&/Eval after the game/.test(t),'the eval button says it is for after the game');
ok(await page.locator('[data-act="revplay"]:not([disabled])').count()===0,'game review waits for the end');
ok(await page.locator('[data-act="pundo"][disabled]').count()===1,'and there are no takebacks in a rated game');
// a move that hangs a piece: no warning
await H(()=>{const A=window.__APPHOOK__;const fen='r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
  A.app.playFen=fen;A.app._playStartFen=fen;A.app.playStack=[fen];A.app.playMoves=[];A.app.playView=0;A.app.playStatus='play';A.app.blunderNote=null;
  A.playMove('f3','g5');A.stopClockTick();});
await page.waitForTimeout(300);
t=await txt();
ok(!/drops material/.test(t)&&await H(()=>window.__APPHOOK__.app.blunderNote)===null,'Ng5, hanging the knight, gets no warning in a career game');
// the game ends: now it is review
await H(()=>{const A=window.__APPHOOK__;A.app.playStatus='over';A.app.playResult='You resigned.';A.app.careerScored=true;A.render();});
await page.waitForTimeout(300);
ok(await page.locator('[data-act="revplay"]:not([disabled])').count()>=1&&await page.locator('[data-act="toggleeval"]:not([disabled])').count()===1&&/Evaluation/.test(await txt()),'once it is over, review and the evaluation are there');
// a free game: off by default, on with the setting
await H(()=>{const A=window.__APPHOOK__;A.startPlay('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3','w',null,'Free game',{});A.stopClockTick();
  A.app.playStatus='play';A.playMove('f3','g5');A.stopClockTick();});
ok(await H(()=>window.__APPHOOK__.app.blunderNote)===null,'a free game keeps quiet too, by default');
await H(()=>{const A=window.__APPHOOK__;A.store.settings.freeAids=true;A.startPlay('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3','w',null,'Free game',{});A.stopClockTick();
  A.app.playStatus='play';A.playMove('f3','g5');A.stopClockTick();A.render();});
ok(/drops material/.test(await H(()=>window.__APPHOOK__.app.blunderNote||'')),'and with training help switched on in Settings, it warns');
await H(()=>{const A=window.__APPHOOK__;A.store.settings.freeAids=false;A.app.playStatus='over';A.save();});

/* ---- sponsors ---- */
await tab('media');
t=await txt();
ok(/🤝 Sponsors/.test(t)&&/No sponsor is interested yet/.test(t)&&/1500/.test(t),'the Media tab has a sponsors card, which says what brings them');
await H(()=>{const A=window.__APPHOOK__,c=A.store.career;c.rating=1900;c.peak=1900;c.fame=12;A.save();A.render();});
await page.waitForTimeout(200);
ok(await page.locator('#sponsorcard [data-act="signsponsor"]').count()===3,'with a 1900 rating, three competing offers');
await page.locator('#sponsorcard [data-act="signsponsor"]').nth(1).click();await page.waitForTimeout(300);
t=await page.locator('#sponsorcard').innerText();
ok(/pays/.test(t)&&/weeks left/.test(t),'signed: the card shows the deal, what it pays and how long it runs');
ok(await page.locator('.snack').count()===1,'and the result floats up where you are');
await page.locator('#sponsorcard [data-act="social"][data-val="sponsored"]').click();await page.waitForTimeout(300);
ok(await H(()=>window.__APPHOOK__.store.career.sponsor.posts)===1,'a sponsored post counts for the sponsor');
ok(await H(()=>/#ad/.test(window.__APPHOOK__.store.career.social.tl[0].t)),'and goes on the timeline');
await page.locator('#sponsorcard').screenshot({path:SP+'/life-1-sponsor.png'});

/* ---- media & drama ---- */
await page.click('#mediacard [data-act="drama"][data-val="hottake"]');await page.waitForTimeout(300);
t=await page.locator('#mediacard').innerText();
ok(/You posted “Hot take/.test(t),'a hot take says what happened, on the card itself');
ok(await H(()=>/Hot take/.test(window.__APPHOOK__.store.career.social.tl[0].t)),'and it is a real post on the timeline');
await page.click('#mediacard [data-act="drama"][data-val="feud"]');await page.waitForTimeout(300);
const rv=await H(()=>window.__APPHOOK__.store.career.rival);
ok(rv&&rv.name,'a feud gives you a rival off the list ('+(rv&&rv.name)+')');
ok(await H(()=>/starts a feud with/.test(window.__APPHOOK__.store.career.wire[0].h)),'and the papers print it');
await page.click('#mediacard [data-act="drama"][data-val="callout"]');await page.waitForTimeout(300);
ok(await H(()=>{const c=window.__APPHOOK__.store.career;return c.rival.intensity>=3&&/calls out/.test(c.wire[0].h);}),'calling them out turns up the heat, and it is news');
await page.locator('#mediacard').screenshot({path:SP+'/life-2-media.png'});
await page.click('#mediacard [data-act="rivalmatch"]');await page.waitForTimeout(400);
ok(await H(()=>{const A=window.__APPHOOK__;return A.store.career.tour&&A.store.career.tour.id==='rivalmatch'&&A.app.careerTab==='play';}),'a money match takes you to the Play tab, where it is');

/* ---- rest days, not weeks, during an event ---- */
const w0=await H(()=>window.__APPHOOK__.store.career.weeks);
await H(()=>{const A=window.__APPHOOK__,c=A.store.career;c.energy=40;A.careerRest();});
ok(await H(()=>window.__APPHOOK__.store.career.weeks)===w0&&await H(()=>window.__APPHOOK__.store.career.energy)===40,'a week off in the middle of an event does not happen');
await H(()=>{const A=window.__APPHOOK__,c=A.store.career;c.tour=null;c.money=50000;c.rating=2250;c.peak=2250;A.joinTournament('intl');A.save();A.render();});
await tab('play');
ok(/rest days 0 of 2/.test(await txt())===false&&/rest days 2 of 2/.test(await txt()),'a nine-round classical event has its two rest days');
await page.click('[data-act="simround"]').catch(()=>{});await page.waitForTimeout(800);
await H(()=>{window.__APPHOOK__.store.career.energy=40;window.__APPHOOK__.render();});
await page.click('[data-act="tourrest"]');await page.waitForTimeout(300);
ok(await H(()=>window.__APPHOOK__.store.career.energy)>40&&await H(()=>window.__APPHOOK__.store.career.weeks)===w0,'one between rounds gives energy back, and no week passes');
ok(await page.locator('#restrow [data-act="tourrest"][disabled]').count()>=1&&await page.locator('#restrow [data-act="tourrest"]:not([disabled])').count()===0,'and the next one waits for the next round');
ok(/See \S+/.test(await page.locator('#restrow').innerText()),'abroad, a rest day can also be a day out in the city');
await tab('life');
t=await txt();
ok(/Rest day \(1 left\)/.test(t)&&!/Rest 1wk/.test(t),'the Life tab offers the event’s rest days, not a week off');
await H(()=>{const A=window.__APPHOOK__,c=A.store.career;c.tour=null;A.save();A.render();});

/* ---- a streamed show ---- */
await tab('media');
const r0=await H(()=>window.__APPHOOK__.store.career.rating),d0=await H(()=>{const c=window.__APPHOOK__.store.career;return c.weeks*7+c.day;});
await page.click('#streamcard [data-act="streamshow"][data-val="guess"]');await page.waitForTimeout(800);
t=await txt();
ok(/Guess the Elo/.test(t)&&await page.locator('#streamchat .cm').count()>=2,'Guess the Elo is a game, live, with the chat');
ok(/\?\?/.test(t)&&!/In the booth/.test(t),'the opponent’s rating is hidden, and there is no commentary booth for an online game');
ok(await H(()=>{const c=window.__APPHOOK__.store.career;return c.weeks*7+c.day;})===d0+1,'it takes the day');
await page.evaluate(()=>window.scrollTo(0,0));
await page.screenshot({path:SP+'/life-3-guess.png'});
await page.click('[data-act="presign"]');await page.waitForTimeout(300);
if(await page.locator('[data-act="confirmyes"]').count())await page.click('[data-act="confirmyes"]');
await page.waitForTimeout(600);
t=await txt();
ok(/Stream over/.test(t)&&/is rated \d+!/.test(await page.locator('#streamchat').innerText()),'when it ends, the rating is revealed and the stream is paid');
ok(await H(()=>window.__APPHOOK__.store.career.rating)===r0,'an online game does not touch your FIDE rating');
const opp=await H(()=>window.__APPHOOK__.app.careerRoundOpp.name);
ok(await H(n=>!window.__APPHOOK__.store.career.h2h[n],opp),'nor your head-to-head record');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ life in a browser — no help at the board, media, shows, sponsors, rest days: '+pass+' checks passed');
await b.close(); server.close();
