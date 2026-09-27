// Your rating and your strength: beating much weaker players cannot carry a
// career to the top of the list.   node validate-farming.mjs
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
dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.scrollTo=()=>{};
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,go,freshCareer,applyRatedGame,applyByFormat,ratingRef,publishRating,youRating,youStrength,eloExpect,paceDelta,kFactor,'+
  'joinTournament,simRestOfTour,finalizeTournament,careerWaitUntil,TOURNAMENTS,tourLocked,youthDef,weekOfSeason,EVENT_WEEK,_simRound};')();
const near=(a,b,t)=>Math.abs(a-b)<=(t||0.001);
const rated=(r,o)=>Object.assign(X.freshCareer(),{setup:true,provisional:false,rating:r,peak:Math.max(r,2400),ratedGames:200,age:30,pace:1},o||{});

/* ================= one game ================= */
let c=rated(2500);
ok(X.youStrength(c,'classical')===2500,'before any game, your strength is your rating');
X.applyRatedGame(c,1400,1);
ok(c.rating===2501,'a 2500 beating a 1400 gains what FIDE says: +0.9, rounded to +1 (the 400-point rule)');
ok(near(c.str.classical,2500.0,0.1),'but is no stronger for it (strength '+c.str.classical+')');
c=rated(2500);X.applyRatedGame(c,1400,0);
ok(c.rating===2491&&near(c.str.classical,2490,0.1),'losing to a 1400 costs the rating 9 and the strength 10');
c=rated(2500);X.applyRatedGame(c,2500,1);
ok(c.rating===2505&&near(c.str.classical,2505,0.1),'against an equal, rating and strength move together (+5)');

/* ================= the pace ================= */
c=rated(2500,{pace:2});X.applyRatedGame(c,2500,1);
ok(c.rating===2510,'Accelerated still doubles a genuine result (+10 for beating an equal)');
c=rated(2500,{pace:2});X.applyRatedGame(c,1400,1);
ok(c.rating===2501,'but not the free points of the 400-point rule (+1, not +2)');
ok(near(X.paceDelta(rated(2500,{pace:3}),10,2500,1400,1),10*(1-1/(1+Math.pow(10,-1)))+2*10*(1-X.eloExpect(2500,1400)),1e-9),'Prodigy works the same way');
let sum2=0,sum1=0;for(let i=0;i<100;i++){sum2+=X.paceDelta(rated(2500,{pace:2}),10,2500,1350,1);sum1+=X.paceDelta(rated(2500,{pace:1}),10,2500,1350,1);}
ok(sum2<sum1*1.05,'a hundred wins over 1350s are worth the same at any pace ('+sum1.toFixed(0)+' vs '+sum2.toFixed(0)+')');

/* ================= a whole event is rated the same way ================= */
c=rated(2500,{pace:2});let ref=X.ratingRef(c,'classical');
for(let i=0;i<9;i++)X.applyRatedGame(c,1400,1,ref);
ok(c.rating===2508,'nine wins over 1400s in one event: +8, as FIDE rates it (not +16)');
ok(c.str.classical<2501,'and the strength hardly moves ('+c.str.classical+')');

/* ================= the other lists ================= */
c=rated(2400,{ratingRapid:2400,ratedRapid:100,peakRapid:2400,ratingBlitz:2300,ratedBlitz:100,peakBlitz:2300});
X.applyByFormat(c,'rapid',1300,1);X.applyByFormat(c,'blitz',2300,1);
ok(c.str.rapid<2400.2&&c.ratingRapid===2401,'rapid has its own strength, moved the same way');
ok(near(c.str.blitz,2310,0.1)&&c.ratingBlitz===2310,'and blitz (K 20 below a 2400 peak: +10 for beating an equal)');
ok(c.str.classical==null&&X.youStrength(c,'classical')===2400,'each list is separate');

/* ================= floors and first ratings ================= */
c=rated(1420);for(let i=0;i<20;i++)X.applyRatedGame(c,1400,0);
ok(c.rating===1400&&c.str.classical===1400,'strength has the same 1400 floor as the rating');
c=Object.assign(X.freshCareer(),{setup:true,provisional:true,rating:null,ratedGames:0,age:16});
for(let i=0;i<5;i++)X.applyRatedGame(c,1500,1);
X.publishRating(c);
ok(!c.provisional&&c.str&&c.str.classical===c.rating,'a first rating starts your strength at the same number ('+c.rating+')');

/* ================= simulated games are decided by strength ================= */
// a 2600 rating with a 1600 player behind it: a club field should find the 1600
X.go('career');document.querySelector('[data-act="careersetup"]').click();
c=X.store.career;Object.assign(c,{provisional:false,rating:2600,peak:2600,ratedGames:300,age:30,energy:100,form:0,tilt:0,str:{classical:1600}});
let pts=0,games=0,oppSum=0;
for(let i=0;i<14;i++){
  c.weeks=(c.weeks||0)+1;c.energy=100;c.form=0;c.tilt=0;c.rating=2600;c.str.classical=1600;c.calDone=[];   // this part measures strength, not the calendar
  X.joinTournament('club');if(!c.tour)continue;
  const tr=c.tour;
  while(c.tour&&c.tour.round<c.tour.rounds){const opp=c.tour.field[c.tour.round];oppSum+=opp.rating;const before=(c.tour.results||[]).length;X._simRound(c);const r=c.tour?c.tour.results[c.tour.results.length-1]:null;if(r){pts+=r.score;games++;}}
  if(c.tour)X.finalizeTournament(c);
}
const avgOpp=oppSum/Math.max(1,games),pct=pts/Math.max(1,games);
ok(games>=40,'played '+games+' simulated games against club fields (average '+Math.round(avgOpp)+')');
ok(pct<0.85,'a 1600 player with a 2600 rating scores like a 1600 ('+Math.round(pct*100)+'%), not like a 2600 (about 99%)');

/* ================= the loophole itself ================= */
function farm(pace,seasons,frozen){
  localStorage.clear();X.store.career=X.freshCareer();X.app.careerTab=null;
  X.go('career');document.querySelector('[data-act="careersetup"]').click();
  const C=()=>X.store.career;C().pace=pace;
  const joinable=()=>{const wk=X.weekOfSeason(C());return X.TOURNAMENTS.filter(t=>{try{const d=X.youthDef(t,C());return !X.tourLocked(d,C())&&(t.format||'classical')==='classical'&&(X.EVENT_WEEK[t.id]==null||X.EVENT_WEEK[t.id]===wk);}catch(err){return false;}});};
  let peak=0;
  for(let w=0;w<52*seasons;w++){
    // a player who stays exactly this strong, whatever the results say
    if(frozen&&!C().provisional&&C().rating!=null){C().str=C().str||{};C().str.classical=frozen;}
    if(!C().tour){const t=joinable().sort((a,b)=>a.avg-b.avg)[0];if(t)X.joinTournament(t.id);}
    if(C().tour){X.simRestOfTour();if(C().tour&&C().tour.round>=C().tour.rounds)X.finalizeTournament(C());}
    if(C().tour)continue;
    X.careerWaitUntil(X.weekOfSeason(C())+1);
    peak=Math.max(peak,X.youRating(C(),'classical')||0);
  }
  return {rating:X.youRating(C(),'classical'),strength:Math.round(X.youStrength(C(),'classical')||0),peak};
}
// The loophole, measured on its own: a player who is 1800 and stays 1800 enters the weakest
// event every week. Before this fix the rating decided the games, so there was no such thing
// as staying 1800: the same routine reached 2843 after two seasons at Accelerated and 3058
// after four at Realistic.
const FA=farm(2,3,1800),FR=farm(1,3,1800);
console.log('    (a player frozen at 1800, three seasons of the weakest events: Accelerated peak '+FA.peak+', Realistic peak '+FR.peak+')');
ok(FA.peak<2300&&FR.peak<2300,'an 1800 who farms weak events for three seasons stays within FIDE’s 400-point allowance of 1800, at any pace');
// and left to itself: whatever the career's own improvement adds, the published number stays close to what you can do
const A=farm(2,3),R=farm(1,3);
console.log('    (left to itself: Accelerated '+A.rating+' / strength '+A.strength+'; Realistic '+R.rating+' / '+R.strength+')');
ok(Math.abs(A.rating-A.strength)<400&&Math.abs(R.rating-R.strength)<400,'the published rating never runs more than 400 ahead of your real strength');

console.log('\n✅ farming: '+pass+' checks passed');
