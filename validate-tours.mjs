/* The events top players now live on: the Freestyle Chess Grand Slam, the
   Champions Chess Tour and the Esports World Cup — invitations, standings,
   the world playing them, and you playing them. */
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
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];dom.window.scrollTo=()=>{};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,careerResult,TOURNAMENTS,EVENT_WEEK,heldThisSeason,eventPlace,eventTrip,CITY_GEO,PRIZE_FIRST,'+
  'tourLockedBy,tourLocked,worldRank,TOURS,TOUR_OF,tourState,tourTable,tourFinalField,worldRoundRobinEvent,wxInit,worldById,endOfWeek,rollInit,careerToursPanel,koCard,KO_EWC,ewcInvitees,worldIndex,worldRanking};')();
const T=id=>X.TOURNAMENTS.find(t=>t.id===id);
const IDS=['fsweiss','fsparis','fsvegas','fscapetown','cctspring','cctsummer','cctautumn','cctfinals','ewc'];
function career(o){const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:500,
  ratingRapid:2450,ratedRapid:200,ratingBlitz:2450,ratedBlitz:200,age:26,money:100000,titles:['GM'],fame:10},o||{});X.store.career=c;X.lifeInit(c);return c;}
function atWeek(c,id){const wk=X.EVENT_WEEK[id];c.weeks=((c.season||1)-1)*52+wk;c.day=0;c.calDone=[];c.energy=100;return c;}
function koPlay(c,scoreFn){let g=0;while(c.tour&&g<40){const t=c.tour;X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
  X.app.careerRoundOpp=t.field[t.round];X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;X.careerResult(scoreFn(g,t));g++;}}

console.log('\n— on the calendar —');
ok(IDS.every(id=>T(id)&&X.EVENT_WEEK[id]!=null&&X.PRIZE_FIRST[id]>0),'nine events, each in its week and with a purse');
ok(['fsweiss','fsparis','fsvegas','fscapetown'].every(id=>T(id).var960&&T(id).rr),'the Freestyle Grand Slams are Chess960 round-robins');
ok(['cctspring','cctsummer','cctautumn'].every(id=>X.eventTrip(T(id))==='online'&&T(id).format==='rapid'),'the Champions Chess Tour’s legs are online rapid');
ok(T('ewc').kind==='knockout'&&T('ewc').format==='rapid'&&X.PRIZE_FIRST.ewc===250000,'the Esports World Cup is a rapid knockout, 💰250,000 to the winner');
ok(IDS.every(id=>{const P=X.eventPlace(T(id),{fed:'ROU',season:1});return P.trip==='online'||X.CITY_GEO[P.city];}),'each in a city on the map: '+['fsweiss','fsvegas','fscapetown','cctfinals','ewc'].map(id=>X.eventPlace(T(id),{fed:'ROU',season:1}).city).join(', '));

console.log('\n— by invitation —');
let c=career();
ok(/invite: top 12 or a wildcard/.test(X.tourLockedBy(T('fsweiss'),c)),'a 2450 is not invited to the Freestyle tour');
ok(/rapid 2600/.test(X.tourLockedBy(T('cctspring'),c)),'nor to the Champions Chess Tour');
ok(/Champions Chess Tour’s top 4/.test(X.tourLockedBy(T('ewc'),c)),'nor to the Esports World Cup');
ok(/top 8/.test(X.tourLockedBy(T('cctfinals'),c)),'and the tour’s Finals are for its top eight');
c=career({ratingRapid:2620});ok(X.tourLockedBy(T('cctspring'),c)==null,'rapid 2620 is enough for the Champions Chess Tour');
c=career({fame:65,ratingRapid:2420});ok(X.tourLockedBy(T('cctspring'),c)==null,'and so is a big enough following');
c=career({rating:2790,peak:2790});ok(X.worldRank(c,'classical')<=12&&X.tourLockedBy(T('fsweiss'),c)==null,'the world top twelve are invited to the Freestyle tour (you are #'+X.worldRank(c,'classical')+')');
c=career({rating:2700,peak:2700,fame:75});const wr=X.worldRank(c,'classical');
ok(wr>12&&wr<=80&&X.tourLockedBy(T('fsparis'),c)==null,'a big name in the top eighty gets a wildcard (#'+wr+', fame 75)');
c=career({fame:90});ok(X.tourLockedBy(T('ewc'),c)==null,'the Esports World Cup has a wildcard for the biggest names');

console.log('\n— a season without you —');
c=career({rating:2300,peak:2300,ratingRapid:2300});
const beforeIds={};
for(let i=0;i<51;i++)X.endOfWeek(c);
const F=X.tourState(c,'freestyle'),C=X.tourState(c,'cct'),Xw=X.wxInit(c),R=X.rollInit(c)[c.season]||{};
ok(F.legs.length===4&&F.done&&R.fstour,'the Freestyle tour is played, all four legs, and won by '+(R.fstour&&R.fstour.n));
ok(C.legs.length===3&&Object.keys(C.pts).length>=10,'the Champions Chess Tour’s three legs give points to '+Object.keys(C.pts).length+' players');
const fin=Xw.results.find(r=>r.id==='cctfinals'&&r.s===c.season);
ok(fin&&X.tourTable(c,'cct').slice(0,8).some(x=>x.name===fin.winner.name)&&R.cct&&R.cct.n===fin.winner.name,'the Finals are among its top eight: '+(fin&&fin.winner.name)+' wins the tour');
const ewc=Xw.results.find(r=>r.id==='ewc'&&r.s===c.season);
ok(ewc&&X.worldById(ewc.winner.id)&&R.ewc&&R.ewc.n===ewc.winner.name,'the Esports World Cup is played: '+(ewc&&ewc.winner.name)+' wins it');
ok((c.wire||[]).some(w=>/Esports World Cup/.test(w.h))&&(c.wire||[]).some(w=>/Freestyle Chess Grand Slam Tour/.test(w.h)),'and it is all on the news board');
// Chess960 is not rated
{const c2=career({rating:2300});c2.weeks=5;const busy={};const n0={};
 X.worldRanking(c2,'classical').slice(0,40).forEach(p=>{const r=(c2.wr||{})[p.id];n0[p.id]=r?r[3]||0:0;});
 const res=X.worldRoundRobinEvent(c2,T('fsweiss'),busy);
 const played=Object.keys(busy);
 ok(res&&played.length===10&&played.every(id=>(((c2.wr||{})[id]||[])[3]||0)===(n0[id]||0)),'a Freestyle leg, simulated: ten players, and not one rated game (Chess960 is not rated)');}

console.log('\n— you on the tours —');
c=career({rating:2790,peak:2790,ratingRapid:2790,fame:30});c.weeks=X.EVENT_WEEK.fsweiss;
X.joinTournament('fsweiss');
ok(c.tour&&c.tour.var960&&c.tour.rounds===9,'invited to Weissenhaus: nine rounds of Chess960');
while(c.tour)X._simRound(c);
let FT=X.tourState(c,'freestyle');
ok(FT.you>0&&Object.keys(FT.pts).length>=8,'and the leg gives tour points to you ('+FT.you+') and to everybody else in it');
ok(/Freestyle Chess Grand Slam Tour/.test(X.careerToursPanel(c))&&/YOU/.test(X.careerToursPanel(c)),'the World tab has the standings, you among them');
// the Finals: the tour's standings are the field
c=career({rating:2750,peak:2750,ratingRapid:2750});const CT=X.tourState(c,'cct');
const top=X.worldRanking(c,'rapid').filter(p=>!p.you).slice(0,12);top.forEach((p,i)=>{CT.pts[p.id]=100-i*5;CT.names[p.id]=p.name;});CT.you=80;
ok(X.tourLockedBy(T('cctfinals'),c)==null,'fifth on the Champions Chess Tour: a place in the Finals');
atWeek(c,'cctfinals');X.joinTournament('cctfinals');
const want=X.tourTable(c,'cct').filter(x=>!x.you).slice(0,7).map(x=>x.name).sort().join();
ok(c.tour&&c.tour.field.map(o=>o.name).sort().join()===want,'and the other seven are the tour’s top seven, not the rating list');
while(c.tour)X._simRound(c);
ok(X.rollInit(c)[c.season]&&X.rollInit(c)[c.season].cct,'the Finals decide the tour: '+X.rollInit(c)[c.season].cct.n);

console.log('\n— the Esports World Cup —');
c=career({rating:2800,peak:2800,ratingRapid:2830,ratingBlitz:2800,fame:40});
ok(X.tourLockedBy(T('ewc'),c)==null,'the rapid top twelve are invited');
atWeek(c,'ewc');X.joinTournament('ewc');
let tr=c.tour;
ok(tr&&tr.ko&&tr.ko.cfg==='ewc'&&tr.ko.entrants===16&&!tr.ko.bye&&tr.format==='rapid','a bracket of sixteen, seeded on the rapid list — you are seed '+tr.ko.mySeed);
ok(/Seeded on the rapid list/.test(X.koCard(tr))&&/Round of 16/.test(X.koCard(tr)),'the bracket says how it works');
const m0=c.money;koPlay(c,()=>1);
const h=c.history[0];
ok(h.place===1&&(c.honors||[]).indexOf('Esports World Cup Champion')>=0&&c.money-m0>=250000,'win every game and you win it: 💰'+(c.money-m0).toLocaleString());
ok(X.rollInit(c)[c.season].ewc&&X.rollInit(c)[c.season].ewc.you,'and your name goes on the roll');
c=career({rating:2800,peak:2800,ratingRapid:2830,ratingBlitz:2800,fame:40});atWeek(c,'ewc');X.joinTournament('ewc');
const m1=c.money;koPlay(c,()=>0);
ok(c.history[0].place===9&&c.money-m1===X.KO_EWC.prize[0],'lose in the round of sixteen: 9th, 💰'+X.KO_EWC.prize[0].toLocaleString());

console.log('\n✅ the tours and the Esports World Cup: '+pass+' checks passed');
