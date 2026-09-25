/* Four things the world did not do: opponents who prepare against what you
   play, a rating list published once a month that everything is paired and
   rated from, and a chat for the games you watch. (The World Cup's 206 are in
   validate-realism.) */
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
dom.window.__PUZZLES=[];dom.window.scrollTo=()=>{};
let pass=0; const ok=(c,m)=>{if(!c)throw new Error('FAIL: '+m);pass++;console.log('  ✓ '+m);};
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,worldWeek,pubTick,pubPublish,pubKey,pubRating,youPub,pubMonth,wpRating,worldRanking,worldRankingLive,'+
  'worldRank,worldApply,wrEnsure,worldById,buildWorld,careerLeaderboard,viewPlayer,joinTournament,startChallenge,stopClockTick,'+
  'BUILT,byId,gameOpeningId,myLines,oppPrepFor,prepApply,prepEloNow,prepDepth,prepWarning,careerScoutPanel,prepKey,PREP_ELO,PREP_DODGE,'+
  'playNote,careerResult,careerPrepPanel,oppOpenings,startSpectate,specChatMove,specChatEnd,specChatTick,specLive,viewSpectate,SPEC_CHAT,'+
  'tourColourOf,render};')();
const c0=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:200},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
// the moves of a Library opening, down its first branch
const line=(id,n)=>{const o=X.byId.get(id);let nd=o.root;const out=[];for(let i=0;i<n&&nd.children&&nd.children.length;i++){nd=nd.children[0];out.push({san:nd.move,from:nd.from,to:nd.to});}return out;};

console.log('\n— L1 · the rating list, once a month —');
let c=c0();
ok(!c.pub&&X.pubRating(X.buildWorld()[0],'classical')===X.wpRating(X.buildWorld()[0],'classical'),'before the first list, the list is the live ratings');
X.worldWeek(c);
ok(c.pub&&c.pub.k===X.pubKey(c),'the world week publishes the list ('+X.pubMonth(c)+')');
const W=X.buildWorld(),A=W.find(p=>p.id==='carlsen'),B=W.find(p=>p.id==='nakamura');
const a0=X.pubRating(A,'classical');
X.wrEnsure(c,A)[0]=a0+40;c.wrv++;
ok(X.wpRating(A,'classical')===a0+40&&X.pubRating(A,'classical')===a0,'a game later Carlsen is 40 up live — and still '+a0+' on the list');
const rk=X.worldRanking(c,'classical').find(p=>p.id==='carlsen'),rl=X.worldRankingLive(c,'classical').find(p=>p.id==='carlsen');
ok(rk.rating===a0&&rl.rating===a0+40,'the ranking is the list; the live ranking counts every game');
// the list is what a game is rated from: an equal list rating is an even game, whatever the live one says
{const R=X.wrEnsure(c,B),before=R[0];const d=X.worldApply(c,B,'classical',1,X.pubRating(B,'classical'));
 ok(Math.abs(d-(B.r0>=2400||R[0]>=2400?10:20)*0.5)<0.6,'a win against somebody level on the list is worth half the K-factor ('+d.toFixed(1)+')');R[0]=before;}
// a month on, the list catches up
c.weeks+=5;X.pubTick(c);
ok(X.pubRating(A,'classical')===a0+40,'the next month’s list shows it');
// your own rating: live moves, the list waits
c.rating=2450;c.pub=null;X.pubPublish(c);
c.rating=2480;
ok(X.youPub(c,'classical')===2450&&X.worldRanking(c,'classical').find(p=>p.you).rating===2450,'you are on the list at 2450 after gaining 30 live');
let LB=X.careerLeaderboard(c);
ok(/the \w+ \d{4} list/.test(LB)&&/Live you are on 2480 \(\+30\), which the \w+ list will show/.test(LB),'and the World tab says so');
c.pub.you=[null,null,null];
LB=X.careerLeaderboard(c);
ok(/Your first classical rating, 2480, goes on the \w+ list/.test(LB),'a first rating waits for the next list to appear on it');
// fields are drawn from the list, and a game is against their list rating
c=c0({rating:2600,peak:2600,money:90000});X.worldWeek(c);
c.weeks=4;X.pubTick(c);
X.buildWorld().slice(0,40).forEach(p=>{X.wrEnsure(c,p)[0]+=25;});c.wrv++;
X.joinTournament('gmrr');
const f=(c.tour.field||[]).filter(o=>o.wid);
ok(f.length>0&&f.every(o=>o.rating===X.pubRating(X.worldById(o.wid),'classical')),'an event’s field carries their list ratings, not the live ones — that is what it is paired and rated from');
c.tour=null;
X.app.chalFormat='classical';X.startChallenge('carlsen');X.stopClockTick();
ok(X.app.careerRoundOpp.rating===X.pubRating(X.worldById('carlsen'),'classical'),'a challenge too');
X.app.playFen=null;X.app.careerOpp=null;
X.app.playerId='carlsen';X.app.view='player';
const pv=X.viewPlayer();
ok(/live \d+ \(\+/.test(pv)&&/Ratings are the \w+ \d{4} list/.test(pv),'a profile shows the list rating, and the live one beside it');

console.log('\n— L2 · what you play, read off your games —');
c=c0();
const najdorf=line('sicilian-najdorf',12),french=line('french',10),italian=line('italian',10);
ok(X.gameOpeningId(najdorf,'b')==='sicilian-najdorf'&&X.gameOpeningId(italian,'w')==='italian','a game is recognised as the Library opening it follows');
ok(X.gameOpeningId([{san:'e4'},{san:'e5'}],'w')===null,'two moves are not an opening yet');
const mkG=(moves,color)=>({moves:moves.concat([{san:'h3'},{san:'h6'}]),color:color,result:0.5,format:'classical'});
c.games=[];for(let i=0;i<8;i++)c.games.push(mkG(najdorf,'b'));for(let i=0;i<2;i++)c.games.push(mkG(french,'b'));for(let i=0;i<6;i++)c.games.push(mkG(italian,'w'));
let ML=X.myLines(c);
ok(ML.b&&ML.b.id==='sicilian-najdorf'&&ML.b.n===8&&ML.b.of===10,'against 1.e4 you play the Najdorf, 8 games of 10');
ok(ML.w&&ML.w.id==='italian'&&ML.w.n===6&&ML.w.of===6&&!ML.b2,'as White the Italian, every time; nothing yet against 1.d4');
const pp=X.careerPrepPanel(c);
ok(/Your repertoire, as your opponents read it/.test(pp)&&/Najdorf[\s\S]*8 of 10 games · predictable/.test(pp),'the prep card shows your repertoire the way your opponents read it — and what is predictable');

console.log('\n— L3 · who prepares, and for what —');
const opp=(n,r)=>({name:n,rating:r});
ok(!X.oppPrepFor(c,opp('Tom Club',1850),'w','k1'),'a club player never prepares');
let n26=0,n24=0,n22=0;
for(let i=0;i<400;i++){if(X.oppPrepFor(c,opp('M. Carlsen',2830),'b','k'+i))n26++;if(X.oppPrepFor(c,opp('A. Strongman',2450),'w','k'+i))n24++;if(X.oppPrepFor(c,opp('B. Decent',2250),'w','k'+i))n22++;}
ok(n26>n24&&n24>n22&&n22>0,'the stronger they are, the likelier they have prepared ('+Math.round(n26/4)+'% at 2830, '+Math.round(n24/4)+'% at 2450, '+Math.round(n22/4)+'% at 2250)');
c.rival={id:'x',name:'R. Ival',rating:2500,intensity:2};
ok(!!X.oppPrepFor(c,opp('R. Ival',2500),'w','any'),'your rival always has');
c.rival=null;
const P=X.oppPrepFor(c,opp('M. Carlsen',2830),'b','k'+[...Array(400).keys()].find(i=>X.oppPrepFor(c,opp('M. Carlsen',2830),'b','k'+i)));
ok(P&&P.id==='sicilian-najdorf'&&P.k==='b','with Black against Carlsen, who opens 1.e4, it is your Najdorf he has prepared');
ok(X.oppPrepFor(c,opp('M. Carlsen',2830),'b','same')===X.oppPrepFor(c,opp('M. Carlsen',2830),'b','same')||JSON.stringify(X.oppPrepFor(c,opp('M. Carlsen',2830),'b','same'))===JSON.stringify(X.oppPrepFor(c,opp('M. Carlsen',2830),'b','same')),'the same game gets the same answer, so scouting and the board agree');
// predictable is punished; varied is not
const cv=c0();cv.games=[];
['sicilian-najdorf','french','caro-kann','sicilian-dragon','petrov','scandinavian','pirc','modern','alekhine','sicilian-sveshnikov'].forEach(id=>{cv.games.push(mkG(line(id,10),'b'));});
let nv=0;for(let i=0;i<400;i++)if(X.oppPrepFor(cv,opp('M. Carlsen',2830),'b','k'+i))nv++;
ok(nv===0,'play ten different defences and there is nothing to prepare for (a line needs three games)');

console.log('\n— L4 · in the game —');
c=c0();c.games=[];for(let i=0;i<8;i++)c.games.push(mkG(najdorf,'b'));
X.app.careerOpp='oneoff';X.app.playMoves=[];X.app.playBook=null;
X.prepApply(c,opp('M. Carlsen',2830),'b','force',null);
if(!X.app.careerOppPrep){for(let i=0;i<50&&!X.app.careerOppPrep;i++)X.prepApply(c,opp('M. Carlsen',2830),'b','force'+i,null);}
ok(X.app.careerOppPrep&&X.app.careerOppPrep.id==='sicilian-najdorf','prepared, they go into your line');
ok(X.app.playBook&&X.app.playBook.id==='sicilian-najdorf'&&X.app.playBookNode,'their book is your Najdorf, main line and all');
ok(/Najdorf/.test(X.app.careerBanter.line),'and they tell you so across the board (“'+X.app.careerBanter.line+'”)');
ok(/they prepared your Sicilian: Najdorf/.test(X.playNote()),'the chip beside the heading says it');
X.app.playMoves=najdorf.slice(0,8);
ok(X.prepDepth()===8&&X.prepEloNow()===X.PREP_ELO,'eight moves into it they are '+X.PREP_ELO+' points stronger');
X.app.playMoves=najdorf.slice(0,8).concat([{san:'h3',from:'h2',to:'h3'},{san:'h6',from:'h7',to:'h6'}]);
ok(X.prepEloNow()===X.PREP_ELO,'and stay so after leaving it that deep — they know what follows');
X.app.playMoves=najdorf.slice(0,2).concat([{san:'b3',from:'b2',to:'b3'},{san:'Nc6',from:'b8',to:'c6'}]);
ok(X.prepDepth()===2&&X.prepEloNow()===-X.PREP_DODGE,'dodge it early and their homework is wasted: '+X.PREP_DODGE+' points weaker');
X.app.playMoves=Array(26).fill({san:'x',from:'a1',to:'a2'});
ok(X.prepEloNow()===0,'and by the middlegame it is chess again');
ok(/sharp-prepE\+prepEloNow\(\)/.test(script),'the engine’s strength takes it into account');
// your own preparation of something else sidesteps theirs
X.app.careerOppPrep=null;X.app.playBook=null;
for(let i=0;i<60&&!X.app.careerOppPrep;i++)X.prepApply(c,opp('M. Carlsen',2830),'b','dodge'+i,{id:'french'});
ok(X.app.careerOppPrep&&X.app.careerOppPrep.dodged&&!X.app.playBook,'with the French prepared instead, their Najdorf work is for the wrong opening');
ok(/their prep was for your/.test(X.playNote()),'which the chip says');
// the news, after
X.app.careerOppPrep=null;for(let i=0;i<60&&!X.app.careerOppPrep;i++)X.prepApply(c,opp('M. Carlsen',2830),'b','news'+i,null);
X.app.careerRoundOpp={name:'M. Carlsen',rating:2830};X.app.playMoves=najdorf.slice(0,10);X.app.careerScored=false;X.app.careerOneoff='classical';
const n0=(c.news||[]).length;X.careerResult(0.5);
ok((c.news||[]).some(n=>/M\. Carlsen had prepared your Sicilian: Najdorf, and you went into it: 5 moves of their homework/.test(n.t)),'after the game the news says how it went');
X.app.careerOpp=null;
// the scouting card warns before the round
c=c0({rating:2700,peak:2700,money:90000});c.games=[];for(let i=0;i<8;i++){c.games.push(mkG(najdorf,'b'));c.games.push(mkG(italian,'w'));}
c.rival=null;
X.joinTournament('gmrr');
let warned=0,tries=0;
while(c.tour&&tries<9){const o=c.tour.field[c.tour.round];if(/They have prepared for your/.test(X.careerScoutPanel(c)||''))warned++;c.tour.round++;tries++;}
ok(warned>0,'in a GM round-robin the scouting card warns when a round’s opponent has prepared ('+warned+' of '+tries+' rounds)');
c.tour=null;

console.log('\n— L5 · a chat for the games you watch —');
c=c0();
const WP=X.worldRanking(c,'classical').find(p=>p.id==='carlsen'),BP=X.worldRanking(c,'classical').find(p=>p.id==='nakamura');
X.startSpectate(WP,BP);
const S=X.app.spec;
ok(S.chat.length>=3&&S.chat.some(m=>/Carlsen|Nakamura/.test(m.t)),'watching a game opens its chat, about the two players');
ok(S.viewers>500,'a Carlsen game is watched by hundreds ('+S.viewers+')');
// Scholar's mate: every move goes to the chat
const g=new Chess();
['e4','e5','Qh5','Nc6','Bc4','Nf6','Qxf7#'].forEach(san=>{const m=g.move(san);S.moves.push(m.san);S.stack.push(g.fen());X.specChatMove(S);});
ok(S.chat.some(m=>/CHECKMATE by Carlsen|GG Carlsen|finish by Carlsen/.test(m.t)),'the mate — by name');
X.specChatEnd(S,'w');
ok(S.chat.slice(-3).some(m=>/Carlsen/.test(m.t)),'and the result');
const S2=(X.startSpectate(BP,WP),X.app.spec);
const g2=new Chess();
['e4','d5','exd5','Qxd5','Nc3','Qe5+','Be2','Qxe2+'].forEach(san=>{const m=g2.move(san);S2.moves.push(m.san);S2.stack.push(g2.fen());X.specChatMove(S2);});
ok(S2.chat.some(m=>/Carlsen/.test(m.t)&&/(bishop|takes first|trades|capture|up material|winning|check)/i.test(m.t))||S2.chat.some(m=>/check from|first capture|up material/i.test(m.t)),'captures and checks are named');
S2.next=0;const nn=S2.chat.length;X.app.view='spectate';X.specChatTick();
ok(S2.chat.length>nn,'between moves, the chat keeps talking');
X.app.view='spectate';
ok(/id="specchat"/.test(X.viewSpectate())&&/Stream it/.test(X.viewSpectate()),'the spectator screen shows the chat, and a way to take it live');
// a watch-along: a day and some energy, paid in subscribers
c.energy=80;c.day=0;c.subs=100;
X.specLive();
ok(S2.live&&c.energy===75&&c.day===1,'streaming it costs a day and 5 energy');
S2.live.subs=7;S2.live.peak=300;X.specChatEnd(S2,'b');
ok(S2.live.done&&c.subs===107&&(c.news||[]).some(n=>/watch-along/.test(n.t)),'and pays in subscribers when the game ends');
c.tour={name:'Hastings Congress',round:1,rounds:9,format:'classical'};
X.startSpectate(WP,BP);X.specLive();
ok(!X.app.spec.live,'not in the middle of an event');
c.tour=null;
if(X.app._specTimer)clearInterval(X.app._specTimer);

console.log('\n✅ preparation, the monthly list and the watching chat: '+pass+' checks passed');
X.stopClockTick();
process.exit(0);
