/* How a chess career actually works — the rules the career mode now follows.
   Each section is one of the fixes, in the order they were ranked, and each
   one checks against the real rule rather than against what the code does. */
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
dom.window.__PUZZLES=[];
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,simGame,SIM_DRAW,_simScore,_simRound,bulDrawRate,'+
  'tourColours,tourColourOf,colourOk,colourEdge,colourDot,COL_REPEAT,WHITE_EDGE,'+
  'freshCareer,lifeInit,applyRatedGame,applyByFormat,joinTournament,TOURNAMENTS,careerTourView,'+
  'playTourRound,stopClockTick,careerResult,finishDraw,NORM_BARS,NORM_TH,normRa,normCheck,normOpps,normExempt,'+
  'eventNorms,eventNormMisses,normTracker,careerFinishBanner,makeField,dpFromPct,'+
  'kFactor,ratingRef,publishRating,INIT_HYP_RATING,INIT_HYP_GAMES,'+
  'rrPairs,rrOrient,rrValid,rrSchedule,rrColourSeqs,rrInit,rrLabel,rrCard,rrRoundPairs,xtGrid,standingsSorted,tourDrawPanel,tourLocked,'+
  'swissEligible,swissHallSize,swissInit,swissPairMe,swissEnsure,swissMet,swissCard,swissOppEstimate,normOutlook,drawRevealed,'+
  'fieldRating,fieldCeiling,swissWhiteFirst,swissNoteColour,xtSwissRows,xtSwissTable,swissClash,swissNeeds};')();
const Elo=(d)=>1/(1+Math.pow(10,-d/400));
function mean(fn,n){let t=0;for(let i=0;i<n;i++)t+=fn();return t/n;}

console.log('\n— P1 · a simulated game scores what the ratings say —');
/* ================= THE EXPECTATION IS ELO'S ================= */
const styles=['universal','attacker','tactician','technician','solid'];
let worst=0,worstAt='';
for(const E of [0.03,0.05,0.10,0.18,0.30,0.50,0.70,0.82,0.90,0.95,0.97]){
  for(const st of styles){
    const m=mean(()=>X.simGame(E,st),40000);
    if(Math.abs(m-E)>worst){worst=Math.abs(m-E);worstAt=st+' at E='+E+' scored '+m.toFixed(3);}
  }
}
ok(worst<0.012,'every style scores its Elo expectation, from 3% to 97% (worst drift '+worst.toFixed(4)+', '+worstAt+')');
ok(Math.abs(mean(()=>X.simGame(0.05,'universal'),60000)-0.05)<0.01,
  'a 500-point underdog scores 5%, not the 18% floor the old model gave');
ok(Math.abs(mean(()=>X.simGame(0.95,'universal'),60000)-0.95)<0.01,
  'and the favourite scores 95%, not 88%');
let losses=0;for(let i=0;i<60000;i++)if(X.simGame(0.95,'universal')===0)losses++;
ok(losses>0,'the favourite can lose — '+(Math.round(losses/60000*1000)/10)+'% of the time; the old model made it impossible');
/* style is variance, not strength */
const drawsAt=(st)=>{let d=0;for(let i=0;i<60000;i++)if(X.simGame(0.5,st)===0.5)d++;return d/60000;};
const dA=drawsAt('attacker'),dU=drawsAt('universal'),dS=drawsAt('solid');
ok(dA<dU&&dU<dS,'an attacker draws least and a solid player most ('+Math.round(dA*100)+'% / '+Math.round(dU*100)+'% / '+Math.round(dS*100)+'%)');
ok(Math.abs(mean(()=>X.simGame(0.5,'attacker'),60000)-0.5)<0.01,
  'and the attacker still scores 50% between equals — the old model docked them six points a game');
ok(Math.abs(mean(()=>X.simGame(0.5,'solid'),60000)-0.5)<0.01,'as does the solid player, who used to be handed two');
ok([0,0.5,1].indexOf(X.simGame(0.5,'nonsense'))>=0,'an unknown style falls back rather than breaking');
/* draws thin out with the gap */
const drawRate=(E)=>{let d=0;for(let i=0;i<40000;i++)if(X.simGame(E,'universal')===0.5)d++;return d/40000;};
ok(drawRate(0.5)>drawRate(0.85)&&drawRate(0.85)>drawRate(0.97),'draws are commonest between equals and thin out as the gap widens');

/* ================= THE EXPLOIT IS GONE ================= */
/* An 1800 simulating into a 2200 field used to climb about six points a game. */
function climb(myR,oppR,games,trials){
  let tot=0;
  for(let t=0;t<trials;t++){
    const c=X.freshCareer();c.provisional=false;c.rating=myR;c.peak=myR;c.ratedGames=100;c.age=30;
    const E=Elo(myR-oppR);
    for(let g=0;g<games;g++)X.applyRatedGame(c,oppR,X.simGame(E,'solid'));
    tot+=c.rating-myR;
  }
  return tot/trials;
}
const drift=climb(1800,2200,9,800);
ok(Math.abs(drift)<3,'simulating a nine-round event 400 points above you is worth nothing on average ('+
  (drift>0?'+':'')+drift.toFixed(1)+'); it used to be about +50');
const drift2=climb(2700,2300,9,800);
ok(Math.abs(drift2)<2,'and simulating far below you costs nothing either ('+(drift2>0?'+':'')+drift2.toFixed(1)+')');

console.log('\n— P2 · colours follow the pairing rules —');
/* ================= THE COLOUR RULES ================= */
ok(X.colourOk(['w','b','w','b','w','b','w','b','w']),'strict alternation is legal');
ok(!X.colourOk(['w','w','w','b','b','b','w','b','w']),'three of one colour running is not');
ok(!X.colourOk(['w','b','w','w','b','w','w','b','w']),'whites drifting three ahead of blacks is not');
ok(X.colourOk(['w','w','b','w','b','b','w','b','w']),'a single repeat inside the limits is');
let bad=0,repeats=0,total=0,sevenTwo=0;
const whitesSeen={};
for(let i=0;i<5000;i++){
  const seq=X.tourColours(9);
  if(!X.colourOk(seq)||seq.length!==9)bad++;
  const w=seq.filter(x=>x==='w').length;
  whitesSeen[w]=(whitesSeen[w]||0)+1;
  if(w>=7||w<=2)sevenTwo++;
  for(let k=1;k<9;k++){total++;if(seq[k]===seq[k-1])repeats++;}
}
ok(bad===0,'five thousand planned nine-round events, every one within the rules');
ok(sevenTwo===0,'and never seven-two one way — a coin flip did that almost one event in five');
ok(Object.keys(whitesSeen).sort().join()==='4,5','nine rounds is always five and four ('+JSON.stringify(whitesSeen)+')');
ok(repeats/total>0.05&&repeats/total<0.25,'mostly alternating, with the odd repeat a real pairing needs ('+
  Math.round(repeats/total*100)+'% of rounds)');
let evenBad=0;for(let i=0;i<2000;i++){const q=X.tourColours(14);if(!X.colourOk(q))evenBad++;}
ok(evenBad===0,'a fourteen-round event stays within the rules too');
ok(X.tourColours(9,'b')[0]==='b'&&X.tourColours(9,'w')[0]==='w','the first colour can be set, as a drawing of lots would');

/* the plan is fixed for the whole event */
const T={rounds:9,kind:'swiss'};
const first=[];for(let r=0;r<9;r++)first.push(X.tourColourOf(T,r));
const again=[];for(let r=0;r<9;r++)again.push(X.tourColourOf(T,r));
ok(first.join()===again.join(),'asking twice gives the same colours — the plan is made once');
ok(X.colourOk(first),'and it is a legal plan');
const M={rounds:14,kind:'match'};
const mc=[];for(let r=0;r<14;r++)mc.push(X.tourColourOf(M,r));
ok(mc.every((c2,i)=>i===0||c2!==mc[i-1]),'a match alternates every game, the way a title match does');
/* an event saved before the plan existed gets one from where it is */
const old={rounds:9,kind:'swiss',colours:['w','b']};
X.tourColourOf(old,5);
ok(old.colours.length===9&&old.colours[0]==='w'&&old.colours[1]==='b',
  'a tournament saved before colours were planned keeps the ones it already played');

/* White's edge */
ok(X.colourEdge('w')===X.WHITE_EDGE&&X.colourEdge('b')===-X.WHITE_EDGE,'White is worth thirty-five points either way');
ok(Math.abs(Elo(X.colourEdge('w'))-0.55)<0.01,'which is 55% between equals, the master-level figure');

/* entering a tournament plans the colours, and a round uses them */
X.store.career=X.freshCareer();
const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.provisional=false;c.rating=1900;c.peak=1900;
X.joinTournament('cityopen');
ok(c.tour&&(c.tour.colours||[])[0]&&/^[wb]$/.test(c.tour.colours[0]),
  'an open gives you a colour for round one when round one is paired');
const firstCol=c.tour.colours[0];
X.playTourRound();
ok(X.app.playSide===firstCol,'and round one is played with it');
X.stopClockTick&&X.stopClockTick();
/* simulated rounds use it too, and the finished event is within the rules */
X.app.careerOpp=null;X.app.careerScored=false;
const nRounds=c.tour.rounds;
for(let r=0;c.tour&&r<nRounds;r++)X._simRound(c);
const hist=(c.history||[])[0];
ok(hist&&hist.rounds===nRounds,'a whole event simulates through');
const myRow=hist.xt.players.findIndex(p=>p.you);
const myCols=hist.xt.rows[myRow].map(x=>x&&x[1]).filter(Boolean);
ok(myCols.length===nRounds&&X.colourOk(myCols),'and the colours you got across it follow the rules ('+myCols.join('')+')');
/* on screen */
X.store.career=X.freshCareer();
const c2=X.store.career;X.lifeInit(c2);c2.setup=true;c2.provisional=false;c2.rating=1900;c2.peak=1900;
X.joinTournament('cityopen');
X.finishDraw(c2.tour);                        // the draw ceremony, completed
const view=X.careerTourView(c2);
const dots=(view.match(/class="coldot (w|b)"/g)||[]).length,hidden=(view.match(/To be drawn|Paired on score after round/g)||[]).length;
ok(dots>0&&dots+hidden===c2.tour.rounds,
  'every round that has been paired shows your colour ('+dots+'), and the rest wait for their pairing ('+hidden+')');
ok(/You have (White|Black)/.test(view),'and says which on hover');

/* white scores more between equals, in the simulation */
function simColour(side){
  let tot=0;const n=6000;
  for(let i=0;i<n;i++)tot+=X.simGame(Elo(X.colourEdge(side)),'universal');
  return tot/n;
}
const sw=simColour('w'),sb=simColour('b');
ok(sw>0.53&&sw<0.57&&sb>0.43&&sb<0.47,'between equals White scores about 55% and Black 45% ('+
  Math.round(sw*100)+'% / '+Math.round(sb*100)+'%)');


console.log('\n— P3 · a norm needs the right opposition, not just the score —');
const GM=X.NORM_BARS.find(b=>b.kind==='GM'),IM=X.NORM_BARS.find(b=>b.kind==='IM');
const me={fed:'ROU',gender:'open',norms:[]};
const P=(rating,title,fed)=>({rating:rating,title:title,fed:fed});
/* the rating floor */
ok(X.normRa([P(2400),P(2400),P(2000)],2200)===2333.3333333333335,'the lowest opponent below the floor is counted at the floor');
ok(Math.round(X.normRa([P(2400),P(1900),P(2000)],2200))===2200,'only the single lowest one — the next one keeps its own rating');
ok(X.normRa([P(2400),P(2300)],2200)===2350,'and nobody is touched when everyone is above it');
/* a textbook GM norm: nine games, three GMs, half titled, plenty of federations */
const good=[P(2560,'GM','GER'),P(2540,'GM','FRA'),P(2520,'GM','ESP'),P(2470,'IM','NED'),
  P(2450,'IM','HUN'),P(2430,'IM','POL'),P(2380,'FM','ITA'),P(2360,'FM','GER'),P(2340,'FM','FRA')];
let k=X.normCheck(me,GM,good,6.5,{});
ok(k.opposition,'nine games against three GMs, six more title holders and seven federations qualifies');
ok(k.Rp>=2600&&k.ok,'and 6½/9 against it is a GM norm ('+k.Rp+')');
ok(k.reqs.map(r=>r.key).join()==='games,avg,titled,hi,feds,own,one,tpr','every requirement is checked, and reported');
/* the story everybody knows: the score, and not enough GMs */
const twoGMs=good.slice();twoGMs[2]=P(2490,'IM','ESP');
k=X.normCheck(me,GM,twoGMs,6.5,{});
ok(k.Rp>=2600,'the same score against two GMs is still a 2600 performance ('+k.Rp+')');
ok(!k.ok&&k.failed.length===1&&k.failed[0].key==='hi','but not a GM norm — one GM short, and that is the only reason');
ok(X.normCheck(me,IM,twoGMs,6.5,{}).ok,'though it is comfortably an IM norm, where IMs count');
/* half the field must hold a title — FM or better, CM does not count */
const cms=good.map((p,i)=>i>=4?P(p.rating,'CM',p.fed):p);
k=X.normCheck(me,IM,cms,7,{});
ok(!k.ok&&k.failed.some(f=>f.key==='titled'),'four titled opponents of nine is not half');
ok(X.NORM_TH.indexOf('CM')<0&&X.NORM_TH.indexOf('FM')>=0,'a CM is not a title holder for this rule; an FM is');
/* never fewer than three of the norm's title */
const eight=good.slice(0,8);
ok(X.normCheck(me,GM,eight,6,{}).failed.some(f=>f.key==='games'),'eight games cannot make a norm, however they go');
/* federations */
const allGer=good.map(p=>P(p.rating,p.title,'GER'));
k=X.normCheck(me,GM,allGer,6.5,{});
ok(!k.ok&&k.failed.some(f=>f.key==='feds')&&k.failed.some(f=>f.key==='one'),
  'nine Germans is one federation — not enough of them, and far more than two-thirds from one');
const homeHeavy=good.map((p,i)=>i<6?P(p.rating,p.title,'ROU'):p);
k=X.normCheck(me,GM,homeHeavy,6.5,{});
ok(!k.ok&&k.failed.some(f=>f.key==='own'),'six compatriots out of nine is more than the three-fifths allowed');
ok(X.normCheck(me,GM,homeHeavy,6.5,{fedExempt:true}).ok,'unless it is a national championship, which is exempt');
ok(X.normExempt({id:'natch'})&&!X.normExempt({id:'gmrr'}),'and the national championship is the event that is');
/* a norm without a score just asks about the opposition */
ok(X.normCheck(me,GM,good,null,{}).Rp===null&&X.normCheck(me,GM,good,null,{}).opposition,
  'the opposition can be checked before a game is played');

/* the event award */
const trGood={id:'gmrr',field:good.map(p=>Object.assign({name:'x'},p)),results:good.map((p,i)=>({rating:p.rating,title:p.title,fed:p.fed,score:i<4?1:(i<9?0.5:0)}))};
trGood.results[8].score=0;           // 4 + 4×½ + 0 = 6
trGood.results[7].score=1;           // 6.5
ok(X.eventNorms(me,trGood).join()==='GM','a finished event awards the norm it earned');
const trShort=JSON.parse(JSON.stringify(trGood));trShort.results[2].title='IM';
ok(X.eventNorms(me,trShort).join()==='IM','one GM short, the same score earns the IM norm instead');
const trNone=JSON.parse(JSON.stringify(trGood));trNone.results.forEach(r=>{r.fed='GER';});
ok(X.eventNorms(me,trNone).length===0,'nine Germans earns nothing');
const miss=X.eventNormMisses(me,trNone);
ok(miss.length>=1&&miss[0].Rp>=2600,'and the event knows it was a norm-strength performance that was denied');
/* results saved before federations were kept borrow them from the field */
const trOld=JSON.parse(JSON.stringify(trGood));trOld.results.forEach(r=>{delete r.fed;});
ok(X.normOpps(trOld).every((o,i)=>o.fed===good[i].fed),'an older save fills federations in from the field');
ok(X.eventNorms(me,trOld).join()==='GM','and still awards what it earned');

/* the finish banner says why */
const ban=X.careerFinishBanner({name:'Riga Open',emoji:'🏟️',score:6.5,rounds:9,tpr:2616,place:3,norms:[],
  missed:[{kind:'GM',tpr:2616,why:'GMs 2/3'}]});
ok(/2616 is GM-norm strength — but no norm/.test(ban),'the finish banner says the score was there');
ok(/GMs 2\/3/.test(ban),'and exactly what was missing');

/* the live tracker */
X.store.career=X.freshCareer();
const tc=X.store.career;X.lifeInit(tc);tc.fed='ROU';tc.gender='open';
const trLive={id:'gmrr',rounds:9,field:good.map(p=>Object.assign({name:'x'},p)),results:[]};
let track=X.normTracker(trLive,tc);
ok(/Chasing the GM norm/.test(track),'the tracker chases the GM norm when the field allows one');
ok(/✓ GMs <b>3<\/b>\/3/.test(track),'and shows the GM count against what is needed');
ok(/✓ Foreign federations/.test(track),'and the federations');
const trBlocked={id:'intl',rounds:9,field:allGer.map(p=>Object.assign({name:'x'},p)),results:[]};
track=X.normTracker(trBlocked,tc);
ok(/No norm is possible in this field/.test(track),'a field that cannot qualify says so before you play a game');
ok(/✗ Foreign federations/.test(track),'with the requirement that fails marked');

/* norm round-robins are invited so the norm is on offer */
const imrr=X.TOURNAMENTS.find(t=>t.id==='imrr'),gmrr=X.TOURNAMENTS.find(t=>t.id==='gmrr');
X.store.career.fed='ROU';
let imOk=0,gmOk=0;
for(let i=0;i<150;i++){
  if(X.normCheck(X.store.career,IM,X.makeField(imrr),null,{}).opposition)imOk++;
  if(X.normCheck(X.store.career,GM,X.makeField(gmrr),null,{}).opposition)gmOk++;
}
ok(imOk===150,'every IM-norm round-robin can give an IM norm — it was four in five');
ok(gmOk===150,'every GM-norm round-robin can give a GM norm');

console.log('\n— P4 · ratings are worked out the way FIDE works them out —');
/* the junior K */
const kc=(o)=>X.kFactor(Object.assign({ratedGames:60,peak:2200,rating:2200,age:30},o));
ok(kc({age:16,rating:2100})===40,'a sixteen-year-old under 2300 is rated at K=40, however many games they have');
ok(kc({age:18.9,rating:2250})===40,'still 40 in the year they turn eighteen');
ok(kc({age:19.1,rating:2250})===20,'and 20 once that year is over');
ok(kc({age:17,rating:2310,peak:2310})===20,'a junior at 2300 or more drops to 20, as the rule says');
ok(kc({age:17,rating:2350,peak:2420})===10,'and a junior who has reached 2400 is on 10, like anyone else');
ok(kc({age:30,ratedGames:12})===40,'a new player is on 40 for their first thirty games at any age');
ok(kc({age:30,rating:2380,peak:2410})===10,'and once you have touched 2400 you stay on 10, even back below it');
ok(X.kFactor({ratedGames:60,peak:2200,rating:2200})===20,'a career with no age recorded is treated as an adult');

/* one event, one reference */
const results=[[2300,1],[2450,0.5],[2200,1],[2500,0],[2350,1],[2400,0.5],[2150,1],[2550,0],[2380,1]];
function runEvent(order,useRef){
  const c=X.freshCareer();c.provisional=false;c.rating=2300;c.peak=2300;c.ratedGames=100;c.age=30;
  const ref=useRef?X.ratingRef(c,'classical'):null;
  order.forEach(function(g){X.applyRatedGame(c,g[0],g[1],ref);});
  return c.rating;
}
const fwd=runEvent(results,true),rev=runEvent(results.slice().reverse(),true);
ok(fwd===rev,'the same nine results in any order give the same rating ('+fwd+') — FIDE rates the event');
let orderMatters=false;
const shuffled=[results.slice(),results.slice().reverse(),results.slice().sort((a,b)=>a[1]-b[1])];
const perGame=shuffled.map(o=>runEvent(o,false));
if(new Set(perGame).size>1)orderMatters=true;
ok(orderMatters,'where rating each game off the last made the order matter ('+perGame.join(' / ')+')');
/* rounded once, not nine times */
let exact=0;results.forEach(function(g){const D=Math.max(-400,Math.min(400,2300-g[0]));exact+=20*(g[1]-1/(1+Math.pow(10,-D/400)));});
ok(fwd===2300+Math.round(exact),'the total is rounded once, at the end: '+(exact>0?'+':'')+exact.toFixed(2)+' → '+(fwd-2300));
/* the live number still moves every round */
const lc=X.freshCareer();lc.provisional=false;lc.rating=2300;lc.peak=2300;lc.ratedGames=100;lc.age=30;
const lref=X.ratingRef(lc,'classical');
const d1=X.applyRatedGame(lc,2300,1,lref);
ok(d1===10&&lc.rating===2310,'the live rating still moves after each game (+'+d1+')');
const d2=X.applyRatedGame(lc,2300,1,lref);
ok(d2===10&&lc.rating===2320,'and the second win against a 2300 is worth the same as the first, not less');
ok(lref.k===20&&lref.r0===2300,'measured from the rating and K the event started with');
/* rapid and blitz follow the same rule */
const rc=X.freshCareer();rc.ratingRapid=2200;rc.ratedRapid=60;rc.peakRapid=2200;
const rref=X.ratingRef(rc,'rapid');
X.applyByFormat(rc,'rapid',2200,1,rref);X.applyByFormat(rc,'rapid',2200,1,rref);
ok(rc.ratingRapid===2220&&rref.r0===2200,'a rapid event is rated from its start too');
/* a provisional player has nothing to measure from */
const pc=X.freshCareer();
ok(X.ratingRef(pc,'classical')===null,'an unrated player has no reference — their games pool toward a first rating');

/* the first rating */
function debut(games){
  const c=X.freshCareer();
  games.forEach(function(g){X.applyRatedGame(c,g[0],g[1]);});
  const pub=X.publishRating(c);
  return {pub:pub,rating:c.rating};
}
const five=debut([[1350,1],[1350,1],[1350,1],[1350,1],[1350,1]]);
ok(five.pub&&five.rating===1788,'five straight wins in a 1350 club championship publish at 1788, not 2150');
const naive=1350+X.dpFromPct(1);
ok(naive===2150,'(the raw performance really would have been '+naive+')');
const three=debut([[1500,1],[1500,0.5],[1500,1],[1500,0],[1500,0.5]]);
ok(three.pub&&three.rating===1636,'3/5 against 1500s debuts at 1636 — pulled a little toward 1800, as the rule does');
const weak=debut([[1350,1],[1350,0],[1350,0],[1350,0],[1350,0]]);
ok(!weak.pub,'1/5 comes out under the 1400 floor, so nothing is published yet');
const none=debut([[1350,0],[1350,0],[1350,0],[1350,0],[1350,0]]);
ok(!none.pub,'and a player who has not scored at all is not rated');
ok(!debut([[1350,1],[1350,1],[1350,1],[1350,1]]).pub,'four games is not enough for a first rating; five is');
ok(X.INIT_HYP_RATING===1800&&X.INIT_HYP_GAMES===2,'two hypothetical draws against 1800s, the 2024 rule');

/* a whole event through the real code path */
X.store.career=X.freshCareer();
const ec=X.store.career;X.lifeInit(ec);ec.setup=true;ec.provisional=false;ec.rating=2000;ec.peak=2000;ec.ratedGames=80;ec.age=25;
X.joinTournament('regional');
ok(ec.tour.ref&&ec.tour.ref.r0===2000&&ec.tour.ref.k===20,'entering an event fixes the rating and K it will be rated from');
const startR=ec.rating;
X.app.careerOpp=null;X.app.careerScored=false;
const trRef=ec.tour.ref;
for(let r=0;ec.tour&&r<ec.tour.rounds;r++)X._simRound(ec);
ok(ec.rating===trRef.r0+Math.round(trRef.acc),
  'a whole simulated event ends on its start rating plus the event total, rounded once ('+(ec.rating-startR>=0?'+':'')+(ec.rating-startR)+')');

console.log('\n— P5 · a round-robin is a schedule, fixed on the first day —');
/* the schedule itself */
for(const [n,cy] of [[8,2],[10,1],[14,1]]){
  let badS=0;
  for(let i=0;i<60;i++){const sc=X.rrSchedule(n,cy);if(!sc||!X.rrValid(sc,n,cy))badS++;}
  ok(badS===0,n+' players, '+(cy===2?'double':'single')+' round-robin: sixty schedules, every one valid');
}
const sc8=X.rrSchedule(8,2);
ok(sc8.length===14,'eight players twice round is fourteen rounds');
ok(sc8.every(rd=>rd.length===4),'with four games in every round, so nobody sits out');
const seq8=X.rrColourSeqs(sc8,8);
ok(seq8.every(q=>q.filter(c=>c==='w').length===7),'everybody gets exactly seven whites and seven blacks');
let noThree=true;seq8.forEach(q=>{for(let i=2;i<q.length;i++)if(q[i]===q[i-1]&&q[i]===q[i-2])noThree=false;});
ok(noThree,'and nobody has the same colour three times running, across both cycles');
/* each pairing twice, once with each colour */
const seen={};
sc8.forEach(rd=>rd.forEach(p=>{seen[p[0]+'>'+p[1]]=(seen[p[0]+'>'+p[1]]||0)+1;}));
let eachWay=true;
for(let a=0;a<8;a++)for(let b=0;b<8;b++)if(a!==b&&seen[a+'>'+b]!==1)eachWay=false;
ok(eachWay,'every pair meets twice, once with each player on White');
const sc10=X.rrSchedule(10,1),seq10=X.rrColourSeqs(sc10,10);
ok(seq10.every(q=>Math.abs(q.filter(c=>c==='w').length-q.filter(c=>c==='b').length)===1),
  'in a single round-robin of ten, everybody is five-four one way or the other');
ok(!X.rrValid(sc10.slice(0,8),10,1),'and a schedule missing a round is rejected');

/* the Candidates, as it is played */
X.store.career=X.freshCareer();
const cc=X.store.career;X.lifeInit(cc);cc.setup=true;cc.name='Ada Marín';cc.fed='ROU';cc.provisional=false;
cc.rating=2760;cc.peak=2760;cc.ratedGames=500;cc.age=28;cc.titles=['GM'];cc.honors=['Candidates Qualifier'];
const cand=X.TOURNAMENTS.find(t=>t.id==='candidates');
ok(cand.rr===2,'the Candidates is flagged a double round-robin');
ok(!X.tourLocked(cand,cc),'(and a qualified 2760 may enter it)');
X.joinTournament('candidates');
let T5=cc.tour;
ok(T5&&T5.players.length===7,'the Candidates is seven opponents, not fourteen strangers');
ok(T5.standings.length===8,'so the table has eight names in it');
ok(T5.field.length===14&&T5.rounds===14,'played over fourteen rounds');
const times={};T5.field.forEach(o=>{times[o.pid]=(times[o.pid]||0)+1;});
ok(Object.keys(times).length===7&&Object.values(times).every(v=>v===2),'you meet each of the seven exactly twice');
const colVs={};T5.field.forEach((o,i)=>{(colVs[o.pid]=colVs[o.pid]||[]).push(T5.colours[i]);});
ok(Object.values(colVs).every(v=>v.sort().join()==='b,w'),'once with White and once with Black');
ok(T5.colours.filter(c=>c==='w').length===7,'seven whites of your own');
ok(T5.myNo>=1&&T5.myNo<=8,'and you drew pairing number '+T5.myNo);
ok(T5.sched.length===14&&T5.sched.every(rd=>rd.length===3),'every other board of every round is on the schedule too');
ok(/Double round-robin · 8 players/.test(X.tourDrawPanel(cc,T5)),'the event says what it is');
ok(!/The draw —/.test(X.tourDrawPanel(cc,T5)),'and there is no pot draw, because there is nothing to draw');
/* play it all */
X.app.careerOpp=null;X.app.careerScored=false;
let guard=0,xtSnap=null;
while(cc.tour&&guard<30){
  if(cc.tour.round===cc.tour.rounds-1)xtSnap=JSON.parse(JSON.stringify(cc.tour));
  X._simRound(cc);guard++;
}
ok(!cc.tour&&cc.history[0].name==='Candidates Tournament','the whole Candidates plays through');
/* before the last round nobody has met anybody more than twice */
const G5=X.xtGrid({standings:xtSnap.standings,pairs:xtSnap.pairs});
let oddCell=0;
G5.grid.forEach((row,i)=>row.forEach((cell,j)=>{if(i!==j&&cell&&cell.n>2)oddCell++;}));
ok(oddCell===0,'nobody met anybody more than twice');
const snap=cc.history[0].xt;
ok(snap&&snap.players.length===8,'the finished crosstable has eight rows');
let full=true;
snap.grid.forEach((row,i)=>row.forEach((cell,j)=>{if(i!==j&&(!cell||cell[1]!==2))full=false;}));
ok(full,'and every cell of it holds two games — a complete double round-robin');
const totalPts=snap.players.reduce((t,p)=>t+p.score,0);
ok(totalPts===56,'fifty-six games, fifty-six points in the table');

/* a single round-robin */
X.store.career=X.freshCareer();
const gc=X.store.career;X.lifeInit(gc);gc.setup=true;gc.fed='ROU';gc.provisional=false;gc.rating=2450;gc.peak=2450;gc.ratedGames=300;gc.age=24;gc.titles=['IM'];
X.joinTournament('gmrr');
const G6=gc.tour;
ok(G6.players.length===9&&G6.standings.length===10,'a GM-norm round-robin is ten players');
ok(new Set(G6.field.map(o=>o.pid)).size===9,'and you meet all nine of them once');
ok(X.colourOk(G6.colours),'with colours that follow the rules');
while(gc.tour)X._simRound(gc);
const s6=gc.history[0].xt;
let full6=true;
s6.grid.forEach((row,i)=>row.forEach((cell,j)=>{if(i!==j&&(!cell||cell[1]!==1))full6=false;}));
ok(full6,'the finished crosstable is complete — every pair played exactly once');
ok(s6.players.reduce((t,p)=>t+p.score,0)===45,'forty-five games, forty-five points');

/* an event saved before schedules existed carries on as it was */
const oldT={id:'candidates',rounds:4,round:0,field:[{name:'A',rating:2750},{name:'B',rating:2750},{name:'C',rating:2750},{name:'D',rating:2750}],
  standings:[{id:'p0',name:'A',rating:2750,score:0},{id:'p1',name:'B',rating:2750,score:0},{id:'p2',name:'C',rating:2750,score:0},
    {id:'p3',name:'D',rating:2750,score:0},{id:'__you',name:'You',rating:2750,score:0,you:true}],results:[]};
ok(X.rrRoundPairs(oldT,0).length===0,'an old save has no schedule to read');

console.log('\n— P6 · an open is paired on score —');
const TT=id=>X.TOURNAMENTS.find(t=>t.id===id);
ok(X.swissEligible(TT('intl'))&&X.swissEligible(TT('cityopen'))&&X.swissEligible(TT('gibraltar')),'opens are Swiss events');
ok(!X.swissEligible(TT('gmrr'))&&!X.swissEligible(TT('candidates')),'round-robins are not');
ok(!X.swissEligible(TT('olympiad'))&&!X.swissEligible(TT('worldcup'))&&!X.swissEligible(TT('wcc')),
  'nor the Olympiad, the World Cup or a title match');
ok(X.swissHallSize(9)===20&&X.swissHallSize(5)===12&&X.swissHallSize(11)===24,'a hall is about twice the rounds, and even');

/* joining an open */
function openCareer(r){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);
  c.setup=true;c.fed='ROU';c.provisional=false;c.rating=r;c.peak=r;c.ratedGames=300;c.age=24;return c;
}
let oc=openCareer(2380);
X.joinTournament('intl');
let OT=oc.tour;
ok(OT.swiss===true,'the International Open is a Swiss');
ok(OT.hall.length===19&&OT.standings.length===20,'twenty players in the hall, you included');
ok(OT.field.length===1,'and only round one is paired when you arrive — nobody knows round two yet');
ok(X.drawRevealed(OT)===1,'the event knows how far it has been paired');
ok(/Swiss · 20 players · 9 rounds/.test(X.tourDrawPanel(oc,OT)),'it says what kind of event it is');
ok(!/The draw —/.test(X.tourDrawPanel(oc,OT)),'with no pot draw');
const v0=X.careerTourView(oc);
ok((v0.match(/Paired on score after round/g)||[]).length===8,'the eight rounds to come say they will be paired on score');
/* playing it out: never the same opponent twice, always someone on a near score */
function play(c,scoreFn){
  const T=c.tour;let r=0;const snaps=[];
  while(c.tour&&r<40){
    const t=c.tour;
    const me=t.standings.filter(p=>p.you)[0],opp=t.field[t.round];
    const oppRow=t.standings.filter(p=>p.id===opp.pid)[0];
    // the closest score anyone unmet was on when this pairing was made
    const metBefore={};t.field.slice(0,t.round).forEach(o=>{metBefore[o.pid]=1;});
    // colour rules come first, as they do in a pairing program: somebody you
    // cannot be given colours with is skipped even if they are the closest score
    const unmetNow=t.standings.filter(p=>!p.you&&!metBefore[p.id]);
    const fitNow=unmetNow.filter(p=>!X.swissClash(me,p));
    const gaps=(fitNow.length?fitNow:unmetNow).map(p=>Math.abs(p.score-me.score));
    snaps.push({my:me.score,their:oppRow.score,gap:Math.abs(me.score-oppRow.score),minGap:Math.min.apply(null,gaps)});
    X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
    X.app.careerRoundOpp=opp;X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;
    X.careerResult(scoreFn(r));r++;
  }
  return {T:T,snaps:snaps};
}
const P1=play(oc,r=>r%3===0?0.5:1);
ok(new Set(P1.T.field.map(o=>o.pid)).size===9,'nine rounds, nine different opponents');
ok(P1.T.field.every(o=>o&&o.pid&&P1.T.hall.indexOf(o)>=0),'every one of them from the hall');
ok(P1.snaps.every(sn=>Math.abs(sn.gap-sn.minGap)<1e-9),
  'every pairing takes the closest score among players you can be given colours with — floating only when it must');
ok(P1.snaps.filter(sn=>sn.gap===0).length>=3,'often exactly on it ('+P1.snaps.filter(sn=>sn.gap===0).length+' of 9)');
const snapX=oc.history[0].xt;
ok(snapX.players.length===20,'the final table has the whole hall in it');
ok(snapX.players.reduce((t,p)=>t+p.score,0)===90,'ninety points: ten games a round for nine rounds, byes and all');

/* the whole point: winning brings harder opposition */
function oppAvg(scoreFn,n){
  let tot=0,hi=0,q=0;
  for(let i=0;i<n;i++){
    const c=openCareer(2380);X.joinTournament('intl');
    const P=play(c,scoreFn);
    const o=X.normOpps(P.T);
    tot+=o.reduce((t,x)=>t+x.rating,0)/o.length;
    hi+=o.filter(x=>x.title==='GM'||x.title==='IM').length;
    if(X.normCheck(c,IM,o,null,{}).opposition)q++;
  }
  return {avg:tot/n,hi:hi/n,q:q/n};
}
const W=oppAvg(()=>1,60),L=oppAvg(()=>0,60);
ok(W.avg>L.avg+250,'win every game and you meet opposition '+Math.round(W.avg-L.avg)+' points stronger than if you lose every game ('+
  Math.round(W.avg)+' vs '+Math.round(L.avg)+')');
ok(W.hi>L.hi+2.5,'including the titled players: '+W.hi.toFixed(1)+' IMs and GMs against '+L.hi.toFixed(1));
ok(W.q>0.5,'so a winning run in an open usually brings IM-norm opposition ('+Math.round(W.q*100)+'% of the time)');
ok(L.q<0.08,'and a losing one almost never does ('+Math.round(L.q*100)+'%) — the field is the same, the pairings are not');

/* the tracker mid-Swiss */
oc=openCareer(2380);X.joinTournament('intl');
let tk=X.normTracker(oc.tour,oc);
ok(!/No norm is possible/.test(tk),'at the start of an open nobody can say the norm is impossible — the pairings are not made');
ok(/◐/.test(tk),'the opposition requirements are shown as still open');
ok(/to be paired/.test(tk),'with how many rounds are left to meet them');
ok(X.swissOppEstimate(oc.tour)>0,'the likely opposition is estimated from the players near your score');
const out=X.normOutlook(oc,IM,[{rating:2450,title:'IM',fed:'GER'}],8,{});
ok(out.find(r=>r.key==='hi').state==='open','one IM met with eight rounds to go: the IM count is still open');
const out2=X.normOutlook(oc,IM,[{rating:2100,title:'',fed:'GER'},{rating:2100,title:'',fed:'GER'},{rating:2100,title:'',fed:'GER'},
  {rating:2100,title:'',fed:'GER'},{rating:2100,title:'',fed:'GER'},{rating:2100,title:'',fed:'GER'},{rating:2100,title:'',fed:'GER'}],2,{});
ok(out2.find(r=>r.key==='hi').state==='failed','no IMs in seven rounds with two to go: out of reach, and marked so');
ok(out2.find(r=>r.key==='titled').state==='failed','and not enough title holders either');

/* who turns up: a field is cut off at the top */
let over=0,sum=0,top=0;const N=20000,intl=TT('intl');
for(let i=0;i<N;i++){const r=X.fieldRating(intl);sum+=r;if(r>X.fieldCeiling(intl))over++;if(r>top)top=r;}
ok(over===0,'no International Open player is ever above the event’s ceiling ('+X.fieldCeiling(intl)+')');
ok(Math.abs(sum/N-intl.avg)<intl.avg*0.02,'while the field still averages what the event says ('+Math.round(sum/N)+' for '+intl.avg+')');
let halls2700=0;
for(let i=0;i<200;i++){const c=openCareer(2300);X.joinTournament('intl');if(c.tour.hall.some(p=>p.rating>=2700))halls2700++;}
ok(halls2700===0,'and not one of two hundred International Open halls has a 2700 in it — one in two had a 2850');
ok(X.fieldCeiling(TT('qatar'))>=2780,'while the Qatar Masters can still draw a super-GM ('+X.fieldCeiling(TT('qatar'))+')');

/* colours for everybody in a Swiss */
const ahead={cb:1,lc:'w',lc2:'b'},behind={cb:-1,lc:'b',lc2:'w'};
ok(X.swissWhiteFirst(ahead,behind)===false,'the player behind on whites gets White');
const twoW={cb:0,lc:'w',lc2:'w'},lastB={cb:0,lc:'b',lc2:'w'};
ok(X.swissWhiteFirst(twoW,lastB)===false,'and nobody gets a third White in a row');
ok(X.swissNeeds({lc:'w',lc2:'w',cb:0})==='b'&&X.swissNeeds({lc:'b',lc2:'b',cb:0})==='w',
  'two of one colour running means the other colour is owed');
ok(X.swissNeeds({lc:'w',lc2:'b',cb:2})==='b','and so does being two whites ahead');
ok(X.swissNeeds({lc:'w',lc2:'b',cb:1})===null,'otherwise there is a preference, not a rule');
ok(X.swissClash({lc:'w',lc2:'w'},{cb:2,lc:'b',lc2:'w'}),'two players who both must have Black cannot be paired');
ok(!X.swissClash({lc:'w',lc2:'w'},{lc:'b',lc2:'b'}),'one who must have Black and one who must have White can');
let colBad=0;
for(let i=0;i<20;i++){
  const c=openCareer(2300);X.joinTournament('intl');
  const P=play(c,()=>Math.random()<0.5?1:0);
  const rows=c.history[0].xt.rows;
  rows.forEach(function(cells){
    const cols=cells.map(x=>x&&x[1]).filter(Boolean);
    for(let k=2;k<cols.length;k++)if(cols[k]===cols[k-1]&&cols[k]===cols[k-2])colBad++;
    let w=0,b=0;
    cols.forEach(function(x){if(x==='w')w++;else b++;if(Math.abs(w-b)>2)colBad++;});
  });
}
ok(colBad===0,'across twenty whole opens nobody in the hall gets three of a colour running, or two colours ahead — FIDE’s two absolute colour rules');

/* the Swiss crosstable */
const c9=openCareer(2300);X.joinTournament('intl');play(c9,r=>r%2?1:0.5);
const sx=c9.history[0].xt;
ok(sx.swiss===true&&sx.rows.length===20&&sx.rows.every(r=>r.length===9),'an open keeps a round-by-round crosstable: twenty rows, nine rounds');
let oppOk=true;
sx.rows.forEach(function(cells,i){cells.forEach(function(c){if(c&&c[0]&&(c[0]<1||c[0]>20||c[0]===i+1))oppOk=false;});});
ok(oppOk,'every cell names a real opponent by their final place, and never the player themselves');
const back=sx.rows.every(function(cells,i){return cells.every(function(c,r){
  if(!c||!c[0])return true;const o=sx.rows[c[0]-1][r];return o&&o[0]===i+1&&Math.abs(o[2]+c[2]-1)<1e-9&&(!c[1]||o[1]!==c[1]);});});
ok(back,'and the opponent’s cell for that round points straight back, with the other colour and the other result');
const html9=X.xtSwissTable(sx.players.map((p,i)=>Object.assign({cells:sx.rows[i]},p)));
ok(/class="xt xts"/.test(html9)&&(html9.match(/scope="row"/g)||[]).length===20,'it renders as a real table, a row header per player');
ok(/>R9</.test(html9)&&!/>R10</.test(html9),'with one column per round');

/* an open saved before Swiss pairing existed carries on with its fixed field */
const legacy={id:'intl',rounds:3,round:0,field:[{name:'A',rating:2200},{name:'B',rating:2200},{name:'C',rating:2200}],results:[]};
X.swissEnsure(legacy);
ok(legacy.field.length===3&&!legacy.swiss,'an event saved before this keeps the opponents it already had');
console.log('\n✅ realism: '+pass+' checks passed');
