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
const X=new Function(script+'\nreturn {store,app,PARK_HUSTLERS,parkById,parkInit,parkKnown,parkShownRating,parkLocked,parkStakeOf,parkResult,careerParkPanel,SIMUL_TIERS,simulById,simulLocked,simulTarget,startSimul,simulStrip,careerSimulPanel,finalizeTournament,lifeInit,checkAchievements};')();

/* ---- the chess park ---- */
ok(X.PARK_HUSTLERS.length>=6,'the park has a bench of regulars ('+X.PARK_HUSTLERS.length+')');
ok(X.PARK_HUSTLERS.every(h=>h.real>h.claim),'every hustler is sandbagging — the real strength is higher than the claim');
ok(X.PARK_HUSTLERS.every(h=>h.stakes.length===3&&h.talk.length>=2),'each has three stake levels and their own trash talk');

const c=X.store.career; c.setup=true; X.lifeInit(c);
const p=X.parkInit(c);
ok(p&&p.cred===0&&p.w===0,'you arrive at the park with no cred and no record');
const sal=X.parkById('sal'), ghost=X.parkById('ghost');
ok(!X.parkLocked(c,sal),'the cheapest table is open to anyone');
ok(/street cred/.test(X.parkLocked(c,ghost)||''),'the Ghost will not sit down with a nobody');
ok(X.parkShownRating(c,sal)===sal.claim,'before you beat them you only see the rating they claim');

// winning takes their money and teaches you their real strength
c.money=1000; X.app.parkStake=0; X.app.parkBet={id:'sal',stake:X.parkStakeOf(sal)};
const stake=X.app.parkBet.stake; X.parkResult(1);
ok(c.money===1000+stake,'a win pays you the stake');
ok(X.parkKnown(c,sal)&&X.parkShownRating(c,sal)===sal.real,'beating them reveals what they actually are');
ok(p.cred>0,'winning earns street cred, which opens tougher tables');
ok(X.app.parkDouble&&X.app.parkDouble.id==='sal','they immediately offer double or nothing');

// losing costs you the stake, a draw returns it
const m1=c.money; X.app.parkBet={id:'sal',stake:100}; X.parkResult(0);
ok(c.money===m1-100,'a loss costs you the stake');
ok(!X.app.parkDouble,'nobody offers you a rematch after you lose');
const m2=c.money; X.app.parkBet={id:'sal',stake:100}; X.parkResult(0.5);
ok(c.money===m2,'a draw returns the stake');

// park games are for cash, not for rating
const played=c.played, wonBefore=c.won||0;
X.app.parkBet={id:'sal',stake:50}; X.parkResult(1);
ok((c.won||0)===wonBefore&&c.played===played+1,'park games count as games played but never touch your rating record');

// beat the same regular often enough and they stop playing you
for(let i=0;i<4;i++){X.app.parkBet={id:'sal',stake:10};X.parkResult(1);}
ok((p.barred||[]).includes('sal'),'a regular you keep beating eventually refuses to play');
ok(/won’t play you/.test(X.parkLocked(c,sal)||''),'the panel explains why that table is closed');
ok(/chess park/.test(X.careerParkPanel(c))&&/Street cred/.test(X.careerParkPanel(c)),'the park panel shows the tables and your cred');

/* ---- rated simuls ---- */
ok(X.SIMUL_TIERS.length>=5,'there are simuls of several sizes ('+X.SIMUL_TIERS.length+')');
ok(X.SIMUL_TIERS.every(s=>s.boards>=6&&s.fee>0&&s.per>0),'each simul has boards, an up-front fee and a per-point rate');
c.provisional=true;
ok(/publish a rating/.test(X.simulLocked(X.SIMUL_TIERS[0],c)||''),'an unrated player cannot be booked for a simul');
c.provisional=false; c.rating=2100; c.ratingRapid=2100; c.energy=100; c.money=0; c.tour=null;
ok(!X.simulLocked(X.SIMUL_TIERS[0],c),'a rated player can give a club simul');
ok(/needs 2400/.test(X.simulLocked(X.SIMUL_TIERS[4],c)||''),'the world expo simul is reserved for elite players');

X.startSimul('club');
const tr=c.tour;
ok(tr&&tr.kind==='simul'&&tr.rounds===6,'starting a simul sets up a six-board exhibition');
ok(tr.format==='rapid','simul games are rated — they run on the rapid list');
ok(c.money===250,'the appearance fee is paid up front');
ok(tr.field.every(o=>o.rating<2100),'the room is weaker than you — that is what makes it a simul');
ok(/Purse/.test(X.simulStrip(tr))&&/clear-the-room/.test(X.simulStrip(tr)),'the scoreboard shows the purse and the bonus target');

// clearing the room pays the per-point money plus the bonus
tr.results=tr.field.map(o=>({name:o.name,rating:o.rating,score:1,delta:2})); tr.round=6;
const before=c.money, fans=c.fans||0;
X.finalizeTournament(c);
ok(c.money>=before+6*60+Math.round(250*0.8),'a clean sweep pays every point plus the clear-the-room bonus');
ok((c.fans||0)>fans,'a simul wins you new fans');
ok((c.simuls||0)===1&&(c.simulPerfect||0)===1,'perfect simuls are recorded');
X.checkAchievements(c);
ok((c.achievements||[]).includes('cleanroom'),'clearing a room unlocks an achievement');
ok(/Simultaneous exhibitions/.test(X.careerSimulPanel(c)),'the simul panel lists the bookings you can take');

console.log('\n✅ park+simul: '+pass+' checks passed');
