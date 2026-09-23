/* The annotated game: a column written about a career game, with no engine.
   These checks cover each detector on a position built to contain exactly the
   thing it looks for, the grammar (the notes are written about "You" or about
   a surname, and English does not conjugate those the same way), the ranking
   (nine notes out of however many were found), and the two places the column
   is printed — the analysis board and the magazine. */
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
const X=new Function(script+'\nreturn {store,app,annoWas,annoHas,annoSurname,annoName,annoMoveNo,'+
  'annoMatWord,annoScan,annoCastles,annoQueensOff,annoSac,annoBreak,annoThink,annoTimeTrouble,'+
  'annoNotes,annoIntro,annoVerdict,annoBuild,annoNoteAt,annoPanel,magGamePick,magGameCard,magOpenGame,'+
  'ANNO_MAX,ANNO_MIN_PLY,freshCareer,lifeInit,magBuild,viewMagazine,render};')();
X.store.career=X.freshCareer();
X.store.career.name='Ada Marín';

const G=(sans,o)=>Object.assign({moves:sans.split(' ').map(s=>({san:s})),startFen:null,
  opp:'Rowan Brunswick',oppRating:2300,oppTitle:'IM',myRating:2280,result:1,color:'w',
  event:'Reykjavík Open',date:Date.now(),clk:null,base:0,inc:0},o||{});

const LEGAL='e4 e5 Nf3 Nc6 Bc4 d6 Nc3 Bg4 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#';
const OPPO='e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e6 f3 b5 Qd2 Nbd7 O-O-O Bb7 g4 Be7 h4 O-O g5 Nh5 Kb1';
const PROMO='a8=Q g6 Qa7+ Kh6 Qb8 Kh5 Qg3 Kh6 Qg4 Kh7 Qxg6+ Kh8 Qg7#';
const QUEENS='Qxd7+ Kxd7 a4 a5 b4 axb4 h4 h5 g3 g6';

/* ================= THE MOVES REPLAY ================= */
let S=X.annoScan(G(LEGAL));
ok(S.sans.length===13,'a game replays every move it was given ('+S.sans.length+')');
ok(S.fens.length===14,'and keeps a position after each one');
ok(S.moves[0].from==='e2'&&S.moves[0].to==='e4','with the squares, so the board can show the last move');
ok(X.annoScan(G('e4 Qxq9 Nf3')).sans.length===1,'an impossible move stops the replay rather than throwing');
ok(X.annoScan({}).sans.length===0,'and an empty game scans to nothing');
ok(X.annoScan(G(PROMO,{startFen:'8/P5pk/8/8/8/8/5PPK/8 w - - 0 1'})).sans.length===13,
  'a game that did not start from the initial position replays too');

/* ================= HOW A MOVE IS WRITTEN ================= */
ok(X.annoMoveNo(1)==='1.','White’s first move is 1.');
ok(X.annoMoveNo(2)==='1…','Black’s first is 1…');
ok(X.annoMoveNo(23)==='12.','and ply 23 is move 12 for White');
ok(X.annoMoveNo(24)==='12…','with ply 24 the reply');
ok(X.annoMatWord(9)==='a queen'&&X.annoMatWord(-9)==='a queen','nine points is a queen, either way round');
ok(X.annoMatWord(5)==='a rook'&&X.annoMatWord(3)==='a piece','five a rook, three a piece');
ok(X.annoMatWord(4)==='a piece and a pawn','four is a piece and a pawn');
ok(X.annoMatWord(2)==='two pawns'&&X.annoMatWord(1)==='a pawn','and the small change is counted in pawns');

/* ================= WHO IS "YOU" ================= */
ok(X.annoSurname('Rowan Brunswick')==='Brunswick','an opponent goes by their surname');
ok(X.annoSurname('Pelletier')==='Pelletier','one name stays one name');
ok(X.annoSurname('')==='your opponent','and a nameless one is described');
ok(X.annoName({color:'w',opp:'Rowan Brunswick'},true)==='You','you are You when you had White');
ok(X.annoName({color:'w',opp:'Rowan Brunswick'},false)==='Brunswick','and they are the surname');
ok(X.annoName({color:'b',opp:'Rowan Brunswick'},true)==='Brunswick','the other way round when you had Black');
ok(X.annoName({color:'b',opp:'Rowan Brunswick'},false)==='You','and you are still You');
/* the trap the commentary booth fell into: "Brunswick has" but "You have" */
ok(X.annoWas('You')==='were'&&X.annoWas('Brunswick')==='was','"You were", "Brunswick was"');
ok(X.annoHas('You')==='have'&&X.annoHas('Brunswick')==='has','"You have", "Brunswick has"');

/* ================= THE SACRIFICE ================= */
/* Légal's mate: the queen goes on move 5 and never comes back. */
let g=G(LEGAL);S=X.annoScan(g);
let sac=X.annoSac(g,S);
ok(sac&&sac.ply===9,'the queen sacrifice is found on the move that offered it, not the capture');
ok(sac.white===true,'and attributed to the side that made it');
ok(sac.net<=-8,'the deal was eight points ('+sac.net+')');
/* a plain exchange is not a sacrifice */
let ex=G('e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 Nxe5 Qd4 Nf3 Qxe4+');
ok(X.annoSac(ex,X.annoScan(ex))===null,'trading a bishop for a knight is not a sacrifice');
/* a pawn grab that is recaptured is not one either */
let pg=G('d4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5 Qf3 Nc6');
ok(X.annoSac(pg,X.annoScan(pg))===null,'nor is a pawn that comes straight back');
ok(X.annoSac(G('e4 e5 Nf3 Nc6 Bc4 Bc5 d3 d6'),X.annoScan(G('e4 e5 Nf3 Nc6 Bc4 Bc5 d3 d6')))===null,
  'a quiet game has no sacrifice in it at all');

/* ================= THE CASTLING ================= */
let C=X.annoCastles(OPPO.split(' '));
ok(C.wc===17&&C.ws==='long','White castled long on ply 17');
ok(C.bc===22&&C.bs==='short','Black castled short on ply 22');
C=X.annoCastles('e4 e5 Nf3 Nc6 Bc4 Bc5 O-O O-O'.split(' '));
ok(C.ws==='short'&&C.bs==='short','both short is read as both short');
C=X.annoCastles('e4 e5 Nf3 Nc6'.split(' '));
ok(C.wc===-1&&C.bc===-1,'and a game where nobody castled says so');

/* ================= THE QUEENS ================= */
let qg=G(QUEENS,{startFen:'4k3/pppq1ppp/8/8/8/8/PPPQ1PPP/4K3 w - - 0 1',result:0.5});
ok(X.annoQueensOff(X.annoScan(qg))===2,'the queens leave on the recapture, ply 2');
ok(X.annoQueensOff(X.annoScan(G(OPPO)))===-1,'a game with the queens still on returns nothing');
ok(X.annoQueensOff({fens:[]})===-1,'and so does no game');

/* ================= THE MATERIAL BREAK ================= */
let brk=X.annoBreak(X.annoScan(G(LEGAL)));
ok(brk&&brk.ply===10,'the material broke when the queen came off, ply 10');
ok(brk.sign===-1,'in Black’s favour');
ok(brk.amt>=8,'by eight points or more ('+brk.amt+')');
ok(X.annoBreak(X.annoScan(G('e4 e5 Nf3 Nc6 Bc4 Bc5 d3 d6 O-O O-O')))===null,
  'a level game never broke');

/* ================= THE CLOCK ================= */
/* 90 minutes, with one four-minute think on move 9 */
const clk=[];let w=5400,b=5400;
for(let i=0;i<22;i++){
  if(i%2===0){w-=(i===16?260:12);clk.push(w);}
  else{b-=11;clk.push(b);}
}
let tg=G(OPPO,{clk:clk,base:5400,inc:30});
let th=X.annoThink(tg,X.annoScan(tg));
ok(th&&th.ply===17,'the longest think is found on the move it was spent on');
ok(th.secs>200,'and measured in seconds ('+Math.round(th.secs)+')');
ok(th.times>=4,'against the median think, which it dwarfs ('+th.times+'×)');
ok(X.annoThink(G(OPPO),X.annoScan(G(OPPO)))===null,'a game with no clock recorded has no long think');
/* a blitz game where every move is quick should not report a "long think" */
const fast=[];let fw=180,fb=180;
for(let i=0;i<22;i++){if(i%2===0){fw-=(i===16?9:1);fast.push(fw);}else{fb-=1;fast.push(fb);}}
let fg=G(OPPO,{clk:fast,base:180,inc:2});
ok(X.annoThink(fg,X.annoScan(fg))===null,'nine seconds in a blitz game is not a long think');
/* time trouble */
const low=[];let lw=5400,lb=5400;
for(let i=0;i<22;i++){if(i%2===0){lw-=(i>=8?900:20);low.push(Math.max(20,lw));}else{lb-=15;low.push(lb);}}
let lg=G(OPPO,{clk:low,base:5400,inc:30});
let tt=X.annoTimeTrouble(lg,X.annoScan(lg));
ok(tt&&tt.ply>=9,'the moment somebody ran short is found ('+(tt&&tt.ply)+')');
ok(tt.left<=5400/12,'below a twelfth of the starting time');
ok(X.annoTimeTrouble(G(OPPO),X.annoScan(G(OPPO)))===null,'no clock, no time trouble');
ok(X.annoTimeTrouble(tg,X.annoScan(tg))===null,'and a comfortable game never gets there');

/* ================= THE NOTES ================= */
let N=X.annoNotes(g,X.annoScan(g));
ok(N.length>0,'a game gets notes');
ok(N.length<=X.ANNO_MAX,'no more than '+X.ANNO_MAX+' of them');
ok(N.every(n=>n.ply>=1&&n.ply<=13),'every note points at a real move');
ok(N.every(n=>n.san&&typeof n.san==='string'),'and carries the move it is about');
ok(N.every(n=>n.text&&n.text.length>20),'each with something to say');
ok(N.every(n=>!/undefined|NaN|\[object/.test(n.text)),'and nothing that leaked out of the code');
let plies=N.map(n=>n.ply);
ok(plies.slice().sort((a,b)=>a-b).join()===plies.join(),'the notes come out in the order they happened');
ok(new Set(plies).size===plies.length,'one note per move, never two');
ok(N.some(n=>n.ply===9&&/gave up the queen/.test(n.text)),'the sacrifice is named as a queen, not as its arithmetic');
ok(N.some(n=>n.ply===9&&/It worked/.test(n.text)),'and the note knows it came off');
ok(N.some(n=>n.ply===13&&/Mate/.test(n.text)),'the mate is the last word');
ok(/You gave up the queen/.test(N.filter(n=>n.ply===9)[0].text),'you get the credit when it was you');
/* the same game from the other side of the board */
let gb=G(LEGAL,{color:'b',result:0});
let Nb=X.annoNotes(gb,X.annoScan(gb));
ok(/Brunswick gave up the queen/.test(Nb.filter(n=>n.ply===9)[0].text),
  'and they get it when it was them');
ok(/It worked/.test(Nb.filter(n=>n.ply===9)[0].text),
  'their sacrifice worked, because from Black’s side of the board you lost');
/* the same idea, declined by the position: the queen goes and nothing comes of it */
const SACLOSS='e4 e5 Nf3 Nc6 Bc4 d6 Nc3 Bg4 Nxe5 Bxd1 Nxd1 Nxe5 O-O Nf6';
let gl=G(SACLOSS,{result:0});
let Nl=X.annoNotes(gl,X.annoScan(gl));
ok(Nl.some(n=>n.ply===9&&/You gave up the queen/.test(n.text)),
  'a sacrifice that did not end in mate is still a sacrifice');
ok(Nl.some(n=>n.ply===9&&/did not come off/.test(n.text)),
  'and one that lost the game is written up as one');
ok(Nl.some(n=>n.ply===9&&!/It worked/.test(n.text)),'without pretending otherwise');
/* the opposite-side castling note */
let No=X.annoNotes(G(OPPO,{result:0.5}),X.annoScan(G(OPPO)));
ok(No.some(n=>/opposite wings/.test(n.text)),'opposite castling gets its own note');
ok(No.some(n=>/You castled long, Brunswick castled short/.test(n.text)),
  'naming which king went where, in a tense that fits both subjects');
/* the promotion note */
let pgm=G(PROMO,{startFen:'8/P5pk/8/8/8/8/5PPK/8 w - - 0 1'});
let Np=X.annoNotes(pgm,X.annoScan(pgm));
ok(Np.some(n=>n.ply===1&&/pawn home/.test(n.text)),'a pawn reaching the eighth is remarked on');
ok(Np.some(n=>/new queen/.test(n.text)),'and a new queen is allowed to be decisive');
/* the draw */
let Nd=X.annoNotes(qg,X.annoScan(qg));
ok(Nd.some(n=>/Drawn after/.test(n.text)),'a draw ends with a draw');
ok(!Nd.some(n=>/had the point/.test(n.text)),'and nobody is awarded the point');
ok(Nd.some(n=>/queens came off/.test(n.text)),'the queens coming off is worth a note');
/* a game too short to have anything said about it */
ok(X.annoNotes(G('e4 e5 Nf3 Nc6'),X.annoScan(G('e4 e5 Nf3 Nc6'))).length===0,
  'four moves is not a game anybody writes about');
/* the ranking: when more is found than fits, the big moments survive */
let Nt=X.annoNotes(tg,X.annoScan(tg));
ok(Nt.length<=X.ANNO_MAX,'a game full of incident still fits in a column');
ok(Nt.some(n=>/opposite wings/.test(n.text)),'and the kings going opposite ways survives the cut');

/* ================= THE PARAGRAPH AT THE TOP ================= */
let I=X.annoIntro(g,X.annoScan(g));
ok(I.length>=2,'the column opens with a paragraph or two');
ok(/white pieces/.test(I[0]),'saying which side you had');
ok(/Reykjavík Open/.test(I[0]),'and where it was played');
ok(I.every(t=>!/undefined|NaN/.test(t)),'with nothing leaking out of the code');
let Iu=X.annoIntro(G(LEGAL,{oppRating:2500,myRating:2100}),X.annoScan(G(LEGAL)));
ok(Iu.some(t=>/400 points above you/.test(t)),'a gap in their favour is noted');
ok(Iu.some(t=>/Brunswick was rated/.test(t)),'in a tense that agrees with a surname');
let Iy=X.annoIntro(G(LEGAL,{oppRating:2100,myRating:2500}),X.annoScan(G(LEGAL)));
ok(Iy.some(t=>/400 points below you/.test(t)),'and a gap in yours');
let Ilong=X.annoIntro(G(OPPO),X.annoScan(G(OPPO)));
ok(Ilong.length>=1,'a longer game still gets an opening paragraph');

/* the verdict */
ok(/worth keeping/.test(X.annoVerdict(g,X.annoScan(g))),'a won sacrifice is remembered fondly');
ok(/idea in it/.test(X.annoVerdict(gb,X.annoScan(gb))),'a lost one is given its due');
ok(/Half a point each/.test(X.annoVerdict(qg,X.annoScan(qg))),'and a draw is a draw');

/* ================= THE WHOLE COLUMN ================= */
let A=X.annoBuild(g);
ok(A,'a game builds a column');
ok(/Ada Marín – IM Rowan Brunswick/.test(A.head),'headed the way a game is headed, White first');
ok(A.res==='1–0','with the result in the notation everybody uses');
ok(X.annoBuild(G(LEGAL,{color:'b',result:1})).res==='0–1','a win with Black is 0–1');
ok(X.annoBuild(G(LEGAL,{result:0.5})).res==='½–½','and a draw is a half each');
ok(/IM Rowan Brunswick – Ada Marín/.test(X.annoBuild(G(LEGAL,{color:'b'})).head),
  'the opponent goes first when they had White');
ok(A.plies===13,'the column knows how long the game was');
ok(A.notes.length>=3&&A.verdict&&A.intro.length,'and has notes, an opening and a verdict');
ok(X.annoBuild(G('e4 e5 Nf3'))===null,'three moves builds nothing');
ok(X.annoBuild(null)===null,'and neither does nothing');
ok(X.annoBuild(G(LEGAL,{c960:true}))===null,'a Chess960 game is left alone — the openings do not apply');
ok(X.annoNoteAt(A,9)&&X.annoNoteAt(A,9).ply===9,'a note can be looked up by move');
ok(X.annoNoteAt(A,8)===null,'and a move with nothing to say returns nothing');
ok(X.annoNoteAt(null,1)===null,'as does a column that does not exist');

/* ================= ON THE ANALYSIS BOARD ================= */
let L={kind:'career',anno:A,pos:0,moves:X.annoScan(g).moves};
let pan=X.annoPanel(L);
ok(/The game, written up/.test(pan),'the analysis board carries the column');
ok(/Reykjav|A game that left the book/.test(pan)||/intro/.test(pan),'showing the opening paragraph at the start');
ok((pan.match(/data-act="liveto"/g)||[]).length===A.notes.length,
  'with a button per note that jumps the board there');
L.pos=9;
pan=X.annoPanel(L);
ok(/gave up the queen/.test(pan),'stepping to the move shows its note');
ok(/5\. Nxe5/.test(pan),'headed with the move number');
L.pos=8;
pan=X.annoPanel(L);
ok(/Nothing to say about this move/.test(pan),'and a quiet move says so rather than repeating the last note');
ok(/'+A.verdict.slice(0,12)+'/.test(pan)||pan.indexOf(A.verdict.slice(0,20))>0,'the verdict sits at the bottom');
ok(X.annoPanel({kind:'game',pos:0})==='','a Chess.com game has no column and shows none');
ok(X.annoPanel(null)==='','and nor does nothing at all');

/* ================= THE MAGAZINE ================= */
const c=X.store.career;
X.lifeInit(c);
c.name='Ada Marín';
c.games=[G(OPPO,{result:0.5,bri:false,opp:'Tom Knox',oppRating:2100}),
         G(LEGAL,{result:1,bri:true,opp:'Rowan Brunswick',oppRating:2300})];
let pick=X.magGamePick(c);
ok(pick,'the magazine finds a game to print');
ok(pick.opp==='Rowan Brunswick','choosing the one the game picked out as brilliant');
ok(pick.moves.length===13&&pick.moves[0].san==='e4','and keeps its own copy of the moves');
ok(!pick.moves[0].from,'trimmed of what it does not need — the board replays them anyway');
ok(JSON.stringify(pick).length<3000,'so an issue stays small: '+JSON.stringify(pick).length+' bytes');
c.games=[G(OPPO,{result:0.5,opp:'Tom Knox',oppRating:2100}),
         G(LEGAL,{result:1,opp:'Rowan Brunswick',oppRating:2300})];
ok(X.magGamePick(c).opp==='Rowan Brunswick','with no brilliancy it takes the best win');
c.games=[G(OPPO,{result:0,opp:'Tom Knox',oppRating:2100})];
ok(X.magGamePick(c).opp==='Tom Knox','and with no win at all it prints the longest fight');
c.games=[G('e4 e5 Nf3',{result:1})];
ok(X.magGamePick(c)===null,'a season of three-move games gets no column');
c.games=[];
ok(X.magGamePick(c)===null,'and neither does a season with no games');

c.games=[G(LEGAL,{result:1,bri:true})];
const issue={no:3,season:3,date:Date.now(),game:X.magGamePick(c)};
X.app.magPly=0;
let card=X.magGameCard(issue,0);
ok(/Game of the issue/.test(card),'the issue prints a game');
ok(/game of the day/.test(card),'flagged when it was the one that won a prize');
ok(/class="board"/.test(card),'with a board');
ok(/data-act="magply"/.test(card),'and a way to step through it');
ok(/data-act="magopen"/.test(card),'and a way out to the full analysis board');
ok(/Step through it/.test(card),'the notes start hidden behind the moves that earn them');
X.app.magPly=9;
card=X.magGameCard(issue,0);
ok(/gave up the queen/.test(card),'stepping to move 5 prints its note');
ok(/5\. Nxe5/.test(card),'with the move it belongs to');
X.app.magPly=0;
ok(X.magGameCard({no:1},0)==='','an issue with no game prints no column');
ok(X.magGameCard(null,0)==='','and no issue prints nothing');

/* the issue keeps the game even after the archive has rolled past it */
c.seasonStart=null;
let built=X.magBuild(c,{season:4,games:20,won:12,lost:4,drawn:4,ratingFrom:2200,ratingTo:2260,
  peakFrom:2200,peakTo:2260,money:400,fame:2,titles:0,honors:0,norms:1,events:3,bril:1,best:null});
ok(built&&built.game,'a published issue carries its game with it');
ok(built.game.moves.length===13,'all of it');
c.games=[];
ok(built.game.moves.length===13,'and still has it once the archive is emptied');

/* ================= THE WAY OUT TO THE BOARD ================= */
c.issues=[built];
X.app.magIdx=0;
ok(X.magOpenGame(0)===true,'the issue’s game opens on the analysis board');
ok(X.app.view==='livegame','which is the same board everything else uses');
ok(X.app.live.anno&&X.app.live.anno.notes.length,'with the column attached');
ok(X.app.live.back==='magazine','and a way back to the issue you came from');
ok(X.app.live.fens.length===14,'the whole game is there to step through');
ok(X.app.live.white==='Ada Marín','with the right player on the right side');
c.issues=[{no:1,season:1,date:Date.now()}];
ok(X.magOpenGame(0)===false,'an issue with no game opens nothing');
c.issues=[];
ok(X.magOpenGame(0)===false,'and neither does no issue');

/* ================= NOTHING BREAKS ON REAL GAMES ================= */
/* fifty games played out by a crude policy: the column must never throw, never
   leak, and never point at a move that does not exist */
function autoGame(seed){
  const ch=new Chess();const sans=[];let r=seed;
  const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  for(let i=0;i<120;i++){
    const ms=ch.moves({verbose:true});
    if(!ms.length)break;
    const caps=ms.filter(m=>/x/.test(m.san)||/\+/.test(m.san));
    const pool=(caps.length&&rnd()<0.55)?caps:ms;
    const m=pool[Math.floor(rnd()*pool.length)%pool.length];
    ch.move(m.san);sans.push(m.san);
  }
  return sans;
}
let built2=0,noteTotal=0,worst=0;
for(let i=0;i<50;i++){
  const sans=autoGame(i*7919+13);
  const gg=G(sans.join(' '),{result:[0,0.5,1][i%3],color:i%2?'b':'w'});
  const AA=X.annoBuild(gg);
  if(!AA)continue;
  built2++;
  noteTotal+=AA.notes.length;
  worst=Math.max(worst,AA.notes.length);
  const n=X.annoScan(gg).sans.length;
  if(AA.notes.some(x=>x.ply<1||x.ply>n))throw new Error('FAIL: a note pointed off the end of game '+i);
  if(AA.notes.some(x=>/undefined|NaN|\[object/.test(x.text)))throw new Error('FAIL: a note leaked in game '+i);
  if(AA.intro.some(t=>/undefined|NaN/.test(t)))throw new Error('FAIL: an intro leaked in game '+i);
  if(/undefined|NaN/.test(AA.verdict))throw new Error('FAIL: a verdict leaked in game '+i);
  if(AA.notes.length>X.ANNO_MAX)throw new Error('FAIL: too many notes in game '+i);
  X.app.live={kind:'career',anno:AA,pos:Math.min(n,10),moves:[]};
  const p=X.annoPanel(X.app.live);
  if(!p||/undefined/.test(p))throw new Error('FAIL: the panel leaked on game '+i);
}
ok(built2>=40,built2+' of fifty played-out games got a column');
ok(worst<=X.ANNO_MAX,'none of them ran past '+X.ANNO_MAX+' notes (worst was '+worst+')');
ok(noteTotal/built2>=3,'and the average game got '+(Math.round(noteTotal/built2*10)/10)+' notes, not one');

console.log('\n✅ annotated games: '+pass+' checks passed');
