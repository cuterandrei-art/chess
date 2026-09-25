/* The career screen on a phone, and the small things around it: one line and
   the tabs instead of 1.3 screens of the same block; an inbox that says what
   is waiting and takes you to it; big cards folded; a tournament list that
   shows what you can enter; a game screen that names the event; no hints in a
   career game; opponents who play the openings they are known for; a Back
   button that goes back; and a save that fails out loud. */
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
dom.window.scrollTo=()=>{};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,DEF,render,save,go,goBack,appBack,lifeInit,freshCareer,viewCareer,careerStrip,careerDashboard,careerNowCard,'+
  'careerInboxPanel,inboxItems,inboxInvites,careerAdvisor,careerJump,careerTabContent,careerTabBar,CAREER_TABS,foldOpen,FOLD_DEF,FOLD_OF,'+
  'careerAvatarPanel,careerAutoPanel,careerUnlockPanel,careerAchievementsPanel,careerSimulPanel,careerParkPanel,careerCalendarPanel,careerHomePanel,'+
  'careerTeamPanel,careerLifestylePanel,careerLobby,careerMediaPanel,careerEconomy,TOURNAMENTS,EVENT_WEEK,INVITE_EVENTS,weekOfSeason,tourLocked,'+
  'joinTournament,playHeading,playNote,startPlay,startChallenge,startLegend,buildWorld,viewPlay,playHint,tacticalEdge,PERKS,CLASS_PASSIVE,careerPrepPanel,'+
  'oppOpenings,oppBookEdge,KNOWN_REPS,REP_ELITE,BUILT,byId,bookFirst,scoutCard,engineMove,stopClockTick,saveFailBar,sponsorOffers,'+
  'compactMoney,worldRank,dashNow,SIMUL_TIERS};')();
const c0=()=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴'});X.store.career=c;X.lifeInit(c);X.app.view='career';X.app.careerTab='play';return c;};
const stripTags=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

console.log('\n— U1 · one line and the tabs, not 1.3 screens of the same block —');
let c=c0();
X.store.settings.stripOpen=false;
let V=X.viewCareer();
const iStrip=V.indexOf('class="cstrip"'),iTabs=V.indexOf('class="ctabs"');
ok(iStrip>=0&&iTabs>iStrip,'the career screen opens with one line about you, then the tabs');
ok(V.indexOf('Titles &amp; progress')<0||V.indexOf('Titles &amp; progress')>iTabs,'the titles card is not above the tabs any more');
ok(!/class="card dash" id="dashcard"/.test(V.slice(0,iTabs)),'nor the old dashboard');
c.money=1500;c.energy=100;
let st=X.careerStrip(c);
ok(/Ada Marín/.test(st)&&/♟ 0\/5/.test(st)&&/💰1,500/.test(st)&&/⚡100/.test(st),'the line: your name, your rating (or how far off one you are), your money, your energy');
c.rating=2412;c.provisional=false;c.money=254000;
st=X.careerStrip(c);
ok(/♟ 2412/.test(st)&&/💰254k/.test(st),'a published rating, and big money in short ('+X.compactMoney(254000)+', '+X.compactMoney(2300000)+')');
ok(X.compactMoney(2300000)==='2.3M'&&X.compactMoney(-450)==='−450','short money reads right both ways');
ok(/data-act="striptoggle"/.test(st)&&!/id="dashcard"/.test(st),'the detail is behind ▾');
X.store.settings.stripOpen=true;
st=X.careerStrip(c);
ok(/id="dashcard"/.test(st)&&/Classical/.test(st)&&/Rapid/.test(st)&&/Blitz/.test(st)&&/Energy/.test(st),'and opens to every rating, the money and how you are');
X.store.settings.stripOpen=false;
const bar=X.careerTabBar(c);
ok(/role="tablist"/.test(bar)&&/aria-selected="true"/.test(bar)&&/id="ctabs-at"/.test(bar),'the tabs are a tab list, with the one you are on marked');
ok(/position:sticky;top:var\(--toph/.test(html),'and they stay pinned under the top bar while a tab scrolls');
const play=X.careerTabContent(c,'play');
ok(play.indexOf('id="nowcard"')>=0&&play.indexOf('id="nowcard"')<play.indexOf('id="inboxcard"')&&play.indexOf('id="inboxcard"')<play.indexOf('id="lobbycard"'),
  'the Play tab starts with what is happening now, then the inbox, then where to play');
const prog=X.careerTabContent(c,'progress');
ok(/Titles &amp; progress/.test(prog)&&/CLASSICAL|Classical/.test(prog),'your ratings in detail and the titles card are on the Progress tab');

console.log('\n— U2 · the inbox: what is waiting, and a way to it —');
c=c0();c.rating=1900;c.provisional=false;c.fame=20;
X.store.career.lastBonusDay=null;
let I=X.inboxItems(c);
const find=(re)=>I.find(x=>re.test(x.t));
ok(find(/sponsor offer/),'a sponsor offer is in the inbox');
ok(find(/sponsor offer/).tab==='media'&&find(/sponsor offer/).id==='sponsorcard','and it goes to the sponsors card, on the Media tab');
ok(find(/daily reward/)&&find(/daily reward/).id==='dailycard','so does the daily reward, to its card');
c.sponsorRenew={name:'Kasparov Chess Foundation'.replace('Kasparov','Northwind'),perWeek:300,weeks:10};
I=X.inboxItems(c);
ok(find(/want to renew/)&&!find(/sponsor offer/),'a renewal replaces the offers: that is the question now');
c.sponsorRenew=null;
c.pressPending={event:'City Open',place:1};c.dilemma={id:'x'};c.seasonReview={season:1};
I=X.inboxItems(c);
ok(find(/press want a quote about City Open/).id==='presscard'&&find(/crossroads/).id==='dilemmacard'&&find(/season 1 review/).id==='seasoncard',
  'the press, a decision and the season review, each to its card');
c.pressPending=null;c.dilemma=null;c.seasonReview=null;
// norms: an old save has seen the ones it has; a new one is news until opened
c=c0();c.norms=[{type:'IM',event:'Old Open'}];delete c.normsSeen;X.lifeInit(c);
ok(c.normsSeen===1&&!X.inboxItems(c).some(x=>/norm/.test(x.t)),'the norms a save already had are not news');
c.norms.push({type:'GM',event:'Reykjavik Open'});
I=X.inboxItems(c);
ok(find(/New norm: GM norm at Reykjavik Open/)&&find(/New norm/).tab==='progress'&&find(/New norm/).id==='normscard','a new norm is — and goes to the norms card');
X.careerJump('progress:normscard');
ok(c.normsSeen===2&&!X.inboxItems(c).some(x=>/norm/.test(x.t))&&X.app.careerTab==='progress','going to it marks it read and opens the Progress tab');
// invitations: an invite-only event in its week, for somebody ranked high enough
c=c0();c.rating=2860;c.peak=2860;c.provisional=false;c.money=50000;c.weeks=X.EVENT_WEEK.norway-1;c.day=0;
const inv=X.inboxInvites(c);
ok(inv.some(x=>/invited to Norway Chess — enter now/.test(x.t)&&x.id==='tour-norway'),'an invitation you can take up is in the inbox, with the appearance fee ('+(inv[0]&&stripTags(inv[0].t))+')');
c.weeks=X.EVENT_WEEK.norway-3;
ok(X.inboxInvites(c).some(x=>/Norway Chess — it starts week 21 \(in 3 weeks\)/.test(x.t)),'and one a few weeks off says when');
c.weeks=X.EVENT_WEEK.norway-12;
ok(!X.inboxInvites(c).some(x=>/Norway/.test(x.t)),'but not one months away');
// in an event: a rest day, when it is worth taking
c=c0();c.rating=2300;c.provisional=false;c.money=5000;c.weeks=5;
X.joinTournament('intl');
ok(!!c.tour,'(in a nine-round open)');
c.tour.round=3;c.energy=45;
I=X.inboxItems(c);
ok(find(/Rest day before the next round — energy 45, 2 rest days left/)&&find(/Rest day/).id==='restrow','low on energy between rounds, the rest days are in the inbox');
c.energy=95;
ok(!X.inboxItems(c).some(x=>/Rest day/.test(x.t)),'fresh, they are not — nothing to answer');
c.tour=null;
// the body and the bills
c=c0();c.injury={type:'sore wrist',weeksLeft:1,sev:1};c.debt=300;c.burnout=70;c.skillPts=1;
I=X.inboxItems(c);
ok(find(/sore wrist — 1 week to heal/).tab==='life'&&find(/You owe/).id==='homecard'&&find(/Burnout 70/)&&find(/1 skill point to spend/).tab==='you','an injury, a debt, burnout and a skill point, each where it is dealt with');
const P=X.careerInboxPanel(c);
ok((P.match(/class="inrow"/g)||[]).length===I.length&&/data-act="jump" data-val="life:lifecard"/.test(P),'the inbox card has a row for each, and every row is a way to it');
const adv=X.careerAdvisor(c).filter(r=>['injury','burnout','skill'].indexOf(r.k)>=0);
ok(adv.length>=2&&!adv.some(r=>stripTags(P).indexOf(stripTags(r.t))>=0),'the manager’s advice follows, without saying again what the inbox already says');
ok(/📥<b>\d+<\/b>/.test(X.careerStrip(c))&&/data-val="play:inboxcard"/.test(X.careerStrip(c)),'the line above the tabs counts what is waiting, and goes to the inbox');

console.log('\n— U3 · big cards, folded —');
c=c0();X.store.settings.fold={};
const folded={avatar:X.careerAvatarPanel(c),auto:X.careerAutoPanel(c),unlocks:X.careerUnlockPanel(c),simul:X.careerSimulPanel(c),park:X.careerParkPanel(c),
  home:X.careerHomePanel(c),style:X.careerLifestylePanel(c)};
ok(Object.values(folded).every(h=>/data-act="fold"/.test(h)&&h.length<1800),'the avatar editor, automation, unlocks, simuls, the park, your home and the lifestyle shop open folded — a line each');
ok(!/data-act="avset"/.test(folded.avatar)&&/data-act="avrandom"/.test(folded.avatar),'folded, the avatar card keeps the button used most');
ok(/data-act="autoday"/.test(folded.auto)&&/Plan: /.test(folded.auto),'so does automation, with the plan it is on');
ok(/open to you/.test(folded.simul)||/None open/.test(folded.simul),'the simuls say how many are open');
X.store.settings.fold={avatar:true,auto:true,unlocks:true,simul:true,park:true,home:true,style:true,team:true,ach:true,cal:true};
ok(/data-act="avset"/.test(X.careerAvatarPanel(c))&&/data-act="autotoggle"/.test(X.careerAutoPanel(c))&&/Club night simul/.test(X.careerSimulPanel(c))&&/data-act="movehome"/.test(X.careerHomePanel(c)),
  'opened, each is the whole card again');
X.store.settings.fold={};
c.debt=200;
ok(/data-act="movehome"|Move in/.test(X.careerHomePanel(c)),'in debt, your home opens by itself — it is what you would change');
c.debt=0;
X.app.parkDouble={id:'x',stake:50};
ok(!/data-val="park" aria-expanded="false"/.test(X.careerParkPanel(c)),'a rematch waiting keeps the park open');
X.app.parkDouble=null;
const ach=X.careerAchievementsPanel(c);
ok(/None yet/.test(ach)&&/All \d+/.test(ach),'achievements show what you have earned, and the rest behind ▾');
// going to a folded card opens it
X.store.settings.fold={};
X.careerJump('life:autocard');
ok(X.foldOpen('auto')&&X.app.careerTab==='life','going to a folded card from the inbox or the now card opens it');
ok(X.FOLD_OF.autocard==='auto'&&Object.keys(X.FOLD_OF).every(k=>X.FOLD_DEF[X.FOLD_OF[k]]===false),'(every folded card is known by its id)');

console.log('\n— U4 · the tournament list shows what you can enter —');
c=c0();X.store.settings.lobbyFmt='all';X.app.lobbyMore={};
let L=X.careerLobby(c);
const openN=(L.match(/data-act="careerjoin"/g)||[]).length,allN=X.TOURNAMENTS.length;
ok(openN>=4&&openN<allN/2,'a new player sees the events they can enter ('+openN+' of '+allN+')');
ok(/🔒 \d+ more — they need a published rating/.test(stripTags(L)),'and the rest folded into a line that says what they are waiting for');
ok(!/Locked · needs a rating/.test(L),'instead of forty locked rows');
X.app.lobbyMore={classical:true};
ok(/Candidates Tournament/.test(X.careerLobby(c))&&/qualify: World Cup final/.test(X.careerLobby(c)),'opened, they are there, the title events saying how a place is earned');
X.store.settings.lobbyFmt='rapid';X.app.lobbyMore={};
L=X.careerLobby(c);
ok(/⚡ Rapid · /.test(L)&&!/♟ Classical · /.test(L)&&!/🔥 Blitz · /.test(L),'the filter narrows it to one format');
X.store.settings.lobbyFmt='all';
// qualified, and a few weeks off: coming up, with the week and a way there
c=c0();c.rating=2860;c.peak=2860;c.provisional=false;c.money=50000;c.weeks=X.EVENT_WEEK.norway-4;c.day=0;
L=X.careerLobby(c);
ok(/Norway Chess[\s\S]{0,400}You qualify — it starts week 21, in 4 weeks/.test(L)&&/data-act="calwait" data-val="21"/.test(L),'an event you qualify for, a few weeks off, is listed as coming up — with a way to its week');
X.careerJump('play:tour-norway');
ok(X.store.settings.lobbyFmt==='all','going to an invitation clears the filter, so it is on screen');
// the calendar: the next few
c=c0();c.rating=2300;c.provisional=false;X.store.settings.fold={};
const cal=X.careerCalendarPanel(c),rows=(cal.match(/id="cal-/g)||[]).length;
ok(rows>0&&rows<=4&&/Whole season/.test(cal),'the season calendar shows the next few events, the whole season behind ▾ ('+rows+' rows)');
X.store.settings.fold={cal:true};
ok((X.careerCalendarPanel(c).match(/id="cal-/g)||[]).length>rows,'and opens to all of it');
X.store.settings.fold={};

console.log('\n— U5 · the game screen names the game —');
c=c0();c.rating=1700;c.provisional=false;c.money=5000;
X.joinTournament('club');
X.app.careerOpp='tour';X.app.careerTour=true;X.app.pass=null;
c.tour.round=2;
ok(X.playHeading()===c.tour.emoji+' '+c.tour.name+' · round 3/'+c.tour.rounds,'a tournament game is its event and round ('+X.playHeading()+')');
c.tour.kind='match';
ok(/ · game 3\//.test(X.playHeading()),'a match game is a game of the match');
c.tour.kind=undefined;c.tour=null;
X.app.careerTour=false;X.app.careerOpp='stream';X.app.streamShow='guess';X.app.playStatus='play';
ok(/Guess the Elo · online/.test(X.playHeading())&&/rating hidden/.test(X.playNote()),'a stream is its show — and a hidden rating says so');
X.app.careerOpp='park';X.app.parkBet={id:'x',stake:40};
ok(/The chess park/.test(X.playHeading())&&/💰40 on the table/.test(X.playNote()),'the park is the park, with the stake');
X.app.careerOpp='oneoff';X.app.parkBet=null;X.app.careerLeague=true;X.app.playTitle='🛡️ Rooks vs Knights · board 1 vs FM Tom Knox (2201)';
ok(X.playHeading()==='🛡️ Rooks vs Knights · board 1','a club match is the two clubs and your board');
X.app.careerLeague=false;X.app.careerLegend='B. Fischer';
ok(X.playHeading()==='🎭 Exhibition vs B. Fischer','an exhibition is against the legend');
X.app.careerLegend=null;X.app.careerOneoff='rapid';
ok(X.playHeading()==='🎯 Rapid challenge','a challenge is a challenge');
X.app.careerOpp=null;
ok(X.playHeading()==='Play vs Stockfish','and only a free game against the engine is called that');
// the legend flag belongs to its game
c=c0();X.startLegend('fischer');
ok(X.app.careerLegend==='B. Fischer','an exhibition knows who it is against');
X.stopClockTick();
const wp=X.buildWorld().find(p=>p.real&&p.id==='giri');
X.startChallenge(wp.id);X.stopClockTick();
ok(X.app.careerLegend===null,'and the next game does not think it is one (a win there used to count as beating a legend)');
X.app.playStatus='play';X.app.playView=X.app.playStack.length-1;
let PV=X.viewPlay();
ok(!/Play vs Stockfish/.test(PV)&&/🎯 Classical challenge/.test(PV),'on screen, the heading is the game');
ok(/data-act="nav" data-val="career"/.test(PV.slice(0,600)),'and ← goes back to the career');

console.log('\n— U6 · no hints in a career game —');
ok(!/data-act="phint"/.test(PV),'a career game has no hint button');
X.app.playHint=null;await X.playHint();
ok(X.app.playHint==null,'and asking for one does nothing');
ok(X.app.careerHintsLeft===0,'there is no allowance of them any more');
X.app.careerOpp=null;
ok(/data-act="phint"/.test(X.viewPlay()),'a free game still has its 💡 Hint');
X.stopClockTick();X.app.playFen=null;X.app.view='career';
X.store.puzzle.rating=1840;c=c0();
ok(X.tacticalEdge(0)===40&&X.tacticalEdge(30)===40,'a 1840 puzzle rating makes opponents play 40 weaker, all game');
c.perks={converter:2};
ok(X.tacticalEdge(10)===40&&X.tacticalEdge(20)===64,'Killer instinct adds 12 a level once the middlegame is on (move 10)');
ok(/−12 Elo for them from move 10/.test(X.PERKS.find(p=>p.k==='converter').d)&&/10 Elo weaker/.test(X.CLASS_PASSIVE.Tactician),'the skill and the Tactician class say what they do now');
ok(/no help at the board/.test(X.careerPrepPanel(c))&&!/tactical hint/.test(X.careerPrepPanel(c)),'and the prep card says there is no help at the board, only sharpness');
X.store.puzzle.rating=1200;

console.log('\n— U7 · opponents play what they are known for —');
const R=n=>X.oppOpenings(n);
ok(R('M. Carlsen').w==='ruy-lopez'&&R('M. Carlsen').b==='sicilian-sveshnikov','Carlsen: the Ruy Lopez, and the Sveshnikov against 1.e4');
ok(R('F. Caruana').b==='petrov'&&R('H. Nakamura').b2==='kings-indian'&&R('M. Vachier-Lagrave').b2==='grunfeld','Caruana the Petroff, Nakamura the King’s Indian, Vachier-Lagrave the Grünfeld');
ok(R('B. Fischer').w==='ruy-lopez'&&R('B. Fischer').b==='sicilian-najdorf'&&R('A. Karpov').b==='caro-kann'&&R('A. Karpov').b2==='queens-indian'&&R('M. Botvinnik').b2==='dutch','the greats too: Fischer, Karpov, Botvinnik');
ok(Object.values(X.KNOWN_REPS).every(r=>Object.values(r).every(id=>X.byId.get(id))),'every known opening is one the Library teaches');
ok(Object.values(X.KNOWN_REPS).every(r=>(!r.b||X.bookFirst(X.byId.get(r.b))==='e4')&&(!r.b2||X.bookFirst(X.byId.get(r.b2))==='d4')),'and each defence answers the move it is filed under');
ok(R('M. Carlsen').known.b&&!R('A. Erigaisi').known.b,'what is not well known is not claimed');
const elite=X.buildWorld().filter(p=>!p.real&&p.r>=2550).slice(0,40);
ok(elite.every(p=>{const r=R(p.name);return X.REP_ELITE.w.includes(r.w)&&X.REP_ELITE.b.includes(r.b)&&X.REP_ELITE.b2.includes(r.b2);}),'a 2550 plays main lines');
const club=X.buildWorld().filter(p=>!p.real&&p.r<1800).map(p=>R(p.name));
ok(club.some(r=>!X.REP_ELITE.w.includes(r.w))&&club.every(r=>r.b&&r.b2),'a club player can open with anything, and still has an answer to both moves');
ok(/vs 1\.e4/.test(X.scoutCard(c,{name:'M. Carlsen',rating:2830},'Round 1'))&&/vs 1\.d4/.test(X.scoutCard(c,{name:'M. Carlsen',rating:2830},'Round 1'))&&/known for it/.test(X.scoutCard(c,{name:'M. Carlsen',rating:2830},'Round 1')),
  'scouting shows their White, their answer to 1.e4 and to 1.d4 — and what they are known for');
// the book: your first move picks their answer
c=c0();
const oe=X.oppBookEdge({name:'B. Fischer',rating:2785},'w');
ok(oe.book.id==='sicilian-najdorf'&&oe.alt&&oe.alt.id==='kings-indian','with White against Fischer: the Najdorf ready for 1.e4, the King’s Indian for 1.d4');
X.startPlay(new Chess().fen(),'w',null,'test',{careerOpp:'oneoff',careerElo:2785,roundOpp:{name:'B. Fischer',rating:2785},oneoff:'classical',book:oe.book,bookNode:oe.book.root});
X.app.playBookAlt=oe.alt;X.app.playBookAltEdge=0;
X.stopClockTick();
{const g=new Chess();const m=g.move('d4');X.app.playMoves=[{from:m.from,to:m.to,san:m.san}];X.app.playStack.push(g.fen());X.app.playFen=g.fen();X.app.playView=1;X.app.playBookNode=null;}
await X.engineMove();
X.stopClockTick();
ok(X.app.playBook&&X.app.playBook.id==='kings-indian'&&X.app.playMoves[1]&&X.app.playMoves[1].san==='Nf6','1.d4 — and Fischer answers with the King’s Indian, 1…Nf6');
X.app.playFen=null;X.app.careerOpp=null;X.app.view='career';

console.log('\n— U8 · the Back button —');
c=c0();X.app.navHist=[];X.app.view='career';X.app.careerTab='play';
X.app.menuOpen=true;
ok(X.appBack()===true&&!X.app.menuOpen,'Back closes the menu first');
X.app.newsOpen=true;ok(X.appBack()===true&&!X.app.newsOpen,'then the news board');
X.app.srch={q:'',sel:0};ok(X.appBack()===true&&!X.app.srch,'then the search');
X.app.confirm={msg:'x',onYes:()=>{}};ok(X.appBack()===true&&!X.app.confirm,'and a question it was asking');
X.go('puzzles');X.go('learn');
ok(X.appBack()===true&&X.app.view==='puzzles','then it goes back a screen');
ok(X.appBack()===true&&X.app.view==='career','and back to the career');
X.app.careerTab='media';
ok(X.appBack()===true&&X.app.careerTab==='play','then to the first career tab');
ok(X.appBack()===true&&X.app.view==='career'&&/Press Back again to leave/.test(document.getElementById('app').innerHTML),'on the career screen it asks for a second press');
ok(X.appBack()===false,'and the second press lets the app close');
X.go('puzzles');X.go('career');
ok(X.app.navHist.length===0,'arriving at the career screen from the menu starts the history again — it is home');
ok(/window\.appBack=appBack/.test(script)&&/popstate/.test(script),'the Android shell asks appBack, and a browser’s own Back does the same');
const java=readFileSync('app_project/android/app/src/main/java/com/openingtrainer/app/MainActivity.java','utf8');
ok(/onBackPressed\(\)[\s\S]{0,400}window\.appBack/.test(java)&&/"true"\.equals\(value\)/.test(java)&&!/KEYCODE_BACK/.test(java),'the app asks the page before closing');

console.log('\n— U9 · a save that fails says so —');
c=c0();
const real=dom.window.localStorage.setItem.bind(dom.window.localStorage);
const LSproto=Object.getPrototypeOf(dom.window.localStorage);const origSet=LSproto.setItem;
LSproto.setItem=function(k,v){const e=new Error('The quota has been exceeded.');e.name='QuotaExceededError';throw e;};
let threw=false;try{X.save();}catch(e){threw=true;}
ok(!threw,'a full storage no longer throws out of whatever was tapped');
ok(/Your progress was not saved/.test(X.saveFailBar())&&/storage this app is allowed on the device is full/.test(X.saveFailBar())&&/data-act="savebackup"/.test(X.saveFailBar()),'a bar says what happened, and offers a backup');
X.render();
ok(/class="savefail"/.test(document.getElementById('app').innerHTML),'on screen, over whatever you are doing');
LSproto.setItem=origSet;
X.save();
ok(X.saveFailBar()==='','it goes the moment a save works again');

console.log('\n— U10 · the small things —');
c=c0();c.fame=5;
const M=X.careerMediaPanel(c);
ok(/>🎙️ Commentate<\/button>/.test(M)&&/On air this week|No big event on air/.test(M)&&/needs fame 10 \(you have 5\)/.test(M),'the commentary button is one word; what it is for is written under it, so it never runs off the card');
ok(/Sponsors are just below; coaches are hired on the Life tab/.test(X.careerEconomy(c))&&!/sponsors above/.test(X.careerEconomy(c)),'“Off the board” points at where the sponsors actually are');

console.log('\n✅ the career screen on a phone, and the small things: '+pass+' checks passed');
X.stopClockTick();
process.exit(0);
