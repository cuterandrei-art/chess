/* The junior career and the women's circuit: age groups and their events,
   school and parents, FIDE's direct titles, the women on the list, the women's
   events and their championship cycle. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,TOURNAMENTS,EVENT_WEEK,heldThisSeason,weekOfSeason,tourLocked,tourVisible,'+
  'youthDef,youthGroup,ageAtJan,schoolTerm,schoolWeek,endOfWeek,lifeCosts,homeOf,careerJuniorPanel,juniorStudy,parkLocked,parkById,streamShowBlock,streamShowBy,pplWeek,pplOf,pplInit,'+
  'directTitle,directTitlesFor,titleCondCheck,checkTitles,DT_AGE,DT_MIN,buildWorld,worldRanking,womenRanking,womenRank,wChampion,wcycInit,wcycLock,wCandidatesField,wcycWorldTick,wxInit,'+
  'femSurname,natNameW,koC,KO_WOMEN,careerLeaderboard,careerWomenRoad,careerLobby,wOlympiadSelected,render,viewCareer};')();
function atEvent(c,id){const wk=X.EVENT_WEEK[id];let S=c.season||1;while(!X.heldThisSeason(id,{season:S}))S++;c.season=S;c.weeks=(S-1)*52+wk;c.day=0;return c;}
const T=id=>X.TOURNAMENTS.find(t=>t.id===id);
const kid=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',age:11,junior:true,money:50,school:{grade:75,exams:null},parents:{fund:1500,left:1500,s:1}},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
const woman=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',gender:'women',provisional:false,rating:2300,peak:2300,ratedGames:200,money:50000,energy:90,age:22},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};

console.log('\n— K1 · a junior career —');
let c=kid();
ok(c.money<=200,'an eleven-year-old starts with pocket money, not a professional’s savings ('+c.money+')');
ok(X.youthGroup(c)===12&&X.ageAtJan(c)===11,'eleven on 1 January: the under-12s');
ok(X.lifeCosts(c).total===0&&X.homeOf(c).id==='parents','living at home: no rent, no food bill');
ok(['natyouth','contyouth','worldyouth','contjunior','worldjunior'].every(id=>X.tourVisible(T(id),c)),'every junior event is on the calendar');
ok(X.tourLocked(T('worldjunior'),c,true)==='needs a rating','the World Junior needs a rating');
const woEv=X.TOURNAMENTS.filter(t=>t.women);
ok(woEv.length>=9&&woEv.every(t=>!X.tourVisible(t,c)),'the women’s events are not on an open-track calendar');
atEvent(c,'natyouth');
const D=X.youthDef(T('natyouth'),c);
ok(D.name==='National Youth Championship U12'&&D.avg===1500,'the national championship is your age group’s: '+D.name+', average '+D.avg);
X.joinTournament('natyouth');
let tr=c.tour;
ok(tr&&tr.age===12&&tr.hall.every(o=>o.fed==='ROU'&&o.age!=null&&o.age<12),'a hall of Romanian children under twelve');
ok(tr.hall.every(o=>!/\d/.test(o.name)),'named the way Romanian children are named ('+tr.hall.slice(0,3).map(o=>o.name).join(', ')+')');
while(c.tour)X._simRound(c);
ok(c.history[0].name==='National Youth Championship U12','played and finished');
// the federation's pick
c.youthSel={s:c.season,how:'national champion'};
atEvent(c,'contyouth');
ok(X.youthDef(T('contyouth'),c).name==='European Youth Championship U12','in Romania the continental is the European Youth Championship');
const p0=c.parents.left,m0=c.money;X.joinTournament('contyouth');tr=c.tour;
ok(tr.sel,'picked by the federation');
while(c.tour)X._simRound(c);
ok(c.parents.left===p0&&c.money>=m0-5,'the federation pays: nothing from home, nothing from you');
// without the federation, home pays
c.youthSel=null;atEvent(c,'worldyouth');const p1=c.parents.left;X.joinTournament('worldyouth');tr=c.tour;
ok(tr&&!tr.sel&&/World Cadets Championship U12/.test(tr.name),'the World Cadets, at your parents’ expense');
while(c.tour)X._simRound(c);
ok(c.parents.left<p1,'your parents pay for it ('+money(p1)+' → '+money(c.parents.left)+')');
function money(n){return Math.round(n);}

console.log('\n— K1 · school —');
c=kid();
ok(X.schoolTerm(5)&&!X.schoolTerm(30)&&!X.schoolTerm(43),'term in February, holidays in August and at half-term');
c.weeks=6;c.day=0;c.weekLog=[];c.school.grade=70;X.schoolWeek(c);
ok(c.school.grade>70,'a week at school brings the grades back ('+c.school.grade+')');
c.weekLog=[{id:'event'},{id:'event'},{id:'event'},{id:'event'},{id:'event'}];const g0=c.school.grade;X.schoolWeek(c);
ok(g0-c.school.grade>=7,'a term-time week away costs about seven points ('+g0+' → '+c.school.grade+')');
c.school.grade=45;c.weeks=6;
ok(/grades first/.test(X.tourLocked(T('intl'),c,true)||''),'under 50, your parents say no to a trip in term time');
c.weeks=30;
ok(!/grades first/.test(X.tourLocked(T('intl'),c,true)||''),'the summer holidays are another matter');
c.weeks=6;c.youthSel={s:c.season};
ok(!/grades first/.test(X.tourLocked(T('worldyouth'),c,true)||''),'and the federation writes to the school for its championships');
c.youthSel=null;c.day=0;const gg=c.school.grade;X.juniorStudy();
ok(c.school.grade>gg,'a day of homework helps');
c.weeks=25;c.school.grade=85;const f0=c.parents.fund;c.weekLog=[];X.schoolWeek(c);
ok(c.school.exams===c.season&&c.parents.fund>f0,'top marks in June: a bit more for chess from home');
ok(/School and home/.test(X.careerJuniorPanel(c))&&/Study/.test(X.careerJuniorPanel(c)),'the Life tab shows school and home');
// eighteen
c.age=18.1;X.schoolWeek(c);
ok(c.school.done&&!c.junior&&X.homeOf(c).id!=='parents'&&X.lifeCosts(c).total>0,'at eighteen: school is over, and the rent is yours');

console.log('\n— K1 · what waits —');
c=kid();
ok(/over-18s/.test(X.parkLocked(c,X.parkById('sal'))||''),'the park’s money games wait until eighteen');
ok(/13/.test(X.streamShowBlock(c,X.streamShowBy('game'))||''),'streaming waits until thirteen');
c.tour={name:'Test',place:{trip:'abroad'}};c.weeks=30;c.pplMet=0;X.pplInit(c);const rnd=Math.random;Math.random=()=>0.01;X.pplWeek(c);Math.random=rnd;c.tour=null;
ok(!(c.phone||[]).some(m=>/asked for your number/.test(m.t)),'nobody asks an eleven-year-old for their number');
const adult=X.freshCareer();Object.assign(adult,{setup:true,age:16});X.store.career=adult;X.lifeInit(adult);
ok(!X.parkLocked(adult,X.parkById('sal')),'a career begun at sixteen is not a junior one: the park is open, as before');

console.log('\n— K1 · FIDE’s direct titles —');
ok(X.DT_AGE.world[20].gold[0][1]==='GM'&&X.DT_AGE.world[16].gold[0][1]==='IM'&&X.DT_AGE.world[10].sb[0][1]==='CM','the table: World U20 gold is GM, U16 gold IM, a U10 medal CM');
c=kid({provisional:false,rating:1650,peak:1650});
let r=X.directTitle(c,'CM','bronze at the World Cadets U10');
ok(r&&r.cond&&c.titleCond.length===1&&c.titles.indexOf('CM')<0,'a CM title at 1650 waits for the rating — FIDE’s minimum is '+X.DT_MIN.CM);
c.peak=2010;c.rating=2010;const got=X.checkTitles(c);
ok(got.indexOf('CM')>=0&&c.titleCond.length===0,'at 2010 it is confirmed');
// a medal at the World Youth: the table, through the finish
c=kid({provisional:false,rating:2250,peak:2250,age:15});atEvent(c,'worldyouth');X.joinTournament('worldyouth');tr=c.tour;
ok(tr.age===16,'fifteen on 1 January: the under-16s');
tr.standings.forEach(p=>{p.score=p.you?9:Math.min(p.score,5);});
tr.results=[];for(let i=0;i<11;i++)tr.results.push({name:'x',rating:2100,score:i<9?1:0,delta:0});
const t1=X.directTitlesFor(c,tr,T('worldyouth'),1,true,9,11);
ok(t1.indexOf('IM')>=0&&c.titles.indexOf('IM')>=0,'World U16 gold: an IM title, straight from FIDE');
c=woman({age:17,peak:2150,rating:2150});atEvent(c,'worldyouth');c.tour=null;X.joinTournament('worldyouth');tr=c.tour;
ok(tr.girls&&/Girls U18/.test(tr.name),'a girl on the women’s track plays the girls’ section ('+tr.name+')');
tr.results=[];for(let i=0;i<11;i++)tr.results.push({name:'x',rating:2000,score:1,delta:0});
tr.standings.forEach(p=>{p.score=p.you?7.5:p.score;});tr.standings.filter(p=>!p.you)[0].score=8.5;
X.directTitlesFor(c,tr,T('worldyouth'),2,false,7.5,11);
ok(c.titles.indexOf('WFM')>=0&&c.norms.some(n=>n.type==='WIM'&&n.direct),'Girls U18 silver, half a point behind: a WFM title and a WIM norm');
c.titles=[];c.norms=[];tr.standings.forEach(p=>{p.score=p.you?8.5:Math.min(p.score,8.5);});
X.directTitlesFor(c,tr,T('worldyouth'),2,false,8.5,11);
ok(c.titles.indexOf('WIM')>=0&&c.titles.indexOf('WFM')<0,'silver on the winning score is a share of first: the WIM title, which makes the WFM moot');

console.log('\n— K2 · women on the list —');
c=woman();
const W=X.buildWorld(),women=W.filter(p=>p.w);
ok(women.length>=600&&W.filter(p=>p.w&&p.real).length>=45,women.length+' women on the list, '+W.filter(p=>p.w&&p.real).length+' of them by name');
const WR=X.womenRanking(c);
ok(WR[0].name==='Hou Yifan'&&WR.slice(0,6).some(p=>p.name==='Lei Tingjie'),'Hou Yifan at the top, Lei Tingjie among the leaders');
ok(X.femSurname('RUS','Ivanov')==='Ivanova'&&X.femSurname('POL','Kowalski')==='Kowalska'&&X.femSurname('CZE','Novák')==='Nováková'&&X.femSurname('CZE','Němec')==='Němcová'&&X.femSurname('UKR','Shevchenko')==='Shevchenko',
  'surnames as women carry them: Ivanova, Kowalska, Nováková, Němcová — and Shevchenko');
const rus=WR.filter(p=>p.fed==='RUS'&&!p.real).slice(0,5).map(p=>p.name);
ok(rus.every(n=>/(ova|eva|ina|a)$/.test(n)),'the Russian women on the list: '+rus.join(', '));
ok(WR.filter(p=>p.fed==='ROU').length>=20,'every federation has its women, down to club level');
ok(WR.filter(p=>!p.real).some(p=>/^W/.test(p.title||'')),'with women’s titles');
ok(X.womenRank(c)!=null,'and you are on the women’s list (no. '+X.womenRank(c)+')');

console.log('\n— K2 · the women’s events —');
ok(woEv.every(t=>X.tourVisible(t,c)),'on the women’s track, the women’s events are on the calendar');
for(const id of ['natwch','contwch','wgrandswiss']){
  c=woman();atEvent(c,id);X.joinTournament(id);tr=c.tour;
  const ids=(tr.hall||tr.field).map(o=>o.wid).filter(Boolean),allW=ids.every(i=>W.find(p=>p.id===i&&p.w));
  ok(tr&&ids.length>=10&&allW,T(id).name+': a field of women'+(id==='natwch'?', all Romanian':'')+' ('+ids.length+')');
  if(id==='natwch')ok((tr.hall||tr.field).every(o=>o.fed==='ROU'),'…all of them Romanian');
}
c=woman();atEvent(c,'contwch');X.joinTournament('contwch');tr=c.tour;
tr.standings.forEach(p=>{p.score=p.you?9:Math.min(p.score,8);});
tr.results=[];for(let i=0;i<11;i++)tr.results.push({name:'x',rating:2200,score:i<8?1:0.5,delta:0});
X.directTitlesFor(c,tr,T('contwch'),1,true,9.5,11);
ok(c.titles.indexOf('WGM')>=0,'Continental Women’s gold: a WGM title');
c=woman();c.titles=[];atEvent(c,'contwch');X.joinTournament('contwch');while(c.tour){const t=c.tour;X._simRound(c);}
ok(c.history[0].place>10||c.wcyc.wc===c.season,'the continental’s top ten go to the Women’s World Cup');
c=woman({rating:2450,peak:2450});
ok(X.tourLocked(T('welite'),c,true)==='invite: top 10 women','the elite invitational is for the top ten women');
ok(X.KO_WOMEN.entrants===107&&X.KO_WOMEN.byes===21&&X.KO_WOMEN.size===64,'the Women’s World Cup: 107 players, 21 byes, 64 in round two');
atEvent(c,'wworldcup');
ok(X.tourLocked(T('wworldcup'),c)===null,'a 2450 woman is in the Women’s World Cup on rating');
X.joinTournament('wworldcup');tr=c.tour;
ok(tr.ko&&tr.ko.cfg==='women'&&tr.ko.entrants===107,'a 107-player bracket');
const koIds=tr.ko.slots.concat(tr.ko.byes||[]).map(o=>o.id).filter(i=>i&&i!=='__you');
ok(koIds.every(i=>W.find(p=>p.id===i&&p.w)||/^q/.test(i)),'of women');
while(c.tour)X._simRound(c);
ok([65,33,17,9,5,3,2,1].indexOf(c.history[0].place)>=0,'out in a round, placed the women’s way ('+c.history[0].place+')');

console.log('\n— K2 · the women’s cycle —');
c=woman({rating:2500,peak:2500});
ok(X.wChampion(c).name==='Ju Wenjun','Ju Wenjun is Women’s World Champion when a career begins');
ok(X.wCandidatesField(c,8).every(p=>p.name!=='Hou Yifan'&&p.name!=='Ju Wenjun'),'the Candidates are the best women who are not the champion (and not Hou Yifan, who left the cycle)');
ok(X.tourLocked(T('wcandidates'),c,true)==='no place yet','no place in the Women’s Candidates yet');
X.wcycInit(c).cand=c.season;atEvent(c,'wcandidates');
ok(X.tourLocked(T('wcandidates'),c)===null,'qualified: in');
X.joinTournament('wcandidates');tr=c.tour;
ok(tr.standings.length===8&&tr.standings.filter(p=>!p.you).every(p=>W.find(q=>q.name===p.name&&q.w)),'eight women, a double round-robin');
while(c.tour)X._simRound(c);
ok(c.wcyc.candPlayed===c.season,'a place is used by playing it');
c=woman({rating:2500,peak:2500});c.wcyc={cand:null,chall:1,champ:false,defended:null,defences:0,reigning:null,lost:null,candPlayed:null,wc:null};
atEvent(c,'wwcc');
ok(c.season%2===0&&X.tourLocked(T('wwcc'),c)===null,'the Candidates winner plays the match in the next, odd year');
X.joinTournament('wwcc');tr=c.tour;
ok(tr&&tr.field[0].name==='Ju Wenjun'&&tr.rounds===12&&tr.wm,'twelve games against Ju Wenjun, with a team of seconds');
// the world plays it when you are not in it
c=woman();c.season=1;c.weeks=14;c.day=0;X.wcycWorldTick(c);
ok(X.wxInit(c).wcands&&X.wxInit(c).wcands.season===1,'the world plays the Women’s Candidates in its week ('+X.wxInit(c).wcands.name+' wins)');
c.season=2;c.weeks=52+17;X.wcycWorldTick(c);
ok(X.wxInit(c).wwcc&&X.wxInit(c).wwcc.season===2,'and the title match the year after ('+X.wChampion(c).name+' is champion)');
c=woman();c.titles=['WGM'];
X.store.settings.rankWomen=true;
ok(/among the women on the list/.test(X.careerLeaderboard(c)),'the World tab has a women’s list');
X.store.settings.rankWomen=false;
ok(/Road to the Women’s World Championship/.test(X.careerWomenRoad(c)),'and the Progress tab the women’s road');
atEvent(c,'wolympiad');
ok(X.wOlympiadSelected(c).ok,'a 2300 Romanian woman is picked for the women’s Olympiad team');

console.log('\n✅ the junior career, direct titles and the women’s circuit: '+pass+' checks passed');
process.exit(0);
