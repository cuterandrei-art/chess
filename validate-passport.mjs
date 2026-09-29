/* The passport: where every event was, a stamp per country, the map, and
   what it all adds up to. */
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
const X=new Function(script+'\nreturn {store,app,freshCareer,lifeInit,joinTournament,_simRound,TOURNAMENTS,EVENT_WEEK,heldThisSeason,eventPlace,FED_CITY,CITY_GEO,PP_LAND,'+
  'ppKm,ppStats,ppTrips,ppLoc,careerPassportPanel,careerTabContent,ppBioLine,viewBio,worldFeds,youthDef,render};')();
const T=id=>X.TOURNAMENTS.find(t=>t.id===id);
function atWeek(c,id){const wk=X.EVENT_WEEK[id];let S=c.season||1;while(!X.heldThisSeason(id,{season:S}))S++;c.season=S;c.weeks=(S-1)*52+wk;c.day=0;c.calDone=[];return c;}
function play(c,id){atWeek(c,id);c.money=Math.max(c.money||0,50000);c.energy=100;X.joinTournament(id);if(!c.tour)throw new Error('could not join '+id);while(c.tour)X._simRound(c);return c.history[0];}

console.log('\n— every place on the calendar is on the map —');
const cities=new Set(),missing=[];
X.TOURNAMENTS.forEach(t=>{
  if(t.creator)return;
  Object.keys(X.FED_CITY).concat(['FIDE']).forEach(fed=>{
    for(let S=1;S<=3;S++){const P=X.eventPlace(t,{fed:fed,season:S});if(P.city==='your city')continue;cities.add(P.city);if(!X.CITY_GEO[P.city])missing.push(P.city+' ('+t.id+')');}
  });
});
ok(!missing.length,'every city an event can be played in has its coordinates ('+cities.size+' cities)'+(missing.length?': missing '+missing.slice(0,5).join(', '):''));
ok(Object.keys(X.FED_CITY).every(f=>X.CITY_GEO[X.FED_CITY[f]]),'and every federation’s home city');
ok(Math.abs(X.ppKm(X.CITY_GEO['London'],X.CITY_GEO['New York'])-5570)<40&&Math.abs(X.ppKm(X.CITY_GEO['Bucharest'],X.CITY_GEO['Reykjavik'])-3675)<40,'distances are great circles (London–New York '+Math.round(X.ppKm(X.CITY_GEO['London'],X.CITY_GEO['New York']))+' km)');
ok(/^M[-.0-9 ]+l[-.0-9 ]+z/.test(X.PP_LAND)&&!/[^Mlz0-9. -]/.test(X.PP_LAND)&&X.PP_LAND.length<25000,'the land is one compact path ('+Math.round(X.PP_LAND.length/1024)+' KB)');

console.log('\n— a season on the road —');
const c=X.freshCareer();Object.assign(c,{setup:true,name:'Ada Marín',fed:'ROU',flag:'🇷🇴',provisional:false,rating:2450,peak:2450,ratedGames:300,
  ratingRapid:2450,ratingBlitz:2450,age:24,money:50000,titles:['FM','IM']});
X.store.career=c;X.lifeInit(c);
const h1=play(c,'reykjavik'),h2=play(c,'dubai'),h3=play(c,'cityopen'),h4=play(c,'titledtues');
ok(h1.loc&&h1.loc.city==='Reykjavik'&&h1.loc.trip==='abroad'&&h1.loc.n>=9,'each event you play keeps where it was: Reykjavik, '+h1.loc.n+' nights away');
ok(h2.loc.city==='Dubai'&&h2.loc.far,'Dubai, a long flight');
ok(h3.loc.city==='Bucharest'&&h3.loc.trip==='local'&&!h3.loc.n,'an open in your own city costs no nights away');
ok(h4.loc.trip==='online','and an online event is played from your desk');
let st=X.ppStats(c);
ok(Object.keys(st.byCC).sort().join()==='ISL,ROU,UAE','three stamps: Romania, Iceland, the United Arab Emirates');
ok(st.flights===2&&st.km>13900&&st.km<14300,'two flights, '+st.km.toLocaleString()+' km there and back');
ok(st.online===1&&st.nights===h1.loc.n+h2.loc.n,'one event online, and '+st.nights+' nights away');
// an event from before the passport is placed where the calendar put it
delete c.history[0].loc;delete c.history[1].loc;
const guess=X.ppTrips(c).filter(t=>t.loc.guess);
ok(guess.length===2&&X.ppStats(c).byCC.ISL,'events from before the passport are placed by the calendar');

console.log('\n— on the You tab —');
X.app.careerTab='you';
let H=X.careerTabContent(c,'you');
ok(/id="passportcard"/.test(H)&&/<svg class="ppmap"/.test(H),'the You tab has the passport, with its map');
ok((H.match(/class="ppstamp"/g)||[]).length===3&&/ICELAND/.test(H),'a stamp for each country');
ok((H.match(/data-act="pppin"/g)||[]).length===3,'a pin for each city');
X.app.ppPin='Reykjavik';H=X.careerPassportPanel(c);
ok(/Reykjavik Open/.test(H)&&/nights/.test(H),'a pin tapped: what happened there');
X.app.ppZoom='europe';H=X.careerPassportPanel(c);
ok(/viewBox="153 10 78 42"/.test(H),'and the map zooms to Europe');
ok(/has played in 3 countries, flown twice to do it, as far as Reykjavik in Iceland/.test(X.ppBioLine(c,'Marín')),'the biography: '+X.ppBioLine(c,'Marín'));
// a career under the FIDE flag has no home city, and still a passport
const f=X.freshCareer();Object.assign(f,{setup:true,name:'Ivo Kern',fed:'FIDE',flag:'♟',provisional:false,rating:2450,peak:2450,ratedGames:300,ratingRapid:2450,age:24,money:50000});
X.store.career=f;X.lifeInit(f);play(f,'reykjavik');
st=X.ppStats(f);ok(st.byCC.ISL&&st.flights===0&&/passportcard/.test(X.careerPassportPanel(f)),'a career under the FIDE flag still gets its stamps');
const empty=X.freshCareer();Object.assign(empty,{setup:true,name:'New',fed:'ROU'});X.store.career=empty;X.lifeInit(empty);
ok(/Empty so far/.test(X.careerPassportPanel(empty)),'and a new career’s passport is empty until the first event');

console.log('\n✅ the passport: '+pass+' checks passed');
