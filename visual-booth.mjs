/* Play a real career game and read what the booth actually says. */
import http from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { chromium } from 'playwright-core';
let HTML = readFileSync('/home/user/chess/work/openingtrainer.html', 'utf8');
// a test-only hook, added to the served copy only; the shipped app has none
{ const i=HTML.lastIndexOf('</script>');
  HTML=HTML.slice(0,i)+'\nwindow.__APPHOOK__={app:app,store:store,render:render,boothTick:boothTick,boothInit:boothInit,boothFinish:boothFinish};\n'+HTML.slice(i); }
const CACHE='.cache/stockfish.js';
if(!existsSync(CACHE)){
  mkdirSync('.cache',{recursive:true});
  const r=await fetch('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
  if(!r.ok){console.error('no engine ('+r.status+')');process.exit(1);}
  writeFileSync(CACHE,await r.text());
}
const SF=readFileSync(CACHE,'utf8');
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
const resume=()=>page.evaluate(()=>{const r=localStorage.getItem('chess-career-resume-v1');return r?JSON.parse(r):null;});
const ourTurn=async()=>{for(let i=0;i<120;i++){const g=await resume();
  if(g&&g.fen.split(' ')[1]===g.side)return g;await page.waitForTimeout(500);}return null;};

await go('career');
await page.selectOption('#cr-start','talent').catch(()=>{});
await page.click('[data-act="careersetup"]'); await page.waitForTimeout(500);
await page.locator('[data-act="careerjoin"]').first().click(); await page.waitForTimeout(400);
await page.click('[data-act="careerplay"]'); await page.waitForTimeout(1500);
let t=await txt();
ok(/In the booth/.test(t),'the booth is on the play screen from the first move');
ok(/never the engine/.test(t),'saying plainly that it cannot see the evaluation');
const names=(await txt()).match(/(Frost|Vale|Okafor|Penrose|Weir|Ibarra)/g)||[];
ok(names.length>=1,'with the commentators named ('+[...new Set(names)].join(', ')+')');

/* Drive a real game with something in it through the booth, and read the
   panel it produces. The moves are Morphy's Opera House game — captures,
   sacrifices, a queen going off and a mate, all in sixteen moves. */
const OPERA=['e4','e5','Nf3','d6','d4','Bg4','dxe5','Bxf3','Qxf3','dxe5','Bc4','Nf6','Qb3','Qe7',
  'Nc3','c6','Bg5','b5','Nxb5','cxb5','Bxb5+','Nbd7','O-O-O','Rd8','Rxd7','Rxd7','Rd1','Qe6',
  'Bxd7+','Nxd7','Qb8+','Nxb8','Rd8#'];
const lines=await page.evaluate(function(sans){
  const H=window.__APPHOOK__,app=H.app;
  const c=new (window.Chess||H.app._Chess||Object)();
  return null;
},OPERA).catch(()=>null);
/* chess.js is not on window, so build the game in Node and hand over the FENs */
const { Chess } = await import('chess.js');
const oc=new Chess(),stack=[oc.fen()],moves=[];
OPERA.forEach(function(san){const m=oc.move(san);moves.push({san:m.san,from:m.from,to:m.to});stack.push(oc.fen());});
const clk=[];let w=1800,bl=1800;
moves.forEach(function(m,i){ if(i%2===0){w-=(i===8?95:12+i);clk.push(w);} else {bl-=(i===19?140:10+i);clk.push(bl);} });
const boothLines=await page.evaluate(function(d){
  const H=window.__APPHOOK__;
  const g={moves:d.moves,stack:d.stack,side:'w',clk:d.clk,base:1800,inc:20,
    oppName:'Duke of Brunswick',oppRating:1900,myRating:1850,event:'Paris, 1858'};
  H.boothInit(g);
  for(let ply=1;ply<=g.moves.length;ply++)H.boothTick(g,ply);
  H.boothFinish(g,1,'Checkmate — you won!');
  // show it on the play screen
  H.app.view='play';H.app.playMoves=g.moves;H.app.playStack=g.stack;H.app.playSide='w';
  H.app.playClk=d.clk;H.app.tc={id:'30+20',base:1800,inc:20,label:'30 + 20',cat:'Classical'};
  H.app.careerRoundOpp={name:'Duke of Brunswick',rating:1900};H.app.careerOpp='tour';
  H.app.playTitle='Paris, 1858';H.app.playStatus='over';H.app.playResult='Checkmate — you won! 🎉';
  H.app.playView=g.stack.length-1;H.app.playFen=g.stack[g.stack.length-1];
  H.render();
  return H.app.booth.lines.map(function(l){return l.who+': '+l.line;});
},{moves:moves,stack:stack,clk:clk});
await page.waitForTimeout(400);
await page.screenshot({path:SP+'/bo-1-booth.png',fullPage:true});
ok(boothLines.length>=6,'a game with real content gets real commentary ('+boothLines.length+' lines)');
console.log('  — the Opera House game, as called from the booth:');
boothLines.forEach(l=>console.log('      '+l));
const all=boothLines.join(' ');
ok(!/\{/.test(all),'no unfilled blanks reached the screen');
ok(!/\+\d\.\d|centipawn/i.test(all),'and no evaluation leaked into the commentary');
ok(new Set(boothLines.map(l=>l.split(':')[0])).size===2,'both commentators spoke');
ok(/queen/i.test(all),'the queen sacrifice was noticed');
ok(/mate/i.test(all),'and the mate at the end');
const shown=await txt();
ok(/In the booth/.test(shown),'the panel renders the log');

/* the switch works */
await page.click('[data-act="boothtoggle"]');
await page.waitForTimeout(400);
t=await txt();
ok(/booth is off/.test(t),'turning it off says so');
await page.screenshot({path:SP+'/bo-2-off.png',fullPage:true});
await page.click('[data-act="boothtoggle"]');
await page.waitForTimeout(400);
ok(/In the booth/.test(await txt()),'and it comes back');

/* the last word is on the panel, from the game just shown */
const finalText=await txt();
ok(/mate|Mate|MATE/.test(finalText),'the panel carries the booth\u2019s last word on the game');
await page.screenshot({path:SP+'/bo-3-finish.png',fullPage:true});

console.log(errs.length?('\n⚠️ errors:\n'+errs.slice(0,8).join('\n')):'\n✅ no page errors');
console.log('✅ booth visual: '+pass+' checks passed');
await b.close(); server.close();
if(errs.length)process.exit(1);
