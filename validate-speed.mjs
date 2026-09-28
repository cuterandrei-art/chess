// Speed on a slow phone: what used to make it wait, and that it still works.
//   node validate-speed.mjs
import { readFileSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
// the puzzle set, as the source file has it
const pzSrc = (() => { const i = html.indexOf('window.__PUZZLES='), j = html.indexOf('</script>', i); return JSON.parse(html.slice(i + 17, j).trim().replace(/;$/, '')); })();
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const until=async(f,ms)=>{const t0=Date.now();while(!f()&&Date.now()-t0<(ms||3000))await tick(10);return f();};

/* One copy of the app per situation: what the page holds, and what the network does. */
function boot(o){
  o=o||{};
  const body='<div id="app"></div>'+(o.tag?'<script type="application/json" id="pzdata">'+JSON.stringify(o.tag)+'</script>':'');
  const dom = new JSDOM('<!doctype html><body>'+body+'</body>', { url: o.url||'https://example.test/' });
  globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
  globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
  globalThis.performance=globalThis.performance||{now:()=>Date.now()};
  globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
  globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
  globalThis.location=dom.window.location;
  const fetched=[];
  globalThis.fetch=async(u)=>{fetched.push(String(u));if(o.serve&&String(u)==='puzzles.json')return {ok:true,json:async()=>JSON.parse(JSON.stringify(o.serve))};throw new Error('offline');};
  dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  if(o.inline)dom.window.__PUZZLES=o.inline;
  localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify(Object.assign({onboarded:true},o.save||{})));
  const X=new Function(script+'\nreturn {store,app,go,render,PUZZLES,pzLoad,pzReady,pzNext,pzDaily,rushStart,pzMissPrune,pzMissStore,BASE,openingBuilt,bookFirst,oppOpenings,scoutCard,autoRunWeek,autoInit,proLeagueBuild,PRO_LEAGUES,PRO_ROSTER,worldRanking,lifeInit};')();
  return {X,dom,fetched};
}
const $=q=>document.querySelector(q);
const SMALL=pzSrc.slice(0,300);

/* ================= the openings are not built to choose an opponent's ================= */
{
  const {X}=boot({inline:SMALL});
  ok(X.BASE.every(o=>!X.openingBuilt(o)),'at start no opening course is built');
  const firsts=X.BASE.map(o=>X.bookFirst(o));
  ok(X.BASE.every(o=>!X.openingBuilt(o)),'reading every opening’s first move builds none of them');
  X.oppOpenings('Somebody Nobody',1850);X.oppOpenings('Another Player',2150);
  ok(X.BASE.every(o=>!X.openingBuilt(o)),'nor does choosing what an opponent plays — which built all of them the first time a scouting card was drawn (1.8 s on a slow phone)');
  ok(X.BASE.every((o,i)=>o.root.children[0].move===firsts[i]),'and the first moves read that way are the ones the built courses start with ('+X.BASE.length+' openings)');
}

/* ================= the puzzles arrive after the first screen ================= */
{
  // the standalone file and the Android app: as data in the page
  const {X,fetched}=boot({tag:SMALL});
  ok(!X.pzReady()&&X.PUZZLES.length===0,'with the puzzles as data in the page, none are read before the first screen');
  X.go('puzzles');
  ok(/Puzzles are loading/.test($('#app').textContent),'opening Puzzles straight away says they are on their way');
  await until(()=>X.app.pz);
  ok(X.PUZZLES.length===SMALL.length&&X.app.pz&&$('.board'),'and shows a puzzle the moment they are read ('+X.PUZZLES.length+')');
  ok(document.getElementById('pzdata').textContent==='','the text in the page is let go once read');
  ok(!fetched.length,'nothing is fetched when the page has them');
}
{
  // the website: puzzles.json beside the page
  const {X,fetched}=boot({serve:SMALL});
  ok(await X.pzLoad()===true&&X.PUZZLES.length===SMALL.length&&fetched[0]==='puzzles.json','the website fetches puzzles.json');
}
{
  // on its own a few moments after the first screen
  const {X}=boot({tag:SMALL});
  await until(()=>X.pzReady(),2500);
  ok(X.pzReady(),'without being asked, they arrive a moment after the first screen');
}
{
  // offline on a first visit, then back online
  const o={};const {X,fetched}=boot(o);
  ok(await X.pzLoad()===false&&X.PUZZLES.length===0,'with no network and no copy, loading says it could not');
  o.serve=SMALL;
  ok(await X.pzLoad()===true&&X.PUZZLES.length===SMALL.length&&fetched.length===2,'and tries again the next time, rather than giving up for good');
}
{
  // what was asked for before they came
  let r=boot({tag:SMALL});
  r.X.pzDaily();await until(()=>r.X.app.pz);
  let h=0;for(const c of (new Date()).toDateString())h=(h*31+c.charCodeAt(0))>>>0;
  ok(r.X.app.pz&&r.X.app.pz.idx===h%SMALL.length,'the daily puzzle asked for early is today’s, not the first one');
  r=boot({tag:SMALL});
  r.X.rushStart();await until(()=>r.X.app.rush);
  ok(r.X.app.rush&&r.X.app.pz,'a puzzle rush asked for early starts when they arrive');
  r=boot({tag:SMALL});
  r.X.pzNext(123);await until(()=>r.X.app.pz);
  ok(r.X.app.pz&&r.X.app.pz.idx===123,'and a particular puzzle is that puzzle');
}
{
  // the ones you got wrong must not be thrown away before the set is there
  const miss={'5':{at:1,due:1,n:1},'250':{at:1,due:1,n:1},'999999':{at:1,due:1,n:1}};
  const {X}=boot({tag:SMALL,save:{puzzle:{rating:1500,solved:0,failed:0,streak:0,best:0,miss:miss}}});
  const M0=Object.keys(X.pzMissStore()).length;
  X.pzMissPrune();
  ok(Object.keys(X.pzMissStore()).length===M0&&M0>=3,'before the set has arrived, none of the puzzles you got wrong are pruned');
  await X.pzLoad();X.pzMissPrune();
  const left=Object.keys(X.pzMissStore());
  ok(left.includes('5')&&left.includes('250')&&!left.includes('999999'),'after, only an entry the set does not have is dropped');
}

/* ================= a week run for you saves and draws once ================= */
{
  const {X}=boot({inline:SMALL});
  X.go('career');$('#cr-name').value='Speedy';$('[data-act="careersetup"]').click();
  const c=X.store.career;X.lifeInit(c);X.autoInit(c);
  let saves=0,draws=0;
  // (assigning setItem on the storage itself would only store an item called "setItem")
  const SP=Object.getPrototypeOf(window.localStorage),set=SP.setItem;
  SP.setItem=function(k,v){if(k==='opening-trainer-standalone-v1')saves++;return set.call(this,k,v);};
  const el=document.getElementById('app'),P=Object.getPrototypeOf(Object.getPrototypeOf(el)),d=Object.getOwnPropertyDescriptor(window.Element.prototype,'innerHTML');
  Object.defineProperty(el,'innerHTML',{set(v){draws++;d.set.call(this,v);},get(){return d.get.call(this);},configurable:true});
  const w0=c.weeks||0,days=X.autoRunWeek(c);
  ok(days>=1,'a week run for you plays its days ('+days+')');
  ok(saves===1&&draws===1,'and saves once and draws once, not once a day ('+saves+' save, '+draws+' draw)');
  SP.setItem=set;
}

/* ================= the club leagues are drawn from the right players, faster ================= */
{
  const {X}=boot({inline:SMALL});
  X.go('career');$('#cr-name').value='Leagues';$('[data-act="careersetup"]').click();
  const c=X.store.career;Object.assign(c,{provisional:false,rating:2300,peak:2300});X.lifeInit(c);
  const R=X.worldRanking(c,'classical').filter(p=>!p.you),byId={};R.forEach(p=>byId[p.id]=p);
  let worst=0,picks=0,dup=false;
  for(const L of X.PRO_LEAGUES){
    const t0=Date.now(),G=X.proLeagueBuild(c,L,1),used={};
    for(const club of G.clubs){
      club.roster.forEach((id,i)=>{
        const t=club.str+70-i*28,gap=Math.abs(byId[id].rating-t);
        let min=Infinity;R.forEach(p=>{if(!used[p.id])min=Math.min(min,Math.abs(p.rating-t));});
        worst=Math.max(worst,gap-min);if(used[id])dup=true;used[id]=1;picks++;
      });
    }
  }
  ok(picks>0&&!dup,'every club’s roster is filled, nobody twice ('+picks+' players)');
  ok(worst<20,'each pick is the player nearest the place, give or take the 20-point shuffle — as reading the whole list gave (worst '+worst.toFixed(1)+')');
}

/* ================= the builds ================= */
const { puzzleSplit, puzzlesAsData, puzzlesEmbed } = await import('./build/puzzles.mjs');
{
  const sp=puzzleSplit(html);
  ok(!/window\.__PUZZLES=/.test(sp.html)&&JSON.parse(sp.json).length===pzSrc.length,'the website build takes the puzzles out of the page, all '+pzSrc.length.toLocaleString());
  const d=puzzlesAsData(html);
  const m=d.match(/<script type="application\/json" id="pzdata">([\s\S]*?)<\/script>/);
  ok(m&&JSON.parse(m[1]).length===pzSrc.length&&!/window\.__PUZZLES=/.test(d),'the standalone build keeps them, as data');
  ok(puzzlesAsData(d)===d,'doing it twice changes nothing');
  const em=puzzlesEmbed(sp.html,sp.json);
  ok(/id="pzdata"/.test(em)&&puzzlesEmbed(em,sp.json)===em,'and the Android build puts them back into the website’s page, as data');
}
ok(/puzzleSplit\(idx\)/.test(readFileSync('build-netlify.mjs','utf8'))&&/puzzlesAsData\(html\)/.test(readFileSync('build-standalone.mjs','utf8')),'build-netlify and build-standalone do so');
const idx=readFileSync('netlify/index.html','utf8');
ok(!/window\.__PUZZLES=/.test(idx)&&idx.length<2.6e6,'netlify/index.html is '+(idx.length/1e6).toFixed(1)+' MB, not 4.6');
ok(JSON.stringify(JSON.parse(readFileSync('netlify/puzzles.json','utf8')))===JSON.stringify(pzSrc),'netlify/puzzles.json is the same set as the source');
const sw=readFileSync('netlify/sw.js','utf8');
ok(/const DATA = \['\.\/puzzles\.json'\]/.test(sw)&&/c\.addAll\(DATA\)\.catch/.test(sw),'the installed app keeps puzzles.json for offline use');
ok(/cp netlify\/puzzles\.json _site\//.test(readFileSync('.github/workflows/pages.yml','utf8')),'GitHub Pages publishes it');
ok(/node build\/puzzles\.mjs embed "\$WWW\/index\.html" netlify\/puzzles\.json/.test(readFileSync('.github/workflows/android.yml','utf8')),'the Android build embeds it');
if(existsSync('ChessCareer-standalone.html')){const sa=readFileSync('ChessCareer-standalone.html','utf8');
  ok(/id="pzdata"/.test(sa)&&/id="sf19data"/.test(sa)&&!/window\.__SF19=/.test(sa),'the standalone file carries the puzzles and the engine as data, neither as script');}

console.log('\n✅ speed: '+pass+' checks passed');
process.exit(0);
