/* Your generation — the players your age you grow up with — and the women's
   and junior events the world now plays without you. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,TOURNAMENTS,EVENT_WEEK,heldThisSeason,weekOfSeason,youthDef,'+
  'genEnsure,genPlayers,genRanking,genTypical,genWeek,genSeason,genFamous,genForEvent,careerGenPanel,bioGen,viewBio,GEN_SIZE,wpAge,wpRating,wpTitle,wpTalent,wpStrength,fedRegion,'+
  'buildWorld,worldRanking,worldById,worldWeek,worldSeason,wxInit,endOfWeek,womenRanking,wCandidatesField,wChampion,worldWomenKnockout,worldYouthEvent,'+
  'worldWomenNationals,worldOlympiad,tourLocked,careerStartAnother,careerSwitch,careerSlots,worldJuniorSection,worldYouthAgeGroup,simYouthSwiss,worldDirectTitle,maybeAssignRival,careerWorldPanel,careerTabContent,scoutCard,render,viewCareer};')();
const T=id=>X.TOURNAMENTS.find(t=>t.id===id);
function atWeek(c,id){const wk=X.EVENT_WEEK[id];let S=c.season||1;while(!X.heldThisSeason(id,{season:S}))S++;c.age=Math.floor(c.age)+(S-(c.season||1))+wk/52;c.season=S;c.weeks=(S-1)*52+wk;c.day=0;return c;}
const kid=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',age:11,junior:true,money:50,school:{grade:75,exams:null},parents:{fund:1500,left:1500,s:1}},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
const pro=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',rating:2300,peak:2300,provisional:false,ratedGames:60,age:20,money:20000},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
const median=a=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};

console.log('\n— L1 · your generation —');
let c=kid();
const G=X.genEnsure(c),P=X.genPlayers(c);
ok(G&&P.length===X.GEN_SIZE,'an eleven-year-old has a generation: '+P.length+' players');
ok(P.every(p=>Math.abs(X.wpAge(p)-11)<=1),'all born within a year of you (ages '+[...new Set(P.map(p=>X.wpAge(p)))].sort().join(', ')+')');
const I=Object.fromEntries(X.buildWorld().map(p=>[p.id,p]));
ok(P.every(p=>I[p.id]),'and every one of them is on the world list');
ok(P.filter(p=>p.fed==='ROU').length>=7&&P.filter(p=>p.fed!=='ROU'&&X.fedRegion(p.fed)==='europe').length>=5,
  'a third from your federation, a third from your continent ('+P.filter(p=>p.fed==='ROU').length+' Romanian, '+P.filter(p=>p.fed!=='ROU'&&X.fedRegion(p.fed)==='europe').length+' from elsewhere in Europe)');
const r0=P.map(p=>X.wpRating(p,'classical'));
ok(median(r0)>=1300&&median(r0)<=1700&&Math.min(...r0)>=1000,'rated the way eleven-year-olds who play the youth events are (median '+median(r0)+', '+Math.min(...r0)+'–'+Math.max(...r0)+')');
const tal=P.map(p=>X.wpTalent(p));
ok(Math.max(...tal)>=0.85&&tal.filter(t=>t>=0.5).length<=5&&tal.filter(t=>t<0).length>=5,'most will be club players, a few very good, one exceptional');
ok(P.filter(p=>p.w).length>=1&&P.filter(p=>p.w).length<=4,'on the open track, a few of them girls ('+P.filter(p=>p.w).length+')');
ok(P.every(p=>!/\d/.test(p.name))&&new Set(P.map(p=>p.name)).size===P.length,'named the way their countries name people, every name different ('+P.slice(0,3).map(p=>p.name+' '+p.flag).join(', ')+')');
// the women's track: a generation of girls
const w=kid({gender:'women'});const Pw=X.genPlayers(w,true).length?X.genPlayers(w):X.genPlayers(X.genEnsure(w)&&w);
ok(X.genPlayers(w).length===X.GEN_SIZE&&X.genPlayers(w).every(p=>p.w),'on the women’s track, a generation of girls');
// at twenty there is no generation to grow up with, only the famous names born that year
const a=pro();X.genEnsure(a);
ok(a.gen.none&&X.genPlayers(a).length===0,'a career that starts at twenty has no generation made for it');
const fam=X.genFamous(a);
ok(fam.some(p=>/Gukesh/.test(p.name)),'but knows who was born the same year ('+fam.map(p=>p.name).join(', ')+')');
ok(/Born in 2006/.test(X.careerGenPanel(a))&&/Gukesh/.test(X.careerGenPanel(a)),'and the World tab says so');

console.log('\n— L1 · you meet them, year after year —');
c=kid();X.genEnsure(c);
atWeek(c,'natyouth');X.joinTournament('natyouth');
let hall=c.tour.hall,gid=new Set(c.gen.ids);
const met1=hall.filter(o=>gid.has(o.wid));
ok(met1.length>=4&&met1.every(o=>o.fed==='ROU'&&o.age<12),'the national U12 has '+met1.length+' of your generation in it ('+met1.slice(0,3).map(o=>o.name).join(', ')+'…)');
while(c.tour)X._simRound(c);
const played=Object.keys(c.h2h||{}).filter(n=>X.genPlayers(c).some(p=>p.name===n));
c.season=2;c.weeks=52+X.EVENT_WEEK.natyouth;c.day=0;c.age=12;c.calDone=[];
X.joinTournament('natyouth');hall=c.tour.hall;
const met2=hall.filter(o=>gid.has(o.wid));
ok(met2.length>=4&&met2.filter(o=>met1.some(x=>x.wid===o.wid)).length>=3,'a year later most of the same names are back ('+met2.filter(o=>met1.some(x=>x.wid===o.wid)).length+' of '+met1.length+')');
ok(/one of your generation/.test(X.scoutCard(c,met2[0],'Next'))||/one of your generation/.test(X.scoutCard(c,{name:met2[0].name,rating:met2[0].rating,wid:met2[0].wid},'Next')),'the scouting card knows who they are');
while(c.tour)X._simRound(c);
ok(played.length>=1&&played.every(n=>c.h2h[n].w+c.h2h[n].d+c.h2h[n].l>=1),'your games against them are counted ('+played.length+' of them met in the first year)');
X.app.careerTab='world';X.app.genAll=true;
let panel=X.careerGenPanel(c);X.app.genAll=false;
ok(/Your generation/.test(panel)&&/YOU/.test(panel)&&/you \d+–\d+–\d+/.test(panel),'the World tab shows your generation, you among them, and your score against each');
ok(X.careerTabContent(c,'world').indexOf('id="gencard"')>=0,'on the World tab');

console.log('\n— L1 · they grow up —');
c=kid();X.genEnsure(c);
const star=X.genPlayers(c).slice().sort((a,b)=>X.wpTalent(b)-X.wpTalent(a))[0],sr0=X.wpRating(star,'classical'),st0=X.wpStrength(star,'classical');
const med0=median(X.genPlayers(c).map(p=>X.wpRating(p,'classical')));
const t0=Date.now();
for(let wk=0;wk<52*8;wk++)X.endOfWeek(c);
const secs=Math.round((Date.now()-t0)/1000);
const Pn=X.genPlayers(c),Pall=X.genPlayers(c,true),Xw=X.wxInit(c);
ok(c.season===9&&Math.floor(c.age)===19,'eight seasons on, you are nineteen ('+secs+'s to play them)');
const sr=X.wpRating(star,'classical');
ok(X.wpStrength(star,'classical')>=st0+600,'the most gifted of them has grown up: '+star.name+' plays '+Math.round(X.wpStrength(star,'classical')-st0)+' points better, rated '+sr0+' → '+sr+(X.wpTitle(star)?' ('+X.wpTitle(star)+')':''));
const medN=median(Pn.map(p=>X.wpRating(p,'classical')));
ok(medN>=med0+250,'and the rest with them (median '+med0+' → '+medN+')');
const quit=Pall.filter(p=>Xw.retired[p.id]);
ok(quit.length>=1&&Pn.length>=12,'some stopped playing ('+quit.length+'), most did not ('+Pn.length+')');
ok((c.news||[]).concat(c.feed||[]).some(n=>/of your generation/.test(n.t))||Object.keys(c.gen.first).some(k=>c.gen.first[k]&&!c.gen.first[k].pre),'the news followed them');
const firsts=Object.entries(c.gen.first).filter(([k,v])=>v&&!v.pre);
ok(firsts.length>=2,'and who got where first: '+firsts.slice(0,4).map(([k,v])=>k+' '+(v.you?'you':v.n)+' ('+v.a+')').join(', '));
ok((c.gen.hon||[]).length>=1,'their medals at the age-group championships are remembered ('+(c.gen.hon||[]).slice(0,2).map(h=>h.n+' '+['gold','silver','bronze'][h.pl-1]+', '+h.t).join('; ')+')');
panel=X.careerGenPanel(c);
ok(/First to get there/.test(panel)&&(!quit.length||/Stopped playing/.test(panel)),'the World tab keeps the firsts and who stopped');
const bio=X.bioGen(c,'Marín');
ok(/grew up with a generation of players born around 20\d\d/.test(bio),'and the biography has them: “'+bio.replace(/<[^>]+>/g,'').slice(0,110)+'…”');

console.log('\n— L2 · the junior events without you —');
c=pro({age:16,rating:1900,peak:1900});X.genEnsure(c);
const Xr=X.wxInit(c);Xr.results=Xr.results||[];
const busy={};
atWeek(c,'natyouth');let n0=Xr.results.length;
X.worldYouthEvent(c,T('natyouth'),busy,false);
let R=Xr.results[0];
ok(Xr.results.length===n0+1&&/National Youth Championship U18/.test(R.name)&&R.of===9,'the national U18 is played without you: '+R.winner.name+' wins on '+R.score+'/9');
ok((c.news||[]).some(n=>/Without you, at the National Youth Championship U18/.test(n.t)&&/Your generation:/.test(n.t)),'and the news says where your generation finished');
atWeek(c,'worldjunior');n0=Xr.results.length;
X.worldYouthEvent(c,T('worldjunior'),{},false);
const wj=Xr.results.slice(0,2);
ok(wj.length===2&&wj.some(r=>r.name==='World Junior Championship U20')&&wj.some(r=>r.name==='World Junior Championship Girls U20'),'the World Junior, open and girls, both played');
const wjw=X.worldById(wj.find(r=>r.name==='World Junior Championship U20').winner.id);
ok(!wjw||X.wpAge(wjw)<20,'won by somebody under twenty'+(wjw?' ('+wjw.name+', '+X.wpAge(wjw)+')':''));
// playing the open section, the girls' one still happens
atWeek(c,'worldjunior');n0=Xr.results.length;
X.worldYouthEvent(c,T('worldjunior'),{},true);
ok(Xr.results.length===n0+1&&/Girls/.test(Xr.results[0].name),'while you play the open World Junior, the girls’ section is played beside it');
// a simulated Swiss with children who are not on the list: only the list's are rated
{const kids=X.genPlayers(c).slice(0,6),before=kids.map(p=>(c.wr[p.id]||[])[3]||0);
 const E=kids.map(p=>({p:p,name:p.name,fed:p.fed,flag:p.flag,r:X.wpRating(p,'classical'),s:X.wpRating(p,'classical')}))
  .concat([1,2,3,4,5,6].map(i=>({p:null,name:'Kid '+i,fed:'ROU',flag:'',r:1700,s:1700})));
 const rows=X.simYouthSwiss(c,E,7);
 ok(rows.length===12&&Math.abs(rows.reduce((t,r)=>t+r.s,0)-42)<1e-9,'a Swiss of twelve children over seven rounds gives out 42 points');
 ok(kids.every((p,i)=>((c.wr[p.id]||[])[3]||0)===before[i]+7),'and every game counts for the ones on the list');}
// a medal and a title
{const p=X.genPlayers(c)[0];Xr.titles[p.id]='';c.wr[p.id][0]=2150;
 ok(X.worldDirectTitle(c,p,'FM')&&X.wpTitle(p)==='FM','FIDE’s table hands out titles to the world’s juniors too');
 ok(!X.worldDirectTitle(c,p,'CM')&&X.wpTitle(p)==='FM','never a lower one');
 c.wr[p.id][0]=1950;Xr.titles[p.id]='';ok(!X.worldDirectTitle(c,p,'FM'),'and only once the rating is there');}

console.log('\n— L2 · the women’s events without you —');
c=pro();const Xv=X.wxInit(c);Xv.results=Xv.results||[];
atWeek(c,'natwch');
X.worldWomenNationals(c,T('natwch'),{},false);
const wn=Xv.wnatChamps||{},wnf=Object.keys(wn);
ok(wnf.length>=20&&wnf.every(f=>X.worldById(wn[f].id)&&X.worldById(wn[f].id).w),'every federation crowns a women’s champion in May ('+wnf.length+'; Romania: '+(wn.ROU?wn.ROU.name:'—')+')');
ok(Xv.results[0].id==='natwch','and the round-up is on the World tab’s results');
atWeek(c,'wolympiad');
const nat=X.worldOlympiad(c,{},true);
ok(nat&&nat.length>=10&&nat.every(n=>n.squad.every(p=>p.w)),'the women’s Olympiad: '+nat.length+' nations of four women each');
ok(Xv.results[0].id==='wolympiad'&&/🥇/.test(Xv.results[0].note),'medals: '+Xv.results[0].note);
atWeek(c,'wworldcup');
const wc=X.worldWomenKnockout(c,{});
ok(wc&&Xv.results[0].id==='wworldcup'&&X.worldById(Xv.results[0].winner.id).w,'the Women’s World Cup is played: '+Xv.results[0].winner.name+' wins it');
ok(Xv.wqual&&Xv.wqual.ids.length===3&&Xv.wqual.ids.every(id=>X.worldById(id).w),'its top three go to the Women’s Candidates');
const winner=X.worldById(Xv.wqual.ids[0]);
ok(X.wpTitle(winner)==='GM','the winner is a grandmaster by FIDE’s rule ('+winner.name+')');
const cf=X.wCandidatesField(c,8);
ok(cf.length===8&&Xv.wqual.ids.every(id=>cf.some(p=>p.id===id)||X.wChampion(c).id===id),'and the Women’s Candidates field has them in it, the rest from the list');
// a whole season: none of it skipped any more
c=pro({age:16,rating:1900,peak:1900});
for(let i=0;i<51;i++)X.endOfWeek(c);
const ids=new Set(X.wxInit(c).results.filter(r=>r.s===1).map(r=>r.id));
const want=['natwch','wworldcup','natyouth','contyouth','worldyouth','contjunior','worldjunior'].filter(id=>X.heldThisSeason(id,{season:1}));
ok(want.every(id=>ids.has(id)),'a season without you: '+want.join(', ')+' all played');
X.app.careerTab='world';
const wp=X.careerWorldPanel(c);
ok(/Women’s World Champion/.test(wp)&&/ROU women’s champion/.test(wp)&&/(Youth|Cadets|Junior) Championship (Girls )?U\d\d/.test(wp),'and the World tab shows them with the women’s champions');
// the rival: somebody you grew up with, when one is near you
c=kid();X.genEnsure(c);c.provisional=false;c.rating=X.wpRating(X.genPlayers(c)[5],'classical');c.played=10;c.rival=null;
X.maybeAssignRival(c);
ok(c.rival&&X.genPlayers(c).some(p=>p.id===c.rival.id),'your first rival is one of your generation ('+(c.rival&&c.rival.name)+')');
ok((c.news||[]).some(n=>/known each other since you were children/.test(n.t)),'and the news says how long you have known each other');

console.log('\n— L3 · several careers, growing up together —');
{
  const A=kid({name:'Ana Popescu'});Object.assign(A,{provisional:false,rating:1520,peak:1520,ratedGames:20});X.genEnsure(A);
  const aIds=A.gen.ids.slice(),aSchool=JSON.stringify(A.school);
  await X.careerStartAnother();
  const B=X.store.career;
  ok(B!==A&&!B.setup&&X.careerSlots().length===1,'a second career is started beside the first');
  Object.assign(B,{setup:true,name:'Bea Ionescu',fed:'ROU',flag:'🇷🇴',age:11,junior:true,money:50,school:{grade:75,exams:null},parents:{fund:1500,left:1500,s:1}});
  X.lifeInit(B);X.genEnsure(B);
  ok(B.gen.ids.every(id=>aIds.indexOf(id)<0),'with a generation of its own');
  const gr=X.genRanking(B).find(x=>x.ghost);
  ok(gr&&gr.name==='Ana Popescu'&&gr.age===11,'and Ana, the other eleven-year-old career, is in Bea’s generation');
  ok(/👥/.test(X.careerGenPanel(B)),'marked as your other career on the World tab');
  atWeek(B,'natyouth');X.joinTournament('natyouth');
  const ana=B.tour.hall.find(o=>o.name==='Ana Popescu');
  ok(ana&&ana.gen,'the two of them are both at the national U12');
  while(B.tour)X._simRound(B);
  await X.careerSwitch(X.careerSlots()[0].id);
  const A2=X.store.career;
  ok(A2.name==='Ana Popescu'&&A2.junior&&JSON.stringify(A2.school)===aSchool,'back to Ana: still a junior, school as it was');
  ok(JSON.stringify(A2.gen.ids)===JSON.stringify(aIds)&&X.genPlayers(A2).length===aIds.length,'and the same generation, every one of them still on their list');
}

console.log('\n✅ your generation and the events without you: '+pass+' checks passed');
