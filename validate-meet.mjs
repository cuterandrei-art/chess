// Your careers meet: each one is a player in the others' worlds.   node validate-meet.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
globalThis.fetch=async()=>{throw new Error('offline in the test');};
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.__PUZZLES=[];
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const X=new Function(script+'\nreturn {store,app,go,render,buildWorld,worldRanking,worldPick,worldVsYou,oppOpenings,oppAvatar,avatarChar,oppRing,careerSlots,careerSwitch,careerStartAnother,careerMeta,scoutCard,ghostH2H,backupJson,restoreBackup,worldById,BUILT,pubRating,wpRating,wpStrength,wpTitle,lifeInit,GHOST_BAND};')();
const $=q=>document.querySelector(q);
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act+' '+(val||''));b.click();return b;};
const idle=async()=>{for(let i=0;i<300&&X.app.careerBusy;i++)await tick(5);await tick(5);};
const setup=(name,fed)=>{X.go('career');$('#cr-name').value=name;if(fed)$('#cr-fed').value=fed;click('careersetup');return X.store.career;};
const text=()=>$('#app').textContent;
const ghostIn=(name)=>X.buildWorld().find(p=>p.ghost&&p.name===name);

/* ================= two careers ================= */
let A=setup('Ana Popescu','ROU');
Object.assign(A,{provisional:false,rating:2104,peak:2150,ratedGames:60,ratingRapid:2050,ratingBlitz:1990,weeks:77,season:3,age:19,titles:['CM'],str:{classical:2046}});
X.lifeInit(A);X.render();
const meta=X.careerMeta(A);
ok(meta.rating===2104&&meta.rr===2050&&meta.rb===1990&&meta.str===2046&&meta.fed==='ROU'&&meta.title==='CM','a career put aside keeps what the others need: ratings in all three formats, its real strength, federation, title');
ok(meta.av&&JSON.stringify(meta.av)===JSON.stringify(A.avatar),'and its face');
const aid=A.cid;
await X.careerStartAnother();
let B=setup('Bogdan Ionescu','ROU');
Object.assign(B,{provisional:false,rating:2010,peak:2010,ratedGames:40,weeks:30,season:1,age:17});
X.lifeInit(B);X.render();
const gA=ghostIn('Ana Popescu');
ok(gA&&gA.id==='y'+aid&&gA.ghost===aid,'Ana, the career put aside, is a player in Bogdan’s world');
ok(X.pubRating(gA,'classical')===2104&&X.wpRating(gA,'rapid')===2050&&X.wpRating(gA,'blitz')===1990,'at the ratings she really has (2104, rapid 2050, blitz 1990)');
ok(Math.round(X.wpStrength(gA,'classical'))===2046,'and as strong as she really is — her strength, not her rating (2046)');
ok(X.wpTitle(gA)==='CM'&&gA.fed==='ROU'&&gA.flag===A.flag,'with her title, federation and flag');
const row=X.worldRanking(B,'classical').find(p=>p.ghost===aid);
ok(row&&row.rank>0,'she is on the rating list (#'+(row&&row.rank)+')');
X.app.careerTab='world';X.render();
ok(/Ana Popescu/.test(text())&&$('[title="Your other career"]'),'and the World tab marks her 👥');

/* ================= who is not on the list ================= */
X.careerSlots()[0].meta.rating=null;X.careerSlots()[0].at++;
ok(!ghostIn('Ana Popescu'),'a career with no published rating is not on the list');
X.careerSlots()[0].meta.rating=2104;X.careerSlots()[0].meta.retired=true;X.careerSlots()[0].at++;
ok(!ghostIn('Ana Popescu'),'nor is one that has retired');
X.careerSlots()[0].meta.retired=false;X.careerSlots()[0].at++;
ok(ghostIn('Ana Popescu'),'she is back when neither is true');

/* ================= they turn up in events ================= */
let seen=0,near=0;const T=[2100,2080,2120,2060,2150,2040,2110,2090,2130];
for(let i=0;i<300;i++){const f=X.worldPick(T,{fmt:'classical'});if(f&&f.some(o=>o.wid==='y'+aid))seen++;}
ok(seen/300>0.35&&seen/300<0.95,'an event at her level has her in it a fair share of the time ('+Math.round(seen/3)+'%)');
for(let i=0;i<200;i++){const f=X.worldPick([1500,1480,1520,1460,1540],{fmt:'classical'});if(f&&f.some(o=>o.wid==='y'+aid))near++;}
ok(near===0,'and never in one far below it');
const wf=X.worldPick([2100],{fmt:'classical',women:true});
ok(!(wf||[]).some(o=>o.wid==='y'+aid),'a women’s event does not draw a career on the open track');

/* ================= as themselves ================= */
const op=BUILTfirst('white'),bp=BUILTfirst('black');
function BUILTfirst(side){return X.BUILT.find(o=>o.side===side).id;}
X.careerSlots()[0].meta.reps={w:op,b:bp};X.careerSlots()[0].meta.style='aggressive';X.careerSlots()[0].at++;
const R=X.oppOpenings('Ana Popescu');
ok(R.w===op&&R.b===bp&&R.known.w&&R.known.b,'she plays the openings she plays in her own games — and they are known');
let styled=null;for(let i=0;i<60&&!styled;i++){const f=X.worldPick(T,{fmt:'classical'});styled=f&&f.find(o=>o.wid==='y'+aid);}
ok(styled&&styled.style==='aggressive','and in her own style');
const av1=X.oppAvatar({name:'Ana Popescu',wid:'y'+aid,rating:2104,title:'CM'},40);
ok(av1===X.avatarChar(A.avatar,40,X.oppRing({title:'CM'}),null),'with her own face, not an invented one');
const sc=X.scoutCard(B,{name:'Ana Popescu',wid:'y'+aid,rating:2104,title:'CM',flag:A.flag,fed:'ROU'},'Round 1');
ok(/This is Ana Popescu, your other career/.test(sc)&&/news in their world too/.test(sc),'the scouting card says who she is');

/* ================= a game between them ================= */
const before=X.wpRating(gA,'classical');
X.worldVsYou(B,{name:'Ana Popescu',wid:'y'+aid,rating:2104},1,'classical');
const M=X.store.careerMeets;
ok(M&&M.length===1&&M[0].a===B.cid&&M[0].b===aid&&M[0].s===1,'Bogdan beats her: the game is recorded between the two careers');
ok(X.wpRating(ghostIn('Ana Popescu'),'classical')<before,'her rating in this world drops, like anybody’s ('+before+' → '+X.wpRating(ghostIn('Ana Popescu'),'classical')+')');
ok(B.feed&&/You beat Ana Popescu — your other career/.test(B.feed[0].t),'it is on Bogdan’s news board at once');
ok(X.ghostH2H(B.cid,aid).w===1&&X.ghostH2H(aid,B.cid).l===1,'and counts in the head to head, from either side');

/* ================= and news in hers ================= */
X.app.careersOpen=true;X.render();
ok(/you are 1–0–0 against each other/.test($('#careerscard').textContent),'the careers list shows the head to head');
click('careerswitch',aid);await idle();
const An=X.store.career;
ok(An.cid===aid&&/While you were away, you met Bogdan Ionescu once in their world: 1 loss/.test(text()),'opening Ana’s career: “while you were away, you met Bogdan — 1 loss”');
ok(An.feed&&An.feed.some(f=>/Meanwhile, in Bogdan Ionescu’s career: Bogdan Ionescu beat you/.test(f.t)),'and the game is on her news board');
X.app.careerToast=null;
const gB=ghostIn('Bogdan Ionescu');
ok(gB&&X.pubRating(gB,'classical')===2010,'Bogdan is on Ana’s list, where his career really is (2010)');
click('careersopen');click('careerswitch',B.cid);await idle();
ok(!/While you were away/.test(text()),'news is given once');
ok(Math.round(X.wpRating(ghostIn('Ana Popescu'),'classical'))===2104,'and Bogdan’s world has Ana back at her real rating: she was played since, so the list catches up');
X.store.career.rating=2222;X.app.careersOpen=true;X.render();
click('careerswitch',aid);await idle();
ok(X.pubRating(ghostIn('Bogdan Ionescu'),'classical')===2222,'Bogdan played on to 2222: Ana’s world now has him there too');

/* ================= the profile ================= */
X.go('player');X.app.playerId='y'+B.cid;X.render();
ok(/Your other career/.test(text())&&$('[data-act="careerswitch"][data-val="'+B.cid+'"]'),'Bogdan’s profile says who he is, with “Play as them”');
ok($('[data-act="careerchal"][data-val="y'+B.cid+'"]'),'and you can challenge him');
click('careerswitch',B.cid);await idle();
ok(X.store.career.cid===B.cid&&X.app.view==='career','“Play as them” switches to that career');

/* ================= names, backups, deleting ================= */
const n0=X.store.career.name;X.store.career.name='Ana Popescu';X.render();
const twin=X.buildWorld().filter(p=>p.ghost);
ok(twin.every(p=>p.name!=='Ana Popescu'),'two careers with the same name are told apart ('+twin.map(p=>p.name).join(', ')+')');
X.store.career.name=n0;X.render();
const back=JSON.parse(X.backupJson());
ok(Array.isArray(back.careerMeets)&&back.careerMeets.length===1,'a backup carries the games between your careers');
X.store.careerMeets=[];X.restoreBackup(JSON.stringify(back));
ok(X.store.careerMeets.length===1,'and restoring brings them back');
X.app.careersOpen=true;X.render();click('careerdel',aid);click('confirmyes');
ok(!ghostIn('Ana Popescu')&&X.store.careerMeets.length===0,'deleting a career takes it off every list, with its games against the others');

console.log('\n✅ meet: '+pass+' checks passed');
process.exit(0);
