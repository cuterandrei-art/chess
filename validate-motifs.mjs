/* Tactical motifs, the tablebase, the opening database, board annotations and
   the first-run setup.

   The two network features talk to Lichess, which cannot be reached from CI,
   so their *behaviour* is checked here against the pure functions and their
   wiring is checked in the browser suite. What is checked here is what must
   hold whether or not the network is there: the motif detector against
   positions whose answer is known, the tablebase's reading of the API's
   conventions, and the fact that every one of these degrades to nothing
   rather than to a broken screen. */
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
globalThis.fetch=()=>Promise.reject(new Error('no network in CI'));
globalThis.AudioContext=globalThis.webkitAudioContext=function(){return{createOscillator:()=>({connect(){},start(){},stop(){},frequency:{}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}),destination:{},currentTime:0};};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}}; globalThis.Worker=class{postMessage(){}terminate(){}addEventListener(){}};
if(!dom.window.matchMedia)dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
dom.window.__PUZZLES=[];

let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,motifsOf,MOTIFS,MOTIF_BY,motifLabel,pzMotifs,pzMotifPick,PZ_THEMES,'+
  'Tablebase,tbVerdict,tbBestMoves,tbMoveOutcome,tbPanel,tbRequest,TB_MAX_PIECES,'+
  'Explorer,expPanel,expBar,expCount,expDb,EXP_DBS,'+
  'ANN_COLORS,annColorOf,toggleAnnotation,clearAnnotations,annPath,annSvg,'+
  'onbNeeded,onbFinish,onbStart,viewOnboard,ONB_LEVELS,ONB_GOALS,renderBoard};')();

/* ===================== motifs: positions whose answer is known ===================== */
const M=(fen,...mv)=>X.motifsOf(fen,mv);
ok(M('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1','b5c7').includes('fork'),'Nc7+ hitting the king and the rook is a fork');
ok(M('3qk3/8/5n2/8/7B/8/8/4K3 w - - 0 1','h4g5','e8f8','a1a1').includes('pin'),'Bg5 nailing the knight to the queen is a pin');
ok(M('3k4/8/5n2/8/7B/8/8/4K3 w - - 0 1','h4g5','d8e8','a1a1').includes('pin'),'and so is nailing it to the king');
ok(M('8/8/q7/8/8/k7/8/3R2K1 w - - 0 1','d1a1').includes('skewer'),'a rook checking the king with the queen behind it is a skewer');
ok(M('k7/8/8/8/N7/8/8/R3K3 w Q - 0 1','a4b6').includes('discovered'),'stepping the knight off the file is a discovered attack');
ok(M('k7/8/8/8/N7/8/8/R3K3 w Q - 0 1','a4b6').includes('doubleCheck'),'and when both checkers land, a double check');
ok(M('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1','a1a8').includes('backRank'),'Ra8# against a king boxed in by its pawns is a back-ranker');
ok(M('6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1','g5f7').includes('smothered'),'Nf7# with the king hemmed in by its own is smothered');
ok(!M('6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1','g5f7').includes('backRank'),'and a smothered mate is not called a back-ranker');
ok(M('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1','d1d5').includes('hanging'),'taking an undefended queen is taking a hanging piece');
ok(M('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1','c4f7','e8f7','f3g5').includes('sacrifice'),'Bxf7+ for nothing yet is a sacrifice');
ok(M('4k3/8/8/8/8/8/1R6/4K3 w - - 0 1','b2b7','e8f8','a1a1').includes('quiet'),'a winning move that is neither check nor capture is a quiet move');
ok(M('4k3/P7/8/8/8/8/8/4K3 w - - 0 1','a7a8q').includes('promotion'),'queening is a promotion');

/* the tightening that makes the tags worth having */
ok(!M('3k4/8/8/8/7B/8/8/4K3 w - - 0 1','h4g5','d8e8','a1a1').includes('pin'),'a bishop aimed at an empty diagonal is not a pin');
ok(!M('7k/8/8/8/8/8/8/R2R2K1 w - - 0 1','d1d8','h8h7','a1a1').includes('pin'),'nor is a rook that simply gives check');
ok(X.motifsOf('',[])!==null&&X.motifsOf('','').length===0,'a broken position yields nothing rather than throwing');
ok(X.motifsOf('8/8/8/8/8/8/8/K6k w - - 0 1',['a1b1']).length>=0,'and a legal but pointless move is handled too');

ok(X.MOTIFS.length>=10&&X.MOTIFS.every(m=>m.k&&m.e&&m.n&&m.d),'every motif has a key, an icon, a name and an explanation');
ok(X.MOTIFS.filter(m=>m.tag).every(m=>m.tag==='mate'),'motifs that can only happen in a mate say so, so the search can narrow');
ok(/Fork/.test(X.motifLabel('fork'))&&/Mate in 2/.test(X.motifLabel('mateIn2')),'motifs and the set’s own tags both have readable names');

/* ===================== tablebase ===================== */
const T=X.Tablebase;
ok(T.count('8/5p2/4k3/6p1/2P5/4K3/8/6QR w - - 0 1')===7,'it counts the men on the board');
ok(T.covers('8/5p2/4k3/6p1/2P5/4K3/8/6QR w - - 0 1'),'seven men are covered');
ok(!T.covers('8/5pp1/4k3/6p1/2P5/4K3/8/6QR w - - 0 1'),'eight are not');
ok(!T.covers('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),'and a full board is never asked about');
ok(X.TB_MAX_PIECES===7,'seven is the published limit of the standard tables');
/* the API describes a move by what it leaves the OPPONENT with */
ok(X.tbMoveOutcome('loss')==='win'&&X.tbMoveOutcome('win')==='loss'&&X.tbMoveOutcome('draw')==='draw',
   'a move that leaves the opponent lost is read as the move that wins');
ok(/White wins/.test(X.tbVerdict({category:'win',dtm:10,dtz:1,moves:[]},'w').txt),'a win is stated plainly');
ok(/mate in 10/.test(X.tbVerdict({category:'win',dtm:10,dtz:1,moves:[]},'w').txt),'with the distance to mate');
ok(/50-move/.test(X.tbVerdict({category:'cursed-win',dtz:120,moves:[]},'w').txt),'a cursed win is called the draw it really is');
ok(X.tbVerdict({category:'draw',moves:[]},'w').kind==='draw'&&X.tbVerdict({category:'loss',dtm:-4,moves:[]},'b').kind==='loss','draws and losses too');
const ranked=X.tbBestMoves({moves:[
  {uci:'a1a2',san:'Ka2',category:'draw',dtm:null},
  {uci:'h1h8',san:'Qh8',category:'loss',dtm:-13},
  {uci:'d4d5',san:'Kd5',category:'loss',dtm:-9},
  {uci:'d4e4',san:'Ke4',category:'win',dtm:12}]});
ok(ranked[0].san==='Kd5'&&ranked[1].san==='Qh8','winning moves come first, quickest mate at the top');
ok(ranked[2].san==='Ka2'&&ranked[3].san==='Ke4','then what only draws, then what loses');
ok(X.tbPanel('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',{})==='','no panel where the tables do not reach');
X.store.settings.tbOn=false;
ok(X.tbPanel('8/8/4k3/8/3K4/8/8/7Q w - - 0 1',{})==='','and none at all when it is switched off');
X.store.settings.tbOn=true;
ok(/Tablebase/.test(X.tbPanel('8/8/4k3/8/3K4/8/8/7Q w - - 0 1',{}))&&/3 pieces/.test(X.tbPanel('8/8/4k3/8/3K4/8/8/7Q w - - 0 1',{})),
   'before the answer arrives it says what it is doing rather than showing nothing');

/* ===================== opening database ===================== */
ok(X.EXP_DBS.length===2&&X.EXP_DBS.map(d=>d.k).join()==='masters,lichess','there are two databases: masters and everybody else');
ok(X.expCount(1443000)==='1.4M'&&X.expCount(52100)==='52k'&&X.expCount(940)==='940','big numbers read as 1.4M / 52k / 940');
const bar=X.expBar(50,25,25);
ok(/width:50.0%/.test(bar)&&/width:25.0%/.test(bar),'the result bar is proportioned by the real split');
ok(X.expBar(0,0,0)==='','and an empty split draws nothing');
ok(/masters/.test(X.Explorer._url('x','masters'))&&/lichess/.test(X.Explorer._url('x','lichess')),'each database has its own endpoint');
ok(/fen=/.test(X.Explorer._url('8/8 w - - 0 1','masters')),'and the position is passed to it');
X.store.settings.expOn=false;
ok(X.expPanel('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')==='','switched off, the panel is not there');
X.store.settings.expOn=true;
ok(/What people play here/.test(X.expPanel('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')),'switched on, it is');

/* both network features must be strictly optional */
ok(/expOn:true/.test(script)&&/tbOn:true/.test(script),'both are on by default for anyone with a connection');
ok(/data-setting="expOn"/.test(script)&&/data-setting="tbOn"/.test(script),'and both have a switch in Settings');
await X.Tablebase.lookup('8/8/4k3/8/3K4/8/8/7Q w - - 0 1').then(v=>{
  ok(v===null,'with no network the tablebase answers null rather than throwing');});
await X.Explorer.lookup('8/8/4k3/8/3K4/8/8/7Q w - - 0 1','masters').then(v=>{
  ok(v===null,'and so does the opening database');});

/* ===================== annotations ===================== */
ok(Object.keys(X.ANN_COLORS).join()==='g,r,b,y','there are four colours to draw in');
ok(X.annColorOf({})==='g'&&X.annColorOf({shiftKey:true})==='r'&&X.annColorOf({altKey:true})==='b'&&X.annColorOf({ctrlKey:true})==='y',
   'plain is green, shift red, alt blue, ctrl yellow');
X.app.annot={};
const F='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
X.toggleAnnotation(F,'e2','e4','g');
ok(X.app.annot[F].arrows.length===1&&X.app.annot[F].arrows[0].c==='g','drawing an arrow keeps it');
X.toggleAnnotation(F,'e2','e4','r');
ok(X.app.annot[F].arrows.length===1&&X.app.annot[F].arrows[0].c==='r','drawing it again in another colour recolours rather than duplicates');
X.toggleAnnotation(F,'e2','e4','r');
ok(X.app.annot[F].arrows.length===0,'and in the same colour rubs it out');
X.toggleAnnotation(F,'f6',null,'y');
ok(X.app.annot[F].sqs.f6==='y','a square can be circled, in its own colour');
X.clearAnnotations(F);
ok(!X.app.annot[F],'and the whole position can be wiped');
const files=['a','b','c','d','e','f','g','h'],ranks=[8,7,6,5,4,3,2,1];
ok(X.annPath(files,ranks,'g1','f3').d.split('L').length===3,'a knight’s arrow bends like the move');
ok(X.annPath(files,ranks,'f1','c4').d.split('L').length===2,'a bishop’s runs straight');
ok(X.annPath(files,ranks,'zz','f3')===null,'a nonsense square draws nothing');
ok(/#3b82f6/.test(X.annSvg(files,ranks,[{from:'e2',to:'e4',c:'b'}],'t')),'the colour reaches the drawing');
ok(X.annSvg(files,ranks,[],'t')==='','and nothing drawn is nothing rendered');
ok(/id="annprev"/.test(X.renderBoard(F,'white',{})),'every board carries a layer for the arrow you are dragging');

/* ===================== onboarding ===================== */
ok(X.ONB_LEVELS.length===4&&X.ONB_LEVELS.every(l=>l.k&&l.n&&l.d&&l.tc&&l.level!=null&&l.puzzle),'four honest descriptions of how much chess you play');
ok(X.ONB_GOALS.length===4&&X.ONB_GOALS.every(g=>g.k&&g.n&&g.d&&g.view),'and four things you might want, each with somewhere to land');
const lv=X.ONB_LEVELS.map(l=>l.level);
ok(lv.every((v,i)=>i===0||v>lv[i-1]),'a stronger answer means a stronger opponent');
const pz=X.ONB_LEVELS.map(l=>l.puzzle);
ok(pz.every((v,i)=>i===0||v>pz[i-1]),'and harder puzzles to start from');
ok(/Welcome/.test(X.viewOnboard())&&/data-act="onbskip"/.test(X.viewOnboard()),'the first card welcomes you and offers a way past');
X.app.onb={step:2,level:'club',goal:'tactics',pieces:'merida'};
X.onbFinish(false);
ok(X.store.settings.level===4&&X.store.settings.tcId==='15+10'&&X.store.settings.pieces==='merida'&&X.app.view==='puzzles',
   'the answers become the settings, and send you where you said you wanted to go');
ok(X.store.onboarded===true,'and it is marked done');
ok(!X.onbNeeded(),'so it does not ask again');
ok(/onboarded:!!d\.onboarded/.test(script),'and “done” survives a reload — it is read back out of storage, not just written to it');
ok(/data-act="onbredo"/.test(script),'Settings can put you back through it');

console.log('\n✅ motifs+tablebase+explorer+annotations+onboarding: '+pass+' checks passed');
