/* The next generation: a retired career hands its world on — to its child or
   to a newcomer — with the hall, the legends, the old generation as veterans
   and coaches, and the roll of champions carrying on. */
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
dom.window.__PUZZLES=[];dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const $=q=>document.querySelector(q);
const X=new Function(script+'\nreturn {store,app,go,render,freshCareer,lifeInit,endOfWeek,retireCareer,hallList,careerHoF,viewCareer,nextGenStart,careerSlots,worldChampion,wChampion,'+
  'worldId,wxInit,genEnsure,genPlayers,pplOf,careerLineagePanel,ngOldGen,scoutCard,hallLegendsFor,careerLegendsPanel,startHallLegend,hallLegendResult,oppOpenings,'+
  'careerRollPanel,rollInit,bioLead,buildWorld,worldById,maybeAssignRival,cycleInit,genOf,careerCid,seasonYear,FIRST_YEAR,PARENT_FUND};')();
const idle=async()=>{for(let i=0;i<400&&X.app.careerBusy;i++)await new Promise(r=>setTimeout(r,5));await new Promise(r=>setTimeout(r,5));};
function career(o){const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',age:16},o||{});X.store.career=c;X.lifeInit(c);X.genEnsure(c);return c;}
function veteran(c){
  for(let i=0;i<52;i++)X.endOfWeek(c);                     // a season of the world, and a generation grown by one year
  Object.assign(c,{age:45,provisional:false,rating:2600,peak:2650,ratedGames:900,titles:['GM'],honors:['World Champion'],money:100000,fame:80,canRetire:true});
  X.cycleInit(c).champ=true;
  return c;
}

console.log('\n— a career retires, and hands its world on —');
let A=veteran(career());
const wid=X.worldId(A),aGen=A.gen.ids.slice(),aSeason=A.season,aWeeks=A.weeks;
X.retireCareer();
const he=X.hallList()[0];
ok(he.name==='Ada Marín'&&he.cid===A.cid&&he.world===wid&&he.s1===aSeason,'the hall keeps which world the career played in, and when');
X.go('career');
ok($('#nextgencard')&&$('[data-act="nextgen"][data-val="child"]')&&$('[data-act="nextgen"][data-val="new"]'),'the retired screen offers the next generation: your child, or a newcomer');
ok(/Begin a new career, in a new world/.test(document.getElementById('app').textContent),'and still a new career in a new world');
$('[data-act="nextgen"][data-val="child"]').click();await idle();
let B=X.store.career;
ok(B!==A&&!B.setup&&B.nextGen&&B.nextGen.kind==='child','your child’s career is waiting to be named');
ok(B.wx.id===wid&&B.season===aSeason&&B.weeks===aWeeks,'in the same world, the same week ('+X.seasonYear(B)+')');
ok(B.pub&&B.pub.you.every(v=>v==null),'where the new player has no rating yet');
ok(X.careerSlots()[0]&&X.careerSlots()[0].meta.name==='Ada Marín'&&X.careerSlots()[0].meta.retired,'the finished career stays among your careers');
const ch=X.worldChampion(B);
ok(ch&&!ch.you&&ch.name!=='Ada Marín'&&(B.news||[]).some(n=>/world title passes to/.test(n.t)),'a champion who retires leaves the title to somebody: '+ch.name);

console.log('\n— the setup screen —');
X.go('career');
ok(/The next generation/.test(document.getElementById('app').textContent)&&/the child of GM Ada Marín/.test(document.getElementById('app').textContent),'the setup screen says whose world and whose child');
ok($('#cr-name').value==='Marín'&&$('#cr-start').value==='junior'&&$('#cr-fed').value==='ROU','the surname, the federation and the age of eleven are filled in');
$('#cr-name').value='Bea Marín';$('[data-act="careersetup"]').click();
B=X.store.career;
ok(B.setup&&B.name==='Bea Marín'&&B.junior&&Math.floor(B.age)===11&&!B.nextGen,'Bea Marín begins at eleven');
ok(B.family&&B.family.parent.name==='Ada Marín'&&X.pplOf(B,'parent').name==='Ada Marín','your parent is the player you were');
ok(B.parents.fund>X.PARENT_FUND&&(B.fame||0)>=15,'a chess house: a little more for chess from home, and a name people know (fame '+B.fame+')');
const coach=X.pplOf(B,'coach');
ok(coach&&coach.gen&&aGen.indexOf(coach.gen)>=0,'your first coach grew up with your parent: '+coach.name);
X.genEnsure(B);
ok(B.gen&&B.gen.ids.length===20&&B.gen.ids.every(id=>aGen.indexOf(id)<0),'Bea grows up with a generation of their own');
ok(aGen.every(id=>X.worldById(id)||X.wxInit(B).retired[id]),'and the one your parent grew up with is still in this world');

console.log('\n— the world tab —');
let P=X.careerLineagePanel(B);
ok(/Before you/.test(P)&&/Ada Marín/.test(P)&&/Play your parent/.test(P),'“Before you”: your parent, their years, and a game against them');
const G=X.ngOldGen(B);
ok(G.length===aGen.length&&G.some(x=>x.yours),'your parent’s generation as it is now, your coach among them');
const og=G.find(x=>!x.out&&!x.yours)||G.find(x=>!x.out);
if(og)ok(/grew up with your parent/.test(X.scoutCard(B,{name:og.name,rating:og.rating,wid:og.id},'Next')),'the scouting card knows who grew up with your parent');
ok(!X.genOf(B,X.worldById(aGen.find(id=>X.worldById(id)))),'they are not your generation');
ok(/Legends exhibitions/.test(X.careerLegendsPanel(B))&&/your parent/.test(X.careerLegendsPanel(B)),'your parent is a legend you can play, before you have a rating');
X.hallList()[0].reps={w:'italian'};
ok(X.oppOpenings('Ada Marín',2650).w==='italian','playing the openings they played');
X.startHallLegend(String(he.at));
ok(X.app.careerLegend==='Ada Marín'&&X.app.careerHallLegend===String(he.at)&&X.app.careerElo===2650,'an exhibition against your parent at their peak (2650)');
X.hallLegendResult(B,1);
ok((B.hallBeaten||[]).indexOf('Ada Marín')>=0&&(B.news||[]).some(n=>/You beat Ada Marín — your parent — at their peak/.test(n.t)),'and beating them is news');
ok(/is the child of GM Ada Marín, a former World Champion/.test(X.bioLead(B)),'the biography says whose child');

console.log('\n— the roll of champions carries on —');
const R=X.rollInit(B);R[aSeason-1]=R[aSeason-1]||{};R[aSeason-1].wch={n:'Ada Marín',fed:'ROU',flag:'🇷🇴',you:true,cid:A.cid};
let RP=X.careerRollPanel(B);
ok(/The roll of champions/.test(RP)&&/Ada Marín<\/b> 🏛️/.test(RP),'Ada Marín’s year is on the roll, marked as a career of yours');
for(let i=0;i<60&&B.season===aSeason;i++)X.endOfWeek(B);
ok(B.season===aSeason+1&&X.rollInit(B)[aSeason]&&X.rollInit(B)[aSeason].wch,'the season Bea started in goes on the roll: 👑 '+(X.rollInit(B)[aSeason]||{wch:{}}).wch.n);
RP=X.careerRollPanel(B);
ok(RP.indexOf(String(X.FIRST_YEAR-1+aSeason))>=0&&RP.indexOf(String(X.FIRST_YEAR-2+aSeason))>=0,'year by year');

console.log('\n— or a newcomer —');
let A2=veteran(career({name:'Ion Popa'}));
X.cycleInit(A2).champ=false;A2.honors=[];
X.retireCareer();await X.nextGenStart('new');await idle();
let C=X.store.career;
X.go('career');
ok(/a newcomer/.test(document.getElementById('app').textContent)&&$('#cr-name').value===''&&$('#cr-start').value==='club','a newcomer names themselves and chooses how to start');
$('#cr-name').value='Dana Stan';$('[data-act="careersetup"]').click();C=X.store.career;
ok(C.setup&&!C.family&&C.lineage&&C.lineage.kind==='new'&&C.wx.id===X.wxInit(C).id,'no family — but the same world');
P=X.careerLineagePanel(C);
ok(/Before you/.test(P)&&/Ion Popa/.test(P)&&!/your parent/.test(P),'and it knows whose world it was');

console.log('\n✅ the next generation: '+pass+' checks passed');
