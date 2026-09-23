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
const X=new Function(script+'\nreturn {store,app,render,cgAll,cgOpening,cgResultWord,cgSearch,cgSort,cgSortKey,'+
  'cgPages,cgPageNo,cgOpen,cgPgn,cgPgnAll,cgPgnResult,cgRow,careerGames,cgExport,cgSearchNow,pgnEscape,'+
  'playNoteClock,replayPanel,replayable,replaySpent,parseOnePGN,detectOpening,freshCareer,openingReport,'+
  'CG_KEEP,CG_PAGE,CG_SORTS,FORMAT_TC};')();

/* A career game, the way archiveCareerGame writes one. */
const SANS=['e4','e5','Nf3','Nc6','Bc4','Bc5','d3','Nf6','O-O','d6','c3','O-O','Bg5','h6'];
function mv(sans){const c=new Chess(),out=[];sans.forEach(function(s){const m=c.move(s);out.push({from:m.from,to:m.to,san:m.san});});return out;}
const DAY=86400000, NOW=Date.now();
function CG(o){return Object.assign({moves:mv(SANS),startFen:null,opp:'Tom Knox',oppRating:1533,
  oppTitle:'',result:1,color:'w',format:'classical',event:'Local Club Championship',date:NOW-DAY,
  c960:false,bri:false,myRating:1500,clk:null,base:1800,inc:20},o);}
X.store.career=X.freshCareer();
X.store.career.name='Ada Marín';
const reset=()=>{X.app.cgQ='';X.app.cgSort='new';X.app.cgPage=0;X.app.cgMsg=null;};

/* ================= READING A GAME ================= */
reset();
X.store.career.games=[CG()];
ok(X.cgAll().length===1,'the career games are where the panel looks for them');
let o=X.cgOpening(CG());
ok(o&&typeof o.name==='string'&&o.name.length>2,'a game long enough to name an opening names one ('+(o&&o.name)+')');
ok(X.cgOpening({moves:mv(['e4','e5'])})===null,'two moves is not an opening');
ok(X.cgOpening(null)===null,'and no game is not either');
ok(X.cgResultWord(CG({result:1}))==='win'&&X.cgResultWord(CG({result:0}))==='loss'
  &&X.cgResultWord(CG({result:0.5}))==='draw','a result reads as a word, so it can be searched for');

/* ================= SEARCHING ================= */
reset();
const set=[
  CG({opp:'Tom Knox',result:1,date:NOW-1*DAY,event:'Local Club Championship',oppRating:1533}),
  CG({opp:'Ella Boyd',result:0,date:NOW-2*DAY,event:'City Open',oppRating:1802,oppTitle:'IM'}),
  CG({opp:'Kai Beck',result:0.5,date:NOW-3*DAY,event:'City Open',oppRating:1610,format:'rapid'}),
  CG({opp:'Liam Wood',result:1,date:NOW-4*DAY,event:'Candidates Tournament',oppRating:2700,bri:true,
      moves:mv(['d4','d5','c4','e6','Nc3','Nf6','Bg5','Be7'])}),
];
X.store.career.games=set;
ok(X.cgSearch(set).length===4,'with no search every game is listed');
X.app.cgQ='knox';
ok(X.cgSearch(set).length===1&&X.cgSearch(set)[0].opp==='Tom Knox','a name finds that opponent, whatever the case');
X.app.cgQ='city open';
ok(X.cgSearch(set).length===2,'an event finds the games played in it');
X.app.cgQ='im';
ok(X.cgSearch(set).some(g=>g.oppTitle==='IM'),'a title is searchable');
X.app.cgQ='loss';
ok(X.cgSearch(set).length===1&&X.cgSearch(set)[0].result===0,'and so is how the game went');
X.app.cgQ='draw';
ok(X.cgSearch(set).length===1&&X.cgSearch(set)[0].result===0.5,'including the draws');
X.app.cgQ='rapid';
ok(X.cgSearch(set).length===1,'the format is searchable too');
const detected=X.cgOpening(set[3]);
X.app.cgQ=detected.name.split(' ')[0].toLowerCase();
ok(X.cgSearch(set).length>=1,'and the opening by name ('+detected.name+')');
X.app.cgQ='nothing like this at all';
ok(X.cgSearch(set).length===0,'a search that matches nothing matches nothing');
reset();

/* ================= SORTING ================= */
let sorted=X.cgSort(set);
ok(sorted[0].opp==='Tom Knox','newest first by default');
X.app.cgSort='old';
ok(X.cgSort(set)[0].opp==='Liam Wood','oldest first turns it round');
X.app.cgSort='long';
ok(X.cgSort(set)[0].moves.length===14,'longest first really is the longest');
X.app.cgSort='tough';
ok(X.cgSort(set)[0].oppRating===2700,'toughest first reads the opponent rating');
X.app.cgSort='best';
sorted=X.cgSort(set);
ok(sorted[0].bri===true,'"best games" puts a Game of the Day first');
ok(sorted[1].result===1,'then a win');
X.app.cgSort='best';
const noBri=set.map(g=>Object.assign({},g,{bri:false}));
ok(X.cgSort(noBri)[0].oppRating===2700,'and with no brilliancy, the best win you ever had');
X.app.cgSort='rubbish';
ok(X.cgSortKey()==='new','an unknown sort falls back to the newest');
ok(X.cgSort([]).length===0&&X.cgSort(null).length===0,'sorting nothing is safe');
reset();

/* ================= PAGING ================= */
ok(X.cgPages(0)===1,'an empty list is one page');
ok(X.cgPages(X.CG_PAGE+1)===2,X.CG_PAGE+' to a page, so '+(X.CG_PAGE+1)+' games is two');
X.app.cgPage=99;
ok(X.cgPageNo(X.CG_PAGE+1)===1,'asking past the end lands on the last page');
X.app.cgPage=-3;
ok(X.cgPageNo(50)===0,'and before the start on the first');
reset();
ok(X.CG_KEEP>=100,'a career keeps a real archive, not a handful ('+X.CG_KEEP+' games)');

/* ================= ONTO THE ANALYSIS BOARD ================= */
reset();
X.store.career.games=[CG({color:'w',opp:'Tom Knox',oppTitle:'FM',clk:[1795,1798,1780,1790],base:1800,inc:20})];
ok(X.cgOpen(0)===true,'a career game opens on the board');
let L=X.app.live;
ok(X.app.view==='livegame','the analysis board, the same one the tracker uses');
ok(L.kind==='career','and it knows it is a career game');
ok(L.white==='Ada Marín','you are White, under your own name');
ok(L.black==='FM Tom Knox','and your opponent keeps their title');
ok(L.side==='w','the board is yours to look at from your own side');
ok(L.fens.length===SANS.length+1,'every position of the game is there');
ok(L.moves.length===SANS.length,'and every move');
ok(L.pos===0,'it opens at the start');
ok(L.result==='won','it remembers how it ended');
ok(L.event==='Local Club Championship','and where it was played');
ok(L.myRating===1500&&L.oppRating===1533,'with both ratings');
ok(L.clk&&L.clk.length===4&&L.base===1800&&L.inc===20,'and the clock readings, so it can be watched back');
ok(L.url==='','there is no Chess.com link for a game you played here');
X.store.career.games=[CG({color:'b'})];
X.cgOpen(0);
ok(X.app.live.side==='b'&&X.app.live.black==='Ada Marín','as Black you are the one at the bottom');
X.store.career.games=[CG({c960:true})];
ok(X.cgOpen(0)===false,'a Chess960 game is not opened — the engine cannot read one');
ok(X.cgOpen(99)===false,'and neither is a game that is not there');

/* the replay panel takes a career game with clocks */
X.store.career.games=[CG({clk:[1795,1798,1780,1790,1700,1780,1690,1770,1660,1750,1650,1740,1600,1730]})];
X.cgOpen(0);
ok(X.replayable(X.app.live)===true,'a career game with clock readings can be replayed at its own pace');
let rp=X.replayPanel();
ok(/Watch it back/.test(rp),'the replay offers to play it');
ok(X.replaySpent(X.app.live,1)===25,'and reads the first move as 25 seconds (1800+20−1795)');
X.store.career.games=[CG({clk:null})];
X.cgOpen(0);
rp=X.replayPanel();
ok(/played without a clock/.test(rp),'a game played without a clock says so');
ok(!/imported before/.test(rp),'rather than telling you to sync a game you never imported');

/* ================= THE PGN ================= */
reset();
let g=CG({color:'w',result:1,opp:'Tom Knox',oppTitle:'FM',oppRating:1533,myRating:1500,
  event:'Local Club Championship',date:new Date(Date.UTC(2026,4,3,10,0,0)).getTime()});
let pgn=X.cgPgn(g,'Ada Marín');
ok(/\[Event "Local Club Championship"\]/.test(pgn),'the PGN names the event');
ok(/\[White "Ada Marín"\]/.test(pgn)&&/\[Black "FM Tom Knox"\]/.test(pgn),'and both players the right way round');
ok(/\[Result "1-0"\]/.test(pgn),'a win as White is 1-0');
ok(/\[Date "2026\.05\.03"\]/.test(pgn),'the date is written the way a PGN writes one');
ok(/\[WhiteElo "1500"\]/.test(pgn)&&/\[BlackElo "1533"\]/.test(pgn),'the ratings go to the right colours');
ok(/\[TimeControl/.test(pgn),'the time control is recorded');
ok(/\[Opening "/.test(pgn),'so is the opening');
ok(/1\. e4 e5 2\. Nf3 Nc6/.test(pgn),'the moves are numbered properly');
ok(/1-0\s*$/.test(pgn),'and the result closes the game');
ok(X.cgPgnResult(CG({color:'b',result:1}))==='0-1','a win as Black is 0-1');
ok(X.cgPgnResult(CG({color:'b',result:0}))==='1-0','a loss as Black is 1-0');
ok(X.cgPgnResult(CG({result:0.5}))==='1/2-1/2','and a draw is a draw either way');
let pgnB=X.cgPgn(CG({color:'b',result:0,myRating:1490,oppRating:1700}),'Ada Marín');
ok(/\[White "Tom Knox"\]/.test(pgnB)&&/\[Black "Ada Marín"\]/.test(pgnB),'as Black you are named second');
ok(/\[BlackElo "1490"\]/.test(pgnB)&&/\[WhiteElo "1700"\]/.test(pgnB),'and the Elos swap with you');

/* it has to be a PGN the app itself can read back */
const parsed=X.parseOnePGN(pgn);
ok(parsed&&parsed.root&&parsed.root.children.length===1,'the app can parse its own PGN back');
let n=parsed.root,walked=[];
while(n.children.length){n=n.children[0];walked.push(n.san);}
ok(walked.join(' ')===SANS.join(' '),'and every move survives the round trip');
ok(parsed.headers.White==='Ada Marín','with the headers intact');

/* a game from a set-up position carries the position with it */
const cust=CG({startFen:'8/8/8/4k3/8/8/4P3/4K3 w - - 0 1',moves:[]});
ok(/\[FEN "8\/8/.test(X.cgPgn(cust,'Ada')),'a game that did not start from the initial position says so');
ok(/\[SetUp "1"\]/.test(X.cgPgn(cust,'Ada')),'the way a PGN reader expects');
ok(!/\[FEN/.test(pgn),'and an ordinary game does not carry a redundant one');

/* quotes in a name cannot break the file */
ok(!/"/.test(X.pgnEscape('Tom "Rook" Knox').replace(/[^"]/g,'')),'a quote in a name is stripped rather than left to break the file');
ok(X.pgnEscape(null)===''&&X.pgnEscape(undefined)==='','and nothing escapes to nothing');

/* the whole set */
X.store.career.games=set;
const all=X.cgPgnAll(set);
ok((all.match(/\[Event /g)||[]).length===4,'every game is in the export');
ok((all.match(/\[Result /g)||[]).length===4,'each with its own result');
ok(X.cgPgnAll([])===''&&X.cgPgnAll(null)==='','and nothing exports to nothing');

/* ================= THE ROWS AND THE PANEL ================= */
reset();
X.store.career.games=set;
let row=X.cgRow(set[1],1);
ok(/data-act="cgopen" data-val="1"/.test(row),'a row opens the right stored game');
ok(/Ella Boyd/.test(row),'it names the opponent');
ok(/IM/.test(row),'with their title');
ok(/Lost/.test(row),'says how it went');
ok(/City Open/.test(row),'and where');
ok(/\(1802, \+302\)/.test(row),'a big rating gap is spelled out');
ok(!/\+33/.test(X.cgRow(CG({oppRating:1533,myRating:1500}),0)),'a small one is not noise on the screen');
row=X.cgRow(set[3],3);
ok(/✨/.test(row),'a Game of the Day is marked as one');
row=X.cgRow(CG({c960:true}),0);
ok(/960/.test(row)&&!/cgopen/.test(row),'a 960 game says so instead of offering a board that cannot read it');
row=X.cgRow(CG({opp:'<script>'}),0);
ok(/&lt;script&gt;/.test(row),'an opponent name is escaped, not run');

let card=X.careerGames(X.store.career);
ok(/id="cg-q"/.test(card),'the panel has a search box');
ok(/data-act="cgpgn"/.test(card),'and the PGN download');
ok(X.CG_SORTS.every(s=>card.indexOf('data-val="'+s[0]+'"')>=0),'every way of sorting');
ok(/4 games/.test(card),'it counts what it is showing');
ok((card.match(/cgopen/g)||[]).length===4,'with a button per game');
ok(!/data-act="cgpage"/.test(card),'four games need no paging');
X.store.career.games=[];
ok(X.careerGames(X.store.career)==='','and with no games at all the panel stays away');
/* paging appears once there are enough */
X.store.career.games=[];
for(let i=0;i<X.CG_PAGE+5;i++)X.store.career.games.push(CG({opp:'Rival'+i,date:NOW-i*DAY}));
card=X.careerGames(X.store.career);
ok((card.match(/cgopen/g)||[]).length===X.CG_PAGE,'one page of rows at a time');
ok(/data-act="cgpage" data-val="1"/.test(card),'with a way to the next page');
ok(card.indexOf('1–'+X.CG_PAGE+' of '+(X.CG_PAGE+5))>=0,'saying where you are');
X.app.cgPage=1;
card=X.careerGames(X.store.career);
ok(card.indexOf('of '+(X.CG_PAGE+5))>=0,'and the second page knows the total');
X.app.cgPage=0;
/* the index survives sorting — a sorted row must still open its own game */
X.app.cgSort='tough';
X.store.career.games=set;
card=X.careerGames(X.store.career);
const first=(card.match(/data-act="cgopen" data-val="(\d+)"/)||[])[1];
ok(X.store.career.games[+first].oppRating===2700,
  'sorted by opposition, the top row still opens the game it names (index '+first+')');
reset();
X.app.cgQ='no such game';
card=X.careerGames(X.store.career);
ok(/Nothing matches/.test(card),'a search with no hits says so');
ok(!/cgopen/.test(card),'and lists nothing');
reset();
X.app.cgMsg='4 games saved as a PGN file.';
ok(/4 games saved/.test(X.careerGames(X.store.career)),'after a download it says what was written');
reset();

/* ================= THE CLOCK READINGS ARE RECORDED ================= */
X.app.playFen=new Chess().fen();                       // White to move: Black just moved
X.app.playMoves=[{san:'e4'},{san:'e5'}];
X.app.clock={w:1770000,b:1782500,inc:20000};
X.app.playClk=[];
X.playNoteClock();
ok(X.app.playClk[1]===1782.5,'the reading kept is the clock of whoever just moved ('+X.app.playClk[1]+')');
X.app.playFen='rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
X.app.playMoves=[{san:'e4'}];
X.app.playClk=[];
X.playNoteClock();
ok(X.app.playClk[0]===1770,'and with White to have moved it is White’s clock ('+X.app.playClk[0]+')');
X.app.clock=null;X.app.playClk=[];
X.playNoteClock();
ok(X.app.playClk.length===0,'a game with no clock records no readings');

/* ================= WIRED IN, NOT JUST WRITTEN ================= */
ok(/playNoteClock\(\);sfxSan/.test(script),'the clock is noted after your own move');
ok(/addIncrement\(eng\);playNoteClock\(\)/.test(script),'and after the engine’s');
ok(/myRating:youRating\(c,fmt\)\|\|c\.rating\|\|0/.test(script),'a finished game keeps the rating you had');
ok(/clk:\(app\.playClk&&app\.playClk\.length\)/.test(script),'and the clock readings it was played on');
ok(/if\(c\.games\.length>CG_KEEP\)/.test(script),'the archive is trimmed to the keep limit');
ok(/clk:\(app\.playClk\|\|\[\]\)\.slice\(\)/.test(script),'an interrupted game carries its readings through a resume');
ok(/act==='cgopen'\)cgOpen/.test(script),'the board button is connected');
ok(/act==='cgpgn'\)cgExport\(\)/.test(script),'so is the export');
ok(/act==='cgq'\)cgSearchNow\(\)/.test(script),'and the search');
ok(/id==='cg-q'&&e\.key==='Enter'/.test(script),'with Enter to run it');
ok(/L\.kind==='career'\n?\s*\?\s*'<button class="btn ghost sm" data-act="nav" data-val="career">← Career/.test(script),
  'the board sends a career game back to the career, not to the tracker');
ok(/application\/x-chess-pgn/.test(script),'the file is offered as a PGN, so any chess program opens it');
ok(/h\+=careerGames\(c\);/.test(script),'and the panel is actually rendered');

console.log('\n✅ cgames: '+pass+' checks passed');
