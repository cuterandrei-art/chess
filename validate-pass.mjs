// Pass-and-play: two people, one device, no engine.   node validate-pass.mjs
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Chess } from 'chess.js';
const html = readFileSync('work/openingtrainer.html', 'utf8');
const s = html.indexOf('<script type="module">') + '<script type="module">'.length, e = html.indexOf('</script>', s);
let script = html.slice(s, e); if (/^\s*import\s/m.test(script)) script = script.replace(/^\s*import\s[^\n]*\n/gm, '');
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'https://example.test/' });
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
globalThis.Chess=Chess; globalThis.confirm=()=>true; globalThis.alert=()=>{}; globalThis.requestAnimationFrame=(f)=>setTimeout(f,0);
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
dom.window.__PUZZLES=[];
if(!globalThis.navigator||typeof globalThis.navigator!=='object')globalThis.navigator={};
let touch=5;Object.defineProperty(globalThis.navigator,'maxTouchPoints',{get:()=>touch,configurable:true});
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
const X=new Function(script+'\nreturn {store,app,render,go,Engine,boardClick,startPlay,playMove,playUndo,flagFall,checkOver,buildPGN,playSnapshot,playSave,playResume,playSavedGame,tcById,passFlipOn};')();
const $=q=>document.querySelector(q);
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act);b.click();};
let thinks=0;X.Engine.think=()=>{thinks++;};X.Engine.analyse=()=>{thinks++;};X.Engine.load=async()=>true;
const mv=(from,to)=>{X.boardClick(from);X.boardClick(to);};
const orient=()=>{const b=$('.board');return b&&b.querySelector('[data-sq]').getAttribute('data-sq');};   // first square drawn: a8 from White's side, h1 from Black's

/* ================= setting it up ================= */
X.app.playFen=null;X.go('play');
ok($('#passcard')&&$('#pp-w')&&$('#pp-b')&&$('[data-act="ppstart"]'),'the Play screen has “Play a friend on this device” with both names');
ok(X.passFlipOn()===true&&/On/.test($('[data-act="ppflip"]').textContent),'on a phone the board turns for each player by default');
touch=0;X.store.settings.passFlip=undefined;
ok(X.passFlipOn()===false,'on a computer it does not');
touch=5;
$('#pp-w').value='Ana';$('#pp-b').value='Radu';
click('ppstart');
ok(X.app.view==='play'&&X.app.pass&&X.app.pass.w==='Ana'&&X.app.pass.b==='Radu','it starts a game between the two named players');
ok(X.store.settings.passW==='Ana'&&X.store.settings.passB==='Radu','and remembers the names for next time');
ok(/Ana/.test($('#app').textContent)&&/Radu/.test($('#app').textContent),'both names are on the board strips');
ok(/Ana to move \(White\)/.test($('#app').textContent),'and the status says whose move it is');
ok(orient()==='a8','Ana (White) sees the board from White’s side');
ok(/Two players/.test($('#app').textContent)&&!/Play vs Stockfish/.test($('#app').textContent)&&!/Lvl:/.test($('#app').textContent),'the screen is titled for two players, with no engine strength on it');

/* ================= playing ================= */
mv('e2','e4');await tick(400);
ok(X.app.playMoves.length===1&&X.app.playSide==='b'&&X.app.playStatus==='play','after a move the turn passes to the other player, not the engine');
ok(/Radu to move \(Black\)/.test($('#app').textContent),'Radu is told it is their move');
ok(orient()==='h1','and the board turns round for Radu');
mv('e7','e5');mv('g1','f3');mv('b8','c6');await tick(400);
ok(X.app.playMoves.map(m=>m.san).join(' ')==='e4 e5 Nf3 Nc6','both sides move on the same board');
ok(thinks===0,'the engine was never asked for anything');
// hanging a piece: no warning for either player
mv('f3','g5');mv('d8','g5');
ok(X.app.playMoves.length===6&&!X.app.blunderNote,'nobody is warned about a blunder — that would be help for one side');
ok($('[data-act="phint"]').disabled,'and there are no hints');
click('pundo');
ok(X.app.playMoves.length===5&&X.app.playSide==='b'&&orient()==='h1','a take-back undoes one move and gives the turn back to the player who made it');

/* ================= results ================= */
X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('f2','f3');mv('e7','e5');mv('g2','g4');mv('d8','h4');
ok(X.app.playStatus==='over'&&X.app.playResult==='Checkmate — Radu wins the game! 🏆','checkmate names the winner');
ok(/🏆/.test($('#app').textContent)&&!/you lost/i.test($('#app').textContent),'with a trophy, not “you lost”');
let pgn=X.buildPGN();
ok(/\[White "Ana"\]/.test(pgn)&&/\[Black "Radu"\]/.test(pgn)&&/\[Result "0-1"\]/.test(pgn)&&/0-1\s*$/.test(pgn.trim()),'the PGN has both names and the right result');
ok(thinks===0,'a whole game, and still no engine');

X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('e2','e4');
click('presign');ok(X.app.confirm&&/Radu resigns\?/.test(X.app.confirm.msg),'resigning asks the player to move to confirm');
click('confirmyes');
ok(X.app.playResult==='Radu resigns — Ana wins the game.'&&/\[Result "1-0"\]/.test(X.buildPGN()),'and the other player wins');

X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('d2','d4');mv('d7','d5');
click('pdraw');ok(X.app.confirm&&/both have to want it/.test(X.app.confirm.msg),'a draw is agreed, not decided by an engine');
click('confirmyes');
ok(X.app.playResult==='Draw agreed. 🤝'&&/\[Result "1\/2-1\/2"\]/.test(X.buildPGN()),'and scored as a draw');

X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true},tc:X.tcById('3+0')});
ok(X.app.clock,'a time control gives both players a clock');
mv('e2','e4');
ok(X.app.clock.w>178000&&X.app.playStatus==='play'&&X.app.playSide==='b','after White moves it is Black’s clock that runs');
X.flagFall('b');
ok(X.app.playResult==='Radu’s flag fell — Ana wins the game on time. ⏱','a flag fall names who ran out');

X.startPlay('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1','w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('f7','f6');
ok(X.app.playStatus==='play'&&X.app.playSide==='b','a normal move hands over');
X.startPlay('7k/8/6K1/8/8/8/8/5Q2 w - - 0 1','w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('f1','f7');
ok(/stalemate/i.test(X.app.playResult),'stalemate is still a draw');

/* ================= a screen between two people ================= */
X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:false}});
mv('e2','e4');
ok(X.app.playSide==='b'&&orient()==='a8','with turning off, the board stays the same way round for both');

/* ================= again, and later ================= */
X.startPlay(new Chess().fen(),'w',null,'t',{pass:{w:'Ana',b:'Radu',flip:true}});
mv('e2','e4');mv('e7','e5');X.app.playStatus='over';X.app.playResult='Draw agreed. 🤝';X.render();
click('prematch');
ok(X.app.pass.w==='Radu'&&X.app.pass.b==='Ana'&&X.app.playMoves.length===0,'a rematch swaps colours');
mv('d2','d4');
X.playSave(true);
const saved=X.playSavedGame();
ok(saved&&saved.pass&&saved.pass.w==='Radu','an unfinished two-player game is kept for later');
X.app.pass=null;X.app.view='settings';
X.playResume();
ok(X.app.pass&&X.app.pass.w==='Radu'&&X.app.playSide==='b'&&X.app.playStatus==='play','and resumes with the right player to move');
ok(/Ana to move/.test($('#app').textContent),'by name');
await tick(500);
ok(thinks===0,'still without the engine');

/* ================= and it leaves ordinary games alone ================= */
X.startPlay(new Chess().fen(),'b',null,'vs engine',{});
ok(X.app.pass===null&&X.app.playStatus==='engine','a game against the engine is exactly as before');
X.app.playStatus='over';

console.log('\n✅ pass: '+pass+' checks passed');
