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
const X=new Function(script+'\nreturn {store,app,render,playSnapshot,playSave,playSavedGame,playDiscardSaved,playResume,'+
  'playLive,resumeCard,resumeIsThisRound,resumeWhere,resumeAge,startPlay,tcById,turnOf,freshCareer,stopClockTick,RESUME_KEY};')();
const KEY=X.RESUME_KEY;
const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const raw=()=>{const v=localStorage.getItem(KEY);return v?JSON.parse(v):null;};

/* A game four plies in, the way the app holds one. */
function setGame(o){
  o=o||{};
  const c=new Chess();
  const sans=o.sans||['e4','e5','Nf3','Nc6'];
  const stack=[START],moves=[];
  sans.forEach(function(san){const m=c.move(san);stack.push(c.fen());moves.push({from:m.from,to:m.to,san:m.san});});
  Object.assign(X.app,{view:'play',playFen:c.fen(),_playStartFen:START,playStack:stack,playMoves:moves,
    playSide:o.side||'w',playTitle:o.title||'🏟️ Round 1 vs Tom Knox (1533)',playOpening:null,playFlip:false,
    playView:stack.length-1,playLast:null,playSel:null,playStatus:o.status||'play',
    tc:X.tcById('30+20'),clock:o.clock===null?null:{w:1799000,b:1801000,inc:20000,lastTs:0,botSide:null,botRate:0,botBudget:0,botUsed:0,botFrom:null},
    blindfold:false,c960:null,endgame:null,playBot:null,playBook:null,playBookNode:null,parkBet:o.park||null,
    careerOpp:o.careerOpp===undefined?'tour':o.careerOpp,careerElo:1533,careerTour:o.tour===undefined?true:o.tour,
    careerRoundOpp:{name:'Tom Knox',rating:1533},careerOneoff:null,careerLeague:false,
    careerHintsLeft:2,careerPrepUsed:null,careerNovelty:false,careerStudyEdge:0.4});
  X.store.career=X.store.career||X.freshCareer();
  X.store.career.tour=o.noTour?null:{id:o.tourId||'local',name:'Local Club Championship',round:o.round===undefined?0:o.round,rounds:5};
  return X.app;
}

/* ================= WHAT GETS WRITTEN DOWN ================= */
localStorage.clear();
setGame();
let g=X.playSnapshot();
ok(g&&g.v===1,'a game in progress makes a snapshot');
ok(g.moves.length===4&&g.moves[3].san==='Nc6','with every move played');
ok(g.stack.length===5,'and the position after each of them, for the repetition count');
ok(g.startFen===START,'it remembers where the game began');
ok(g.fen!==START&&new Chess(g.fen).turn()==='w','and where it has got to');
ok(g.clock.w===1799000&&g.clock.b===1801000,'both clocks are written down');
ok(g.clock.inc===20000,'increment included — a 30+20 resumes as 30+20');
ok(g.tcId==='30+20','and the time control it was played at');
ok(g.side==='w','which colour you have');
ok(g.career.tour===true&&g.career.tourId==='local'&&g.career.round===0,'and which round of which event it belongs to');
ok(g.career.hints===undefined,'a career game has no hints, so none are written down');
ok(g.career.studyEdge===0.4,'and the edge your preparation earned');

/* nothing is written for a game that is not being played */
X.app.playStatus='over';
ok(X.playSnapshot()===null,'a finished game makes no snapshot');
X.app.playStatus='play';X.app.playFen=null;
ok(X.playSnapshot()===null,'and neither does no game at all');
setGame({status:'engine'});
ok(X.playSnapshot()!==null,'a game where the engine is thinking is still a game');

/* ================= SAVING AND READING BACK ================= */
localStorage.clear();
setGame();
X.playSave();
ok(raw()!==null,'saving writes it to storage');
ok(localStorage.getItem('opening-trainer-standalone-v1')===null,
  'under its own key — a half-played game never lands inside your save file');
let back=X.playSavedGame();
ok(back&&back.moves.length===4,'and it reads back whole');
ok(back.fen===X.app.playFen,'with the same position');

/* a finished game clears it rather than lingering */
X.app.playStatus='over';
X.playSave();
ok(raw()===null,'the moment the game ends the saved copy is dropped');
ok(X.playSavedGame()===null,'so a finished game can never be offered back');

/* ================= WHAT IT REFUSES TO TRUST ================= */
const good=(function(){localStorage.clear();setGame();X.playSave();return raw();})();
const put=o=>localStorage.setItem(KEY,JSON.stringify(Object.assign({},good,o)));
put({v:99});ok(X.playSavedGame()===null,'a save from another version of the app is ignored');
put({fen:'not a fen'});ok(X.playSavedGame()===null,'so is one whose position cannot be read');
put({stack:[]});ok(X.playSavedGame()===null,'or that lost its move history');
put({side:'x'});ok(X.playSavedGame()===null,'or that does not say which colour you had');
put({moves:null});ok(X.playSavedGame()===null,'or that has no moves array at all');
localStorage.setItem(KEY,'{{{not json');
ok(X.playSavedGame()===null,'a corrupted file is ignored rather than thrown');
localStorage.removeItem(KEY);
ok(X.playSavedGame()===null,'and nothing saved is simply nothing');

/* ================= A ROUND ONLY HOLDS ONE GAME ================= */
localStorage.clear();setGame({round:0});X.playSave();
ok(X.playSavedGame()!==null,'a game saved for the round you are on comes back');
X.store.career.tour.round=1;                    // the round was simulated instead
ok(X.playSavedGame()===null,'a game for a round that has already been decided does not');
ok(raw()===null,'and it is cleaned up rather than left to rot');
localStorage.clear();setGame({round:0});X.playSave();
X.store.career.tour=null;                       // withdrew from the event
ok(X.playSavedGame()===null,'withdrawing from the event retires the game with it');
localStorage.clear();setGame({round:0});X.playSave();
X.store.career.tour={id:'other',name:'Another',round:0,rounds:9};
ok(X.playSavedGame()===null,'and a game from a different event is not offered in this one');
// a game that is not a tournament round has no slot to go stale
localStorage.clear();setGame({tour:false,careerOpp:null,noTour:true});X.playSave();
ok(X.playSavedGame()!==null,'a free game keeps no seat, so it is always resumable');

/* which round is which */
localStorage.clear();setGame({round:2,tourId:'local'});X.playSave();
ok(X.resumeIsThisRound(X.playSavedGame(),X.store.career)===true,'the round it belongs to is recognised');
ok(X.resumeIsThisRound(null,X.store.career)===false,'nothing belongs to no round');
ok(X.resumeIsThisRound(X.playSavedGame(),{tour:null})===false,'and no event means no round either');

/* ================= HOW IT DESCRIBES ITSELF ================= */
localStorage.clear();setGame();X.playSave();
let d=X.playSavedGame();
ok(/move 3/.test(X.resumeWhere(d)),'four plies in, you are about to play move 3 ('+X.resumeWhere(d)+')');
ok(/your move/.test(X.resumeWhere(d)),'and it says whose move it is');
setGame({sans:['e4','e5','Nf3']});X.playSave();
ok(/move 2 · their move/.test(X.resumeWhere(X.playSavedGame())),
  'three plies in as White, it is their move 2 ('+X.resumeWhere(X.playSavedGame())+')');
setGame({sans:[]});X.playSave();
ok(/move 1/.test(X.resumeWhere(X.playSavedGame())),'and a game with no moves yet is at move 1');
ok(X.resumeAge({at:Date.now()})==='just now','a game left seconds ago was left just now');
ok(/minutes ago/.test(X.resumeAge({at:Date.now()-15*60000})),'a quarter of an hour reads in minutes');
ok(/hours ago/.test(X.resumeAge({at:Date.now()-5*3600000})),'five hours reads in hours');
ok(/2 days ago/.test(X.resumeAge({at:Date.now()-2*86400000})),'and two days in days');

/* ================= THE OFFER ON SCREEN ================= */
localStorage.clear();setGame();X.playSave();
let card=X.resumeCard();
ok(/You have a game in progress/.test(card),'the card says what it is');
ok(/Tom Knox/.test(card),'naming the game');
ok(/data-act="presume"/.test(card),'with a button to resume');
ok(/data-act="presumediscard"/.test(card),'and one to throw it away');
ok(/left on your clock/.test(card),'it shows the clock you left it on');
ok(/30:/.test(card)||/29:/.test(card),'as a real time ('+(card.match(/\d+:\d\d/)||[''])[0]+')');
ok(X.resumeCard(true)!=='','a career game is offered on the career screen');
localStorage.clear();setGame({careerOpp:null,tour:false,noTour:true});X.playSave();
ok(X.resumeCard()!=='','a free game is offered too');
ok(X.resumeCard(true)==='','but not on the career screen, where it would make no sense');
localStorage.clear();
ok(X.resumeCard()===''&&X.resumeCard(true)==='','with nothing saved there is no card at all');

/* ================= PUTTING IT BACK ================= */
localStorage.clear();setGame();X.playSave();
const wanted=X.playSavedGame();
Object.assign(X.app,{view:'career',playFen:null,playStack:null,playMoves:null,playStatus:'over',
  careerHintsLeft:0,careerStudyEdge:0,clock:null,playBook:null});
ok(X.playResume()===true,'the game can be put back');
ok(X.app.view==='play','on the board');
ok(X.app.playFen===wanted.fen,'at the position you left');
ok(X.app.playMoves.length===4&&X.app.playMoves[3].san==='Nc6','with the moves you played');
ok(X.app.playStack.length===5,'and the history behind them');
ok(X.app.playSide==='w','you keep your colour');
ok(X.app.clock&&X.app.clock.w===1799000&&X.app.clock.b===1801000,'the clocks read what they read');
ok(X.app.clock.inc===20000,'and still carry the increment');
ok(X.app.tc&&X.app.tc.id==='30+20','the time control comes back too');
ok(X.app.careerHintsLeft===0,'and a game saved by an older version, with hints left in it, comes back without them');
ok(X.app.careerStudyEdge===0.4,'and the preparation you brought');
ok(X.app.careerRoundOpp&&X.app.careerRoundOpp.name==='Tom Knox','playing the same opponent');
ok(X.app.playStatus==='play','and it is your move, because the board says so');
ok(X.app.playView===X.app.playStack.length-1,'the board shows the live position, not an old one');
ok(X.app.playPremoves.length===0,'premoves queued before the interruption are dropped');
ok(X.app.playResult===null&&X.app.playHint===null&&X.app.oppDraw===null,
  'and so are stale results, hints and draw offers');

/* the board decides who moves, not the stored flag */
localStorage.clear();setGame({sans:['e4','e5','Nf3'],status:'play'});X.playSave();
X.playResume();
ok(X.app.playStatus==='engine','with the opponent to move it resumes as their move, whatever was written down');

/* nothing saved, nothing happens */
localStorage.clear();
ok(X.playResume()===false,'resuming nothing does nothing');

/* discarding */
setGame();X.playSave();
ok(raw()!==null,'a saved game is there');
X.playDiscardSaved();
ok(raw()===null&&X.playSavedGame()===null,'and discarding really removes it');

/* ================= WIRED IN, NOT JUST WRITTEN ================= */
ok(/if\(app\.view==='play'\)playSave\(\);/.test(script),'every redraw of the board saves the game');
const _ph=script.indexOf("'pagehide'");
ok(_ph>0&&script.slice(_ph,_ph+120).indexOf('playSave(true)')>0,
  'and the app being put away saves it with the clocks as they stand');
ok(/visibilitychange/.test(script)&&/visibilityState==='hidden'/.test(script),
  'including the phone backgrounding it, which never fires unload');
ok(/_resumeSig=null;\s*\/\/ a new game replaces any saved one/.test(script),
  'starting a new game replaces whatever was saved');
ok(/resumeIsThisRound\(playSavedGame\(\),store\.career\)&&playResume\(\)/.test(script),
  'and every way into a round resumes it rather than restarting it');
ok(/act==='presume'\)playResume\(\)/.test(script),'the resume button is connected');
ok(/act==='presumediscard'\)uiConfirm/.test(script),'and discarding asks first');
ok(/h\+=resumeCard\(true\);/.test(script),'the career screen offers it');
ok(/const rc=resumeCard\(\);/.test(script),'and so does the Play screen');
ok(/data-act="presume" title="Pick the game up/.test(script),'the round itself offers Resume in place of Play');

// resuming starts the clock, and a running clock would hold the process open
X.stopClockTick();X.app.view='career';
console.log('\n✅ resume: '+pass+' checks passed');
