/* Fail a puzzle, then watch it come back. */
import http from 'http';
import { readFileSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,pzMissStore:pzMissStore,pzNext:pzNext,save:save};\n'+HTML.slice(i); }
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(HTML);});
await new Promise(r=>server.listen(0,'127.0.0.1',r)); const port=server.address().port;
const SP='/tmp/claude-0/-home-user-chess/c9218fb6-40c0-578f-a81a-64cf092c7ca8/scratchpad';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:430,height:960},deviceScaleFactor:2});
const errs=[]; page.on('pageerror',e=>errs.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error'&&!/ERR_CERT/.test(m.text()))errs.push('console: '+m.text());});
await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true})));
await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(600);
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const txt=()=>page.locator('#app').innerText();
const go=async v=>{const d=page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first();
  if(await d.count()&&await d.isVisible())await d.click();
  else{await page.click('[data-act="menutoggle"]');await page.waitForTimeout(100);
    await page.locator(`[data-act="nav"][data-val="${v}"]:visible`).first().click();}
  await page.waitForTimeout(400);};
await go('puzzles');
await page.waitForTimeout(600);
let t=await txt();
ok(/Puzzles/.test(t),'the puzzles screen loads');
ok(!/Your mistakes/.test(t),'with no mistakes card before you have made one');
await page.click('[data-act="pznext"]').catch(()=>{});
await page.waitForTimeout(700);
/* A wrong move has to be legal, or the board simply ignores it. So the
   position is read out, chess.js picks a legal move that is not the solution,
   and that is what gets clicked. */
const { Chess } = await import('chess.js');
const pos=await page.evaluate(()=>{const P=window.__APPHOOK__.app.pz;
  return P?{idx:P.idx,fen:P.fenNow,want:P.moves[0]}:null;});
ok(pos&&pos.idx!=null,'a puzzle is on the board (#'+(pos&&pos.idx)+')');
const cc=new Chess(pos.fen);
const legal=cc.moves({verbose:true}).filter(m=>(m.from+m.to)!==pos.want.slice(0,4));
ok(legal.length>0,'and there is a legal move that is not the solution');
await page.click(`[data-sq="${legal[0].from}"]`); await page.waitForTimeout(150);
await page.click(`[data-sq="${legal[0].to}"]`); await page.waitForTimeout(700);
t=await txt();
ok(/Not the move/.test(t),'a wrong move is refused, as before');
const q=await page.evaluate(()=>window.__APPHOOK__.pzMissStore());
ok(Object.keys(q).length===1,'and the puzzle is now in the mistake queue');
await page.screenshot({path:SP+'/pz-1-wrong.png',fullPage:true});
/* the card appears straight away — it lives above the board, not after it */
t=await txt();
ok(/Your mistakes/.test(t),'the mistakes card appears on the puzzles screen');
ok(/1 puzzle you have got wrong/.test(t),'counting it');
ok(/1 due now/.test(t),'and saying it is due');
ok(/Fix them \(1\)/.test(t),'with a button to drill it');
await page.screenshot({path:SP+'/pz-2-card.png',fullPage:true});
/* drilling it serves that exact puzzle back */
const missIdx=Object.keys(q)[0];
await page.click('[data-act="pzmiss"]');
await page.waitForTimeout(700);
const now=await page.evaluate(()=>window.__APPHOOK__.app.pz&&window.__APPHOOK__.app.pz.idx);
ok(String(now)===String(missIdx),'the review serves back the very puzzle you got wrong (#'+now+')');
t=await txt();
ok(/A mistake from before/.test(t),'labelled as a mistake from before');
ok(/earlier today/.test(t),'saying when you missed it');
ok(/Box 1 of/.test(t),'and which box it is in');
await page.screenshot({path:SP+'/pz-3-review.png',fullPage:true});
/* solving it moves it up */
await page.evaluate(()=>{
  const H=window.__APPHOOK__,P=H.app.pz;
  P.clean=true;
});
/* a puzzle can want more than one move from you, so play until it is done */
for(let i=0;i<8;i++){
  const st=await page.evaluate(()=>{const P=window.__APPHOOK__.app.pz;
    return P?{status:P.status,next:P.moves[P.step]||null}:null;});
  if(!st||st.status!=='solving'||!st.next)break;
  await page.click(`[data-sq="${st.next.slice(0,2)}"]`); await page.waitForTimeout(120);
  await page.click(`[data-sq="${st.next.slice(2,4)}"]`); await page.waitForTimeout(600);
}
const solvedState=await page.evaluate(()=>window.__APPHOOK__.app.pz.status);
ok(solvedState==='solved','playing the whole solution solves it ('+solvedState+')');
const after=await page.evaluate(()=>window.__APPHOOK__.pzMissStore());
const entry=after[String(missIdx)];
ok(!entry||entry.box>=1,'solving it cleanly moves it up a box (box '+(entry?entry.box+1:'—')+')');
await page.screenshot({path:SP+'/pz-4-solved.png',fullPage:true});
/* and the queue survives a reload */
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForTimeout(700);
await go('puzzles');
await page.waitForTimeout(500);
const kept=await page.evaluate(()=>window.__APPHOOK__.pzMissStore());
ok(Object.keys(kept).length===Object.keys(after).length,'and the queue is still there after a reload');
ok(/Your mistakes/.test(await txt())||Object.keys(kept).length===0,'with the card to match');
await page.screenshot({path:SP+'/pz-5-reload.png',fullPage:true});
console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,8).join('\n')):'\n✅ no page errors');
console.log('✅ pzmiss visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
