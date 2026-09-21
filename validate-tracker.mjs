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
const X=new Function(script+'\nreturn {store,app,ccTimeCtl,pgnClocks,gameTimeStats,trkPct,trkReasonLabel,trackerStats,trackerInsights,viewTracker,trkProfileCard,impFetchChessCom,ccFetchProfile,runImport,CC_CLASSES};')();

/* ================= clock arithmetic ================= */
ok(X.ccTimeCtl('600').base===600&&X.ccTimeCtl('600').inc===0,'a plain time control is parsed');
ok(X.ccTimeCtl('180+2').base===180&&X.ccTimeCtl('180+2').inc===2,'an increment is parsed');
ok(X.ccTimeCtl('1/259200').daily===true,'a daily game is recognised and excluded from clock maths');
const PGN=`[Event "Live Chess"]\n[White "opp"]\n[Black "me"]\n[Result "0-1"]\n[TimeControl "600"]\n\n1. e4 {[%clk 0:09:55]} e5 {[%clk 0:09:50]} 2. Nf3 {[%clk 0:09:40]} Nc6 {[%clk 0:09:30]} 3. Bc4 {[%clk 0:09:20]} Qf6 {[%clk 0:08:00]} 0-1`;
ok(X.pgnClocks(PGN).join(',')==='595,590,580,570,560,480','clock comments are read in move order');
const ts=X.gameTimeStats(PGN,'b','600');
// Black had 590, 570, 480 left; from a 600s base that is 10s, 20s then 90s
ok(ts&&ts.avgSec===40,'seconds per move are computed from the clock drops (got '+(ts&&ts.avgSec)+', expected 40)');
ok(ts.maxSec===90,'the longest single think is found');
ok(ts.endSec===480,'and what you had left at the end');
ok(X.gameTimeStats(PGN,'b','1/259200')===null,'daily games yield no clock stats rather than nonsense');
ok(X.gameTimeStats('1. e4 e5','w','600')===null,'a PGN with no clocks yields none');
const incPGN=`[TimeControl "60+1"]\n\n1. e4 {[%clk 0:00:59]} e5 {[%clk 0:00:59]} 2. Nf3 {[%clk 0:00:57]} Nc6 {[%clk 0:00:58]}`;
const inc=X.gameTimeStats(incPGN,'w','60+1');
ok(inc&&inc.avgSec>0,'the increment is added back before measuring time spent');

/* ================= the statistics ================= */
ok(X.trkPct(5,2,10)===60,'score percentage counts a draw as a half');
ok(X.trkReasonLabel('timeout')==='lost on time'&&X.trkReasonLabel('checkmated')==='checkmated','result codes are put into English');
X.store.myGames=[];
ok(X.trackerStats().n===0,'no games means no statistics');
ok(/No games loaded yet/.test(X.viewTracker()),'and the view says so instead of breaking');

// a controlled set: 20 games, known properties
const HOUR=3600000, DAY=86400000;
const base=new Date(2024,5,3,14,0,0).getTime();   // a Monday afternoon
function g(o){return Object.assign({src:'chesscom',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5'],
  color:'w',result:1,tc:'blitz',date:base,opp:'x',reason:'win',myRating:1500,oppRating:1500,
  rated:true,tcStr:'600',nmoves:30,acc:80,oppAcc:70,ecoName:'Italian Game',eco:'C50',
  avgSec:8,endSec:300,maxSec:30,base:600},o);}
X.store.myGames=[
  // 6 wins as White, 2 losses as White (one on time)
  g({}),g({}),g({}),g({}),g({}),g({}),
  g({result:0,reason:'resigned'}),g({result:0,reason:'timeout'}),
  // as Black: 2 wins, 6 losses -> a clear colour gap
  g({color:'b',result:1}),g({color:'b',result:1}),
  g({color:'b',result:0,reason:'timeout'}),g({color:'b',result:0,reason:'timeout'}),
  g({color:'b',result:0,reason:'timeout'}),g({color:'b',result:0,reason:'resigned'}),
  g({color:'b',result:0,reason:'checkmated'}),g({color:'b',result:0.5,reason:'agreed'}),
  // a rapid game, a stronger opponent, and one played at 3am
  g({tc:'rapid'}),g({oppRating:1700}),g({date:new Date(2024,5,4,3,0,0).getTime()}),
  g({oppRating:1300,result:0,reason:'resigned'}),
];
const S=X.trackerStats();
ok(S.n===20,'every game is counted ('+S.n+')');
ok(S.all.w===11&&S.all.l===8&&S.all.d===1,'wins, draws and losses are tallied (11/1/8)');
ok(S.pct===X.trkPct(11,1,20),'the overall score matches the tally');
ok(S.byColour.w.n===12&&S.byColour.b.n===8,'games are split by colour (12 White, 8 Black)');
ok(S.colourGap>20,'a lopsided colour split shows up as a big gap ('+S.colourGap+')');
ok(S.byClass.length===2&&S.byClass[0].key==='blitz','time controls are grouped, commonest first');
ok(S.lossWays.some(x=>x.k==='timeout'&&x.n===4),'the four time losses are counted');
ok(S.timeoutPct===50,'and expressed as a share of all losses ('+S.timeoutPct+'%)');
ok(S.winWays.some(x=>x.k==='win'),'wins are grouped by how they came');
ok(S.drawWays.some(x=>x.k==='agreed'),'so are draws');
ok(S.acc&&S.acc.n===20&&S.acc.avg===80,'accuracy is averaged where the API supplied it');
ok(S.acc.wins===80&&S.acc.losses===80,'and split by result');
ok(S.acc.opp===70,'including your opponents’ accuracy');
ok(S.oppAvg>1400&&S.oppAvg<1600,'average opponent rating is computed ('+S.oppAvg+')');
ok(S.vsStronger.n===1&&S.vsWeaker.n===1,'opponents are banded by rating difference');
ok(S.streaks.bestWin===6,'the longest winning run is found ('+S.streaks.bestWin+')');
ok(S.streaks.worstLoss>=3,'and the longest losing run ('+S.streaks.worstLoss+')');
ok(S.byHour.some(b=>b.h===3&&b.n===1)&&S.byHour.some(b=>b.h===14),'games are bucketed by local hour');
ok(S.byDay.some(b=>b.name==='Monday'),'and by day of the week');
ok(S.len&&S.len.avg===30,'game length is averaged');
ok(S.byLength.some(b=>b.label==='21–40'),'and bucketed');
ok(S.time&&S.time.avgSec===8,'seconds per move is averaged across games');
ok(S.time.scrambles===0,'no game here finished in a scramble, and none is claimed');
ok(S.firstMoves.length===1&&S.firstMoves[0].key==='e4','your first move as White is tallied');
ok(S.replies.e4.length===1&&S.replies.e4[0].key==='e5','so is your answer to 1.e4');
ok(S.byEco.length===1&&S.byEco[0].name==='Italian Game','openings are grouped by the API’s own name');
ok(S.curve.blitz&&S.curve.blitz.n>=2,'a rating curve is built per time class');
ok(S.sessions&&S.sessions.n>=2,'games are grouped into sittings');

/* ================= insights ================= */
const ins=X.trackerInsights(S);
ok(ins.length>=2,'insights are produced ('+ins.length+')');
ok(ins.some(i=>/better as White/.test(i.t)),'the colour gap is called out');
ok(ins.some(i=>/lose on time/.test(i.t)),'so is the clock habit');
ok(ins[0].w>=ins[ins.length-1].w,'insights come ranked by how much they matter');
ok(X.trackerInsights({n:0}).length===0,'no games means no claims');
// a small sample must not produce confident statements
X.store.myGames=[g({}),g({result:0})];
const tiny=X.trackerInsights(X.trackerStats());
ok(!tiny.some(i=>/After a win/.test(i.t)),'tilt is not asserted from two games');
ok(!tiny.some(i=>/session/.test(i.t)),'nor is session fatigue');

/* ================= the view ================= */
X.store.myGames=[];for(let i=0;i<20;i++)X.store.myGames.push(g({color:i%2?'w':'b',result:i%3===0?0:1,date:base+i*HOUR/4}));
X.store.ccProfile={profile:{username:'testuser',name:'Test User',avatar:'https://x/y.jpg',followers:12,joined:1400000000,last_online:Math.floor(Date.now()/1000),league:'Silver',url:'https://www.chess.com/member/testuser',title:'GM',verified:true},
  stats:{chess_blitz:{last:{rating:1560},best:{rating:1620},record:{win:442,loss:339,draw:33,timeout_percent:2}},tactics:{highest:{rating:2096}},puzzle_rush:{best:{score:40,total_attempts:43}},fide:1707},
  country:{name:'United States'}};
const card=X.trkProfileCard();
ok(/testuser/.test(card)&&/Test User/.test(card),'the profile card shows the account');
ok(/GM/.test(card)&&/United States/.test(card)&&/Silver/.test(card),'with title, country and league');
ok(/1560/.test(card)&&/best 1620/.test(card)&&/442W/.test(card),'and the ratings and record from the API');
ok(/Puzzles best 2096/.test(card)&&/Puzzle Rush 40/.test(card)&&/FIDE 1707/.test(card),'plus puzzles, puzzle rush and FIDE');
ok(/chess\.com\/member\/testuser/.test(card),'and links out to the real profile');
for(const t of ['overview','results','openings','clock','insights']){
  X.app.trkTab=t;
  const v=X.viewTracker();
  ok(v.length>800&&/Chess\.com tracker/.test(v),'the '+t+' tab renders');
}
X.app.trkTab='overview';
ok(/By colour/.test(X.viewTracker())&&/By time control/.test(X.viewTracker()),'the overview covers colour and time control');
X.app.trkTab='clock';
ok(/By hour of day/.test(X.viewTracker()),'the clock tab charts the hours you play');
ok(/Grey means too few to judge/.test(X.viewTracker()),'and admits when a bucket is too small to read');
ok(/app\.view==='tracker'\)body=viewTracker\(\)/.test(script),'the tracker is routed');
ok(/\['tracker','📡','Chess\.com tracker'/.test(script),'and reachable from the Learn hub');
ok(/accuracies/.test(script)&&/oppAcc/.test(script),'the importer keeps the accuracies the API gives it');
// exercise the profile fetch for real against a stub
const calls=[];
globalThis.fetch=async(u)=>{calls.push(String(u));
  if(/\/stats$/.test(u))return {ok:true,status:200,json:async()=>({chess_blitz:{last:{rating:1500}}})};
  if(/pub\/country\//.test(u))return {ok:true,status:200,json:async()=>({name:'Norway'})};
  return {ok:true,status:200,json:async()=>({username:'x',country:'https://api.chess.com/pub/country/NO'})};
};
const fetched=await X.ccFetchProfile('x');
ok(calls.length===3,'the profile fetch makes three calls: player, stats and country');
ok(fetched.profile.username==='x'&&fetched.stats.chess_blitz&&fetched.country.name==='Norway','and returns all three');
globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({})});
let pthrew=null; try{await X.ccFetchProfile('nobody');}catch(err){pthrew=err.message;}
ok(/no player called/.test(pthrew||''),'an unknown account is reported clearly');
globalThis.fetch=async(u)=>/\/stats$/.test(u)?{ok:false,status:500,json:async()=>({})}
  :{ok:true,status:200,json:async()=>({username:'x'})};
const partial=await X.ccFetchProfile('x');
ok(partial&&partial.profile.username==='x'&&Object.keys(partial.stats).length===0,'a failing stats call degrades to an empty stats block rather than losing the profile');

console.log('\n✅ tracker: '+pass+' checks passed');
