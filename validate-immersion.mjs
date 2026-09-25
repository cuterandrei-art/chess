/* The tournament as a place you go to: walking into the hall before a round,
   the other boards finishing around yours, travel and where you sleep, the
   people in your life, the post-mortem with your opponent and the coach's
   homework after it. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,TOURNAMENTS,EVENT_WEEK,heldThisSeason,weekOfSeason,'+
  'playTourRound,tourRoundEnter,roundLive,roundIntroOn,viewRound,liveBoardsPanel,liveDone,liveLastGame,liveLeaders,careerResult,stopClockTick,_simRound,'+
  'viewSettings,arbiterSay,Hall,hallSoundOn,render,'+
  'eventPlace,fedRegion,travelArrive,travelAway,tripCovered,jetLagNow,JET_ELO,HOTELS,hotelNight,travelRow,travelEarly,travelHome,tripCost,conditionMod,applyCareerCondition,lifeAfterGame,tourRest,tourRestRow,'+
  'pplInit,pplOf,pplMsg,pplWeek,pplReply,pplCall,pplAttend,pplAfterEvent,pplAfterGame,pplPending,pplUnread,careerPeoplePanel,inboxItems,endOfWeek,careerTabDot,'+
  'pgStart,pgFinish,pgErrors,pgTalk,pgKind,pgLabel,pgSan,pgPieces,postMortemPanel,pmShow,PM_STYLE,winPct,'+
  'debriefFrom,debriefCheck,debriefActive,dbCount,egCount,careerDebriefCard,DB_TASK,DB_WEEKS,viewCareer};')();
const c0=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ENG',flag:'🏴',provisional:false,rating:2300,peak:2300,ratedGames:200,money:20000,energy:90},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
function atEvent(c,id){
  const wk=X.EVENT_WEEK[id];if(wk==null)return c;
  let S=c.season||1;
  while(!X.heldThisSeason(id,{season:S}))S++;
  c.season=S;c.weeks=(S-1)*52+wk;c.day=0;return c;
}

console.log('\n— J1 · walking into the hall —');
let c=c0();atEvent(c,'reykjavik');X.joinTournament('reykjavik');
let tr=c.tour;
ok(tr&&tr.standings&&tr.place&&tr.place.city==='Reykjavik','the Reykjavik Open is played in Reykjavik ('+tr.place.city+')');
X.store.settings.roundIntro=undefined;
X.tourRoundEnter();
ok(X.app.view==='round'&&X.app.roundIntro&&X.app.roundIntro.r===0,'“Play the round” goes into the hall first');
const L=tr.live;
ok(L&&L.r===0&&L.boards.filter(b=>b.you).length===1,'the round is drawn as you sit down, your board among the others');
ok(L.boards.every((b,i)=>b.no===i+1),'the boards are numbered from one');
const tops=L.boards.filter(b=>!b.bye).map(b=>b.rt);
ok(tops[0]===Math.max(...tops),'board one is the strongest pairing (all on nought)');
const others=L.boards.filter(b=>!b.you&&!b.bye);
ok(others.length>=5&&others.length===Math.floor((tr.standings.length-2)/2)&&others.every(b=>[0,0.5,1].includes(b.s)&&b.at>=20&&b.at<=116),others.length+' other boards, each with a result and the point of your game it finishes at');
let V=X.viewRound();
ok(/You walk into/.test(V)&&/Reykjavik/.test(V),'the scene: the city and the room');
const opp=tr.field[0];
ok(/You are on <b>board \d+<\/b>/.test(V),'your board number');
ok(V.includes(opp.name),'and '+opp.name+' sitting down');
ok(/Players, you may start the clocks/.test(V)&&/data-act="hallstart"/.test(V)&&/data-act="hallskip"/.test(V),'the arbiter’s line, a start button and a way to skip the scenes');
X.playTourRound();X.stopClockTick();
ok(X.app.view==='play'&&X.app.careerTour&&!X.app.roundIntro,'starting the game takes you to the board');
ok(tr.live===L,'with the same round that was drawn in the hall');

console.log('\n— J2 · the other boards —');
X.app.playMoves=[];
let P=X.liveBoardsPanel();
ok(/the other boards/.test(P)&&new RegExp('0 of '+others.length+' finished').test(P),'beside the board: the other games, none finished yet');
X.app.playMoves=new Array(60).fill({san:'e4'});
const mid=X.liveDone(tr).length;
ok(mid>0&&mid<others.length,'thirty moves in, '+mid+' have finished');
X.app.playMoves=new Array(118).fill({san:'e4'});
ok(X.liveLastGame(tr)&&/Yours is the last game still going/.test(X.liveBoardsPanel()),'and late on, yours is the last game in the hall');
const LL=X.liveLeaders(tr);
ok(LL.top>=1&&LL.ids.length>=1,'the leaders as it stands: '+LL.ids.length+' on '+LL.top);
// the result: the other boards finish as they were drawn
const before={};tr.standings.forEach(p=>before[p.id]=p.score||0);
X.app.playMoves=[];X.careerResult(1);
let exact=0,checked=0;
others.forEach(b=>{const A=tr.standings.find(p=>p.id===b.a),B=tr.standings.find(p=>p.id===b.b);checked++;if(A.score-before[b.a]===b.s&&B.score-before[b.b]===1-b.s)exact++;});
ok(checked>0&&exact===checked,'every board finished with the result you watched ('+exact+'/'+checked+')');
ok(tr.live===null&&tr.round===1,'and the live round is put away');
X.store.settings.roundIntro=false;
X.tourRoundEnter();X.stopClockTick();
ok(X.app.view==='play'&&X.app.careerTour,'with the scenes switched off, “Play the round” is straight to the board');
ok(X.roundLive(c,{ko:{},standings:[{id:'a'}],round:0,rounds:2,field:[]})===null,'a knockout has no other boards to show');
X.store.settings.roundIntro=true;

console.log('\n— J3 · the hall’s sounds and the arbiter —');
const S=X.viewSettings();
ok(/Tournament hall sounds/.test(S)&&/Arbiter’s voice/.test(S)&&/Round scenes/.test(S),'Settings: hall sounds, the arbiter’s voice and the round scenes');
X.store.settings.arbiterVoice=false;
ok(X.arbiterSay('Round 1.')===false,'the arbiter is quiet when asked to be');
X.store.settings.arbiterVoice=true;
X.Hall.start();
ok(X.Hall.on===false,'no Web Audio noise source, no murmur — and no error');
X.store.settings.hallSound=false;ok(!X.hallSoundOn(),'the hall sounds can be switched off on their own');X.store.settings.hallSound=true;

console.log('\n— J6 · travel —');
c=c0({fed:'IND',flag:'🇮🇳',money:20000,energy:90});atEvent(c,'reykjavik');X.joinTournament('reykjavik');tr=c.tour;
ok(X.fedRegion('IND')==='asia'&&tr.place.far&&tr.place.flightH>=9,'from India, Reykjavik is a long flight ('+tr.place.flightH+' hours)');
ok(c.energy===78,'which takes 12 energy out of you');
ok(c.news.some(n=>/hours in the air to Reykjavik — you land jet-lagged/.test(n.t)),'and the news says so');
ok(tr.travel&&tr.travel.jet===2&&X.jetLagNow(c),'the first two rounds are played jet-lagged');
const withJet=X.conditionMod(c);tr.travel.jet=0;const noJet=X.conditionMod(c);tr.travel.jet=2;
ok(noJet-withJet===X.JET_ELO,'jet lag costs '+X.JET_ELO+' in your condition');
X.app.careerTour=true;X.app.clock={w:100000,b:100000};X.app.playSide='w';c.form=0;c.energy=80;
X.applyCareerCondition();
ok(X.app.clock.w===90000,'and a tenth of your clock in a game you play');
ok(tr.travel.hotel==='hotel'&&!tr.travel.covered,'with money in the bank you book a hotel; an open does not pay for it');
let TR=X.travelRow(c,tr);
ok(/data-act="hotelpick" data-val="budget"/.test(TR)&&/data-act="hotelpick" data-val="players"/.test(TR)&&/Fly out a day early/.test(TR),'the travel row: three beds to choose from, and flying out early');
{const poor=c0({fed:'IND'});poor.money=900;atEvent(poor,'reykjavik');X.joinTournament('reykjavik');
 ok(poor.tour.travel.hotel==='budget','short of money, you book the hostel');X.store.career=c;}
const cost=k=>{tr.travel.hotel=k;return X.tripCost(tr,c,11).total;};
const cb=cost('budget'),ch=cost('hotel'),cp=cost('players');
ok(cb<ch&&ch<cp,'the bill follows the bed: budget '+cb+' < hotel '+ch+' < players’ hotel '+cp);
tr.travel.hotel='hotel';
const e0=c.energy,m0=c.money,w0=c.weeks*7+c.day;
X.travelEarly();
ok(tr.travel.jet===0&&tr.travel.early&&!X.jetLagNow(c),'flying out a day early: no jet lag');
ok(c.weeks*7+c.day===w0+1&&m0-c.money===X.hotelNight(c,tr,'hotel')&&c.energy===Math.min(100,e0+6),'for a day, a night’s hotel ('+X.hotelNight(c,tr,'hotel')+') and a better start');
// a night's sleep after each round
const night=k=>{tr.travel.hotel=k;c.energy=50;X.app.careerTour=true;X.app.careerRoundOpp=null;X.lifeAfterGame(0.5);return c.energy;};
ok(night('players')-night('budget')===X.HOTELS.players.rec,'the players’ hotel gives back '+X.HOTELS.players.rec+' energy a night more than a hostel');
X._simRound(c);tr.restAt=null;c.energy=60;c.tilt=30;c.mood=50;
ok(/See Reykjavik/.test(X.tourRestRow(c,tr)),'a rest day abroad can be a day out in the city');
X.tourRest('city');
ok(c.energy===70&&c.tilt===12&&c.mood===58&&c.news.some(n=>/A day off in Reykjavik/.test(n.t)),'a day out: +10 energy, −18 tilt, +8 mood, and a photo in the news');
const covered=c0({fed:'IND'});atEvent(covered,'olympiad');
ok(X.tripCovered({oly:{}})&&X.tripCovered({id:'candidates'})&&!X.tripCovered({id:'reykjavik'}),'an Olympiad or the Candidates is paid for by somebody else');
// home again
c=c0({fed:'IND',money:20000});atEvent(c,'reykjavik');X.joinTournament('reykjavik');
X.pplInit(c);
while(c.tour)X._simRound(c);
ok(c.news.some(n=>/Home from Reykjavik/.test(n.t)),'the event over, you fly home — and the news says so');
ok((c.phone||[]).length>0,'and somebody has messaged you about it');

console.log('\n— J7 · the people in your life —');
c=c0();
const ppl=X.pplInit(c);
ok(ppl.length===3&&ppl.map(p=>p.k).join()==='parent,friend,coach','a parent, a friend from the club and your first coach');
ok(/^(Mum|Dad)$/.test(ppl[0].name)&&/^Coach /.test(ppl[2].name),'called '+ppl.map(p=>p.name).join(', '));
const fr=X.pplOf(c,'friend');fr.bday=X.weekOfSeason(c);fr.bdayS=null;
X.pplWeek(c);
let bm=c.phone.find(m=>m.k==='friend'&&m.bday);
ok(bm&&bm.rep&&bm.rep.length===3,'a birthday: call, send a present, or not now');
ok(X.inboxItems(c).some(x=>x.e==='📱'&&/waiting for an answer/.test(x.t)),'it waits in the inbox');
ok(X.careerTabDot(c,'life'),'and the Life tab has a dot');
const b0=fr.bond;X.pplReply(bm.id+':0');
ok(bm.done&&fr.bond===Math.round((b0+8)*10)/10,'a call on their birthday: bond +8');
const par=X.pplOf(c,'parent');par.bday=X.weekOfSeason(c);par.bdayS=null;
X.pplWeek(c);const pm=c.phone.find(m=>m.k==='parent'&&m.bday);const pb=par.bond;
c.weeks++;X.pplWeek(c);
ok(pm.done&&pm.ans==='(no answer)'&&par.bond<pb-9,'a birthday left unanswered is a birthday forgotten (bond '+pb+' → '+par.bond+')');
const cb0=X.pplOf(c,'coach').bond;X.pplCall('coach');
ok(X.pplOf(c,'coach').bond===Math.round((cb0+5)*10)/10,'a call is free: bond +5');
X.pplCall('coach');
ok(/already called/.test(X.app.careerToast||''),'once a week');
const fan={name:'Big Event',place:{city:'Zagreb'}};const moodA=c.mood==null?62:c.mood;
X.pplAttend(c,fan,{tier:8});
ok(fan.fan&&fan.fan.k!=='coach'&&c.phone[0].t.includes('Zagreb'),'a big event: '+fan.fan.name+' books a flight to watch');
ok(c.mood===Math.min(100,moodA+5),'which lifts you');
// somebody new
c.weeks=30;c.tour={name:'Reykjavik Open',place:{trip:'abroad',city:'Reykjavik'}};c.pplMet=0;
const rnd=Math.random;Math.random=()=>0.01;X.pplWeek(c);Math.random=rnd;
const pmet=c.phone.find(m=>/asked for your number/.test(m.t));
ok(pmet,'at an event, somebody asks for your number');
c.tour=null;X.pplReply(pmet.id+':0');
const pa=X.pplOf(c,'partner');
ok(pa&&pa.bond===62,'you say yes: '+pa.name+' is your partner');
pa.bond=10;X.pplWeek(c);
ok(!X.pplOf(c,'partner')&&c.news.some(n=>/has left/.test(n.t)),'forgotten long enough, they leave');
const panel=X.careerPeoplePanel(c);
ok(/Your people/.test(panel)&&/data-act="pplcall" data-val="parent"/.test(panel),'the Life tab: your people, with a call button each');
ok(X.pplUnread(c)===0,'and reading it marks the messages read');
X.pplAfterEvent(c,{name:'Hastings'},{place:1,score:7,games:9,norms:['IM'],titles:[]});
ok(c.phone.some(m=>/We watched every round of the Hastings/.test(m.t))&&c.phone.some(m=>m.k==='coach'&&/IM norm/.test(m.t)),'win an event: your parent watched every round; a norm, and your old coach tells the club');
const wk0=c.weeks,pb2=X.pplOf(c,'parent').bond;X.endOfWeek(c);
ok(c.weeks===wk0+1&&X.pplOf(c,'parent').bond<pb2,'the week goes by, and a little of every bond with it');

console.log('\n— J4 · the post-mortem —');
// a real game: the Ruy Lopez and on, 40 plies
const g=new Chess();const sans='e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7 Nbd2 Bb7 Bc2 Re8 Nf1 Bf8 Ng3 g6 a4 c5 d5 c4 Bg5 h6 Be3 Nc5 Qd2 h5 Bg5 Be7'.split(' ');
const fens=[g.fen()],mv=[];for(const x of sans){const m=g.move(x);mv.push({san:m.san,from:m.from,to:m.to});fens.push(g.fen());}
const turn=f=>f.split(' ')[1];
// evaluations from White's side, handed to the side to move
const mkP=(white,side,score,style,clk)=>{const P={status:'run',fens:fens.slice(),moves:mv.slice(),side:side,score:score,opp:{name:'Magnus Hansen',style:style||'universal',rating:2400},clk:clk||[],ev:[],best:[],i:0,retry:0,out:null,start:fens[0]};
  for(let k=0;k<fens.length;k++){const w=white(k);P.ev[k]={t:'cp',v:turn(fens[k])==='w'?w:-w};
    const ch=new Chess(fens[k]);const lm=ch.moves({verbose:true}).find(m=>m.san!==(mv[k]&&mv[k].san));P.best[k]=lm?lm.from+lm.to:'';}
  return P;};
// you have White and throw it away on move 13 (ply 24)
let PP=mkP(k=>k<=24?30:-500,'w',0,'aggressive');
X.store.career=c0();X.pgFinish(PP);
ok(PP.status==='done'&&PP.out&&PP.out.at===24,'the moment it points at is your mistake, '+X.pgLabel(PP,24));
ok(PP.out.say[0].startsWith('13.'+sans[24]+' — that was the moment')&&/ holds\.$/.test(PP.out.say[0]),'“'+PP.out.say[0]+'”');
ok(PP.out.say[1]===X.PM_STYLE.aggressive.won,'and an attacker who won talks about the attack');
ok(PP.mine===1&&PP.theirs===0,'one mistake from you, none from them');
// they were winning and threw it away: you won
PP=mkP(k=>k<15?0:k<28?-600:700,'w',1,'solid');X.pgFinish(PP);
ok(/^I had it\. After 8\.\S+ I was sure I was winning — and then 14…\S+ threw it all away\./.test(PP.out.say[0])&&PP.out.at===27,'“'+PP.out.say[0]+'”');
ok(PP.out.say[1]===X.PM_STYLE.solid.lost,'a solid player who lost: “'+PP.out.say[1]+'”');
// a clean draw
PP=mkP(k=>(k%3)*8-8,'b',0.5,'universal');X.pgFinish(PP);
ok(PP.out.say.join(' ')==='A correct game. I kept looking for something, and there was nothing there.'&&PP.out.at==null,'a clean draw: “'+PP.out.say[0]+'”');
// you let them off: a draw you were winning (you have Black)
PP=mkP(k=>k<21?0:k<32?-700:0,'b',0.5,'grinder');X.pgFinish(PP);
ok(/^You let me off\. After 11\.\S+ you were winning — \S+ instead of 16…\S+, and I was lost\.$/.test(PP.out.say[0])&&PP.out.at===31,'“'+PP.out.say[0]+'”');
ok(PP.out.say[1]===X.PM_STYLE.grinder.drew,'a grinder, after a draw: “'+PP.out.say[1]+'”');
// a draw you should have lost
PP=mkP(k=>k<5?0:-1300,'w',0.5,'universal');X.pgFinish(PP);
ok(/^I should have won that\. After 3\.\S+ I was winning — and I let you off\.$/.test(PP.out.say[0])&&PP.out.at===4,'“'+PP.out.say[0]+'”');
// both had chances
PP=mkP(k=>k<=20?0:k<=27?-300:0,'w',0.5);X.pgFinish(PP);
ok(/^We both had our chances — 11\.\S+ from you, 14…\S+ from me\.$/.test(PP.out.say[0]),'“'+PP.out.say[0]+'”');
// what kind of mistake
PP=mkP(()=>0,'w',0.5);
ok(X.pgKind(PP,10,30,'Nf3')==='opening'&&X.pgKind(PP,30,30,'Bxf7+')==='tactics'&&X.pgKind(PP,30,12,'a4')==='strategy','in the opening, a tactic, a plan');
PP.fens[30]='8/5k2/8/3r4/8/2R5/5K2/8 w - - 0 40';
ok(X.pgKind(PP,30,12,'Kf3')==='endgame','with four pieces left: the endgame');
PP.clk=[];for(let k=0;k<40;k++)PP.clk[k]=k%2?null:(k<30?900-k*20:12);
ok(X.pgKind(PP,32,12,'a4')==='clock','with twelve seconds on the clock: the clock');
// on screen
PP=mkP(k=>k<=24?30:-500,'w',0,'aggressive');X.store.career=c0();X.pgFinish(PP);
X.app.pg=PP;X.app.playStatus='over';
let PM=X.postMortemPanel();
ok(/Post-mortem with Magnus Hansen/.test(PM)&&/Hansen:<\/b> “13\./.test(PM)&&/data-act="pmshow" data-val="24"/.test(PM),'the card: their words, and “Show me 13.'+sans[24]+'”');
X.pmShow(24);
ok(X.app.view==='analysis'&&X.app.ana&&X.app.ana.pos===24&&!X.app.ana.flip,'“Show me” opens the analysis board at that move');
X.app.playStatus='play';ok(X.postMortemPanel()==='','nothing while a game is on');
const run={status:'run',moves:mv,i:12,opp:{name:'A B'}};X.app.pg=run;X.app.playStatus='over';
ok(/You sit down together over the board/.test(X.postMortemPanel()),'while the engine goes through it: “you sit down together over the board”');

console.log('\n— J5 · the coach’s homework —');
c=c0();X.store.stats=X.store.stats||{};X.store.stats.egDone=3;
const E={wp:[],errs:[{k:60,you:true,drop:30,label:'31.Rc5',best:'Kf3',kind:'endgame'},{k:40,you:true,drop:9,label:'21.a4',best:'Nf3',kind:'strategy'},{k:61,you:false,drop:25,label:'31…Rd1',best:'Kg6',kind:null}]};
PP=mkP(()=>0,'w',0);
let DB=X.debriefFrom(c,PP,E);
ok(c.debrief&&c.debrief.k==='endgame'&&c.debrief.need===2&&c.debrief.base===3,'mostly an endgame mistake: two endgame drills');
ok(/It went wrong in the endgame — 31\.Rc5; Kf3 was the way\./.test(DB.line)&&/^Coach /.test(DB.coach.name),DB.coach.name+': “'+DB.line+'”');
ok(X.careerDebriefCard(c).includes('Win or hold 2 endgame drills')&&/0 of 2/.test(X.careerDebriefCard(c)),'on the Play tab: the homework, 0 of 2');
ok(X.inboxItems(c).some(x=>x.e==='📝'),'and in the inbox');
const again=X.debriefFrom(c,PP,{wp:[],errs:[{k:12,you:true,drop:30,label:'7.Nxe5',best:'d4',kind:'opening'}]});
ok(c.debrief.k==='endgame'&&/But first, the homework you have/.test(again.line),'a second game does not pile on more: “'+again.line.split('. ').pop()+'”');
X.app.endgame={goal:'draw'};X.app._egCounted=false;X.egCount(1);
ok(X.store.stats.egDone===3,'a lost drill is not a drill done');
X.egCount(0.5);X.egCount(0.5);
ok(X.store.stats.egDone===4,'a held draw counts, once');
X.app._egCounted=false;X.egCount(0.5);X.app.endgame=null;
const f0=c.form||0,p0=c.prep||0,cbond=X.pplOf(c,'coach').bond;
X.debriefCheck(c);
ok(c.debrief.done&&c.form===Math.min(100,f0+10)&&c.prep===p0+1,'two drills: homework done — form +10, preparation +1');
ok(X.pplOf(c,'coach').bond===Math.round((cbond+3)*10)/10&&c.news.some(n=>/that was the work/.test(n.t)),'your old coach is pleased');
ok(X.careerDebriefCard(c)==='','and the card goes');
DB=X.debriefFrom(c,PP,{wp:[],errs:[{k:30,you:true,drop:40,label:'16.Bxh6',best:'Nf3',kind:'tactics'}]});
ok(c.debrief.k==='tactics'&&c.debrief.need===10&&/The mistake that mattered was tactical: 16\.Bxh6, when Nf3 was there\./.test(DB.line),'a tactical blunder: ten puzzles');
c.weeks=c.debrief.due+1;const cb2=X.pplOf(c,'coach').bond;X.debriefCheck(c);
ok(c.debrief.lapsed&&X.pplOf(c,'coach').bond<cb2&&c.news.some(n=>/never happened/.test(n.t)),'three weeks and nothing done: it lapses, and the coach noticed');
c.coaches=[{name:'Vera Lind',spec:'Endgame guru',emoji:'♜'}];c.debrief=null;
DB=X.debriefFrom(c,PP,E);
ok(DB.coach.name==='Vera Lind'&&c.debrief.match,'with an endgame coach hired, the endgame homework is theirs');
DB=X.debriefFrom(c0(),PP,{wp:[],errs:[]});
ok(/A clean game from you/.test(DB.line),'no mistakes from you: “'+DB.line+'”');
ok(!X.store.career.debrief,'and no homework');
// the opening homework always has an opening to train, repertoire or not
c=c0();const rep0=X.store.repertoire;X.store.repertoire=[];
PP=mkP(()=>0,'b',0);PP.moves=[{san:'a4'}];
DB=X.debriefFrom(c,PP,{wp:[],errs:[{k:3,you:true,drop:30,label:'2…Qh4',best:'Nf6',kind:'opening'}]});
ok(c.debrief.k==='opening'&&c.debrief.oid&&X.careerDebriefCard(c).includes('data-act="train" data-val="'+c.debrief.oid+'"'),'an opening mistake with no repertoire: train '+c.debrief.oid+' anyway');
X.store.repertoire=rep0;
// the counters the homework reads
c=c0();X.store.puzzle=X.store.puzzle||{};
ok(X.dbCount(c,'tactics')===(X.store.puzzle.solved||0)&&X.dbCount(c,'strategy')===0,'puzzles solved and classics studied are what it counts');
// a career game against a person starts the post-mortem; under Node it stops at the handshake
c=c0();atEvent(c,'reykjavik');X.joinTournament('reykjavik');X.store.settings.roundIntro=false;X.tourRoundEnter();X.stopClockTick();
X.app.playMoves=mv.slice(0,20);X.app.playStack=fens.slice(0,21);
X.careerResult(0.5);
ok(X.app.pg&&X.app.pg.moves.length===20&&X.app.pg.status==='off'&&X.app.pg.opp.name===c.tour.results[0].name,'a finished round starts the post-mortem with '+X.app.pg.opp.name);
X.app.playStatus='over';
ok(/shakes your hand/.test(X.postMortemPanel()),'(without an engine, just the handshake)');

console.log('\n✅ the tournament day, travel, people, the post-mortem and the homework: '+pass+' checks passed');
process.exit(0);
