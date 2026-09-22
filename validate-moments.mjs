/* Career depth: what a round is worth, how a game went, and the career
   remembering itself.

   These are the three things that turn a column of results into something you
   would tell somebody about, and all three are pure functions over state the
   app already keeps — so they are checked here rather than felt for. */
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
globalThis.fetch=()=>Promise.reject(new Error('no network'));
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];

let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,tourStakes,tourStakesCard,gameStory,noteSwing,recordMoment,momentsFromGame,'+
  'momentsFromFinish,careerMomentsPanel,MOMENT_CAP,lifeInit,careerTabContent,fmtScore,'+
  'drawPlan,drawFixtures,tourPots,drawRevealed,drawComplete,finishDraw,tourDrawPanel,makeField,POT_MAX};')();

/* ===================== what this round is worth ===================== */
const board=(round,rounds,mine,others,extra)=>Object.assign(
  {name:'Hastings',rounds,round,standings:[{id:'__you',name:'You',score:mine,rating:2200,you:true}]
    .concat(others.map((sc,i)=>({id:'p'+i,name:'P'+i,score:sc,rating:2200+i,you:false})))},extra||{});
const head=(tr)=>{const st=X.tourStakes(X.store.career,tr);return st?st.head:null;};

ok(head(board(0,9,0,[0,0,0]))!==null,'every round before the last one is worth saying something about');
ok(head(board(9,9,6,[5.5]))===null,'a finished event says nothing — there is nothing left to play for');
ok(X.tourStakes(X.store.career,{rounds:6,round:0,kind:'simul',standings:[]})===null,'and a simul is not a tournament');
ok(X.tourStakes(X.store.career,{rounds:9,round:3})===null,'no crosstable, no claim about the crosstable');

/* the last round, where the arithmetic has to be right */
ok(/already yours/.test(head(board(8,9,7.5,[5.5]))),'+2 with one to play: nobody can catch you');
ok(/draw wins/i.test(head(board(8,9,6.5,[5.5]))),'+1: a draw wins it outright — and a loss still ties at worst');
ok(/Win and/.test(head(board(8,9,6,[5.5]))),'+½: only a win settles it, because a draw is caught by the leader winning');
ok(/Win and you win/.test(head(board(8,9,5.5,[5.5]))),'level: win and the tournament is yours');
ok(/Only a win/.test(head(board(8,9,5,[5.5]))),'−½: only a win will do');
ok(/win, and some help/.test(head(board(8,9,4.5,[5.5]))),'−1: a win, and you need the leader to slip');
ok(/Out of the running/.test(head(board(8,9,4,[5.5]))),'−1½ with one round left is mathematically out, and says so');

/* mid-event */
ok(/already yours/.test(head(board(5,9,8,[2.5]))),'an unassailable lead is called that before the last round too');
ok(/lead by/.test(head(board(5,9,5,[3.5]))),'a lead is stated as a lead');
ok(/Level at the top/.test(head(board(5,9,4,[4]))),'level is stated as level');
ok(/off the lead/.test(head(board(5,9,3,[4]))),'and being behind is stated plainly');

/* it never lies about being out of it */
for (const [round,rounds,mine,lead] of [[8,9,4,5.5],[7,9,2,5],[5,9,0,4.5]]) {
  const out=/Out of the running/.test(head(board(round,rounds,mine,[lead])));
  const reallyOut=mine+(rounds-round)<lead;
  if(out!==reallyOut)throw new Error('FAIL: "out of it" disagrees with the arithmetic at '+mine+' vs '+lead);
}
pass++; console.log('  ✓ “out of the running” always matches what is actually still possible');

const champ=X.tourStakes(X.store.career,board(10,11,6,[6],{champion:true,honor:'World Champion'}));
ok(/World Champion/.test(champ.sub),'a world title on the line gets said out loud');
ok(/Final round/.test(X.tourStakesCard(X.store.career,board(8,9,5.5,[5.5]))),'the card marks the final round as the final round');

/* ===================== how the game went ===================== */
const g=(o)=>X.gameStory(o);
ok(g({score:1,plies:80,low:-620,high:0}).k==='comeback','a win from a lost position is a comeback');
ok(g({score:0,plies:80,low:0,high:620}).k==='collapse','and a loss from a winning one is a collapse');
ok(g({score:0.5,plies:90,low:-500,high:0}).k==='escape','a draw held from a lost position is an escape');
ok(g({score:0.5,plies:90,low:0,high:640}).k==='spilled','a draw out of a won one is a point spilled');
ok(g({score:1,plies:38,low:-40,high:900}).k==='crush','a short, one-sided win is a crush');
ok(g({score:1,plies:160,low:-120,high:0}).k==='grind','a very long win is a grind');
ok(g({score:0,plies:70,low:0,high:0,result:'You lost on time. ⏱'}).k==='flagloss','losing on the clock is its own kind of loss');
ok(g({score:1,plies:70,low:-90,high:250}).k==='win'&&g({score:0.5,plies:60,low:0,high:0}).k==='draw','an ordinary result is allowed to be ordinary');

/* it always returns something, and the emotional arithmetic points the right way */
for (const score of [0,0.5,1]) for (const plies of [10,60,200]) for (const low of [null,-800,0]) for (const high of [null,0,800]) {
  const st=g({score,plies,low,high});
  if(!st||!st.k||!st.e||!st.t)throw new Error('FAIL: no story for '+[score,plies,low,high]);
  if(score===1&&st.mood<0)throw new Error('FAIL: a win made you sadder');
  if(score===0&&st.mood>0)throw new Error('FAIL: a loss cheered you up');
}
pass++; console.log('  ✓ every combination has a story, and a win never makes you miserable');
ok(g({score:1,plies:80,low:-620,high:0}).mood>g({score:1,plies:70,low:-90,high:250}).mood,
   'and stealing one is worth more than a routine win');
ok(g({score:0,plies:70,low:0,high:620}).tilt>g({score:0,plies:70,low:-600,high:0}).tilt,
   'while throwing one away tilts you more than being outplayed');

/* the swing watcher reads the evaluation from your side of the board */
X.app.careerOpp='tour'; X.app.playSide='b'; X.app._evLow=null; X.app._evHigh=null;
X.noteSwing({t:'cp',v:300,stm:'w'});     // +3 for White = −3 for you
ok(X.app._evLow===-300,'a good position for White is a bad one for you when you are Black');
X.noteSwing({t:'cp',v:-500,stm:'w'});
ok(X.app._evHigh===500,'and the other way round');
X.noteSwing({t:'mate',v:1,stm:'w'});
ok(X.app._evHigh===500&&X.app._evLow===-300,'a mate score is not mistaken for a centipawn one');
X.app.careerOpp=null; X.noteSwing({t:'cp',v:9999,stm:'w'});
ok(X.app._evHigh===500,'and nothing is watched outside a career game');

/* ===================== moments ===================== */
const c=X.store.career; c.setup=true; X.lifeInit(c); c.moments=[]; c.weeks=12; c.season=1; c.rival=null;
X.momentsFromGame(c,{score:1,opp:{name:'GM Ivanov',rating:2560,title:'GM'},myRating:2180,story:g({score:1,plies:80,low:-620,high:0})});
ok(c.moments.some(m=>m.k==='firstGM'),'your first win over a GM is kept');
ok(c.moments.some(m=>m.k==='giant'),'so is beating somebody 300 points above you');
ok(c.moments.some(m=>m.k==='comeback'),'and the comeback itself');
X.momentsFromGame(c,{score:1,opp:{name:'GM Petrov',rating:2500,title:'GM'},myRating:2200,story:g({score:1,plies:70,low:0,high:0})});
ok(c.moments.filter(m=>m.k==='firstGM').length===1,'a first is only a first once');
const n0=c.moments.length;
X.momentsFromGame(c,{score:0,opp:{name:'GM Petrov',rating:2500,title:'GM'},myRating:2200,story:g({score:0,plies:70,low:-600,high:0})});
ok(c.moments.length===n0,'an ordinary loss to a stronger player is not a moment');
c.rival={name:'Nemesis',id:'x'};
X.momentsFromGame(c,{score:1,opp:{name:'Nemesis',rating:2200,title:null},myRating:2200,story:g({score:1,plies:70,low:0,high:0})});
ok(c.moments.some(m=>m.k==='rival'),'beating your rival is');

X.momentsFromFinish(c,{name:'Hastings',place:1,norms:['IM norm'],newTitles:['CM'],honors:['Hastings Champion'],published:true,rating:2205});
ok(c.moments.some(m=>m.k==='tourwin'&&/Hastings/.test(m.t)),'winning an event is kept, by name');
ok(c.moments.some(m=>m.k==='norm')&&c.moments.some(m=>m.k==='title')&&c.moments.some(m=>m.k==='honour'),'norms, titles and honours too');
ok(c.moments.some(m=>m.k==='published'),'and the day you got a published rating');
X.momentsFromFinish(c,{name:'Bad Open',place:7,norms:[],newTitles:[],honors:[]});
ok(!c.moments.some(m=>/Bad Open/.test(m.t)),'seventh place at a weekend open is not a moment');

ok(c.moments.every(m=>m.e&&m.t&&m.w!=null&&m.s!=null),'every moment carries an icon, a line and when it happened');
ok(c.moments[0].d>=c.moments[c.moments.length-1].d,'and the newest is first');

for(let i=0;i<X.MOMENT_CAP+20;i++)X.recordMoment(c,'filler','·','filler '+i,{news:false});
ok(c.moments.length===X.MOMENT_CAP,'the shelf has a size, so a long career cannot fill the disk');

c.moments=[{k:'tourwin',e:'🏆',t:'You won Hastings.',w:12,s:1,d:Date.now(),big:true}];
ok(/Moments/.test(X.careerMomentsPanel(c))&&/Hastings/.test(X.careerMomentsPanel(c)),'the shelf renders what is on it');
c.moments=[];
ok(/Nothing yet/.test(X.careerMomentsPanel(c)),'and says so honestly when it is empty');
ok(/Moments/.test(X.careerTabContent(c,'legacy')),'it lives in Legacy, with the rest of the story');


/* ===================== the draw ===================== */
/* Every event used to be the same escalator — the field sorted by rating and
   handed over weakest first. It is drawn from seeded pots now, so the checks
   are about balance (an event is never a walkover or a massacre) and about
   the order genuinely not being the rating order. */
const seedField=(n)=>Array.from({length:n},(_,i)=>({name:'P'+i,rating:2500-i*40}));

for (const rounds of [1,2,3,5,6,7,9,11,13,14]) {
  const f=X.drawFixtures(seedField(rounds),rounds);
  if(f.length!==rounds)throw new Error('FAIL: '+rounds+' rounds drew '+f.length+' fixtures');
  if(new Set(f.map(o=>o.name)).size!==rounds)throw new Error('FAIL: an opponent was drawn twice at '+rounds+' rounds');
  const counts={}; f.forEach(o=>counts[o.pot]=(counts[o.pot]||0)+1);
  const vals=Object.values(counts);
  if(Math.max(...vals)-Math.min(...vals)>1)throw new Error('FAIL: lopsided pots at '+rounds+' rounds: '+JSON.stringify(counts));
  if(Object.keys(counts).length!==Math.min(X.POT_MAX,rounds))throw new Error('FAIL: wrong pot count at '+rounds+' rounds');
}
pass++; console.log('  ✓ every event length draws a full, balanced field with nobody twice');

/* seeding: Pot 1 really is the dangerous end */
{
  const f=X.drawFixtures(seedField(12),12);
  const avg=p=>{const g=f.filter(o=>o.pot===p);return g.reduce((s,o)=>s+o.rating,0)/g.length;};
  ok(avg(1)>avg(2)&&avg(2)>avg(3)&&avg(3)>avg(4),'the pots are seeded by strength, Pot 1 downwards');
}

/* the whole point: the order is not the rating order */
{
  const N=600,R=9;let ascending=0,firstIsWeakest=0;const firstPots={};
  for(let i=0;i<N;i++){
    const f=X.drawFixtures(seedField(R),R);
    if(f.every((o,j)=>j===0||o.rating>=f[j-1].rating))ascending++;
    if(f[0].rating===Math.min(...f.map(o=>o.rating)))firstIsWeakest++;
    firstPots[f[0].pot]=(firstPots[f[0].pot]||0)+1;
  }
  ok(ascending<=2,'a fixture list ordered weakest-to-strongest is now a fluke, not the rule ('+ascending+'/'+N+')');
  ok(firstIsWeakest<N*0.25,'round one is no longer reliably the easiest game ('+firstIsWeakest+'/'+N+')');
  ok([1,2,3,4].every(p=>(firstPots[p]||0)>N*0.15),'and your first opponent can come out of any pot: '+JSON.stringify(firstPots));
}
{
  const R=9,seen=new Set();
  for(let i=0;i<300;i++)seen.add(X.drawFixtures(seedField(R),R).map(o=>o.name).join(','));
  ok(seen.size>280,'two events are essentially never drawn the same way ('+seen.size+' orders in 300 draws)');
}

/* the plan behind it */
{
  const plan=X.drawPlan(9);
  ok(plan.order.length===9&&plan.counts.reduce((a,b)=>a+b,0)===9,'the plan has exactly one fixture per round');
  ok(plan.potCount===4&&X.drawPlan(2).potCount===2,'short events use fewer pots than long ones');
  const flat=X.drawPlan(12).order;
  ok(!flat.every((p,i)=>i===0||p>=flat[i-1]),'the pot order is shuffled, not walked in sequence');
}

/* the ceremony is presentation only — it can never block or lose the chess */
{
  const tr={name:'Open',rounds:7,round:0,field:X.drawFixtures(seedField(7),7),drawn:0};
  ok(X.drawRevealed(tr)===0&&!X.drawComplete(tr),'a fresh event starts undrawn');
  tr.drawn=3; ok(X.drawRevealed(tr)===3,'and reveals as far as you have drawn');
  X.finishDraw(tr); ok(X.drawComplete(tr)&&tr.drawn===7,'finishing the draw reveals the lot');
  tr.drawn=99; ok(X.drawRevealed(tr)===7,'it can never claim more fixtures than the event has');
  const old={name:'Old',rounds:9,round:4,field:X.drawFixtures(seedField(9),9)};
  ok(X.drawRevealed(old)===9&&X.drawComplete(old),'an event saved before there was a draw counts as fully drawn, so old careers open where they left off');
  ok(/finishDraw\(store\.career\.tour\)/.test(script)&&/finishDraw\(tr\)/.test(script),'playing or simulating a round finishes the draw rather than refusing');
}
{
  const tr={name:'Open',rounds:7,round:0,field:X.drawFixtures(seedField(7),7),drawn:0};
  const pots=X.tourPots(tr);
  ok(pots.length===4&&pots.every(g=>g.players.length>0),'the pots are rebuilt from the field, so there is no second copy to keep in step');
  const html=X.tourDrawPanel(X.store.career,tr);
  ok(/The draw/.test(html)&&/Pot 1/.test(html)&&/data-act="drawnext"/.test(html)&&/data-act="drawall"/.test(html),'the panel shows the pots and offers both ways through it');
  X.finishDraw(tr);
  ok(!/data-act="drawnext"/.test(X.tourDrawPanel(X.store.career,tr)),'and puts the buttons away once it is done');
  ok(X.tourDrawPanel(X.store.career,{kind:'match',rounds:14,field:[]})===''
     &&X.tourDrawPanel(X.store.career,{kind:'simul',rounds:6,field:[]})==='','a match and a simul are not drawn — there is nothing to draw');
}

/* the start of an event has nothing to say about a crosstable of zeroes */
{
  const st=X.tourStakes(X.store.career,{name:'Open',rounds:7,round:0,
    standings:[{id:'__you',score:0,rating:2050,you:true}].concat([0,0,0].map((s,i)=>({id:'p'+i,score:0,rating:2400-i*100})))});
  ok(st.start===true&&/everybody starts on nothing/.test(st.head),'before round one it talks about the seeding, not the standings');
  ok(/seed of/.test(st.sub),'and tells you where you are seeded');
}

console.log('\n✅ career depth: '+pass+' checks passed');
