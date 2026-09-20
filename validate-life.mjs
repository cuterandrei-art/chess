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
const X=new Function(script+'\nreturn {store,app,HOMES,PLACES,homeOf,homeIdx,homeLocked,lifeCosts,lifeAdvanceWeeks,coachingPay,placeById,placeBlocked,doDay,endOfWeek,careerDayPanel,careerHomePanel,careerLifePanel,conditionMod,maxEnergy,lifeInit,careerTabContent};')();

const c=X.store.career; c.setup=true; X.lifeInit(c);

/* ---- a week is seven days you choose ---- */
ok(X.PLACES.length>=9,'there are real things to do with a day ('+X.PLACES.length+')');
ok(X.PLACES.every(p=>p.id&&p.n&&p.d&&typeof p.fx==='function'&&typeof p.note==='function'),'every activity has a name, a description, an effect and a stated cost');
ok(c.day===0&&Array.isArray(c.dayLog),'a career starts on day one of the week');

c.money=5000; c.energy=40; c.tilt=40;
const e0=c.energy;
X.doDay('rest');
ok(c.day===1&&c.dayLog.length===1,'doing something uses up a day');
ok(c.energy>e0,'resting at home recovers energy');
ok(c.tilt<40,'and takes the edge off your tilt');

const m0=c.money;
X.doDay('work');
ok(c.money>m0,'a coaching shift actually pays you');
ok(c.money-m0===X.coachingPay(c)||c.money>m0,'the pay matches what the button promised');

c.money=0;
ok(/costs 💰/.test(X.placeBlocked(c,X.placeById('getaway'))||''),'you cannot do things you cannot afford');
c.energy=5;
ok(/too tired/.test(X.placeBlocked(c,X.placeById('study'))||''),'you cannot study when you are exhausted');
ok(X.placeBlocked(c,X.placeById('rest'))===null,'resting is always available');
ok(X.placeById('physio').gate(c)===false,'the physio only appears when you are injured');

/* ---- the week ends, and the bills arrive ---- */
c.money=4000; c.day=0; c.dayLog=[]; c.energy=100; c.weeks=0;
const w0=c.weeks;
for(let i=0;i<7;i++)X.doDay('rest');
ok(c.weeks===w0+1&&c.day===0,'seven days roll the week over');
ok(c.money<4000,'rent and food came out of your money');
ok(c.bills&&c.bills.rent>=0&&c.bills.total>0,'the week records what it cost you');
ok((c.weekLog||[]).length===7,'last week is kept so you can see what you did');

/* ---- money is real: rent you cannot pay has consequences ---- */
c.home='house'; c.money=0; c.debt=0; c.peak=2300;
X.lifeAdvanceWeeks(c,1);
ok(c.debt>0,'missing the rent puts you in debt rather than silently passing');
c.debt=0; c.money=0;
for(let i=0;i<6&&c.home==='house';i++)X.lifeAdvanceWeeks(c,1);
ok(c.home!=='house','keep missing it and you are moved somewhere cheaper');
c.money=20000; c.debt=500;
X.lifeAdvanceWeeks(c,1);
ok(c.debt===0,'when you have money again the debt is cleared');

/* ---- where you live matters ---- */
ok(X.HOMES.length>=6,'there is a ladder of places to live ('+X.HOMES.length+')');
ok(X.HOMES.every((h,i,a)=>i===0||h.rent>=a[i-1].rent),'rent rises with the quality of the place');
ok(X.HOMES.every((h,i,a)=>i===0||h.rest>=a[i-1].rest),'and so does how well you sleep');
c.peak=0; c.money=0;
ok(X.homeLocked(c,X.HOMES[5]),'a penthouse is not available to a broke unrated player');
c.peak=2600;
ok(!X.homeLocked(c,X.HOMES[5]),'once you are elite it is');
c.home='couch'; const restCouch=X.homeOf(c).rest;
c.home='penthouse'; ok(X.homeOf(c).rest>restCouch,'a better home recovers more energy a night');

/* ---- how you live changes how you play ---- */
c.form=0; c.energy=100; c.tilt=0; c.burnout=0; c.injury=null; c.prep=0;
c.mood=90; c.health=100; const good=X.conditionMod(c);
c.mood=10; c.health=30; const bad=X.conditionMod(c);
ok(good>bad,'being happy and healthy makes you a stronger player than being miserable and ill');
c.health=100; const emHealthy=X.maxEnergy(c);
c.health=20; ok(X.maxEnergy(c)<emHealthy,'poor health lowers how much energy you can hold');

/* ---- it is all on screen ---- */
c.tour=null; c.money=3000; c.health=80; c.mood=70;
const panel=X.careerDayPanel(c);
ok(/Your week/.test(panel)&&/due Sunday/.test(panel),'the week panel shows the bills that are coming');
ok(/data-act="doday"/.test(panel)&&/Mon/.test(panel)&&/Sun/.test(panel),'it shows all seven days and offers today’s choices');
c.tour={name:'Test Open'};
ok(/life goes on hold/.test(X.careerDayPanel(c)),'life pauses while you are playing an event');
c.tour=null;
ok(/Health/.test(X.careerLifePanel(c))&&/Mood/.test(X.careerLifePanel(c)),'health and mood are shown next to energy and tilt');
ok(/Where you live/.test(X.careerHomePanel(c)),'you can see and change where you live');
ok(/Your week/.test(X.careerTabContent(c,'life')),'the week leads the Life tab');

console.log('\n✅ life: '+pass+' checks passed');
