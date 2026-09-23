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
const X=new Function(script+'\nreturn {store,app,render,BOOTH,BOOTH_PAIRS,BOOTH_LINES,BOOTH_KEEP,BOOTH_SHOW,'+
  'boothById,boothOn,boothPair,boothMaterial,boothQueens,boothCaptured,boothFacts,boothSpent,boothTypical,'+
  'boothSay,boothSpeaker,boothInit,boothVars,boothAdd,boothTick,boothFinish,boothMove,boothGameOf,boothPanel,'+
  'freshCareer};')();

/* A game, the way the board holds one. */
function game(sans,o){
  const c=new Chess(),stack=[c.fen()],moves=[];
  sans.forEach(function(san){const m=c.move(san);moves.push({san:m.san,from:m.from,to:m.to});stack.push(c.fen());});
  return Object.assign({moves:moves,stack:stack,side:'w',clk:null,base:1800,inc:20,
    oppName:'Tom Knox',oppRating:1533,myRating:1500,event:'Local Club Championship'},o||{});
}
X.store.career=X.freshCareer();
X.store.career.name='Ada Marín';
const reset=()=>{X.app.booth=null;X.store.settings.boothOn=true;};

/* ================= WHO IS IN THE BOOTH ================= */
reset();
ok(X.BOOTH.length>=4,'there are commentators ('+X.BOOTH.length+')');
ok(X.BOOTH.every(b=>b.n&&b.v&&b.e&&b.d),'each with a name, a voice, a badge and a line about them');
ok(X.BOOTH_PAIRS.length>=3,'and several pairings');
ok(X.BOOTH_PAIRS.every(p=>p.length===2&&p[0]!==p[1]),'each a pair of two different people');
ok(X.BOOTH_PAIRS.every(p=>p.every(id=>X.BOOTH.some(b=>b.id===id))),'all of whom exist');
const pair=X.boothPair('Local Club Championship');
ok(pair.length===2&&pair[0]!==pair[1],'an event draws a pair');
ok(JSON.stringify(X.boothPair('Local Club Championship').map(p=>p.id))===JSON.stringify(pair.map(p=>p.id)),
  'the same event always gets the same pair — a broadcast has a team, not a lottery');
let other=null;
for(const ev of ['City Open','Candidates Tournament','World Championship Match','Grudge Match','Olympiad'])
  if(X.boothPair(ev)[0].id!==pair[0].id)other=ev;
ok(other!==null,'a different event can get a different team (e.g. '+other+')');
ok(X.boothById('nope').id===X.BOOTH[0].id,'an unknown name falls back to somebody rather than crashing');
/* the analyst takes technical facts, the host the loud ones */
const P=[X.boothById('frost'),X.boothById('vale')];
ok(X.boothSpeaker(P,'queensoff').v==='dry','the analyst explains the queens coming off');
ok(X.boothSpeaker(P,'queentaken').v==='hype','the host shouts about the queen being taken');
ok(X.boothSpeaker(P,'promote').v==='hype','and about a promotion');
ok(X.boothSpeaker(P,'materialup').v==='dry','while the counting goes to the analyst');

/* ================= READING THE BOARD ================= */
reset();
ok(X.boothMaterial(new Chess().fen()).diff===0,'the starting position is materially level');
ok(X.boothMaterial(new Chess().fen()).w===39,'and each side has 39 points of material ('+X.boothMaterial(new Chess().fen()).w+')');
ok(X.boothMaterial('8/8/8/8/8/8/8/K6k w - - 0 1').diff===0,'bare kings count for nothing');
ok(X.boothMaterial('8/8/8/8/8/8/8/KQ5k w - - 0 1').diff===9,'a queen up is nine');
const q=X.boothQueens(new Chess().fen());
ok(q.w===1&&q.b===1,'both queens are on the board at the start');
ok(X.boothQueens('8/8/8/8/8/8/8/K6k w - - 0 1').w===0,'and neither is in a bare-kings endgame');
/* what came off */
let g=game(['e4','d5','exd5','Qxd5']);
ok(X.boothCaptured(g.stack[2],g.stack[3]).piece==='pawn','a pawn capture is read as a pawn');
ok(X.boothCaptured(g.stack[2],g.stack[3]).white===false,'and it knows whose it was');
ok(X.boothCaptured(g.stack[3],g.stack[4]).piece==='pawn','the recapture takes a pawn too');
ok(X.boothCaptured(g.stack[3],g.stack[4]).white===true,'this time a white one');
ok(X.boothCaptured(g.stack[0],g.stack[1])===null,'a quiet move takes nothing');
g=game(['d4','d5','Nf3','Nc6','Bf4','Bf5','Qd3','Qd7','Qxf5']);
const qcap=X.boothCaptured(g.stack[8],g.stack[9]);
ok(qcap&&qcap.piece==='bishop','a bishop taken is a bishop');
ok(qcap.value===3,'worth three');
ok(X.boothCaptured(new Chess().fen(),new Chess().fen())===null,'nothing taken reads as nothing');
/* a promotion removes a pawn without it being a capture */
const pro=new Chess('8/P7/8/8/8/8/8/K6k w - - 0 1');
const beforeP=pro.fen();pro.move('a8=Q');
ok(X.boothCaptured(beforeP,pro.fen())===null,'promoting is not mistaken for capturing your own pawn');

/* ================= WHAT IS WORTH SAYING ================= */
reset();
const facts=(sans,ply,st,o)=>X.boothFacts(game(sans,o),ply,st||{});
let f=facts(['e4','e5','Nf3','Nc6','Bc4','Bc5','Nxe5'],7);
ok(f.length>0,'a capture gives the booth something to say');
ok(f[0].k==='firstblood','the first piece off the board is the story');
ok(f[0].piece==='pawn','and it knows which piece it was');
f=facts(['e4','e5','Nf3','Nc6','Bc4','Bc5','Nxe5','Nxe5'],8,{firstBlood:true});
ok(!f.some(x=>x.k==='firstblood'),'a recapture is not announced as first blood a second time');
ok(f[0].k==='sac','taking a defended pawn with a knight reads as giving material up — the booth cannot tell a sacrifice from a blunder without an engine, and its lines say so');
ok(f.some(x=>x.k==='opening'),'and the opening still gets named somewhere in the list');
f=facts(['e4','e5','Nf3','Nc6','Bc4','Bc5'],6,{firstBlood:true,opening:true});
ok(f.length===0,'a quiet developing move with nothing left to announce is left in silence');
/* being a whole piece up or down is */
{
  const up=new Chess('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');
  const b0=up.fen();up.move('Ra5');
  let fu=X.boothFacts({moves:[{san:'Ra5'}],stack:[b0,up.fen()],side:'w'},1,{});
  ok(fu.some(x=>x.k==='materialup'),'a rook up is worth saying');
  ok(fu.filter(x=>x.k==='materialup')[0].n===5,'with the size of the lead ('+fu.filter(x=>x.k==='materialup')[0].n+')');
  fu=X.boothFacts({moves:[{san:'Ra5'}],stack:[b0,up.fen()],side:'b'},1,{});
  ok(fu.some(x=>x.k==='materialdown'),'and from the other side of the board it is a rook down');
  fu=X.boothFacts({moves:[{san:'Ra5'}],stack:[b0,up.fen()],side:'w'},1,{matSaid:'up'});
  ok(!fu.some(x=>x.k==='materialup'),'said once, not on every move after it');
}
/* giving material away deliberately — visible only once it is taken back */
{
  const sg=game(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','d5','exd5','Nxd5','Nxf7','Kxf7']);
  let fs=X.boothFacts(sg,11,{firstBlood:true,opening:true});
  ok(!fs.some(x=>x.k==='sac'),'the move that offers a piece cannot yet be called a sacrifice — it has won material');
  fs=X.boothFacts(sg,12,{firstBlood:true,opening:true});
  ok(fs.some(x=>x.k==='sac'),'once the piece is taken back, the move before it reads as a sacrifice');
  const sac=fs.filter(x=>x.k==='sac')[0];
  ok(sac.n===2,'worth two points here ('+sac.n+')');
  ok(sac.san==='Nxf7','and it names the move that did it ('+sac.san+')');
  ok(sac.mine===true,'and knows it was yours');
  /* a piece simply lost is not called a sacrifice */
  const lg=game(['e4','e5','Nf3','Nc6','Bc4','Nf6','Ng5','Nxe4']);
  ok(!X.boothFacts(lg,8,{firstBlood:true,opening:true}).some(x=>x.k==='sac'),
    'a quiet move that drops a piece is not dressed up as a sacrifice — only an engine could tell, and the booth has not got one');
}
/* mate outranks everything */
f=facts(['f3','e5','g4','Qh4#'],4);
ok(f[0].k==='mate','checkmate is the most interesting thing that can happen');
/* a queen taken */
g=game(['d4','d5','Nf3','Nc6','Bf4','Qd6','Bxd6']);
f=X.boothFacts(g,7,{});
ok(f[0].k==='queentaken','a queen coming off is top billing');
/* promotion */
const pg={moves:[{san:'a8=Q+'}],stack:['8/P7/8/8/8/8/8/K6k w - - 0 1','Q7/8/8/8/8/8/8/K6k b - - 0 1'],side:'w'};
f=X.boothFacts(pg,1,{});
ok(f.some(x=>x.k==='promote'),'a promotion is worth saying');
ok(f.filter(x=>x.k==='promote')[0].to==='Q','and it knows what the pawn became');
/* castling, and opposite castling */
f=facts(['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O'],7);
ok(f.some(x=>x.k==='castled'),'castling is noted');
const OPP=['e4','e5','Nf3','Nc6','Bc4','d6','O-O','Be6','d3','Qd7','Nc3','O-O-O'];
f=facts(OPP,12,{castled:true,castledLong:false,firstBlood:true,opening:true});
ok(f[0].k==='opposite','and castling the other way after them is a race');
ok(f[0].long===true,'it knows which way the second king went');
/* the first check only once */
const CHK=['e4','e5','Bc4','Nf6','Bxf7+'];
f=facts(CHK,5,{});
ok(f.some(x=>x.k==='firstcheck'),'a check is noticed');
ok(f.some(x=>x.k==='firstblood'),'along with the pawn it took');
f=facts(CHK,5,{firstCheck:true,firstBlood:true});
ok(!f.some(x=>x.k==='firstcheck'),'but not a second time');
/* a mate is a mate, not "the first check" */
f=facts(['e4','e5','Bc4','Nc6','Qh5','Nf6','Qxf7#'],7,{});
ok(f[0].k==='mate','a mating move is announced as mate');
ok(!f.some(x=>x.k==='firstcheck'),'not as a check that happens to end the game');
/* queens off */
g=game(['d4','d5','Nf3','Nc6','Bf4','Qd6','Bxd6','exd6','Qd3','Bf5','Qxf5']);
f=X.boothFacts(g,7,{});
ok(f[0].k==='queentaken','one queen off is a capture');
const qq=new Chess('4k3/8/8/8/8/8/8/3QK3 w - - 0 1');
const bq=qq.fen();qq.move('Qd8+');
f=X.boothFacts({moves:[{san:'Qd8+'}],stack:[bq,qq.fen()],side:'w'},1,{});
ok(!f.some(x=>x.k==='queensoff'),'a queen still on the board is not queens off');
/* move 40 */
const longSans=[];{const c=new Chess();
  // a legal 80-ply shuffle: knights out and back
  const cyc=['Nf3','Nf6','Ng1','Ng8','Nc3','Nc6','Nb1','Nb8'];
  for(let i=0;i<10;i++)cyc.forEach(s=>{c.move(s);longSans.push(s);});}
f=X.boothFacts(game(longSans),80,{});
ok(f.some(x=>x.k==='move40'),'reaching move forty is worth a word');
/* clocks */
const clkGame=game(['e4','e5','Nf3','Nc6','Bc4','Bc5'],{clk:[1795,1798,1780,1790,1500,1780],base:1800,inc:20});
ok(X.boothSpent(clkGame,1)===25,'the time spent on a move is read from the clock ('+X.boothSpent(clkGame,1)+'s)');
ok(X.boothTypical(clkGame,'w')!=null,'a typical think can be worked out');
f=X.boothFacts(clkGame,5,{});
ok(f.some(x=>x.k==='longthink'),'a think far above their own average is called a long one');
ok(f.filter(x=>x.k==='longthink')[0].secs===300,'with the real number of seconds');
const lowGame=game(['e4','e5','Nf3','Nc6'],{clk:[1795,1798,1780,100],base:1800,inc:20});
f=X.boothFacts(lowGame,4,{});
ok(f.some(x=>x.k==='scramble'),'a clock under 8% is time trouble');
f=X.boothFacts(lowGame,4,{scramble:true});
ok(!f.some(x=>x.k==='scramble'),'said once, not every move after it');
/* nothing happening is nothing to say */
f=facts(['e4','e5','Nf3','Nc6'],2,{});
ok(f.length===0||f[0].k==='opening'||f[0].k==='quiet','a quiet developing move gets at most a quiet remark');
ok(X.boothFacts(game(['e4']),9,{}).length===0,'asking about a move that was never played gives nothing');
ok(X.boothFacts({moves:[],stack:[]},1,{}).length===0,'and an empty game gives nothing');

/* ================= HOW IT IS SAID ================= */
reset();
ok(Object.keys(X.BOOTH_LINES).length>=18,'there are lines for every kind of moment ('+Object.keys(X.BOOTH_LINES).length+')');
Object.keys(X.BOOTH_LINES).forEach(function(k){
  const set=X.BOOTH_LINES[k];
  ok(['dry','hype','calm','wry'].every(v=>Array.isArray(set[v])&&set[v].length>=1),
    '“'+k+'” has something for every voice');
});
const totalLines=Object.keys(X.BOOTH_LINES).reduce(function(a,k){
  return a+['dry','hype','calm','wry'].reduce((b,v)=>b+(X.BOOTH_LINES[k][v]||[]).length,0);},0);
ok(totalLines>=200,'which is '+totalLines+' written lines in all');
let said=X.boothSay('dry','intro',{me:'Marín',opp:'Knox',gap:'Marín by 120',event:'City Open'});
ok(said&&said.indexOf('{')<0,'a line comes out with every blank filled ('+said+')');
ok(X.boothSay('dry','nosuchthing',{})===null,'a moment with no lines says nothing rather than something broken');
/* no unfilled placeholder can ever reach the screen */
let leaks=0;
for(const k of Object.keys(X.BOOTH_LINES))for(const v of ['dry','hype','calm','wry'])
  for(let i=0;i<8;i++){const l=X.boothSay(v,k,{});if(l&&/\{/.test(l))leaks++;}
ok(leaks===0,'and a missing value leaves a clean sentence, never a "{gap}" on screen');

/* ================= IT HAS TO READ AS ENGLISH =================
   The career name defaults to "You", so any line that puts the player's name
   in front of a third-person verb produces "You has Brunswick today". Every
   line is checked against the awkward name rather than a comfortable one. */
const BAD=/\b(You|you) (has|is|holds|leads|needs|wins|takes|resigns|stops|converts|gets|was|will know)\b/;
let ungrammatical=[];
for(const k of Object.keys(X.BOOTH_LINES))for(const v of ['dry','hype','calm','wry'])
  (X.BOOTH_LINES[k][v]||[]).forEach(function(l){
    // the opponent always has a real name; only the player can be called "You"
    const filled=l.split('{me}').join('You').split('{opp}').join('Knox')
      .split('{n}').join('3').split('{piece}').join('rook').split('{moveNo}').join('12')
      .split('{secs}').join('90').split('{to}').join('Q').split('{name}').join('the Italian Game')
      .split('{event}').join('the City Open').split('{gap}').join('about even')
      .split('{meR}').join('1500').split('{oppR}').join('1533').split('{long}').join('kingside')
      .split('{san}').join('Nxf7');
    if(BAD.test(filled))ungrammatical.push(k+'/'+v+': '+filled);
  });
ok(ungrammatical.length===0,'no line breaks grammar when the player is called "You"'+
  (ungrammatical.length?' — '+ungrammatical[0]:''));
/* a placeholder used twice in one line reads as "a rook for a rook" */
let doubled=[];
for(const k of Object.keys(X.BOOTH_LINES))for(const v of ['dry','hype','calm','wry'])
  (X.BOOTH_LINES[k][v]||[]).forEach(function(l){
    const seen={};
    (l.match(/\{[a-zA-Z]+\}/g)||[]).forEach(function(tok){
      if(seen[tok])doubled.push(k+'/'+v+': '+l);seen[tok]=1;});
  });
ok(doubled.length===0,'and no line uses the same blank twice'+(doubled.length?' — '+doubled[0]:''));
/* a boolean must never reach the screen through a placeholder */
const vars=X.boothVars({event:'x',myRating:1500,oppRating:1500,oppName:'Knox'},{k:'castled',long:true});
ok(vars.long==='queenside','a castling side comes out as a word, not as true/false');
const vars2=X.boothVars({event:'x'},{k:'castled',long:false});
ok(vars2.long==='kingside','either way round');
ok(X.boothSay('dry','castled',vars).indexOf('true')<0,'so the line never says "Castling true"');

/* ================= IT NEVER READS THE ENGINE =================
   This is the whole design constraint: if the eval bar is off, nothing the
   booth says may tell you how you stand. */
const boothSrc=script.slice(script.indexOf('const BOOTH=['),script.indexOf('/* ================= A GAME YOU CAN COME BACK TO'));
ok(boothSrc.length>3000,'the booth has its own section of the source');
ok(boothSrc.indexOf('playEval')<0,'it never touches app.playEval');
ok(boothSrc.indexOf('Engine')<0&&boothSrc.indexOf('_lastEvalCp')<0,'nor the engine, nor its last score');
ok(boothSrc.indexOf('evalPct')<0&&boothSrc.indexOf('evalLabel')<0,'nor anything that formats an evaluation');
const words=/\b(centipawn|eval|evaluation|winning by|\+\d\.\d)\b/i;
let evalish=0;
for(const k of Object.keys(X.BOOTH_LINES))for(const v of ['dry','hype','calm','wry'])
  (X.BOOTH_LINES[k][v]||[]).forEach(function(l){if(words.test(l))evalish++;});
ok(evalish===0,'and not one of the written lines quotes an evaluation');

/* ================= THE RUNNING LOG ================= */
reset();
g=game(['e4','e5','Nf3','Nc6','Bc4','Bc5','Nxe5','Nxe5','d4','Bxd4','Qxd4','Qf6','Qxe5+','Qxe5']);
X.boothInit(g);
for(let ply=1;ply<=g.moves.length;ply++)X.boothTick(g,ply);
let B=X.app.booth;
ok(B.lines.length>=3,'a game with things happening in it produces commentary ('+B.lines.length+' lines)');
ok(B.lines[0].kind==='intro','it opens by introducing the game');
ok(B.lines.every(l=>l.line&&l.who&&l.e),'every line has a speaker');
ok(B.lines.some(l=>l.kind==='queentaken'||l.kind==='bigcapture'||l.kind==='firstblood'),
  'and the captures were noticed');
ok(new Set(B.lines.map(l=>l.who)).size===2,'both commentators speak');
ok(B.lines.every(function(l,i){return i===0||B.lines[i-1].line!==l.line;}),
  'never the same sentence twice running');
const counts={};B.lines.forEach(function(l){counts[l.line]=(counts[l.line]||0)+1;});
ok(Object.keys(counts).every(k=>counts[k]===1),
  'and no sentence is reused in one game while another was available');
/* the same ply is never commented twice */
const n0=B.lines.length;
X.boothTick(g,g.moves.length);
ok(X.app.booth.lines.length===n0,'a redraw does not make them say it all again');
/* a quiet game keeps them quiet */
reset();
const quiet=game(['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8']);
X.boothInit(quiet);
for(let ply=1;ply<=quiet.moves.length;ply++)X.boothTick(quiet,ply);
ok(X.app.booth.lines.length<=3,'eight moves of nothing gets a sentence or two, not eight ('+X.app.booth.lines.length+')');
/* the log is capped */
reset();
X.boothInit(g);
for(let i=0;i<X.BOOTH_KEEP+20;i++)X.boothAdd(g,'quiet',{ply:i});
ok(X.app.booth.lines.length<=X.BOOTH_KEEP,'the log is capped at '+X.BOOTH_KEEP+' lines');

/* ================= THE LAST WORD ================= */
reset();X.boothInit(g);
X.boothFinish(g,1,'Checkmate — you won! 🎉');
ok(X.app.booth.lines[X.app.booth.lines.length-1].kind==='winmate','a win by mate gets the mate line');
reset();X.boothInit(g);
X.boothFinish(g,1,'Stockfish resigned.');
ok(X.app.booth.lines.slice(-1)[0].kind==='winres','a win by resignation gets the resignation line');
reset();X.boothInit(g);
X.boothFinish(g,0,'Checkmate — you lost.');
ok(X.app.booth.lines.slice(-1)[0].kind==='lossmate','and a loss by mate is not dressed up');
reset();X.boothInit(g);
X.boothFinish(g,0,'You lost on time.');
ok(X.app.booth.lines.slice(-1)[0].kind==='flag','a flag fall is its own kind of ending');
reset();X.boothInit(g);
X.boothFinish(g,0.5,'Draw by threefold repetition.');
ok(X.app.booth.lines.slice(-1)[0].kind==='draw','and a draw is a draw');
ok(X.boothFinish(null,1,'')===null,'no game, no last word');

/* ================= ON SCREEN ================= */
reset();
Object.assign(X.app,{view:'play',playMoves:g.moves,playStack:g.stack,playSide:'w',
  playClk:[1795,1798],tc:{base:1800,inc:20},careerRoundOpp:{name:'Tom Knox',rating:1533},
  careerOpp:'tour',careerOneoff:null,playTitle:'🏟️ Round 1 vs Tom Knox (1533)',playBot:null});
ok(X.boothGameOf()!==null,'a career game is one the booth can watch');
ok(X.boothGameOf().oppName==='Tom Knox','and it knows who is playing');
let panel=X.boothPanel();
ok(/In the booth/.test(panel),'the panel is on the play screen');
ok(/never the engine/.test(panel),'and says plainly that they cannot see the evaluation');
ok(/data-act="boothtoggle"/.test(panel),'with a switch');
X.boothInit(X.boothGameOf());
X.boothTick(X.boothGameOf(),1);
ok(/Frost|Vale|Okafor|Penrose|Weir|Ibarra/.test(X.boothPanel()),'once they speak their name is on it');
X.store.settings.boothOn=false;
ok(/booth is off/.test(X.boothPanel()),'turned off it says so');
ok(/Turn it on/.test(X.boothPanel()),'and offers to come back');
ok(X.boothTick(X.boothGameOf(),2)===null,'and says nothing while it is off');
X.store.settings.boothOn=true;
/* no named opponent, no booth */
X.app.careerRoundOpp=null;X.app.playBot=null;
ok(X.boothGameOf()===null,'a training position has nobody to commentate on');
ok(X.boothPanel()==='','so the panel stays away');
X.app.playBot={name:'Blitz Bella',rating:1600};
ok(X.boothGameOf()!==null,'but a named bot is a real opponent');

/* ================= WIRED IN ================= */
ok(/playNoteClock\(\);boothMove\(\);sfxSan/.test(script),'they hear your move');
ok(/addIncrement\(eng\);playNoteClock\(\);boothMove\(\)/.test(script),'and the engine’s');
ok(/boothFinish\(boothGameOf\(\),score,app\.playResult\|\|''\)/.test(script),'and the result');
ok(/boothPanel\(\)\+/.test(script),'the panel is rendered');
ok(/act==='boothtoggle'/.test(script),'the switch is connected');
ok(/app\.booth=null;\n?\s*_resumeSig=null/.test(script),'a new game starts with an empty booth');
ok(/booth:app\.booth\|\|null,/.test(script),'and an interrupted game keeps the one it had');
ok(/app\.booth=\(g\.booth&&g\.booth\.pair\)\?g\.booth:null;/.test(script),'restored on resume, if it looks like a booth');

console.log('\n✅ booth: '+pass+' checks passed');
