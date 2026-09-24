/* The Olympiad as a team event.
   The thing this replaces was three anonymous random numbers averaged with
   your percentage, so the checks that matter here are the ones that make it a
   real competition: the match points add up, the game points add up, nobody
   plays twice in a round, the table is a consequence of the boards and not a
   threshold, and the board medal is a ranking of every board one in the hall. */
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
const X=new Function(script+'\nreturn {store,app,OLY_BOARDS,OLY_TEAMS,OLY_NATIONS,OLY_MEDAL,OLY_MIN_GAMES,'+
  'olyFlagOf,olySimBoard,olySquad,olyNation,olyMet,olyNoteMet,olyInit,olyMyTeam,olySimMatch,olyScore,'+
  'olyPairNations,olyPlayRound,olyTable,olyPlace,olyBoardRank,olyMedals,olyMedalEmoji,olySquadCard,'+
  'olyFedStrength,olyBoardWord,OLY_FED_FLOOR,olympiadSelected,'+
  'olyMatchCard,olyTableCard,olyCards,freshCareer,lifeInit,fmtScore,careerFinishBanner,youRating};')();

function career(fed,rating){
  const c=X.freshCareer();
  X.lifeInit(c);
  c.name='Ada Marín';c.fed=fed||'ROU';c.flag='🇷🇴';
  c.rating=rating||2520;c.provisional=false;c.ratingRapid=rating||2520;c.ratingBlitz=rating||2520;
  return c;
}
function tour(rounds){return {id:'olympiad',name:'Chess Olympiad',emoji:'🤝',rounds:rounds||9,round:0,
  field:[],results:[],avg:2480,kind:'swiss',format:'classical'};}

/* ================= THE NATIONS ================= */
ok(X.OLY_NATIONS.length>=X.OLY_TEAMS,'there are more federations than places in the hall');
ok(X.OLY_NATIONS.every(n=>n.c&&n.f&&n.str>2000),'each has a code, a flag and a strength');
ok(new Set(X.OLY_NATIONS.map(n=>n.c)).size===X.OLY_NATIONS.length,'and none of them is listed twice');
ok(X.olyFlagOf('IND')==='🇮🇳','a federation code finds its flag');
ok(X.olyFlagOf('ZZZ')==='♟','and an unknown one gets a neutral piece rather than nothing');

/* ================= THE SQUAD ================= */
let sq=X.olySquad(2700,4,1);
ok(sq.length===4,'a squad is four players');
ok(sq.every(p=>p.name&&p.rating>0),'each with a name and a rating');
ok(sq.every((p,i)=>i===0||sq[i-1].rating>=p.rating),'strongest first — a captain does not put board four on board one');
ok(sq.map(p=>p.board).join()==='1,2,3,4','numbered from board one');
ok(sq[0].rating>sq[3].rating,'and the boards really do step down ('+sq[0].rating+' to '+sq[3].rating+')');
ok(X.olySquad(2700,3,2).map(p=>p.board).join()==='2,3,4','a squad can start at board two, for your team-mates');
let over=0;
for(let i=0;i<400;i++)if(X.olySquad(2800,3,2).some(p=>p.rating>=2800))over++;
ok(over===0,'and nobody in it ever outranks the board one they are standing behind');
let strong=0,weak=0;
for(let i=0;i<200;i++){strong+=X.olySquad(2740,4,1)[0].rating;weak+=X.olySquad(2500,4,1)[0].rating;}
ok(strong/200>weak/200+180,'a stronger nation fields a stronger board one ('+Math.round(strong/200)+' vs '+Math.round(weak/200)+')');
ok(X.olySquad(2700,4,1).every(p=>p.rating<=2850&&p.rating>=1600),'and nobody comes out impossible');

/* ================= ONE BOARD ================= */
let w=0,d=0,l=0;
for(let i=0;i<4000;i++){const r=X.olySimBoard(2600,2600);if(r===1)w++;else if(r===0)l++;else d++;}
ok(Math.abs((w+d*0.5)/4000-0.5)<0.05,'two equal boards score about half against each other');
ok(d/4000>0.3,'and draw often, because these are top boards ('+Math.round(d/40)+'%)');
let up=0;for(let i=0;i<3000;i++)up+=X.olySimBoard(2700,2300);
ok(up/3000>0.85,'four hundred points is worth well over 85% ('+Math.round(up/30)+'%)');
let dn=0;for(let i=0;i<3000;i++)dn+=X.olySimBoard(2300,2700);
ok(dn/3000>0.005,'but the underdog still wins sometimes — the old flat draw rate made that impossible');
ok([0,0.5,1].indexOf(X.olySimBoard(2600,2600))>=0,'a board is always a win, a draw or a loss');

/* ================= SETTING IT UP ================= */
let c=career('ROU',2540),tr=tour(9);
let oly=X.olyInit(c,tr);
ok(oly&&oly.nations.length===X.OLY_TEAMS,'the hall holds '+X.OLY_TEAMS+' nations');
ok(oly.nations.filter(n=>n.you).length===1,'exactly one of which is yours');
ok(X.olyNation(oly,'me').c==='ROU','and it is the federation you actually play for');
ok(!oly.nations.some(n=>!n.you&&n.c==='ROU'),'so your own country is not also in the field twice');
ok(new Set(oly.nations.map(n=>n.c)).size===X.OLY_TEAMS,'no nation appears twice');
ok(oly.mates.length===X.OLY_BOARDS-1,'you get three team-mates');
ok(oly.myBoard>=1&&oly.myBoard<=X.OLY_BOARDS,'and a board of your own ('+oly.myBoard+')');
ok(oly.mates.concat([{board:oly.myBoard}]).map(m=>m.board).sort().join()==='1,2,3,4',
  'the four boards are used once each, with nobody doubled up');
ok(oly.nations.filter(n=>!n.you).every(n=>n.squad&&n.squad.length===X.OLY_BOARDS),
  'and every other nation has a full squad, because a board medal needs one');
ok(oly.nations.every(n=>(n.mp||0)===0&&(n.gp||0)===0),'everybody starts on nothing');
/* the field is redrawn so the opponent IS the nation */
ok(tr.field.length===9,'your fixture list is nine opponents');
ok(tr.field.every(o=>o.nat),'each tagged with the nation they play for');
ok(new Set(tr.field.map(o=>o.nat)).size===9,'nine different nations — you cannot face one twice');
ok(tr.field.every(o=>{const n=X.olyNation(oly,o.nat);return n&&n.c===o.fed&&n.f===o.flag;}),
  'and the flag beside your opponent is their country’s, not a random one');
ok(tr.field.every(o=>{const n=X.olyNation(oly,o.nat);return n.squad[oly.myBoard-1].name===o.name;}),
  'your opponent is the player on your own board for that nation, not somebody off the street');
ok(tr.field.every(o=>o.style),'they still have a playing style, so the game itself is unchanged');
/* your own team sheet */
let team=X.olyMyTeam(c,oly);
ok(team.length===X.OLY_BOARDS,'your team sheet has four boards');
ok(team.map(p=>p.board).join()==='1,2,3,4','in order, one to four');
ok(team.filter(p=>p.you).length===1,'with you on exactly one of them');
ok(team[oly.myBoard-1].you===true&&team[oly.myBoard-1].name==='Ada Marín','the board you were given');
ok(team[oly.myBoard-1].rating===X.youRating(c,'classical'),'at your real classical rating');
let ordered2=true;
for(let i=1;i<team.length;i++)if(team[i].rating>team[i-1].rating)ordered2=false;
ok(ordered2,'and the sheet is in rating order, the way a captain writes one');

/* ================= WHICH BOARD, AND WHO IS BEHIND YOU ================= */
ok(X.olyFedStrength('IND')===2745,'a listed federation has a strength of its own');
ok(X.olyFedStrength('ZZZ')===X.OLY_FED_FLOOR,'and an unlisted one falls back to a floor');
/* a 2200 playing for a real federation is the weak link in a real side, not
   the top board of three imaginary 2100s */
let weakC=career('IND',2200),weakT=tour(9),weakO=X.olyInit(weakC,weakT);
let weakTeam=X.olyMyTeam(weakC,weakO);
ok(weakO.myBoard===X.OLY_BOARDS,'a 2200 playing for India is put on board four');
ok(weakTeam[0].rating>2550,'with a real board one in front of them ('+weakTeam[0].rating+')');
ok(X.olyNation(weakO,'me').str===X.olyFedStrength('IND'),
  'and the team is as strong as the country, not as weak as you');
// A strong nation's board four really can be 2650+ (the USA's sits around
// 2626 ± 45), so the claim is that nobody you face is world-top-ten strength
// and that the field as a whole is board-four strength.
const weakAvg=weakT.field.reduce((a,o)=>a+o.rating,0)/weakT.field.length;
ok(weakT.field.every(o=>o.rating<2740)&&weakAvg<2600,
  'so the players you actually face are other board fours, not the world top ten (best '+Math.max(...weakT.field.map(o=>o.rating))+', average '+Math.round(weakAvg)+')');
/* a 2800 is board one and drags the team up */
let bigC=career('ROU',2800),bigT=tour(9),bigO=X.olyInit(bigC,bigT);
ok(bigO.myBoard===1,'a 2800 is board one');
ok(X.olyNation(bigO,'me').str===2800,'and the team is built around them');
ok(X.olyMyTeam(bigC,bigO)[1].rating>2600,'so the player behind them is a real one too');
ok(bigT.field.every(o=>o.rating>2400),'and they face the other nations’ board ones');
/* the climb: the stronger you get, the further up the team you move */
let boardsAt={};
[2200,2400,2600,2800].forEach(function(r){
  let sum=0;
  for(let i=0;i<40;i++)sum+=X.olyInit(career('IND',r),tour(9)).myBoard;
  boardsAt[r]=sum/40;
});
ok(boardsAt[2200]>boardsAt[2800],'you climb the team as you improve: board '+
  (Math.round(boardsAt[2200]*10)/10)+' at 2200, board '+(Math.round(boardsAt[2800]*10)/10)+' at 2800');
ok(boardsAt[2800]<1.2,'a 2800 is essentially always board one');
ok(boardsAt[2200]>3.5,'and a 2200 in that side essentially always board four');
/* and this is the normal case, not an edge one: being picked at all takes
   top-three in your federation, which most careers reach well below the
   strength their country fields, so most of a career is spent down the order */
let lowBoards=0,checked=0;
['ROU','SRB','BRA','VIE','TUR'].forEach(function(fed){
  [2250,2350,2450].forEach(function(r){
    const cc=career(fed,r);
    if(!X.store.career)X.store.career=cc;
    const sel=X.olympiadSelected(cc);
    if(!sel.ok)return;
    checked++;
    if(X.olyInit(cc,tour(9)).myBoard>1)lowBoards++;
  });
});
ok(checked>=8,checked+' plausible selections to look at');
ok(lowBoards>=checked*0.6,lowBoards+' of '+checked+' of them start below board one — '+
  'the team is the country’s, not a copy of you');

/* ================= A ROUND ================= */
c=career('ROU',2540);tr=tour(9);oly=X.olyInit(c,tr);
let M=X.olyPlayRound(c,tr,0,1);
ok(M,'a round plays');
ok(M.boards.length===X.OLY_BOARDS,'four boards');
ok(M.boards[oly.myBoard-1].you&&M.boards[oly.myBoard-1].score===1,
  'your own board is the game you actually played');
ok(M.boards.filter(b=>b.you).length===1,'and only that one');
ok(M.boards.every(b=>[0,0.5,1].indexOf(b.score)>=0),'the rest were simulated to real results');
ok(M.boards.map(b=>b.board).join()==='1,2,3,4','with the boards in order');
ok(Math.abs(M.us+M.them-X.OLY_BOARDS)<1e-9,'a match is four points between the two teams');
ok(M.foe&&M.foeFlag,'and you know which country you played');
ok(M.foe===tr.field[0].fed,'the country your board-one opponent comes from');
let me=X.olyNation(oly,'me'),foe=X.olyNation(oly,tr.field[0].nat);
ok(me.gp===M.us&&foe.gp===M.them,'the game points land on both nations');
ok(me.mp+foe.mp===2,'and two match points are shared out, never more');
ok((M.us>M.them&&me.mp===2)||(M.us<M.them&&me.mp===0)||(M.us===M.them&&me.mp===1),
   'two for the win, one each for a drawn match');
ok(me.bn[oly.myBoard-1]===1&&me.bd[oly.myBoard-1]===1,'your game is recorded against your own board');
ok(foe.bn[oly.myBoard-1]===1&&foe.bd[oly.myBoard-1]===0,'and the reverse against theirs');
ok(X.olyMet(oly,'me',foe.id),'the two of you are noted as having met');
ok((M.others||[]).length>=4,'the other nations played too ('+M.others.length+' matches)');
ok(oly.matches.length===1,'and the round is kept');

/* nobody is in two matches at once */
c=career('ROU',2540);tr=tour(9);oly=X.olyInit(c,tr);
for(let r=0;r<9;r++){
  const M2=X.olyPlayRound(c,tr,r,[0,0.5,1][r%3]);
  const inRound=['me',tr.field[r].nat];
  X.olyPairNations(oly,tr.field[r].nat);      // pairing is deterministic given the table
  const seen={};
  let dup=false;
  (M2.others||[]).forEach(o=>{
    if(seen[o.a])dup=true;seen[o.a]=1;
    if(o.b){if(seen[o.b])dup=true;seen[o.b]=1;}
  });
  if(dup)throw new Error('FAIL: a nation played twice in round '+(r+1));
  if(seen[X.olyNation(oly,'me').c]||seen[X.olyNation(oly,tr.field[r].nat).c])
    throw new Error('FAIL: a nation in your match also played elsewhere in round '+(r+1));
}
ok(true,'across nine rounds no nation is ever in two matches at once');

/* ================= THE BOOKS BALANCE ================= */
function playOut(seed,scoreOf){
  const cc=career('ROU',2500+((seed*37)%140)),t=tour(9);
  const o=X.olyInit(cc,t);
  for(let r=0;r<9;r++)X.olyPlayRound(cc,t,r,scoreOf?scoreOf(r):[0,0.5,1][(seed+r)%3]);
  return {c:cc,tr:t,oly:o};
}
let mpBad=0,gpBad=0,boardBad=0,rounds=0;
for(let s2=0;s2<30;s2++){
  const g=playOut(s2);
  const N=g.oly.nations;
  const byes=(g.oly.matches||[]).reduce((t,m)=>t+(m.others||[]).filter(o=>o.bye).length,0);
  const totalMp=N.reduce((t,n)=>t+(n.mp||0),0);
  const totalGp=N.reduce((t,n)=>t+(n.gp||0),0);
  // every match hands out exactly 2 match points and OLY_BOARDS game points;
  // a bye hands its nation 2 and half the boards
  const matches=(g.oly.matches||[]).reduce((t,m)=>t+1+(m.others||[]).filter(o=>!o.bye).length,0);
  if(totalMp!==matches*2+byes*2)mpBad++;
  if(Math.abs(totalGp-(matches*X.OLY_BOARDS+byes*X.OLY_BOARDS/2))>1e-9)gpBad++;
  N.forEach(n=>{
    const boardPts=n.bd.reduce((t,v)=>t+v,0);
    // game points equal the sum of the boards, except for the half handed out on a bye
    if(boardPts-(n.gp||0)>1e-9)boardBad++;
  });
  rounds+=g.oly.matches.length;
}
ok(mpBad===0,'across thirty Olympiads every match hands out exactly two match points');
ok(gpBad===0,'and exactly four game points');
ok(boardBad===0,'and no nation’s boards add up to more than its game points');
ok(rounds===270,'thirty nine-round events is '+rounds+' rounds played');

/* ================= THE TABLE ================= */
let g2=playOut(7);
let T=X.olyTable(g2.oly);
ok(T.length===X.OLY_TEAMS,'the table lists every nation');
let sorted=true;
for(let i=1;i<T.length;i++){
  if((T[i].mp||0)>(T[i-1].mp||0))sorted=false;
  if((T[i].mp||0)===(T[i-1].mp||0)&&(T[i].gp||0)>(T[i-1].gp||0)+1e-9)sorted=false;
}
ok(sorted,'sorted on match points, then game points, the way FIDE does it');
const place=X.olyPlace(g2.oly);
ok(place>=1&&place<=X.OLY_TEAMS,'and you are somewhere in it ('+place+')');
ok(T[place-1].you,'exactly where it says you are');
/* the table is a consequence of the boards, not a roll: the nation on the most
   match points is first, every time, and your own placing follows your results */
let tableBad=0,winSum=0,loseSum=0;
for(let s3=0;s3<40;s3++){
  const gg=playOut(s3),T2=X.olyTable(gg.oly);
  const top=Math.max.apply(null,T2.map(n=>n.mp||0));
  if((T2[0].mp||0)!==top)tableBad++;
  const p2=X.olyPlace(gg.oly);
  if(!T2[p2-1].you)tableBad++;
  winSum+=X.olyPlace(playOut(s3+500,()=>1).oly);
  loseSum+=X.olyPlace(playOut(s3+900,()=>0).oly);
}
ok(tableBad===0,'across forty Olympiads the nation on the most match points is always first');
ok(winSum/40<loseSum/40-1.5,'and winning every board-one game finishes the team higher than losing every one ('+
  (Math.round(winSum/4)/10)+' vs '+(Math.round(loseSum/4)/10)+' on average)');

/* ================= THE BOARD MEDAL ================= */
let br=X.olyBoardRank(g2.oly,g2.oly.myBoard);
ok(br,'your board is ranked once enough rounds are played');
ok(br.rank>=1&&br.rank<=br.of,'you are somewhere in it: '+br.rank+' of '+br.of);
ok(br.games===9,'over all nine of your games');
ok(Math.abs(br.pts/br.games-br.pct)<1e-9,'on percentage, not raw points');
let ordered=true;
for(let i=1;i<br.rows.length;i++)if(br.rows[i].pct>br.rows[i-1].pct+1e-9)ordered=false;
ok(ordered,'and the ranking really is in percentage order');
ok(br.rows.filter(r=>r.you).length===1,'with you in it exactly once');
/* a nation that has not played enough is left out rather than topping it on one game */
let fresh=X.olyInit(career('ROU',2540),tour(9));
ok(X.olyBoardRank(fresh,fresh.myBoard)===null,'nobody is ranked before a game is played');
let one=career('ROU',2540),t1=tour(9),o1=X.olyInit(one,t1);
X.olyPlayRound(one,t1,0,1);
ok(X.olyBoardRank(o1,o1.myBoard)===null,'and not after one round either — a medal needs the rounds behind it');
ok(X.olyBoardWord(1)==='one'&&X.olyBoardWord(4)==='four','and each board has a name to print');

/* the medals themselves */
let med=X.olyMedals(g2.oly);
ok(med.place===place,'the medal summary knows where the team finished');
ok(med.team===null||X.OLY_MEDAL.indexOf(med.team)>=0,'a team medal is gold, silver, bronze or nothing');
ok((med.place<=3)===(med.team!==null),'and it is exactly the top three, not a threshold on a dice roll');
ok(med.board===null||X.OLY_MEDAL.indexOf(med.board)>=0,'the same for the board medal');
ok((med.boardRank<=3)===(med.board!==null),'top three board ones, or nothing');
ok(X.olyMedalEmoji('Gold')==='🥇'&&X.olyMedalEmoji('Bronze')==='🥉'&&X.olyMedalEmoji(null)==='',
  'and each has its medal');
/* over many events the medals are earned, not handed out */
let any=0;
for(let s4=0;s4<60;s4++)if(X.olyMedals(playOut(s4+100).oly).team)any++;
ok(any>0&&any<60,any+' of sixty average runs took a team medal — earned, not automatic');
/* a board medal has to be played for: nine out of nine takes one, nought does not */
let perfect=0,awful=0;
for(let s5=0;s5<30;s5++){
  if(X.olyMedals(playOut(s5+200,()=>1).oly).board)perfect++;
  if(X.olyMedals(playOut(s5+300,()=>0).oly).board)awful++;
}
ok(perfect>=25,'nine wins out of nine on board one took a board medal '+perfect+' times in thirty');
ok(awful===0,'and nine losses never did, which the old dice roll could not promise');

/* ================= ON SCREEN ================= */
let g3=playOut(3);
let card=X.olySquadCard(g3.c,g3.tr);
ok(/the team sheet/.test(card),'the tournament screen shows your team sheet');
ok(/YOU/.test(card),'with you marked on it');
ok(g3.oly.mates.every(m=>card.indexOf(m.name)>=0),'and all three team-mates named');
ok(/4\/9|½\/9|\/9/.test(card),'each carrying what they have scored');
let mc=X.olyMatchCard(g3.tr);
ok(/the match/.test(mc),'the last match is shown board by board');
ok(/beat|drew with|lost to/.test(mc),'saying what happened to the team, not just to you');
ok((mc.match(/<span class="dim small" style="width:16px">/g)||[]).length===X.OLY_BOARDS,
  'with a line per board');
ok(/Elsewhere/.test(mc),'and a word about the other matches in the round');
let tc=X.olyTableCard(g3.tr);
ok(/🌍 Nations/.test(tc),'there is a nations table');
ok(/match pts · game pts/.test(tc),'scored the way a team event is scored');
ok(/YOU/.test(tc),'with your own row marked');
ok(new RegExp('Board '+X.olyBoardWord(g3.oly.myBoard)+': you are').test(tc),
  'and it says where your own board stands');
ok(X.olyCards(g3.c,g3.tr).length>card.length,'all three ride together on the tournament screen');
ok(X.olyCards(g3.c,{id:'x'})==='','and none of them appears at an event that is not the Olympiad');
ok(X.olySquadCard(g3.c,null)===''&&X.olyMatchCard(null)===''&&X.olyTableCard(null)==='',
  'nor with no tournament at all');
/* before a round is played */
let fresh2=tour(9),cf=career('ROU',2540);X.olyInit(cf,fresh2);
ok(X.olyMatchCard(fresh2)==='','no match is shown before one is played');
ok(/Nothing played yet/.test(X.olyTableCard(fresh2)),'and the table says so rather than looking wrong');
ok(/Boards two to four/.test(X.olySquadCard(cf,fresh2)),'the team sheet explains itself the first time');

/* the finish banner */
X.app.careerOly={place:2,of:12,team:'Silver',board:'Gold',myBoard:2,boardRank:1,boardOf:12,
  boardPct:0.7222,fed:'ROU',flag:'🇷🇴'};
let ban=X.careerFinishBanner({name:'Chess Olympiad',emoji:'🤝',score:6.5,rounds:9,tpr:2610,place:3});
ok(/finished 2nd of 12 nations/.test(ban),'the finish banner reports the country as well as you');
ok(/🥈 silver/.test(ban),'with the team medal');
ok(/Board two: 1st of 12 on 72%/.test(ban),'and your placing on the board you played');
ok(/🥇 gold board medal/.test(ban),'and the board medal it earned');
X.app.careerOly={place:7,of:12,team:null,board:null,myBoard:1,boardRank:6,boardOf:12,boardPct:0.5,fed:'ROU',flag:'🇷🇴'};
ban=X.careerFinishBanner({name:'Chess Olympiad',emoji:'🤝',score:4.5,rounds:9,tpr:2450,place:12});
ok(/finished 7th of 12 nations\./.test(ban),'a team out of the medals is reported plainly');
ok(!/medal/.test(ban),'without pretending there was one');
X.app.careerOly=null;
ok(!/nations/.test(X.careerFinishBanner({name:'City Open',emoji:'🏙️',score:5,rounds:9,tpr:2400,place:4})),
  'and an ordinary event says nothing about nations at all');

console.log('\n✅ olympiad: '+pass+' checks passed');
