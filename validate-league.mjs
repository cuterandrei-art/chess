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
const X=new Function(script+'\nreturn {store,app,render,joinClub,leaveClub,leagueInit,leagueSeason,leagueSchedule,'+
  'leagueTeam,leagueSimBoard,leagueFixture,leagueMyMatch,leagueResult,leagueSkip,leagueStandings,leaguePlace,'+
  'leagueSeasonEnd,leagueTableCard,leagueBoardRow,careerClubPanel,careerLeague,leagueClub,leagueEventName,'+
  'clubDivRating,clubDivPrize,freshCareer,fmtScore,CLUBS,CLUB_BOARDS,CLUB_SIZE,CLUB_DRAW_RATE};')();
const C=()=>X.store.career;
function fresh(){
  X.store.career=X.freshCareer();
  X.store.career.setup=true;X.store.career.name='Ada Marín';
  X.store.career.rating=1500;X.store.career.provisional=false;X.store.career.ratedGames=40;
  X.app.careerToast=null;
  return X.store.career;
}

/* ================= SIGNING FOR A CLUB ================= */
fresh();
ok(/Sign for a club/.test(X.careerClubPanel(C())),'with no club it offers to sign you for one');
ok(/four boards a match/.test(X.careerClubPanel(C())),'and says what a season is');
X.joinClub();
let L=C().club;
ok(!!L,'signing gives you a club');
ok(X.CLUBS.indexOf(L.name)>=0,'with a name from the league ('+L.name+')');
ok(L.div===4,'a 1500 belongs in Division 4, where the field is '+X.clubDivRating(4)+' ('+L.div+')');
ok(L.clubs.length===X.CLUB_SIZE,'a division is '+X.CLUB_SIZE+' clubs');
ok(L.clubs.filter(c=>c.id==='you').length===1,'one of which is yours');
ok(new Set(L.clubs.map(c=>c.name)).size===X.CLUB_SIZE,'and no club is in it twice');
ok(L.team.length===X.CLUB_BOARDS-1,'you have '+(X.CLUB_BOARDS-1)+' team-mates behind you');
ok(L.team.every(m=>m.name&&m.rating>0),'each with a name and a rating');
ok(L.team.every(function(m,i){return i===0||L.team[i-1].rating>=m.rating;}),
  'the team sheet is ordered by strength, strongest on board two');
ok(L.team.every(function(m,i){return m.board===i+2;}),'and the board numbers follow it');
ok(L.round===0,'the season has not started');
ok(L.history.length===0,'and there is nothing behind you yet');
X.joinClub();
ok(C().club===L,'signing again while you have a club does nothing');

/* clubs recruit at their own level */
fresh();C().rating=2400;C().ratedGames=40;
X.joinClub();
ok(C().club.div===1,'a 2400 plays board one in Division 1 ('+C().club.div+')');
fresh();C().rating=1800;C().ratedGames=40;
X.joinClub();
ok(C().club.div===3,'an 1800 is a Division 3 player ('+C().club.div+')');
fresh();C().rating=1000;
X.joinClub();
ok(C().club.div===4,'and a 1000 starts at the bottom ('+C().club.div+')');
fresh();C().rating=null;C().provisional=true;
X.joinClub();
ok(C().club.div===4,'an unrated player starts at the bottom too');

/* ================= THE FIXTURE LIST ================= */
const ids=['you','a','b','c','d','e'];
const sched=X.leagueSchedule(ids);
ok(sched.length===5,'six clubs make five rounds');
ok(sched.every(r=>r.pairs.length===3),'three matches in each');
const seen={};
sched.forEach(r=>r.pairs.forEach(p=>{
  seen[[p.h,p.a].sort().join('|')]=(seen[[p.h,p.a].sort().join('|')]||0)+1;}));
ok(Object.keys(seen).length===15,'fifteen pairings, which is everybody once');
ok(Object.keys(seen).every(k=>seen[k]===1),'and nobody plays the same club twice');
sched.forEach(function(r,i){
  const inRound=[];r.pairs.forEach(p=>{inRound.push(p.h,p.a);});
  ok(new Set(inRound).size===6,'round '+(i+1)+' has every club playing exactly once');
});
ok(sched.every(r=>r.pairs.some(p=>p.h==='you'||p.a==='you')),'and you play in every round');

/* ================= A BOARD, SIMULATED ================= */
let w=0,d=0,l=0;
for(let i=0;i<4000;i++){const s=X.leagueSimBoard(1500,1500);if(s===1)w++;else if(s===0)l++;else d++;}
ok(Math.abs((w+d*0.5)/4000-0.5)<0.05,'two equal players score about half against each other ('+
  Math.round((w+d*0.5)/40)/10+')');
ok(Math.abs(d/4000-X.CLUB_DRAW_RATE)<0.05,'and draw about as often as classical chess does ('+Math.round(d/40)+'%)');
let strong=0;
for(let i=0;i<4000;i++)strong+=X.leagueSimBoard(1900,1500);
ok(Math.abs(strong/4000-0.909)<0.03,'400 points of advantage scores what Elo says it should — about 91% ('+Math.round(strong/40)+'%)');
/* the favourite must still be able to lose: a flat draw rate used to make that
   impossible, which also dragged its expected score below its rating */
let lost=0;
for(let i=0;i<4000;i++)if(X.leagueSimBoard(2100,1500)===0)lost++;
ok(lost>0,'and even a 600-point favourite loses sometimes ('+lost+' times in 4000)');
let drawsFar=0;
for(let i=0;i<4000;i++)if(X.leagueSimBoard(2100,1500)===0.5)drawsFar++;
ok(drawsFar/4000<X.CLUB_DRAW_RATE/2,'with far fewer draws than between equals ('+Math.round(drawsFar/40)+'%)');
let weak=0;
for(let i=0;i<4000;i++)weak+=X.leagueSimBoard(1200,1800);
ok(Math.abs(weak/4000-0.03)<0.03,'and being outclassed scores about what it should ('+Math.round(weak/40)+'%)');
ok([0,0.5,1].indexOf(X.leagueSimBoard(1500,1500))>=0,'a board is always a win, a draw or a loss');

/* ================= PLAYING A ROUND ================= */
fresh();X.joinClub();L=C().club;
let m=X.leagueMyMatch(C());
ok(!!m,'there is a match to play');
ok(m.fixture.round===1,'round one');
ok(!!m.oppClub&&m.oppClub.id!=='you','against another club ('+m.oppClub.name+')');
ok(m.oppTeam.length===X.CLUB_BOARDS,'who field a full team');
ok(m.oppTeam.every(o=>o.name&&o.rating>0),'with names and ratings of their own');
ok(m.oppTeam.every(function(o,i){return i===0||m.oppTeam[i-1].rating>=o.rating;}),
  'their line-up is ordered by strength too — board 3 is never stronger than board 2');
ok(m.oppTeam.every(function(o,i){return o.board===i+1;}),'with the board numbers to match');
const sheet=JSON.stringify(m.oppTeam);
ok(JSON.stringify(X.leagueMyMatch(C()).oppTeam)===sheet,
  'the team sheet is drawn once and kept, not reshuffled on every redraw');
ok(typeof m.home==='boolean','the match is home or away');

let panel=X.careerClubPanel(C());
ok(/Round 1 of 5/.test(panel),'the panel says which round it is');
ok(/Play board one/.test(panel),'and offers your board');
ok(/Miss this round/.test(panel),'with the option of missing it');
ok(panel.indexOf(m.oppTeam[0].name)>=0,'it names the player you will face');
ok(panel.indexOf(L.team[0].name)>=0,'and your own team-mates');
ok(/board one/.test(panel),'you are board one');
ok(/Division 4/.test(panel),'in your division');
ok(/data-act="careerleague"/.test(panel),'the button is wired');

/* your board goes in, the rest of the team plays theirs */
X.leagueResult(1);
L=C().club;
const f=L.fixtures[0];
ok(f.mine===1,'your result is recorded on board one');
ok(f.boards.length===X.CLUB_BOARDS,'and every board has a result');
ok(f.boards[0].you===true&&f.boards[0].score===1,'yours is the one you played');
ok(f.boards.slice(1).every(b=>[0,0.5,1].indexOf(b.score)>=0),'your team-mates got real results');
ok(f.us+f.them===X.CLUB_BOARDS,'the match score adds up');
ok(f.played===true,'the match is played');
ok(L.round===1,'and the season moves on');
ok(f.others.length===2,'the other two matches in the round were played too');
ok(f.others.every(o=>o.hs+o.as===X.CLUB_BOARDS),'each with a full score');
ok(L.last&&L.last.mine===1,'the club remembers how it went');

/* the table */
let S=X.leagueStandings(L);
ok(S.length===X.CLUB_SIZE,'the table has every club');
ok(S.filter(r=>r.you).length===1,'including you');
const totalPts=S.reduce((a,r)=>a+r.pts,0);
ok(totalPts===6,'three matches were played, so six match points were handed out ('+totalPts+')');
const totalBoards=S.reduce((a,r)=>a+r.bf,0);
ok(totalBoards===3*X.CLUB_BOARDS,'and twelve board points');
const you=S.filter(r=>r.you)[0];
ok(you.pts===(f.us>f.them?2:f.us===f.them?1:0),'your points match your result ('+you.pts+' for '+f.us+'–'+f.them+')');
ok(you.w+you.d+you.l===1,'you have played one match');
panel=X.careerClubPanel(C());
ok(/Round 2 of 5/.test(panel),'the panel moves to round two');
ok(/Last match, board by board/.test(panel),'and shows the match you just played');
ok(/Elsewhere in the round/.test(panel),'with the other results from the round');
ok(/Pts/.test(panel)&&/Boards/.test(panel),'the league table is on screen');

/* the match just played is closed for good */
const snap=JSON.stringify(L.fixtures[0]);
X.leagueResult(0);
ok(JSON.stringify(C().club.fixtures[0])===snap,'the match you just played cannot be resolved a second time');
ok(C().club.round===2,'the extra result went to the next round instead, as a fresh match');
ok(C().club.fixtures[1].mine===0,'with its own score');

/* ================= MISSING A ROUND ================= */
fresh();X.joinClub();
const rep0=C().reputation;
X.leagueSkip();
L=C().club;
ok(L.round===1,'missing a round still resolves the match');
ok(L.fixtures[0].missed===true,'it is marked as one you missed');
ok(/reserve/.test(L.fixtures[0].boards[0].name),'a reserve took your board');
ok(L.fixtures[0].boards.length===X.CLUB_BOARDS,'and the match was played out');
ok(C().reputation<rep0,'your club thinks a little less of you for it');
ok(L.fixtures[0].mine==null,'you scored nothing yourself, because you did not play');
panel=X.careerClubPanel(C());
ok(/Round 2 of 5/.test(panel),'and the season carries on');

/* ================= A WHOLE SEASON ================= */
fresh();X.joinClub();
const name=C().club.name;
for(let r=0;r<5;r++){
  ok(!!X.leagueMyMatch(C()),'round '+(r+1)+' has a match waiting');
  X.leagueResult(1);                   // win every board one
}
L=C().club;
ok(L.season===2,'five rounds later a new season has begun');
ok(L.history.length===1,'with last season written down');
const h=L.history[0];
ok(h.of===5&&h.board===5,'you scored 5/5 on board one');
ok(h.place>=1&&h.place<=X.CLUB_SIZE,'the club finished somewhere in the table ('+h.place+')');
ok(L.name===name,'you are still at the same club');
ok(L.round===0&&L.fixtures.length===5,'and the new season starts from the beginning');
ok(Object.keys(L.table).every(k=>L.table[k].pts===0),'with the table wiped');
ok(L.clubs.length===X.CLUB_SIZE,'and a fresh division');
panel=X.careerClubPanel(C());
ok(/Seasons/.test(panel),'the panel keeps a history');
ok(/season 2/.test(panel),'and says which season you are in');

/* winning the division goes up; the money follows */
fresh();X.joinClub();
L=C().club;L.div=3;
L.table={you:{w:5,d:0,l:0,pts:10,bf:16,ba:4}};
L.clubs.forEach(function(cl,i){if(cl.id!=='you')L.table[cl.id]={w:0,d:0,l:i,pts:i,bf:2+i,ba:10,};});
L.fixtures.forEach(function(f){f.mine=1;f.played=true;});
L.round=5;
const money0=C().money||0;
X.leagueSeasonEnd(C());
ok(C().club.div===2,'winning the division is promotion');
ok((C().money||0)>money0,'with prize money for it');
ok(C().club.history[0].up===true,'and the season is recorded as a promotion');
ok(/promoted to Division 2/.test(X.app.careerToast||''),'the news says so ('+X.app.careerToast+')');
ok(C().club.team.length===X.CLUB_BOARDS-1,'the new division comes with a team for it');
ok(C().club.team.some(mm=>mm.rating>X.clubDivRating(4)),'and stronger team-mates than the one below');

/* finishing last goes down */
fresh();X.joinClub();
L=C().club;L.div=3;
L.table={you:{w:0,d:0,l:5,pts:0,bf:3,ba:17}};
L.clubs.forEach(function(cl,i){if(cl.id!=='you')L.table[cl.id]={w:3,d:0,l:1,pts:6+i,bf:12,ba:6};});
L.round=5;
X.leagueSeasonEnd(C());
ok(C().club.div===4,'finishing last is relegation');
ok(C().club.history[0].down===true,'recorded as one');
ok(/relegated|drop/.test(X.app.careerToast||''),'and said out loud ('+X.app.careerToast+')');

/* Division 1 has nowhere to climb, Division 4 nowhere to fall */
fresh();X.joinClub();
L=C().club;L.div=1;L.round=5;
L.table={you:{w:5,d:0,l:0,pts:10,bf:16,ba:4}};
L.clubs.forEach(function(cl,i){if(cl.id!=='you')L.table[cl.id]={w:0,d:0,l:1,pts:i,bf:4,ba:12};});
X.leagueSeasonEnd(C());
ok(C().club.div===1,'winning Division 1 keeps you in Division 1');
ok(/champions of the league/.test(X.app.careerToast||''),'but it is called what it is ('+X.app.careerToast+')');
fresh();X.joinClub();
L=C().club;L.div=4;L.round=5;
L.table={you:{w:0,d:0,l:5,pts:0,bf:2,ba:18}};
L.clubs.forEach(function(cl,i){if(cl.id!=='you')L.table[cl.id]={w:3,d:0,l:0,pts:6+i,bf:14,ba:6};});
X.leagueSeasonEnd(C());
ok(C().club.div===4,'and finishing last in Division 4 cannot drop you further');

/* the prize money is worth more higher up */
ok(X.clubDivPrize(1,1)>X.clubDivPrize(4,1),'winning the top division pays more than the bottom one');
ok(X.clubDivPrize(2,1)>X.clubDivPrize(2,2),'and first pays more than second');
ok(X.clubDivPrize(2,4)===0,'fourth pays nothing');

/* ================= OLD SAVES ================= */
fresh();
C().club={name:'Castle Crew',div:2,points:6,played:3};        // the shape before this existed
L=X.leagueInit(C());
ok(!!L.fixtures&&L.fixtures.length===5,'a club saved before there were seasons gets one');
ok(L.name==='Castle Crew','keeping its name');
ok(L.div===2,'and its division');
ok(!!X.leagueMyMatch(C()),'and it has a match to play');
ok(X.careerClubPanel(C()).indexOf('Castle Crew')>=0,'the panel draws it without complaint');
ok(X.leagueInit({club:null})===null&&X.leagueInit(null)===null,'and no club is simply no club');
fresh();
C().club=X.leagueSeason(C(),3,'Windmill CC');
C().club.team=[];
ok(X.leagueInit(C()).team.length===X.CLUB_BOARDS-1,'a club that lost its team-mates gets them back');

/* ================= THE GAME ITSELF ================= */
fresh();X.joinClub();
m=X.leagueMyMatch(C());
X.careerLeague();
ok(X.app.view==='play','playing your board starts a real game');
ok(X.app.careerLeague===true,'flagged as a league game, so the result goes to the club');
ok(X.app.careerRoundOpp&&X.app.careerRoundOpp.name===m.oppTeam[0].name,
  'against the player on their board one');
ok(X.app.careerElo===m.oppTeam[0].rating,'at their rating');
ok(/board 1/.test(X.app.playTitle),'the title says which board you are on');
ok(X.app.playTitle.indexOf(C().club.name)>=0,'and which club you play for');
ok(X.app.playSide===(m.home?'w':'b'),'the home team has White on board one');
ok(X.app.tc&&X.app.tc.base>0,'a league game is played with a clock');
ok(/Div \d/.test(X.leagueEventName(C())),'and it is filed under the club match, not as a one-off');
ok(X.leagueEventName(C()).indexOf(C().club.name)>=0,'naming your club');
/* a tournament blocks it */
C().tour={id:'x',name:'Something',round:0,rounds:5};
X.app.view='career';
X.careerLeague();
ok(X.app.view==='career','you cannot play a league board in the middle of a tournament');
ok(/waits until the tournament is over/.test(X.careerClubPanel(C())),'and the panel says why');
C().tour=null;

/* ================= WIRED IN ================= */
ok(/h\+=careerClubPanel\(c\);/.test(script),'the panel is rendered on the Life tab');
ok(/act==='careerleague'\)careerLeague\(\)/.test(script),'the play button is connected');
ok(/act==='leagueskip'\)uiConfirm/.test(script),'missing a round asks first');
ok(/act==='leaveclub'\)uiConfirm/.test(script),'and so does leaving the club');
ok(/if\(app\.careerLeague\)\{leagueResult\(score\);app\.careerLeague=false;\}/.test(script),
  'a finished league game reports back to the club exactly once');
ok(/app\.careerLeague\?leagueEventName\(c\)/.test(script),'and is archived under the match it was');

console.log('\n✅ league: '+pass+' checks passed');
