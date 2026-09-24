// The analysis board: any FEN or PGN, played on for both sides.   node validate-analysis.mjs
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
globalThis.fetch=async()=>{throw new Error('offline in the test');};
dom.window.__PUZZLES=[['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7',1200,['mate'],'e7e5']];
if(!globalThis.navigator||typeof globalThis.navigator!=='object')globalThis.navigator={};
let clip=null;globalThis.navigator.clipboard={writeText:async t=>{clip=t;}};
localStorage.setItem('opening-trainer-standalone-v1',JSON.stringify({onboarded:true}));
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||0));
// wait for something that should happen, without betting on how busy the machine is
const until=async(f,ms)=>{const end=Date.now()+(ms||4000);while(!f()&&Date.now()<end)await tick(10);return f();};
const X=new Function(script+'\nreturn {store,app,render,go,Engine,anaFenOf,anaParse,anaOpen,anaLoadText,anaMove,anaFen,anaPgn,anaCopy,anaSeek,anaJump,boardClick,dropPiece,reviewStart,startPlay,ANA_START};')();
const $=q=>document.querySelector(q);
const click=(act,val)=>{const b=$('[data-act="'+act+'"]'+(val!=null?'[data-val="'+val+'"]':''));if(!b)throw new Error('no button '+act+' '+(val||''));b.click();};
const key=k=>dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:k,bubbles:true}));
// a stand-in engine: every position is +0.35 with e2e4 or whatever is legal first
let asked=[];
X.Engine.load=async()=>true;
X.Engine.analyse=(fen,d,cb)=>{asked.push(fen);const c=new Chess(fen);const m=c.moves({verbose:true})[0];
  setTimeout(()=>cb(m.from+m.to,{1:{t:'cp',v:35,pv:m.from+m.to},2:{t:'cp',v:10,pv:''}},{t:'cp',v:35,d:18,stm:fen.split(' ')[1]}),1);};

/* ================= reading what is pasted ================= */
const ITAL='r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
ok(X.anaFenOf(ITAL)===ITAL,'a full FEN is read as it is');
ok(X.anaFenOf('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq')===ITAL.replace(' 3 3',' 0 1'),'four fields get the move counters filled in');
ok(X.anaFenOf('8/8/8/4k3/8/8/4P3/4K3')==='8/8/8/4k3/8/8/4P3/4K3 w - - 0 1','the board alone is White to move');
ok(X.anaFenOf('  '+ITAL+'  \n')===ITAL,'surrounding spaces and newlines do not matter');
ok(typeof X.anaFenOf('8/8/8/8/8/8/8/8 w - - 0 1')==='object','a board without kings is not a position');
let r=X.anaParse('8/8/8/8/8/8/8/8 w - - 0 1');
ok(!r.ok&&/not legal/.test(r.error),'and it says so ('+r.error+')');
r=X.anaParse('[Event "Casual"]\n[White "Anderssen"]\n[Black "Kieseritzky"]\n\n1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5?! {a gambit of his own} 5. Bxb5 Nf6 1-0');
ok(r.ok&&r.sans.length===10&&r.sans[5]==='Qh4+'&&r.title==='Anderssen – Kieseritzky, Casual','a PGN: headers, comments, annotations and the result are all handled');
r=X.anaParse('1.d4 Nf6 2.c4 g6 3.Nc3 d5');
ok(r.ok&&r.sans.join(' ')==='d4 Nf6 c4 g6 Nc3 d5'&&r.start===X.ANA_START,'a bare move list works too');
r=X.anaParse('[FEN "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1"]\n[SetUp "1"]\n\n1. Kd2 Kd5 2. Kd3');
ok(r.ok&&r.start==='8/8/8/4k3/8/8/4P3/4K3 w - - 0 1'&&r.sans.length===3,'a PGN that starts from its own position');
r=X.anaParse('hello there');
ok(!r.ok&&/No moves found/.test(r.error)&&/FEN looks like/.test(r.error),'anything else is refused, with an example of each');
ok(!X.anaParse('   ').ok,'and an empty box asks for something first');

/* ================= the screen ================= */
X.go('analysis');
ok(/Analysis board/.test($('#app').textContent)&&$('#ana-in')&&$('[data-act="anaload"]'),'with nothing loaded, it asks for a FEN or a PGN');
X.app.menuOpen=true;X.render();
ok($('[data-act="nav"][data-val="analysis"]'),'it is in the More menu');
X.app.menuOpen=false;
$('#ana-in').value='not chess';click('anaload');
ok(/No moves found/.test($('#app').textContent)&&!X.app.ana,'a bad paste is explained and nothing opens');
$('#ana-in').value=ITAL;click('anaload');
ok(X.app.ana&&X.anaFen()===ITAL,'a FEN opens on that position');
ok(X.app.ana.flip===true,'with Black to move, Black is at the bottom');
ok(/Black to move/.test($('#app').textContent),'and it says whose move it is');
await until(()=>/depth 18/.test($('#app').textContent));
ok(asked[asked.length-1]===ITAL&&/depth 18/.test($('#app').textContent)&&/−0\.[34]/.test($('#app').textContent),'the engine looks at it straight away (+0.35 for Black shows as −0.3 from White’s side)');
ok($('[data-act="anaplay"]'),'each engine line starts with its move as a button');

/* ================= playing on ================= */
X.boardClick('g8');X.boardClick('f6');
ok(X.app.ana.sans.join()==='Nf6'&&X.app.ana.pos===1,'a move on the board is added to the line');
X.boardClick('f3');X.boardClick('g5');
ok(X.app.ana.sans.join(' ')==='Nf6 Ng5','for either side');
click('anaback');click('anaback');
ok(X.app.ana.pos===0&&X.anaFen()===ITAL,'◀ steps back to the start');
X.boardClick('g8');X.boardClick('f6');
ok(X.app.ana.pos===1&&X.app.ana.sans.length===2,'playing the move the line already has just steps into it');
click('anaback');
X.boardClick('f8');X.boardClick('c5');
ok(X.app.ana.sans.join(' ')==='Bc5'&&X.app.ana.pos===1,'a different move from an earlier point replaces what came after');
X.dropPiece('c2','c3');
ok(X.app.ana.sans.join(' ')==='Bc5 c3','dragging a piece works like tapping');
key('ArrowLeft');key('ArrowLeft');
ok(X.app.ana.pos===0,'the arrow keys step through');
key('End');ok(X.app.ana.pos===2,'End jumps to the last move');
key('f');ok(X.app.ana.flip===false,'F flips the board');
await until(()=>$('[data-act="anaplay"]'));
const before=X.app.ana.sans.length;click('anaplay');
ok(X.app.ana.sans.length===before+1,'tapping an engine line plays its move');

/* promotion */
X.anaOpen('8/4P3/8/4k3/8/8/8/4K3 w - - 0 1',[],0,'t');
X.boardClick('e7');X.boardClick('e8');
ok(X.app.promo&&X.app.promo.view==='analysis','a pawn reaching the end asks what to promote to');
click('promopick','n');
ok(X.app.ana.sans[0]==='e8=N','and underpromotion is honoured');

/* ================= getting it back out ================= */
X.anaOpen(ITAL,['Nf6','Ng5','d5','exd5'],4,'t');
const pgn=X.anaPgn();
ok(/\[FEN "r1bqkbnr\/pppp1ppp\/2n5\/4p3\/2B1P3\/5N2\/PPPP1PPP\/RNBQK2R b KQkq - 3 3"\]/.test(pgn)&&/\[SetUp "1"\]/.test(pgn),'the PGN carries the starting position');
ok(/\n3\.\.\. Nf6 4\. Ng5 d5 5\. exd5 \*/.test(pgn),'numbered from where it started, Black first ('+pgn.trim().split('\n').pop()+')');
const back=X.anaParse(pgn);
ok(back.ok&&back.start===ITAL&&back.sans.join()==='Nf6,Ng5,d5,exd5','and reads back in exactly');
X.anaOpen(X.ANA_START,['e4','e5'],2,'t');
ok(!/\[FEN/.test(X.anaPgn())&&/1\. e4 e5 \*/.test(X.anaPgn()),'from the normal start there is no FEN header');
X.anaOpen(ITAL,['Nf6','Ng5','d5','exd5'],2,'t');X.go('analysis');
click('anacopy','fen');await tick(5);
ok(clip===X.app.ana.fens[2]&&/Copied/.test($('#app').textContent),'Copy FEN copies the position on the board, not the start');
click('anacopy','pgn');await tick(5);
ok(clip&&clip.indexOf('exd5')>0,'Copy PGN copies the whole line');
click('anareview');
ok(X.app.view==='review'&&X.app.review&&X.app.review.moves.length===4&&X.app.review.startFen===ITAL,'Game Review takes the line, from its own start');
X.anaOpen(ITAL,['Nf6'],1,'t');click('anaplayout');
ok(X.app.view==='play'&&X.app.playFen===X.app.ana.fens[1]&&X.app.playSide==='w','“Play it out” starts a game from the position on the board, as the side to move');

/* ================= reached from everywhere it matters ================= */
X.reviewStart([{san:'e4'},{san:'e5'},{san:'Nf3'},{san:'Nc6'}],null,{});
X.app.review.status='done';X.app.review.pos=3;X.app.review.classes=[];X.app.review.evals=[];X.app.review.best=[];X.render();
ok($('[data-act="anafromreview"]'),'Game Review has “Analyse from here”');
click('anafromreview');
ok(X.app.view==='analysis'&&X.app.ana.sans.length===4&&X.app.ana.pos===3,'which opens the board on the move you were looking at, with the rest of the game');
X.startPlay(X.ANA_START,'w',null,'t',{});
{const c=new Chess();const st=[c.fen()];c.move('e4');st.push(c.fen());c.move('e5');st.push(c.fen());
 X.app.playStack=st;X.app.playFen=st[2];X.app.playMoves=[{san:'e4',from:'e2',to:'e4'},{san:'e5',from:'e7',to:'e5'}];X.app.playStatus='over';X.app.playView=2;X.app.playResult='Draw agreed';}
X.render();
click('anafromplay');
ok(X.app.view==='analysis'&&X.app.ana.sans.join(' ')==='e4 e5','a finished game opens on the board');
X.app.view='puzzles';X.app.pz={idx:0,fen:'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',fenNow:'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',status:'solved',moves:['c4f7'],step:1,side:'w',themes:[],rating:1200};X.render();
ok($('[data-act="anafrompuzzle"]'),'a solved puzzle offers “Analyse”');
click('anafrompuzzle');
ok(X.app.view==='analysis'&&X.anaFen()===X.app.pz.fenNow,'and opens its position');
X.go('review');X.app.review=null;X.render();
ok($('[data-act="nav"][data-val="analysis"]'),'the empty Game Review screen points to the board for a FEN');

/* ================= typing is not interrupted ================= */
X.app.review=null;await tick(80);   // let the Game Reviews started above wind down
X.anaOpen(ITAL,[],0,'t');click('anainput');
const ta=$('#ana-in');ta.focus();ta.value='1. e4 c5 2. Nf3';ta.dispatchEvent(new dom.window.Event('input',{bubbles:true}));ta.setSelectionRange(5,5);
X.render();   // something in the background redraws
const ta2=$('#ana-in');
ok(ta2&&ta2.value==='1. e4 c5 2. Nf3','a redraw while you type keeps what you typed');
ok(document.activeElement===ta2&&ta2.selectionStart===5,'and keeps you in the box, cursor where it was');
const n=asked.length;await tick(40);
ok(asked.length===n,'the engine waits while the paste box is open');
click('anaload');
ok(X.app.ana.sans.join(' ')==='e4 c5 Nf3'&&!X.app.ana.input,'“Analyse it” loads what was typed');

/* ================= the engine can be switched off ================= */
click('anaengine');
ok(X.store.settings.anaEngine===false&&$('[data-act="anaengine"]')&&/Turn the engine on/.test($('#app').textContent),'the engine can be hidden, and that is remembered');
const m=asked.length;X.anaSeek(1);await tick(40);
ok(asked.length===m,'and then it is not asked');
click('anaengine');await until(()=>asked.length>m);
ok(X.store.settings.anaEngine===true&&asked.length>m,'turning it back on analyses the current position');

/* ================= endings ================= */
X.anaOpen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1',[],0,'t');await tick(20);
ok(/checkmate/.test($('#app').textContent)&&$('[data-act="anaplayout"]').disabled,'a finished position says so, and cannot be played out');

console.log('\n✅ analysis: '+pass+' checks passed');
