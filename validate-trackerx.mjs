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
const X=new Function(script+'\nreturn {store,app,render,trkFilter,trkFilterActive,trkFilterApply,trkFilterLabel,trkFilterBar,'+
  'trkPerf,trkOpponents,trkRecords,trkCastling,trkActivity,trkByMonth,trackerStats,trackerInsights,viewTracker,'+
  'trkPerfCard,trkRecordsCard,trkOppCard,trkCastleCard,trkHeatmap,trkMonthCard,trkTcCard,trkEndgameCard,'+
  'trkSearch,trkSortGames,trkSortKey,trkPages,trkPageNo,trkGameRow,trkGamesCard,trkCsv,csvCell,'+
  'TRK_PAGE,TRK_SORTS,TRK_TABS,TRK_PERIODS,TRK_HEAT_DAYS,tcLabel};')();
const DAY=86400000, NOW=Date.now();
function G(o){return Object.assign({src:'chesscom',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],
  color:'w',result:1,tc:'blitz',date:NOW-DAY,opp:'Rival',reason:'resigned',myRating:1500,
  oppRating:1500,rated:true,tcStr:'600',nmoves:30},o);}
const reset=()=>{X.app.trkF=null;X.app.trkQ='';X.app.trkSort='date';X.app.trkPage=0;X.app.trkMsg=null;X.app.trkTab='overview';};

/* ================= SLICING THE SET =================
   Nothing else in the tracker means anything if the filter lies about which
   games it kept. */
reset();
X.store.myGames=[
  G({tc:'blitz',color:'w',result:1,date:NOW-DAY}),
  G({tc:'blitz',color:'b',result:0,date:NOW-2*DAY}),
  G({tc:'rapid',color:'w',result:1,date:NOW-100*DAY}),
  G({tc:'rapid',color:'b',result:0,date:NOW-200*DAY,rated:false}),
  G({tc:'bullet',color:'w',result:0.5,date:NOW-400*DAY}),
];
ok(X.trkFilterActive()===false,'with nothing chosen the filter is not active');
ok(X.trkFilterApply(X.store.myGames).length===5,'and it keeps every game');
const f=X.trkFilter();
ok(f.tc===''&&f.color===''&&f.rated===false&&f.period==='all','the defaults are "everything"');
f.tc='blitz';
ok(X.trkFilterActive()===true,'choosing a time control turns it on');
ok(X.trkFilterApply(X.store.myGames).length===2,'and only that class comes through');
f.tc='';f.color='b';
ok(X.trkFilterApply(X.store.myGames).map(g=>g.color).join('')==='bb','one side keeps only that side');
f.color='';f.rated=true;
ok(X.trkFilterApply(X.store.myGames).length===4,'"rated only" drops the unrated game');
f.rated=false;f.period='30';
ok(X.trkFilterApply(X.store.myGames).length===2,'thirty days keeps only the last thirty days');
f.period='365';
ok(X.trkFilterApply(X.store.myGames).length===4,'a year keeps the year but not what came before it');
f.period='all';f.tc='rapid';f.color='w';
ok(X.trkFilterApply(X.store.myGames).length===1,'two conditions narrow together, not separately');
ok(/rapid/.test(X.trkFilterLabel())&&/as White/.test(X.trkFilterLabel()),'and the label says what was chosen ('+X.trkFilterLabel()+')');
f.rated=true;f.period='90';
ok(/rated only/.test(X.trkFilterLabel())&&/3 months/.test(X.trkFilterLabel()),'every part of it appears ('+X.trkFilterLabel()+')');
ok(X.trkFilterApply([]).length===0&&X.trkFilterApply(null).length===0,'nothing in, nothing out');
// a game with no colour recorded is White, not a third state that vanishes
reset();
ok(X.trkFilterApply([{color:undefined}]).length===1,'a game with no colour is not silently dropped');
X.trkFilter().color='w';
ok(X.trkFilterApply([{color:undefined}]).length===1,'it counts as White');

/* the bar offers only the classes actually present */
reset();
let bar=X.trkFilterBar(5,5);
ok(/blitz/.test(bar)&&/rapid/.test(bar)&&/bullet/.test(bar),'the filter bar offers the classes you have played');
ok(!/daily/.test(bar),'and not the ones you have not');
ok(/All 5 games/.test(bar),'with nothing chosen it says so');
X.trkFilter().tc='blitz';
bar=X.trkFilterBar(5,2);
ok(/<b>2<\/b> of 5 games/.test(bar),'once filtered it says how much was kept');
ok(/data-act="trkfreset"/.test(bar),'and offers a way out');

/* ================= WHAT THE RESULTS WERE WORTH =================
   Six games against 1600 from 1500: four wins, one loss, one draw.
   Performance = 1600 + 400·(4−1)/6 = 1800.
   Expected    = 6 · 1/(1+10^(100/400)) = 2.16 points; we took 4.5. */
reset();
const perfSet=[1,1,1,1,0,0.5].map(r=>G({result:r,oppRating:1600,myRating:1500}));
let P=X.trkPerf(perfSet);
ok(P!==null,'six rated games is enough to say what they were worth');
ok(P.n===6&&P.avgOpp===1600&&P.myAvg===1500,'it reads the opposition and your own rating');
ok(P.perf===1800,'the performance rating is the hand-computed 1800 (got '+P.perf+')');
ok(P.expected===2.2,'your ratings predicted 2.2 points (got '+P.expected+')');
ok(P.actual===4.5,'you took 4.5');
ok(P.over===2.3,'so you are 2.3 points to the good (got '+P.over+')');
ok(X.trkPerf(perfSet.slice(0,4))===null,'four games is not a verdict');
ok(X.trkPerf([])===null&&X.trkPerf(null)===null,'and neither is nothing');
// games where the opponent had no rating cannot contribute to a performance
ok(X.trkPerf(perfSet.slice(0,4).concat([G({oppRating:0}),G({oppRating:0})]))===null,
  'unrated opposition is left out rather than counted as zero');
let P2=X.trkPerf([1,1,1,1,1,1].map(r=>G({result:r,oppRating:1400,myRating:1500})));
ok(P2.perf===1800,'six wins against 1400 is also a 1800 performance ('+P2.perf+')');
ok(P2.expected===3.8,'but far more was expected of you against a weaker field ('+P2.expected+' points of 6)');
ok(P2.over===2.2,'so the same clean sweep counts for slightly less ('+P2.over+' against 2.3)');
let P3=X.trkPerf([0,0,0,0,0,0].map(r=>G({result:r,oppRating:1500,myRating:1500})));
ok(P3.perf===1100,'six losses to your own level reads as 1100 ('+P3.perf+')');
ok(P3.over===-3,'three points worse than predicted ('+P3.over+')');

/* ================= WHO YOU KEEP PLAYING ================= */
reset();
const oppSet=[
  G({opp:'Alice',result:1}),G({opp:'alice',result:0}),G({opp:'ALICE',result:0}),G({opp:'Alice',result:0}),
  G({opp:'Bob',result:1}),G({opp:'Bob',result:1}),G({opp:'Bob',result:1}),
  G({opp:'Carl',result:1}),G({opp:'',result:1}),
];
let O=X.trkOpponents(oppSet);
ok(O.unique===3,'the same name in different case is one person ('+O.unique+')');
ok(O.list[0].name==='Alice','and it keeps the spelling you first saw');
ok(O.repeat===2,'two of them you have met three times or more');
ok(O.nemesis&&O.nemesis.name==='Alice','the one you keep losing to is named');
ok(O.nemesis.n===4&&O.nemesis.pct===25,'with the real record (4 games, '+O.nemesis.pct+'%)');
ok(O.customer&&O.customer.name==='Bob','and the one you keep beating');
ok(O.list.every(o=>o.name!==''),'a game with no opponent name is skipped, not filed under blank');
// one repeat opponent you beat is still a customer
O=X.trkOpponents([G({opp:'Bob'}),G({opp:'Bob'}),G({opp:'Bob'})]);
ok(O.customer&&O.customer.name==='Bob','a single repeat opponent you beat still counts as one');
ok(O.nemesis===null,'and is not also called your nemesis');
// two games is not a pattern
O=X.trkOpponents([G({opp:'Dee',result:0}),G({opp:'Dee',result:0})]);
ok(O.nemesis===null&&O.repeat===0,'losing twice to someone is not yet a nemesis');
ok(O.list[0].n===2,'though the pair is still listed');
O=X.trkOpponents([G({opp:'Eve',result:0.5}),G({opp:'Eve',result:0.5}),G({opp:'Eve',result:0.5})]);
ok(O.nemesis===null&&O.customer===null,'three draws makes them neither');
ok(X.trkOpponents([]).unique===0,'no games, no opponents');
O=X.trkOpponents([G({opp:'Fay',oppRating:1600}),G({opp:'Fay',oppRating:1400}),G({opp:'Fay',oppRating:0})]);
ok(O.list[0].rating===1500,'an opponent’s rating is averaged over the games that had one ('+O.list[0].rating+')');

/* ================= RECORDS ================= */
reset();
const recSet=[
  G({result:1,nmoves:12,opp:'Short',url:'https://x/1'}),
  G({result:1,nmoves:3,opp:'Walkover'}),                       // too short to be a game
  G({result:1,nmoves:7,opp:'Quitter',reason:'abandoned'}),      // they left, you did not win it
  G({result:0,nmoves:90,opp:'Marathon',url:'https://x/2'}),
  G({result:1,nmoves:40,opp:'Normal',date:NOW-5*DAY}),
];
let R=X.trkRecords(recSet,{curve:{blitz:{max:1620},rapid:{max:1480}},acc:null});
ok(R.fastestWin.n===12,'the fastest win is the fastest real win ('+R.fastestWin.n+' moves)');
ok(R.fastestWin.opp==='Short','against the right opponent');
ok(R.longest.n===90&&R.longest.opp==='Marathon','the longest game is the longest, won or lost');
ok(R.peaks.length===2&&R.peaks[0].r===1620,'peak ratings come out highest first');
ok(R.busiest&&R.busiest.n===4,'the busiest day counts the games played on it ('+R.busiest.n+')');
R=X.trkRecords([G({result:0,nmoves:20})],{curve:{}});
ok(!R.fastestWin,'with no wins there is no fastest win rather than a wrong one');
ok(R.longest&&R.longest.n===20,'but the longest game is still known');
R=X.trkRecords([],{curve:{}});
ok(!R.fastestWin&&!R.longest&&!R.busiest,'no games, no records');

/* ================= CASTLING ================= */
reset();
const wK=G({color:'w',moves:['e4','e5','Nf3','Nc6','O-O','Bc5'],result:1});
const wQ=G({color:'w',moves:['d4','d5','Nc3','Nf6','Qd3','Bf5','Bd2','e6','O-O-O','Be7'],result:0});
const bK=G({color:'b',moves:['e4','e5','Nf3','Nf6','Bc4','O-O'],result:1});
const bQ=G({color:'b',moves:['d4','d5','Nf3','Nc6','Bf4','Qd6','e3','Bd7','Be2','O-O-O'],result:0});
const none=G({color:'w',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],result:0});
let C=X.trkCastling([wK,bK,wQ,bQ,none]);
ok(C.k.n===2&&C.k.w===2,'castling kingside is read off your own moves, for either colour');
ok(C.q.n===2&&C.q.l===2,'so is queenside');
ok(C.none.n===1,'and the games where you never castled are counted apart');
ok(C.k.pct===100&&C.q.pct===0,'each way keeps its own record');
ok(C.castledPct===80,'four of five games is 80% ('+C.castledPct+'%)');
ok(C.avgMove===4,'and the average move it happened on is your own third or fifth, averaged ('+C.avgMove+')');
// your opponent's castling is not yours
C=X.trkCastling([G({color:'w',moves:['e4','O-O','Nf3','Nc6','Bc4','Bc5']})]);
ok(C.none.n===1&&C.k.n===0,'your opponent castling does not count as you castling');
C=X.trkCastling([G({color:'w',moves:['e4','e5','Nf3','Nc6','O-O+','Bc5']})]);
ok(C.k.n===1,'a castling move that gives check is still castling');
C=X.trkCastling([G({color:'w',moves:['e4','e5','Nf3','Nc6','0-0','Bc5']})]);
ok(C.k.n===1,'and so is the one written with zeros');
C=X.trkCastling([G({color:'w',moves:['e4','e5','O-O-O','Nc6','O-O','Bc5']})]);
ok(C.q.n===1&&C.k.n===0,'only the first castling in a game counts');
ok(X.trkCastling([]).n===0,'no games, nothing to say');

/* ================= ACTIVITY ================= */
reset();
const today=new Date();today.setHours(12,0,0,0);
const act=[
  G({date:today.getTime()}),G({date:today.getTime()}),G({date:today.getTime()}),
  G({date:today.getTime()-2*DAY}),
  G({date:today.getTime()-300*DAY}),                            // outside the calendar
];
let A=X.trkActivity(act);
ok(A.span===X.TRK_HEAT_DAYS,'the calendar is the last '+X.TRK_HEAT_DAYS+' days');
ok(A.days.length===X.TRK_HEAT_DAYS,'with a cell for every one of them');
ok(A.activeDays===2,'two of those days had games ('+A.activeDays+')');
ok(A.n===4,'the game from last year is not on this calendar ('+A.n+' of 5 counted)');
ok(A.perActiveDay===2,'so the rate is 4 games over 2 days, not 5 ('+A.perActiveDay+')');
ok(A.max===3,'the busiest day inside the window had three');
ok(A.days[A.days.length-1].n===3,'today is the last cell');
ok(A.currentStreak===1,'a gap yesterday means the current run is one day');
ok(A.streak===1,'and the best run so far is one day');
A=X.trkActivity([G({date:today.getTime()}),G({date:today.getTime()-DAY}),G({date:today.getTime()-2*DAY})]);
ok(A.streak===3&&A.currentStreak===3,'three days running is a run of three');
A=X.trkActivity([G({date:today.getTime()-10*DAY}),G({date:today.getTime()-11*DAY})]);
ok(A.streak===2&&A.currentStreak===0,'a run that ended is remembered but not called current');
ok(X.trkActivity([]).activeDays===0,'no games, no days');
ok(X.trkActivity([G({date:0})]).activeDays===0,'a game with no date lands nowhere rather than in 1970');

/* ================= MONTH BY MONTH ================= */
reset();
const jan=new Date(2025,0,10,12).getTime(),feb=new Date(2025,1,10,12).getTime();
let M=X.trkByMonth([
  G({date:jan,myRating:1200,tc:'blitz',result:1}),
  G({date:jan+DAY,myRating:1230,tc:'blitz',result:1}),
  G({date:jan+2*DAY,myRating:1260,tc:'blitz',result:0}),
  G({date:jan+3*DAY,myRating:900,tc:'rapid',result:0}),         // a different ladder entirely
  G({date:jan+4*DAY,myRating:930,tc:'rapid',result:0}),
  G({date:feb,myRating:1300,tc:'blitz',result:1}),
]);
ok(M.length===2,'each month is one row');
ok(M[0].label==='Jan 2025'&&M[1].label==='Feb 2025','named and in order');
ok(M[0].n===5&&M[0].w===2&&M[0].l===3,'with that month’s record');
ok(M[0].pct===40,'and its score ('+M[0].pct+'%)');
ok(M[0].delta===60,'the month’s rating movement is +60, from the blitz games only ('+M[0].delta+')');
ok(M[0].deltaClass==='blitz','and it says which ladder that was');
ok(M[0].deltaEnd===1260,'ending where the blitz rating ended');
ok(M[1].delta===null,'a month with too few games in any one class claims no movement');
// two games is not a movement worth printing
M=X.trkByMonth([G({date:jan,myRating:1200}),G({date:jan+DAY,myRating:1400})]);
ok(M[0].delta===null,'two games is not a rating trajectory');
ok(X.trkByMonth([]).length===0,'no games, no months');
ok(X.trkByMonth([G({date:0})]).length===0,'and a game with no date is not filed under a month');

/* ================= ALL OF IT, THROUGH THE TRACKER ================= */
reset();
X.store.myGames=[];
const base=NOW-59*DAY;                 // the last two months, so the calendar has something on it
for(let i=0;i<60;i++)X.store.myGames.push(G({
  date:base+i*DAY,result:i%3===0?0:(i%7===0?0.5:1),
  color:i%2?'w':'b',tc:i<40?'blitz':'rapid',tcStr:i<40?'180':'600',
  myRating:1500+i,oppRating:1520,opp:'Rival'+(i%9),nmoves:20+(i%50),
  acc:i%4?null:80+(i%10),url:'https://x/'+i,
  moves:i%2?['e4','e5','Nf3','Nc6','O-O','Bc5']:['d4','d5','Nf3','Nf6','Bf4','Bf5'],
  ecoName:i%2?'Italian Game':'London System'}));
let S=X.trackerStats();
ok(S.n===60&&S.total===60,'the tracker reads all sixty games');
ok(S.games&&S.games.length===60,'and hands the set itself on for the game list');
ok(S.perf&&S.perf.n===60,'the performance rating covers them');
ok(S.perfByClass.blitz&&S.perfByClass.rapid,'and is worked out per time class as well');
ok(S.perfByClass.blitz.n===40&&S.perfByClass.rapid.n===20,'each over its own games');
ok(S.opponents.unique===9,'nine different opponents');
ok(S.castling.k.n===30,'castling is counted across the set');
ok(S.byMonth.length>=2,'the months are broken out');
ok(S.byTc.length===2,'the exact time controls too');
ok(/3 min/.test(S.byTc.map(b=>b.label).join(' ')),'named the way a player reads them ('+S.byTc.map(b=>b.label).join(', ')+')');
ok(S.endgame&&S.endgame.rec.n>0,'and the long games are picked out');
ok(S.records.longest&&S.records.longest.n===69,'the records are built from the same set');
ok(S.activity&&S.activity.days.length===X.TRK_HEAT_DAYS,'the calendar comes with them');

/* a filter reaches every one of those numbers, not just the headline */
X.app.trkF={tc:'blitz',color:'',rated:false,period:'all'};
let S2=X.trackerStats();
ok(S2.n===40&&S2.total===60,'filtering to blitz leaves forty of the sixty');
ok(S2.filtered===true,'and the tracker knows it is looking at a slice');
ok(S2.perf.n===40,'the performance rating follows the filter');
ok(Object.keys(S2.perfByClass).length===1,'so does the per-class breakdown');
ok(S2.games.length===40,'and so does the game list');
ok(S2.byTc.length===1,'only the time controls still in the set are shown');
reset();

/* ================= EVERY GAME, BROWSABLE ================= */
S=X.trackerStats();
ok(X.trkSearch(S.games).length===60,'with no search every game is listed');
X.app.trkQ='Rival3';
ok(X.trkSearch(S.games).every(g=>g.opp==='Rival3'),'a name finds that opponent');
ok(X.trkSearch(S.games).length===7,'all of those games ('+X.trkSearch(S.games).length+')');
X.app.trkQ='italian';
ok(X.trkSearch(S.games).length===30,'an opening name finds the opening, whatever the case');
X.app.trkQ='resigned';
ok(X.trkSearch(S.games).length===60,'how the game ended is searchable too');
X.app.trkQ='3 min';
ok(X.trkSearch(S.games).length===40,'and so is the time control as it is written on screen');
X.app.trkQ='nothing like this';
ok(X.trkSearch(S.games).length===0,'a search that matches nothing matches nothing');
X.app.trkQ='';

/* sorting */
let sorted=X.trkSortGames(S.games);
ok(sorted[0].date>sorted[sorted.length-1].date,'by default the newest game is first');
X.app.trkSort='old';
sorted=X.trkSortGames(S.games);
ok(sorted[0].date<sorted[sorted.length-1].date,'oldest first is the other way round');
X.app.trkSort='len';
ok(X.trkSortGames(S.games)[0].nmoves===69,'longest first really is the longest');
X.app.trkSort='opp';
ok(X.trkSortGames(S.games)[0].oppRating===1520,'toughest first reads the opponent rating');
X.app.trkSort='acc';
sorted=X.trkSortGames(S.games);
ok(typeof sorted[0].acc==='number','accuracy first puts an analysed game on top');
ok(sorted[sorted.length-1].acc==null,'and the games Chess.com never analysed sort last, not as zero');
X.app.trkSort='nonsense';
ok(X.trkSortKey()==='date','an unknown sort falls back to the newest');
ok(X.trkSortGames([]).length===0&&X.trkSortGames(null).length===0,'sorting nothing is safe');
X.app.trkSort='date';

/* paging */
ok(X.trkPages(60)===Math.ceil(60/X.TRK_PAGE),'sixty games make '+X.trkPages(60)+' pages of '+X.TRK_PAGE);
ok(X.trkPages(0)===1,'an empty list is still one page');
X.app.trkPage=99;
ok(X.trkPageNo(60)===X.trkPages(60)-1,'asking for a page past the end lands on the last one');
X.app.trkPage=-5;
ok(X.trkPageNo(60)===0,'and before the start on the first');
X.app.trkPage=0;

/* the rows themselves */
let row=X.trkGameRow(X.store.myGames[4]);
ok(/data-act="liveopenmine" data-val="4"/.test(row),'a row opens the right stored game on the board');
ok(/https:\/\/x\/4/.test(row),'and links out to it on Chess.com');
ok(/Rival4/.test(row),'it names the opponent');
ok(/London System/.test(row),'the opening');
ok(/24 moves/.test(row),'and how long it went');
row=X.trkGameRow(G({opp:'Nobody',url:'',result:0,acc:91.5}));
ok(!/liveopenmine/.test(row),'a game that is not in your list has no button that would open the wrong one');
ok(/91\.5%/.test(row),'accuracy is shown where Chess.com measured it');
ok(/Lost/.test(row),'and a loss says so');
row=X.trkGameRow(G({oppRating:1800,myRating:1500}));
ok(/\+300/.test(row),'a big rating gap is spelled out');
ok(!/\+20/.test(X.trkGameRow(G({oppRating:1520,myRating:1500}))),'a small one is not noise on the screen');
ok(/&lt;script&gt;/.test(X.trkGameRow(G({opp:'<script>'}))),'an opponent name is escaped, not run');

/* the card */
let card=X.trkGamesCard(S);
ok(/60 games/.test(card),'the card counts what it is showing');
ok(/data-act="trkcsv"/.test(card),'offers the download');
ok(/id="trk-q"/.test(card),'has the search box');
ok(X.TRK_SORTS.every(s=>card.indexOf('data-val="'+s[0]+'"')>=0),'and every way of sorting');
ok((card.match(/liveopenmine/g)||[]).length===X.TRK_PAGE,'one page of rows at a time ('+X.TRK_PAGE+')');
ok(/data-act="trkpage" data-val="1"/.test(card),'with a way to the next page');
ok(card.indexOf('1–'+X.TRK_PAGE+' of 60')>=0,'saying where you are in the list');
X.app.trkPage=1;
card=X.trkGamesCard(S);
ok(/data-val="0"/.test(card),'the second page can go back');
ok(/26–50 of 60/.test(card),'and knows its own range');
X.app.trkPage=0;
X.app.trkQ='no such thing';
card=X.trkGamesCard(S);
ok(/Nothing matches/.test(card),'a search with no hits says so plainly');
ok(/no such thing/.test(card),'quoting what you looked for');
ok(!/liveopenmine/.test(card),'and lists nothing');
X.app.trkQ='';
X.app.trkMsg='12 games saved as a CSV file.';
ok(/12 games saved/.test(X.trkGamesCard(S)),'after a download it confirms what was written');
X.app.trkMsg=null;

/* ================= THE SPREADSHEET ================= */
ok(X.csvCell('plain')==='plain','a plain value needs no quoting');
ok(X.csvCell('a,b')==='"a,b"','a comma is quoted');
ok(X.csvCell('say "hi"')==='"say ""hi"""','a quote is doubled and the field quoted');
ok(X.csvCell('two\nlines')==='"two\nlines"','a newline is quoted');
ok(X.csvCell(null)===''&&X.csvCell(undefined)==='','nothing writes as an empty field');
let csv=X.trkCsv([G({opp:'Smith, John',result:0,reason:'timeout',nmoves:41,acc:88.5,
  ecoName:'Caro-Kann "Defense"',date:new Date(Date.UTC(2025,4,3,10,0,0)).getTime(),
  tcStr:'180+2',tc:'blitz',color:'b',myRating:1490,oppRating:1610,rated:false,url:'https://x/9'})]);
const lines=csv.trim().split('\n');
ok(lines[0].split(',')[0]==='date','the file starts with a header row');
ok(/opponent_rating/.test(lines[0])&&/accuracy/.test(lines[0]),'naming every column');
ok(/"Smith, John"/.test(lines[1]),'a name with a comma survives the round trip');
ok(/"Caro-Kann ""Defense"""/.test(lines[1]),'and so does one with quotes in it');
ok(/2025-05-03T10:00:00/.test(lines[1]),'the date is written so a spreadsheet can read it');
ok(/,loss,/.test(lines[1])&&/lost on time/.test(lines[1]),'the result and how it ended are spelled out, not coded');
ok(/,black,/.test(lines[1]),'which colour you had');
ok(/,no,/.test(lines[1]),'and whether it counted for rating');
ok(lines.length===2,'one row per game');
ok(X.trkCsv([]).trim().split('\n').length===1,'with no games you still get the header');
ok(X.trkCsv(null).indexOf('date')===0,'and nothing at all does not throw');
csv=X.trkCsv(S.games);
ok(csv.trim().split('\n').length===61,'the whole set exports as sixty rows and a header');

/* ================= ON THE SCREEN ================= */
reset();
ok(X.TRK_TABS.length===9,'the tracker has nine tabs now');
['overview','games','results','openings','opponents','clock','activity','insights','live']
  .forEach(k=>ok(X.TRK_TABS.some(t=>t[0]===k),'including '+k));
const tabs={};
['overview','games','results','openings','opponents','clock','activity','insights'].forEach(function(k){
  X.app.trkTab=k;tabs[k]=X.viewTracker();
});
ok(/🎯 What these results are worth/.test(tabs.overview),'the overview says what the results were worth');
ok(/🗂️ Records/.test(tabs.overview),'and keeps the records');
ok(/⏲️ By exact time control/.test(tabs.overview),'and splits the exact time controls');
ok(/🗃️ Games/.test(tabs.overview),'the Games tab is reachable from anywhere');
ok(/id="trk-q"/.test(tabs.games),'the Games tab is the searchable list');
ok(/🔬 opens it on the analysis board/.test(tabs.games),'and says what the buttons do');
ok(/🔚 When it goes long/.test(tabs.results),'Results covers the long games');
ok(/📆 Month by month/.test(tabs.results),'and the months');
ok(/🏰 Castling/.test(tabs.openings),'Openings covers castling');
ok(/👥 Who you play/.test(tabs.opponents),'Opponents lists them');
ok(/🗓️ The last six months/.test(tabs.activity),'Activity draws the calendar');
ok(/heatmap/.test(tabs.activity),'as an actual heatmap');
ok(/Ranked by how much/.test(tabs.insights),'and Insights still ranks what to act on');
ok(Object.keys(tabs).every(k=>tabs[k].indexOf('data-act="trkftc"')>=0),'the filter sits above every tab');

/* the tabs that can come up empty say something rather than nothing */
X.store.myGames=[];
for(let i=0;i<10;i++)X.store.myGames.push(G({opp:'',date:base+i*DAY,myRating:0}));
X.app.trkTab='opponents';
ok(/No opponent names/.test(X.viewTracker()),'an opponents tab with no names explains itself');
X.store.myGames=[];
for(let i=0;i<10;i++)X.store.myGames.push(G({date:new Date(2019,0,1+i,12).getTime()}));
X.app.trkTab='activity';
let v=X.viewTracker();
ok(/Nothing in the last six months/.test(v),'and so does a calendar with nothing on it');
ok(!/heatmap/.test(v),'instead of drawing an empty grid');

/* a filter that keeps nothing */
X.store.myGames=[G({tc:'blitz'})];
X.app.trkF={tc:'rapid',color:'',rated:false,period:'all'};
v=X.viewTracker();
ok(/No games match that/.test(v),'a filter that keeps nothing says so');
ok(/data-act="trkfreset"/.test(v),'and offers to clear itself');
ok(/data-act="trktab"/.test(v),'while the tabs stay reachable');
reset();

/* ================= THE INSIGHTS THE NEW NUMBERS FEED ================= */
reset();
X.store.myGames=[];
// twelve games never castling, scored badly; twelve castling kingside, scored well
for(let i=0;i<12;i++)X.store.myGames.push(G({date:base+i*DAY,result:0,
  moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],opp:'A'+i}));
for(let i=0;i<12;i++)X.store.myGames.push(G({date:base+(20+i)*DAY,result:1,
  moves:['e4','e5','Nf3','Nc6','O-O','Bc5'],opp:'B'+i}));
let ins=X.trackerInsights(X.trackerStats());
ok(ins.some(x=>/never castled/.test(x.t)),'never castling shows up as something to fix');
X.store.myGames=[];
for(let i=0;i<8;i++)X.store.myGames.push(G({opp:'Nemesis',result:0,date:base+i*DAY}));
for(let i=0;i<8;i++)X.store.myGames.push(G({opp:'Other'+i,result:1,date:base+(10+i)*DAY}));
ins=X.trackerInsights(X.trackerStats());
ok(ins.some(x=>/Nemesis/.test(x.t)&&/before the next one/.test(x.t)),'so does the opponent who keeps beating you');
X.store.myGames=[];
for(let i=0;i<20;i++)X.store.myGames.push(G({tcStr:'180',result:1,date:base+i*DAY,opp:'C'+i}));
for(let i=0;i<20;i++)X.store.myGames.push(G({tcStr:'180+2',result:0,date:base+(30+i)*DAY,opp:'D'+i}));
ins=X.trackerInsights(X.trackerStats());
ok(ins.some(x=>/increment matters/.test(x.t)),'and a gap between two exact time controls');
ok(ins.every(x=>typeof x.t==='string'&&x.t.length>10),'every insight is a sentence, not a number');
reset();

/* ================= WIRED IN, NOT JUST WRITTEN ================= */
ok(/trkGamesCard\(S\)/.test(script),'the game list is actually rendered');
ok(/act==='trkcsv'\)trkExportCsv\(\)/.test(script),'the download button is connected');
ok(/act==='trksort'\)\{[^}]*render\(\)/.test(script),'sorting redraws the page');
ok(/act==='trkpage'\)\{[^}]*render\(\)/.test(script),'so does paging');
ok(/act==='trkq'\)trkSearchNow\(\)/.test(script),'and searching');
ok(/id==='trk-q'&&e\.key==='Enter'/.test(script),'pressing Enter in the search box searches');
ok(/app\.trkPage=0/.test(script),'changing the filter goes back to the first page');
ok(/\.heatmap\{/.test(html),'the heatmap has styling of its own');
ok(/\.heatcol\{/.test(html),'including the week columns');
ok(/text\/csv/.test(script),'the file is offered as a CSV, so a spreadsheet opens it');

console.log('\n✅ trackerx: '+pass+' checks passed');
