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
const X=new Function(script+'\nreturn {store,app,Engine,analysePos,evalStr,evalPct,evalLabel,evalDepth,posOver,turnOf,winPct,cpOf,botParams,bookPrefix,reviewFinish,detectOpening,REV_NOISE_CP,REV_BOOK_MAX};')();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* A stand-in Stockfish that behaves like the real one: it answers the position
   it was last given, reports no principal variation when there are no legal
   moves, and only stops when told to. */
const KNOWN={};
const mock={sent:[],delay:20,running:null,
  postMessage(cmd){
    this.sent.push(cmd);
    if(cmd.indexOf('position fen')===0){this.fen=cmd.slice('position fen '.length);return;}
    if(cmd.indexOf('go')===0){
      const fen=this.fen,k=KNOWN[fen]||{cp:0,best:'e2e4'};
      let legal=0;try{legal=new Chess(fen).moves().length;}catch(e){legal=0;}
      const emit=()=>{
        this.running=null;
        if(legal){
          X.Engine._msg('info depth 14 multipv 1 score '+(k.mate?('mate '+k.mate):('cp '+k.cp))+' pv '+k.best+' e7e5');
          X.Engine._msg('info depth 14 multipv 2 score cp '+(k.cp-40)+' pv d2d4 d7d5');
        }
        X.Engine._msg('bestmove '+(legal?k.best:'(none)'));
      };
      this.running=setTimeout(emit,this.delay);
      this._emit=emit;
      return;
    }
    if(cmd==='stop'){ // a real engine answers a stop with the search's own bestmove
      if(this.running){clearTimeout(this.running);this.running=null;setTimeout(this._emit,1);}
      return;
    }
  }};
function attach(){X.Engine.worker=mock;X.Engine.ready=true;X.Engine.loading=Promise.resolve(true);
  X.Engine._cur=null;X.Engine._next=null;X.Engine._stopping=false;X.Engine._orphans=0;
  if(X.Engine._wd)clearTimeout(X.Engine._wd);
  if(X.Engine._orphanT){clearTimeout(X.Engine._orphanT);X.Engine._orphanT=null;}
  if(mock.running){clearTimeout(mock.running);mock.running=null;}   // no stray answer from the last test
  mock.sent.length=0;}
attach();
X.store.settings.showEval=true;

const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER='rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const MATED='rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';   // White is checkmated
KNOWN[START]={cp:25,best:'e2e4'};
KNOWN[AFTER]={cp:900,best:'d1h5'};

/* ============ an evaluation belongs to its own position ============ */
/* one after another: each position keeps its own numbers */
let got=[];
mock.delay=10;
X.analysePos(START,(ev,best)=>got.push({who:'first',cp:ev&&ev.v,san:best&&best.san}));
await sleep(120);
X.analysePos(AFTER,(ev,best)=>got.push({who:'second',cp:ev&&ev.v,san:best&&best.san}));
await sleep(120);
const first=got.filter(g=>g.who==='first')[0],second=got.filter(g=>g.who==='second')[0];
ok(got.length===2,'two analyses in a row both call back ('+got.length+')');
ok(first&&first.cp===25,'the first gets the first position’s score (got '+(first&&first.cp)+', wanted 25)');
ok(second&&second.cp===900,'and the second gets its own (got '+(second&&second.cp)+', wanted 900)');
ok(first&&first.san==='e4'&&second&&second.san==='Qh5','and each best move belongs to the position it was found in');

/* overlapping: the one nobody is waiting for is told so, rather than being
   handed a stale half-answer or somebody else's numbers */
attach();mock.delay=400;
let sup=null,late=null,newer=null;
X.analysePos(START,(ev,best,lines,superseded)=>{if(superseded)sup=true;else late={cp:ev&&ev.v};});
await sleep(5);
X.analysePos(AFTER,(ev,best,lines,superseded)=>{if(!superseded)newer={cp:ev&&ev.v,san:best&&best.san};});
await sleep(900);
ok(sup===true,'a search the user has moved on from reports itself superseded');
ok(late===null,'and never hands back an evaluation at all');
ok(newer&&newer.cp===900,'while the position now on screen gets its own, in full ('+(newer&&newer.cp)+')');
ok(newer&&newer.san==='Qh5','with its own best move');

/* a request still waiting its turn, displaced by a newer one, is also told */
attach();mock.delay=300;
let q1=null,q2=null;
X.Engine.think(START,{elo:1500},50,()=>{});          // holds the engine
await sleep(5);
X.analysePos(START,(ev,best,lines,s2)=>{q1=s2?'superseded':'answered';});
await sleep(5);
X.analysePos(AFTER,(ev,best,lines,s2)=>{q2=s2?'superseded':'answered';});
await sleep(1200);
ok(q1==='superseded','a queued search displaced by a newer one is told so');
ok(q2==='answered','and the newest one is the one that runs ('+q2+')');

/* ============ a move the player is waiting for is never lost ============ */
attach();mock.delay=60;
let botMove='(never)',evGot=null;
X.Engine.think(START,{elo:1500},50,best=>{botMove=best;});
await sleep(5);
X.analysePos(AFTER,(ev)=>{evGot=ev&&ev.v;});
await sleep(600);
// a 1500-rated bot picks from several candidates on purpose, so the property
// here is that it receives a move at all — not which one
ok(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(botMove||''),'an eval refresh mid-think does not take the bot’s move with it (got '+botMove+')');
ok(evGot===900,'and the eval still gets its own position ('+evGot+')');

/* the bot's search is not interrupted: the analysis waits its turn */
attach();mock.delay=80;
mock.sent.length=0;
X.Engine.think(START,{elo:1500},50,()=>{});
await sleep(5);
X.analysePos(AFTER,()=>{});
await sleep(10);
ok(mock.sent.filter(c=>c==='stop').length===0,'a bot think is never stopped to make room for an eval bar');
await sleep(400);
ok(mock.sent.filter(c=>c.indexOf('position fen')===0).length===2,'both searches ran, one after the other');

/* ============ the UCI conversation is legal ============ */
attach();mock.delay=400;mock.sent.length=0;
X.analysePos(START,()=>{});
await sleep(5);
X.analysePos(AFTER,()=>{});
await sleep(10);
await sleep(900);
const posAt=mock.sent.map((c,i)=>[c,i]).filter(([c])=>c.indexOf('position fen')===0).map(([,i])=>i);
const goAt=mock.sent.map((c,i)=>[c,i]).filter(([c])=>c.indexOf('go ')===0).map(([,i])=>i);
const stopAt=mock.sent.indexOf('stop');
ok(posAt.length===2&&goAt.length===2,'both searches were sent to the engine');
ok(stopAt>goAt[0],'the running search is stopped, not left going');
ok(stopAt<posAt[1],'and the next position is only sent after that stop — never mid-search');
// the strict invariant: no `position` ever lands between a `go` and its answer
let searching=false,illegal=0;
mock.sent.forEach(c=>{
  if(c.indexOf('go ')===0)searching=true;
  else if(c==='stop')searching=false;
  else if(c.indexOf('position fen')===0&&searching)illegal++;
});
ok(illegal===0,'no position is ever sent while a search is running ('+illegal+' violations)');

/* ============ the engine going quiet is survivable ============ */
attach();
const dead={sent:[],postMessage(c){this.sent.push(c);}};      // never answers
X.Engine.worker=dead;
let timedOut='(never)';
X.Engine.analyse(START,8,function(best,lines,ev,sup){timedOut={best:best,ev:ev,sup:sup};},null,40);
await sleep(4600);                                  // the backstop is movetime*2+4000
ok(timedOut!=='(never)','a silent engine still calls back rather than hanging for ever');
ok(timedOut.best===null&&timedOut.sup===true,'saying it has no answer, not offering a wrong one');
// and a stray answer arriving afterwards is not credited to the next search
attach();mock.delay=10;
let after=null;
X.Engine._orphans=1;                                // as if one search had been abandoned
X.analysePos(AFTER,(ev)=>{after=ev&&ev.v;});
X.Engine._msg('bestmove e2e4');                     // the stray answer
await sleep(200);
ok(after===900,'a stray answer from an abandoned search is discarded, not handed to the next one ('+after+')');
attach();

/* ============ a position that is already over ============ */
mock.delay=20;
let over='(never)';
X.analysePos(MATED,(ev,best,lines)=>{over={ev:ev,best:best,n:lines.length};});
await sleep(120);
ok(over!=='(never)','a checkmated position resolves at once');
ok(over.ev&&over.ev.over==='mate','it is reported as a finished game, not a score');
ok(over.n===0,'with no moves to suggest');
ok(mock.sent.filter(c=>c.indexOf('position fen '+MATED)===0).length===0,'and the engine is not even asked');
ok(X.posOver(MATED).over==='mate','checkmate is recognised');
ok(X.posOver('8/8/8/8/8/4k3/6q1/7K w - - 0 1')===null,'a position with moves left is not');
ok(X.posOver(START)===null,'nor is the starting position');
ok(X.posOver('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1').over==='draw','stalemate is recognised as a draw');
ok(X.posOver('8/8/8/4k3/8/8/8/4K3 w - - 0 1').over==='draw','and so is a bare-kings position');
ok(X.posOver('not a fen')===null,'nonsense is not mistaken for a result');

/* ============ what the numbers say ============ */
ok(X.evalStr('cp',120,'w')==='+1.2','a score is shown from White’s side');
ok(X.evalStr('cp',120,'b')==='−1.2','including when Black is to move');
ok(X.evalStr('cp',0,'w')==='+0.0','a level position reads as level');
ok(X.evalStr('mate',3,'w')==='+M3','mate for White');
ok(X.evalStr('mate',-3,'w')==='−M3','mate against White is not written like mate for White');
ok(X.evalStr('mate',3,'b')==='−M3','mate for Black, to move');
ok(X.evalStr('mate',-3,'b')==='+M3','and mate against Black');
ok(X.evalPct('mate',3,'w')===98&&X.evalPct('mate',-3,'w')===2,'the bar agrees with the sign');
ok(X.evalPct('mate',3,'b')===2&&X.evalPct('mate',-3,'b')===98,'from either side');
// a mate already delivered: v is 0, and whose loss it is depends on who is to move
ok(X.evalStr('mate',0,'w')==='−M0'&&X.evalPct('mate',0,'w')===2,'a mated White is a loss for White');
ok(X.evalStr('mate',0,'b')==='+M0'&&X.evalPct('mate',0,'b')===98,'a mated Black is a win for White');
ok(X.evalPct('cp',0,'w')===50,'a level position puts the bar in the middle');
ok(X.evalPct('cp',9000,'w')===98&&X.evalPct('cp',-9000,'w')===2,'and a crushing score does not overflow it');
ok(X.evalLabel({t:'mate',v:0,stm:'w',over:'mate'})==='Checkmate — Black wins','a finished game is described, not scored');
ok(X.evalLabel({t:'mate',v:0,stm:'b',over:'mate'})==='Checkmate — White wins','for either winner');
ok(X.evalLabel({t:'cp',v:0,stm:'w',over:'draw'})==='Drawn position','a draw likewise');
ok(X.evalLabel({t:'cp',v:50,stm:'w',d:18})==='+0.5','an ordinary position keeps its number');
ok(X.evalLabel(null)==='','and nothing renders nothing');
ok(X.evalDepth({t:'cp',v:5,stm:'w',d:18})==='depth 18','how deep the search got is available to show');
ok(X.evalDepth({t:'mate',v:0,stm:'w',over:'mate',d:0})==='','but not for a position that needed no search');

/* the depth really comes from the engine's own output */
attach();mock.delay=10;
let depth=null;
X.analysePos(START,(ev)=>{depth=ev&&ev.d;});
await sleep(120);
ok(depth===14,'the reported depth is the one the engine announced ('+depth+')');

/* mate scores survive the round trip */
attach();
KNOWN[START]={cp:0,mate:2,best:'d1h5'};
let mateEv=null;
X.analysePos(START,(ev)=>{mateEv=ev;});
await sleep(120);
ok(mateEv&&mateEv.t==='mate'&&mateEv.v===2,'a mate score is carried through as a mate, not flattened to centipawns');
KNOWN[START]={cp:25,best:'e2e4'};

/* ============ the review's arithmetic ============ */
ok(X.winPct(0)===50,'an equal position is a 50% expectation');
ok(X.winPct(300)>75&&X.winPct(300)<95,'three pawns up is winning but not certain ('+Math.round(X.winPct(300))+'%)');
ok(X.winPct(-300)===100-X.winPct(300),'and the curve is symmetric');
ok(X.cpOf({t:'mate',v:1})===2000&&X.cpOf({t:'mate',v:-1})===-2000,'a mate is clamped to a decisive score, with its sign');
ok(X.cpOf({t:'cp',v:50})===50,'an ordinary score passes through');
ok(X.cpOf(null)===0,'a missing evaluation is treated as level, not as a win');

/* ============ the bot strength curve is untouched by all this ============ */
const weak=X.botParams(800),strong=X.botParams(2700);
ok(weak.Lcap>strong.Lcap,'a weaker bot still accepts worse moves');
ok(strong.depth>weak.depth,'a stronger bot still searches deeper');
ok(strong.Lcap<=20,'and a titled-strength bot still never hangs a piece');

/* ============ no shared mutable state is left behind ============ */
ok(!/app\._evTmp/.test(script),'the shared evaluation slot is gone');
ok(!/Engine\.onInfo\s*=/.test(script),'and so is the shared info callback');
ok(!/this\._selecting/.test(script),'the flag that let one search change another’s mode is gone');
ok(/_seq:0/.test(script)&&/req\.id=\+\+this\._seq/.test(script),'every search carries a ticket');
ok(/readyok/.test(script),'the engine handshake is waited for before commands are sent');

/* ============ judging a move ============ */
ok(X.bookPrefix(['e4'])===true,'a first move of theory counts as theory');
ok(X.detectOpening(['e4'])===null,'even though no opening can be named from one move yet');
ok(X.bookPrefix(['e4','e5','Nf3','Nc6'])===true,'and so does a known sequence');
ok(X.bookPrefix(['h4','a5','Rh3'])===false,'while nonsense does not');
ok(X.bookPrefix([])===false,'and no moves is not theory');

/* Build a finished review by hand, so the classifier can be judged on its own.
   Evaluations are as the engine gives them: from the side to move. */
function judge(sans,evals,bests,side){
  const c=new Chess(),fens=[c.fen()],moves=[];
  for(const s of sans){const m=c.move(s);moves.push({san:m.san,from:m.from,to:m.to});fens.push(c.fen());}
  X.store.brilliancies=[];
  X.app.review={status:'analyzing',startFen:fens[0],fens:fens,moves:moves,
    evals:evals.map(v=>(v&&typeof v==='object')?v:{t:'cp',v:v}),
    best:bests||moves.map(m=>m.from+m.to),i:fens.length,pos:0,meta:{side:side||null},
    classes:[],accW:null,accB:null};
  X.reviewFinish();
  return X.app.review;
}
// 1.e4 with a 60-centipawn wobble between two searches of different depth:
// that is noise, and must not be reported as a mistake by the player.
let R=judge(['e4','e5','Nf3'],[75,-9,72,-26],['b1c3','b8c6','b1c3']);
ok(R.classes[0]==='book','a theory move is not accused because two searches disagreed by half a pawn');
ok(R.classes[1]==='book'&&R.classes[2]==='book','nor are the theory moves after it');
// the same wobble outside any book line
R=judge(['h4','a5','Rh3'],[20,-20,18,-22],['b1c3','b8c6','b1c3']);
ok(R.classes.every(c=>c==='good'||c==='best'),'and off the beaten track it is still only noise, not a mistake ('+R.classes.join(',')+')');
// theory that loses a piece is still a mistake: being in a book does not excuse it
R=judge(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','d5','exd5','Nxd5'],
        [30,-30,30,-30,30,-30,30,-30,30,-30,300],['b1c3','b8c6','b1c3','b8c6','b1c3','b8c6','b1c3','b8c6','b1c3','c6a5'],'b');
ok(R.classes[9]==='mistake'||R.classes[9]==='blunder',
  'a book move that hands over a piece is judged on its merits, not excused as theory ('+R.classes[9]+')');
ok(R.key&&R.key.ply===10,'and it is picked out as the moment the game turned');
ok(R.key.played==='Nxd5'&&R.key.better==='Na5','naming both what was played and what was better');
// the key moment only looks at the player's own moves
R=judge(['d4','d5','c4','Qd6'],[20,-20,20,-20,600],['b1c3','b8c6','b1c3','e7e6'],'w');
ok(R.key===null,'a review of your White games does not hand you your opponent\u2019s blunder as your key moment');
// a genuine collapse is a blunder wherever it happens
R=judge(['d4','d5','c4','Qd6'],[20,-20,20,-20,600],['b1c3','b8c6','b1c3','e7e6']);
ok(R.classes[3]==='blunder','losing six pawns in one move is a blunder ('+R.classes[3]+')');
// playing the engine's own move is never criticised
R=judge(['e4','e5','Qh5'],[20,-20,20,-400],['e2e4','e7e5','d1h5']);
ok(R.classes[2]==='best','the engine\u2019s own choice is never called a mistake, whatever happens next');
ok(X.REV_NOISE_CP>=20&&X.REV_NOISE_CP<=60,'the noise floor is a sane size ('+X.REV_NOISE_CP+'cp)');
ok(X.REV_BOOK_MAX<=10,'and theory stops excusing a move once it costs more than an inaccuracy');
// accuracy still comes out of the same numbers
R=judge(['e4','e5'],[20,-20,20],['e2e4','e7e5']);
ok(R.accW===100&&R.accB===100,'a game of only best moves scores full marks ('+R.accW+'/'+R.accB+')');
R=judge(['d4','d5','c4','Qd6'],[20,-20,20,-20,600],['b1c3','b8c6','b1c3','e7e6']);
ok(R.accB<R.accW,'and a player who blunders scores below one who does not');
ok(/mpv\|\|3/.test(script)||/req\.mpv\|\|3/.test(script),'the number of lines searched is per request');
ok(/Engine\.analyse\(fen,16,[\s\S]{0,600}null,null,1\)/.test(script),'and Review asks for one line, which is searched better than three');

console.log('\n✅ engine: '+pass+' checks passed');
