/* The news board, a streamed game and the timeline, in a browser: the board
   floats and can be dragged, the stories are the week's real results, the
   chat talks about the game being played, and a post gets answers that want
   answering. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,save:save,go:go,lifeInit:lifeInit,endOfWeek:endOfWeek,'+
    'startChallenge:startChallenge,buildWorld:buildWorld,streamIdle:streamIdle};\n'+HTML.slice(i); }
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
await page.evaluate(()=>{
  const H=window.__APPHOOK__,c=H.store.career;H.lifeInit(c);
  c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';c.rating=2560;c.provisional=false;c.peak=2560;c.money=50000;
  c.subs=1500;c.fans=6000;c.fame=35;c.social.followers=4000;
  c.rival={id:'nakamura',name:'H. Nakamura',flag:'🇺🇸',rating:2780,intensity:2,since:1};
  H.save();H.render();
});

/* ---- the news board ---- */
ok(await page.locator('#newsfab').count()===1,'the news board floats over the career screen');
// a few weeks go by in the world
await page.evaluate(()=>{const H=window.__APPHOOK__,c=H.store.career;for(let i=0;i<6;i++)H.endOfWeek(c);H.save();H.render();});
await page.waitForTimeout(300);
const badge=await page.locator('#newsfab .nbadge').innerText().catch(()=>'');
ok(/\d/.test(badge),'with a count of what has not been read ('+badge+')');
const fab0=await page.locator('#newsfab').boundingBox();
await page.click('#newsfab');await page.waitForTimeout(300);
let panel=await page.locator('.newspanel').innerText();
ok(/News board/.test(panel),'tapping it opens the board');
ok(/Tata Steel Masters|Hastings Congress|Gibraltar Masters/.test(panel),'with the week’s real results in it');
ok(/The Sixty-Four Gazette|Board Wire|The Rating Desk/.test(panel),'written up by the outlets, each on its beat');
ok(await page.locator('#newsfab .nbadge').count()===0,'and opening it marks them read');
await page.screenshot({path:SP+'/media-1-board.png'});
await page.click('.nchip[data-val="ratings"]');await page.waitForTimeout(200);
panel=await page.locator('.newspanel').innerText();
ok(/list/.test(panel)&&!/Hastings Congress/.test(panel),'the filters narrow it to one kind of story');
await page.locator('.nart').first().click();await page.waitForTimeout(200);
ok(await page.locator('.newspanel .ntbl').count()===1,'and a rating-list story opens to the top ten');
await page.screenshot({path:SP+'/media-2-list.png'});
await page.click('.newspanel [data-act="newstoggle"]');await page.waitForTimeout(200);
ok(await page.locator('.newspanel').count()===0,'the board closes again');
// drag the button to the top left
await page.mouse.move(fab0.x+26,fab0.y+26);await page.mouse.down();
await page.mouse.move(120,300,{steps:8});await page.mouse.move(60,200,{steps:8});await page.mouse.up();
await page.waitForTimeout(300);
const fab1=await page.locator('#newsfab').boundingBox();
ok(Math.abs(fab1.x-fab0.x)>100&&Math.abs(fab1.y-fab0.y)>100,'the button can be dragged out of the way');
ok(await page.locator('.newspanel').count()===0,'and a drag is not a tap');
const pos=await page.evaluate(()=>window.__APPHOOK__.store.settings.newsPos);
ok(pos&&pos.x<0.3&&pos.y<0.4,'where it is left is remembered');
await go('play');await page.waitForTimeout(200);
const fab2=await page.locator('#newsfab').boundingBox();
ok(fab2&&Math.abs(fab2.x-fab1.x)<3&&Math.abs(fab2.y-fab1.y)<3,'and it stays there on every screen');

/* ---- a streamed game ---- */
await page.evaluate(()=>{const H=window.__APPHOOK__;H.app.chalFormat='classical';
  const p=H.buildWorld().find(x=>x.id==='nakamura');H.startChallenge(p.id);});
await page.waitForTimeout(800);
let t=await txt();
ok(/Stream this game/.test(t)&&/Go live/.test(t),'a career game can be streamed');
await page.click('[data-act="streamgo"]');await page.waitForTimeout(300);
ok(await page.locator('#streamchat .cm').count()>=2,'going live, the chat says hello');
// play until a few moves are on the board; the engine answers
const side=await page.evaluate(()=>window.__APPHOOK__.app.playSide);
const myMoves=side==='w'?[['e2','e4'],['g1','f3'],['f1','c4'],['e1','g1']]:[['e7','e5'],['b8','c6'],['g8','f6'],['f8','e7']];
for(const [f,to] of myMoves){
  for(let i=0;i<40;i++){const st=await page.evaluate(()=>{const a=window.__APPHOOK__.app;return a.playStatus+'|'+(a.playFen||'').split(' ')[1]+'|'+a.playSide;});
    const [s0,turn,sd]=st.split('|');if(s0==='play'&&turn===sd)break;await page.waitForTimeout(250);}
  await page.click(`[data-sq="${f}"]`).catch(()=>{});await page.waitForTimeout(80);
  await page.click(`[data-sq="${to}"]`).catch(()=>{});await page.waitForTimeout(400);
  // chat keeps talking while you think
  await page.evaluate(()=>{const S=window.__APPHOOK__.app.stream;if(S){S.next=0;}window.__APPHOOK__.streamIdle();});
}
await page.waitForTimeout(600);
const S=await page.evaluate(()=>{const S=window.__APPHOOK__.app.stream;return {n:S.chat.length,ply:S.ply,viewers:S.viewers,lines:S.chat.map(m=>m.t)};});
ok(S.ply>=4,'the chat follows the game move by move ('+S.ply+' plies)');
ok(S.n>=6,'and has plenty to say ('+S.n+' lines)');
ok(S.lines.some(l=>/Nakamura|RIVAL|rival/i.test(l)),'about this game: it knows the opponent is your rival');
ok(/👁/.test(await page.locator('#streamstats').innerText()),'the viewer count is on screen');
// a question, answered
await page.evaluate(()=>{const S=window.__APPHOOK__.app.stream;S.qaAt=0;S.next=0;window.__APPHOOK__.streamIdle();});
await page.waitForTimeout(200);
if(await page.locator('[data-act="streamans"]').count()){
  await page.locator('[data-act="streamans"]').first().click();await page.waitForTimeout(300);
  ok(await page.locator('#streamchat .cm.me').count()>=1,'a viewer’s question gets your answer, in the chat');
} else ok(true,'(no question was pinned this time)');
await page.evaluate(()=>window.scrollTo(0,0));
await page.screenshot({path:SP+'/media-3-stream.png',fullPage:true});
// resign: the stream ends with the numbers
await page.click('[data-act="presign"]');await page.waitForTimeout(400);
if(await page.locator('[data-act="confirmyes"]').count())await page.click('[data-act="confirmyes"]');
await page.waitForTimeout(800);
t=await txt();
ok(/Stream over/.test(t)&&/subscribers/.test(t),'when the game ends, so does the stream — with what it earned');
const R=await page.evaluate(()=>window.__APPHOOK__.store.career.stream);
ok(R&&R.sessions===1&&R.last&&R.last.peak>0,'and the career remembers it (peak '+(R&&R.last&&R.last.peak)+')');

/* ---- the timeline ---- */
await go('career');
await page.click('[data-act="careertab"][data-val="media"]');await page.waitForTimeout(300);
t=await txt();
ok(/Post about/.test(t)&&/Your stream against H\. Nakamura/.test(t),'the timeline offers to post about what just happened');
await page.click('[data-act="socialpick"]:has-text("Your rival")');await page.waitForTimeout(200);
await page.click('[data-act="socialtone"][data-val="spicy"]');await page.waitForTimeout(200);
ok(await page.locator('.spreview').count()===1,'a tone writes the post, to read before it goes out');
await page.click('[data-act="socialpost"]');await page.waitForTimeout(300);
const post=await page.evaluate(()=>{const s=window.__APPHOOK__.store.career.social;return s.tl[0];});
ok(post&&post.a.you&&post.rp.length>=2,'posted, with replies ('+(post&&post.rp.length)+')');
ok(post.rp.some(r=>/Nakamura/.test(r.a.n)),'and a spicy post about your rival gets your rival’s answer');
const fire=page.locator('[data-act="socialans"][data-val$=":fire"]');
ok(await fire.count()===1,'which you can answer');
await page.screenshot({path:SP+'/media-4-timeline.png',fullPage:false});
await fire.click();await page.waitForTimeout(300);
const w0=await page.evaluate(()=>window.__APPHOOK__.store.career.wire[0].h);
ok(/trade shots online/.test(w0),'and firing back makes the tabloid ('+w0+')');
await page.locator('.spost').first().screenshot({path:SP+'/media-5-post.png'});

ok(errs.length===0,'no errors in the console'+(errs.length?': '+errs[0]:''));
console.log('\n✅ news board, stream and timeline in a browser: '+pass+' checks passed');
await b.close(); server.close();
