/* The crosstable: the grid every real tournament publishes.
   These checks cover the arithmetic (the grid is symmetric, a row adds up to
   the score the standings claim), the storage (a snapshot survives the
   tournament object, and only the recent events keep one) and the rendering
   (a real <table>, your row marked, both cell shapes accepted). */
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
const X=new Function(script+'\nreturn {store,app,xtGrid,xtSnapshot,xtPrune,xtCount,xtTable,xtSym,'+
  'xtLiveCard,xtHistCard,xtCell,XT_KEEP,tourPlayRound,standingsSorted,standingsRank,fmtScore,freshCareer,'+
  'careerFinishBanner,careerHistory};')();

function tour(n,o){
  const pool=[];
  for(let i=0;i<n;i++)pool.push({id:'p'+i,name:['Ella Boyd','Tom Knox','Kai Beck','Liam Wood','Leo Dahl',
    'Ana Vega','Ivo Sark','Mira Sol','Ren Ito'][i%9]+(i>8?' '+i:''),rating:2200+((i*37)%300),
    title:'IM',flag:'🇪🇸',score:0,you:false});
  pool.push({id:'__you',name:'Ada Marín',rating:2300,title:'IM',flag:'🇷🇴',score:0,you:true});
  return Object.assign({id:'t',name:'City Open',emoji:'🏙️',rounds:n,round:0,avg:2300,
    standings:pool,results:[],pairs:[],field:pool.filter(p=>!p.you).map(p=>({name:p.name,rating:p.rating}))},o||{});
}
X.store.career=X.freshCareer();

/* ================= THE ROUNDS ARE KEPT ================= */
let T=tour(8);
ok(!(T.pairs||[]).length,'a tournament starts with no games played');
X.tourPlayRound(T,0,1);
ok(T.pairs.length>=4,'one round records every board it played ('+T.pairs.length+')');
const mine=T.pairs.filter(p=>p.a==='__you'||p.b==='__you');
ok(mine.length===1,'including your own game, which the bulletin never stored');
ok(mine[0].r===1,'tagged with the round it was played in');
ok(mine[0].s===1,'and with your result');
for(let r=1;r<8;r++)X.tourPlayRound(T,r,r%2?0.5:1);
ok(T.pairs.length>=32,'eight rounds of a nine-player field is a lot of games ('+T.pairs.length+')');
ok(T.pairs.every(p=>p.r>=1&&p.r<=8),'every game knows its round');
ok(T.pairs.every(p=>p.s===0||p.s===0.5||p.s===1),'and every game has a real result');
ok(T.pairs.filter(p=>p.a==='__you'||p.b==='__you').length===8,'you played once a round, no more');

/* ================= THE GRID ================= */
let G=X.xtGrid(T);
ok(G&&G.players.length===9,'the grid has a row per player');
ok(G.grid.length===9&&G.grid.every(r=>r.length===9),'and is square');
ok(G.grid.every((r,i)=>r[i]===null),'nobody played themselves');
/* symmetry: what I did to you is the reverse of what you did to me */
let sym=true,pairsFound=0;
for(let i=0;i<9;i++)for(let j=0;j<9;j++){
  const a=G.grid[i][j],b=G.grid[j][i];
  if(a===null&&b===null)continue;
  if(!a||!b){sym=false;continue;}
  pairsFound++;
  // one game adds to 1, a pair that had to meet twice adds to 2
  if(Math.abs(a.s+b.s-a.n)>1e-9)sym=false;
  if(a.n!==b.n||a.r!==b.r)sym=false;
}
ok(sym,'a result and its mirror always add to the games they played, in the same round');
ok(pairsFound>=56,'and both halves of the grid are filled in ('+pairsFound+' cells)');
/* a row adds up to the score on the standings, to the point */
const byesOf=(T,id)=>T.pairs.filter(p=>p.a===id&&p.b===null).length*0.5;
let adds=true,off=null;
G.players.forEach((p,i)=>{
  const row=G.grid[i].reduce((t,c)=>t+(c?c.s:0),0);
  if(Math.abs(row+byesOf(T,p.id)-(p.score||0))>1e-9){adds=false;off=p.name+': '+row+' vs '+p.score;}
});
ok(adds,'every row adds up to that player’s score once byes are added back'+(off?' — '+off:''));
const me=G.players.findIndex(p=>p.you);
const myRow=G.grid[me].reduce((t,c)=>t+(c?c.s:0),0);
ok(Math.abs(myRow-G.players[me].score)<1e-9,'and your own row adds up exactly: '+X.fmtScore(myRow));
ok(G.players[0].score>=G.players[8].score,'the rows come out in standings order');
ok(X.xtGrid({standings:[]})===null,'an empty field has no crosstable');
ok(X.xtGrid(null)===null,'and neither does no tournament at all');

/* a bye is stored, and does not invent an opponent */
let B=tour(9);
for(let r=0;r<3;r++)X.tourPlayRound(B,r,1);
const byes=B.pairs.filter(p=>p.b===null);
let byeGrid=X.xtGrid(B);
ok(byeGrid.grid.every(row=>row.length===10),'an odd field still makes a square grid');
if(byes.length)ok(byes.every(p=>p.s===0.5),'a player who sat out got half a point and no opponent');
else ok(true,'this draw happened to pair everybody');

/* ================= A REMATCH IS NOT LOST ================= */
/* Nine players and eight rounds does not always leave an unmet opponent, so a
   small Swiss occasionally pairs two people twice. The second game used to
   overwrite the first — the grid then disagreed with the standings. */
ok(X.xtCell(null)===null,'an empty cell is nothing');
ok(X.xtCell({s:1,r:3}).n===1,'a live cell with no count is one game');
ok(X.xtCell({s:1.5,r:3,n:2}).n===2,'and a live cell with a count keeps it');
ok(X.xtCell([0.5,1,4]).s===0.5,'a stored triple reads back its score');
ok(X.xtCell([0.5,1,4]).r===4,'and the round it was played in');
ok(X.xtCell([0.5,1]).r===0,'an older two-number cell still reads, without a round');
ok(X.xtCell([1.5,2,3]).n===2,'and its number of games');
ok(X.xtCell(0).s===0&&X.xtCell(0).n===1,'a bare score from an older save still reads');
let R=tour(4);
R.pairs=[{r:1,a:'__you',b:'p0',s:1},{r:2,a:'__you',b:'p0',s:0}];
R.standings.forEach(p=>{p.score=p.id==='__you'?1:(p.id==='p0'?1:0);});
let RG=X.xtGrid(R);
const ri=RG.players.findIndex(p=>p.you),rj=RG.players.findIndex(p=>p.id==='p0');
ok(RG.grid[ri][rj].n===2,'two games against the same player make one cell of two');
ok(RG.grid[ri][rj].s===1,'holding the total you scored across both');
ok(RG.grid[rj][ri].s===1,'and the mirror holds theirs');
ok(RG.grid[ri][rj].s+RG.grid[rj][ri].s===2,'the pair still adds up to the games played');
let rt=X.xtTable(RG.players,RG.grid);
ok(/<sup/.test(rt),'the cell says it was more than one game');
ok(/over 2 games/.test(rt),'and spells it out on hover');
ok(/>1<sup/.test(rt),'showing the total, not the last result');

/* ================= THE SNAPSHOT ================= */
const snap=X.xtSnapshot(T);
ok(snap&&snap.players.length===9,'a snapshot keeps every player');
ok(snap.players.some(p=>p.you),'and remembers which one was you');
ok(snap.players[0].name&&snap.players[0].rating>0,'with the name and rating printed in the table');
ok(snap.grid.length===9,'the grid comes with it');
const cellSnap=snap.grid[me].filter(Boolean)[0];
ok(Array.isArray(cellSnap)&&cellSnap.length===3,
  'each cell stores three numbers — score, games, round — not an object');
ok(cellSnap[2]>=1,'so a stored grid still says which round a game was played in');
ok(JSON.stringify(snap).length<4000,'and one is small: '+JSON.stringify(snap).length+' bytes');
ok(X.xtSnapshot(tour(8))===null,'an event that has not started has nothing to snapshot');

/* ================= ONLY THE RECENT ONES ================= */
const c={history:[]};
for(let i=0;i<20;i++)c.history.push({name:'Event '+i,xt:X.xtSnapshot(T)});
ok(X.xtCount(c)===20,'twenty events with a grid each');
const kept=X.xtPrune(c);
ok(kept===X.XT_KEEP,'pruning keeps '+X.XT_KEEP);
ok(X.xtCount(c)===X.XT_KEEP,'and really drops the rest');
ok(c.history[0].xt&&c.history[X.XT_KEEP-1].xt,'the newest events are the ones kept');
ok(!c.history[X.XT_KEEP].xt&&!c.history[19].xt,'the oldest ones lost theirs');
ok(c.history.length===20,'but the history entries themselves are untouched');
ok(c.history[19].name==='Event 19','including their names and results');
X.xtPrune(c);
ok(X.xtCount(c)===X.XT_KEEP,'pruning twice changes nothing');

/* ================= ON SCREEN ================= */
ok(X.xtSym(1)==='1'&&X.xtSym(0)==='0'&&X.xtSym(0.5)==='½','a win, a loss and a draw each have a symbol');
let t1=X.xtTable(G.players,G.grid);
ok(/<table class="xt"/.test(t1),'the crosstable is a real table, not a stack of divs');
ok(/<thead>/.test(t1)&&/<tbody>/.test(t1),'with a head and a body');
ok((t1.match(/scope="col"/g)||[]).length>=12,'the column headers are marked as headers');
ok((t1.match(/scope="row"/g)||[]).length===9,'and so is every player name — a screen reader can read a cell');
ok(/class="xtyou"/.test(t1),'your row is marked');
ok(/YOU<\/span>/.test(t1),'and says so');
ok(/xtself/.test(t1),'the diagonal is drawn as itself, not as a result');
ok((t1.match(/class="xtw"/g)||[]).length>0,'wins are coloured');
ok(/title="Ada Marín/.test(t1)||/title="[^"]*Ada Marín/.test(t1),'a cell says which game it was on hover');
ok(/round \d/.test(t1),'including the round');
/* the same renderer takes the stored shape */
let t2=X.xtTable(snap.players,snap.grid);
ok(/<table class="xt"/.test(t2),'a stored snapshot renders through the same function');
const cells=g=>(g.match(/>[10½]<\/td>/g)||[]).length;
ok(cells(t2)===cells(t1),'and produces the same number of results: '+cells(t2));
ok(X.xtTable([],[])==='','nothing renders for an empty table');
ok(X.xtTable(null,null)==='','or for no table at all');
/* not-played cells */
let part=tour(8);X.tourPlayRound(part,0,1);
let pg=X.xtGrid(part),pt=X.xtTable(pg.players,pg.grid);
ok(/xtnone/.test(pt),'games not yet played show as blank, not as draws');
ok((pt.match(/>½<\/td>/g)||[]).length<20,'one round does not fill the grid with halves');

/* the card on the tournament screen */
X.app.xtOpen=false;
let card=X.xtLiveCard(T);
ok(/🧮 Crosstable/.test(card),'the tournament screen offers a crosstable');
ok(/data-act="xttog"/.test(card),'with a button to open it');
ok(!/<table/.test(card),'folded away by default, because it is wide');
ok(/games played in the hall/.test(card),'and says how many games are behind it');
X.app.xtOpen=true;
card=X.xtLiveCard(T);
ok(/<table class="xt"/.test(card),'opening it shows the grid');
ok(/Hide/.test(card),'and the button turns into a close');
ok(X.xtLiveCard(tour(8))==='','an event with no games played offers nothing');
ok(X.xtLiveCard(null)==='','and neither does no event');
X.app.xtOpen=false;

/* the finish banner */
const fin={name:'City Open',emoji:'🏙️',score:5,rounds:8,tpr:2350,place:2,xt:snap};
X.app.xtFin=false;
let ban=X.careerFinishBanner(fin);
ok(/data-act="xtfin"/.test(ban),'the finish banner offers the final crosstable');
ok(!/<table/.test(ban),'closed to begin with');
X.app.xtFin=true;
ban=X.careerFinishBanner(fin);
ok(/<table class="xt"/.test(ban),'and opens on a click');
ok(/Hide the final crosstable/.test(ban),'with the button reading the other way');
X.app.xtFin=false;
ok(!/xtfin/.test(X.careerFinishBanner({name:'One-off',emoji:'🎯',score:1,rounds:1,tpr:2100})),
  'a one-off game has no crosstable to offer');

/* the history */
const hc={history:[{name:'City Open',emoji:'🏙️',score:5,rounds:8,tpr:2350,place:2,xt:snap},
  {name:'Village Open',emoji:'🏡',score:3,rounds:5,tpr:2100,place:6}]};
X.app.xtHist=null;
let hist=X.careerHistory(hc);
ok(/data-act="xthist" data-val="0"/.test(hist),'an event in the history offers its crosstable');
ok(!/data-act="xthist" data-val="1"/.test(hist),'an older one that lost its grid does not');
ok(/1 crosstable kept/.test(hist),'and the header says how many are kept');
ok(!/<table/.test(hist),'closed by default');
X.app.xtHist=0;
hist=X.careerHistory(hc);
ok(/<table class="xt"/.test(hist),'clicking it opens that event’s grid');
ok(/Hide the crosstable/.test(hist),'with a close');
X.app.xtHist=1;
hist=X.careerHistory(hc);
ok(!/<table/.test(hist),'opening an event without a grid shows nothing');
X.app.xtHist=null;
ok(X.xtHistCard(null,0)==='','no entry, no card');
ok(X.xtHistCard({name:'x'},0)==='','and an entry without a grid renders nothing');

/* ================= IT AGREES WITH THE STANDINGS ================= */
/* the crosstable is derived, so it must never disagree with the table above it */
let bad=0,rematches=0;
for(let trial=0;trial<40;trial++){
  const E=tour(6+(trial%4));
  for(let r=0;r<E.rounds;r++)X.tourPlayRound(E,r,[0,0.5,1][trial%3]);
  const g=X.xtGrid(E),S=X.standingsSorted(E);
  g.players.forEach((p,i)=>{
    const row=g.grid[i].reduce((t,c)=>t+(c?c.s:0),0);
    if(Math.abs(row+byesOf(E,p.id)-(p.score||0))>1e-9)bad++;   // to the point, byes added back
    if(p.name!==S[i].name)bad++;
    g.grid[i].forEach(c=>{if(c&&c.n>1)rematches++;});
  });
  const r0=g.players[0];
  if(r0.score<g.players[g.players.length-1].score)bad++;
}
ok(bad===0,'across forty simulated events every row adds up to the score beside it');
ok(rematches>0,'and the fields that had to pair somebody twice ('+rematches+' cells) still balance');

console.log('\n✅ crosstable: '+pass+' checks passed');
