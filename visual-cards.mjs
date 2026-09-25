/* In a real browser: your mistakes coming back as puzzles, a result card for a
   game and for an event drawn on a canvas and saved, and the biography with
   its career card. */
import http from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,Chess:Chess,joinTournament:joinTournament,careerResult:careerResult,stopClockTick:stopClockTick,_simRound:_simRound,gmStore:gmStore,gmDue:gmDue};\n'+HTML.slice(i); }
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
await H(()=>window.__APPHOOK__.go('career'));await page.waitForTimeout(200);
await page.fill('#cr-name','Ada Marín');await page.selectOption('#cr-start','master').catch(()=>{});await page.selectOption('#cr-fed','ROU').catch(()=>{});
await page.click('[data-act="careersetup"]');await page.waitForTimeout(400);

/* ---- a game, its post-mortem, the deck and the card ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;c.money=20000;c.weeks=15;c.day=0;S.store.settings.roundIntro=false;S.joinTournament('reykjavik');S.app.careerTab='play';S.save();S.render();});
await page.click('[data-act="careerplay"]');await page.waitForTimeout(800);
const sans='e4 e5 Qh5 Nc6 Qxf7+ Kxf7 Bc4+ d5 Bxd5+ Qxd5 Nc3 Qd8 Nf3 Nf6 d3 Bc5 O-O Rf8 Be3 Bxe3 fxe3 Kg8'.split(' ');
await H((sans)=>{const S=window.__APPHOOK__,a=S.app;S.stopClockTick();
  const g=new S.Chess();a.playSide='w';a.playStack=[g.fen()];a.playMoves=[];
  for(const x of sans){const m=g.move(x);a.playMoves.push({san:m.san,from:m.from,to:m.to});a.playStack.push(g.fen());}
  a.playFen=g.fen();a.playView=a.playStack.length-1;a.playStatus='over';a.playResult='Checkmate — you lost.';S.careerResult(0);S.render();},sans);
let pm='';
for(let i=0;i<180;i++){pm=await page.locator('#postmortem').innerText().catch(()=>'');if(/💬/.test(pm))break;await page.waitForTimeout(500);}
ok(/into your deck of mistakes/.test(pm),'the post-mortem puts your mistakes in your deck: “'+(pm.match(/🎯[^\n]*/)||[''])[0].slice(2,90)+'…”');
const deck=await H(()=>Object.values(window.__APPHOOK__.gmStore()));
ok(deck.length>=1&&deck.every(e=>e.src&&e.src.opp&&e.bestSan&&e.due>Date.now()),deck.length+' position(s), each with where it came from, due tomorrow');
ok(await page.locator('[data-act="cardopen"][data-val="game"]').count()===1,'the result has a “Result card” button');
await page.click('[data-act="cardopen"][data-val="game"]');
await page.waitForSelector('#cardimg',{timeout:15000});
const dim=await H(()=>{const im=document.getElementById('cardimg');return [im.naturalWidth,im.naturalHeight];});
ok(dim[0]===1080&&dim[1]===1350,'the game card is a 1080 × 1350 image');
const sz=await saveImg('cards-1-game.png');
ok(sz>60000,'with a board and the players drawn on it ('+Math.round(sz/1024)+' KB)');
const [dl]=await Promise.all([page.waitForEvent('download',{timeout:8000}),page.click('[data-act="cardsave"]')]);
ok(/ada-mar-n-game-card\.png$|-game-card\.png$/.test(dl.suggestedFilename()),'“Save image” downloads it as '+dl.suggestedFilename());
await page.screenshot({path:SP+'/cards-2-view.png'});

/* ---- the deck comes back ---- */
await H(()=>{const M=window.__APPHOOK__.gmStore();Object.values(M).forEach(e=>e.due=Date.now()-1000);window.__APPHOOK__.save();window.__APPHOOK__.go('puzzles');});
await page.waitForTimeout(400);
ok(/Mistakes from your games/.test(await txt())&&await page.locator('[data-act="gmstart"]').count()===1,'a day later, the Puzzles page has them due');
await page.click('[data-act="gmstart"]');await page.waitForTimeout(400);
ok(/From your game against/.test(await txt()),'the position says where it came from');
const best=await H(()=>{const it=window.__APPHOOK__.app.drill.items[0];return it.bestUci;});
await page.click('[data-sq="'+best.slice(0,2)+'"]').catch(()=>{});await page.waitForTimeout(150);
await page.click('[data-sq="'+best.slice(2,4)+'"]').catch(()=>{});await page.waitForTimeout(400);
ok(/It comes back in 3 days/.test(await txt()),'find the move, and it comes back in three days');
ok(await H(()=>{const M=window.__APPHOOK__.gmStore();return Object.values(M).some(e=>e.box===1);}),'up a box in the deck');

/* ---- an event and its card ---- */
await H(()=>{const S=window.__APPHOOK__,c=S.store.career;while(c.tour)S._simRound(c);S.app.careerTab='play';S.go('career');});
await page.waitForTimeout(400);
ok(await page.locator('[data-act="cardopen"][data-val="event"]').count()===1,'the finished event has a card too');
await page.click('[data-act="cardopen"][data-val="event"]');
await page.waitForSelector('#cardimg',{timeout:15000});
await saveImg('cards-3-event.png');
ok(/Event card/.test(await txt()),'an event card: place, score and every game');

/* ---- the biography ---- */
await H(()=>{const S=window.__APPHOOK__;S.app.careerTab='legacy';S.go('career');});await page.waitForTimeout(300);
await page.click('[data-act="bioopen"]');await page.waitForTimeout(400);
const bio=await txt();
ok(/Ada Marín \(born \d{4}\) is a Romanian chess (player|grandmaster)/.test(bio),'the biography opens like an encyclopedia article');
ok(await page.locator('.bio-box').count()===1&&/Peak rating/.test(bio)&&/Reykjavik Open/.test(bio),'with an infobox, and the season’s events');
await page.screenshot({path:SP+'/cards-4-bio.png',fullPage:true});
await page.click('[data-act="cardopen"][data-val="career"]');
await page.waitForSelector('#cardimg',{timeout:15000});
await saveImg('cards-5-career.png');
ok(/Career card/.test(await txt()),'and a career card');
await page.click('#app [data-act="back"]');await page.waitForTimeout(300);
ok(await H(()=>window.__APPHOOK__.app.view)==='bio','← goes back to the biography');

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ the deck, the cards and the biography in a browser: '+pass+' checks passed');
await b.close(); server.close();
