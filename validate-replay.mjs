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
const X=new Function(script+'\nreturn {store,app,replayable,replaySpent,replayClocks,replayTypical,replayLong,fmtSecs,replayStart,replayStop,replayToggle,replaySpeed,replayStep,replaySchedule,replayPanel,replayElapsed,liveOpenStored,viewLiveGame,pgnClocks,ccTimeCtl,impFetchChessCom,REPLAY_CAP};')();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* A 10+0 blitz game. Clock readings after each ply, whole seconds.
   White: 600→595 (5s), 590→? ; Black: 600→598 (2s) … */
const CLK=[595,598,585,596,545,590,543,585,541,520];     // 10 plies
const MOVES=['e4','e5','Nf3','Nc6','Bc4','Bc5','d3','d6','Nc3','Nf6'];
function game(o){return Object.assign({src:'chesscom',moves:MOVES,color:'w',result:1,tc:'blitz',
  date:Date.now()-3600000,opp:'Rival',reason:'resigned',myRating:1500,oppRating:1490,rated:true,
  tcStr:'600',nmoves:5,clk:CLK.slice(),inc:0,base:600,url:'https://x/1'},o);}

/* ================= reading the clocks ================= */
X.store.myGames=[game()];
X.liveOpenStored(0);
let L=X.app.live;
ok(X.replayable(L)===true,'a blitz game with clock readings can be watched back');
ok(L.clk&&L.clk.length===10,'the readings come through to the board');
ok(L.base===600&&L.inc===0,'along with the time control');
// White started on 600 and had 595 after move 1 → five seconds
ok(X.replaySpent(L,1)===5,'the first move’s time is the drop from the starting clock ('+X.replaySpent(L,1)+'s)');
ok(X.replaySpent(L,2)===2,'and Black’s first move likewise ('+X.replaySpent(L,2)+'s)');
// White 595 → 585 on move 2 = 10s
ok(X.replaySpent(L,3)===10,'later moves compare against that player’s previous reading, not the other one');
ok(X.replaySpent(L,5)===40,'a long think shows up as a long think ('+X.replaySpent(L,5)+'s)');
ok(X.replaySpent(L,0)===null&&X.replaySpent(L,99)===null,'asking outside the game gives nothing');
ok(X.replaySpent({clk:null},1)===null,'and a game with no readings gives nothing');

/* the increment is added back before measuring */
const inc=Object.assign({},L,{clk:[602,602],base:600,inc:5});
ok(X.replaySpent(inc,1)===3,'with an increment, the time spent is the drop plus the increment ('+X.replaySpent(inc,1)+'s)');

/* ================= the clocks on screen ================= */
let c=X.replayClocks(L,0);
ok(c.w===600&&c.b===600,'before a move is played both clocks read the full time');
c=X.replayClocks(L,1);
ok(c.w===595&&c.b===600,'after White’s first move only White’s clock has moved');
c=X.replayClocks(L,2);
ok(c.w===595&&c.b===598,'then Black’s');
c=X.replayClocks(L,10);
ok(c.w===541&&c.b===520,'at the end they read what the players finished on');
ok(X.replayClocks({clk:null},3)===null,'with no readings there are no clocks to show');

/* ================= spotting the long think ================= */
const med=X.replayTypical(L,'w');
ok(med!=null,'a typical move time can be worked out for a player');
ok(X.replayLong(L,5)===true,'the forty-second think is flagged as one ('+X.replaySpent(L,5)+'s vs a typical '+med+'s)');
ok(X.replayLong(L,1)===false,'a five-second move is not');
ok(X.replayTypical({clk:[1,2]},'w')===null,'too few moves to judge means no judgement');

ok(X.fmtSecs(5)==='5s'&&X.fmtSecs(45)==='45s','seconds are written as seconds');
ok(X.fmtSecs(90)==='1:30','and over a minute as minutes and seconds');
ok(X.fmtSecs(3.4)==='3.4s','a short move keeps its tenth');
ok(X.fmtSecs(null)==='','nothing formats to nothing');

/* ================= what cannot be replayed ================= */
X.store.myGames=[game({clk:null})];
X.liveOpenStored(0);
ok(X.replayable(X.app.live)===false,'a game imported before the clocks were kept cannot be replayed');
let p=X.replayPanel();
ok(/imported before the clocks were kept/.test(p),'and says so');
ok(/Sync your games again/.test(p),'pointing at the fix');
ok(!/data-act="replaytoggle"/.test(p),'with no button that would do nothing');
X.store.myGames=[game({clk:null,tcStr:'1/86400',tc:'daily'})];
X.liveOpenStored(0);
p=X.replayPanel();
ok(/played over days/.test(p),'a daily game explains that there is no pace to watch');

/* ================= running it ================= */
X.store.myGames=[game()];
X.liveOpenStored(0);
L=X.app.live;
ok(L.pos===0,'a stored game opens at the start');
p=X.replayPanel();
ok(/Watch it back/.test(p),'the button offers to play it');
ok(/×1/.test(p)&&/×8/.test(p),'with speeds to choose from');
ok(/600/.test(p)||/10:00/.test(p),'and both clocks showing');

X.replayStart();
ok(!!X.app.live.replay,'starting sets it running');
ok(X.app.live.follow===false,'and stops it jumping to the live position');
ok(/Pause/.test(X.replayPanel()),'the button turns into a pause');
await sleep(120);
ok(X.app.live.pos===0,'a five-second move is not shown instantly');
// wind the wait down so the test does not sit through the real game
X.app.live.replay.speed=1000;
X.replaySchedule();
await sleep(200);
ok(X.app.live.pos>0,'at speed the moves do arrive ('+X.app.live.pos+')');
const at=X.app.live.pos;
X.replayStop();
await sleep(150);
ok(X.app.live.pos===at,'pausing stops it where it is');
ok(!X.app.live.replay,'and clears the run');
ok(!X.app._replayTick,'including the ticking clock');

/* it plays to the end and stops there */
X.liveOpenStored(0);
X.app.replaySpeed=1000;
X.replayStart();
for(let i=0;i<40&&X.app.live.replay;i++)await sleep(60);
ok(X.app.live.pos===X.app.live.fens.length-1,'it runs to the last move ('+X.app.live.pos+')');
ok(!X.app.live.replay,'and stops itself there');
ok(!X.app._replayTick,'leaving no timer behind');
/* pressing play again on a finished game starts it over */
X.replayStart();
ok(X.app.live.pos===0,'playing a finished game again starts from the beginning');
X.replayStop();

/* speed is remembered and applied live */
X.replaySpeed(4);
ok(X.app.replaySpeed===4,'the chosen speed is kept');
X.replayStart();
ok(X.app.live.replay.speed===4,'and used by the next run');
X.replaySpeed(2);
ok(X.app.live.replay.speed===2,'changing it mid-run takes effect at once');
X.replayStop();

/* stepping by hand stops the replay rather than fighting it */
ok(/act==='liveseek'\)\{replayStop\(\)/.test(script),'stepping a move by hand stops the replay');
ok(/act==='liveto'\)\{replayStop\(\)/.test(script),'and so does jumping');
ok(/if\(view!=='livegame'\)replayStop\(\)/.test(script),'leaving the board stops it too');

/* ================= the panel while running ================= */
X.liveOpenStored(0);
X.app.replaySpeed=1;
X.replayStart();
p=X.replayPanel();
ok(/Pause/.test(p),'while running the panel offers to pause');
ok(X.replayElapsed()>=0,'and the think can be measured as it goes');
X.app.live.pos=5;
p=X.replayPanel();
ok(/that move took/.test(p),'it names how long the move on screen took');
ok(/🐢/.test(p),'and marks the long one');
X.replayStop();

/* ================= the importer keeps the readings ================= */
ok(/clk:_ctc\.daily\?null:/.test(script),'the importer stores clock readings for live games only');
ok(/inc:_ctc\.inc\|\|0/.test(script),'and the increment they need to be read');
ok(/clk:g\.clk\|\|null/.test(script),'the board picks them up from the stored game');
ok(X.pgnClocks('1. e4 {[%clk 0:09:55]} e5 {[%clk 0:09:50.5]}').join(',')==='595,590.5',
  'clock comments are parsed, tenths and all');
ok(X.ccTimeCtl('1/86400').daily===true,'daily games are recognised so no readings are kept for them');
ok(X.REPLAY_CAP>0&&X.REPLAY_CAP<=30,'the longest real wait is capped at something bearable ('+X.REPLAY_CAP+'s)');

console.log('\n✅ replay: '+pass+' checks passed');
