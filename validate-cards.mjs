/* Your own mistakes coming back as puzzles, the result cards and the
   biography. */
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
dom.window.HTMLCanvasElement.prototype.getContext=function(){return null;};   // no canvas under Node: the card says so
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,EVENT_WEEK,heldThisSeason,careerResult,stopClockTick,tourRoundEnter,'+
  'gmAdd,gmPass,gmFail,gmDue,gmCount,gmStore,gmStart,gmCard,gmFromPostMortem,GM_BOXES,GM_MAX,drillShow,drillNext,viewDrill,pgFinish,restoreBackup,inboxItems,'+
  'cardCtxSave,cardGame,cardEvent,cardCareer,cardOpen,viewCard,bioLead,viewBio,bioSur,checkTitles,pushRatingPoint,render};')();
function atEvent(c,id){const wk=X.EVENT_WEEK[id];let S=c.season||1;while(!X.heldThisSeason(id,{season:S}))S++;c.season=S;c.weeks=(S-1)*52+wk;c.day=0;return c;}
const c0=(o)=>{const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2300,peak:2300,ratedGames:200,money:20000,energy:90},o||{});X.store.career=c;X.lifeInit(c);X.app.view='career';return c;};
const g=new Chess();const sans='e4 e5 Qh5 Nc6 Qxf7+ Kxf7 Bc4+ d5 Bxd5+ Qxd5 Nc3 Qd8 Nf3 Nf6 d3 Bc5 O-O Rf8 Be3 Bxe3 fxe3 Kg8'.split(' ');
const fens=[g.fen()],mv=[];for(const x of sans){const m=g.move(x);mv.push({san:m.san,from:m.from,to:m.to});fens.push(g.fen());}

console.log('\n— K3 · your mistakes come back —');
let c=c0();X.store.gmiss={};
const item={fen:fens[4],side:'w',playedSan:'Qxf7+',playedUci:'h5f7',bestUci:'h5e2',bestSan:'Qe2',bestCp:30,playedCp:-900,lost:930,drop:48,ply:5};
const e1=X.gmAdd(item,{opp:'K. Bošnjak',event:'Reykjavik Open',label:'3.Qxf7+'});
ok(e1&&e1.box===0&&e1.cls==='blunder'&&e1.due>Date.now()+20*3600e3,'a blunder goes into the deck, due tomorrow');
ok(X.gmAdd(item,{})&&X.gmCount()===1,'the same position twice is one position');
const k=Object.keys(X.gmStore())[0];
ok(X.gmDue().length===0&&X.gmDue(Date.now()+2*86400e3).length===1,'not due today; due in a day');
let r=X.gmPass(k);ok(r.box===1&&r.due>Date.now()+2.9*86400e3,'found: up a box, back in '+X.GM_BOXES[1]+' days');
r=X.gmFail(k);ok(r.box===0&&r.wrong>=1,'missed: back to the first box');
for(let i=0;i<X.GM_BOXES.length-1;i++)X.gmPass(k);
r=X.gmPass(k);ok(r&&r.learnt&&X.gmCount()===0&&X.store.stats.gm.learnt===1,'five in a row: learnt, and gone from the deck');
for(let i=0;i<X.GM_MAX+20;i++)X.gmAdd(Object.assign({},item,{fen:fens[i%20],bestUci:'u'+i,bestSan:'a3',playedUci:'b2b3'}),{});
ok(X.gmCount()===X.GM_MAX,'the deck keeps '+X.GM_MAX+' positions at most');
X.store.gmiss={};
// from the post-mortem
const mkP=(white,side,score)=>{const P={status:'run',fens:fens.slice(),moves:mv.slice(),side:side,score:score,opp:{name:'K. Bošnjak',style:'universal',rating:2200},clk:[],ev:[],best:[],i:0,retry:0,out:null,start:fens[0]};
  for(let k=0;k<fens.length;k++){const w=white(k);P.ev[k]={t:'cp',v:fens[k].split(' ')[1]==='w'?w:-w};const ch=new Chess(fens[k]);const lm=ch.moves({verbose:true}).find(m=>m.san!==(mv[k]&&mv[k].san));P.best[k]=lm?lm.from+lm.to:'';}
  return P;};
const P=mkP(k=>k<=4?30:-900,'w',0);X.pgFinish(P);
ok(P.deckN===1&&X.gmCount()===1,'the post-mortem puts your mistake in the deck');
const E=Object.values(X.gmStore())[0];
ok(E.src.opp==='K. Bošnjak'&&E.playedSan===sans[4],'saying where it came from: '+E.src.label+' against '+E.src.opp);
ok(!X.gmCard('career'),'nothing on the career’s Play tab while nothing is due');
E.due=Date.now()-1000;
ok(/Mistakes from your games/.test(X.gmCard('puzzles'))&&/Practise \(1\)/.test(X.gmCard('career')),'due: on the Puzzles page and the Play tab');
ok(X.inboxItems(c).some(x=>x.e==='🎯'),'and in the inbox');
X.gmStart();
ok(X.app.view==='drill'&&X.app.drill.from==='deck'&&X.app.drill.items[0].gm,'“Practise” is the mistakes drill, on the deck');
ok(/From your game against K\. Bošnjak/.test(X.viewDrill()),'the position says where it came from');
X.drillShow();
ok(/comes back tomorrow/.test(X.app.drill.note)&&Object.values(X.gmStore())[0].box===0,'shown the answer: it comes back tomorrow');
const saved=JSON.stringify(X.store);X.store.gmiss={};X.restoreBackup(saved);
ok(X.gmCount()===1,'the deck is in the backup');
ok(/gmiss:d\.gmiss/.test(script),'and survives a reload');

console.log('\n— K4 · the cards —');
c=c0();atEvent(c,'reykjavik');X.store.settings.roundIntro=false;X.joinTournament('reykjavik');X.tourRoundEnter();X.stopClockTick();
X.app.playMoves=mv.slice();X.app.playStack=fens.slice();X.app.playSide='w';
const before=Math.round(c.rating);X.careerResult(0);
const G=X.cardGame();
ok(G&&G.kind==='game'&&G.res==='0–1'&&G.you==='lost'&&G.moves===11,'a game card: 0–1, lost in 11 moves');
ok(G.white.name==='Ada Marín'&&G.rating.before===before&&G.rating.after<before,'you, with White, and the rating before and after ('+G.rating.before+' → '+G.rating.after+')');
ok(G.fen===fens[22]&&G.last.to==='g8','the final position, the last move marked');
ok(/^Reykjavik Open · round 1\/9$/.test(G.title),'titled by the event and the round');
X.cardOpen('game');
ok(X.app.view==='card'&&X.app.card&&X.app.card.file==='ada-mar-n-game-card.png','the card page, and the file it saves as');
await new Promise(r=>setTimeout(r,50));
ok(X.app.card.status==='off'&&/cannot draw images/.test(X.viewCard()),'where nothing can be drawn, the page says so');
while(c.tour)X._simRound(c);
const Ev=X.cardEvent();
ok(Ev&&Ev.kind==='event'&&Ev.results.length===9&&Ev.of===20&&Ev.place>=1,'an event card: every game, the place out of twenty');
ok(Ev.sub.indexOf('April 2026')>=0,'dated in the game’s calendar ('+Ev.sub+')');
const Ca=X.cardCareer();
ok(Ca&&Ca.events===1&&Ca.games.p===9&&Ca.peak>=2300,'a career card: events, games, peak');

console.log('\n— K4 · the biography —');
const lead=X.bioLead(c);
ok(/^Ada Marín \(born 20\d\d\) is a Romanian chess player/.test(lead),'“'+lead.slice(0,90)+'…”');
ok(!/\b(he|she|his|her)\b/i.test(lead),'no pronouns guessed for you: surnames, as encyclopedias write');
ok(X.bioSur(c)==='Marín'&&X.bioSur({name:'Wang Hao',fed:'CHN'})==='Wang','the surname — first for a Chinese name');
X.app.view='bio';const B=X.viewBio();
ok(/class="bio-box"/.test(B)&&/Peak rating/.test(B)&&/Reykjavik Open/.test(B)&&/<h2>Career<\/h2>/.test(B)&&/<h2>Record<\/h2>/.test(B),'an infobox, the season’s events, a record');
c.titles=[];c.peak=2310;c.rating=2310;X.checkTitles(c);
ok(c.titleAt&&c.titleAt.FM&&c.titleAt.FM.s===c.season,'a title remembers when it came');
c.rating=2400;X.pushRatingPoint(c);
ok(c.peakAt&&c.peakAt.r===2400,'and the peak, when it was');
X.render();

console.log('\n✅ the deck, the cards and the biography: '+pass+' checks passed');
process.exit(0);
