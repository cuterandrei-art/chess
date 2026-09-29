/* Your own tournament: planning it, the budget, the invitations four weeks
   out, playing it or letting the world play it, the accounts, the roll of
   winners, and what happens to it after you. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,TOURNAMENTS,EVENT_WEEK,PRIZE_FIRST,TRIP_OF,heldThisSeason,calendarEvents,tourVisible,tourLocked,'+
  'wxInit,worldRanking,worldWeek,careerCid,careerTabContent,OWN_DEF,OWN_FORMATS,ownOf,ownMine,ownFee,ownBudget,ownOffers,ownSuggest,ownAct,ownInput,ownTick,ownConfirm,worldOwnEvent,careerOwnPanel,'+
  'ownPlanOpen,ownCfgNow,ownLock,eventPlace,prizeFirst,weekOfSeason};')();
const O=()=>X.ownOf(X.store.career);

console.log('\n— before there is one —');
const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:300,
  ratingRapid:2450,ratingBlitz:2450,age:30,money:80000,fame:20,titles:['FM','IM'],season:1,weeks:5});
X.store.career=c;X.lifeInit(c);X.wxInit(c);
ok(X.TOURNAMENTS.some(t=>t.id==='own')&&!X.tourVisible(X.OWN_DEF,c),'the calendar has a place for your own tournament, hidden until there is one');
ok(X.EVENT_WEEK.own===undefined&&!Object.keys(X.EVENT_WEEK).includes('own')&&!X.calendarEvents(c).some(t=>t.own),'no week, and not on the season’s calendar');
ok(/Plan one/.test(X.careerOwnPanel(c))&&/careerOwnPanel|owncard/.test(X.careerTabContent(c,'life')),'the Life tab offers to plan one');
const kid=X.freshCareer();Object.assign(kid,{setup:true,age:12});
ok(X.careerOwnPanel(kid)==='','but not to a twelve-year-old');
ok(X.ownFee({rating:2250})===0&&X.ownFee({rating:2500})===1000&&X.ownFee({rating:2800})>=15000,'appearance fees: nothing at 2250, 💰1,000 at 2500, '+X.ownFee({rating:2800}).toLocaleString()+' at 2800');

console.log('\n— planning it —');
X.ownPlanOpen(c);const D=X.app.ownDraft;
ok(D&&D.cfg.city==='Bucharest'&&D.cfg.week>=5+4&&D.name==='Bucharest Chess Festival','a draft: your own city, a week far enough off, a name ('+D.name+', week '+D.cfg.week+')');
const fake=(k,v)=>({dataset:{own:k},value:String(v)});
X.ownInput(fake('fmt','rr'));X.ownInput(fake('fund',25000));X.ownInput(fake('level',2550));X.ownInput(fake('week',24));
ok(D.name==='Bucharest Masters'&&D.cfg.fmt==='rr','a closed round-robin: the name follows the format until you type one');
const sug=X.ownSuggest(c,D.cfg,6,0);
ok(sug.length===6&&sug.every(p=>Math.abs(p.rating-2550)<80),'suggestions near the level asked for: '+sug.slice(0,3).map(p=>p.name+' '+p.rating).join(', '));
sug.slice(0,5).forEach(p=>X.ownAct('owninv',p.id));
ok(D.cfg.invites.length===5,'five invited');
let H=X.careerOwnPanel(c);
ok(/Plan your tournament/.test(H)&&/data-own="city"/.test(H)&&/data-own="week"/.test(H)&&/The budget/.test(H)&&(H.match(/data-act="ownuninv"/g)||[]).length===5,'the planner: city, week, format, fund, sponsor, the five invited and the budget');
const B=X.ownBudget(c,D.cfg,null);
ok(B.cost===B.venue+B.arbiters+25000+B.fees&&B.fees===sug.slice(0,5).reduce((a,p)=>a+p.fee,0)&&B.entries===0,'the budget adds up: hall '+B.venue+', arbiters '+B.arbiters+', prizes 25,000, fees '+B.fees+' — nobody pays to play in a field of 2550s');
X.ownInput(fake('name','The Marín Cup'));
X.ownAct('ownsave');
let o=O();
ok(o&&o.name==='The Marín Cup'&&o.from===1&&o.org===X.careerCid(c)&&o.founder.n==='Ada Marín'&&!X.app.ownDraft,'founded: The Marín Cup, first edition this season');
ok(X.tourVisible(X.OWN_DEF,c)&&X.calendarEvents(c).some(t=>t.own)&&X.EVENT_WEEK.own===24,'on the calendar, week 24');
ok(X.tourLocked(X.OWN_DEF,c)==='invitations go out in week 20','and locked until the invitations go out in week 20');
ok(X.OWN_DEF.rr===1&&X.OWN_DEF.rounds===9&&X.OWN_DEF.name==='The Marín Cup'&&X.prizeFirst(X.OWN_DEF)===Math.round(25000*0.27),'the event is what you planned: a nine-round round-robin, first prize '+X.prizeFirst(X.OWN_DEF));

console.log('\n— four weeks out —');
c.weeks=19;X.ownTick(c);
ok(!o.conf,'week 19: nothing yet');
const m0=c.money;c.weeks=20;X.ownTick(c);
ok(o.conf&&o.conf.s===1&&o.conf.inv.length===9,'week 20: the invitations are out — nine players, the committee filled the four seats you left');
ok(c.money===m0-o.conf.paid&&o.conf.paid===Math.max(0,o.conf.budget.cost-o.conf.budget.sponsor),'the budget is committed: '+o.conf.paid.toLocaleString());
ok(/invitations for the The Marín Cup|invitations for the/.test(c.news.map(n=>n.t).join('|')),'and the news says so');

console.log('\n— you play it —');
c.weeks=24;c.day=0;c.calDone=[];c.energy=100;
ok(!X.tourLocked(X.OWN_DEF,c),'its week: open to you');
X.joinTournament('own');
const tr=c.tour;
ok(tr&&tr.id==='own'&&tr.sched&&tr.players.length===9&&tr.players.every(p=>o.conf.inv.includes(p.wid)),'you take the organiser’s seat among the nine you invited');
ok(!tr.fee&&X.eventPlace(X.OWN_DEF,c).city==='Bucharest','no entry fee for the organiser, and it is in Bucharest');
const m1=c.money;
while(c.tour)X._simRound(c);
const h=c.history[0],E=o.editions[0];
ok(h.id==='own'&&E&&E.s===1&&E.n===1&&E.you===h.place&&E.of===9,'played: the first edition is on its roll — you finished '+h.place+(E.w?', '+E.w.n+' won':''));
ok(E.org===X.careerCid(c)&&E.profit===E.inc.entries+E.inc.audience+E.inc.sponsor-E.inc.cost&&E.inc.cost===o.conf.budget.cost,
  'the accounts: '+(E.profit>=0?'a profit of ':'a loss of ')+Math.abs(E.profit).toLocaleString()+' (tickets and broadcast '+E.inc.audience.toLocaleString()+', sponsor '+E.inc.sponsor.toLocaleString()+')');
ok(c.money>=m1+E.inc.entries+E.inc.audience-50,'the takings come back to you');
ok(o.prestige!==10,'and it has a name now: prestige '+o.prestige);
H=X.careerOwnPanel(c);
ok(/Roll of winners/.test(H)&&/This year’s edition is over/.test(H),'the card: the roll of winners, and this year is done');

console.log('\n— next year, without you —');
c.season=2;c.weeks=52+5;c.calDone=[];c.money=200000;
X.ownPlanOpen(c);X.ownInput(fake('fmt','open'));X.ownInput(fake('fund',10000));X.ownInput(fake('level',2650));
X.app.ownDraft.cfg.invites=[];X.ownSuggest(c,X.app.ownDraft.cfg,2,0).forEach(p=>X.ownAct('owninv',p.id));X.ownAct('ownsave');
ok(o.cfg.fmt==='open'&&o.cfg.invites.length===2&&X.OWN_DEF.rr===0,'the plan changed: an open, with two stars on the poster');
c.weeks=52+20;X.ownTick(c);
ok(o.conf.s===2&&o.conf.avg>1800&&o.conf.entrants>=30,'the invitations are out again: about '+o.conf.entrants+' players expected, average '+o.conf.avg);
c.weeks=52+24;
X.worldWeek(c);
const E2=o.editions[0];
ok(E2.s===2&&E2.n===2&&!E2.you&&E2.w&&!E2.w.you&&E2.of===9,'its week goes by and the world plays it: '+E2.w.n+' wins the 2nd edition on '+E2.score+'/9, '+E2.entrants+' players');

console.log('\n— sponsors and prestige —');
const lo=X.ownOffers(c,{prestige:10}),hi=X.ownOffers(c,{prestige:70});
ok(lo.length<hi.length&&hi.some(x=>x.k==='tech')&&!lo.some(x=>x.k==='bank'),'a name brings bigger sponsors: '+hi.map(x=>x.n).join(', '));

console.log('\n— the money is not there —');
c.season=3;c.weeks=104+20;c.money=0;
const p0=o.prestige;X.ownTick(c);
ok(o.off===3&&!X.tourVisible(X.OWN_DEF,c)&&o.prestige===Math.max(0,p0-8),'no budget, no edition: this year’s is off, and its name suffers');

console.log('\n— a clash with a bigger event —');
c.season=4;c.weeks=156+5;c.money=500000;
o.cfg.week=X.EVENT_WEEK.norway;o.cfg.fmt='rr';o.cfg.invites=X.worldRanking(c,'classical').filter(p=>!p.you).slice(0,3).map(p=>p.id);
const rnd=Math.random;Math.random=()=>0;c.weeks=156+o.cfg.week-4;X.ownTick(c);Math.random=rnd;
ok(o.conf.s===4&&o.conf.regrets.length===3&&o.conf.inv.length===9,'the same week as Norway Chess: the three stars send regrets ('+o.conf.regrets.join(', ')+'), and others come');

console.log('\n— after you —');
const heir=X.freshCareer();Object.assign(heir,{setup:true,name:'Bea Marín',fed:'ROU',flag:'🇷🇴',age:12,season:4,weeks:c.weeks,money:0,wx:c.wx});
X.store.career=heir;
ok(!X.ownMine(heir)&&X.tourVisible(X.OWN_DEF,heir),'a career after yours in the same world: the tournament is still there, not theirs');
H=X.careerOwnPanel(heir);
ok(/founded \d{4} by Ada Marín/.test(H)&&/committee/.test(H)&&!/Take it over/.test(H),'run by a committee in the founder’s name — too young to take it over');
heir.age=19;
ok(/Take it over/.test(X.careerOwnPanel(heir)),'at nineteen they can');
X.ownAct('owntake');
ok(X.ownMine(heir)&&/Change the plan/.test(X.careerOwnPanel(heir)),'taken over: it is theirs to run');

console.log('\n✅ your own tournament: '+pass+' checks passed');
