/* Real-life bot strength, human clock usage, career automation and the
   dashboard — the four things a player actually feels.

   The strength model claims a bot's label means what it says *inside its own
   time control*, that a person's blitz moves are worse than their classical
   ones, and that everyone occasionally just misses something. The clock model
   claims an opponent spends their time like a person rather than a metronome.
   Both are pure functions, so both are checked here rather than by feel. */
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
const X=new Function(script+'\nreturn {store,app,botParams,botThinkMs,clockPanic,tcCategory,ratingInFormat,humanQuality,tcById,botRating,BOTS,TC_GAP,TC_QUALITY,'+
  'AUTO_PLANS,AUTO_TOGGLES,autoDefaults,autoInit,autoPickDay,autoRunDay,autoRunWeek,autoTick,autoSummary,careerAutoPanel,careerDashboard,dashNow,careerNowCard,careerStrip,careerInboxPanel,inboxItems,'+
  'lifeInit,lifeCosts,maxEnergy,placeById,doDay,questsEnsure,dailyAvailable,HOMES,LIFESTYLE,hasAsset,careerTabContent};')();

/* ===================== 1. a rating means its own format ===================== */
ok(X.tcCategory(X.tcById('3+2'))==='blitz' && X.tcCategory(X.tcById('10+5'))==='rapid'
   && X.tcCategory(X.tcById('90+30'))==='classical' && X.tcCategory(X.tcById('1+0'))==='bullet',
   'every time control is read as bullet / blitz / rapid / classical');
ok(X.tcCategory(X.tcById('unlimited'))==='classical','no clock counts as classical — you have all the time there is');

for (const base of [800, 1500, 2100, 2700]) {
  const c=X.ratingInFormat(base,'classical'), r=X.ratingInFormat(base,'rapid'),
        b=X.ratingInFormat(base,'blitz'), u=X.ratingInFormat(base,'bullet');
  if(!(c===base && r<=c && b<=r && u<=b)) throw new Error('FAIL: format ladder broken at '+base+': '+[c,r,b,u]);
}
pass++; console.log('  ✓ a player is rated lower the faster the game gets, at every level');
ok(X.ratingInFormat(800,'blitz') - 800 < X.ratingInFormat(2700,'blitz') - 2700,
   'and the gap is wide for a club player, almost nothing for a super-GM');

ok(X.humanQuality(1800,'classical') > X.humanQuality(1800,'rapid')
   && X.humanQuality(1800,'rapid') > X.humanQuality(1800,'blitz')
   && X.humanQuality(1800,'blitz') > X.humanQuality(1800,'bullet'),
   'the same rating buys worse moves the less time there is to find them');
ok(X.humanQuality(1800,'classical')===1800,'classical is the anchor — its rating is its quality');

/* ===================== 2. what the engine is told to do ===================== */
const P=(e,cat,ms,panic)=>X.botParams(e,cat,ms,panic);
ok(P(800).Lcap > P(1500).Lcap && P(1500).Lcap > P(2200).Lcap && P(2200).Lcap > P(2700).Lcap,
   'a weaker bot accepts a worse move than a stronger one, all the way up');
ok(P(2700).Lcap<=20 && P(2450).Lcap<=32,'a titled-strength bot still never hangs a piece');
ok(P(1700,'blitz').Lcap > P(1700,'classical').Lcap,
   'the same opponent plays looser at 3+2 than at 90+30');
ok(P(1700,'bullet').Lcap > P(1700,'blitz').Lcap,'and looser again at 1+0');

/* the human oversight: the thing engines never do */
ok(P(1200).slip > P(2000).slip && P(2000).slip > P(2700).slip,'the weaker the player, the more often they simply miss something');
ok(P(2700).slip < 0.01,'a 2700 almost never does');
ok(P(1700,'blitz').slip > P(1700,'classical').slip,'a short clock makes everyone miss more');
ok(P(1700,'blitz',1000,1).slip > P(1700,'blitz',1000,0).slip,'and time trouble makes it worse again');
ok(P(1200).slipCap > P(2500).slipCap,'when a beginner misses something it costs a piece; when a master does, a pawn');
ok(P(2700).slip*P(2700).slipCap < P(1200).slip*P(1200).slipCap,'so error per move rises sharply as rating falls');

/* search depth really is shorter when there is no time */
ok(P(2700,'classical',6000).depth > P(2700,'blitz',400).depth,'a short think is a shallow search');
ok(P(2700).depth > P(800).depth,'and a stronger bot still searches deeper than a weaker one');
ok(P(2700,'classical',60).depth>=5,'even the briefest search still looks at something');

/* ===================== 3. the clock, used like a person ===================== */
const T=(o)=>X.botThinkMs(Object.assign({cat:'blitz',rnd:0.5,rnd2:0.5,rnd3:0.5},o));
const open=T({remaining:180000,inc:2000,ply:2}), mid=T({remaining:180000,inc:2000,ply:24});
ok(open.spend < mid.spend/2,'the opening is rattled out from memory, the middlegame is not ('+open.spend+'ms vs '+mid.spend+'ms)');
ok(T({remaining:180000,inc:2000,ply:24,outOfBook:true}).spend > mid.spend,
   'the first move that is genuinely theirs gets a long think');
ok(T({remaining:180000,inc:2000,ply:24,onlyMove:true}).spend < mid.spend,'a forced move is played quickly');
ok(T({remaining:180000,inc:2000,ply:24,recapture:true}).spend < mid.spend,'so is an obvious recapture');
ok(T({remaining:180000,inc:2000,ply:24,cp:900}).spend < T({remaining:180000,inc:2000,ply:24,cp:10}).spend,
   'a decided position is snapped off; an unclear one is pondered');
ok(T({remaining:180000,inc:2000,ply:24,swing:300}).spend > mid.spend,'a sudden change of evaluation is re-checked');
ok(T({remaining:180000,inc:2000,ply:24,tempo:1.5}).spend > T({remaining:180000,inc:2000,ply:24,tempo:0.6}).spend,
   'a slow thinker uses more of their clock than a fast mover');

/* time trouble */
const tight=T({remaining:8000,inc:0,ply:40}), flag=T({remaining:2500,inc:0,ply:50});
ok(tight.spend<=1000 && flag.spend<=400,'short of time they move almost on reflex ('+tight.spend+'ms / '+flag.spend+'ms)');
for (const rem of [1200, 5000, 30000, 180000, 900000, 5400000]) {
  for (const cat of ['bullet','blitz','rapid','classical']) {
    const p=X.botThinkMs({remaining:rem,inc:0,ply:20,cat});
    if(p.spend>rem*0.31) throw new Error('FAIL: '+cat+' with '+rem+'ms would spend '+p.spend);
    if(p.wait>p.spend||p.search>p.wait) throw new Error('FAIL: '+cat+' wait/search exceed the think ('+JSON.stringify(p)+')');
  }
}
pass++; console.log('  ✓ a bot never talks itself into flagging, and never searches longer than you wait');

/* you should not sit through a real three-minute think */
const cls=X.botThinkMs({remaining:5400000,inc:30000,ply:24,cat:'classical',rnd:0.5,rnd2:0.5,rnd3:0.5});
ok(cls.spend>30000,'in a 90+30 a real opponent burns minutes on a move ('+Math.round(cls.spend/1000)+'s)');
ok(cls.wait<=7000,'but you only wait seconds for it ('+Math.round(cls.wait/1000)+'s)');
const quick=X.botThinkMs({remaining:5400000,inc:30000,ply:2,cat:'classical',rnd:0.5,rnd2:0.5,rnd3:0.5});
ok(quick.wait<cls.wait,'and a quick move still feels quick — the compression keeps the shape of the think ('+quick.wait+'ms vs '+cls.wait+'ms)');
const bl=X.botThinkMs({remaining:180000,inc:2000,ply:24,cat:'blitz',rnd:0.5,rnd2:0.5,rnd3:0.5});
ok(bl.wait===bl.spend,'in blitz the clock is the wait — that is the whole point of blitz');
const noclk=X.botThinkMs({base:800});
ok(noclk.spend===0 && noclk.wait>0 && noclk.search<=noclk.wait,'with no clock at all there is nothing to spend, just a short pause');

/* a whole game's worth of moves fits in the clock, and is not a metronome */
for (const [cat,id] of [['blitz','3+2'],['rapid','10+5'],['classical','30+20']]) {
  const tc=X.tcById(id); let rem=tc.base*1000, used=[];
  for (let ply=0; ply<80 && rem>0; ply+=2) {
    const p=X.botThinkMs({remaining:rem,inc:tc.inc*1000,ply,cat});
    rem-=p.spend; rem+=tc.inc*1000; used.push(p.spend);
  }
  if(rem<=0) throw new Error('FAIL: '+cat+' bot flagged inside 40 moves');
  const avg=used.reduce((a,b)=>a+b,0)/used.length;
  const spread=Math.max(...used)/Math.max(1,Math.min(...used));
  if(spread<4) throw new Error('FAIL: '+cat+' spends its time like a metronome (spread '+spread.toFixed(1)+')');
  console.log('    · '+cat+' '+id+': survives 40 moves, avg '+Math.round(avg/100)/10+'s, longest/shortest '+Math.round(spread)+'×');
}
pass++; console.log('  ✓ across a full game the clock lasts, and no two moves cost the same');

ok(X.clockPanic(180000,180,2)===0 && X.clockPanic(1000,180,2)>0.8,'panic is nil with a full clock and near total with a flag hanging');
ok(X.clockPanic(0,0,0)===0,'no clock means no panic');

/* the plumbing that makes a compressed think show up honestly on their clock */
ok(/function startBotClock\(/.test(script)&&/function settleBotClock\(/.test(script),'the opponent clock is driven by an explicit budget');
ok(/active===app\.clock\.botSide&&app\.clock\.botRate>1/.test(script),'their clock drains at the rate a person would have used it');
ok(/app\.clock\[side\]=Math\.max\(0,app\.clock\.botFrom-\(app\.clock\.botBudget\|\|0\)\)/.test(script),
   'and lands exactly on what they decided to spend, however fast the engine answered');
ok(/Engine\.think\(app\.playFen,lvl,plan\.search/.test(script),'the engine is given the search budget, not the wait');

/* ===================== 4. automation ===================== */
const c=X.store.career; c.setup=true; X.lifeInit(c);
const a=X.autoInit(c);
ok(X.AUTO_PLANS.length>=4 && X.AUTO_PLANS.every(p=>p.id&&p.n&&p.d&&p.e),'there are day plans to choose between');
ok(X.AUTO_TOGGLES.every(t=>t.k&&t.n&&t.d&&t.e),'and a switch for each routine job, each explained');
ok(X.AUTO_TOGGLES.every(t=>X.autoDefaults()[t.k]===false),'every switch starts off — it never acts until you ask it to');
ok(a.plan==='balanced'&&a.reserve>0,'a fresh career has a plan and a cash reserve');

/* the plan's priorities, in the order a person would actually rank them */
c.money=5000; c.energy=100; c.tilt=0; c.health=100; c.mood=70; c.injury=null; c.burnout=0; c.tour=null;
c.injury={type:'bad back',weeksLeft:2,sev:1};
ok(X.autoPickDay(c)==='physio','an injury sends you to the physio before anything else');
c.injury=null; c.energy=5;
ok(X.autoPickDay(c)==='rest','exhausted, it rests you');
c.energy=100; c.tilt=80;
ok(X.autoPickDay(c)==='therapy','on tilt, it books the psychologist');
c.tilt=0; c.health=20;
ok(X.autoPickDay(c)==='gym','run down, it sends you to the gym');
c.health=100; c.money=0;
ok(X.autoPickDay(c)==='work','and with the rent unpayable, it takes a coaching shift');
c.money=9000;
a.plan='train'; ok(X.autoPickDay(c)==='study','“train hard” studies');
a.plan='earn';  ok(X.autoPickDay(c)==='work','“earn” works');
a.plan='social';ok(X.autoPickDay(c)==='club','“have a life” goes to the club');
a.plan='recover';ok(X.autoPickDay(c)==='rest','“recover” rests');
a.plan='balanced';

/* it can never pick something you cannot do */
for (const plan of X.AUTO_PLANS.map(p=>p.id)) {
  a.plan=plan; c.money=0; c.energy=6; c.injury=null;
  const pick=X.autoPickDay(c), pl=X.placeById(pick);
  if(!pl) throw new Error('FAIL: '+plan+' picked nothing');
  if(pl.cost>c.money||(pl.energy||0)>c.energy) throw new Error('FAIL: '+plan+' picked '+pick+' it cannot afford');
}
pass++; console.log('  ✓ broke and exhausted, every plan still finds something you can actually do');
a.plan='balanced';

/* days and weeks */
c.money=6000; c.energy=100; c.health=100; c.mood=70; c.tilt=0; c.day=0; c.dayLog=[]; c.tour=null;
const d0=c.day; ok(!!X.autoRunDay(c) && c.day===d0+1,'“play today for me” spends exactly one day');
c.day=0; c.dayLog=[]; c.weeks=0;
const n=X.autoRunWeek(c);
ok(n>0 && c.weeks===1 && c.day===0,'“finish the week” plays out to Sunday and rolls the week over ('+n+' days)');
ok((c.auto.log||[]).length>0 && c.auto.log[0].t,'and writes down what it did with each of them');
c.tour={name:'Test Open'};
ok(X.autoRunDay(c)===null && X.autoRunWeek(c)===0,'life stays on hold while you are at an event');
c.tour=null;

/* the housekeeping switches: bounded, idempotent, and silent when off */
c.money=1000; c.lastBonusDay=null;
X.autoInit(c).daily=false;
const before=c.money; X.autoTick(c);
ok(c.money===before,'with the switch off it takes nothing for you');
X.autoInit(c).daily=true;
ok(X.autoTick(c)>=1 && c.money>before,'with it on, the daily reward is claimed');
const after=c.money; X.autoTick(c);
ok(c.money===after,'and claimed only once — running it again does nothing');

const q=X.questsEnsure(); q.items[0].prog=q.items[0].goal; q.items[0].claimed=false;
X.autoInit(c).quests=true; const m0=c.money; X.autoTick(c);
ok(c.money>m0 && q.items[0].claimed,'a finished quest is collected');

c.assets=[]; c.money=100000; X.autoInit(c).buy=true; X.autoInit(c).reserve=99000;
X.autoTick(c);
ok(c.money>=99000,'buying never dips below the reserve you set');
X.autoInit(c).reserve=1000; X.autoTick(c);
ok((c.assets||[]).length>0,'above the reserve it does buy the upgrade');
X.autoInit(c).buy=false;

c.home='hostel'; c.money=200000; c.peak=2600; X.autoInit(c).home=true; X.autoTick(c);
ok(c.home!=='hostel','with money banked it moves you somewhere better');
X.autoInit(c).home=false;

/* ===================== 5. the dashboard ===================== */
c.tour=null; c.name='Testa'; c.rating=2100; c.provisional=false; c.ratingRapid=2050; c.ratingBlitz=1980;
c.money=4200; c.energy=70; c.health=80; c.mood=65; c.tilt=20; c.form=10;
const dash=X.careerDashboard(c);
ok(/Classical/.test(dash)&&/Rapid/.test(dash)&&/Blitz/.test(dash)&&dash.includes('2100')&&dash.includes('1980'),
   'the dashboard shows what you are rated in all three formats');
ok(/Money/.test(dash)&&dash.includes('4,200'),'and the money, against the bills that are coming');
ok(/Energy/.test(dash)&&/Health/.test(dash)&&/Mood/.test(dash)&&/Tilt/.test(dash)&&/Form/.test(dash),
   'and how your body and your head are holding up');
const nowC=X.careerNowCard(c);
ok(/dashnow/.test(nowC)&&/due Sunday/.test(nowC),'the Play tab starts with, in one line, what is actually happening right now');
ok(/data-act="autoweek"/.test(nowC)&&/automated/.test(nowC)&&/Energy/.test(nowC),'with how you are, and what automation is looking after');
const strip=X.careerStrip(c);
ok(/cstrip/.test(strip)&&strip.includes('2100')&&strip.includes('4,200')&&/⚡70/.test(strip),'above the tabs, one line: your rating, your money, your energy');
ok(!/dashrt/.test(strip),'and the detail stays folded until you ask for it');

c.injury={type:'bad back',weeksLeft:2,sev:1}; c.debt=500; c.skillPts=2;
const al=X.careerInboxPanel(c);
ok(/bad back/.test(al)&&/You owe/.test(al)&&/skill point/.test(al),'anything waiting on you is in the inbox');
ok(/data-act="jump" data-val="life:lifecard"/.test(al)&&/data-val="life:homecard"/.test(al)&&/data-val="you:perkscard"/.test(al),'each one a way to the card it is on');
c.injury=null; c.debt=0; c.skillPts=0;
c.money=999999; c.energy=100; c.health=100; c.mood=100; c.tilt=0;
X.autoInit(c).daily=false; X.autoInit(c).quests=false;
(X.questsEnsure().items||[]).forEach(it=>{it.claimed=true;});
c.sponsor={name:'x',perWeek:1,weeksLeft:1}; c.pressPending=null; c.dilemma=null; c.seasonReview=null; c.burnout=0;
ok(X.inboxItems(c).length===0&&/Nothing is waiting/.test(X.careerInboxPanel(c)),'and when nothing is, it says so instead of inventing a chore');

c.tour={name:'Tata Steel',emoji:'♟',round:2,rounds:9,format:'classical',score:1.5};
const now=X.dashNow(c);
ok(/Round 3 of 9/.test(now.sub),'mid-event it counts the rounds for you');
c.tour=null;
ok(/Automation/.test(X.careerTabContent(c,'life')),'the automation panel lives in the Life tab');

/* ===================== 6. the board holds still ===================== */
ok(/\.pstrip\{[^}]*height:46px/.test(html),'the strips around the board are a fixed height');
ok(/\.pstrip \.who\{[^}]*flex-wrap:nowrap/.test(html),'so a growing pile of captured pieces cannot re-wrap them');
ok(/\.capx\{[^}]*white-space:nowrap/.test(html),'nor spill onto a second line');
ok(/\.clock\{[^}]*width:104px;flex:0 0 104px/.test(html),'and the clock keeps its width when it gains a tenths digit');
ok(/\.noticerail\{/.test(html)&&/noticeRail='<div class="noticerail">/.test(script),'in-game notices have a home of their own');
ok(script.indexOf('const noticeRail=')<script.indexOf("+botStrip+navbar+noticeRail")
   && /botStrip\+navbar\+noticeRail/.test(script),'and it hangs below the board, where it cannot push it');
ok(!/if\(app\.blunderNote&&app\.playStatus!=='over'\)h\+=coachCard/.test(script),
   'nothing that appears mid-game is rendered above the board any more');
ok(/if\(app\.careerOpp&&app\.careerRoundOpp\)h\+=careerMatchupStrip\(\)/.test(script),
   'and the matchup strip stays put when the game ends rather than vanishing');

console.log('\n✅ strength+automation: '+pass+' checks passed');
