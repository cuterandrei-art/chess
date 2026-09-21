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

/* a stub standing in for the two public APIs */
const ITAL_DEV=`[Event "Live Chess"]\n[White "opp"]\n[Black "me"]\n[Result "0-1"]\n\n1. e4 {[%clk 0:10:00]} e5 2. Nf3 Nc6 3. Bc4 Qf6 4. d3 d6 0-1`;
const ITAL_BOOK=`[Event "Live Chess"]\n[White "opp"]\n[Black "me"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 1-0`;
const LI_PGN=`[Event "Rated blitz game"]\n[White "me"]\n[Black "rival"]\n[Result "1-0"]\n[UTCDate "2024.05.02"]\n[UTCTime "12:00:00"]\n[Variant "Standard"]\n\n1. d4! d5 2. c4?! (2. Nf3 Nf6) e6 $1 3. Nc3 Nf6 {solid} 4. Bg5 Be7 1-0\n\n[Event "Rated blitz game"]\n[White "rival"]\n[Black "me"]\n[Result "1-0"]\n[UTCDate "2024.05.03"]\n[UTCTime "12:00:00"]\n[Variant "Standard"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 1-0`;
function stubChessCom(){
  const arch={archives:['https://api.chess.com/pub/player/me/games/2024/03']};
  const month={games:[
    {rules:'chess',time_class:'blitz',end_time:1710000000,pgn:ITAL_DEV,white:{username:'Opp',result:'win'},black:{username:'Me',result:'resigned'}},
    {rules:'chess',time_class:'blitz',end_time:1710000100,pgn:ITAL_DEV,white:{username:'opp',result:'win'},black:{username:'me',result:'timeout'}},
    {rules:'chess',time_class:'rapid',end_time:1710000150,pgn:ITAL_BOOK,white:{username:'opp',result:'checkmated'},black:{username:'me',result:'win'}},
    {rules:'chess960',time_class:'blitz',end_time:1710000200,pgn:ITAL_DEV,white:{username:'opp',result:'win'},black:{username:'me',result:'resigned'}},
    {rules:'chess',time_class:'blitz',end_time:1710000300,pgn:ITAL_DEV,white:{username:'x',result:'win'},black:{username:'y',result:'resigned'}},
  ]};
  globalThis.fetch=async(url)=>({ok:true,status:200,json:async()=>(String(url).endsWith('archives')?arch:month),text:async()=>''});
}
const X=new Function(script+'\nreturn {store,app,pgnToSans,pgnHeaders,sansValidate,ccScore,impResultFromPgn,impFetchChessCom,impFetchLichess,runImport,myGameOpening,analyseGames,personalCourse,personalFreq,viewImport,dailyBuild,dailyState,dailyAnswer,viewDaily,addRep,buildSession,byId,BUILT};')();

/* ================= PGN parsing ================= */
ok(X.pgnHeaders(ITAL_DEV).Black==='me','PGN headers are read');
ok(X.pgnToSans(ITAL_DEV).join(' ')==='e4 e5 Nf3 Nc6 Bc4 Qf6 d3 d6','clock comments and move numbers are stripped');
ok(X.pgnToSans(LI_PGN.split('\n\n[Event')[0]).join(' ')==='d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7','variations, NAGs and annotation marks are stripped');
ok(X.sansValidate(['e4','e5','Qzz9','Nf3']).length===2,'an illegal token stops the replay rather than corrupting the game');
ok(X.ccScore('win')===1&&X.ccScore('agreed')===0.5&&X.ccScore('repetition')===0.5&&X.ccScore('resigned')===0,'Chess.com result codes map to scores');
ok(X.impResultFromPgn({Result:'1-0'},'w')===1&&X.impResultFromPgn({Result:'1-0'},'b')===0&&X.impResultFromPgn({Result:'1/2-1/2'},'w')===0.5,'PGN results are read from each side');
ok(X.impResultFromPgn({Result:'*'},'w')===null,'an unfinished game is skipped rather than scored');

/* ================= fetching ================= */
stubChessCom();
let got=await X.impFetchChessCom('Me',50);
ok(got.length===3,'only your own standard games are kept ('+got.length+' of 5)');
ok(got.every(g=>g.color==='b'||g.color==='w'),'each game knows which colour you had');
ok(got.filter(g=>g.color==='b').length===3,'username matching is case-insensitive');
ok(got.some(g=>g.result===1)&&got.some(g=>g.result===0),'wins and losses are both recorded');
globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({}),text:async()=>''});
let threw=null; try{await X.impFetchChessCom('nobody',10);}catch(err){threw=err.message;}
ok(/no player called/.test(threw||''),'an unknown account gives a human error, not a crash');
globalThis.fetch=async()=>({ok:true,status:200,text:async()=>LI_PGN,json:async()=>({})});
const li=await X.impFetchLichess('me',50);
ok(li.length===2,'Lichess PGN text is split into separate games ('+li.length+')');
ok(li[0].color==='w'&&li[0].result===1,'and your colour and result come out right');
ok(li[1].color==='b'&&li[1].result===0,'including when you were Black and lost');
globalThis.fetch=async()=>({ok:true,status:200,text:async()=>'<!DOCTYPE html><html>nope</html>',json:async()=>({})});
threw=null; try{await X.impFetchLichess('me',10);}catch(err){threw=err.message;}
ok(/did not return games/.test(threw||''),'a web page instead of games is reported honestly');

/* ================= detection and deviation ================= */
const ital=['e4','e5','Nf3','Nc6','Bc4','Bc5','c3','Nf6'];
const det=X.myGameOpening(ital,'b');
ok(det&&det.id==='italian','the Italian Game is recognised even when you are Black');
ok(det.depth===8,'and matched to its full depth ('+det.depth+')');
ok(det.devPly===null,'a game that follows the book has no deviation');
const dev=X.myGameOpening(['e4','e5','Nf3','Nc6','Bc4','Qf6'],'b');
ok(dev&&dev.devPly===5&&dev.devMove==='Qf6'&&dev.bookMove==='Bc5','the exact move where you left the book is identified');
ok(X.myGameOpening(['e4','h6','d4','g5'],'b')===null,'nonsense openings are not force-fitted to a line');

/* ================= the personalised course ================= */
stubChessCom();
X.app.impSrc='chesscom'; X.app.impUser='me'; X.app.impMax=50;
await X.runImport();
ok(X.app.imp.status==='done','a successful import reports done');
ok((X.store.myGames||[]).length===3,'the games are stored for later');
ok(X.store.myGamesMeta.src==='chesscom'&&X.store.myGamesMeta.user==='me','with a note of where they came from');
const P=X.personalCourse();
ok(P.rows.length===1,'games are grouped by opening and colour');
ok(P.rows[0].n===3&&P.rows[0].w===1&&P.rows[0].l===2&&P.rows[0].pct===33,'the score is computed correctly ('+P.rows[0].pct+'%)');
ok(P.rows[0].topDev&&P.rows[0].topDev.played==='Qf6'&&P.rows[0].topDev.n===2,'the mistake you repeat most is surfaced');
ok(P.course.length>=1&&P.course[0].id==='italian','a losing line you meet often becomes the top of your course');
ok(P.rows[0].priority>0,'priority combines how often you meet it with how badly it goes');
const iv=X.viewImport();
ok(/Your course, in priority order/.test(iv),'the view leads with the course');
ok(/where the book plays/.test(iv),'and spells out the deviation in words');
ok(/data-act="impaddall"/.test(iv),'offering to add the whole course to your repertoire');
ok(/no password, no login/.test(iv),'and is explicit that it needs no credentials');

/* ================= what you meet most is drilled first ================= */
const fq=X.personalFreq();
ok(fq.italian===3,'how often you meet each opening is counted ('+fq.italian+')');
X.addRep('italian'); X.addRep('french');
const ops=['french','italian'].map(id=>X.byId.get(id)).filter(Boolean);
const sess=X.buildSession(ops,{},'learn',4);
ok(sess.length>0,'a session is built');
ok(sess[0].o.id==='italian','the opening you actually face is drilled first');
ok(/sh\.sort\(function\(a,b\)\{return \(fq\[b\.o\.id\]/.test(script),'ordering is by personal frequency, with the shuffle breaking ties');

/* ================= the daily exercise ================= */
const set=X.dailyBuild();
ok(set.qs.length>=3,'the daily set has several questions ('+set.qs.length+')');
ok(set.qs.every(q=>q.opts.length>=2&&q.opts.includes(q.answer)),'every question includes its own answer among the options');
ok(set.qs.every(q=>new Set(q.opts).size===q.opts.length),'and no duplicated options');
ok(set.qs.every(q=>q.fen&&/\s[wb]\s/.test(q.fen)),'each question has a real position to show');
const kinds=new Set(set.qs.map(q=>q.kind));
ok(kinds.has('memory')&&kinds.has('understanding'),'it covers recall and understanding');
ok(JSON.stringify(X.dailyBuild().qs.map(q=>q.answer))===JSON.stringify(set.qs.map(q=>q.answer)),'the set is the same all day');
const d=X.dailyState();
ok(d.key&&d.i===0&&d.right===0,'the day starts fresh');
X.app.dailySet=set;
const wrongIdx=set.qs[0].opts.findIndex(o=>o!==set.qs[0].answer);
X.dailyAnswer(wrongIdx);
ok(X.store.daily.i===1&&X.store.daily.right===0,'a wrong answer advances without scoring');
ok(X.app.dailyFeedback&&X.app.dailyFeedback.correct===false,'and says so');
X.app.dailySet=set;
X.dailyAnswer(set.qs[1].opts.indexOf(set.qs[1].answer));
ok(X.store.daily.right===1,'a right answer scores');
while(!X.store.daily.finished&&X.store.daily.i<set.qs.length){X.app.dailySet=set;X.dailyAnswer(0);}
ok(X.store.daily.finished&&X.store.daily.streak>=1,'finishing the set completes the day and starts a streak');
ok(/of\s/.test(X.viewDaily())&&/streak/.test(X.viewDaily()),'the view reports the score and the streak');
// a brand-new user with no repertoire still gets a daily, built from the
// library, rather than being told to come back later
X.store.repertoire=[]; X.store.daily=null; X.app.dailySet=null; X.app.dailyFeedback=null;
const fresh=X.dailyBuild();
ok(fresh.qs.length>=3,'with no repertoire the set falls back to the library so a new user is never blocked');
ok(/Daily exercise/.test(X.viewDaily()),'and the view renders for them');

console.log('\n✅ lotus: '+pass+' checks passed');
