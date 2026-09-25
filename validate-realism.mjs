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
  'eventNorms,eventNormMisses,normTracker,careerFinishBanner,careerNorms,makeField,dpFromPct,'+
  'kFactor,ratingRef,publishRating,INIT_HYP_RATING,INIT_HYP_GAMES,'+
  'rrPairs,rrOrient,rrValid,rrSchedule,rrColourSeqs,rrInit,rrLabel,rrCard,rrRoundPairs,xtGrid,standingsSorted,tourDrawPanel,tourLocked,'+
  'swissEligible,swissHallSize,swissInit,swissPairMe,swissEnsure,swissMet,swissCard,swissOppEstimate,normOutlook,drawRevealed,'+
  'fieldRating,fieldCeiling,swissWhiteFirst,swissNoteColour,xtSwissRows,xtSwissTable,swissClash,swissNeeds,'+
  'koOrder,koTiebreak,koArmageddon,koSimMatch,koInit,koOpponent,koAfterGame,koPlace,koCard,KO_SIZE,KO_PLACE,KO_NAMES,'+
  'PRIZE_FIRST,ENTRY_FEE,KO_PRIZE,WCC_LOSER,OLY_PAY,prizeFirst,prizeTable,prizeFor,tourPrize,entryFee,prizeLine,careerLobby,'+
  'eventDays,eventTrip,tripCost,lifeSpendDays,weekAccounts,payOrOwe,endOfWeek,doDay,careerStream,careerSimul,careerCamp,careerRest,'+
  'careerSabbatical,careerCommentate,lifeCosts,seasonRollover,streamReset,stopClockTick,'+
  'cycleInit,cycleValid,cycleQualify,cycleLock,wccOpponent,matchDecided,cycleAfterMatch,matchAfterGame,careerRoadPanel,'+
  'circuitFinalize,worldRanking,worldRank,CYCLE_SEASONS,CAND_RATING_RANK,WORLD_REAL,'+
  'wcQualify,WC_RATING_RANK,WC_CONT_TOP,ANNUAL_EVENTS,normsOnOffer,KO_FLOOR,KO_QUAL_MIN,finalizeTournament,buildWorld,toastAdd,EVENT_WEEK,heldThisSeason,calendarLock,weekOfSeason,seasonYear,worldChampion,'+
  'careerWaitUntil,careerCalendarPanel,realDepth,rankList,careerLeaderboard,titleFor,wpTitle,titlePromote,TITLE_ORDER,'+
  'wpAge,worldSeason,wxInit,worldEventsTick,worldChallenger,eliteField,makeField,cycleInit,'+
  'tbData,standingsSorted,playoffFirst,tieNote,PLAYOFF_EVENTS,careerStandings,'+
  'PRO_LEAGUES,PRO_WEEKS,proOffers,proFee,proSign,proDue,proMyMatch,careerProSim,proTick,proRenew,careerProPanel,'+
  'wmInit,wmHire,wmStart,wmBeforeGame,wmAfterGame,wmRest,wmPress,wmPanel,wmTeamElo,WM_SECONDS,WM_LEAK_BASE,WM_LEAK_PER,matchScoreStrip,'+
  'olympiadSelected,fedRank,wpRating,wpStrength,worldGame,worldIndex,worldApply,worldVsYou,worldWeek,worldCircuit,simSwiss,simRoundRobin,'+
  'proLeagues,proLeagueOf,proTable,proBoard,proMyMatch,candidatesField,specRate,tourBoardGame,koGame,wrOf,wrInit,wpK,oppStrength,OLY_BOARDS,'+
  'worldPick,swissHall,fieldFedRule,NAME_BANKS,NAME_FAMILY_FIRST,worldFeds,POOL_TOP,POOL_CLUB,baseWorld,olyInit,olyMyTeam,olyNation,fedPlayers,koInit,KO_SIZE,worldTick};')();
/* Named events are held in their week of the year: put the career there (and
   in a year the event is held) before entering one. */
function atEvent(c,id){
  const wk=X.EVENT_WEEK[id];if(wk==null)return c;
  let S=c.season||1;
  // a test that set the season by hand has not moved the weeks with it
  const inS=Math.floor((c.weeks||0)/52)+1===S,w=inS?X.weekOfSeason(c):-1;
  if(!X.heldThisSeason(id,{season:S})||w>wk){S++;while(!X.heldThisSeason(id,{season:S}))S++;}
  if(!inS||S!==(c.season||1)||w<wk-1){c.season=S;c.weeks=(S-1)*52+wk;c.day=0;}
  return c;
}
function joinAt(id){atEvent(X.store.career,id);X.joinTournament(id);}
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
const drift=climb(1800,2200,9,2500);
ok(Math.abs(drift)<3,'simulating a nine-round event 400 points above you is worth nothing on average ('+
  (drift>0?'+':'')+drift.toFixed(1)+'); it used to be about +50');
const drift2=climb(2700,2300,9,2500);
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

/* a norm is kept whole — when it was made, the score, everything it met —
   and the card shows each one on its own */
{
  X.store.career=X.freshCareer();const nc=X.store.career;X.lifeInit(nc);
  Object.assign(nc,{setup:true,name:'Ada Marín',fed:'ROU',gender:'open',rating:2480,provisional:false,peak:2480,season:2,weeks:52+14,day:0,money:100000,titles:['CM','FM']});
  X.joinTournament('gmrr');
  ok(nc.tour&&nc.tour.id==='gmrr','(a GM-norm round-robin to finish)');
  nc.tour.field=good.map((p,i)=>Object.assign({name:'Opp '+i},p));
  nc.tour.results=trGood.results.map((r,i)=>Object.assign({name:'Opp '+i},r));
  nc.tour.round=nc.tour.rounds=9;nc.tour.normEligible=true;
  X.finalizeTournament(nc);
  const n0=(nc.norms||[])[0];
  ok(n0&&n0.type==='GM'&&n0.s===2&&n0.w===14&&n0.score===6.5,'the norm remembers when in the career it was made, and the score');
  ok(n0.req&&n0.req.length===8&&n0.req.every(r=>r[4]===1),'and every requirement it met, with the numbers');
  X.app.normOpen=null;
  let card=X.careerNorms(nc);
  ok(/GM norm 1/.test(card)&&/GM-Norm Round-Robin/.test(card)&&/April 2027/.test(card),'the card lists it on its own: the event, and the month it was made');
  ok(/6½\/9/.test(card)&&/2600 needed/.test(card),'with the score and the performance it needed');
  ok(/Counts toward the GM and the IM titles/.test(card),'and says a GM norm is an IM norm too');
  ok(/<b[^>]*>GM<\/b>.*?1\/3 norms/.test(card)&&/<b[^>]*>IM<\/b>.*?1\/3 norms/.test(card),'each title shows how many of its three norms are made');
  X.app.normOpen=0;card=X.careerNorms(nc);
  ok(/GMs: <b>3<\/b>/.test(card)&&/Foreign federations: <b>\d+<\/b>/.test(card),'tapped, it opens to every requirement it met');
  X.app.normOpen=null;
  X.store.career=X.freshCareer();const e0=X.store.career;X.lifeInit(e0);e0.setup=true;
  ok(/What is a norm|A <b>norm<\/b> is one tournament/.test(X.careerNorms(e0))&&/2600\+/.test(X.careerNorms(e0)),'with no norms yet, the card explains what one is and what it takes');
}

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
ok(!X.tourLocked(cand,cc,true),'(and a qualified 2760 may enter it, in its week)');
joinAt('candidates');
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

{ // W1
console.log('\n— W1 · the World Cup is a knockout —');
/* the bracket */
ok(X.koOrder(8).join()==='1,8,4,5,2,7,3,6','an eight-player bracket is seeded 1–8, 4–5, 2–7, 3–6');
const o128=X.koOrder(128);
ok(o128.length===128&&new Set(o128).size===128&&Math.min.apply(null,o128)===1&&Math.max.apply(null,o128)===128,
  'a 128-player bracket holds every seed exactly once');
ok(o128.indexOf(1)<64&&o128.indexOf(2)>=64,'the top two seeds are in opposite halves — they can only meet in the final');
const q=s=>Math.floor(o128.indexOf(s)/32);
ok(new Set([q(1),q(2),q(3),q(4)]).size===4,'and the top four are in four different quarters');
ok(o128[0]===1&&o128[1]===128,'seed 1 opens against seed 128');
/* tiebreaks */
const stages={};let noWinner=0;
for(let i=0;i<3000;i++){
  const t=X.koTiebreak({rating:2700,rapid:2700,blitz:2700},{rating:2700,rapid:2700,blitz:2700});
  stages[t.stage]=(stages[t.stage]||0)+1;
  if(typeof t.aWins!=='boolean')noWinner++;
}
ok(noWinner===0,'a tiebreak always produces a winner');
ok(stages.rapid>stages.blitz&&stages.blitz>stages.armageddon&&stages.armageddon>0,
  'most are settled in rapid, fewer in blitz, a few in armageddon ('+stages.rapid+' / '+stages.blitz+' / '+stages.armageddon+')');
let armW=0;for(let i=0;i<20000;i++)armW+=X.koArmageddon(2700,2700);
ok(armW/20000<0.5,'in armageddon White must win and a draw is Black’s, so between equals White wins under half ('+Math.round(armW/200)+'%)');
/* whole matches between two others */
let favWins=0;
for(let i=0;i<3000;i++){const m=X.koSimMatch({name:'F',rating:2750,rapid:2750,blitz:2750},{name:'U',rating:2550,rapid:2550,blitz:2550});if(m.winner.name==='F')favWins++;}
ok(favWins/3000>0.7&&favWins/3000<0.97,'a 200-point favourite wins the match most of the time, not always ('+Math.round(favWins/30)+'%)');

/* entering */
function wcCareer(r){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=26;c.titles=['GM'];
  X.wcQualify(c,'national champion');             // a place in the draw, whatever the rating
  return c;
}
let wc=wcCareer(2650);
joinAt('worldcup');
let K=wc.tour.ko;
ok(K&&K.slots.length===X.KO_SIZE,'the World Cup is a bracket of 128');
ok(K.slots.filter(p=>p.you).length===1,'with you in it once');
ok(K.slots.some(p=>p.real&&p.seed<=5),'and the real top players at the top of it');
const seeds=K.slots.map(p=>p.seed).sort((a,b)=>a-b);
ok(seeds[0]===1&&seeds[127]===128,'seeded 1 to 128');
const bySeed=K.slots.slice().sort((a,b)=>a.seed-b.seed);
let seededOk=true;for(let i=1;i<bySeed.length;i++)if(bySeed[i].rating>bySeed[i-1].rating)seededOk=false;
ok(seededOk,'by rating, strongest first');
ok(!wc.tour.standings,'there is no standings table — a knockout does not have one');
ok(wc.tour.field.length===2&&wc.tour.field[0]===wc.tour.field[1],'your first match is two games against the same opponent');
ok(wc.tour.colours[0]!==wc.tour.colours[1],'with the colours reversed for the second');
const firstOpp=X.koOpponent(wc.tour);
ok(firstOpp.seed+K.mySeed===129,'and that opponent is your mirror seed ('+K.mySeed+' v '+firstOpp.seed+')');
ok(/Knockout · 128 players/.test(X.tourDrawPanel(wc,wc.tour)),'the event shows its bracket');

/* playing it: results are forced so every branch can be checked */
function koPlay(c,scoreFn){
  const T=c.tour;let g=0;
  while(c.tour&&g<40){
    const t=c.tour;
    X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
    X.app.careerRoundOpp=t.field[t.round];X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;
    X.careerResult(scoreFn(g,t));g++;
  }
  return T;
}
/* lose the first match outright */
wc=wcCareer(2650);joinAt('worldcup');
let T=koPlay(wc,()=>0);
ok(T.results.length===2,'lose both games of round one and your World Cup is two games long');
ok(wc.history[0].place===65,'you are out in the first round — joint 65th');
ok(T.ko.out&&T.ko.champion&&!T.ko.champion.you,'the bracket plays on without you and names a winner ('+T.ko.champion.name+')');
ok(T.ko.slots.length===1,'down to one');
/* win everything */
wc=wcCareer(2650);joinAt('worldcup');
T=koPlay(wc,()=>1);
ok(T.results.length===14,'win every game and it is seven matches, fourteen classical games');
ok(wc.history[0].place===1&&T.ko.champion.you,'and you win the World Cup');
ok((wc.honors||[]).indexOf('World Cup Winner')>=0,'with the honour');
ok((wc.honors||[]).indexOf('Candidates Qualifier')>=0,'and a place in the Candidates');
const oppSeeds=T.ko.mine.map(m=>m.opp.seed);
ok(new Set(oppSeeds).size===7,'seven different opponents');
ok(T.ko.mine.every(m=>m.won&&m.classical===2),'each beaten 2–0');
/* go out in the quarter-final: enough games for a norm */
wc=wcCareer(2650);joinAt('worldcup');
T=koPlay(wc,g=>g<8?1:0);
ok(wc.history[0].place===5&&T.results.length===10,'win four matches and lose the quarter-final: fifth, after ten classical games');
ok(T.ko.mine.length===5&&T.ko.mine[4].round===4&&!T.ko.mine[4].won&&/✗ vs/.test(X.koCard(T)),
  'the bracket records the quarter-final as the match that ended it');
/* lose the final */
wc=wcCareer(2650);joinAt('worldcup');
T=koPlay(wc,g=>g<12?1:0);
ok(wc.history[0].place===2,'lose the final and you are second');
ok((wc.honors||[]).indexOf('Candidates Qualifier')>=0&&(wc.honors||[]).indexOf('World Cup Winner')<0,
  'which still qualifies you for the Candidates, as the finalists do');
/* a drawn match goes to tiebreaks, and they are rated */
wc=wcCareer(2650);joinAt('worldcup');
const rapid0=wc.ratingRapid,blitz0=wc.ratingBlitz,rg0=wc.ratedRapid||0;
T=koPlay(wc,g=>g===0?1:(g===1?0:0));
const m0=T.ko.mine[0];
ok(m0.classical===1&&m0.tb,'one game each goes to tiebreaks ('+m0.tb.stage+')');
ok((wc.ratedRapid||0)>=rg0+2,'and the rapid tiebreak games are rated in rapid, as they are in life');
ok(/tiebreak|armageddon/.test(X.koCard(T)),'the bracket says how it was decided');
/* the norm rule */
wc=wcCareer(2650);joinAt('worldcup');
ok(/nine classical games/.test(X.careerTourView(wc)),'at the start the norm tracker explains the nine-game rule');
wc=wcCareer(2650);joinAt('worldcup');
koPlay(wc,()=>0);
ok((wc.norms||[]).length===0,'two games can never be a norm');
/* over many events, strength shows */
function wcPlaces(r,n){const pl=[];for(let i=0;i<n;i++){const c=wcCareer(r);joinAt('worldcup');
  while(c.tour)X._simRound(c);pl.push(c.history[0].place);}return pl;}
const hi=wcPlaces(2800,60),lo=wcPlaces(2480,60);
const avgP=a=>a.reduce((t,v)=>t+v,0)/a.length;
ok(avgP(hi)<avgP(lo)/3,'a 2800 goes far deeper than a 2480 (average place '+Math.round(avgP(hi))+' against '+Math.round(avgP(lo))+')');
ok(hi.filter(p=>p===1).length>0&&hi.filter(p=>p===1).length<45,'and wins it sometimes — never guaranteed ('+hi.filter(p=>p===1).length+' of 60)');
// (in 2,500 simulated World Cups a 2480 never reached the semi-finals; the
// check allows one freak run in sixty rather than be flaky about it)
ok(lo.filter(p=>p<5).length<=1,'while a 2480 all but never reaches the semi-finals ('+lo.filter(p=>p<5).length+' of sixty)');
}

{ // W2
console.log('\n— W2 · prize money on the real scale —');
const TT=id=>X.TOURNAMENTS.find(t=>t.id===id);
ok(X.TOURNAMENTS.every(t=>X.PRIZE_FIRST[t.id]!=null),'every event in the calendar has a prize fund of its own');
ok(X.prizeFirst(TT('wcc'))/X.prizeFirst(TT('club'))>=5000,
  'a World Championship pays thousands of times a club championship ('+X.prizeFirst(TT('wcc')).toLocaleString()+' against '+X.prizeFirst(TT('club'))+') — it was seventeen');
ok(X.prizeFirst(TT('superbet'))>X.prizeFirst(TT('tatasteel')),'the prize funds differ the way the real events do, not by a tier number');
/* how each kind of event shares it out */
const open20=X.prizeTable(TT('intl'),20);
ok(open20.length===4&&open20[0]===3000,'an open of twenty pays its top four, from '+open20[0]);
ok(open20.every((v,i)=>i===0||v<open20[i-1]),'each place paying less than the one above');
const rr10=X.prizeTable(TT('gmrr'),10);
ok(rr10.length===10&&rr10[9]>0,'a round-robin pays every place, down to last');
const cand=X.prizeTable(TT('candidates'),8);
ok(cand[0]===48000&&cand[1]===36000&&cand[2]===27000,'the Candidates pays 48,000, 36,000, 27,000 … down the table');
ok(X.prizeTable(TT('wcc'),2).join()==='1500000,1000000','a title match splits two and a half million 60/40');
ok(X.prizeTable(TT('olympiad'),12).length===0,'and the Olympiad has no prize fund at all');
/* ties are shared */
const mk=scores=>({id:'intl',standings:scores.map((sc,i)=>({id:i===0?'__you':'p'+i,name:'P'+i,rating:2300-i,score:sc,you:i===0})),rounds:9});
let pz=X.prizeFor(mk([7,7,7,6,5,5,4,4,4,3,3,3,2,2,2,1,1,1,0,0]),1);
ok(pz.shared===3&&pz.amount===Math.round((3000+1950+1350)/3),'joint first with two others is the average of the first three prizes ('+pz.amount+')');
pz=X.prizeFor(mk([7,8,6,6,5,5,4,4,4,3,3,3,2,2,2,1,1,1,0,0]),2);
ok(pz.shared===1&&pz.amount===1950,'clear second is second prize');
pz=X.prizeFor(mk([4,8,7,6,5,5,4,4,4,4,3,3,2,2,2,1,1,1,0,0]),6);
ok(pz.amount===0,'and the middle of the table is paid nothing');
pz=X.prizeFor(mk([5,8,7,6,5,5,4,4,4,3,3,3,2,2,2,1,1,1,0,0]),4);
ok(pz.shared===3&&pz.amount===Math.round(960/3),'level with two others across fourth to sixth, you get a third of fourth prize, since fifth and sixth pay nothing ('+pz.amount+')');
/* the World Cup pays by the round you went out in */
ok(X.KO_PRIZE[0]===6000&&X.KO_PRIZE[6]===80000&&X.prizeFirst(TT('worldcup'))===110000,
  'the World Cup: 6,000 for going out in round one, 80,000 for losing the final, 110,000 for winning it');
/* events outside the calendar keep their purse */
ok(X.prizeFor({id:'rivalfinale',tier:6,kind:'match'},1).amount===2800,'the rivalry finale keeps its purse');
ok(X.prizeFor({id:'intl',stake:500},1).amount===0,'and a money match pays its stake, not a prize');

/* entry fees */
const un={titles:[]},fm={titles:['FM','CM']},im={titles:['IM','FM','CM']},gm={titles:['GM','IM']};
ok(X.entryFee(TT('intl'),un)===90,'an untitled player pays the International Open’s entry fee');
ok(X.entryFee(TT('intl'),fm)===45,'an FM pays half');
ok(X.entryFee(TT('intl'),im)===0&&X.entryFee(TT('intl'),gm)===0,'IMs and GMs play free, as they do');
ok(X.entryFee(TT('gmrr'),im)===600,'an IM chasing a GM norm pays for the norm round-robin');
ok(X.entryFee(TT('gmrr'),gm)===0,'the grandmasters it invites do not');
ok(X.entryFee(TT('imrr'),im)===0&&X.entryFee(TT('imrr'),fm)===400,'an IM-norm event is paid for by the FMs chasing the norm');
ok(X.entryFee(TT('supergm'),un)===0&&X.entryFee(TT('candidates'),un)===0,'invitations cost nothing');
/* on entering */
X.store.career=X.freshCareer();
const ec=X.store.career;X.lifeInit(ec);ec.setup=true;ec.fed='ROU';ec.provisional=false;ec.rating=2100;ec.peak=2100;ec.ratedGames=100;ec.age=22;
ec.money=500;
X.joinTournament('intl');
ok(ec.money===410&&ec.tour.fee===90,'entering the International Open takes the fee');
X.store.career=X.freshCareer();
const poor=X.store.career;X.lifeInit(poor);poor.setup=true;poor.fed='ROU';poor.provisional=false;poor.rating=2100;poor.peak=2100;poor.money=40;
ok(/entry fee/.test(X.tourLocked(TT('intl'),poor)||''),'and an event you cannot pay for is locked, and says why');
ok(/1st 💰3,000/.test(X.prizeLine(TT('intl'),poor))&&/entry 💰90/.test(X.prizeLine(TT('intl'),poor)),
  'the lobby says what first pays and what entering costs');
ok(/entry free for you/.test(X.prizeLine(TT('intl'),{titles:['IM']})),'including when it costs you nothing');

/* a whole event pays exactly what the rules say */
let paidOk=0,runs=0;
for(let i=0;i<30;i++){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.fed='ROU';c.provisional=false;
  c.rating=2350;c.peak=2350;c.ratedGames=300;c.age=24;c.titles=['IM'];c.money=5000;
  joinAt('gibraltar');
  while(c.tour&&c.tour.round<c.tour.rounds-1)X._simRound(c);
  const tr=c.tour,before=c.money;
  X._simRound(c);
  const f=X.app.careerFinish;runs++;
  // the prize is what prizeFor says, computed on the final table
  if(f&&f.prize===X.prizeFor(Object.assign({},tr),f.place).amount)paidOk++;
}
ok(paidOk===runs,'thirty Gibraltar Masters each paid exactly the shared prize the final table says');
const ban=X.careerFinishBanner({name:'Gibraltar Masters',emoji:'🇬🇮',score:7,rounds:10,tpr:2600,place:1,prize:14433,shared:3});
ok(/💰14,433 prize money/.test(ban)&&/shared 3 ways/.test(ban),'the finish banner says what you won, and that it was shared');

/* the Olympiad is paid by the federation */
X.store.career=X.freshCareer();
const oc=X.store.career;X.lifeInit(oc);oc.setup=true;oc.name='Ada';oc.fed='ROU';oc.flag='🇷🇴';oc.provisional=false;
oc.rating=2620;oc.peak=2620;oc.ratedGames=300;oc.age=24;oc.titles=['GM'];
joinAt('olympiad');
const om=oc.money;
while(oc.tour)X._simRound(oc);
const f2=X.app.careerFinish;
ok(f2&&f2.prize===0,'the Olympiad pays no prize money');
ok(f2.olyPay>=X.OLY_PAY.stipend,'the federation pays a stipend instead ('+f2.olyPay+')');
}

{ // A1
console.log('\n— A1 · time and money move together —');
const T9=(id,extra)=>Object.assign({id:id,format:'classical',rounds:9},extra||{});
/* how long things take */
ok(X.eventDays(T9('club',{rounds:5}),5)===5,'a club championship is five evenings');
ok(X.eventDays(T9('cityopen',{rounds:5}),5)===3,'a weekend open is a weekend');
ok(X.eventDays(T9('intl'),9)===13,'a nine-round open abroad is thirteen days, travel included — it was eleven weeks');
ok(X.eventDays(T9('candidates',{rounds:14,sched:[1]}),14)===19,'the Candidates is under three weeks');
ok(X.eventDays(T9('wcc',{rounds:14,kind:'match'}),14)===23,'a title match about three weeks, with a rest day every two games');
ok(X.eventDays(T9('worldcup',{ko:{}}),2)===5,'going out of the World Cup in round one is five days');
ok(X.eventDays(T9('worldcup',{ko:{}}),14)===23,'winning it is more than three weeks');
ok(X.eventDays(T9('blitzopen',{format:'blitz'}),9)===1,'a blitz open is a day');
ok(X.eventDays(T9('worldrapid',{format:'rapid',rounds:11}),11)===5,'the World Rapid, travel included, under a week');
/* getting there */
const un={titles:[]},im={titles:['IM']},gm={titles:['GM','IM']};
const abroad=X.tripCost(T9('intl'),un,13);
ok(abroad.total===280+12*75,'an untitled player pays the flight and twelve hotel nights for an open abroad ('+abroad.total+')');
ok(X.tripCost(T9('intl'),im,13).total===280+12*75/2,'an IM gets half the hotel');
ok(X.tripCost(T9('intl'),gm,13).total===280,'and a GM is put up for free, paying only the fare');
ok(X.tripCost(T9('supergm',{sched:[1]}),un,12).total===0,'invited players pay nothing');
ok(X.tripCost(T9('olympiad',{oly:{}}),un,12).total===0&&X.tripCost(T9('worldcup',{ko:{}}),un,5).total===0,
  'nor does anyone at the Olympiad or the World Cup');
ok(X.tripCost(T9('cityopen',{rounds:5}),un,3).total===36,'a local weekend open is three days of fares and your own bed');
ok(X.tripCost(T9('club',{rounds:5}),un,5).total===0,'and the club championship is at home');
ok(X.eventTrip({id:'titledtues'})==='online','an online event costs no travel at all');
/* the calendar */
function cc(){X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='A';c.fed='ROU';
  c.provisional=false;c.rating=2300;c.peak=2300;c.ratedGames=300;c.age=24;c.money=50000;c.home='shared';c.day=0;c.weeks=10;c.season=1;return c;}
let c=cc();
X.lifeSpendDays(c,13,{id:'event',e:'🏟️'});
ok(c.weeks===11&&c.day===6,'thirteen days from the start of a week closes one week and leaves six days used of the next');
c=cc();c.day=3;
X.lifeSpendDays(c,13,{id:'event',e:'🏟️'});
ok(c.weeks===12&&c.day===2,'from mid-week it closes two');
/* every week pays its bills, wherever it is spent */
c=cc();c.sponsor={name:'S',perWeek:300,weeksLeft:3};c.coaches=[{name:'K',salary:60}];
const m0=c.money,bills=X.lifeCosts(c,1).total;
for(let i=0;i<7;i++){c.energy=100;X.doDay('study');}
ok(c.money===m0-bills+300-60,'a week at home pays rent and food, your second’s wage, and your sponsor’s cheque ('+(c.money-m0)+')');
ok(c.sponsor.weeksLeft===2,'and the sponsor deal counts down by the week');
for(let w=0;w<2;w++)for(let i=0;i<7;i++){c.energy=100;X.doDay('study');}
ok(c.sponsor===null,'ending when its weeks are up');
/* the things that used to be free weeks */
c=cc();const mS=c.money,wS=c.weeks;
for(let i=0;i<7;i++){c.energy=100;X.careerStream();}
X.streamReset();X.stopClockTick();X.app.playFen=null;X.app.careerOpp=null;X.app.view='career';   // each stream is a game now; leave the last one
ok(c.weeks===wS+1,'seven streams are seven days — one week, not seven');
ok(c.money<mS+7*60,'and the week’s rent is paid out of what they earned ('+(c.money-mS)+')');
c=cc();const wC=c.weeks,mC=c.money;
X.careerCamp();
ok(c.weeks===wC+2,'a training camp is two weeks');
ok(c.money<=mC-300-2*X.lifeCosts(c,1).total+1,'and costs its fee plus two weeks of bills, not the fee alone');
c=cc();const wR=c.weeks;
X.careerRest();
ok(c.weeks===wR+1,'a week off is a week');
c=cc();const wB=c.weeks;
X.careerSabbatical();
ok(c.weeks===wB+8,'a sabbatical is eight');
/* an event through the real flow */
c=cc();c.titles=[];c.money=5000;const wE=c.weeks,aE=c.age;
X.joinTournament('intl');while(c.tour)X._simRound(c);
const passed=c.weeks-wE+c.day/7;
ok(passed>1.7&&passed<2,'a whole International Open passes about two weeks of calendar ('+passed.toFixed(2)+')');
ok(c.age-aE<0.05,'and ages you days, not three months');
const fin=X.app.careerFinish;
ok(fin&&fin.days===13&&fin.trip===1180&&fin.fee===90,'the trip is charged — thirteen days, 💰1,180 of travel and hotel, 💰90 entry');
const fb=X.careerFinishBanner(fin);
ok(/13 days · entry 💰90 · travel &amp; hotel 💰1,180/.test(fb),'and the finish banner shows the trip’s books');
ok(/on the trip/.test(fb),'down to whether it paid for itself');
/* a year is a year */
c=cc();const a0=c.age;
for(let w=0;w<52;w++)for(let i=0;i<7;i++){c.energy=100;X.doDay('rest');}
ok(Math.abs((c.age-a0)-1)<0.02,'fifty-two weeks later you are a year older ('+(c.age-a0).toFixed(2)+')');
/* the end of a season actually does its work */
c=cc();c.weeks=51;c.day=0;c.season=1;c.circuit={pts:17,season:1};c.calDone=['intl'];
for(let i=0;i<7;i++){c.energy=100;X.doDay('rest');}
ok(c.season===2,'crossing week 52 starts season two');
ok(c.circuit&&c.circuit.pts===0,'and finalises the Grand Circuit — its points used to carry over forever, and nobody was ever crowned');
ok((c.calDone||[]).length===0,'and clears the season calendar');
ok((c.news||[]).some(n=>/new season|Season 1|season 1/i.test(n.t)),'with the season’s awards announced');
/* debts */
c=cc();c.money=100;X.payOrOwe(c,250);
ok(c.money===0&&c.debt===150,'a bill you cannot pay becomes debt, the same as the rent');
}
{ // A2
console.log('\n— A2 · the championship cycle —');
function cyc(r,season){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=27;c.titles=['GM'];
  c.season=season||3;c.money=50000;return c;
}
const cand=X.TOURNAMENTS.find(t=>t.id==='candidates'),wcc=X.TOURNAMENTS.find(t=>t.id==='wcc');
function playAll(c,scoreFn){
  const T=c.tour;let g=0;
  while(c.tour&&g<60){
    const t=c.tour;
    X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
    X.app.careerRoundOpp=t.field[t.round];X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;
    X.careerResult(scoreFn(g,t));g++;
  }
  return T;
}
/* the keys used to be permanent */
let c=cyc(2690);
ok(X.worldRank(c,'classical')>X.CAND_RATING_RANK,'a 2690 is well outside the world top three (#'+X.worldRank(c,'classical')+')');
ok(/no place yet/.test(X.tourLocked(cand,c)||''),'so being rated 2680 no longer opens the Candidates by itself');
ok(/win the Candidates/.test(X.tourLocked(wcc,c)||''),'and the title match is shut until you win it');
c=cyc(2900);
ok(X.worldRank(c,'classical')<=X.CAND_RATING_RANK,'the world number one…');
ok(X.tourLocked(cand,c,true)===null,'…is in the Candidates on rating, the way FIDE gives a rating spot');
X.app.lobbyMore={classical:true,rapid:true,blitz:true};   // the events you cannot enter yet are folded; open them
ok(/qualify: World Cup final, Grand Swiss top two, Grand Circuit winner or world top 3/.test(X.careerLobby(c)),'the lobby says how a Candidates place is earned, not a rating floor');
/* a place is for one cycle */
c=cyc(2690,2);X.cycleQualify(c,'a test');
ok(/next held season 3/.test(X.tourLocked(cand,c)||''),'a place earned in season 2 — a World Cup year — waits for the Candidates in season 3');
c.season=3;c.weeks=2*52+13;ok(X.tourLocked(cand,c)===null,'where it is good, in the Candidates’ week');
c.season=4;ok(X.tourLocked(cand,c,true)!==null,'and by season 4 it has lapsed — a Candidates place is for one cycle');
/* old saves keep what they had earned */
c=cyc(2690,6);c.honors=['Candidates Qualifier'];delete c.cycle;
ok(X.tourLocked(cand,c,true)===null,'a career saved with a Candidates place keeps it, once');
c=cyc(2690,6);c.honors=['Candidates Qualifier','Candidates Winner'];delete c.cycle;
ok(X.tourLocked(wcc,c,true)===null,'and one that had won the Candidates keeps its title match');
c=cyc(2790,6);c.honors=['World Champion'];delete c.cycle;
ok(X.cycleInit(c).champ===true,'and a World Champion is still the champion');
/* playing the Candidates uses the place up */
c=cyc(2760,3);X.cycleQualify(c,'a test');
joinAt('candidates');
ok(c.tour&&c.tour.id==='candidates','a qualified player plays the Candidates');
ok(c.cycle.cand===null&&c.cycle.candPlayed===3,'and the place is spent the moment they do');
let T=playAll(c,()=>0.5);
ok(!c.tour&&T.results.length===14,'fourteen rounds of it');
ok(c.cycle.chall===null,'drawing every game does not win it');
c.rating=2900;c.peak=2900;
ok(/next Candidates in season 5/.test(X.tourLocked(cand,c)||''),'and there is no second Candidates in the same cycle, even for the world number one');
/* win it */
c=cyc(2760,3);X.cycleQualify(c,'a test');joinAt('candidates');
T=playAll(c,()=>1);
ok(c.cycle.chall===3,'winning the Candidates makes you the challenger');
ok(X.tourLocked(wcc,c,true)===null,'which opens the title match');
ok(/Challenger/.test(X.careerRoadPanel(c)),'and the road to the title says so');
/* the title match: against the champion */
const champ0=X.worldChampion(c);
joinAt('wcc');
ok(c.tour&&champ0&&c.tour.field[0].name===champ0.name&&champ0.name==='D. Gukesh','the title match is against the reigning champion — Gukesh, who has held it since 2024');
ok(c.tour.defence===false,'as the challenger');
T=playAll(c,()=>1);
ok(T.results.length===8,'eight straight wins is 8–0 and the match stops there — it used to play all fourteen ('+T.results.length+')');
ok(/Match won 8–0.*decided with 6 games to spare/.test(X.careerFinishBanner(X.app.careerFinish)),'and the banner says it was decided with six to spare');
ok(c.cycle.champ===true&&(c.honors||[]).indexOf('World Champion')>=0,'you are the World Champion');
ok((c.feed||[]).some(n=>/You are the World Champion/.test(n.t)),'the feed says so — the eight-item news list is full by the end of the event');
ok(c.cycle.chall===null,'the challenge is spent');
ok(/you are the champion/.test(X.tourLocked(cand,c)||''),'the champion does not play the Candidates');
ok(/next defence in season 5/.test(X.tourLocked(wcc,c)||''),'and defends two seasons on, not again at once');
ok(/Your reign/.test(X.careerRoadPanel(c)),'the road panel becomes your reign');
/* a champion's World Cup final is not a Candidates place */
X.cycleQualify(c,'a test');
ok(c.cycle.cand===null,'a top finish does not hand the champion a Candidates place');
/* the defence, two seasons later, against the best player who is not you */
c.season=5;
ok(X.tourLocked(wcc,c,true)===null,'in season 5 the defence is due');
const challenger=X.worldRanking(c,'classical').filter(p=>!p.you)[0];
joinAt('wcc');
ok(c.tour.defence===true,'this time as the champion');
ok(c.tour.field[0].name===challenger.name&&c.tour.field[0].name!==c.name,
  'against the strongest player in the world who is not you — '+challenger.name+' — not against yourself');
T=playAll(c,()=>0);
ok(T.results.length===8,'lose eight and it is over');
ok(c.cycle.champ===false&&c.cycle.lost===5,'you lose the title');
ok(c.cycle.reigning&&c.cycle.reigning.name===challenger.name,'to your challenger, who now holds it');
ok((c.honors||[]).indexOf('World Champion')>=0,'the honour stays in your cabinet — you were champion');
ok(/Former World Champion/.test(X.careerRoadPanel(c)),'and you are a former World Champion');
ok(/win the Candidates/.test(X.tourLocked(wcc,c)||''),'to get it back you go through the Candidates like everyone else');
ok(X.wccOpponent(c).name===challenger.name,'and the title match would be against the one who beat you');
/* a level match goes to tiebreaks */
c=cyc(2790,3);c.cycle=null;X.cycleInit(c).chall=3;joinAt('wcc');
const rb=c.ratingRapid,bb=c.ratingBlitz;
T=playAll(c,g=>g%2?0:1);
ok(T.results.length===14,'a match that stays level goes the full fourteen');
ok(T.tb&&['rapid','blitz','armageddon'].indexOf(T.tb.stage)>=0,'and then to tiebreaks ('+(T.tb&&T.tb.stage)+') — 7–7 used to count as a defeat');
ok(c.cycle.champ===!!T.tb.won,'the tiebreak decides the title');
ok((c.feed||[]).some(n=>/world title|World Champion/.test(n.t)&&/in the tiebreaks/.test(n.t)),'and the feed remembers how the title was settled');
ok(/level, then (won|lost) the (rapid tiebreak|blitz tiebreak|armageddon game)/.test(X.careerFinishBanner(X.app.careerFinish)),'as does the finish banner');
let tbWins=0,tbN=400;
for(let i=0;i<tbN;i++){const x={round:14,rounds:14,id:'wcc',field:[{name:'Z',rating:2790}],results:Array.from({length:14},(_,k)=>({score:k%2}))};
  const cc=cyc(2790,3);X.matchAfterGame(cc,x);if(x.tb.won)tbWins++;}
ok(tbWins/tbN>0.4&&tbWins/tbN<0.6,'between equals the tiebreak is a coin you can win or lose ('+Math.round(tbWins/tbN*100)+'%)');
/* matchDecided */
const md=(sc,n)=>X.matchDecided({rounds:n,results:sc.map(x=>({score:x}))});
ok(md([1,1,1,1,1,1,1,1],14)&&!md([1,1,1,1,1,1,1],14)&&md([1,1,1,1,1,1,1,0.5],14),'fourteen games: 7½ decides it, 7 does not');
ok(md([0,0,0],4)&&!md([0,0],4),'a four-game grudge match is lost at 0–3');
/* the Grand Circuit and the Grand Swiss */
c=cyc(2700,3);c.circuit={pts:9999,season:3};X.circuitFinalize(c);
ok(c.cycle&&c.cycle.cand===3,'topping the Grand Circuit gives a place in the next Candidates');
ok(X.TOURNAMENTS.find(t=>t.id==='grandswiss').qualifier===2,'the Grand Swiss sends its top two, as it does');
}
{ // A3
console.log('\n— A3 · the smaller things —');
function pc(r,season){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=24;c.titles=['GM'];
  c.season=season||2;c.money=50000;return c;
}
function playOut(c,scoreFn){
  const T=c.tour;let g=0;
  while(c.tour&&g<60){
    const t=c.tour;
    X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
    X.app.careerRoundOpp=t.field[t.round];X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;
    X.careerResult(scoreFn(g,t));g++;
  }
  return T;
}
const TT=id=>X.TOURNAMENTS.find(t=>t.id===id);
/* the World Cup is qualified for */
let c=pc(2480);
ok(/no place yet/.test(X.tourLocked(TT('worldcup'),c)||''),'a 2480 is not in the World Cup just for being rated 2450');
ok(/qualify: national champion, continental top 4 or world top 60/.test(X.careerLobby(c)),'and the lobby says how to get in');
c=pc(2650);
c.rating=2700;c.peak=2700;
ok(X.worldRank(c,'classical')<=X.WC_RATING_RANK&&X.tourLocked(TT('worldcup'),c,true)===null,'a 2700 is — on the rating list');
c=pc(2480);joinAt('natch');playOut(c,()=>1);
ok(c.history[0].place===1&&c.cycle&&c.cycle.wc===2,'winning your national championship earns a World Cup place, as it does for a small federation’s champion');
ok(X.tourLocked(TT('worldcup'),c,true)===null,'and opens the draw');
joinAt('worldcup');
ok(c.tour&&c.tour.ko&&c.cycle.wc===null,'the place is used up when you play it');
playOut(c,()=>0);
ok(/once a season/.test(X.tourLocked(TT('worldcup'),c)||''),'and there is one World Cup a season');
c=pc(2480);joinAt('continental');playOut(c,()=>1);
ok(c.history[0].place<=X.WC_CONT_TOP&&c.cycle&&c.cycle.wc===2,'the top of the Continental Championship go to the World Cup, as its blurb always promised');
/* the bracket: qualifiers, not club players */
c=pc(2650);X.wcQualify(c,'national champion');joinAt('worldcup');
const sl=c.tour.ko.slots.slice().sort((a,b)=>a.seed-b.seed);
ok(sl.every(p=>p.rating>=X.KO_QUAL_MIN),'nobody in the draw is below '+X.KO_QUAL_MIN+' (lowest '+sl[127].rating+') — the 128th of the rating list used to be a 1900');
ok(sl[63].rating>=2440,'the middle of the draw is a strong grandmaster ('+sl[63].rating+')');
ok(sl.filter(p=>p.qualifier).length>40&&sl.filter(p=>p.qualifier).every(p=>p.rating<X.KO_FLOOR),'the lower half are qualifiers from below the rating-list spots');
ok(sl[0].real&&sl[0].rating>=2780,'and the top seed is still the world’s best');
/* named events are held once a year */
c=pc(2300);joinAt('reykjavik');
ok(c.tour&&c.tour.id==='reykjavik','you can play the Reykjavik Open');
playOut(c,()=>0.5);
ok(/once a season — next in season 3/.test(X.tourLocked(TT('reykjavik'),c)||''),'but it is held once a year — you cannot play it twice in a season');
X.joinTournament('intl');playOut(c,()=>0.5);
ok(X.tourLocked(TT('intl'),c)===null,'an ordinary international open is held somewhere every week');
c.season++;c.weeks=(c.season-1)*52+15;c.day=0;c.calDone=[];
ok(X.tourLocked(TT('reykjavik'),c)===null,'and next season, in its week, it is back');
ok(['candidates','wcc','intl','club','imrr','gmrr','supergm'].every(id=>!X.ANNUAL_EVENTS.has(id)),'the cycle events and the generic ones are not on the annual list');
/* norms are made in standard chess */
c=pc(2300);
ok(!X.normsOnOffer(TT('worldrapid'),c)&&!X.normsOnOffer(TT('indiablitz'),c),'a rapid or blitz event offers no FIDE norm');
ok(X.normsOnOffer(TT('intl'),c),'a classical one does');
const rapidRows=X.careerLobby(c).split('⚡ Rapid · ')[1].split('🔥 Blitz · ')[0];
ok(/Rapid Open|City Rapid/.test(rapidRows),'(the rapid section of the lobby, read on its own)');
ok(!/>norm</.test(rapidRows),'so the lobby no longer puts a “norm” chip on the rapid events');
joinAt('cityrapid');
ok(c.tour&&c.tour.normEligible===false,'and a rapid event does not track a norm you could never be given');
c=pc(2300);c.titleFormat='any';
ok(X.normsOnOffer(TT('worldrapid'),c),'unless the career counts every format towards titles');
/* the Olympiad's place is the country's */
c=pc(2650);c.fed='ROU';joinAt('olympiad');
ok(c.tour&&c.tour.oly,'the Olympiad starts');
playOut(c,()=>1);
ok(X.app.careerOly&&c.history[0].place===X.app.careerOly.place,'the place in your history is where the country finished ('+c.history[0].place+')');
ok((c.honors||[]).indexOf('Olympiad Board Medal')<0,'and no made-up “Olympiad Board Medal” for topping your own opponents — the real medals are awarded separately');
/* one line per thing that happened */
X.app.careerToast=null;
for(let i=0;i<8;i++)X.toastAdd('🤺 You beat your rival M. Carlsen.');
X.toastAdd('⭐ Level up');X.toastAdd('🤺 You beat your rival M. Carlsen.');
ok(X.app.careerToast==='🤺 You beat your rival M. Carlsen. ×9  ·  ⭐ Level up','a message repeated nine times is one line with “×9”, not nine lines');
}
{ // B
function bc(r,season,week){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed='ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=24;c.titles=r>=2500?['GM']:r>=2400?['IM']:[];
  c.season=season||1;c.weeks=((season||1)-1)*52+(week||0);c.day=0;c.money=500000;return c;
}
function playOut(c,scoreFn){
  const T=c.tour;let g=0;
  while(c.tour&&g<80){
    const t=c.tour;
    X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;
    X.app.careerRoundOpp=t.field[t.round];X.app.playMoves=[];X.app.careerLeague=false;X.app.parkBet=null;
    X.careerResult(scoreFn(g,t));g++;
  }
  return T;
}
const TT=id=>X.TOURNAMENTS.find(t=>t.id===id);

console.log('\n— B1 · named events are held in their week —');
ok(X.EVENT_WEEK.tatasteel<5&&X.EVENT_WEEK.norway>18&&X.EVENT_WEEK.norway<25&&X.EVENT_WEEK.olympiad>34&&X.EVENT_WEEK.worldblitz===51,
  'Wijk aan Zee in January, Norway Chess at the end of May, the Olympiad in September, the World Blitz at the year’s end');
let c=bc(2350,1,5);
ok(/opens week 15/.test(X.tourLocked(TT('reykjavik'),c)||''),'in week 5 the Reykjavik Open is not on yet');
c.weeks=14;ok(X.tourLocked(TT('reykjavik'),c)===null,'the week before, you can register');
c.weeks=15;ok(X.tourLocked(TT('reykjavik'),c)===null,'and in its week');
c.weeks=16;ok(/was week 15 · next season 2/.test(X.tourLocked(TT('reykjavik'),c)||''),'a week late, it is over until next year');
ok(X.tourLocked(TT('intl'),c)===null,'while an ordinary international open runs every week');
c=bc(2350,1,14);X.joinTournament('intl');while(c.tour)X._simRound(c);
ok(/was week 15/.test(X.tourLocked(TT('reykjavik'),c)||''),
  'thirteen days at an open in the wrong fortnight cost you Reykjavik (now week '+X.weekOfSeason(c)+')');
c=bc(2350,1,5);
let panel=X.careerCalendarPanel(c);
ok(/Season 1 · 2026/.test(panel),'the calendar says which season, and which year');
ok(/data-act="calwait" data-val="15"/.test(panel)&&/Reykjavik Open/.test(panel),'and offers to go to the week an event starts');
const w0=c.weeks,d0=(c.dayLog||[]).length;
X.careerWaitUntil(15);
ok(X.weekOfSeason(c)===15&&c.season===1,'going there lives the weeks in between (week '+X.weekOfSeason(c)+')');
ok(c.weeks-w0===10,'ten of them, each one a week of your plan and your bills');
ok(X.tourLocked(TT('reykjavik'),c)===null,'and you arrive in time to enter');

console.log('\n— B5 · some events are every other year —');
ok(X.seasonYear({season:1})===2026,'season one is 2026');
ok(X.heldThisSeason('olympiad',{season:1})&&X.heldThisSeason('candidates',{season:1})&&X.heldThisSeason('wcc',{season:1}),
  'the Olympiad, the Candidates and the title match are in 2026, as they are');
ok(!X.heldThisSeason('worldcup',{season:1})&&X.heldThisSeason('worldcup',{season:2})&&X.heldThisSeason('grandswiss',{season:2}),
  'the World Cup and the Grand Swiss in 2027');
ok(X.heldThisSeason('tatasteel',{season:1})&&X.heldThisSeason('tatasteel',{season:2}),'Tata Steel every year');
c=bc(2650,2,37);
ok(/next held season 3/.test(X.tourLocked(TT('olympiad'),c)||''),'no Olympiad in an odd year');
c=bc(2650,2,29);X.wcQualify(c,'test');
ok(X.tourLocked(TT('worldcup'),c)===null,'a World Cup in 2027…');
c.season=2;X.cycleQualify(c,'reaching the final of the World Cup');
c.season=3;c.weeks=2*52+13;
ok(X.tourLocked(TT('candidates'),c)===null,'…and its finalist in the Candidates of 2028');

console.log('\n— B3 · the world list at its real size —');
let prev=Infinity,mono=true;for(let r=1000;r<=2750;r+=10){const d=X.realDepth(r);if(d>prev)mono=false;prev=d;}
ok(mono,'the deeper you go the more players there are above you, never fewer');
c=bc(2480,1,0);
let wr=X.worldRank(c,'classical');
ok(wr>=800&&wr<=1100,'a 2480 is about 900th in the world (#'+wr+') — it was 62nd of a list of names');
c=bc(2200,1,0);wr=X.worldRank(c,'classical');
ok(wr>=7000&&wr<=11000,'a 2200 about 9,000th (#'+wr+')');
c=bc(2800,1,0);wr=X.worldRank(c,'classical');
ok(wr<=5,'while at the very top the list is the world (#'+wr+')');
const R=X.worldRanking(c,'classical');
let strict=true;for(let i=1;i<R.length;i++)if(R[i].rank<=R[i-1].rank)strict=false;
ok(strict,'every place on the list is its own');
c=bc(2480,1,0);
ok(X.careerLeaderboard(c).indexOf('#'+X.worldRank(c,'classical').toLocaleString())>=0&&X.worldRank(c,'classical')>500,'the ranking shows the real place');
c=bc(2700,1,0);
ok(/invite: top 10/.test(X.tourLocked(TT('norway'),c)||''),'a 2700 is not in the world top ten, so Norway Chess does not call');
ok(X.fedRank(bc(2450,1,0))>1&&X.olympiadSelected(bc(2450,1,0)).ok,'a 2450 Romanian is not first in Romania, and still makes the top five');
ok(!X.olympiadSelected(bc(2350,1,0)).ok,'a 2350 does not — the team is the country’s best five');

console.log('\n— B4 · titles people earned —');
let gm=0,im=0,none=0;for(let i=0;i<4000;i++){const t=X.titleFor(2460);if(t==='GM')gm++;else if(t==='IM')im++;}
ok(gm/4000>0.35&&gm/4000<0.55&&im/4000>0.4,'at 2460 nearly half are grandmasters and half IMs ('+Math.round(gm/40)+'% / '+Math.round(im/40)+'%) — it used to be all IMs');
let all=true;for(let i=0;i<500;i++)if(X.titleFor(2620)!=='GM')all=false;
ok(all,'at 2620, everyone is a grandmaster');
for(let i=0;i<2000;i++)if(X.titleFor(2150)==='')none++;
ok(none/2000>0.7,'at 2150 most have no title at all');
c=bc(2400,1,0);
const W=X.buildWorld();
ok(W.every(p=>X.wpTitle(p)===X.wpTitle(p)),'a player on the list keeps the same title from one look to the next');
const band=W.filter(p=>p.r>=2440&&p.r<2520).map(p=>X.wpTitle(p));
ok(band.indexOf('GM')>=0&&band.indexOf('IM')>=0,'between 2440 and 2520 the list has grandmasters and IMs side by side');
ok(X.titlePromote({id:'zz',title:'IM'},2545)==='GM','a 2545 IM has earned the grandmaster title');
ok(X.titlePromote({id:'zz',title:'GM'},2300)===null,'and a title is never taken away');
const hallT=[];
for(let i=0;i<12;i++){const cc=bc(2400,1,0);X.joinTournament('intl');cc.tour.hall.filter(p=>p.rating>=2420&&p.rating<2500).forEach(p=>hallT.push(p.title));}
ok(hallT.indexOf('GM')>=0&&hallT.indexOf('IM')>=0,'an open’s hall draws titles the same way: its 2420–2500s are grandmasters and IMs both');

console.log('\n— B8 · a field that lives —');
c=bc(2500,1,0);
const gk=X.buildWorld().find(p=>p.id==='gukesh');
ok(X.wpAge(gk)===20,'Gukesh is twenty when the career starts');
const n0=X.buildWorld().length;
c.season=2;const notes=X.worldSeason(c);
ok(X.wpAge(X.buildWorld().find(p=>p.id==='gukesh'))===21,'and a season later he is twenty-one');
const extra=c.wx.extra;
const nFeds=new Set(extra.filter(p=>!p.junior).map(p=>p.fed)).size;
ok(extra.filter(p=>p.junior).length===5&&extra.filter(p=>!p.junior).length===nFeds&&nFeds>=25,
  'five teenagers join the list each season, and a club player in every federation ('+nFeds+')');
const ro=extra.filter(p=>!p.junior&&p.fed==='ROU')[0];
ok(ro&&/^[A-Z]\.( [A-Z]\.)? [A-Z]/.test(ro.name)&&['Popescu','Ionescu','Popa','Dumitru','Stan','Stoica','Gheorghe','Rusu','Munteanu','Matei','Constantin','Serban','Lungu','Dinu','Nistor','Ene','Toma','Barbu','Moldovan','Neagu'].some(n=>ro.name.endsWith(n)),
  'with a name from their own country ('+(ro&&ro.name)+')');
ok(extra.filter(p=>p.junior).every(p=>p.age0>=14&&p.age0<=17&&X.wpStrength(p,'classical')>=2249&&X.wpStrength(p,'classical')<=2551),'the teenagers are fourteen to seventeen and play at 2250–2550');
ok(extra.filter(p=>p.junior).every(p=>Math.abs(X.wpRating(p,'classical')-(X.wpStrength(p,'classical')-40))<=1),'and their first rating trails that by forty — a prodigy is underrated');
ok(notes.some(n=>/New on the list/.test(n.t)),'and the best of them makes the news');
// ten seasons on
const carl0=X.worldRanking(c,'classical').find(p=>p.id==='carlsen').rating;
const jr0=extra.filter(p=>p.junior).map(p=>p.id);
let retired=0;
// ten seasons lived week by week — the list only moves when games are played
c.weeks=52;c.day=0;
const t10=Date.now();
for(let wk=0;wk<52*10;wk++)X.endOfWeek(c);
ok(c.season===12,'ten seasons of weeks later it is season twelve ('+((Date.now()-t10)/1000).toFixed(1)+' s for the whole world)');
retired=Object.keys(c.wx.retired).length;
ok(retired>=5,'over ten seasons players retire ('+retired+')');
const carl=X.buildWorld().find(p=>p.id==='carlsen');
ok(!carl||X.worldRanking(c,'classical').find(p=>p.id==='carlsen').rating<carl0,'Carlsen at 45 is past his best, or has retired');
const jrs=X.buildWorld().filter(p=>jr0.indexOf(p.id)>=0);
const jrAvg0=extra.filter(p=>jr0.indexOf(p.id)>=0).reduce((s,p)=>s+p.r0,0)/jr0.length;
const jrAvg=jrs.reduce((s,p)=>s+X.wpRating(p,'classical'),0)/Math.max(1,jrs.length);
ok(jrAvg>jrAvg0+100,'the teenagers of season two are over a hundred points better ten years on ('+Math.round(jrAvg0)+' → '+Math.round(jrAvg)+')');
ok(X.buildWorld().length<n0*1.25,'and the list stays about the size it was ('+n0+' → '+X.buildWorld().length+')');
// the rest of the world plays its title cycle
c=bc(2500,1,16);
X.worldEventsTick(c);
const champ=X.worldChampion(c);
ok(champ&&champ.name==='D. Gukesh','the World Champion when a career begins is Gukesh');
ok(c.wx.cands&&c.wx.cands.season===1&&c.wx.cands.name!==champ.name,'three weeks after the Candidates’ week it has been played without you — '+c.wx.cands.name+' won it');
ok(X.worldChallenger(c).name===c.wx.cands.name,'and is the challenger');
c.weeks=50;X.worldEventsTick(c);
ok(c.wx.wcc&&c.wx.wcc.result&&c.wx.wcc.result.chall===c.wx.cands.name,'the title match is played too');
const now=X.worldChampion(c).name;
ok(now===(c.wx.wcc.result.kept?'D. Gukesh':c.wx.cands.name),'and the champion afterwards is whoever won it ('+now+')');
let changes=0;for(let i=0;i<200;i++){const cc=bc(2500,1,16);X.worldEventsTick(cc);cc.weeks=50;X.worldEventsTick(cc);if(!cc.wx.wcc.result.kept)changes++;}
ok(changes>20&&changes<150,'sometimes the title changes hands, sometimes it does not ('+changes+' of 200)');
// a champion who does not turn up
c=bc(2800,3,0);X.cycleInit(c).champ=true;c.cycle.defended=1;c.honors=['World Champion'];c.weeks=2*52+50;
X.worldEventsTick(c);
ok(c.cycle.champ===false&&c.cycle.reigning,'a champion who does not defend the title in its year loses it — to '+(c.cycle.reigning&&c.cycle.reigning.name));
// the elite is the elite
c=bc(2760,1,2);
const tf=X.makeField(TT('tatasteel'));
ok(tf.length===13&&tf.every(p=>p.wid),'Wijk aan Zee is thirteen players off the world list, not thirteen made-up names');
c=bc(2760,1,13);
const cf=X.makeField(TT('candidates'));
const top7=X.worldRanking(c,'classical').filter(p=>!p.you&&p.name!=='D. Gukesh').slice(0,7).map(p=>p.name).sort().join();
ok(cf.length===7&&cf.map(p=>p.name).sort().join()===top7,'the Candidates is the seven best in the world who are not the champion (and you)');
ok(cf.every(p=>p.name!=='D. Gukesh'),'the champion is not in it');

console.log('\n— B2 · ties are broken on the games —');
// a small Swiss: A and B both on 2/3, A met stronger opposition
function sw(){
  return {standings:[{id:'A',name:'A',rating:2300,score:2},{id:'B',name:'B',rating:2400,score:2},
    {id:'C',name:'C',rating:2350,score:3},{id:'D',name:'D',rating:2200,score:1},{id:'E',name:'E',rating:2250,score:1},{id:'F',name:'F',rating:2250,score:0}],
    pairs:[{r:1,a:'A',b:'D',s:1},{r:1,a:'B',b:'F',s:1},{r:1,a:'C',b:'E',s:1},
           {r:2,a:'A',b:'C',s:0},{r:2,a:'B',b:'D',s:1},{r:2,a:'E',b:'F',s:1},
           {r:3,a:'A',b:'E',s:1},{r:3,a:'B',b:'C',s:0},{r:3,a:'D',b:'F',s:1}]};
}
let t=sw(),T=X.tbData(t);
ok(T.A.bh===5&&T.B.bh===4,'Buchholz: A played 1+3+1 = 5, B played 0+1+3 = 4');
ok(T.A.bh1===4&&T.B.bh1===4,'and with the weakest cut, four each');
let order=X.standingsSorted(t).map(p=>p.id).join('');
ok(order.indexOf('A')<order.indexOf('B'),'so A finishes above B, though B is rated a hundred more ('+order+')');
t.sched=[[]];T=X.tbData(t);
ok(Math.abs(T.A.sb-(1+1))<1e-9&&Math.abs(T.B.sb-(0+1))<1e-9,'in a round-robin it is Sonneborn-Berger: A beat D and E (1+1), B beat F and D (0+1)');
// the playoff
c=bc(2760,1,13);
const tr={id:'candidates',standings:[{id:'__you',name:'Ada Marín',rating:2760,score:9,you:true},{id:'p1',name:'Rival One',rating:2770,score:9},{id:'p2',name:'Three',rating:2750,score:7}],pairs:[]};
const rg=(c.ratedRapid||0)+(c.ratedBlitz||0);
const po=X.playoffFirst(c,tr);
ok(po&&po.you&&po.opp==='Rival One','level for first in the Candidates: a playoff against the other leader');
ok(X.standingsSorted(tr)[0].id===(po.won?'__you':'p1'),'and its winner is first');
ok(['rapid','blitz','armageddon'].indexOf(po.stage)>=0,'decided in rapid, then blitz, then armageddon ('+po.stage+')');
ok((c.ratedRapid||0)+(c.ratedBlitz||0)>rg,'and the playoff games are rated, as they are ('+((c.ratedRapid||0)+(c.ratedBlitz||0)-rg)+' rated games)');
ok(X.PLAYOFF_EVENTS.tatasteel==='blitz','Wijk aan Zee plays its playoff in blitz');
ok(X.playoffFirst(c,{id:'intl',standings:tr.standings,pairs:[]})===null,'an open does not play one');
ok(/Level for first with Rival One/.test(X.careerFinishBanner({name:'x',score:9,rounds:14,playoff:po})),'the finish says what happened');
t=sw();t.standings.forEach(p=>{if(p.id==='A')p.you=true;});
const tn=X.tieNote(t);
ok(tn&&tn.n===2&&/Buchholz/.test(tn.method),'level on points in an open, the banner names the tiebreak');
ok(/ties broken on Buchholz/.test(X.careerStandings(t)),'and so does the standings table');

console.log('\n— B6 · the professional leagues —');
c=bc(2250,1,0);
ok(X.proOffers(c).length===0,'a 2250 is not offered a professional contract');
c=bc(2470,1,0);
const offers=X.proOffers(c);
ok(offers.length===3&&offers.every(o=>o.league!=='ccl'),'a 2470 has offers from the 4NCL, the Top 12 and the Bundesliga — not yet from China');
ok(X.proFee(2700,X.PRO_LEAGUES[2])>X.proFee(2500,X.PRO_LEAGUES[2])*4,'a 2700 is worth more than four times a 2500 a game ('+X.proFee(2500,X.PRO_LEAGUES[2])+' → '+X.proFee(2700,X.PRO_LEAGUES[2])+')');
X.proSign('bundesliga');
const P=c.pro,G=X.proLeagueOf(c);
ok(P&&G&&G.fixtures.length===7&&G.clubs.length===8,'a contract: eight clubs, seven weekends');
const pb=X.proBoard(c);
ok(pb>=1&&pb<=8,'on the board your rating puts you on (board '+pb+')');
ok(G.clubs.every(cl=>cl.roster.length>=8&&cl.roster.every(id=>X.buildWorld().some(w=>w.id===id))),'and every club’s roster is people off the world list');
ok(!X.proDue(c),'nothing to play before the first weekend');
c.weeks=X.PRO_WEEKS[0];
ok(X.proDue(c),'in week '+X.PRO_WEEKS[0]+' the first match is on');
const m0=c.money,r0=c.rating,wk0=c.weeks;
X.careerProSim();
ok(c.money===m0+P.fee&&P.played===1,'play it and you are paid the fee ('+P.fee+')');
ok(c.played===1&&typeof X.app.careerDelta==='number','the game counts, and is rated ('+(X.app.careerDelta>=0?'+':'')+X.app.careerDelta+')');
ok((c.news||[]).some(n=>/on board/.test(n.t)),'and the result is in the news');
c.weeks=X.PRO_WEEKS[1];X.proTick(c);
ok(G.round===2&&P.missed===1,'a weekend you were not there, a reserve played — and you were not paid');
while(G.round<7){c.weeks=X.PRO_WEEKS[G.round];X.careerProSim();}
ok(P.done&&P.place>=1,'seven weekends and the season is over ('+Math.round(P.place)+'th)');
c.season=2;c.weeks=52;X.proRenew(c);
ok(c.pro&&c.pro.season===2&&X.proLeagueOf(c).round===0&&c.pro.history.length===1,'at the turn of the year the club renews your contract');
c.rating=2300;c.season=3;X.proRenew(c);
ok(!c.pro,'and lets you go when your rating has fallen out of the league');
c=bc(2470,1,0);X.proSign('4ncl');
X.careerWaitUntil(15);
ok(X.weekOfSeason(c)===X.PRO_WEEKS[0]&&X.proDue(c)&&/play this weekend/.test(X.app.careerToast),'going to a later week stops at a league weekend on the way');
X.careerProSim();X.careerWaitUntil(15);
ok(X.weekOfSeason(c)===X.PRO_WEEKS[1],'and again at the next one');
ok(/✍️/.test(X.careerProPanel(c))&&/a game/.test(X.careerProPanel(c)),'the panel shows the contract');

console.log('\n— B7 · the title match as an event —');
c=bc(2780,1,47);X.cycleInit(c).chall=1;
X.joinTournament('wcc');
let tr7=c.tour;
ok(tr7&&tr7.wm&&!tr7.wm.teamSet,'a title match begins with the team');
ok(/Your team of seconds/.test(X.wmPanel(c,tr7)),'you pick your seconds before game one');
const mm=c.money;X.wmHire('opening');X.wmHire('engine');
ok(c.money===mm-100000&&X.wmTeamElo(tr7)===13,'an opening specialist and a computer second: 💰100,000, and thirteen points of rating in every game');
ok(/Leak risk 6%/.test(X.wmPanel(c,tr7)),'and two more people who know your preparation');
X.wmStart();
ok(tr7.wm.teamSet&&!/Your team of seconds/.test(X.wmPanel(c,tr7)),'then the match starts');
const e1=X.wmBeforeGame(c,tr7),e2=X.wmBeforeGame(c,tr7);
ok(e1===e2,'what the team is worth in a game is settled once for that game');
let sum=0;for(let i=0;i<3000;i++){tr7.wm.prepFor=-1;tr7.wm.next=0;sum+=X.wmBeforeGame(c,tr7);}
ok(sum/3000>11&&sum/3000<14,'on average worth a little under its thirteen points, because preparation leaks ('+(sum/3000).toFixed(1)+')');
tr7.wm.prepFor=-1;tr7.wm.next=0;
// game one won, game two lost
X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;X.app.careerRoundOpp=tr7.field[0];X.app.playMoves=[];
X.careerResult(1);
ok(tr7.wm.story[0].head==='You strike first','game one won: you strike first');
ok(tr7.wm.press&&!tr7.wm.rest,'a press conference after every game');
X.wmPress('gracious');
ok(!tr7.wm.press,'answered');
X.app.careerScored=false;X.app.careerRoundOpp=tr7.field[1];X.careerResult(0);
ok(/levels the match/.test(tr7.wm.story[1].head),'game two lost: '+tr7.wm.story[1].head);
ok(tr7.wm.rest&&tr7.wm.press,'and after two games, a rest day');
const en=c.energy;X.wmRest('prep');
ok(tr7.wm.next===10&&c.energy<=en,'spend it preparing and the next game is worth ten more points, at a cost in energy');
ok(/The match so far/.test(X.wmPanel(c,tr7)),'the story of the match is kept game by game');
// the champion's point of view
const strip=X.matchScoreStrip({id:'wcc',emoji:'👑',name:'World Championship Match',defence:true,rounds:14,round:8,results:Array.from({length:8},()=>({score:0})),field:[{name:'A. Firouzja'}]});
ok(/takes your title/.test(strip),'and when the champion is you, losing it is losing your title — not “the champion retains”');
}
{ // C
function cc(r,fed,season,week){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed=fed||'ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=24;c.titles=r>=2500?['GM']:r>=2400?['IM']:[];
  c.season=season||1;c.weeks=((season||1)-1)*52+(week||0);c.day=0;c.money=500000;return c;
}
const TT=id=>X.TOURNAMENTS.find(t=>t.id===id);
console.log('\n— C1 · the world has people in it —');
let c=cc(2300);
const W=X.buildWorld(),feds=X.worldFeds();
ok(W.length>1800,'the world list is '+W.length+' players, not two hundred');
ok(feds.every(F=>W.filter(p=>p.fed===F.c&&!p.club).length>=X.POOL_TOP&&W.filter(p=>p.fed===F.c&&p.club).length>=X.POOL_CLUB),
  'every federation has its own players, from its best down to its club players');
ok(new Set(W.map(p=>p.name)).size===W.length,'and nobody on it shares a name with anybody else');
const ger=W.filter(p=>p.fed==='GER'&&!p.real).slice(0,30);
ok(ger.every(p=>X.NAME_BANKS.GER[1].some(l=>p.name.endsWith(l))),'a German is called something German ('+ger[0].name+', '+ger[1].name+')');
const chn=W.filter(p=>/^[gk]CHN/.test(p.id)&&/^[A-Z][a-z]+ [A-Z][a-z]+/.test(p.name));
ok(chn.length>=30,'and a Chinese player has the family name first ('+chn[0].name+')');
// the hundred and fifty the list always had are named like everybody else now
const nat=p=>{const B=X.NAME_BANKS[p.fed];if(!B)return false;
  return X.NAME_FAMILY_FIRST[p.fed]?B[0].some(f=>p.name.indexOf(f+' ')===0):B[1].some(l=>p.name.endsWith(' '+l));};
const F150=W.filter(p=>/^f\d+$/.test(p.id));
ok(F150.length>=140&&F150.every(nat),'the '+F150.length+' players the list always had carry names from their own federations ('+F150.slice(0,3).map(p=>p.name+' '+p.fed).join(', ')+')');
ok(JSON.stringify(X.baseWorld().map(p=>p.name))===JSON.stringify(X.baseWorld().map(p=>p.name)),'the same world every time it loads');
// nobody's rating moves by itself any more
const kp=W.find(p=>p.club),kr0=X.wpRating(kp,'classical');
X.worldTick();X.worldTick();X.worldTick();
ok(X.wpRating(kp,'classical')===kr0&&!X.wrOf(kp),'nobody’s rating moves unless they play — the old drift is gone');

console.log('\n— C2 · the halls are people off the list —');
c=cc(2300);X.joinTournament('intl');
let H=c.tour.hall;
ok(H.every(p=>p.wid&&W.some(w=>w.id===p.wid&&w.name===p.name)),'every player in an International Open’s hall is somebody on the world list');
ok(new Set(H.map(p=>p.fed)).size>=6,'from all over — '+new Set(H.map(p=>p.fed)).size+' federations');
// one hall of nineteen wanders by about eighty points either way, so fifteen of them
let avgSum=0;for(let i=0;i<15;i++){const k=cc(2300);X.joinTournament('intl');avgSum+=k.tour.hall.reduce((a,p)=>a+p.rating,0)/k.tour.hall.length;}
ok(Math.abs(avgSum/15-TT('intl').avg)<TT('intl').avg*0.03,'and the halls still average what the event says, as the invented ones did ('+Math.round(avgSum/15)+' for '+TT('intl').avg+')');
c=cc(2300);
// the same people come round again
let seen={},again=0;
for(let i=0;i<12;i++){const k=cc(2300);X.joinTournament('intl');k.tour.hall.forEach(p=>{if(seen[p.wid])again++;seen[p.wid]=1;});}
ok(again>=8,'a dozen opens in, the same people have come round again ('+again+' times)');
// local events are mostly your compatriots
c=cc(1500);X.joinTournament('cityopen');
let loc=c.tour.hall.filter(p=>p.fed==='ROU').length/c.tour.hall.length;
ok(loc>=0.6,'a city open for a Romanian is mostly Romanians ('+Math.round(loc*100)+'%)');
c=cc(1400,'IND');X.joinTournament('club');
loc=c.tour.hall.filter(p=>p.fed==='IND').length/c.tour.hall.length;
ok(loc>=0.6,'and the club championship for an Indian player is Indians ('+Math.round(loc*100)+'%)');
// the national championship is only them, and all of them named
c=cc(2350,'ROU',1,18);X.joinTournament('natch');
H=c.tour.hall;
ok(H.length>=15&&H.every(p=>p.fed==='ROU'&&p.wid),'the Romanian championship is Romanians off the list, every one ('+H.length+')');
ok(H.some(p=>p.rating>=2450),'with the country’s strong players in it');
c=cc(2300,'VIE',1,18);X.joinTournament('natch');
ok(c.tour.hall.every(p=>p.fed==='VIE'),'and Vietnam’s is Vietnamese');
// norm round-robins: invited people, and the norm is still on offer
c=cc(2350);X.joinTournament('imrr');
const P5=c.tour.players;
ok(P5.every(p=>p.wid),'an IM-norm round-robin invites people off the list');
const bar=X.NORM_BARS.find(b=>b.kind==='IM');
ok(X.normCheck(c,bar,P5,null,{}).opposition,'and the organiser still invites a field that can give the norm');
// the World Cup's lower half
c=cc(2650,'ROU',2,29);X.wcQualify(c,'test');X.joinTournament('worldcup');
const KS=c.tour.ko.slots;
ok(KS.filter(p=>!p.you).every(p=>W.some(w=>w.id===p.id)),'all 127 of your World Cup rivals are on the world list — qualifiers too');
const qf=new Set(KS.filter(p=>p.qualifier).map(p=>p.fed)).size;
ok(qf>=20,'and the qualifiers come from '+qf+' countries, the way national champions do');

console.log('\n— C3 · the Olympiad team is your country’s team —');
c=cc(2610,'USA',1,37);
ok(/be top 5 for USA/.test(X.tourLocked(TT('olympiad'),c)||''),'a 2610 American is not in the USA’s top five, so is not picked');
c=cc(2742,'USA',1,37);X.joinTournament('olympiad');
const O=c.tour.oly;
const team=X.olyMyTeam(c,O).filter(p=>!p.you);
const us=X.fedPlayers(c,'USA').filter(p=>!p.you).slice(0,3).map(p=>p.name);
ok(team.map(p=>p.name).join()===us.join(),'the USA’s team-mates are the USA’s three best: '+us.join(', '));
ok(O.myBoard===4,'and a 2742, fifth in the country, plays board four behind them');
const nats=O.nations.filter(n=>!n.you);
ok(nats.every(n=>n.squad.every(p=>p.wid)),'every other nation’s squad is named players off the list');
ok(nats.every(n=>n.squad[0].name===X.fedPlayers(c,n.c).filter(p=>!p.you)[0].name),'and each board one is that country’s best player');
let ind=nats.find(n=>n.c==='IND');
for(let i=0;i<40&&!ind;i++){const t2={id:'olympiad',rounds:9,round:0,results:[],field:[]};ind=X.olyInit(c,t2).nations.find(n=>n.c==='IND');}
ok(ind&&ind.squad.every(p=>p.real),'when India is there, India fields '+(ind?ind.squad.map(p=>p.name).join(', '):'—'));
ok(c.tour.field.every(o=>o.wid),'so everybody you play is somebody you can look up');
// selection by place in your country
c=cc(2440,'ROU');
const fr=X.fedRank(c);
ok(fr===X.fedPlayers(c,'ROU').findIndex(p=>p.you)+1,'your place in Romania is your place among Romanians on the list (#'+fr+')');
ok(X.olympiadSelected(c).ok===(fr<=5),'and the team is its top five');
}
{ // D
function dc(r,fed,season,week){
  X.store.career=X.freshCareer();const c=X.store.career;X.lifeInit(c);c.setup=true;c.name='Ada Marín';c.fed=fed||'ROU';c.flag='🇷🇴';
  c.provisional=false;c.rating=r;c.peak=r;c.ratingRapid=r;c.ratingBlitz=r;c.ratedGames=500;c.age=24;c.titles=r>=2500?['GM']:r>=2400?['IM']:[];
  c.season=season||1;c.weeks=((season||1)-1)*52+(week||0);c.day=0;c.money=5e6;return c;
}
const wp=id=>X.buildWorld().find(p=>p.id===id);
const R0=(p,f)=>X.wrOf(p)?X.wrOf(p)[{classical:0,rapid:1,blitz:2}[f||'classical']]:X.wpRating(p,f||'classical');
console.log('\n— D1 · a rating moves only by games —');
let c=dc(2400);
let A=wp('gIND10'),B=wp('gGER10');
const rA=R0(A),rB=R0(B),kA=X.wpK(A,[rA],'classical'),kB=X.wpK(B,[rB],'classical');
const sAB=X.worldGame(c,A,B,'classical',{aWhite:true});
const EA=1/(1+Math.pow(10,(rB-rA)/400));
ok([0,0.5,1].indexOf(sAB)>=0,'two players off the list play a game ('+A.name+' '+sAB+'–'+(1-sAB)+' '+B.name+')');
ok(Math.abs((R0(A)-rA)-kA*(sAB-EA))<0.11,'the winner’s — or loser’s — rating moves by exactly FIDE’s formula: K × (score − expected)');
ok(Math.abs((R0(B)-rB)-kB*((1-sAB)-(1-EA)))<0.11,'and so does the other player’s');
ok(X.wrOf(A)[3]===1&&X.wrOf(A)[4]===sAB,'and the game is counted in their season');
const untouched=wp('gFRA20'),ru=X.wpRating(untouched,'classical');
X.worldGame(c,A,B,'classical',{aWhite:false});
ok(X.wpRating(untouched,'classical')===ru,'somebody who did not play has not moved');
// the result comes from strength, the rating from ratings: an underrated junior
let jw=0,jn=3000;const J=wp('gIND30'),O=wp('gIND31');
c.wx.base[J.id]=[X.wpRating(J,'classical')+200,J.rr+200,J.rb+200];c.wx.v++;
const J2=wp('gIND30');
for(let i=0;i<jn;i++){c.wr[J2.id]=null;delete c.wr[J2.id];delete c.wr[O.id];jw+=X.worldGame(c,J2,wp('gIND31'),'classical',{aWhite:i%2===0,unrated:true});}
ok(jw/jn>0.7,'a player two hundred points better than their rating scores like it ('+Math.round(jw/jn*100)+'% against somebody rated alike)');

console.log('\n— D2 · every result around you counts —');
c=dc(2300);X.joinTournament('intl');
let tr=c.tour;
const hb={},hg={};tr.hall.forEach(h=>{hb[h.wid]=R0(wp(h.wid));hg[h.wid]=(X.wrOf(wp(h.wid))||[])[3]||0;});
X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;X.app.careerRoundOpp=tr.field[0];X.app.playMoves=[];
const opp0=tr.field[0],oppB=R0(wp(opp0.wid));
X.careerResult(1);
const games1=tr.pairs.filter(g=>g.r===1&&g.a!=='__you'&&g.b);
const std=id=>tr.standings.find(p=>p.id===id);
// counted by the rating record's games, since a draw between two players on
// the same rating is a rated game that moves neither of them
let moved=0,counted=0;games1.forEach(g=>{[g.a,g.b].forEach(id=>{const w=std(id).wid;
  if(Math.abs(R0(wp(w))-hb[w])>0.05)moved++;if(((X.wrOf(wp(w))||[])[3]||0)===hg[w]+1)counted++;});});
ok(games1.length>=8&&counted===games1.length*2,'the '+games1.length+' boards beside yours were rated games: all '+counted+' players have one more rated game ('+moved+' ratings moved)');
ok(R0(wp(opp0.wid))<oppB,'and beating '+opp0.name+' cost them rating ('+Math.round(oppB)+' → '+Math.round(R0(wp(opp0.wid)))+')');
// a challenge off the list
c=dc(2500);const Ch=wp('gUSA5'),cr0=R0(Ch);
X.app.careerOpp='oneoff';X.app.careerScored=false;X.app.careerTour=false;X.app.careerOneoff='classical';X.app.careerLeague=false;X.app.careerPro=false;
X.app.careerRoundOpp={name:Ch.name,rating:X.wpRating(Ch,'classical'),id:Ch.id};X.app.playMoves=[];
X.careerResult(0);
ok(R0(Ch)>cr0,'a challenge game counts for the person you challenged: '+Ch.name+' beat you and gained');
// the Olympiad's other boards
c=dc(2742,'USA',1,37);X.joinTournament('olympiad');
tr=c.tour;const nat=tr.oly.nations.filter(n=>!n.you);
X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerOneoff=null;X.app.careerRoundOpp=tr.field[0];X.careerResult(0.5);
const playedSq=nat.reduce((a,n)=>a+n.squad.filter(p=>X.wrOf(wp(p.wid))&&X.wrOf(wp(p.wid))[3]>0).length,0);
ok(playedSq>=nat.length*X.OLY_BOARDS-X.OLY_BOARDS,'after one round of the Olympiad the other nations’ players have rated games ('+playedSq+')');
// the knockout's other matches
c=dc(2700,'ROU',2,29);X.wcQualify(c,'x');X.joinTournament('worldcup');
tr=c.tour;const ko0=tr.ko.slots.filter(p=>!p.you).slice(0,20).map(p=>p.id);
X.app.careerOpp='tour';X.app.careerScored=false;X.app.careerTour=true;X.app.careerRoundOpp=tr.field[0];X.careerResult(1);
X.app.careerScored=false;X.app.careerRoundOpp=tr.field[1];X.careerResult(1);
ok(ko0.filter(id=>X.wrOf(wp(id))&&X.wrOf(wp(id))[3]>=2).length>=16,'round one of the World Cup is rated for everybody in it, not just you');
// a game you watch
c=dc(2400);const S1={w:{id:'carlsen',name:'M. Carlsen'},b:{id:'caruana',name:'F. Caruana'},result:'x'};
const cw0=R0(wp('carlsen')),cb0=R0(wp('caruana'));
X.specRate(S1,1);
ok(R0(wp('carlsen'))>cw0&&R0(wp('caruana'))<cb0&&S1.rated,'a game you watched is rated too: '+S1.result);

console.log('\n— D3 · the world plays its season without you —');
c=dc(2300,'ROU',1,0);
const Wn=X.buildWorld(),avg0=Wn.reduce((a,p)=>a+X.wpRating(p,'classical'),0)/Wn.length;
const v0=c.wrv||0,t0=Date.now(),my0=c.rating;
for(let wk=0;wk<51;wk++)X.endOfWeek(c);
const dt=Date.now()-t0,rated=(c.wrv||0)-v0;
ok(rated>40000,'in a season you did not play in, the world played '+Math.round(rated/2).toLocaleString()+' rated games ('+(dt/1000).toFixed(1)+' s)');
ok(c.rating===my0,'and your own rating did not move — you were not in any of them');
const res=c.wx.results.map(r=>r.id);
['tatasteel','norway','reykjavik','gibraltar','olympiad','natch','superbet','worldrapid'].forEach(id=>ok(res.indexOf(id)>=0,'the '+(X.TOURNAMENTS.find(t=>t.id===id)||{name:id}).name+' was played: '+((c.wx.results.find(r=>r.id===id)||{}).winner||{name:'—'}).name));
ok(Object.keys(c.wx.natChamps||{}).length>=25,'every federation crowned a champion ('+Object.keys(c.wx.natChamps||{}).length+'; Romania’s is '+((c.wx.natChamps||{}).ROU||{}).name+')');
ok(c.wx.cands&&c.wx.cands.season===1&&c.wx.wcc&&c.wx.wcc.result,'the Candidates and the title match were played: '+c.wx.cands.name+' challenged, and '+(c.wx.wcc.result.kept?c.wx.wcc.result.champ+' kept the title':c.wx.wcc.result.chall+' took it'));
const Lg=X.proLeagues(c);
ok(Object.keys(Lg).every(k=>Lg[k].done&&Lg[k].champ),'all four leagues played their seven weekends and crowned a champion: '+Object.keys(Lg).map(k=>Lg[k].champ).join(', '));
const busyPlayers=Wn.filter(p=>X.wrOf(p)&&X.wrOf(p)[3]>=10).length;
ok(busyPlayers>Wn.length*0.5,'more than half the list played ten classical games or more ('+busyPlayers+')');
const avg1=Wn.reduce((a,p)=>a+X.wpRating(p,'classical'),0)/Wn.length;
ok(Math.abs(avg1-avg0)<20,'and the list as a whole neither inflates nor deflates ('+avg0.toFixed(0)+' → '+avg1.toFixed(0)+')');
X.endOfWeek(c);
ok(c.season===2,'the season turns');
for(let wk=0;wk<51;wk++)X.endOfWeek(c);
// juniors catch up through results: season two's intake, at the end of their first season
const juniors=c.wx.extra.filter(p=>p.junior&&p.born===2);
const gap=juniors.reduce((a,p)=>a+(X.wpStrength(p,'classical')-X.wpRating(p,'classical')),0)/Math.max(1,juniors.length);
const jg=juniors.reduce((a,p)=>a+((X.wrOf(p)||[])[3]||0),0)/Math.max(1,juniors.length);
ok(juniors.length===5&&jg>=25&&gap<100,'a season’s juniors play a season of rated games — '+jg.toFixed(0)+' each (their gap from forty is '+gap.toFixed(0)+' now; five are too few to measure it by, so it is measured below)');
{ // sixty players forty points underrated, sixty rated games each against people whose rating is their strength
  const so=c.wx.soff?c.wx.soff[0]:0;
  const band=X.buildWorld().filter(p=>!p.club&&!p.real&&p.born==null&&X.wpRating(p,'classical')>=2050&&X.wpRating(p,'classical')<=2350);
  const U=band.slice(0,60),Op=band.slice(60,120);
  U.forEach(p=>{c.wx.base[p.id]=[X.wpRating(p,'classical')+40-so,p.rr,p.rb];});
  Op.forEach(p=>{c.wx.base[p.id]=[X.wpRating(p,'classical')-so,p.rr,p.rb];});
  c.wx.v++;
  const I=X.worldIndex().id,U2=U.map(p=>I[p.id]),O2=Op.map(p=>I[p.id]);
  const gapOf=()=>U2.reduce((a,p)=>a+X.wpStrength(p,'classical')-X.wpRating(p,'classical'),0)/U2.length;
  const g0=gapOf();
  for(let k=0;k<60;k++)U2.forEach((p,i)=>{const o=O2[(i+k)%O2.length],keep=c.wr[o.id]?c.wr[o.id].slice():null;
    X.worldGame(c,p,o,'classical',{aWhite:k%2===0});if(keep)c.wr[o.id]=keep;else delete c.wr[o.id];});   // the opposition stays as it was
  const g1=gapOf();
  ok(U2.length===60&&O2.length===60&&g0>=35&&g1<g0/2,'sixty players forty points better than their ratings, sixty rated games each: the gap is '+g1.toFixed(0)+' now (it was '+g0.toFixed(0)+') — results close it');
}
X.endOfWeek(c);
const q=(c.wx.qual&&c.wx.qual.season===2)?c.wx.qual.ids:[];
// four places, fewer names when somebody earns two of them
ok(q.length>=3&&q.length<=4,'in 2027 the World Cup and the Grand Swiss sent '+q.length+' players to the Candidates');
const cf=X.candidatesField(c,8,{}).map(p=>p.id);
ok(q.every(id=>cf.indexOf(id)>=0||!wp(id)||X.worldChampion(c).name===wp(id).name),'and the Candidates of 2028 has them in it, before the rating places');

console.log('\n— D4 · your games move the world —');
c=dc(2550);X.proSign('bundesliga');c.weeks=X.PRO_WEEKS[0];
const pm=X.proMyMatch(c),po0=R0(wp(pm.opp.wid));
const rng=Math.random;Math.random=()=>0.001;X.careerProSim();Math.random=rng;
ok(R0(wp(pm.opp.wid))<po0,'win your Bundesliga board and '+pm.opp.name+' loses rating for it');
const G=X.proLeagueOf(c);
ok(G.round===1&&G.last.results.length===4,'and the whole round of the league was played with you in it');
}
console.log('\n✅ realism: '+pass+' checks passed');
process.exit(0);
