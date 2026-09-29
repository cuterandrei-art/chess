/* Another era: a career begun in 1972, 1985 or 2000 — the world of the time,
   its champion and its title match, the calendar and the rules of the day as
   the years go by, and adjourned games. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,wxInit,TOURNAMENTS,EVENT_WEEK,ERAS,eraAfterSetup,seasonYear,heldThisSeason,tourVisible,worldRanking,womenRanking,worldChampion,wChampion,worldChallenger,'+
  'checkTitles,publishRating,prizeFirst,eraPrize,streamPanel,oppPrepFor,COACH_TYPES,careerTeamPanel,hireCoach2,buildWorld,eraSyncNames,careerSetupView,titleExists,ratingFloor,'+
  'careerToursPanel,proLeagues,adjournAfterEngine,adjournAfterYourMove,adjournRail,adjournAnalyse,adjournResume,adjournEdge,playMove,playSnapshot,viewAnalysis,worldIndex,careerMeta,wpTitle,gameDate};')();
const T=id=>X.TOURNAMENTS.find(t=>t.id===id);
function career(era,o){
  const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:300,
    ratingRapid:2450,ratingBlitz:2450,age:24,money:50000,titles:['IM'],season:1,weeks:5},o||{});
  X.store.career=c;X.lifeInit(c);X.eraAfterSetup(c,era);return c;
}
const vis=(id,c)=>X.tourVisible(T(id),c);

console.log('\n— today, as before —');
let c=career('now');
ok(!c.era&&X.seasonYear(c)===2026&&X.worldChampion(c).name==='D. Gukesh','a career today: 2026, Gukesh is champion');
ok(vis('titledtues',c)&&vis('fsweiss',c)&&vis('worldcup',c)&&T('grandswiss').name==='FIDE Grand Swiss','and today’s calendar: online arenas, the Freestyle tour, the World Cup, the Grand Swiss');

console.log('\n— 1972 —');
c=career('1972');
const R=X.worldRanking(c,'classical').filter(p=>!p.you);
ok(c.era==='1972'&&X.seasonYear(c)===1972&&R[0].name==='R. Fischer'&&R[0].rating===2785,'1972: Fischer tops the list on 2785');
ok(R.slice(0,12).some(p=>p.name==='A. Karpov')&&R.slice(0,12).some(p=>p.name==='V. Korchnoi'),'with Karpov and Korchnoi near the top');
const fict=R.filter(p=>!p.real)[0];
ok(fict&&fict.rating<2600,'the rest of the list pulled down to the ratings of the day (the best of them '+fict.rating+')');
ok(!R.some(p=>p.name==='M. Carlsen'||p.name==='D. Gukesh'),'and nobody from today on it');
ok(X.worldChampion(c).name==='B. Spassky','Spassky is World Champion');
ok(X.worldChallenger(c).name==='R. Fischer'&&X.heldThisSeason('wcc',c),'and Fischer is the challenger — the match is this year');
ok(/It is 1972/.test(c.news.map(n=>n.t).join('|')),'the news says so: '+c.news[0].t.slice(0,80)+'…');
ok(X.wChampion(c).name==='N. Gaprindashvili','Gaprindashvili is Women’s World Champion');
ok(!vis('rapidopen',c)&&!vis('worldrapid',c)&&!vis('titledtues',c)&&!vis('fsweiss',c)&&!vis('ewc',c)&&!vis('norway',c)&&!vis('worldcup',c),
  'no rapid chess, no online arenas, no Freestyle tour, no Norway Chess, no World Cup');
X.buildWorld();
ok(T('continental').name==='Zonal Tournament'&&T('tatasteel').name==='Hoogovens Tournament'&&T('grandswiss').name==='Interzonal Tournament','a Zonal, the Hoogovens, the Interzonal');
ok(!X.heldThisSeason('grandswiss',c)&&X.heldThisSeason('grandswiss',{season:2}),'the Interzonal is next year, 1973');
ok(vis('hastings',c)&&vis('reykjavik',c)&&vis('olympiad',c),'Hastings, Reykjavik and the Olympiad are there');
const L72=X.proLeagues(c);
ok(X.careerToursPanel(c)===''&&!L72['4ncl']&&!L72.ccl&&!L72.top12&&!L72.bundesliga,'no tours, and no professional club leagues yet — the Bundesliga starts in 1980');
// the rules of the time
ok(!X.titleExists('FM',c)&&!X.titleExists('CM',c)&&!X.titleExists('WGM',c)&&X.titleExists('IM',c),'no FIDE Master, Candidate Master or WGM title yet');
const low=career('1972',{titles:[],peak:2350,rating:2350});
ok(X.checkTitles(low).length===0&&!low.titles.includes('FM'),'2350 in 1972 is no FM title — there is none');
ok(X.ratingFloor(c)===2200,'the list’s floor is 2200');
const u=career('1972',{provisional:true,rating:null,peak:null,ratedGames:6,provScore:4.5,provOppSum:6*2050});
ok(!X.publishRating(u),'an unrated player performing around 2100 stays unrated');
u.provScore=5.5;u.provOppSum=6*2250;
ok(X.publishRating(u)&&u.rating>2200,'one performing at '+u.rating+' gets a first rating — and not capped at 2200 as today');
ok(X.prizeFirst(T('hastings'))===Math.round(4000*0.35),'prizes of the time: Hastings pays '+X.prizeFirst(T('hastings'))+' to the winner');
c.coaches=[];X.store.settings.fold={team:true};
ok(/Opening theoretician/.test(X.careerTeamPanel(c))&&!/Engine analyst/.test(X.careerTeamPanel(c)),'seconds to hire, but no engine analyst');
X.hireCoach2('Engine analyst');
ok(!(c.coaches||[]).some(x=>x.spec==='Engine analyst'),'and no way to hire one');
X.app.careerOpp={name:'x'};X.app.playFen='start';
ok(X.streamPanel()==='','no streaming');
X.app.careerOpp=null;X.app.playFen=null;
ok(X.wpTitle({id:'zz',r:2380,r0:2380})!=='FM'&&X.wpTitle({id:'zz',r:2380,r0:2380})!=='CM','the players on the list hold the titles of the time');
ok(/1972/.test(X.gameDate(c,1,10)),'dates are in 1972: '+X.gameDate(c,1,10));

console.log('\n— the years go by —');
X.store.career=c;
const at=y=>{c.season=y-1971;X.eraSyncNames();X.buildWorld();};
at(1987);ok(vis('rapidopen',c)&&!vis('worldrapid',c),'1987: rapid opens');
at(1988);ok(vis('worldrapid',c),'1988: a World Rapid');
at(1997);X.buildWorld();ok(vis('worldcup',c)&&T('worldcup').name==='FIDE World Championship (knockout)','1997: FIDE’s knockout world championship');
at(1999);ok(T('tatasteel').name==='Corus Chess'&&T('continental').name==='Zonal Tournament','1999: Corus Chess');
at(2002);ok(X.titleExists('CM',c)&&T('continental').name==='Continental Championship','2002: the Candidate Master title, and continental championships');
at(2005);ok(T('worldcup').name==='FIDE World Cup','2005: the World Cup');
at(2011);ok(T('tatasteel').name==='Tata Steel Masters','2011: Tata Steel');
at(2014);ok(vis('titledtues',c),'2014: online arenas');
at(2019);ok(T('grandswiss').name==='FIDE Grand Swiss'&&vis('superbet',c),'2019: the Grand Swiss and the Superbet Classic');
c.season=1;X.eraSyncNames();

console.log('\n— 1985 and 2000 —');
c=career('1985');
ok(X.worldChampion(c).name==='A. Karpov'&&X.worldChallenger(c).name==='G. Kasparov'&&X.heldThisSeason('wcc',c)&&X.heldThisSeason('candidates',{season:3}),'1985: Karpov against Kasparov this year; the cycle in odd years (1987)');
ok(X.heldThisSeason('olympiad',{season:2}),'the Olympiad still in even years (1986)');
c=career('2000');
const R2=X.worldRanking(c,'classical').filter(p=>!p.you);
ok(R2[0].name==='G. Kasparov'&&X.worldChampion(c).name==='G. Kasparov'&&X.worldChallenger(c).name==='V. Kramnik','2000: Kasparov, and Kramnik the challenger');
ok(X.womenRanking(c).filter(p=>!p.you)[0].name==='J. Polgár'&&X.wChampion(c).name==='Xie Jun','Judit Polgár tops the women; Xie Jun is Women’s World Champion');
ok(!X.heldThisSeason('worldcup',c)&&X.heldThisSeason('worldcup',{season:2}),'FIDE’s knockout championship next year, in 2001');
ok(X.careerMeta(c).era==='2000','your other careers know which era this one is in');
X.store.career=null;
const V=X.careerSetupView;X.store.career=X.freshCareer();
ok(/id="cr-era"/.test(V())&&/1972/.test(V()),'the setup screen asks when');

console.log('\n— adjourned —');
c=career('1972');
const g=new Chess();let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
while(g.history().length<80){const m=g.moves({verbose:true}).filter(x=>!x.captured||g.history().length>30);const pick=m[Math.floor(rnd()*m.length)];g.move(pick);if(g.isGameOver()){g.reset();}}
const hist=g.history({verbose:true});
const b=new Chess();const stack=[b.fen()];hist.forEach(m=>{b.move(m);stack.push(b.fen());});
Object.assign(X.app,{view:'play',careerOpp:{name:'B. Spassky'},careerElo:2660,tc:{id:'classic',cat:'Classical',base:5400,inc:30,label:'90+30'},pass:null,
  playFen:b.fen(),_playStartFen:stack[0],playStack:stack,playMoves:hist.map(m=>({from:m.from,to:m.to,san:m.san})),playSide:'w',playView:stack.length-1,playStatus:'play',adjourn:null});
X.adjournAfterEngine();
ok(X.app.adjourn&&X.app.adjourn.stage==='seal'&&/seal it/.test(X.adjournRail()),'move 40 done and it is your move: you seal it');
const mv=new Chess(b.fen()).moves({verbose:true})[0];
ok(X.playMove(mv.from,mv.to)&&X.app.playStatus==='adjourned'&&X.app.adjourn.stage==='night','the sealed move played: the game is adjourned ('+X.app.adjourn.sealed+' in the envelope)');
ok(/Analyse it overnight/.test(X.adjournRail())&&/no computer can help/.test(X.adjournRail()),'overnight: analyse it on your own — no computer in 1972');
const snap=X.playSnapshot();
ok(snap&&snap.adjourn&&snap.adjourn.stage==='night','an adjourned game is kept if the app closes');
X.adjournAnalyse();
const AH=X.viewAnalysis();
ok(X.app.view==='analysis'&&X.app.ana.noEngine&&/No engine/.test(AH)&&/Back to the game/.test(AH)&&!/Play it out vs the engine/.test(AH),'the analysis board without an engine, and nothing that would end the game');
X.app.view='career';
X.adjournResume();X.app.view='career';
ok(X.app.adjourn.stage==='done'&&X.adjournEdge()===-40,'resumed: the night’s work is worth something in the rest of the game');

console.log('\n✅ another era: '+pass+' checks passed');
setTimeout(()=>process.exit(0),50);
