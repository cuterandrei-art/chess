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
const X=new Function(script+'\nreturn {store,app,render,renderBoard,a11yPiece,a11ySquare,a11yBoardLabel,a11yStatus,'+
  'a11yTick,srSay,srRegion,srNode,kbDefault,kbSq,kbStep,kbHandle,kbOrient,kbFen,boardClick,startPlay,tcById,turnOf,'+
  'PIECE_WORD,freshCareer};')();
const START=new Chess().fen();
const reset=()=>{X.app.kbSq=null;X.app.kbFocus=false;X.app._srLast=null;X.app.playLast=null;X.app.pz=null;};

/* ================= WHAT A SQUARE SAYS ================= */
reset();
ok(X.a11yPiece({color:'w',type:'n'})==='white knight','a piece is described in words');
ok(X.a11yPiece({color:'b',type:'q'})==='black queen','both colours');
ok(Object.keys(X.PIECE_WORD).length===6,'all six pieces have a word');
ok(X.a11yPiece(null)==='empty','and an empty square says so');
ok(X.a11ySquare('e4',null,{})==='e4, empty','a square reads as its name and what is on it');
ok(X.a11ySquare('g1',{color:'w',type:'n'},{})==='g1, white knight','with the piece named');
let lab=X.a11ySquare('e2',{color:'w',type:'p'},{sel:true});
ok(/selected/.test(lab),'a selected square says it is selected ('+lab+')');
lab=X.a11ySquare('e4',null,{dest:true});
ok(/can move here/.test(lab),'an empty square you can move to says so');
lab=X.a11ySquare('d5',{color:'b',type:'p'},{dest:true});
ok(/can be captured/.test(lab),'and an occupied one says it can be captured');
lab=X.a11ySquare('e4',{color:'w',type:'p'},{last:true});
ok(/last move/.test(lab),'the last move is called out');
lab=X.a11ySquare('e1',{color:'w',type:'k'},{check:true});
ok(/in check/.test(lab),'and a king in check is not left for you to notice');

/* ================= THE BOARD IS A GRID ================= */
reset();
let b=X.renderBoard(START,'white',{});
ok(/role="grid"/.test(b),'the board is a grid');
ok(/aria-label="Chess board/.test(b),'with a label that says what it is');
ok(/White to move/.test(b),'and whose move it is');
ok(/Arrow keys move, Enter selects/.test(b),'and how to use it');
ok((b.match(/role="gridcell"/g)||[]).length===64,'all sixty-four squares are cells');
ok((b.match(/aria-label="[a-h][1-8],/g)||[]).length===64,'each with a label of its own');
ok(/aria-label="e2, white pawn"/.test(b),'the pieces are where they should be');
ok(/aria-label="g8, black knight"/.test(b),'both sides of the board');
ok(/aria-label="e4, empty"/.test(b),'and the empty squares say so');
ok((b.match(/tabindex="0"/g)||[]).length===1,'exactly one square is in the tab order');
ok((b.match(/tabindex="-1"/g)||[]).length===63,'and the other sixty-three are reachable only by cursor');
ok(/class="[^"]*kbcur/.test(b),'the cursor square is marked');
b=X.renderBoard(START,'black',{});
ok(/Black at the bottom/.test(b),'a flipped board says which way round it is');
/* a board can opt out — a thumbnail has nothing to announce */
b=X.renderBoard(START,'white',{a11y:false});
ok(!/role="gridcell"/.test(b),'a board can opt out of all of it');
ok(!/tabindex/.test(b),'taking itself out of the tab order with it');
/* selection and check */
b=X.renderBoard(START,'white',{sel:'e2'});
ok(/aria-selected="true"/.test(b),'a selected square is marked as selected');
ok((b.match(/aria-selected/g)||[]).length===1,'and only that one');
ok(/aria-label="e4, empty, can move here"/.test(b),'its destinations are labelled as reachable');
const CHK='rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
b=X.renderBoard(CHK,'white',{});
ok(/aria-label="e1, white king, in check"/.test(b),'a king in check is labelled in check');
b=X.renderBoard(START,'white',{});
ok(!/in check/.test(b),'and a quiet position has nobody in check');

/* ================= THE CURSOR ================= */
reset();
ok(X.kbSq(START,'white')==='e4','the cursor starts somewhere sensible');
X.app.kbSq=null;X.app.playLast={from:'g1',to:'f3'};
ok(X.kbSq(START,'white')==='f3','or on the move just played');
X.app.kbSq='zz9';
ok(/^[a-h][1-8]$/.test(X.kbSq(START,'white')),'nonsense is replaced rather than rendered');
/* stepping, the way the board looks on screen */
ok(X.kbStep('e4',1,0,'white')==='f4','right is right');
ok(X.kbStep('e4',-1,0,'white')==='d4','left is left');
ok(X.kbStep('e4',0,1,'white')==='e5','up the screen is up the board, for White');
ok(X.kbStep('e4',0,-1,'white')==='e3','and down is down');
ok(X.kbStep('e4',0,1,'black')==='e3','on a flipped board up the screen is still up the screen');
ok(X.kbStep('e4',1,0,'black')==='d4','and so is right');
ok(X.kbStep('a1',-1,0,'white')==='a1','the edge of the board is the edge');
ok(X.kbStep('h8',1,1,'white')==='h8','in both directions');
ok(X.kbStep('a1',0,-1,'black')==='a2','including from the other side');

/* ================= THE KEYS ================= */
reset();
X.store.career=X.freshCareer();
X.startPlay(START,'w',null,'Test game',{tc:X.tcById('unlimited')});
ok(X.app.view==='play','a game is on');
const key=(k,inBoard)=>{
  let prevented=false;
  const target=inBoard===false?{tagName:'DIV',closest:()=>null}
    :{tagName:'DIV',closest:sel=>(sel==='.board'?{}:null)};
  return {handled:X.kbHandle({key:k,target:target,preventDefault:()=>{prevented=true;}}),prevented:prevented};
};
X.app.kbSq='e2';
let r=key('ArrowUp');
ok(r.handled===true,'an arrow key on the board is handled');
ok(r.prevented===true,'and the page does not scroll');
ok(X.app.kbSq==='e3','the cursor moved');
ok(X.app.kbFocus===true,'and the board took the focus ring');
key('ArrowUp');key('ArrowUp');
ok(X.app.kbSq==='e5','it keeps moving');
/* Enter picks up and puts down */
reset();
X.app.kbSq='e2';X.app.kbFocus=true;
key('Enter');
ok(X.app.playSel==='e2','Enter picks up the piece under the cursor');
X.app.kbSq='e4';
key('Enter');
ok(X.app.playSel===null,'and Enter on a legal square puts it down');
ok((X.app.playMoves||[]).length===1,'playing the move');
ok(X.app.playMoves[0].san==='e4','the right one ('+X.app.playMoves[0].san+')');
/* space does the same, since a gridcell answers to both */
reset();
X.app.kbSq='d2';X.app.kbFocus=true;
key(' ');
ok(X.app.playSel==='d2','the space bar picks up too');
/* Escape lets go */
key('Escape');
ok(X.app.playSel===null,'Escape lets go of the piece');
ok(/Selection cleared/.test(X.app._srLast||''),
  'and says so out loud, without the running status talking over it');
/* the arrows only take the board once you are on it */
reset();
X.app.kbFocus=false;X.app.kbSq='e2';
r=key('ArrowLeft',false);
ok(r.handled===false,'away from the board the arrows are left alone');
ok(X.app.kbSq==='e2','so the play screen keeps its move-stepping');
X.app.kbFocus=true;
r=key('ArrowLeft',false);
ok(r.handled===true,'but once the board has the ring, the arrows belong to it');
ok(/ArrowLeft|d2/.test(X.app.kbSq)||X.app.kbSq==='d2','and the cursor moves ('+X.app.kbSq+')');
/* anything else is not ours */
reset();X.app.kbFocus=true;
ok(key('f').handled===false,'a letter is not a board key');
ok(key('Home').handled===false,'and neither is Home, which the game already uses');

/* ================= WHAT IS ANNOUNCED ================= */
reset();
X.store.career=X.freshCareer();
X.startPlay(START,'w',null,'Test game',{tc:X.tcById('unlimited')});
let st=X.a11yStatus();
ok(/Your move/.test(st),'at the start it is your move ('+st+')');
X.app.playMoves=[{san:'e4'}];
X.app.playFen='rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
st=X.a11yStatus();
ok(/e4/.test(st),'after a move the move is named');
ok(/Waiting for your opponent/.test(st),'and it says whose turn it is');
X.app.playStatus='over';X.app.playResult='Checkmate — you won! 🎉';
ok(/Checkmate/.test(X.a11yStatus()),'the result is announced');
X.app.view='puzzles';
X.app.pz={idx:1,side:'w',status:'solving',moves:['e2e4'],fenNow:START,step:0};
ok(/White to move/.test(X.a11yStatus()),'a puzzle says whose move it is');
X.app.pz.status='failed';
ok(/Not the move/.test(X.a11yStatus()),'a wrong answer is announced');
X.app.pz.status='solved';
ok(/Correct/.test(X.a11yStatus()),'and so is a right one');
X.app.view='livegame';
X.app.live={moves:[{san:'e4'},{san:'e5'}],fens:[START,START,START],pos:2};
ok(/Move 2 of 2/.test(X.a11yStatus()),'the analysis board says where in the game you are');
X.app.view='dashboard';
ok(X.a11yStatus()===null,'a screen with no board announces nothing');
/* the same sentence is not read twice */
reset();
X.app.view='play';
X.app.playFen=START;X.app.playSide='w';X.app.playStatus='play';X.app.playMoves=[];
X.srSay('Something');
ok(X.app._srLast==='Something','the live region remembers what it last said');
X.app._srAt=0;                       // pretend that was a while ago
X.a11yTick();
const said=X.app._srLast;
ok(said===X.a11yStatus(),'the next render announces the status ('+said+')');
X.app._srAt=0;
X.a11yTick();
ok(X.app._srLast===said,'and repeating the same render says nothing new');

/* a deliberate line is held briefly against the status */
reset();
X.app.view='play';X.app.playFen=START;X.app.playSide='w';X.app.playStatus='play';X.app.playMoves=[];
X.srSay('Selection cleared.');
X.a11yTick();
ok(X.app._srLast==='Selection cleared.','a deliberate announcement survives the next render');
X.app._srAt=Date.now()-5000;
X.a11yTick();
ok(X.app._srLast!=='Selection cleared.','and a moment later the status takes over again');

/* ================= THE LIVE REGION ITSELF =================
   It has to live OUTSIDE #app: render() replaces that whole subtree, so a
   region inside it is destroyed — along with the message — by the very redraw
   that follows the announcement. The browser caught this; a unit test that
   only looked at the in-memory copy could not. */
const node=X.srNode();
ok(!!node,'the live region exists');
ok(node.getAttribute('aria-live')==='polite','and is polite');
ok(node.getAttribute('aria-atomic')==='true','read as one whole message');
ok(node.getAttribute('role')==='status','and marked as a status');
ok(node.className==='sronly','kept off the screen but not out of the accessibility tree');
ok(node.parentNode===document.body,'attached to the body, not to #app');
ok(node.parentNode.id!=='app','which is the whole point');
ok(X.srNode()===node,'asking twice does not make a second one');
X.srSay('A test announcement.');
ok(node.textContent==='A test announcement.','saying something writes it into the region');
/* the redraw that follows must not wipe it */
X.app.view='dashboard';
X.render();
ok(document.getElementById('srlive')===node,'a full redraw leaves the region standing');
ok(node.textContent==='A test announcement.','with what it was saying still in it');
ok(/\.sronly\{position:absolute/.test(html),'and the class really is only hidden visually');
ok(!/display:none/.test((html.match(/\.sronly\{[^}]*\}/)||[''])[0]),
  'never display:none, which would hide it from a screen reader too');
ok(script.indexOf("+srRegion();")<0,'the region is not part of the rendered string any more');
ok(/srNode\(\);\s*\/\/ outside #app/.test(script),'it is ensured after each render instead');

/* ================= WIRED IN ================= */
ok(/kbHandle\(e\)\)return;/.test(script),'a focused board takes its keys first');
ok(/srNode\(\);/.test(script),'the live region is ensured on every render');
ok(/a11yTick\(\);/.test(script),'and the announcement runs after every render');
ok(/app\.kbSq=sqEl\.dataset\.sq;app\.kbFocus=false;/.test(script),
  'a mouse click moves the cursor and puts the ring away');
ok(/if\(ae&&\/INPUT\|TEXTAREA\|SELECT\/\.test\(ae\.tagName\)\)return;/.test(script),
  'and focus is never stolen back from a text field');
ok(/⌨️ Or play from the keyboard/.test(script),'the keys are documented where you play');
ok(/role="gridcell"/.test(script),'the squares are cells');
ok(/\.square\.kbcur:focus/.test(html),'and the cursor has a visible ring');

console.log('\n✅ a11y: '+pass+' checks passed');
