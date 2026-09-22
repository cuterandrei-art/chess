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
const X=new Function(script+'\nreturn {store,app,lgUser,liveNormalise,tcLabel,liveDeadline,liveAgo,liveFetch,lgFens,liveOpen,liveOpenStored,liveCur,liveSeek,liveJump,liveWatching,livePollStop,livePollEnsure,livePollTick,liveEvalOn,liveHintsOn,liveAnalyse,liveArrows,liveLoadList,trkLivePanel,trkGamesList,viewLiveGame,viewTracker,liveReview,renderBoard,analysePos,LIVE_POLL_MS,TRK_TABS};')();
const onlineFlag={v:true};
Object.defineProperty(globalThis.navigator,'onLine',{get:()=>onlineFlag.v,configurable:true});

/* ================= reading what the API sends ================= */
ok(X.lgUser('https://api.chess.com/pub/player/hikaru')==='hikaru','a player url yields the username');
ok(X.lgUser('https://api.chess.com/pub/player/hikaru/')==='hikaru','a trailing slash does not become the name');
ok(X.lgUser('')==='','and nothing yields nothing');

const PGN=(moves,extra)=>'[Event "Let\'s Play!"]\n[White "hikaru"]\n[Black "rival"]\n[Result "*"]\n'+(extra||'')+'\n'+moves;
const raw={url:'https://www.chess.com/game/daily/1',move_by:0,pgn:PGN('1. e4 e5 2. Nf3 Nc6 *'),
  time_control:'1/86400',last_activity:1700000000,rated:true,turn:'white',
  fen:'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 3 3',
  start_time:1699000000,time_class:'daily',rules:'chess',
  white:'https://api.chess.com/pub/player/hikaru',black:'https://api.chess.com/pub/player/rival'};
let g=X.liveNormalise(raw,'hikaru');
ok(g.white==='hikaru'&&g.black==='rival','both players are named');
ok(g.side==='w','the followed player’s colour is worked out');
ok(X.liveNormalise(raw,'rival').side==='b','from either side');
ok(X.liveNormalise(raw,'RIVAL').side==='b','and the case of the name does not matter');
ok(g.turn==='w','whose move it is comes across');
ok(X.liveNormalise(Object.assign({},raw,{turn:'black'}),'hikaru').turn==='b','for either colour');
ok(g.sans.join(' ')==='e4 e5 Nf3 Nc6','the moves so far are read from the PGN');
ok(g.variant===false,'a standard game is analysable');
ok(g.lastActivity===1700000000000,'timestamps are converted to milliseconds');
const v960=X.liveNormalise(Object.assign({},raw,{rules:'chess960'}),'hikaru');
ok(v960.variant===true,'chess960 is flagged as a variant rather than mis-analysed');
ok(X.liveNormalise(Object.assign({},raw,{rules:'chess',pgn:PGN('1. e4 e5 *','[Variant "Chess960"]')}),'x').variant===true,
  'and so is a variant declared only in the PGN header');
ok(X.liveNormalise(null,'x')===null,'a missing game is not turned into a broken one');

/* ================= the labels a person reads ================= */
ok(X.tcLabel('1/86400')==='1 day/move','a daily time control is put in words');
ok(X.tcLabel('1/259200')==='3 days/move','including three-day games');
ok(X.tcLabel('1/3600')==='1h/move','and hourly ones');
ok(X.tcLabel('600')==='10 min','a live time control too');
ok(X.tcLabel('180+2')==='3 min+2','with the increment');
const NOW=Date.UTC(2025,0,1,12,0,0);
ok(X.liveDeadline(NOW+3*86400000,NOW)==='3 days left','a distant deadline is given in days');
ok(X.liveDeadline(NOW+5*3600000,NOW)==='5h 0m left','a near one in hours and minutes');
ok(X.liveDeadline(NOW+90000,NOW)==='1m left','and a very near one in minutes');
ok(X.liveDeadline(NOW-1000,NOW)==='time is up','a passed deadline says so');
ok(X.liveDeadline(0,NOW)==='','no deadline prints nothing rather than nonsense');

/* ================= building the board from the moves ================= */
let b=X.lgFens(['e4','e5','Nf3']);
ok(b.fens.length===4&&b.moves.length===3,'one position per move, plus the start');
ok(b.moves[2].from==='g1'&&b.moves[2].to==='f3','each move keeps its squares, so it can be highlighted');
ok(b.fens[0]===new Chess().fen(),'the first position is the starting position');
b=X.lgFens(['e4','e5','Qxz9','Nf3']);
ok(b.moves.length===2,'an unreadable move stops the replay instead of throwing');
ok(X.lgFens([]).fens.length===1,'no moves still gives a board');

/* ================= following a live game ================= */
function stub(games){
  globalThis.fetch=async(u)=>{
    if(/\/games$/.test(String(u)))return {ok:true,status:200,json:async()=>({games:games})};
    return {ok:false,status:404,json:async()=>({})};
  };
}
stub([raw]);
let list=await X.liveFetch('hikaru');
ok(list.length===1&&list[0].white==='hikaru','a player’s games in progress are fetched');
globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({})});
let threw=null;try{await X.liveFetch('nobody');}catch(err){threw=err.message;}
ok(/no player called/.test(threw||''),'an unknown player is reported clearly');
threw=null;try{await X.liveFetch('  ');}catch(err){threw=err.message;}
ok(/username/.test(threw||''),'an empty name is refused before any request');
onlineFlag.v=false;
threw=null;try{await X.liveFetch('hikaru');}catch(err){threw=err.message;}
ok(/offline/.test(threw||''),'and following while offline is refused with a reason');
onlineFlag.v=true;

X.store.settings.liveEval=false;X.store.settings.liveHints=false;   // keep the engine out of it
stub([raw]);
X.liveOpen(X.liveNormalise(raw,'hikaru'));
ok(X.app.view==='livegame','opening a game switches to the board');
ok(X.app.live.kind==='live'&&X.app.live.user==='hikaru','and remembers which player it is following');
ok(X.app.live.pos===4,'it starts at the live position, not the first move');
ok(X.app.live.follow===true,'and follows the game');
ok(X.liveWatching()===true,'so the poll is allowed to run');

// stepping back stops following; going to the end starts again
X.liveSeek(-1);
ok(X.app.live.pos===3&&X.app.live.follow===false,'stepping back through the game stops it jumping under you');
X.liveJump(999);
ok(X.app.live.pos===4&&X.app.live.follow===true,'and returning to the end resumes following');
X.liveJump(-5);
ok(X.app.live.pos===0,'seeking past the start is clamped');
ok(X.liveCur()===new Chess().fen(),'and shows the starting position');

// the opponent moves: the board grows, and follows only if we were at the end
X.liveJump(999);
const raw2=Object.assign({},raw,{pgn:PGN('1. e4 e5 2. Nf3 Nc6 3. Bb5 *'),turn:'black'});
stub([raw2]);
await X.livePollTick();
ok(X.app.live.moves.length===5,'a new move arrives on the next poll');
ok(X.app.live.pos===5,'and the board follows it');
ok(X.app.live.turn==='b','whose move it is updates too');
X.livePollStop();
// ...but not while you are looking at an earlier position
X.liveJump(2);
const raw3=Object.assign({},raw,{pgn:PGN('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *'),turn:'white'});
stub([raw3]);
await X.livePollTick();
ok(X.app.live.moves.length===6,'later moves still arrive while you browse');
ok(X.app.live.pos===2,'but the board stays where you put it');
X.livePollStop();
// the game ends: it drops out of the in-progress list
stub([]);
await X.livePollTick();
ok(X.app.live.finished===true,'when the game leaves the in-progress list it is marked over');
ok(X.app._livePollT===null,'and the polling stops');
ok(X.liveWatching()===true,'the view is still a live one');

/* a failed poll must not break the board */
globalThis.fetch=async()=>{throw new Error('network gone');};
X.app.live.finished=false;
const before=X.app.live.moves.length;
await X.livePollTick();
ok(X.app.live.moves.length===before,'a failed poll leaves the game alone');
X.livePollStop();

/* ================= a stored game on the same board ================= */
X.store.ccAccount={src:'chesscom',user:'Me',connectedAt:1,lastSync:1,lastGameTs:1,autoSync:true};
X.store.myGames=[{src:'chesscom',moves:['d4','d5','c4','e6','Nc3'],color:'b',result:0,tc:'blitz',
  date:Date.now()-3600000,opp:'Rival',reason:'checkmated',myRating:1500,oppRating:1560,rated:true,
  tcStr:'600',nmoves:3,acc:74.2,oppAcc:88.1,ecoName:'Queens Gambit Declined',eco:'D30',url:'https://x/1'}];
X.liveOpenStored(0);
ok(X.app.view==='livegame'&&X.app.live.kind==='game','a stored game opens on the same board');
ok(X.app.live.white==='Rival'&&X.app.live.black==='Me','the colours are the way they were played');
ok(X.app.live.side==='b','and the board knows which side you were');
ok(X.app.live.pos===0,'a finished game starts at move one, so you can play through it');
ok(X.liveWatching()===false,'a finished game is not polled');
ok(X.app.live.result==='lost'&&/checkmated/.test(X.viewLiveGame()),'how it ended is shown');
ok(/74.2%/.test(X.viewLiveGame()),'and Chess.com’s own accuracy for it');
X.liveOpenStored(99);
ok(X.app.live.kind==='game','asking for a game that is not there changes nothing');

/* ================= the engine switches ================= */
X.store.settings.liveEval=true;X.store.settings.liveHints=true;
ok(X.liveEvalOn()&&X.liveHintsOn(),'both switches are on out of the box');
X.store.settings.liveEval=false;
ok(!X.liveEvalOn()&&X.liveHintsOn(),'they are independent');
X.store.settings.liveHints=false;
let h=X.viewLiveGame();
ok(/Eval bar: off/.test(h)&&/Suggestions: off/.test(h),'the buttons report their state');
ok(/The engine is off/.test(h),'with both off the board says so rather than looking broken');
X.store.settings.liveEval=true;X.store.settings.liveHints=true;
h=X.viewLiveGame();
ok(/Eval bar: on/.test(h)&&/Suggestions: on/.test(h),'and when on');
ok(/Engine thinking/.test(h),'while nothing has come back yet');
X.app.liveEngErr=true;
ok(/could not load/.test(X.viewLiveGame()),'a missing engine is explained, not silently blank');
X.app.liveEngErr=false;

/* suggestions become arrows, best first */
X.app.liveLines=[{t:'cp',v:30,stm:'w',sans:['e4','e5'],from:'e2',to:'e4'},
                 {t:'cp',v:20,stm:'w',sans:['d4'],from:'d2',to:'d4'},
                 {t:'cp',v:10,stm:'w',sans:['Nf3'],from:'g1',to:'f3'}];
let ar=X.liveArrows();
ok(ar.length===3,'each engine line gets an arrow');
ok(ar[0].from==='e2'&&ar[0].to==='e4','pointing at the move it means');
ok(ar[0].w>ar[1].w&&ar[0].op>ar[1].op,'and the best move is drawn boldest');
ok(ar[0].col!==ar[1].col&&ar[1].col!==ar[2].col,'each with its own colour, so the list and the board agree');
X.store.settings.liveHints=false;
ok(X.liveArrows().length===0,'turning suggestions off takes the arrows off the board');
X.store.settings.liveHints=true;
X.app.liveLines=[];X.app.liveBest={san:'e4',from:'e2',to:'e4'};
ok(X.liveArrows().length===1,'with no lines the best move alone is still shown');
X.app.liveLines=[];X.app.liveBest=null;
ok(X.liveArrows().length===0,'and nothing at all draws nothing');
// the arrows really reach the board
const bh=X.renderBoard(new Chess().fen(),'white',{interactive:false,arrows:[{from:'e2',to:'e4',col:'#22c55e'}]});
ok(/<svg/.test(bh)&&/#22c55e/.test(bh),'the board draws the arrow it is given');
ok(X.renderBoard(new Chess().fen(),'white',{interactive:false}).indexOf('eah0')<0,'and draws none when given none');
ok(X.renderBoard(new Chess().fen(),'white',{interactive:false,arrows:[{from:'zz',to:'e4'}]}).indexOf('eah0')<0,
  'a nonsense square is dropped rather than drawn wrong');

/* the analyser can be forced past the global eval setting, which is what the switches rely on */
X.store.settings.showEval=false;
let got='none';
X.analysePos(new Chess().fen(),()=>{got='called';});
ok(got==='called','with the global setting off and no force, analysis returns empty at once');
ok(/force:true/.test(String(X.liveAnalyse)),'while the live board forces it on, so its own switches decide');

/* ================= the tracker tab ================= */
ok(X.TRK_TABS.some(t=>t[0]==='live'),'the tracker has a Live tab');
X.app.liveUser=null;X.app.liveList=null;X.app.liveErr=null;
h=X.trkLivePanel();
ok(/Follow a player/.test(h),'which offers to follow a player');
ok(/daily/.test(h)&&/not published until they finish/.test(h),
  'and states plainly what Chess.com does and does not publish live');
ok(/value="Me"/.test(h),'the connected account is filled in for you');
X.app.liveList=[X.liveNormalise(raw,'hikaru'),X.liveNormalise(Object.assign({},raw,{url:'u2',rules:'chess960'}),'hikaru')];
X.app.liveUser='hikaru';
h=X.trkLivePanel();
ok(/2 games in progress/.test(h),'the games in progress are listed');
ok(/data-act="liveopen" data-val="0"/.test(h),'a standard game can be opened');
ok(!/data-act="liveopen" data-val="1"/.test(h),'a variant cannot');
ok(/one is a variant the engine cannot read/.test(h),'and the reason is given, in English that counts properly');
X.app.liveList=[X.liveNormalise(raw,'hikaru'),X.liveNormalise(Object.assign({},raw,{url:'u2',rules:'chess960'}),'hikaru'),
                X.liveNormalise(Object.assign({},raw,{url:'u3',rules:'bughouse'}),'hikaru')];
ok(/2 are variants/.test(X.trkLivePanel()),'and switches to the plural when there are two');
X.app.liveList=X.app.liveList.slice(0,2);
ok(/Refreshes itself every 30 seconds/.test(h),'the list says it refreshes itself');
X.app.liveList=[];
ok(/no daily game running/.test(X.trkLivePanel()),'no games in progress is stated, not left blank');
X.app.liveList=null;X.app.liveErr='Chess.com has no player called “zz”.';
ok(/no player called/.test(X.trkLivePanel()),'an error from the API is shown');
X.app.liveErr=null;
onlineFlag.v=false;
h=X.trkLivePanel();
ok(/Offline/.test(h)&&/disabled/.test(h),'offline, the tab says so and the button is dead');
ok(/still analyse without it/.test(h),'while pointing out that stored games still work');
onlineFlag.v=true;

/* the stored-games list is the way in when nobody is playing daily */
h=X.trkGamesList(10);
ok(/tap one to analyse it/.test(h),'your own games are listed to analyse');
ok(/data-act="liveopenmine" data-val="0"/.test(h),'each one opens on the board');
ok(/Rival/.test(h)&&/Lost/.test(h),'showing who and how it went');
X.store.myGames=[];
ok(X.trkGamesList(10)==='','with no games stored the list is left out entirely');

/* ================= wiring ================= */
ok(/app\.view==='livegame'\)body=viewLiveGame\(\)/.test(script),'the board is routed');
for(const act of ['livego','liveopen','liveopenmine','liveseek','liveto','liveflip','liveevaltog','livehinttog','liverefresh','livereview'])
  ok(new RegExp("act==='"+act+"'").test(script),'the '+act+' button is wired');
ok(/if\(view!=='livegame'&&view!=='tracker'\)livePollStop\(\)/.test(script),'navigating away stops the polling');
ok(/liveEval:true,liveHints:true/.test(script),'the switches have defaults that survive a reload');
ok(X.LIVE_POLL_MS>=15000,'the poll is gentle on a public API ('+(X.LIVE_POLL_MS/1000)+'s)');
// a pending poll must not be pushed back by every redraw
X.app.view='tracker';X.app.trkTab='live';X.app._livePollT=null;
X.livePollEnsure();const t1=X.app._livePollT;
X.livePollEnsure();
ok(X.app._livePollT===t1,'redrawing the screen does not postpone the next refresh');
X.livePollStop();
X.app.view='library';
X.livePollEnsure();
ok(!X.app._livePollT,'and nothing is scheduled from a screen that is not watching');

console.log('\n✅ live: '+pass+' checks passed');
