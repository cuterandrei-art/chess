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
const X=new Function(script+'\nreturn {store,app,bulSim,bulName,tourMet,tourNoteMet,tourPairField,tourPlayRound,'+
  'tourBulletinCard,standingsSorted,standingsRank,careerStandings,fmtScore,freshCareer,BUL_DRAW};')();

/* A nine-player field: you and eight opponents, one a round. */
function tour(n,o){
  const pool=[];
  for(let i=0;i<n;i++)pool.push({id:'p'+i,name:['Ella Boyd','Tom Knox','Kai Beck','Liam Wood','Leo Dahl',
    'Ana Vega','Ivo Sark','Mira Sol','Ren Ito'][i%9]+(i>8?' '+i:''),rating:2200+((i*37)%300),
    title:'IM',flag:'🇪🇸',score:0,you:false});
  pool.push({id:'__you',name:'Ada Marín',rating:2300,title:'IM',flag:'🇷🇴',score:0,you:true});
  return Object.assign({id:'t',name:'City Open',emoji:'🏙️',rounds:n,round:0,avg:2300,
    standings:pool,results:[],field:pool.filter(p=>!p.you).map(p=>({name:p.name,rating:p.rating}))},o||{});
}
X.store.career=X.freshCareer();

/* ================= ONE GAME, SIMULATED ================= */
let w=0,d=0,l=0;
for(let i=0;i<4000;i++){const s=X.bulSim(2300,2300);if(s===1)w++;else if(s===0)l++;else d++;}
ok(Math.abs((w+d*0.5)/4000-0.5)<0.05,'two equal players score about half against each other');
ok(Math.abs(d/4000-X.BUL_DRAW)<0.05,'and draw about as often as a strong field does ('+Math.round(d/40)+'%)');
let up=0;for(let i=0;i<2000;i++)up+=X.bulSim(2500,2100);
ok(up/2000>0.75,'400 points of advantage scores well over three quarters ('+Math.round(up/20)+'%)');
ok([0,0.5,1].indexOf(X.bulSim(2300,2300))>=0,'a board is always a win, a draw or a loss');

/* ================= WHO PLAYS WHOM ================= */
let T=tour(8);
let pairs=X.tourPairField(T,'p0');
ok(pairs.length===3||pairs.length===4,'everybody not in your game is paired ('+pairs.length+' boards)');
let inPairs=[];pairs.forEach(p=>{inPairs.push(p.a.id);if(p.b)inPairs.push(p.b.id);});
ok(inPairs.indexOf('__you')<0,'you are not paired twice');
ok(inPairs.indexOf('p0')<0,'and neither is the player you are already facing');
ok(new Set(inPairs).size===inPairs.length,'nobody is paired twice in one round');
ok(inPairs.length===7||inPairs.length===8,'the whole rest of the field is in ('+inPairs.length+' players)');
/* pairing is by score, the way a Swiss is */
T=tour(8);
T.standings.forEach(function(p,i){p.score=(i<3&&!p.you)?2:0;});
pairs=X.tourPairField(T,'p7');
ok(pairs[0].a.score===2&&pairs[0].b.score===2,'the leaders are paired against each other, not against the tail');
/* a rematch is avoided when there is an alternative */
T=tour(8);
X.tourNoteMet(T,'p1','p2');
ok(X.tourMet(T,'p1','p2')&&X.tourMet(T,'p2','p1'),'who has played whom is remembered, both ways round');
let rematch=0;
for(let i=0;i<200;i++){
  const t2=tour(8);
  X.tourNoteMet(t2,'p1','p2');
  const pr=X.tourPairField(t2,'p0');
  if(pr.some(x=>x.b&&((x.a.id==='p1'&&x.b.id==='p2')||(x.a.id==='p2'&&x.b.id==='p1'))))rematch++;
}
ok(rematch===0,'and two players who have met are not paired again while anybody else is free');
/* an odd number left over means somebody sits out */
T=tour(7);
pairs=X.tourPairField(T,'p0');
const byes=pairs.filter(p=>!p.b);
ok(byes.length<=1,'at most one player sits out a round');

/* ================= THE TABLE ADDS UP ================= */
T=tour(8);
const total0=T.standings.reduce((a,p)=>a+(p.score||0),0);
ok(total0===0,'before a move is played, nobody has anything');
X.tourPlayRound(T,0,1);
let total=T.standings.reduce((a,p)=>a+(p.score||0),0);
const players=T.standings.length;
ok(total===Math.floor(players/2)+(players%2?0.5:0),
  'one round of '+players+' players hands out exactly '+total+' points — a crosstable, not a guess');
ok(T.standings.filter(p=>p.you)[0].score===1,'your win is in the table');
ok(T.standings.filter(p=>p.id==='p0')[0].score===0,'and your opponent got nothing for it');
for(let r=1;r<8;r++)X.tourPlayRound(T,r,r%3===0?0:0.5);
total=T.standings.reduce((a,p)=>a+(p.score||0),0);
ok(total===8*(Math.floor(players/2)+(players%2?0.5:0)),
  'eight rounds later the total is still exactly right ('+total+')');
ok(T.standings.every(p=>(p.score||0)<=8),'and nobody has scored more than the rounds played');
ok(T.standings.every(p=>(p.score||0)>=0),'or less than nothing');
/* your own score is the one you actually made */
T=tour(8);
let mine=0;
[1,0,0.5,1,0,1,0.5,0].forEach(function(sc,r){X.tourPlayRound(T,r,sc);mine+=sc;});
ok(T.standings.filter(p=>p.you)[0].score===mine,'your score in the table is the sum of your results ('+mine+')');

/* ================= THE BULLETIN ================= */
T=tour(8);
let bul=X.tourPlayRound(T,0,1);
ok(bul.r===1,'the bulletin knows which round it is');
ok(bul.boards.length>=3,'it lists the other boards ('+bul.boards.length+')');
ok(bul.boards.every(b=>b.bye||(b.a&&b.b&&[0,0.5,1].indexOf(b.s)>=0)),'each with two players and a result');
ok(bul.notes.length>=1,'and says something about the state of the event');
ok(bul.notes.every(n=>n.e&&n.t),'each note with something to say');
ok(T.bulletins.length===1,'the bulletin is kept with the tournament');
for(let r=1;r<8;r++)X.tourPlayRound(T,r,1);
ok(T.bulletins.length===8,'one a round');
ok(T.bulletins[7].r===8,'in order');
/* winning everything gets noticed */
T=tour(8);
X.tourPlayRound(T,0,1);
bul=X.tourPlayRound(T,1,1);
ok(bul.notes.some(n=>/perfect score|You lead|You share the lead/.test(n.t)),
  'two wins from two is remarked on: “'+bul.notes.map(n=>n.t).join(' / ')+'”');
/* the leader losing is the story of a round */
T=tour(8);
T.standings.forEach(function(p){if(p.id==='p3')p.score=3;});
let sawLeaderLose=false;
for(let i=0;i<60&&!sawLeaderLose;i++){
  const t2=tour(8);
  t2.standings.forEach(function(p){if(p.id==='p3')p.score=3;});
  const b2=X.tourPlayRound(t2,0,0.5);
  if(b2.notes.some(n=>/led going into the round, and lost/.test(n.t)))sawLeaderLose=true;
}
ok(sawLeaderLose,'when the leader loses, the bulletin leads on it');
/* An upset needs two mismatched players on the same score — which is exactly
   how a Swiss produces them, and why they are rare in the first round. */
let sawUpset=false,sawBoardUpset=false;
for(let i=0;i<200&&!(sawUpset&&sawBoardUpset);i++){
  const t2=tour(8);
  // a 2700 and a 2050 both on two points: the pairing has to put them together
  t2.standings.forEach(function(p){
    if(p.id==='p1'){p.rating=2700;p.score=2;}
    else if(p.id==='p2'){p.rating=2050;p.score=2;}
    else if(!p.you)p.score=0;
  });
  const b2=X.tourPlayRound(t2,0,0.5);
  if(b2.boards.some(x=>x.upset))sawBoardUpset=true;
  if(b2.notes.some(n=>/nobody expected/.test(n.t)))sawUpset=true;
}
ok(sawBoardUpset,'a 650-point mismatch on the same score is marked as an upset when the underdog wins');
ok(sawUpset,'and the bulletin calls it a result nobody expected');
/* a close pairing is never called an upset */
{
  const t3=tour(8);
  let any=false;
  for(let i=0;i<40;i++){const t4=tour(8);t4.standings.forEach(p=>{if(!p.you)p.rating=2300;});
    if(X.tourPlayRound(t4,0,0.5).boards.some(x=>x.upset))any=true;}
  ok(!any,'while a field of equals produces no upsets at all, because there is nothing to upset');
}
/* only a surname is used, so the bulletin reads like a bulletin */
ok(X.bulName('Ella Boyd')==='Boyd'&&X.bulName('Ada Marín')==='Marín','players are referred to by surname');
ok(X.bulName('')===''&&X.bulName(null)==='','and a missing name does not break it');

/* ================= ON THE TOURNAMENT SCREEN ================= */
T=tour(8);
ok(X.tourBulletinCard(T)==='','before a round is played there is no bulletin');
X.tourPlayRound(T,0,1);
let card=X.tourBulletinCard(T);
ok(/Round 1 bulletin/.test(card),'once a round is played the card appears');
ok(/Board 2/.test(card),'with the other boards numbered from two — yours was board one');
ok(/1–0|0–1|½–½/.test(card),'and real results on them');
X.tourPlayRound(T,1,0);
ok(/Round 2 bulletin/.test(X.tourBulletinCard(T)),'and it always shows the latest round');
ok(X.tourBulletinCard(null)===''&&X.tourBulletinCard({})==='','no tournament, no bulletin');
/* a match has no field to report on */
const match=tour(8,{kind:'match',standings:null});
ok(X.tourBulletinCard(match)==='','a one-on-one match has no other boards to report');

/* ================= WIRED IN ================= */
ok(/if\(tr\.standings\)tourPlayRound\(tr,rIdx,score\);/.test(script),
  'the round is played through the pairing, not by rolling scores independently');
ok(script.indexOf('p.score=(p.score||0)+simRoundScore(E)')<0,
  'and the old independent simulation is gone, not left beside it');
ok(/h\+=tourBulletinCard\(tr\);/.test(script),'the bulletin is rendered on the tournament screen');
ok(/h\+=careerStandings\(tr\);\s*\n\s*h\+=tourBulletinCard\(tr\);/.test(script),'under the standings it explains');

console.log('\n✅ bulletin: '+pass+' checks passed');
